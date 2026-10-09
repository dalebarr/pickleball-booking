'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { URL } = require('url');

const U = require('./lib/util');
const B = require('./lib/bookings');
const R = require('./lib/reports');
const { createBackend } = require('./lib/store');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const SESSION_HOURS = 12;

let state;
let backend;

// ---- Persistence helpers --------------------------------------------------------------------

function saveMeta() { backend.saveMeta(state); }
function saveBooking(b) { backend.saveBooking(state, b); }

function sweep() {
  for (const b of B.sweepExpired(state)) saveBooking(b);
}

// ---- Sessions and rate limits ------------------------------------------------------------------

// Sessions are signed cookies ("expiry.signature"), so staff stay signed in when the
// server restarts. The signature covers the password hash: changing the password
// signs everyone else out.
function sessionSecret() {
  if (!state.sessionSecret) {
    state.sessionSecret = crypto.randomBytes(32).toString('hex');
    saveMeta();
  }
  return state.sessionSecret;
}

function signSession(exp) {
  return crypto.createHmac('sha256', sessionSecret())
    .update(`${exp}.${state.auth ? state.auth.hash : ''}`)
    .digest('base64url');
}

function newSession() {
  const exp = Date.now() + SESSION_HOURS * 3600000;
  return `${exp}.${signSession(exp)}`;
}

function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function isSecure(req) {
  return req.socket.encrypted || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
}

function sessionCookie(req, token, maxAgeSeconds) {
  return [
    `pb_session=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`,
    isSecure(req) ? 'Secure' : '',
  ].filter(Boolean).join('; ');
}

function isAdmin(req) {
  if (!state.auth) return false;
  const [e, sig] = String(parseCookies(req).pb_session || '').split('.');
  const exp = Number(e);
  if (!exp || exp < Date.now() || !sig) return false;
  const good = signSession(exp);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '?';
}

const buckets = new Map(); // "name:ip" -> { count, reset }
function rateLimit(req, name, max, windowMs) {
  const key = `${name}:${clientIp(req)}`;
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.reset < now) {
    b = { count: 0, reset: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  if (b.count > max) {
    const minutes = Math.ceil((b.reset - now) / 60000);
    throw U.bad(`Too many attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`, 429);
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
  if (state) sweep();
}, 60000).unref();

// ---- HTTP plumbing --------------------------------------------------------------------------

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; " +
    "connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

function send(req, res, status, body, headers = {}) {
  let buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const h = { ...SECURITY_HEADERS, ...headers };
  if (buf.length > 1024 && /\bgzip\b/.test(req.headers['accept-encoding'] || '') && /text|json|javascript|svg|csv/.test(h['Content-Type'] || '')) {
    buf = zlib.gzipSync(buf);
    h['Content-Encoding'] = 'gzip';
    h['Vary'] = 'Accept-Encoding';
  }
  h['Content-Length'] = buf.length;
  res.writeHead(status, h);
  res.end(req.method === 'HEAD' ? undefined : buf);
}

function json(req, res, status, data, headers) {
  send(req, res, status, JSON.stringify(data), {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 200 * 1024) {
        reject(U.bad('Request is too large', 413));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        const v = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        resolve(v && typeof v === 'object' && !Array.isArray(v) ? v : {});
      } catch {
        reject(U.bad('Request body must be JSON'));
      }
    });
    req.on('error', reject);
  });
}

// ---- Routes ------------------------------------------------------------------------------------

const routes = [];
function route(method, pattern, handler, opts = {}) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  routes.push({ method, re, keys, handler, ...opts });
}

function findBooking(id) {
  const b = state.bookings.find((x) => x.id === id);
  if (!b) throw U.bad('Booking not found', 404);
  return b;
}

// Public ------------------------------------------------------------------------------------------

route('GET', '/api/health', () => ({ ok: true }));

route('GET', '/api/public/config', () => B.publicConfig(state));

route('GET', '/api/public/availability', ({ query }) => {
  if (!U.isDate(query.date)) throw U.bad('Choose a valid date');
  sweep();
  return {
    date: query.date,
    now: U.nowIn(state.settings.timezone),
    busy: B.availability(state, query.date),
  };
});

route('POST', '/api/public/bookings', ({ req, body }) => {
  rateLimit(req, 'book', 20, 3600000);
  const b = B.createPublicBooking(state, body);
  saveBooking(b);
  return B.playerView(state, b);
});

route('POST', '/api/public/lookup', ({ req, body }) => {
  rateLimit(req, 'lookup', 60, 900000);
  sweep();
  return B.playerView(state, B.findForPlayer(state, body.ref, body.email));
});

route('POST', '/api/public/cancel', ({ req, body }) => {
  rateLimit(req, 'lookup', 60, 900000);
  const b = B.playerCancel(state, B.findForPlayer(state, body.ref, body.email));
  saveBooking(b);
  return B.playerView(state, b);
});

