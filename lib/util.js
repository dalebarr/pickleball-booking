'use strict';

const crypto = require('crypto');

class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

const bad = (message, status = 400, extra) => new HttpError(status, message, extra);

// ---- Dates and times -------------------------------------------------------
// Dates are plain "YYYY-MM-DD" strings in the club's own time zone.
// Times are minutes after midnight (0..1440) and "HH:MM" strings on the wire.

const TIME_RE = /^([01]\d|2[0-4]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toMin(t) {
  const m = TIME_RE.exec(String(t || ''));
  if (!m) return NaN;
  const v = Number(m[1]) * 60 + Number(m[2]);
  return v > 1440 ? NaN : v;
}

function toTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function isDate(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function addDays(s, n) {
  const d = new Date(s + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}

function weekday(s) {
  return new Date(s + 'T00:00:00Z').getUTCDay();
}

function isValidTimeZone(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Current date and minute of day in the club's time zone. */
function nowIn(tz) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

/** Minutes from "now" until a booking starts (negative once it has started). */
function minutesUntil(now, date, start) {
  return daysBetween(now.date, date) * 1440 + start - now.minutes;
}

// ---- Input validation -------------------------------------------------------

function str(v, { name, max = 200, min = 0 } = {}) {
  if (v === undefined || v === null) v = '';
  if (typeof v !== 'string' && typeof v !== 'number') throw bad(`${name} must be text`);
  v = String(v).trim();
  if (v.length < min) throw bad(min === 1 ? `${name} is required` : `${name} is too short`);
  if (v.length > max) throw bad(`${name} is too long (max ${max} characters)`);
  return v;
}

function int(v, { name, min, max }) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw bad(`${name} must be a whole number from ${min} to ${max}`);
  }
  return n;
}

function money(v, { name, min = 0, max = 1000000 }) {
  const n = Number(v);
  if (v === '' || v === null || !Number.isFinite(n) || n < min || n > max) {
    throw bad(`${name} must be an amount from ${min} to ${max}`);
  }
  return Math.round(n * 100) / 100;
}

function bool(v) {
  return v === true || v === 'true' || v === 1;
}

function email(v, { required = true } = {}) {
  v = str(v, { name: 'Email', max: 120, min: required ? 1 : 0 });
  if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw bad('Enter a valid email address');
  return v.toLowerCase();
}

function phone(v, { required = true } = {}) {
  v = str(v, { name: 'Mobile number', max: 30, min: required ? 1 : 0 });
  if (v && !/^[+()\d\s.-]{6,30}$/.test(v)) throw bad('Enter a valid mobile number (digits, spaces and + only)');
  return v;
}

function time(v, name) {
  const m = toMin(v);
  if (Number.isNaN(m)) throw bad(`${name} must be a time like 07:30`);
  return toTime(m);
}

// ---- Identifiers and passwords -----------------------------------------------

const REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function makeRef() {
  const bytes = crypto.randomBytes(6);
  let out = 'PB-';
  for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length];
  return out;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function checkPassword(password, auth) {
  if (!auth || !auth.hash || !auth.salt) return false;
  const candidate = crypto.scryptSync(String(password), auth.salt, 64);
  const stored = Buffer.from(auth.hash, 'hex');
  return stored.length === candidate.length && crypto.timingSafeEqual(stored, candidate);
}

module.exports = {
  HttpError,
  bad,
  toMin,
  toTime,
  isDate,
  addDays,
  daysBetween,
  weekday,
  isValidTimeZone,
  nowIn,
  minutesUntil,
  str,
  int,
  money,
  bool,
  email,
  phone,
  time,
  makeRef,
  hashPassword,
  checkPassword,
};