route('POST', '/api/public/payment', ({ req, body }) => {
  rateLimit(req, 'lookup', 60, 900000);
  const b = B.playerPaymentNotice(state, B.findForPlayer(state, body.ref, body.email), body.reference);
  saveBooking(b);
  return B.playerView(state, b);
});

// Staff sign-in -------------------------------------------------------------------------------------

route('GET', '/api/admin/status', ({ req }) => ({
  setupComplete: state.setupComplete,
  needsPassword: !state.auth,
  signedIn: isAdmin(req),
}));

route('POST', '/api/admin/setup', ({ req, res, body }) => {
  if (state.auth) throw U.bad('This club is already set up. Sign in instead.', 409);
  rateLimit(req, 'login', 10, 900000);
  const password = String(body.password || '');
  if (password.length < 8) throw U.bad('Choose a password with at least 8 characters');
  const settings = B.sanitizeSettings(state, { ...state.settings, ...(body.settings || {}) });
  state.settings = settings;
  state.auth = U.hashPassword(password);
  state.setupComplete = true;
  saveMeta();
  res.setHeader('Set-Cookie', sessionCookie(req, newSession(), SESSION_HOURS * 3600));
  return { ok: true };
});

route('POST', '/api/admin/login', ({ req, res, body }) => {
  rateLimit(req, 'login', 10, 900000);
  if (!state.auth) throw U.bad('Finish club setup first', 409);
  if (!U.checkPassword(body.password || '', state.auth)) throw U.bad('That password is not right', 401);
  if (!state.setupComplete) {
    state.setupComplete = true;
    saveMeta();
  }
  res.setHeader('Set-Cookie', sessionCookie(req, newSession(), SESSION_HOURS * 3600));
  return { ok: true };
});

route('POST', '/api/admin/logout', ({ req, res }) => {
  res.setHeader('Set-Cookie', sessionCookie(req, '', 0));
  return { ok: true };
});

// Staff -----------------------------------------------------------------------------------------------

route('POST', '/api/admin/password', ({ req, res, body }) => {
  if (!U.checkPassword(body.current || '', state.auth)) throw U.bad('Your current password is not right', 401);
  const next = String(body.password || '');
  if (next.length < 8) throw U.bad('Choose a new password with at least 8 characters');
  state.auth = U.hashPassword(next);
  saveMeta();
  // Other devices are signed out; this one gets a fresh session.
  res.setHeader('Set-Cookie', sessionCookie(req, newSession(), SESSION_HOURS * 3600));
  return { ok: true };
}, { admin: true });

route('GET', '/api/admin/settings', () => ({
  settings: state.settings,
  currencies: B.CURRENCIES,
  durationChoices: B.DURATION_CHOICES,
  limits: { minCourts: B.MIN_COURTS, maxCourts: B.MAX_COURTS },
  storage: backend.describe(),
}), { admin: true });

route('PUT', '/api/admin/settings', ({ body }) => {
  state.settings = B.sanitizeSettings(state, body.settings || body);
  saveMeta();
  return { settings: state.settings };
}, { admin: true });

route('GET', '/api/admin/dashboard', () => {
  sweep();
  return R.dashboard(state);
}, { admin: true });

route('GET', '/api/admin/bookings', ({ query }) => {
  sweep();
  const f = R.parseFilters({ type: 'all', ...query });
  return { bookings: R.applyFilters(state.bookings, f), now: U.nowIn(state.settings.timezone) };
}, { admin: true });

route('POST', '/api/admin/bookings', ({ body }) => {
  const b = B.upsertStaffBooking(state, body, null);
  saveBooking(b);
  return b;
}, { admin: true });

route('PATCH', '/api/admin/bookings/:id', ({ params, body }) => {
  const b = B.upsertStaffBooking(state, body, findBooking(params.id));
  saveBooking(b);
  return b;
}, { admin: true });

route('POST', '/api/admin/bookings/:id/action', ({ params, body }) => {
  const b = B.applyAction(state, findBooking(params.id), body.action);
  saveBooking(b);
  return b;
}, { admin: true });

route('DELETE', '/api/admin/bookings/:id', ({ params }) => {
  const b = findBooking(params.id);
  if (b.type !== 'block' && b.status !== 'cancelled') {
    throw U.bad('Cancel this booking before deleting it, so it stays out of your reports by mistake');
  }
  state.bookings = state.bookings.filter((x) => x.id !== b.id);
  backend.deleteBooking(state, b.id);
  return { ok: true };
}, { admin: true });

route('GET', '/api/admin/reports', ({ query }) => {
  sweep();
  return R.report(state, query);
}, { admin: true });

route('GET', '/api/admin/reports.csv', ({ req, res, query }) => {
  const { rows, summary } = R.report(state, query);
  const name = `pickleball-report-${summary.from}-to-${summary.to}.csv`;
  send(req, res, 200, R.toCsv(state, rows), {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${name}"`,
    'Cache-Control': 'no-store',
  });
}, { admin: true, raw: true });

route('GET', '/api/admin/backup', ({ req, res }) => {
  const { auth, sessionSecret: _secret, ...data } = state;
  const name = `pickleball-backup-${U.nowIn(state.settings.timezone).date}.json`;
  send(req, res, 200, JSON.stringify(data, null, 1), {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="${name}"`,
    'Cache-Control': 'no-store',
  });
}, { admin: true, raw: true });

// ---- Static files ------------------------------------------------------------------------------------

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || !path.extname(rel)) rel = '/index.html'; // single-page app
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(req, res, 404, 'Not found', { 'Content-Type': 'text/plain' });
  fs.stat(file, (statErr, stat) => {
    if (statErr || !stat.isFile()) return send(req, res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
    // Browsers revalidate every time, so a redeploy shows up on the next page load.
    const etag = `"${stat.size.toString(36)}-${Math.floor(stat.mtimeMs).toString(36)}"`;
    const cacheHeaders = { ETag: etag, 'Cache-Control': 'no-cache' };
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, { ...SECURITY_HEADERS, ...cacheHeaders });
      return res.end();
    }
    fs.readFile(file, (err, data) => {
      if (err) return send(req, res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
      send(req, res, 200, data, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', ...cacheHeaders });
    });
  });
}

// ---- Request handler ----------------------------------------------------------------------------------

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  if (!pathname.startsWith('/api/')) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(req, res, 405, 'Method not allowed');
    return serveStatic(req, res, pathname);
  }

  try {
    const method = req.method === 'HEAD' ? 'GET' : req.method;
    let match = null;
    let r = null;
    for (const candidate of routes) {
      const m = candidate.re.exec(pathname);
      if (m && candidate.method === method) { r = candidate; match = m; break; }
    }
    if (!r) throw U.bad('Not found', 404);

    // State-changing calls must come from this app's own pages. Browsers will not
    // send this custom header cross-site without a CORS preflight, which we refuse.
    if (method !== 'GET' && req.headers['x-requested-with'] !== 'pickleball') {
      throw U.bad('Request blocked', 403);
    }
    if (r.admin && !isAdmin(req)) throw U.bad('Please sign in again', 401);

    const params = {};
    r.keys.forEach((k, i) => { params[k] = decodeURIComponent(match[i + 1]); });
    const body = method === 'GET' ? {} : await readBody(req);
    const query = Object.fromEntries(url.searchParams);
    const result = await r.handler({ req, res, params, query, body });
    if (!r.raw) json(req, res, 200, result);
  } catch (err) {
    if (err instanceof U.HttpError) {
      json(req, res, err.status, { error: err.message, ...(err.extra || {}) });
    } else {
      console.error(err);
      json(req, res, 500, { error: 'Something went wrong on the server. Please try again.' });
    }
  }
}

// ---- Start --------------------------------------------------------------------------------------------

async function start() {
  backend = createBackend({ databaseUrl: process.env.DATABASE_URL, dataDir: DATA_DIR });
  const loaded = await backend.load();
  state = B.normalizeState(loaded);
  if (!loaded) {
    if (process.env.TZ_DEFAULT && U.isValidTimeZone(process.env.TZ_DEFAULT)) state.settings.timezone = process.env.TZ_DEFAULT;
    if (backend.saveAll) await backend.saveAll(state); else saveMeta();
  }
  // ADMIN_PASSWORD sets the first staff password without the setup screen.
  // RESET_ADMIN_PASSWORD replaces a forgotten one; remove it again after signing in.
  if (!state.auth && process.env.ADMIN_PASSWORD) {
    state.auth = U.hashPassword(process.env.ADMIN_PASSWORD);
    saveMeta();
  }
  if (process.env.RESET_ADMIN_PASSWORD) {
    state.auth = U.hashPassword(process.env.RESET_ADMIN_PASSWORD);
    saveMeta();
    console.log('Staff password was reset from RESET_ADMIN_PASSWORD. Remove that setting now so it is not reused.');
  }
  sweep();

  const server = http.createServer((req, res) => {
    handle(req, res).catch((err) => {
      console.error(err);
      if (!res.headersSent) json(req, res, 500, { error: 'Server error' });
    });
  });
  server.listen(PORT, HOST, () => {
    console.log(`Pickleball booking app running on http://localhost:${PORT}`);
    console.log(`Data is stored in ${backend.describe()}`);
    if (!state.auth) console.log(`Open http://localhost:${PORT}/#/admin to set up your club.`);
  });

  const shutdown = async () => {
    server.close();
    try { await backend.close(); } catch (err) { console.error(err); }
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { start };
