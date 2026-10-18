(() => {
  'use strict';

  // =====================================================================================
  // DOM helpers
  // =====================================================================================

  const $ = (sel, root = document) => root.querySelector(sel);
  let uid = 0;

  function add(el, kids) {
    for (const k of kids.flat(Infinity)) {
      if (k === null || k === undefined || k === false || k === true) continue;
      el.append(k instanceof Node ? k : String(k));
    }
    return el;
  }

  /** Build an element. Text is always inserted as text, never parsed as HTML. */
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    let value;
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'value') value = v;
        else if (k === 'style') {
          for (const [sk, sv] of Object.entries(v)) {
            if (sk.startsWith('--')) el.style.setProperty(sk, sv);
            else el.style[sk] = sv;
          }
        } else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, String(v));
      }
    }
    add(el, kids);
    if (value !== undefined) el.value = value;
    return el;
  }

  const SVGNS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs, ...kids) {
    const el = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs || {})) if (v !== null && v !== undefined) el.setAttribute(k, v);
    return add(el, kids);
  }

  // Static, trusted icon artwork (24px grid, SF Symbols-like strokes).
  const ICONS = {
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    calPlus: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M12 12.8v5M9.5 15.3h5"/>',
    ticket: '<path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4z"/><path d="M14.5 7v1.5M14.5 11.25v1.5M14.5 15.5V17"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.75v.01"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    schedule: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M7.5 14h3M13.5 14h3M7.5 17.2h3"/>',
    chart: '<path d="M5 20v-7M10 20V5M15 20v-10M20 20v-5"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    chevron: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
    back: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
    bank: '<path d="M3.5 9.5L12 4.5l8.5 5M5 20h14M6.5 11v6M10 11v6M14 11v6M17.5 11v6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4.5 7.5l7.5 5.5 7.5-5.5"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.5 3.5 5.3 3.5 8.5s-1.1 6-3.5 8.5c-2.4-2.5-3.5-5.3-3.5-8.5s1.1-6 3.5-8.5z"/>',
    download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
    print: '<path d="M7 9V4h10v5M7 17H5.5A1.5 1.5 0 0 1 4 15.5v-5A1.5 1.5 0 0 1 5.5 9h13a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H17"/><rect x="7" y="14" width="10" height="6" rx="1"/>',
    megaphone: '<path d="M4 10v4h3l8 4.5v-13L7 10H4zM18 9.5a3.5 3.5 0 0 1 0 5"/>',
    trash: '<path d="M5 7h14M10 4h4M7 7l1 13h8l1-13M10.5 10.5v6M13.5 10.5v6"/>',
    pencil: '<path d="M5 19l1-4L16 5l3 3L9 18l-4 1zM14 7l3 3"/>',
    logout: '<path d="M14 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7M11 12h9M17 9l3 3-3 3"/>',
    people: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 6M17.5 14a5 5 0 0 1 3 5"/>',
    court: '<rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M12 6v12M9 6v12M15 6v12M3 12h6M15 12h6"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    alert: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5M12 16.25v.01"/>',
    tag: '<path d="M3.5 12.2V5A1.5 1.5 0 0 1 5 3.5h7.2a1.5 1.5 0 0 1 1.06.44l7.3 7.3a1.5 1.5 0 0 1 0 2.12l-7.2 7.2a1.5 1.5 0 0 1-2.12 0l-7.3-7.3a1.5 1.5 0 0 1-.44-1.06z"/><circle cx="8.2" cy="8.2" r="1.4"/>',
    cash: '<rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6.5 9.5v.01M17.5 14.5v.01"/>',
    undo: '<path d="M9 6.5L5 10.5l4 4"/><path d="M5 10.5h9.5a4.75 4.75 0 0 1 0 9.5H12"/>',
    checkCircle: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.3l2.7 2.7L16 9.5"/>',
    flag: '<path d="M5.5 21V4M5.5 4.5h11l-2 4 2 4h-11"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2 2M14 9l2 2"/>',
    appearance: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
    star: '<path d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.9l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z"/>',
    hall: '<path d="M3.5 10L12 4.5l8.5 5.5M5.5 10v9.5h13V10M3.5 19.5h17M10 19.5v-5h4v5"/>',
    walkin: '<circle cx="9.5" cy="7.5" r="3.2"/><path d="M3.5 19.5a6 6 0 0 1 12 0M18.5 8.5v6M15.5 11.5h6"/>',
  };
  function icon(name, cls) {
    const span = document.createElement('span');
    span.className = 'ico' + (cls ? ' ' + cls : '');
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      (ICONS[name] || '') + '</svg>';
    return span;
  }

  /** The club logo: a pickleball paddle and ball (public/icons/logo.svg). */
  const brandMark = (cls) => h('span', { class: cls }, h('img', { src: '/icons/logo.svg', alt: '' }));

  // =====================================================================================
  // Dates, times and money
  // =====================================================================================

  const toMin = (t) => {
    const [hh, mm] = String(t).split(':').map(Number);
    return hh * 60 + mm;
  };
  const toTime = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const parseDate = (d) => {
    const [y, m, dd] = d.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, dd));
  };
  const iso = (dt) => dt.toISOString().slice(0, 10);
  const addDays = (d, n) => {
    const dt = parseDate(d);
    dt.setUTCDate(dt.getUTCDate() + n);
    return iso(dt);
  };
  const addMonths = (d, n) => {
    const dt = parseDate(d);
    dt.setUTCMonth(dt.getUTCMonth() + n);
    return iso(dt);
  };
  const daysBetween = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);
  const weekdayOf = (d) => parseDate(d).getUTCDay();
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  const dfCache = new Map();
  function df(opts) {
    const key = JSON.stringify(opts);
    if (!dfCache.has(key)) dfCache.set(key, new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', ...opts }));
    return dfCache.get(key);
  }

  const fmt = {
    date: (d) => df({ weekday: 'short', month: 'short', day: 'numeric' }).format(parseDate(d)),
    dateShort: (d) => df({ month: 'short', day: 'numeric' }).format(parseDate(d)),
    dateMed: (d) => df({ month: 'short', day: 'numeric', year: 'numeric' }).format(parseDate(d)),
    dateLong: (d) => df({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(parseDate(d)),
    dateYear: (d) => df({ day: 'numeric', month: 'short', year: 'numeric' }).format(parseDate(d)),
    /** "$1,234.50": dollars with the "$" sign only, for SJV Hall payments. */
    dollars: (n) => '$' + Number(n || 0).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    dayTitle: (d) => df({ weekday: 'long', month: 'long', day: 'numeric' }).format(parseDate(d)),
    dow: (d) => df({ weekday: 'short' }).format(parseDate(d)),
    dowLong: (n) => df({ weekday: 'long' }).format(new Date(Date.UTC(2023, 0, 1 + n))),
    dayNum: (d) => String(parseDate(d).getUTCDate()),
    mon: (d) => df({ month: 'short' }).format(parseDate(d)),
    month: (k) => df({ month: 'long', year: 'numeric' }).format(parseDate(k + '-01')),
    monthShort: (k) => df({ month: 'short' }).format(parseDate(k + '-01')),
    time: (t) => {
      const m = toMin(t);
      return df({ hour: 'numeric', minute: '2-digit' }).format(new Date(Date.UTC(2000, 0, 1, Math.floor(m / 60), m % 60)));
    },
    hour: (hr) => df({ hour: 'numeric' }).format(new Date(Date.UTC(2000, 0, 1, hr))),
    range: (a, b) => `${fmt.time(a)} – ${fmt.time(b)}`,
    // Money shows just the currency sign: "$90.00", never "NZ$90.00" (see formatMoney).
    money: (n, cur) => formatMoney(n, cur),
    moneyAxis: (n, cur) => formatMoney(n, cur, { notation: 'compact', maximumFractionDigits: 1 }),
    dur: (m) => {
      if (m < 60) return `${m} min`;
      const hrs = m / 60;
      return `${hrs.toLocaleString(undefined, { maximumFractionDigits: 1 })} hr${hrs === 1 ? '' : 's'}`;
    },
    hours: (n) => n.toLocaleString(undefined, { maximumFractionDigits: 1 }),
    pct: (x) => `${Math.round((x || 0) * 100)}%`,
    num: (n) => (n || 0).toLocaleString(),
    stamp: (isoStr) =>
      isoStr ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(isoStr)) : '',
  };

  /**
   * Currency formatter that shows only the sign ("$" for NZD, not "NZ$").
   * Browsers without the short sign fall back to the standard one.
   */
  function currencyFormat(cur, extra = {}) {
    const opts = { style: 'currency', currency: cur || CFG.currency, ...extra };
    try {
      return new Intl.NumberFormat(undefined, { ...opts, currencyDisplay: 'narrowSymbol' });
    } catch {
      return new Intl.NumberFormat(undefined, opts);
    }
  }

  // Dollar currencies always show a plain "$": never "NZ$", "US$", "A$" or "NZD",
  // whatever the browser's language or age.
  const DOLLARS = new Set(['NZD', 'USD', 'AUD', 'CAD', 'SGD', 'HKD']);
  const signFor = (code, sign) => (DOLLARS.has(code) ? '$' : sign.replace(/^[A-Za-z]+(?=\$)/, ''));

  /** "$1,234.50": the amount with just the currency sign. `extra` adds Intl options (e.g. compact). */
  function formatMoney(n, cur, extra) {
    const code = cur || CFG.currency;
    try {
      return currencyFormat(code, extra).formatToParts(n || 0)
        .map((part) => (part.type === 'currency' ? signFor(code, part.value) : part.value)).join('');
    } catch {
      return `${DOLLARS.has(code) ? '$' : code + ' '}${(n || 0).toFixed(2)}`;
    }
  }

  /** The currency sign alone, for field labels: "$". */
  function currencySign(cur) {
    const code = cur || CFG.currency;
    try {
      return signFor(code, currencyFormat(code).formatToParts(0).find((part) => part.type === 'currency').value);
    } catch {
      return DOLLARS.has(code) ? '$' : code;
    }
  }

  /** Currency picker options by name, e.g. "New Zealand Dollar ($)", instead of codes. */
  function currencyOptions(codes) {
    let names = null;
    try { names = new Intl.DisplayNames(undefined, { type: 'currency' }); } catch { /* older browsers: codes */ }
    return codes.map((c) => ({ value: c, label: names ? `${names.of(c)} (${currencySign(c)})` : c }));
  }

  function dayLabel(d) {
    const diff = daysBetween(CFG.now.date, d);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    return fmt.dayTitle(d);
  }

  /** Weekdays are Monday to Thursday; weekends are Friday to Sunday. */
  const isWeekend = (d) => [0, 5, 6].includes(weekdayOf(d));
  /** Opening and closing time on a date: { open, close }. */
  const hoursFor = (d) => (isWeekend(d) ? CFG.hours.weekend : CFG.hours.weekday);
  /** "1 hr", "2.5 hrs". */
  const hrsText = (n) => fmt.dur(Math.round(n * 60));
  /** Booked hours go from 1 hour up to the session length, in half-hour steps. */
  const maxBookedHours = (date) => Math.max(1, Math.floor(sessionMinutes(date) / 30) / 2);

  /**
   * Amount due = number of players × booked hours × rate per hour.
   * A PLUS reserve (staff only) uses the PLUS reserve rate instead.
   */
  function priceFor(hours, players, plus) {
    const rate = plus ? ADMIN.plusRatePerHour : CFG.pricePerHour;
    return Math.round(players * hours * rate * 100) / 100;
  }

  /** The same sum in words, e.g. "4 players × 2 hrs × $20.00/hr". */
  function priceBreakdown(hours, players, plus) {
    const rate = plus ? ADMIN.plusRatePerHour : CFG.pricePerHour;
    return `${players} player${players === 1 ? '' : 's'} × ${hrsText(hours)} × ${fmt.money(rate)}/hr${plus ? ' (PLUS reserve)' : ''}`;
  }

  function timeOptions(from, to, step = 30) {
    const out = [];
    for (let m = from; m <= to; m += step) out.push({ value: toTime(m), label: m === 1440 ? 'Midnight' : fmt.time(toTime(m)) });
    return out;
  }

  const courtName = (n) => (CFG.courts.find((c) => c.id === n) || {}).name || `Court ${n}`;

  const STATUS = {
    pending: { label: 'Pending', c: 'orange' },
    confirmed: { label: 'Confirmed', c: 'green' },
    completed: { label: 'Checked in', c: 'blue' },
    no_show: { label: 'No-show', c: 'red' },
    cancelled: { label: 'Cancelled', c: 'gray' },
    blocked: { label: 'Blocked', c: 'indigo' },
  };
  const PAY = {
    unpaid: { label: 'Unpaid', c: 'orange' },
    submitted: { label: 'To verify', c: 'blue' },
    paid: { label: 'Paid', c: 'green' },
    refunded: { label: 'Refunded', c: 'gray' },
  };
  const METHOD = { bank: 'Bank transfer', venue: 'Pay at venue', none: '—' };
  const CURRENCIES = ['NZD', 'USD', 'PHP', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'HKD', 'JPY', 'INR', 'MYR', 'THB', 'IDR', 'AED', 'SAR', 'ZAR', 'MXN', 'BRL', 'KRW', 'CHF', 'SEK', 'NOK', 'DKK'];

  // =====================================================================================
  // Server, storage and feedback
  // =====================================================================================

  let CFG = null;
  let ADMIN = { signedIn: false, needsPassword: false };
  // Identifies this tab to the server, so live updates can tell our own changes from other people's.
  const CLIENT_ID = Math.random().toString(36).slice(2) + Date.now().toString(36);

  async function api(path, { method = 'GET', body } = {}) {
    let res;
    try {
      res = await fetch(path, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'pickleball', 'X-Client-Id': CLIENT_ID },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      const err = new Error('Could not reach the booking server. Check your internet connection and try again.');
      err.status = 0;
      throw err;
    }
    let data = null;
    try { data = await res.json(); } catch { /* empty body */ }
    if (!res.ok) {
      const err = new Error((data && data.error) || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async function loadConfig() {
    CFG = await api('/api/public/config');
    document.title = CFG.setupComplete ? `${CFG.facilityName} · Court Booking` : 'Court Booking';
  }

  /** The current date and minute of the day at the club, read from this device's clock. */
  function clubNow() {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: CFG.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      }).formatToParts(new Date());
      const get = (t) => parts.find((p) => p.type === t).value;
      return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
    } catch {
      return CFG.now;
    }
  }


  // ---- Live updates (staff screens) ------------------------------------------------------
  // The server pushes a message whenever a booking changes. The open staff screen
  // registers a refresh in live.handler; other people's new bookings also show a toast.
  // If the stream can't stay open, a slow poll keeps the screen current.

  const live = { es: null, handler: null, debounce: null, retry: null };

  const LIVE_TOASTS = {
    created: (e) => `${e.source === 'walkin' ? 'New walk-in' : 'New booking'}: ${e.name}, ${courtName(e.court)}, ${dayLabel(e.date)} at ${fmt.time(e.start)}`,
    payment: (e) => `${e.name} sent payment details (${e.ref})`,
    cancelled: (e) => `${e.name} cancelled ${e.ref}`,
  };

  function liveRefresh(event) {
    clearTimeout(live.debounce);
    live.debounce = setTimeout(() => {
      if (live.handler) Promise.resolve(live.handler(event)).catch(() => { /* next update retries */ });
    }, 300);
  }

  function liveConnect() {
    if (live.es || !('EventSource' in window)) return;
    clearTimeout(live.retry);
    const es = new EventSource('/api/admin/events');
    live.es = es;
    es.addEventListener('change', (msg) => {
      let e = {};
      try { e = JSON.parse(msg.data); } catch { return; }
      const fromOthers = e.by !== CLIENT_ID;
      if (fromOthers && e.kind === 'booking' && e.type === 'booking' && LIVE_TOASTS[e.action]) toast(LIVE_TOASTS[e.action](e));
      if (fromOthers && e.kind === 'settings') loadConfig().catch(() => {});
      liveRefresh(e);
    });
    es.onerror = () => {
      if (es.readyState !== EventSource.CLOSED) return; // the browser is reconnecting by itself
      liveDisconnect();
      live.retry = setTimeout(() => { if (location.hash.startsWith('#/admin')) liveConnect(); }, 15000);
    };
  }

  function liveDisconnect() {
    clearTimeout(live.retry);
    if (live.es) {
      live.es.close();
      live.es = null;
    }
  }

  // Catch up when the tab comes back into view, and poll if the live stream is down.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) liveRefresh({ kind: 'visible' }); });
  setInterval(() => {
    const streaming = live.es && live.es.readyState === EventSource.OPEN;
    if (!streaming && !document.hidden) liveRefresh({ kind: 'poll' });
  }, 30000);

  const prefs = {
    get(k, d) {
      try {
        const v = localStorage.getItem('pb.' + k);
        return v === null ? d : JSON.parse(v);
      } catch {
        return d;
      }
    },
    set(k, v) {
      try { localStorage.setItem('pb.' + k, JSON.stringify(v)); } catch { /* storage off */ }
    },
  };

  function applyTheme(pref) {
    if (pref === 'light' || pref === 'dark') document.documentElement.setAttribute('data-theme', pref);
    else document.documentElement.removeAttribute('data-theme');
    prefs.set('appearance', pref || 'system');
  }

  let toastTimer;
  function toast(msg, kind) {
    const el = $('#toast');
    el.replaceChildren(icon(kind === 'error' ? 'alert' : 'checkCircle'), h('span', { text: msg }));
    el.className = 'toast show' + (kind === 'error' ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast'; }, kind === 'error' ? 4200 : 2600);
  }

  function handleError(err) {
    if (err && err.status === 401 && location.hash.startsWith('#/admin')) {
      ADMIN.signedIn = false;
      toast('Please sign in again', 'error');
      go('/admin/login');
      return;
    }
    console.error(err);
    toast((err && err.message) || 'Something went wrong. Please try again.', 'error');
  }

  async function copyText(text, msg = 'Copied') {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      const ta = h('textarea', { style: { position: 'fixed', top: '0', opacity: '0' }, 'aria-hidden': 'true' });
      ta.value = text;
      document.body.append(ta);
      ta.select();
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
    }
    if (ok) toast(msg);
    else toast('Could not copy. Select the text and copy it instead.', 'error');
  }

  // =====================================================================================
  // Building blocks
  // =====================================================================================

  function page(main, { title, subtitle, left, right }) {
    const nav = h('header', { class: 'navbar' },
      h('div', { class: 'nav-left' }, left),
      h('div', { class: 'nav-title', 'aria-hidden': 'true', text: title }),
      h('div', { class: 'nav-right' }, right));
    const titleEl = h('h1', { class: 'large-title', text: title });
    const sub = h('div', { class: 'subtitle' }, subtitle);
    sub.hidden = !subtitle;
    const content = h('div', { class: 'content' }, h('div', { class: 'title-block' }, titleEl, sub));
    main.append(nav, content);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        ([e]) => nav.classList.toggle('scrolled', !e.isIntersecting && e.boundingClientRect.top < 80),
        { rootMargin: '-52px 0px 0px 0px' }
      );
      io.observe(titleEl);
    }
    return {
      content,
      nav,
      setSubtitle(...n) {
        sub.replaceChildren(...n.flat().filter(Boolean));
        sub.hidden = !sub.childNodes.length;
      },
    };
  }

  const meta = (ic, text) => h('span', null, icon(ic), text);

  function group({ title, foot, items, id, aside, big, cls }) {
    return h('section', { class: 'group' + (cls ? ' ' + cls : ''), id },
      title ? h('h2', { class: 'group-title' + (big ? ' big' : '') }, h('span', { text: title }), aside) : null,
      h('div', { class: 'list' }, items),
      foot ? (foot instanceof Node ? foot : h('p', { class: 'group-foot', text: foot })) : null);
  }

  function cell({ ic, c, title, sub, value, strong, right, onClick, href, chevron, cls, label, download, newTab }) {
    const tag = href ? 'a' : onClick ? 'button' : 'div';
    return h(tag, {
      class: ['cell', ic ? 'has-icon' : '', cls || ''].join(' ').trim(),
      type: tag === 'button' ? 'button' : null,
      href,
      download: download === undefined ? null : download,
      target: newTab ? '_blank' : null,
      rel: newTab ? 'noopener' : null,
      onclick: onClick,
      'aria-label': label,
    },
    ic ? h('span', { class: 'cell-icon', 'data-c': c || 'tint' }, icon(ic)) : null,
    h('div', { class: 'cell-main' }, h('div', { class: 'cell-title' }, title), sub ? h('div', { class: 'cell-sub' }, sub) : null),
    value !== undefined && value !== null && value !== '' ? h('div', { class: 'cell-value' + (strong ? ' strong' : '') }, value) : null,
    right || null,
    chevron ? icon('chevron', 'chev') : null);
  }

  const row = (title, value, opts = {}) => cell({ title, value, ...opts });

  function field(label, control, { stack, cls } = {}) {
    if (!control.id) control.id = 'f' + ++uid;
    return h('div', { class: `field${stack ? ' stack' : ''}${cls ? ' ' + cls : ''}` },
      label ? h('label', { for: control.id, text: label }) : null,
      control);
  }

  function select(options, value, attrs = {}) {
    const el = h('select', attrs, options.map((o) => h('option', { value: o.value, text: o.label, disabled: o.disabled || null })));
    el.value = value;
    return el;
  }

  function seg(options, value, onChange, label) {
    let cur = value;
    const el = h('div', { class: 'seg', role: 'group', 'aria-label': label });
    const btns = options.map((o) =>
      h('button', {
        type: 'button',
        'aria-pressed': String(o.value === value),
        disabled: o.disabled || null,
        text: o.label,
        onclick: () => {
          if (cur === o.value) return;
          set(o.value);
          onChange(o.value);
        },
      }));
    el.append(...btns);
    function set(v) {
      cur = v;
      options.forEach((o, i) => btns[i].setAttribute('aria-pressed', String(o.value === v)));
    }
    el.set = set;
    el.disable = (pred) => options.forEach((o, i) => { btns[i].disabled = Boolean(pred(o.value)); });
    return el;
  }

  function toggle(checked, onChange, label, id) {
    const el = h('input', { type: 'checkbox', role: 'switch', class: 'switch', 'aria-label': label, id, onchange: (e) => onChange(e.target.checked) });
    el.checked = Boolean(checked);
    return el;
  }

  function stepper({ value, min, max, step = 1, format = String, onChange, label, id }) {
    let v = value;
    const out = h('span', { class: 'stepper-value', 'aria-live': 'polite' });
    const dec = h('button', { type: 'button', id: id ? id + '-dec' : null, 'aria-label': `Decrease ${label.toLowerCase()}` }, icon('minus'));
    const inc = h('button', { type: 'button', id: id ? id + '-inc' : null, 'aria-label': `Increase ${label.toLowerCase()}` }, icon('plus'));
    const el = h('div', { class: 'stepper', role: 'group', 'aria-label': label }, dec, inc);
    const sync = () => {
      out.textContent = format(v);
      dec.disabled = v <= min;
      inc.disabled = v >= max;
    };
    dec.onclick = () => { if (v > min) { v = Math.max(min, v - step); sync(); onChange(v); } };
    inc.onclick = () => { if (v < max) { v = Math.min(max, v + step); sync(); onChange(v); } };
    sync();
    el.valueEl = out;
    el.get = () => v;
    /** Change the upper limit (e.g. a shorter session); returns the value, lowered if needed. */
    el.setMax = (m) => { max = m; if (v > max) v = max; sync(); return v; };
    return el;
  }

  const chip = (map, key) => {
    const m = map[key];
    return m ? h('span', { class: 'chip', 'data-c': m.c }, h('span', { class: 'dot' }), m.label) : null;
  };

  /** Staff-only badge for bookings made at the PLUS reserve rate. */
  const plusChip = (b) => (b.plus ? h('span', { class: 'chip', 'data-c': 'purple' }, icon('star'), 'PLUS') : null);
  /** Staff-only badge for customers booked in person at the desk. */
  const walkInChip = (b) => (b.source === 'walkin' ? h('span', { class: 'chip', 'data-c': 'teal' }, icon('walkin'), 'Walk-in') : null);
  const SOURCE_TEXT = { online: 'Booked online', staff: 'Added by staff', walkin: 'Walk-in at the desk' };

  function copyBtn(text, msg, label = 'Copy') {
    return h('button', { type: 'button', class: 'copy-btn', 'aria-label': `${label}: ${text}`, onclick: () => copyText(text, msg) }, icon('copy'), label);
  }

  function banner(ic, content, kind, extra) {
    return h('div', { class: 'banner' + (kind ? ' ' + kind : ''), role: kind === 'error' ? 'alert' : null },
      icon(ic), h('div', { class: 'banner-main' }, content, extra));
  }

  function emptyState(ic, title, text, action) {
    return h('div', { class: 'empty' }, icon(ic), h('h3', { text: title }), text ? h('p', { text }) : null, action);
  }

  const closedBanner = (date, name) => banner('flag', [h('strong', { text: `Closed for ${name}` }), h('span', { text: `The club is closed on ${fmt.dateLong(date)}. Choose another day.` })], 'warn');

  const loading = () => h('div', { class: 'loading' }, h('span', { class: 'spinner', role: 'status', 'aria-label': 'Loading' }));

  function iconBtn(ic, label, onClick) {
    return h('button', { type: 'button', class: 'icon-btn', 'aria-label': label, title: label, onclick: onClick }, icon(ic));
  }

  const plainBtn = (text, onClick, bold) => h('button', { type: 'button', class: 'btn btn-plain' + (bold ? ' bold' : ''), text, onclick: onClick });

  // ---- Sheets and alerts -------------------------------------------------------------

  const layers = [];
  const syncLock = () => document.body.classList.toggle('locked', layers.length > 0);

  function trapTab(e, root) {
    const items = [...root.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])')]
      .filter((x) => x.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === root)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openSheet({ title, wide, guard = false, onClose } = {}) {
    const prev = document.activeElement;
    const tid = 'sheet-title-' + ++uid;
    const left = h('div', { class: 'sh-left' });
    const right = h('div', { class: 'sh-right' });
    const titleEl = h('h2', { id: tid, text: title });
    const body = h('div', { class: 'sheet-body' });
    const foot = h('div', { class: 'sheet-foot' });
    foot.hidden = true;
    const el = h('div', { class: 'sheet' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': tid, tabindex: '-1' },
      h('div', { class: 'sheet-head' }, left, titleEl, right), body, foot);
    const layer = h('div', { class: 'layer' }, el);
    const s = {
      el,
      body,
      guard,
      setTitle: (t) => { titleEl.textContent = t; },
      setLeft: (...n) => left.replaceChildren(...n.filter(Boolean)),
      setRight: (...n) => right.replaceChildren(...n.filter(Boolean)),
      setBody: (...n) => {
        body.replaceChildren(...n.flat(Infinity).filter(Boolean));
        body.scrollTop = 0;
      },
      setFoot: (...n) => {
        const k = n.flat(Infinity).filter(Boolean);
        foot.replaceChildren(...k);
        foot.hidden = !k.length;
      },
      close: () => {
        if (!layer.isConnected) return;
        layer.remove();
        const i = layers.indexOf(s);
        if (i >= 0) layers.splice(i, 1);
        syncLock();
        if (onClose) onClose();
        if (prev && typeof prev.focus === 'function' && document.contains(prev)) prev.focus({ preventScroll: true });
      },
    };
    layer.addEventListener('click', (e) => { if (e.target === layer && !s.guard) s.close(); });
    layer.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        s.close();
      } else if (e.key === 'Tab') trapTab(e, el);
    });
    $('#layers').append(layer);
    layers.push(s);
    syncLock();
    requestAnimationFrame(() => el.focus({ preventScroll: true }));
    return s;
  }

  const closeLayers = () => [...layers].forEach((s) => s.close());

  function confirmDialog({ title, message, confirm = 'OK', cancel = 'Cancel', destructive }) {
    return new Promise((resolve) => {
      const prev = document.activeElement;
      const tid = 'alert-' + ++uid;
      const layer = h('div', { class: 'layer alert-layer' });
      const done = (v) => {
        layer.remove();
        if (prev && document.contains(prev)) prev.focus({ preventScroll: true });
        resolve(v);
      };
      const okBtn = h('button', { type: 'button', class: destructive ? 'destructive' : 'bold', text: confirm, onclick: () => done(true) });
      const box = h('div', { class: 'alert', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': tid, 'aria-describedby': tid + '-m' },
        h('div', { class: 'alert-body' }, h('h2', { id: tid, text: title }), message ? h('p', { id: tid + '-m', text: message }) : null),
        h('div', { class: 'alert-actions' }, h('button', { type: 'button', text: cancel, onclick: () => done(false) }), okBtn));
      layer.append(box);
      layer.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); done(false); }
        if (e.key === 'Tab') trapTab(e, box);
      });
      $('#layers').append(layer);
      okBtn.focus();
    });
  }

  // ---- Date strip and picker --------------------------------------------------------------

  /** The holiday or special closure on a date, if the club is closed then. */
  const closedOn = (d) => (CFG.closedDates || []).find((c) => c.date === d) || null;

  function dateStrip({ from, to, value, onPick }) {
    const today = CFG.now.date;
    const el = h('div', { class: 'datestrip', role: 'group', 'aria-label': 'Choose a day' });
    const btns = new Map();
    for (let d = from, i = 0; d <= to && i < 400; d = addDays(d, 1), i += 1) {
      const first = i === 0 || d.endsWith('-01');
      const closed = closedOn(d);
      const b = h('button', {
        type: 'button',
        class: 'day' + (d === today ? ' today' : '') + (d < today ? ' past' : '') + (closed ? ' closed' : ''),
        'aria-pressed': String(d === value),
        title: closed ? `Closed: ${closed.name}` : null,
        'aria-label': (d === today ? 'Today, ' : '') + fmt.dateLong(d) + (closed ? `, closed for ${closed.name}` : ''),
        onclick: () => { set(d); onPick(d); },
      }, h('span', { class: 'mon', text: first ? fmt.mon(d) : '' }), h('span', { class: 'dow', text: fmt.dow(d) }), h('span', { class: 'dnum', text: fmt.dayNum(d) }));
      btns.set(d, b);
      el.append(b);
    }
    function set(d, instant) {
      for (const [k, b] of btns) b.setAttribute('aria-pressed', String(k === d));
      const b = btns.get(d);
      if (b) {
        requestAnimationFrame(() => {
          const left = b.offsetLeft - el.clientWidth / 2 + b.offsetWidth / 2;
          el.scrollTo({ left, behavior: instant ? 'auto' : 'smooth' });
        });
      }
    }
    el.set = set;
    set(value, true);
    return el;
  }

  function datePicker({ value, min, max, onPick }) {
    const input = h('input', { type: 'date', 'aria-label': 'Pick a date', min, max, value });
    input.addEventListener('change', () => { if (input.value) onPick(input.value); });
    input.addEventListener('click', () => { try { input.showPicker(); } catch { /* not supported */ } });
    const el = h('label', { class: 'date-pick' }, icon('calendar'), h('span', { text: 'Pick date' }), input);
    el.set = (v) => { input.value = v; };
    return el;
  }

  // ---- Courts for a day -----------------------------------------------------------------------
  // Bookings are for a date and a court and cover the whole session: opening to
  // closing time from Settings. There are no time slots or booking lengths.

  const isBlockItem = (b) => b.kind === 'blocked' || b.type === 'block';
  // Weekdays (Monday–Thursday) and weekends (Friday–Sunday) have their own hours.
  function sessionMinutes(date) {
    const { open, close } = hoursFor(date);
    return toMin(close) - toMin(open);
  }
  const sessionRange = (date) => fmt.range(hoursFor(date).open, hoursFor(date).close);
  const sessionText = (date) => `${sessionRange(date)} (${fmt.dur(sessionMinutes(date))})`;
  /** True until closing time on `date` (a session that hasn't ended can still be booked). */
  const sessionOpen = (date, now = clubNow()) => date > now.date || (date === now.date && now.minutes < toMin(hoursFor(date).close));
  /** Weekday and weekend hours in words, e.g. ["Mon–Thu 7:00 AM – 10:00 PM", "Fri–Sun ..."]. */
  function hoursLines() {
    const { weekday: wd, weekend: we } = CFG.hours;
    if (wd.open === we.open && wd.close === we.close) return [`Daily ${fmt.range(wd.open, wd.close)}`];
    return [`Mon–Thu ${fmt.range(wd.open, wd.close)}`, `Fri–Sun ${fmt.range(we.open, we.close)}`];
  }
  const playersText = () => (CFG.minPlayers === CFG.maxPlayers ? `${CFG.maxPlayers} players` : `${CFG.minPlayers}–${CFG.maxPlayers} players`);

  /** Bookings and players already on a court: { bookings, players } (blocked time not counted). */
  function bookedOn(items) {
    const booked = items.filter((b) => !isBlockItem(b));
    return { bookings: booked.length, players: booked.reduce((n, b) => n + (b.players || 0), 0) };
  }
  /** "6 players booked · 2 bookings" */
  const playersBookedText = (players, bookings) =>
    `${players} player${players === 1 ? '' : 's'} booked · ${bookings} booking${bookings === 1 ? '' : 's'}`;

  /**
   * One row per court for a date, for players (online) and walk-ins.
   * Bookings don't lock a court: a court that is already booked stays bookable and
   * the bookings share it. Online bookings need a session that hasn't ended;
   * walk-ins may use past dates. Blocked courts and closed dates are never selectable.
   */
  function courtDayList({ date, now, busy, walkIn, closedName, onPick }) {
    const over = !sessionOpen(date, now);
    const items = CFG.courts.map((c) => {
      const onCourt = busy.filter((b) => b.court === c.id);
      const blocked = onCourt.some(isBlockItem);
      const { bookings: booked, players } = bookedOn(onCourt);
      let status;
      let tag = null;
      let available = false;
      if (closedName) { status = `Closed for ${closedName}`; tag = 'Closed'; }
      else if (blocked) { status = 'Not available: blocked by the club'; tag = 'Unavailable'; }
      else if (over && !walkIn) { status = 'Today’s session has ended'; tag = 'Ended'; }
      else {
        available = true;
        status = ['Available', over ? 'this date has passed' : null].filter(Boolean).join(' · ');
      }
      const action = walkIn ? 'Add Walk-in' : 'Book';
      // Players already booked on this court for the date (the court is shared).
      const bookedText = booked ? playersBookedText(players, booked) : '';
      return cell({
        ic: 'court', c: !available ? 'gray' : booked ? 'orange' : 'tint',
        title: c.name,
        sub: booked
          ? h('span', { style: { display: 'grid', gap: '6px', justifyItems: 'start' } },
            h('span', { text: `${status} · ${sessionRange(date)}` }),
            h('span', { class: 'chip', 'data-c': 'orange' }, icon('people'), bookedText))
          : `${status} · ${sessionRange(date)}`,
        right: available
          ? h('span', { class: 'btn btn-sm btn-filled', 'aria-hidden': 'true' }, action)
          : h('span', { class: 'chip', 'data-c': 'gray' }, h('span', { class: 'dot' }), tag),
        onClick: available ? () => onPick(c.id) : null,
        label: available ? `${c.name}: ${status}${booked ? `, ${bookedText}` : ''}. ${action}` : null,
      });
    });
    return group({ title: 'Courts', items });
  }

  /** Staff schedule for a date: one card per court with its bookings. */
  function staffCourtDay({ date, now, bookings, closedName, onAdd, onChanged }) {
    const canAdd = !closedName && sessionOpen(date, now);
    return h('div', { class: 'stack' }, CFG.courts.map((c) => {
      const onCourt = bookings.filter((b) => b.court === c.id).sort((a, b) => (a.start + a.ref).localeCompare(b.start + b.ref));
      const active = onCourt.filter((b) => b.status !== 'cancelled');
      const blocked = active.some(isBlockItem);
      const tag = closedName ? ['Closed', 'gray'] : blocked ? ['Blocked', 'indigo'] : active.length ? [`${active.length} booking${active.length === 1 ? '' : 's'}`, 'orange'] : ['Available', 'green'];
      const items = onCourt.map((b) => staffBookingCell(b, { onChanged }));
      if (canAdd && !blocked) {
        items.push(cell({ ic: 'plus', title: 'New Booking', sub: `Whole session, ${sessionText(date)}`, cls: 'tint', onClick: () => onAdd(c.id) }));
      }
      if (!items.length) items.push(cell({ title: closedName ? `Closed for ${closedName}` : 'No bookings', sub: closedName ? null : 'This session has ended.' }));
      return group({
        title: c.name,
        aside: h('span', { class: 'chip', 'data-c': tag[1] }, h('span', { class: 'dot' }), tag[0]),
        items,
      });
    }));
  }

  // ---- Charts ---------------------------------------------------------------------------------

  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }

  function ticksFor(max, integer) {
    if (!(max > 0)) return [0, integer ? 1 : 10];
    let step = niceStep(max / 4);
    if (integer) step = Math.max(1, Math.ceil(step));
    const top = Math.ceil(max / step) * step;
    const out = [];
    for (let v = 0; v <= top + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
    return out;
  }

  /** Single-series column chart with hover tooltips and a screen-reader table. */
  function barChart({ points, value, label, tipTitle, fmtValue, fmtAxis, highlight, integer, height = 210, title, endLabel }) {
    const wrap = h('div', { class: 'chart', style: { height: height + 'px' } });
    const tip = h('div', { class: 'chart-tip' });
    tip.hidden = true;
    let lastW = 0;
    function draw() {
      const W = Math.floor(wrap.clientWidth);
      if (!W || W === lastW) return;
      lastW = W;
      const H = height;
      const vals = points.map(value);
      const ticks = ticksFor(Math.max(0, ...vals), integer);
      const top = ticks[ticks.length - 1];
      const tickLabels = ticks.map(fmtAxis);
      const m = { l: Math.max(26, Math.max(...tickLabels.map((s) => s.length)) * 6.4 + 12), r: 6, t: 18, b: 24 };
      const pw = W - m.l - m.r;
      const ph = H - m.t - m.b;
      const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, 'aria-hidden': 'true' });
      ticks.forEach((t, i) => {
        const y = Math.round(m.t + ph - (t / top) * ph) + 0.5;
        svg.append(sv('line', { x1: m.l, x2: W - m.r, y1: y, y2: y, class: i === 0 ? 'baseline' : 'grid' }));
        svg.append(sv('text', { x: m.l - 8, y: y + 4, 'text-anchor': 'end' }, tickLabels[i]));
      });
      const n = points.length;
      const band = pw / n;
      const bw = Math.max(3, Math.min(24, band * 0.66 - 2));
      const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(pw / 54))));
      const bars = [];
      const base = m.t + ph;
      points.forEach((p, i) => {
        const v = vals[i];
        const cx = m.l + band * i + band / 2;
        const bh = top ? (v / top) * ph : 0;
        const y = base - bh;
        let bar = null;
        if (bh > 0.5) {
          const r = Math.min(4, bh, bw / 2);
          const x0 = cx - bw / 2;
          const x1 = cx + bw / 2;
          bar = sv('path', {
            d: `M${x0},${base} V${y + r} Q${x0},${y} ${x0 + r},${y} H${x1 - r} Q${x1},${y} ${x1},${y + r} V${base} Z`,
            class: 'bar' + (highlight && !highlight(p, i) ? ' muted' : ''),
          });
          svg.append(bar);
        }
        bars.push(bar);
        if ((n - 1 - i) % every === 0) svg.append(sv('text', { x: cx, y: H - 6, 'text-anchor': 'middle' }, label(p, i)));
        if (endLabel && i === n - 1) svg.append(sv('text', { x: cx, y: y - 6, 'text-anchor': 'middle', class: 'endlabel' }, fmtValue(v)));
      });
      const hide = () => {
        tip.hidden = true;
        bars.forEach((b) => b && b.classList.remove('on'));
      };
      points.forEach((p, i) => {
        const hit = sv('rect', { x: m.l + band * i, y: m.t, width: band, height: ph, class: 'hit' });
        hit.addEventListener('pointerenter', () => {
          bars.forEach((b, j) => b && b.classList.toggle('on', j === i));
          const v = vals[i];
          const cx = m.l + band * i + band / 2;
          tip.replaceChildren(h('b', { text: tipTitle(p) }), fmtValue(v));
          tip.hidden = false;
          tip.style.left = clamp(cx, 70, W - 70) + 'px';
          tip.style.top = (base - (top ? (v / top) * ph : 0)) + 'px';
        });
        hit.addEventListener('pointerleave', hide);
        svg.append(hit);
      });
      wrap.replaceChildren(svg, tip);
    }
    if ('ResizeObserver' in window) new ResizeObserver(() => draw()).observe(wrap);
    else setTimeout(draw, 0);
    const table = h('table', { class: 'sr-only' },
      h('caption', { text: title }),
      h('tbody', null, points.map((p) => h('tr', null, h('th', { text: tipTitle(p) }), h('td', { text: fmtValue(value(p)) })))));
    return h('div', null, wrap, table);
  }

  function hbars(items) {
    const max = Math.max(0, ...items.map((x) => x.v));
    return h('div', { class: 'hbars' }, items.map((x) =>
      h('div', { class: 'hbar' },
        h('span', { class: 'k', text: x.k }),
        h('span', { class: 'track' }, h('span', { class: x.v ? '' : 'zero', style: { width: max ? `${(x.v / max) * 100}%` : '0' } })),
        h('span', { class: 'v', text: x.label || String(x.v) }))));
  }

  // =====================================================================================
  // Shell and router
  // =====================================================================================

  const ROUTES = {
    '/book': { view: viewBook, area: 'public' },
    '/my': { view: viewMy, area: 'public' },
    '/info': { view: viewInfo, area: 'public' },
    '/admin': { view: viewDashboard, area: 'admin' },
    '/admin/schedule': { view: viewSchedule, area: 'admin' },
    '/admin/walkin': { view: viewWalkIn, area: 'admin' },
    '/admin/reports': { view: viewReports, area: 'admin' },
    '/admin/settings': { view: viewSettings, area: 'admin' },
    '/admin/login': { view: viewLogin, area: 'auth' },
    '/admin/setup': { view: viewSetup, area: 'auth' },
  };
  const NAV = {
    public: [['/book', 'Book', 'calendar'], ['/my', 'My Bookings', 'ticket'], ['/info', 'Club Info', 'info']],
    admin: [['/admin', 'Dashboard', 'grid'], ['/admin/schedule', 'Schedule', 'schedule'], ['/admin/walkin', 'Walk-in', 'walkin'], ['/admin/reports', 'Reports', 'chart'], ['/admin/settings', 'Settings', 'sliders']],
  };

  function shell(area, path) {
    const items = NAV[area === 'admin' ? 'admin' : 'public'];
    const link = (p, label, ic, cls) => h('a', { class: cls, href: '#' + p, 'aria-current': p === path ? 'page' : null }, icon(ic), h('span', { text: label }));
    $('#tabbar').replaceChildren(...items.map(([p, l, ic]) => link(p, l, ic, 'tab')));
    const name = CFG && CFG.setupComplete ? CFG.facilityName : 'Court Booking';
    const foot = area === 'admin'
      ? [link('/book', 'Booking site', 'globe', 'side-link'),
        h('button', { type: 'button', class: 'side-link', onclick: signOut }, icon('logout'), h('span', { text: 'Sign out' }))]
      : [link('/admin', 'Staff sign in', 'lock', 'side-link')];
    $('#sidebar').replaceChildren(
      h('div', { class: 'brand' }, brandMark('brand-mark'), h('div', null, h('div', { class: 'brand-name', text: name }), h('div', { class: 'brand-sub', text: area === 'admin' ? 'Staff' : 'Court booking' }))),
      h('div', { class: 'side-label', text: area === 'admin' ? 'Manage' : 'Play' }),
      ...items.map(([p, l, ic]) => link(p, l, ic, 'side-link')),
      h('div', { class: 'side-foot' }, foot));
  }

  async function signOut() {
    try { await api('/api/admin/logout', { method: 'POST' }); } catch { /* signed out anyway */ }
    ADMIN.signedIn = false;
    toast('Signed out');
    go('/book');
  }

  const routePath = () => (location.hash.replace(/^#/, '') || '/book').split('?')[0];
  function go(p) {
    if (location.hash === '#' + p) render();
    else location.hash = p;
  }

  let renderSeq = 0;
  let currentPath = null;
  let leaveGuard = null;
  let firstRender = true;

  async function render() {
    const seq = ++renderSeq;
    let path = routePath();
    if (!ROUTES[path]) path = '/book';
    const def = ROUTES[path];
    closeLayers();
    leaveGuard = null;
    window.onbeforeunload = null;
    try {
      await loadConfig();
      // Also on public pages: signed-in staff get staff-only options (PLUS reserve) there.
      ADMIN = await api('/api/admin/status');
    } catch (err) {
      if (seq !== renderSeq) return;
      $('#main').replaceChildren(h('div', { class: 'content' }, emptyState('alert', 'Can’t reach the booking server', err.message,
        h('button', { type: 'button', class: 'btn btn-tinted', text: 'Try Again', onclick: render }))));
      return;
    }
    if (seq !== renderSeq) return;
    if (def.area === 'admin') {
      if (ADMIN.needsPassword) return go('/admin/setup');
      if (!ADMIN.signedIn) return go('/admin/login');
    }
    if (path === '/admin/setup' && !ADMIN.needsPassword) return go(ADMIN.signedIn ? '/admin' : '/admin/login');
    if (path === '/admin/login') {
      if (ADMIN.needsPassword) return go('/admin/setup');
      if (ADMIN.signedIn) return go('/admin');
    }
    currentPath = path;
    live.handler = null;
    if (def.area === 'admin') liveConnect();
    else liveDisconnect();
    shell(def.area, path);
    const main = $('#main');
    main.replaceChildren();
    window.scrollTo(0, 0);
    if (!firstRender) main.focus({ preventScroll: true });
    firstRender = false;
    try {
      await def.view(main);
    } catch (err) {
      handleError(err);
    }
  }

  window.addEventListener('hashchange', async () => {
    if (leaveGuard) {
      const ok = await leaveGuard();
      if (!ok) {
        history.replaceState(null, '', '#' + currentPath);
        return;
      }
    }
    render();
  });

  // =====================================================================================
  // Player: Book
  // =====================================================================================

  const bookDates = { online: null, walkin: null };

  // Declared as functions (hoisted) because the route table above refers to them.
  function viewBook(main) { return courtBookingPage(main, { walkIn: false }); }
  function viewWalkIn(main) { return courtBookingPage(main, { walkIn: true }); }

  /**
   * The court grid for booking. Players use it online; signed-in staff use the
   * walk-in version for customers at the desk (same rules and fields).
   */
  async function courtBookingPage(main, { walkIn }) {
    const pg = page(main, { title: walkIn ? 'Walk-in' : 'Book a Court' });
    if (!CFG.setupComplete) {
      pg.content.append(emptyState('calendar', 'Online booking opens soon', 'This club is still setting up its courts. Please check back shortly.'));
      return;
    }
    pg.setSubtitle(
      walkIn ? meta('walkin', 'Book a court for a customer at the desk') : null,
      ...hoursLines().map((x) => meta('clock', x)),
      meta('court', `${CFG.courts.length} court${CFG.courts.length > 1 ? 's' : ''}`),
      meta('tag', `${fmt.money(CFG.pricePerHour)} per player per hour`));
    if (CFG.announcement && !walkIn) pg.content.append(banner('megaphone', CFG.announcement));

    const key = walkIn ? 'walkin' : 'online';
    const today = CFG.now.date;
    // Players book within the booking window. Signed-in staff on this page may pick
    // any date from today onwards. Walk-ins may be recorded for any date, past or future.
    const anyDate = walkIn || ADMIN.signedIn;
    const first = walkIn ? null : today;
    const last = anyDate ? null : addDays(today, CFG.advanceDays);
    const inRange = (d) => Boolean(d) && (!first || d >= first) && (!last || d <= last);
    if (!inRange(bookDates[key])) bookDates[key] = today;
    const pick = (d) => { if (inRange(d)) { bookDates[key] = d; load(); } };

    const title = h('h2', { class: 'datebar-title' });
    const strip = dateStrip({
      from: walkIn ? addDays(today, -60) : today,
      to: addDays(today, anyDate ? 120 : Math.min(CFG.advanceDays, 90)),
      value: bookDates[key],
      onPick: pick,
    });
    const picker = datePicker({ value: bookDates[key], min: first, max: last, onPick: pick });
    const courtsBox = h('div', { class: 'stack', style: { gap: '12px' } }, loading());
    const footNote = h('p', { class: 'group-foot', style: { padding: '0 4px' } });
    const setFoot = (date) => {
      footNote.textContent = walkIn
        ? `Pick a date, then a court, to add a walk-in. Any date, past or future, can be chosen with the date strip or Pick date. ` +
          `A booked court can be shared. Walk-ins aren’t limited to ${playersText()}. ` +
          `Amount due = number of players × booked hours × ${fmt.money(CFG.pricePerHour)} per hour.`
        : `Pick a date, then a court. The court is yours for the session, ${sessionText(date)}, for ${playersText()} per court. ` +
          `Amount due = number of players × booked hours × ${fmt.money(CFG.pricePerHour)} per hour.` +
          (anyDate ? ' Signed in as staff: you can book any date from today onwards.' : '');
    };
    pg.content.append(
      h('section', { class: 'datebar', 'aria-label': 'Date' }, h('div', { class: 'datebar-row' }, title, picker), strip),
      courtsBox,
      footNote);

    let reqId = 0;
    async function load(quiet) {
      const id = ++reqId;
      const date = bookDates[key];
      title.textContent = dayLabel(date);
      strip.set(date);
      picker.set(date);
      setFoot(date);
      if (!quiet) courtsBox.replaceChildren(loading());
      try {
        const av = await api(`/api/public/availability?date=${date}`);
        if (id !== reqId) return;
        courtsBox.replaceChildren(...[
          av.closed ? closedBanner(date, av.closed) : null,
          courtDayList({
            date, now: av.now, busy: av.busy, walkIn, closedName: av.closed,
            onPick: (court) => openBookSheet({ date, court, busy: av.busy, walkIn, onBooked: () => load(true) }),
          }),
        ].filter(Boolean));
      } catch (err) {
        if (id !== reqId) return;
        if (err.status === 401) return handleError(err);
        courtsBox.replaceChildren(emptyState('alert', 'Couldn’t load courts', err.message, h('button', { type: 'button', class: 'btn btn-tinted', text: 'Try Again', onclick: () => load() })));
      }
    }
    await load();
    if (walkIn) live.handler = () => load(true); // show other people's bookings straight away
    const timer = setInterval(() => {
      if (!courtsBox.isConnected) return clearInterval(timer);
      if (!document.hidden && !layers.length) load(true);
    }, 60000);
  }

  /** Book a court for the whole session on a date: online, or as a walk-in (staff). */
  function openBookSheet({ date, court, busy, onBooked, walkIn = false }) {
    const maxHours = maxBookedHours(date);
    const staff = ADMIN.signedIn; // staff booking for a customer: PLUS reserve is available
    // Staff book for customers, so the form never fills in details saved on this device.
    const saved = staff ? {} : prefs.get('player', {});
    const onCourt = (c) => busy.filter((b) => b.court === c);
    // Bookings don't lock a court; only blocked courts can't be chosen.
    const usable = (c) => !onCourt(c).some(isBlockItem);
    // Players: online bookings need minPlayers–maxPlayers; walk-ins aren't limited.
    const minP = walkIn ? 1 : CFG.minPlayers;
    const maxP = walkIn ? 12 : CFG.maxPlayers;
    const methods = [];
    if (walkIn) {
      methods.push({ value: 'venue', label: 'Pay at desk' });
      if (CFG.payment.bankTransfer) methods.push({ value: 'bank', label: 'Bank transfer' });
    } else {
      if (CFG.payment.bankTransfer) methods.push({ value: 'bank', label: 'Bank transfer' });
      if (CFG.payment.payAtVenue) methods.push({ value: 'venue', label: 'Pay at venue' });
    }
    const S = {
      court,
      method: methods[0] ? methods[0].value : 'venue',
      players: clamp(saved.players || (walkIn ? 4 : CFG.minPlayers), minP, maxP),
      hours: clamp(saved.hours || 1, 1, maxHours),
      plus: false,
      paid: walkIn, // walk-ins usually pay at the desk straight away
    };
    const who = walkIn ? 'the customer’s' : 'your';

    const sh = openSheet({ title: walkIn ? 'Walk-in Booking' : 'Book a Court', guard: true });
    sh.setLeft(plainBtn('Cancel', sh.close));

    const errBox = h('div');
    const courtSeg = seg(CFG.courts.map((c) => ({ value: c.id, label: c.name, disabled: !usable(c.id) })),
      S.court, (v) => { S.court = v; refresh(); }, 'Court');
    const sessionNote = h('p', { class: 'group-foot' });
    const shareNote = h('div', { class: 'stack', style: { gap: '10px' } });
    const name = h('input', { autocomplete: 'name', maxlength: 80, placeholder: 'Required', value: saved.name || '' });
    const email = h('input', { type: 'email', autocomplete: walkIn ? 'off' : 'email', inputmode: 'email', maxlength: 120, placeholder: walkIn ? 'customer@example.com' : 'you@example.com', value: saved.email || '' });
    const phone = h('input', { type: 'tel', autocomplete: 'tel', inputmode: 'tel', maxlength: 30, placeholder: 'Required', value: saved.phone || '' });
    const players = stepper({ value: S.players, min: minP, max: maxP, label: 'Players', onChange: (v) => { S.players = v; refresh(); } });
    // Booked hours: what the customer pays for, 1 hour up to the session length.
    const hoursStep = stepper({ value: S.hours, min: 1, max: maxHours, step: 0.5, format: hrsText, label: 'Booked hours', id: 'booked-hours', onChange: (v) => { S.hours = v; refresh(); } });
    const notes = h('textarea', { maxlength: 300, placeholder: 'Anything the club should know (optional)', 'aria-label': 'Notes' });
    const methodSeg = methods.length > 1 ? seg(methods, S.method, (v) => { S.method = v; refresh(); }, 'Payment method') : null;
    const methodNote = h('p', { class: 'group-foot' });
    const receipt = h('input', { maxlength: 60, placeholder: 'Optional', autocomplete: 'off' });
    const receiptField = field('Receipt no.', receipt);
    const paidRow = walkIn
      ? cell({ title: 'Paid now', sub: 'The customer has paid at the desk', right: toggle(S.paid, (v) => { S.paid = v; refresh(); }, 'Paid now') })
      : null;
    const total = h('strong');
    const breakdown = h('span', { class: 'breakdown' });
    const formId = 'book-form-' + ++uid;
    const submitLabel = walkIn ? 'Book Walk-in' : 'Confirm Booking';
    const submit = h('button', { type: 'submit', form: formId, class: 'btn btn-filled btn-lg', text: submitLabel });

    const fields = { name, email, phone };
    const form = h('form', { id: formId, novalidate: true, class: 'stack', onsubmit: onSubmit },
      errBox,
      h('div', { class: 'summary-head' },
        h('h3', { text: dayLabel(date) === 'Today' || dayLabel(date) === 'Tomorrow' ? `${dayLabel(date)}, ${fmt.dateShort(date)}` : fmt.dayTitle(date) }),
        h('div', { class: 'meta' }, meta('clock', `Session ${sessionText(date)}`))),
      staff ? plusReserveGroup(S.plus, (v) => { S.plus = v; refresh(); }, false) : null,
      group({ title: 'Court', items: [CFG.courts.length > 1 ? h('div', { class: 'seg-cell' }, courtSeg) : row(CFG.courts[0].name, null)], foot: sessionNote }),
      shareNote,
      group({
        title: walkIn ? 'Customer details' : 'Your details',
        items: [
          field('Name', name), field('Email', email), field('Mobile', phone),
          cell({ title: 'Players', value: players.valueEl, right: players }),
          cell({ title: 'Booked hours', sub: `1 to ${hrsText(maxHours)}, in half hours`, value: hoursStep.valueEl, right: hoursStep }),
        ],
        foot: (walkIn
          ? 'Used to find the booking and to reach the customer if plans change. Walk-ins can be for any number of players.'
          : `Online bookings are for ${playersText()} per court. The club uses your details to find your booking and to reach you if plans change.`) +
          ' The amount due is number of players × booked hours × rate per hour.',
      }),
      group({ title: 'Notes', items: [field(null, notes, { stack: true })] }),
      methods.length
        ? group({
          title: 'Payment',
          items: [methodSeg ? h('div', { class: 'seg-cell' }, methodSeg) : row(methods[0].label, null), paidRow, walkIn ? receiptField : null],
          foot: methodNote,
        })
        : banner('alert', 'This club has not turned on any payment options yet. Contact the club to book.', 'warn'),
      walkIn ? null : h('p', { class: 'group-foot', style: { padding: '0 4px' }, text: cancelPolicyText() }));

    sh.setBody(form);
    sh.setFoot(h('div', { class: 'total' }, h('span', null, 'Total', breakdown), total), submit);
    if (!methods.length) submit.disabled = true;

    function refresh() {
      sessionNote.textContent = `${courtName(S.court)} is reserved for the ${isWeekend(date) ? 'weekend' : 'weekday'} session, ${sessionText(date)}. You pay for the booked hours.`;
      // The court may already have bookings: they share it.
      const { bookings: shared, players: sharedPlayers } = bookedOn(onCourt(S.court));
      const past = walkIn && !sessionOpen(date);
      const sharedText = `${courtName(S.court)} already has ${sharedPlayers} player${sharedPlayers === 1 ? '' : 's'} booked on this date ` +
        `(${shared} booking${shared > 1 ? 's' : ''}). ` +
        (walkIn ? 'The walk-in will share the court.' : 'You can still book it: the court is shared.');
      shareNote.replaceChildren(...[
        past ? banner('clock', `This date has passed. The walk-in will be recorded for ${fmt.dateLong(date)}.`) : null,
        shared ? banner('people', sharedText, walkIn ? 'warn' : null) : null,
      ].filter(Boolean));
      total.textContent = fmt.money(priceFor(S.hours, S.players, S.plus));
      breakdown.textContent = priceBreakdown(S.hours, S.players, S.plus);
      if (walkIn) {
        receiptField.hidden = !S.paid;
        methodNote.textContent = S.paid
          ? `Recorded as paid${S.method === 'bank' ? ' by bank transfer' : ' at the desk'}. Add the receipt or transaction number if you have one.`
          : S.method === 'bank'
            ? 'The customer sees the bank details on the next screen. The booking stays pending until you mark it paid.'
            : 'The customer pays at the desk before playing.';
        return;
      }
      methodNote.textContent = S.method === 'bank'
        ? `You’ll see the bank details on the next screen. ${CFG.autoCancelHours ? `Unpaid bookings are released after ${CFG.autoCancelHours} hour${CFG.autoCancelHours > 1 ? 's' : ''}.` : 'Your booking stays pending until the club confirms your payment.'}`
        : 'Pay at the front desk before you play.';
    }
    refresh();

    async function onSubmit(e) {
      e.preventDefault();
      errBox.replaceChildren();
      Object.values(fields).forEach((f) => f.parentElement.classList.remove('invalid'));
      const problems = [];
      if (!name.value.trim()) problems.push([name, `Enter ${who} name.`]);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) problems.push([email, 'Enter a valid email address.']);
      if (!/^[+()\d\s.-]{6,30}$/.test(phone.value.trim())) problems.push([phone, 'Enter a valid mobile number.']);
      if (problems.length) {
        problems.forEach(([f]) => f.parentElement.classList.add('invalid'));
        errBox.replaceChildren(banner('alert', problems.map((p) => p[1]).join(' '), 'error'));
        sh.body.scrollTop = 0;
        problems[0][0].focus();
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Booking…';
      const body = {
        date, court: S.court, players: S.players, hours: S.hours, paymentMethod: S.method,
        name: name.value.trim(), email: email.value.trim(), phone: phone.value.trim(), notes: notes.value.trim(),
        plus: staff && S.plus,
      };
      try {
        let b;
        if (walkIn) {
          const res = await api('/api/admin/walkins', { method: 'POST', body: { ...body, paid: S.paid, paymentReference: S.paid ? receipt.value.trim() : '' } });
          b = res.view;
          toast('Walk-in booked');
        } else {
          b = await api('/api/public/bookings', { method: 'POST', body });
        }
        // A staff member booking for a customer shouldn't fill this device with the customer's details.
        if (!staff) {
          prefs.set('player', { name: name.value.trim(), email: email.value.trim(), phone: phone.value.trim(), players: S.players, hours: S.hours });
          rememberBooking(b.ref, b.email);
        }
        sh.guard = false;
        showPlayerBooking(sh, b, true, walkIn ? 'Walk-in Booked' : null);
        if (onBooked) onBooked(b);
      } catch (err) {
        if (err.status === 401) return handleError(err);
        errBox.replaceChildren(banner('alert', err.message, 'error'));
        sh.body.scrollTop = 0;
        submit.disabled = false;
        submit.textContent = submitLabel;
        if (err.status === 409 && onBooked) onBooked();
      }
    }
  }

  function cancelPolicyText() {
    return CFG.cancelCutoffHours
      ? `You can cancel online up to ${CFG.cancelCutoffHours} hour${CFG.cancelCutoffHours > 1 ? 's' : ''} before your start time.`
      : 'You can cancel online any time before your start time.';
  }

  function rememberBooking(ref, email) {
    const mine = prefs.get('mine', []).filter((m) => m.ref !== ref);
    mine.unshift({ ref, email });
    prefs.set('mine', mine.slice(0, 20));
  }

  function forgetBooking(ref) {
    prefs.set('mine', prefs.get('mine', []).filter((m) => m.ref !== ref));
  }

  function showPlayerBooking(sh, b, justBooked, title) {
    sh.setTitle(title || (justBooked ? 'Booking Complete' : 'Your Booking'));
    sh.setLeft();
    sh.setRight(plainBtn('Done', sh.close, true));
    sh.setFoot();
    sh.setBody(playerBookingNodes(b, {
      onChange: (nb) => showPlayerBooking(sh, nb, false),
      onRemove: justBooked ? null : () => { forgetBooking(b.ref); sh.close(); },
    }));
  }

  function playerState(b) {
    const amount = fmt.money(b.amount, b.currency);
    if (b.status === 'cancelled') return { c: 'gray', ic: 'x', title: 'Booking cancelled', text: b.cancelReason || 'This booking has been cancelled.' };
    if (b.status === 'no_show') return { c: 'red', ic: 'x', title: 'Missed booking', text: 'This booking was marked as a no-show.' };
    if (b.status === 'completed') return { c: 'blue', ic: 'check', title: 'Checked in', text: 'Thanks for playing. Enjoy the game!' };
    if (b.status === 'pending') {
      if (b.paymentStatus === 'submitted') return { c: 'blue', ic: 'clock', title: 'Payment sent', text: 'We’ll confirm your booking once the club has checked your transfer.' };
      return {
        c: 'orange', ic: 'clock', title: 'Booking received',
        text: `Transfer ${amount} to confirm your booking.${b.holdUntil ? ` Unpaid bookings are cancelled at ${fmt.stamp(b.holdUntil)}.` : ''}`,
      };
    }
    if (b.paymentStatus === 'paid') return { c: 'green', ic: 'check', title: 'You’re booked', text: 'Payment received. See you on court!' };
    if (b.paymentStatus === 'submitted') return { c: 'green', ic: 'check', title: 'You’re booked', text: 'The club will check the payment details you sent.' };
    if (b.paymentMethod === 'venue') return { c: 'green', ic: 'check', title: 'You’re booked', text: `Pay ${amount} at the front desk before you play.` };
    return { c: 'green', ic: 'check', title: 'You’re booked', text: `Please transfer ${amount} before you play.` };
  }

  function playerBookingNodes(b, { onChange, onRemove }) {
    const st = playerState(b);
    const active = ['pending', 'confirmed'].includes(b.status);
    const nodes = [
      h('div', { class: 'hero-state' }, h('div', { class: 'badge', 'data-c': st.c }, icon(st.ic)), h('h3', { text: st.title }), h('p', { text: st.text })),
      h('div', { class: 'refbox' },
        h('div', null, h('div', { class: 'k', text: 'Booking reference' }), h('div', { class: 'v', text: b.ref })),
        copyBtn(b.ref, 'Reference copied')),
      group({
        title: 'Booking',
        items: [
          row('Date', fmt.dateLong(b.date)),
          row('Session', fmt.range(b.start, b.end)),
          row('Court', b.courtName),
          row('Players', String(b.players)),
          row('Booked hours', hrsText(b.hours)),
          row('Name', b.name),
          row('Total', fmt.money(b.amount, b.currency), { strong: true, sub: `${b.players} player${b.players === 1 ? '' : 's'} × ${hrsText(b.hours)}` }),
          row('Payment', h('span', { class: 'chips' }, chip(PAY, b.paymentStatus), h('span', { text: METHOD[b.paymentMethod] }))),
        ],
      }),
    ];
    if (b.paymentMethod === 'bank' && active && ['unpaid', 'submitted'].includes(b.paymentStatus)) {
      nodes.push(b.bank ? bankGroup(b) : banner('alert', 'The club hasn’t added its bank details yet. Contact the club to arrange payment.', 'warn'));
    }
    if (b.paymentMethod === 'bank' && active && b.paymentStatus === 'unpaid') nodes.push(paymentNoticeGroup(b, onChange));

    const actions = [];
    if (b.status !== 'cancelled') actions.push(cell({ ic: 'calPlus', title: 'Add to Calendar', onClick: () => downloadIcs(b), cls: 'tint' }));
    if (b.canCancel) {
      actions.push(cell({
        ic: 'x', c: 'red', title: 'Cancel Booking', cls: 'danger',
        onClick: async () => {
          const ok = await confirmDialog({
            title: 'Cancel this booking?',
            message: `${fmt.date(b.date)}, ${fmt.range(b.start, b.end)} on ${b.courtName}.`,
            confirm: 'Cancel Booking', cancel: 'Keep', destructive: true,
          });
          if (!ok) return;
          try {
            const nb = await api('/api/public/cancel', { method: 'POST', body: { ref: b.ref, email: b.email } });
            toast('Booking cancelled');
            onChange(nb);
          } catch (err) { handleError(err); }
        },
      }));
    }
    if (onRemove) actions.push(cell({ ic: 'trash', c: 'gray', title: 'Remove from This Device', onClick: onRemove }));
    const contact = [CFG.contactPhone, CFG.contactEmail].filter(Boolean).join(' · ');
    let foot = null;
    if (active && !b.canCancel) {
      foot = `Online cancellation closes ${b.cancelCutoffHours} hours before the start time.${contact ? ` To change this booking, contact the club: ${contact}.` : ' Contact the club to change this booking.'}`;
    } else if (contact) foot = `Questions? Contact the club: ${contact}.`;
    if (actions.length) nodes.push(group({ items: actions, foot }));
    return nodes;
  }

  function bankGroup(b) {
    const k = b.bank;
    const amount = fmt.money(b.amount, b.currency);
    const items = [
      row('Bank', k.bankName),
      row('Account name', k.accountName),
      row('Account no.', h('span', { class: 'mono', text: k.accountNumber }), { right: copyBtn(k.accountNumber, 'Account number copied') }),
    ];
    if (k.branch) items.push(row('Branch', k.branch));
    if (k.swift) items.push(row('SWIFT / routing', h('span', { class: 'mono', text: k.swift })));
    items.push(row('Amount', amount, { strong: true, right: copyBtn(String(b.amount), 'Amount copied') }));
    items.push(row('Reference', h('span', { class: 'mono', text: b.ref }), { right: copyBtn(b.ref, 'Reference copied') }));
    const foot = [b.paymentInstructions, k.notes].filter(Boolean).join(' ');
    return group({ title: 'Pay by bank transfer', items, foot: foot || null });
  }

  function paymentNoticeGroup(b, onChange) {
    const input = h('input', { maxlength: 60, placeholder: 'Receipt or transaction no.', autocomplete: 'off' });
    const send = h('button', {
      type: 'button', class: 'cell tint center',
      onclick: async () => {
        if (!input.value.trim()) {
          input.parentElement.classList.add('invalid');
          input.focus();
          toast('Enter the transfer reference from your bank receipt', 'error');
          return;
        }
        send.disabled = true;
        try {
          const nb = await api('/api/public/payment', { method: 'POST', body: { ref: b.ref, email: b.email, reference: input.value.trim() } });
          toast('Payment details sent');
          onChange(nb);
        } catch (err) {
          send.disabled = false;
          handleError(err);
        }
      },
    }, 'Send Payment Details');
    return group({
      title: 'Already paid?',
      items: [field('Transfer ref.', input), send],
      foot: 'Send the reference from your bank receipt so the club can match your payment and confirm your booking.',
    });
  }

  function downloadIcs(b) {
    const stamp = (d, t) => (t === '24:00' ? addDays(d, 1).replace(/-/g, '') + 'T000000' : d.replace(/-/g, '') + 'T' + t.replace(':', '') + '00');
    const esc = (s) => String(s || '').replace(/[\\;,]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Court Booking//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      `UID:${b.ref}@court-booking`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTSTART;TZID=${b.timezone}:${stamp(b.date, b.start)}`,
      `DTEND;TZID=${b.timezone}:${stamp(b.date, b.end)}`,
      `SUMMARY:${esc(`Pickleball · ${b.courtName}`)}`,
      `LOCATION:${esc(b.address || b.facilityName)}`,
      `DESCRIPTION:${esc(`Booking ${b.ref} at ${b.facilityName} for ${b.players} player${b.players > 1 ? 's' : ''}.`)}`,
      'END:VEVENT', 'END:VCALENDAR',
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
    const a = h('a', { href: url, download: `${b.ref}.ics`, style: { display: 'none' } });
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }

  // =====================================================================================
  // Player: My bookings
  // =====================================================================================

  async function viewMy(main) {
    const pg = page(main, { title: 'My Bookings' });
    const listBox = h('div');
    const refInput = h('input', { autocomplete: 'off', autocapitalize: 'characters', placeholder: 'PB-XXXXXX', maxlength: 12, spellcheck: 'false' });
    const emailInput = h('input', { type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: 'Email used to book', maxlength: 120, value: prefs.get('player', {}).email || '' });
    const findBtn = h('button', { type: 'submit', class: 'cell tint center' }, 'Find Booking');
    const form = h('form', {
      novalidate: true,
      onsubmit: async (e) => {
        e.preventDefault();
        const ref = refInput.value.trim().toUpperCase();
        const email = emailInput.value.trim();
        if (!ref || !email) {
          toast('Enter your booking reference and email', 'error');
          (ref ? emailInput : refInput).focus();
          return;
        }
        findBtn.disabled = true;
        try {
          const b = await api('/api/public/lookup', { method: 'POST', body: { ref, email } });
          rememberBooking(b.ref, b.email);
          refInput.value = '';
          openPlayerBooking(b, loadMine);
          loadMine();
        } catch (err) {
          handleError(err);
        } finally {
          findBtn.disabled = false;
        }
      },
    }, group({
      title: 'Find a booking',
      items: [field('Reference', refInput), field('Email', emailInput), findBtn],
      foot: 'Your reference is on the booking confirmation screen. It starts with PB-.',
    }));
    pg.content.append(listBox, form);

    async function loadMine() {
      const mine = prefs.get('mine', []);
      if (!mine.length) {
        listBox.replaceChildren(emptyState('ticket', 'No bookings on this device yet', 'Bookings you make here appear in this list. Booked on another device? Find it with your reference below.',
          h('a', { class: 'btn btn-filled', href: '#/book' }, icon('calendar'), 'Book a Court')));
        return;
      }
      listBox.replaceChildren(loading());
      const results = await Promise.allSettled(mine.map((m) => api('/api/public/lookup', { method: 'POST', body: m })));
      const found = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') found.push(r.value);
        else if (r.reason && r.reason.status === 404) forgetBooking(mine[i].ref);
      });
      if (!listBox.isConnected) return;
      const today = CFG.now.date;
      const upcoming = found.filter((b) => b.date >= today && ['pending', 'confirmed'].includes(b.status)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
      const past = found.filter((b) => !upcoming.includes(b)).sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));
      const toCell = (b) => cell({
        ic: 'court', c: STATUS[b.status] ? (b.status === 'confirmed' ? 'tint' : b.status === 'cancelled' ? 'gray' : STATUS[b.status].c) : 'gray',
        title: `${dayLabel(b.date)} · ${fmt.time(b.start)}`,
        sub: `${b.courtName} · ${hrsText(b.hours)} booked · ${b.ref}`,
        value: h('span', { class: 'chips' }, b.status === 'pending' && b.paymentStatus === 'unpaid' ? chip(PAY, 'unpaid') : chip(STATUS, b.status)),
        chevron: true,
        onClick: () => openPlayerBooking(b, loadMine),
      });
      const nodes = [];
      if (upcoming.length) nodes.push(group({ title: 'Upcoming', items: upcoming.map(toCell) }));
      if (past.length) nodes.push(group({ title: 'Past and cancelled', items: past.map(toCell) }));
      if (!nodes.length) nodes.push(emptyState('ticket', 'No bookings found', 'We couldn’t load the bookings saved on this device.'));
      listBox.replaceChildren(h('div', { class: 'stack' }, nodes));
    }
    await loadMine();
  }

  function openPlayerBooking(b, onChanged) {
    const sh = openSheet({ title: 'Your Booking' });
    const show = (nb) => {
      sh.setTitle('Your Booking');
      sh.setRight(plainBtn('Done', sh.close, true));
      sh.setBody(playerBookingNodes(nb, {
        onChange: (x) => { show(x); if (onChanged) onChanged(); },
        onRemove: () => { forgetBooking(nb.ref); sh.close(); if (onChanged) onChanged(); },
      }));
    };
    show(b);
  }

  // =====================================================================================
  // Player: Club info
  // =====================================================================================

  async function viewInfo(main) {
    const pg = page(main, { title: CFG.setupComplete ? CFG.facilityName : 'Club Info' });
    if (CFG.address) pg.setSubtitle(meta('pin', CFG.address));
    const c = CFG;
    const contact = [];
    if (c.address) contact.push(cell({ ic: 'pin', c: 'red', title: c.address, right: copyBtn(c.address, 'Address copied') }));
    if (c.contactPhone) contact.push(cell({ ic: 'phone', c: 'green', title: h('a', { href: `tel:${c.contactPhone.replace(/[^+\d]/g, '')}`, text: c.contactPhone }), right: copyBtn(c.contactPhone, 'Number copied') }));
    if (c.contactEmail) contact.push(cell({ ic: 'mail', c: 'blue', title: h('a', { href: `mailto:${c.contactEmail}`, text: c.contactEmail }), right: copyBtn(c.contactEmail, 'Email copied') }));

    const span = (x) => `${fmt.range(x.open, x.close)} (${fmt.dur(toMin(x.close) - toMin(x.open))})`;
    // Label and value rows (`kv`) share the row width in proportion and stack on narrow screens.
    const kv = (o) => cell({ ...o, cls: 'kv' });
    const hours = [
      kv({ ic: 'clock', title: 'Weekdays', sub: 'Monday to Thursday', value: span(c.hours.weekday) }),
      kv({ ic: 'clock', c: 'indigo', title: 'Weekends', sub: 'Friday to Sunday', value: span(c.hours.weekend) }),
      kv({ ic: 'tag', title: 'Rate per player', value: `${fmt.money(c.pricePerHour)} / hour` }),
      kv({ ic: 'calendar', title: 'Each booking', value: 'One court for the day’s session' }),
      kv({ ic: 'clock', c: 'orange', title: 'Booked hours', value: 'From 1 hour, in half hours' }),
      kv({ ic: 'calPlus', title: 'Book ahead', value: `Up to ${c.advanceDays} days` }),
      kv({ ic: 'people', title: 'Players per court', value: playersText() }),
    ];

    const pay = [];
    if (c.payment.bankTransfer) pay.push(cell({ ic: 'bank', c: 'blue', title: 'Bank transfer', sub: c.payment.bank ? `${c.payment.bank.bankName} · ${c.payment.bank.accountName}` : null }));
    if (c.payment.payAtVenue) pay.push(cell({ ic: 'cash', c: 'green', title: 'Pay at the venue', sub: 'Front desk, before you play' }));

    const theme = prefs.get('appearance', 'system');
    // The page sizes its columns from its own width (container queries), so it fits
    // phones, tablets and desktops with or without the side bar.
    pg.content.append(h('div', { class: 'info' },
      contact.length ? group({ title: 'Contact', items: contact }) : null,
      h('div', { class: 'info-cols' },
        h('div', { class: 'stack' },
          group({ title: 'Hours and prices', items: hours, foot: 'A booking is for one court for that day’s session, and other players can book the same court. Amount due = number of players × booked hours × rate per hour.' }),
          group({ title: 'Courts', items: c.courts.map((ct) => cell({ ic: 'court', title: ct.name })) })),
        h('div', { class: 'stack' },
          group({
            title: 'How booking works',
            items: [h('div', { class: 'steps' },
              ...[
                ['Pick a date and a court', `Choose a day on the Book tab, then a court. Your booking covers that day’s session (${hoursLines().join(', ')}). Other players can book the same court too.`],
                ['Add your details', `Enter your name, email and mobile number, how many are playing (${playersText()}) and how many hours you’re booking.`],
                ['Pay', c.payment.bankTransfer ? 'Transfer the amount using your booking reference, or pay at the venue if offered.' : 'Pay at the front desk before you play.'],
                ['Manage it', 'Find, add to calendar or cancel your booking under My Bookings.'],
              ].map(([t, d], i) => h('div', { class: 'step' }, h('span', { class: 'n', text: String(i + 1) }), h('div', null, h('strong', { text: t }), h('p', { text: d })))))],
          }),
          group({
            title: 'Policies',
            items: [
              cell({ ic: 'x', c: 'red', title: 'Cancellations', sub: cancelPolicyText() }),
              cell({ ic: 'clock', c: 'orange', title: 'Unpaid bookings', sub: c.autoCancelHours ? `Bank transfer bookings not paid within ${c.autoCancelHours} hour${c.autoCancelHours > 1 ? 's' : ''} are cancelled.` : 'Bank transfer bookings stay pending until the club confirms your payment.' }),
            ],
          }),
          pay.length ? group({ title: 'Payment options', items: pay }) : null,
          (c.closedDates || []).length
            ? group({
              title: 'Holiday closures',
              items: c.closedDates.slice(0, 12).map((x) => cell({ ic: 'flag', c: 'red', title: x.name, sub: fmt.dateLong(x.date) })),
              foot: 'The club is closed on these dates, so they can’t be booked.',
            })
            : null)),
      group({ title: 'Appearance', items: [h('div', { class: 'seg-cell' }, seg([{ value: 'system', label: 'Automatic' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }], theme, applyTheme, 'Appearance'))] }),
      group({ items: [cell({ ic: 'lock', c: 'gray', title: 'Staff sign in', sub: 'Manage bookings, reports and settings', href: '#/admin', chevron: true })] })));
  }

  // =====================================================================================
  // Staff: sign in and first-time setup
  // =====================================================================================

  async function viewLogin(main) {
    const pg = page(main, { title: 'Staff Sign In', left: h('a', { class: 'btn btn-plain', href: '#/book' }, icon('back'), 'Booking site') });
    const pw = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'Required' });
    const btn = h('button', { type: 'submit', class: 'btn btn-filled btn-lg', text: 'Sign In' });
    const errBox = h('div');
    pg.content.append(h('form', {
      class: 'auth-card', novalidate: true,
      onsubmit: async (e) => {
        e.preventDefault();
        errBox.replaceChildren();
        if (!pw.value) { pw.focus(); return; }
        btn.disabled = true;
        try {
          await api('/api/admin/login', { method: 'POST', body: { password: pw.value } });
          toast('Signed in');
          go('/admin');
        } catch (err) {
          errBox.replaceChildren(banner('alert', err.message, 'error'));
          pw.select();
        } finally {
          btn.disabled = false;
        }
      },
    },
    brandMark('auth-logo'),
    h('p', { class: 'muted', text: `Sign in to manage bookings, payments, reports and settings for ${CFG.facilityName}.` }),
    errBox,
    group({ items: [field('Password', pw)], foot: 'Forgot the password? Whoever hosts the app can reset it with the RESET_ADMIN_PASSWORD setting (see the README).' }),
    btn));
    pw.focus();
  }

  function timeZoneSelect(value) {
    let zones = [];
    try { zones = Intl.supportedValuesOf('timeZone'); } catch { /* older browser */ }
    if (!zones.length) return h('input', { value, placeholder: 'e.g. America/New_York' });
    if (!zones.includes(value)) zones = [value, ...zones];
    if (!zones.includes('UTC')) zones = ['UTC', ...zones];
    return select(zones.map((z) => ({ value: z, label: z.replace(/_/g, ' ') })), value);
  }

  async function viewSetup(main) {
    const pg = page(main, { title: 'Set Up Your Club', left: h('a', { class: 'btn btn-plain', href: '#/book' }, icon('back'), 'Booking site') });
    const S = {
      courtCount: 2,
      timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC',
      currency: 'NZD',
    };
    const nameIn = h('input', { placeholder: 'e.g. Riverside Pickleball', maxlength: 80, autocomplete: 'organization' });
    const tzIn = timeZoneSelect(S.timezone);
    const curIn = select(currencyOptions(CURRENCIES), S.currency);
    const courts = stepper({ value: S.courtCount, min: 1, max: 3, label: 'Courts', onChange: (v) => { S.courtCount = v; } });
    const wdOpenIn = select(timeOptions(0, 23 * 60 + 30), '07:00');
    const wdCloseIn = select(timeOptions(60, 1440), '22:00');
    const weOpenIn = select(timeOptions(0, 23 * 60 + 30), '07:00');
    const weCloseIn = select(timeOptions(60, 1440), '22:00');
    const rateIn = h('input', { type: 'number', inputmode: 'decimal', min: 0, step: '0.01', value: '20', class: 'right' });
    const pw1 = h('input', { type: 'password', autocomplete: 'new-password', placeholder: 'At least 8 characters' });
    const pw2 = h('input', { type: 'password', autocomplete: 'new-password', placeholder: 'Type it again' });
    const errBox = h('div');
    const btn = h('button', { type: 'submit', class: 'btn btn-filled btn-lg', text: 'Create Club' });
    pg.content.append(h('form', {
      class: 'auth-card', novalidate: true,
      onsubmit: async (e) => {
        e.preventDefault();
        errBox.replaceChildren();
        const problem = !nameIn.value.trim() ? [nameIn, 'Enter your club’s name.']
          : pw1.value.length < 8 ? [pw1, 'Choose a password with at least 8 characters.']
            : pw1.value !== pw2.value ? [pw2, 'The two passwords don’t match.'] : null;
        if (problem) {
          errBox.replaceChildren(banner('alert', problem[1], 'error'));
          problem[0].focus();
          return;
        }
        btn.disabled = true;
        try {
          await api('/api/admin/setup', {
            method: 'POST',
            body: {
              password: pw1.value,
              settings: {
                facilityName: nameIn.value.trim(), timezone: tzIn.value, currency: curIn.value, courtCount: courts.get(),
                weekdayOpen: wdOpenIn.value, weekdayClose: wdCloseIn.value, weekendOpen: weOpenIn.value, weekendClose: weCloseIn.value,
                pricePerHour: Number(rateIn.value),
              },
            },
          });
          toast('Your club is ready');
          go('/admin');
        } catch (err) {
          errBox.replaceChildren(banner('alert', err.message, 'error'));
          btn.disabled = false;
        }
      },
    },
    brandMark('auth-logo'),
    h('p', { class: 'muted', text: 'Add the basics and a staff password. You can change everything later in Settings, including the bank account players pay into.' }),
    errBox,
    group({ title: 'Club', items: [field('Club name', nameIn), field('Time zone', tzIn), field('Currency', curIn)] }),
    group({ title: 'Courts', items: [cell({ title: 'Number of courts', value: courts.valueEl, right: courts })], foot: 'Between 1 and 3 courts.' }),
    group({ title: 'Weekday hours (Mon–Thu)', items: [field('Opens', wdOpenIn), field('Closes', wdCloseIn)] }),
    group({ title: 'Weekend hours (Fri–Sun)', items: [field('Opens', weOpenIn), field('Closes', weCloseIn)] }),
    group({ title: 'Price', items: [field('Rate per player / hr', rateIn)], foot: 'Amount due = number of players × booked hours × rate per hour.' }),
    group({ title: 'Staff password', items: [field('Password', pw1), field('Confirm', pw2)], foot: 'Share it only with staff who manage bookings.' }),
    btn));
    nameIn.focus();
  }

  // =====================================================================================
  // Staff: booking detail and editor
  // =====================================================================================

  function openStaffDetail(b, onChanged) {
    const sh = openSheet({ title: b.type === 'block' ? 'Blocked Time' : 'Booking' });
    sh.setLeft(plainBtn('Close', sh.close));
    sh.setRight(plainBtn('Edit', () => { sh.close(); openStaffEditor({ existing: b, onSaved: onChanged }); }, true));

    async function act(action, confirmOpts) {
      if (confirmOpts && !(await confirmDialog(confirmOpts))) return;
      try {
        if (action === 'delete') {
          await api(`/api/admin/bookings/${b.id}`, { method: 'DELETE' });
          toast(b.type === 'block' ? 'Blocked time removed' : 'Booking deleted');
          sh.close();
          if (onChanged) onChanged();
          return;
        }
        const nb = await api(`/api/admin/bookings/${b.id}/action`, { method: 'POST', body: { action } });
        b = nb;
        toast({ confirm: 'Booking confirmed', mark_paid: 'Marked as paid', mark_unpaid: 'Marked as unpaid', check_in: 'Checked in', no_show: 'Marked as no-show', cancel: 'Booking cancelled', restore: 'Booking restored', refund: 'Marked as refunded' }[action] || 'Saved');
        renderBody();
        if (onChanged) onChanged(nb);
      } catch (err) { handleError(err); }
    }

    function renderBody() {
      const when = `${fmt.date(b.date)}, ${fmt.range(b.start, b.end)} on ${courtName(b.court)}`;
      const head = h('div', { class: 'summary-head' },
        h('h3', { text: b.name }),
        h('div', { class: 'meta' }, h('span', { class: 'mono', text: b.ref }), h('span', { text: SOURCE_TEXT[b.source] || SOURCE_TEXT.online }), h('span', { text: fmt.stamp(b.createdAt) })),
        h('div', { class: 'chips' }, chip(STATUS, b.status), b.type === 'booking' ? chip(PAY, b.paymentStatus) : null, plusChip(b), walkInChip(b)));
      const whenGroup = group({
        title: 'When',
        items: [row('Date', fmt.dateLong(b.date)), row('Session', `${fmt.range(b.start, b.end)} (${fmt.dur(b.duration)})`), row('Court', courtName(b.court))],
      });
      const nodes = [head, whenGroup];
      const actions = [];
      const A = (action, title, ic, c, extra = {}) => actions.push(cell({ ic, c, title, cls: extra.danger ? 'danger' : '', onClick: () => act(action, extra.confirm) }));

      if (b.type === 'block') {
        if (b.notes) nodes.push(group({ title: 'Notes', items: [h('div', { class: 'cell' }, b.notes)] }));
        A('delete', 'Remove Blocked Time', 'trash', 'red', { danger: true, confirm: { title: 'Remove this blocked time?', message: `${when} becomes bookable again.`, confirm: 'Remove', destructive: true } });
      } else {
        const contact = [];
        if (b.email) contact.push(row('Email', h('a', { href: `mailto:${b.email}`, text: b.email }), { right: copyBtn(b.email, 'Email copied') }));
        if (b.phone) contact.push(row('Mobile', h('a', { href: `tel:${b.phone.replace(/[^+\d]/g, '')}`, text: b.phone }), { right: copyBtn(b.phone, 'Number copied') }));
        contact.push(row('Players', String(b.players)), row('Booked hours', hrsText(b.hours)));
        if (b.notes) contact.push(h('div', { class: 'cell' }, h('div', { class: 'cell-main' }, h('div', { class: 'cell-sub', text: 'Notes' }), h('div', { class: 'cell-title', text: b.notes }))));
        nodes.push(group({ title: 'Player', items: contact }));
        const pay = [
          row('Amount', fmt.money(b.amount, b.currency), { strong: true, sub: `${b.players} player${b.players === 1 ? '' : 's'} × ${hrsText(b.hours)}` }),
          row('Rate', b.plus ? 'PLUS reserve' : 'Regular'),
          row('Method', METHOD[b.paymentMethod]),
          row('Status', chip(PAY, b.paymentStatus)),
        ];
        if (b.paymentReference) pay.push(row('Transfer ref.', h('span', { class: 'mono', text: b.paymentReference }), { right: copyBtn(b.paymentReference, 'Reference copied') }));
        if (b.bank) pay.push(row('Paid into', `${b.bank.bankName} ${b.bank.accountNumber}`));
        if (b.paymentSubmittedAt) pay.push(row('Player reported', fmt.stamp(b.paymentSubmittedAt)));
        if (b.paidAt) pay.push(row('Marked paid', fmt.stamp(b.paidAt)));
        nodes.push(group({ title: 'Payment', items: pay }));

        if (b.status === 'pending') A('confirm', 'Confirm Booking', 'checkCircle', 'green');
        if (['unpaid', 'submitted'].includes(b.paymentStatus) && b.status !== 'cancelled') {
          A('mark_paid', b.paymentStatus === 'submitted' ? 'Payment Checked: Mark as Paid' : 'Mark as Paid', 'cash', 'green');
        }
        if (['pending', 'confirmed'].includes(b.status)) {
          A('check_in', 'Check In', 'check', 'blue');
          A('no_show', 'Mark as No-Show', 'flag', 'orange');
        }
        if (b.paymentStatus === 'paid') {
          A('mark_unpaid', 'Mark as Unpaid', 'undo', 'gray');
          A('refund', 'Mark as Refunded', 'undo', 'gray', { confirm: { title: 'Mark as refunded?', message: `Record that ${fmt.money(b.amount, b.currency)} was returned to ${b.name}. Refund the money through your bank separately.`, confirm: 'Mark Refunded' } });
        }
        if (b.status === 'cancelled') {
          A('restore', 'Restore Booking', 'undo', 'tint');
          A('delete', 'Delete Permanently', 'trash', 'red', { danger: true, confirm: { title: 'Delete this booking?', message: 'It will be removed from all reports. This can’t be undone.', confirm: 'Delete', destructive: true } });
        } else {
          A('cancel', 'Cancel Booking', 'x', 'red', { danger: true, confirm: { title: 'Cancel this booking?', message: `${when} for ${b.name}.`, confirm: 'Cancel Booking', cancel: 'Keep', destructive: true } });
        }
      }
      actions.unshift(cell({ ic: 'pencil', c: 'gray', title: b.type === 'block' ? 'Edit Blocked Time' : 'Edit or Move Booking', onClick: () => { sh.close(); openStaffEditor({ existing: b, onSaved: onChanged }); } }));
      nodes.push(group({ title: 'Actions', items: actions }));
      if (b.history && b.history.length) {
        nodes.push(group({ title: 'History', items: [...b.history].reverse().map((x) => row(x.what, fmt.stamp(x.at))) }));
      }
      sh.setBody(nodes);
    }
    renderBody();
  }

  /** Staff-only "PLUS reserve" switch for the booking and block-time forms. */
  function plusReserveGroup(on, onChange, isBlock) {
    return group({
      items: [cell({
        ic: 'star', c: 'purple', title: 'PLUS reserve',
        sub: `Special rate: ${fmt.money(ADMIN.plusRatePerHour || 0)} per player / hr`,
        right: toggle(on, onChange, 'PLUS reserve'),
      })],
      foot: isBlock
        ? 'Marks this blocked time as a PLUS reserve so it shows in PLUS reserve reports. Blocked time isn’t charged.'
        : 'Charges the PLUS reserve rate instead of the regular rate: players × booked hours × PLUS rate. Only staff see this option.',
    });
  }

  function openStaffEditor({ init = {}, existing = null, onSaved } = {}) {
    const isEdit = Boolean(existing);
    const e = existing || {};
    const S = {
      type: isEdit ? e.type : init.type || 'booking',
      date: e.date || init.date || CFG.now.date,
      court: e.court || init.court || 1,
      start: e.start || '',
      duration: e.duration || 0,
      hours: e.hours || 1,
      name: e.name || '',
      email: e.email || '',
      phone: e.phone || '',
      players: e.players || 4,
      notes: e.notes || '',
      paymentMethod: e.paymentMethod === 'bank' ? 'bank' : 'venue',
      paymentStatus: e.paymentStatus && e.paymentStatus !== 'n/a' ? e.paymentStatus : 'unpaid',
      status: e.status && e.status !== 'blocked' ? e.status : 'confirmed',
      paymentReference: e.paymentReference || '',
      plus: Boolean(e.plus),
    };
    let amountTouched = isEdit;
    // That date's session: weekday (Mon–Thu) or weekend (Fri–Sun) opening hours.
    const sessionOf = (d) => ({ start: hoursFor(d).open, duration: sessionMinutes(d) });
    if (!isEdit) {
      // New bookings are for the whole session, on a date whose session hasn't ended.
      const now = clubNow();
      if (!sessionOpen(S.date, now)) S.date = sessionOpen(now.date, now) ? now.date : addDays(now.date, 1);
    }
    const pastMessage = 'That date’s session has already ended. Choose today (before closing time) or a future date.';
    // Walk-ins can be recorded or moved to any date, past included.
    const pastOk = isEdit && e.source === 'walkin';
    // A booking moved to another date or court becomes a whole-session booking;
    // otherwise an existing booking keeps its original time.
    const isMoved = () => !isEdit || S.date !== e.date || S.court !== e.court;
    function applySession() {
      const keep = !isMoved();
      S.start = keep ? e.start : sessionOf(S.date).start;
      S.duration = keep ? e.duration : sessionOf(S.date).duration;
    }
    // Booked hours: 1 hour up to the session length (an unmoved booking keeps what it had).
    const maxHours = () => Math.max(maxBookedHours(S.date), isMoved() ? 0 : e.hours || 0);
    let hoursStep = null;

    const sh = openSheet({ title: '', guard: true });
    const errBox = h('div');
    const saveBtn = plainBtn('Save', () => save(), true);
    sh.setLeft(plainBtn('Cancel', sh.close));
    sh.setRight(saveBtn);

    const amountIn = h('input', { type: 'number', inputmode: 'decimal', min: 0, step: '0.01', class: 'right', oninput: () => { amountTouched = true; syncPrice(); } });
    const timeValue = h('span');
    const endNote = h('p', { class: 'group-foot' });
    const priceNote = h('div', { class: 'group-foot price-note' });

    // The amount follows players × hours × rate until staff type their own amount.
    function syncPrice() {
      const byRate = priceFor(S.hours, S.players, S.plus);
      if (!amountTouched) amountIn.value = String(byRate);
      const differs = amountTouched && Math.abs(Number(amountIn.value || 0) - byRate) > 0.005;
      priceNote.replaceChildren(
        h('span', { text: `${priceBreakdown(S.hours, S.players, S.plus)} = ${fmt.money(byRate)}` }),
        differs ? h('button', { type: 'button', class: 'btn btn-plain btn-inline', text: 'Use This Amount', onclick: () => { amountTouched = false; syncPrice(); } }) : '');
    }

    function syncTimes() {
      applySession();
      if (hoursStep) S.hours = hoursStep.setMax(maxHours());
      const session = sessionOf(S.date);
      timeValue.textContent = `${fmt.range(S.start, toTime(toMin(S.start) + S.duration))} (${fmt.dur(S.duration)})`;
      endNote.textContent = S.start === session.start && S.duration === session.duration
        ? `Whole session: ${isWeekend(S.date) ? 'weekend (Fri–Sun)' : 'weekday (Mon–Thu)'} opening hours from Settings.`
        : 'This booking keeps its original time. Changing the date or court makes it a whole-session booking.';
      syncPrice();
    }

    function build() {
      sh.setTitle(isEdit ? (S.type === 'block' ? 'Edit Blocked Time' : 'Edit Booking') : (S.type === 'block' ? 'Block Court Time' : 'New Booking'));
      const dateIn = h('input', {
        type: 'date', value: S.date, min: isEdit ? null : clubNow().date,
        onchange: (ev) => {
          if (!ev.target.value) return;
          S.date = ev.target.value;
          syncTimes();
        },
      });
      const nodes = [errBox];
      if (!isEdit) {
        nodes.push(h('div', null, seg([{ value: 'booking', label: 'Booking' }, { value: 'block', label: 'Block time' }], S.type, (v) => { S.type = v; build(); }, 'Type')));
      }
      nodes.push(plusReserveGroup(S.plus, (v) => { S.plus = v; syncPrice(); }, S.type === 'block'));
      nodes.push(group({
        title: 'When',
        items: [
          field('Date', dateIn),
          CFG.courts.length > 1 ? h('div', { class: 'seg-cell' }, seg(CFG.courts.map((c) => ({ value: c.id, label: c.name })), S.court, (v) => { S.court = v; syncTimes(); }, 'Court')) : null,
          row('Session', timeValue),
        ],
        foot: endNote,
      }));
      if (S.type === 'block') {
        hoursStep = null;
        const reason = h('input', { maxlength: 80, placeholder: 'e.g. Maintenance, coaching clinic', value: S.name === 'Court blocked' ? '' : S.name, oninput: (ev) => { S.name = ev.target.value; } });
        const notes = h('textarea', { maxlength: 300, 'aria-label': 'Notes', placeholder: 'Notes for staff (optional)', value: S.notes, oninput: (ev) => { S.notes = ev.target.value; } });
        nodes.push(group({ title: 'Details', items: [field('Reason', reason), field(null, notes, { stack: true })], foot: 'Players see blocked time as unavailable.' }));
      } else {
        const name = h('input', { maxlength: 80, placeholder: 'Required', value: S.name, autocomplete: 'off', oninput: (ev) => { S.name = ev.target.value; } });
        const email = h('input', { type: 'email', maxlength: 120, placeholder: 'Optional', value: S.email, autocomplete: 'off', oninput: (ev) => { S.email = ev.target.value; } });
        const phone = h('input', { type: 'tel', maxlength: 30, placeholder: 'Optional', value: S.phone, autocomplete: 'off', oninput: (ev) => { S.phone = ev.target.value; } });
        const players = stepper({ value: S.players, min: 1, max: 12, label: 'Players', onChange: (v) => { S.players = v; syncPrice(); } });
        hoursStep = stepper({ value: S.hours, min: 1, max: maxHours(), step: 0.5, format: hrsText, label: 'Booked hours', id: 'edit-hours', onChange: (v) => { S.hours = v; syncPrice(); } });
        const notes = h('textarea', { maxlength: 300, 'aria-label': 'Notes', placeholder: 'Notes (optional)', value: S.notes, oninput: (ev) => { S.notes = ev.target.value; } });
        const ref = h('input', { maxlength: 60, placeholder: 'Optional', value: S.paymentReference, oninput: (ev) => { S.paymentReference = ev.target.value; } });
        nodes.push(group({
          title: 'Player',
          items: [
            field('Name', name), field('Email', email), field('Mobile', phone),
            cell({ title: 'Players', value: players.valueEl, right: players }),
            cell({ title: 'Booked hours', value: hoursStep.valueEl, right: hoursStep }),
            field(null, notes, { stack: true }),
          ],
        }));
        nodes.push(group({
          title: 'Payment',
          items: [
            field(`Amount (${currencySign()})`, amountIn),
            h('div', { class: 'seg-cell' }, seg([{ value: 'venue', label: 'Pay at venue' }, { value: 'bank', label: 'Bank transfer' }], S.paymentMethod, (v) => { S.paymentMethod = v; }, 'Payment method')),
            field('Payment', select(Object.entries(PAY).map(([k, v]) => ({ value: k, label: v.label })), S.paymentStatus, { onchange: (ev) => { S.paymentStatus = ev.target.value; } })),
            field('Transfer ref.', ref),
            field('Booking status', select(['pending', 'confirmed', 'completed', 'no_show', 'cancelled'].map((k) => ({ value: k, label: STATUS[k].label })), S.status, { onchange: (ev) => { S.status = ev.target.value; } })),
          ],
          foot: priceNote,
        }));
      }
      sh.setBody(nodes);
      syncTimes();
    }
    if (isEdit) amountIn.value = String(e.amount);
    build();

    async function save() {
      errBox.replaceChildren();
      if (S.type === 'booking' && !S.name.trim()) {
        errBox.replaceChildren(banner('alert', 'Enter the player’s name.', 'error'));
        sh.body.scrollTop = 0;
        return;
      }
      const moved = isMoved();
      if (moved && !pastOk && !sessionOpen(S.date)) {
        errBox.replaceChildren(banner('alert', pastMessage, 'error'));
        sh.body.scrollTop = 0;
        return;
      }
      const closed = moved && closedOn(S.date);
      if (closed) {
        errBox.replaceChildren(banner('alert', `The club is closed on ${fmt.dateLong(S.date)} for ${closed.name}. Choose another date, or reopen it in Settings.`, 'error'));
        sh.body.scrollTop = 0;
        return;
      }
      const body = { ...S, name: S.name.trim() || (S.type === 'block' ? 'Court blocked' : ''), amount: S.type === 'booking' ? Number(amountIn.value || 0) : 0 };
      saveBtn.disabled = true;
      try {
        const b = isEdit
          ? await api(`/api/admin/bookings/${e.id}`, { method: 'PATCH', body })
          : await api('/api/admin/bookings', { method: 'POST', body });
        toast(S.type === 'block' ? 'Court time blocked' : isEdit ? 'Booking updated' : 'Booking added');
        sh.guard = false;
        sh.close();
        if (onSaved) onSaved(b);
      } catch (err) {
        if (err.status === 401) return handleError(err);
        errBox.replaceChildren(banner('alert', err.message, 'error'));
        sh.body.scrollTop = 0;
      } finally {
        saveBtn.disabled = false;
      }
    }
  }

  // Badges sit under the details so names and times keep the full width on phones.
  function staffBookingCell(b, { showDate, onChanged }) {
    return cell({
      title: b.type === 'block' ? `${b.name} (blocked)` : b.name,
      sub: h('span', { style: { display: 'grid', gap: '6px' } },
        h('span', { text: [showDate ? fmt.date(b.date) : null, fmt.range(b.start, b.end), courtName(b.court), b.type === 'booking' ? `${b.players} × ${hrsText(b.hours)}` : null, b.type === 'booking' ? b.ref : null].filter(Boolean).join(' · ') }),
        h('span', { class: 'chips' }, walkInChip(b), plusChip(b), chip(STATUS, b.status), b.type === 'booking' && b.status !== 'cancelled' ? chip(PAY, b.paymentStatus) : null)),
      value: b.type === 'booking' ? h('span', { class: 'num', style: { color: 'var(--label)' }, text: fmt.money(b.amount, b.currency) }) : null,
      chevron: true,
      onClick: () => openStaffDetail(b, onChanged),
    });
  }

  // =====================================================================================
  // Staff: Dashboard
  // =====================================================================================

  async function viewDashboard(main) {
    const pg = page(main, {
      title: 'Dashboard',
      subtitle: [meta('calendar', fmt.dateLong(CFG.now.date))],
      right: iconBtn('plus', 'New booking', () => openStaffEditor({ onSaved: () => reload().catch(handleError) })),
    });
    const box = h('div', { class: 'stack' }, loading());
    pg.content.append(box);
    let metric = prefs.get('dashMetric', 'revenue');

    async function reload() {
      const d = await api('/api/admin/dashboard');
      if (box.isConnected) box.replaceChildren(...dashboardNodes(d));
    }

    function dashboardNodes(d) {
      const refresh = () => reload().catch(handleError);
      const nodes = [];
      if (!d.checklist.bankAccount) {
        nodes.push(banner('bank', [h('strong', { text: 'Add the bank account players pay into' }), h('span', { text: 'Until you do, players can only choose to pay at the venue.' })], 'warn',
          h('a', { class: 'btn btn-sm btn-gray', href: '#/admin/settings', onclick: () => { settingsFocus = 'payments'; } }, 'Add Bank Account')));
      }
      if (!d.checklist.timezone) {
        nodes.push(banner('clock', [h('strong', { text: 'Your club’s time zone is set to UTC' }), h('span', { text: 'Set your local time zone so “today” and past time slots match your clock.' })], 'warn',
          h('a', { class: 'btn btn-sm btn-gray', href: '#/admin/settings' }, 'Open Settings')));
      }

      const monthName = fmt.month(d.month.key);
      const hall = d.hall;
      const tiles = h('div', { class: 'tiles t5' },
        tile('calendar', 'Bookings today', fmt.num(d.today.bookings),
          `${fmt.num(d.today.players)} players · ${fmt.hours(d.today.hours)} booked hrs · ${fmt.money(d.today.revenue)}${d.today.walkIns ? ` · ${d.today.walkIns} walk-in${d.today.walkIns === 1 ? '' : 's'}` : ''}`),
        tile('court', 'Court use today', fmt.pct(d.today.utilization), `Across ${CFG.courts.length} court${CFG.courts.length > 1 ? 's' : ''}`, h('div', { class: 'meter', role: 'presentation' }, h('span', { style: { width: fmt.pct(d.today.utilization) } }))),
        tile('cash', `Collected in ${fmt.monthShort(d.month.key)}`, fmt.money(d.month.collected), `${fmt.money(d.month.billed)} booked in ${monthName}`),
        tile('alert', 'Payments to check', fmt.num(d.payments.toVerify), `${fmt.num(d.payments.unpaidUpcoming)} upcoming unpaid · ${fmt.money(d.payments.unpaidAmount)}`, null, d.payments.toVerify > 0),
        tile('hall', 'SJV Hall payments', fmt.dollars(hall.total),
          `${fmt.dollars(hall.month)} in ${fmt.monthShort(hall.monthKey)} · ${fmt.num(hall.count)} payment${hall.count === 1 ? '' : 's'}`));
      // The tiles sit in a container so their columns follow the space they have.
      nodes.push(h('div', { class: 'tiles-box' }, tiles));

      const chartBox = h('div');
      const drawChart = () => chartBox.replaceChildren(barChart({
        points: d.trend,
        value: (p) => (metric === 'revenue' ? p.revenue : p.bookings),
        label: (p) => fmt.dateShort(p.date),
        tipTitle: (p) => fmt.date(p.date),
        fmtValue: (v) => (metric === 'revenue' ? fmt.money(v) : `${v} booking${v === 1 ? '' : 's'}`),
        fmtAxis: (v) => (metric === 'revenue' ? fmt.moneyAxis(v) : String(v)),
        integer: metric !== 'revenue',
        highlight: (p, i) => i === d.trend.length - 1,
        endLabel: true,
        title: metric === 'revenue' ? 'Revenue by day, last 14 days' : 'Bookings by day, last 14 days',
      }));
      drawChart();
      const chartCard = h('section', { class: 'card' },
        h('div', { class: 'card-head' },
          h('div', null, h('h2', { class: 'card-title', text: 'Last 14 days' }), h('div', { class: 'card-sub', text: 'Bookings by play date. Today is highlighted.' })),
          seg([{ value: 'revenue', label: 'Revenue' }, { value: 'bookings', label: 'Bookings' }], metric, (v) => { metric = v; prefs.set('dashMetric', v); drawChart(); }, 'Chart measure')),
        chartBox);

      const todayCard = h('section', { class: 'card' },
        h('div', { class: 'card-head' },
          h('div', null, h('h2', { class: 'card-title', text: 'Courts today' }), h('div', { class: 'card-sub', text: `${fmt.range(d.today.open, d.today.close)} · tap a booking for details` })),
          h('a', { class: 'btn btn-sm btn-gray', href: '#/admin/schedule', onclick: () => { schedDate = CFG.now.date; } }, 'Schedule')),
        courtTimeline(d.schedule, d.now, refresh, d.today));
      nodes.push(h('div', { class: 'cols c-3-2' }, chartCard, todayCard));

      const verify = d.toVerify.length
        ? d.toVerify.map((b) => staffBookingCell(b, { showDate: true, onChanged: refresh }))
        : [cell({ ic: 'checkCircle', c: 'green', title: 'All caught up', sub: 'No payment notices waiting to be checked.' })];
      const upcoming = d.upcoming.length
        ? d.upcoming.map((b) => staffBookingCell(b, { showDate: true, onChanged: refresh }))
        : [cell({ ic: 'calendar', c: 'gray', title: 'No upcoming bookings', sub: 'New bookings will show up here.' })];
      nodes.push(h('div', { class: 'cols c-1-1' },
        group({ title: `Payments to verify (${d.payments.toVerify})`, items: verify, foot: 'Players sent these transfer references. Check them against your bank statement, then mark each booking as paid.' }),
        group({ title: 'Up next', items: upcoming })));

      const link = location.origin + '/';
      nodes.push(group({
        title: 'Share your booking site',
        items: [cell({ ic: 'globe', title: link, sub: 'Anyone with this link can see open courts and book.', right: copyBtn(link, 'Link copied') })],
      }));
      return nodes;
    }

    await reload();
    live.handler = () => reload(); // refresh when anyone books, pays or cancels
  }

  // =====================================================================================
  // Staff: SJV Hall payments
  // =====================================================================================

  /**
   * SJV Hall payments: a form (date, amount paid, paid by) with Cancel and Save,
   * and below it a table of every payment with Edit and Delete.
   */
  function openHallPayments() {
    const sh = openSheet({ title: 'SJV Hall Payment' });
    sh.setLeft(plainBtn('Close', () => sh.close()));
    let payments = [];
    let editing = null; // the payment being edited; null when adding a new one

    const errBox = h('div');
    const dateIn = h('input', { type: 'date', 'aria-label': 'Payment date' });
    const amountIn = h('input', { type: 'number', inputmode: 'decimal', min: '0.01', step: '0.01', placeholder: '0.00', class: 'right' });
    const paidByIn = h('input', { maxlength: 80, placeholder: 'Name', autocomplete: 'off' });
    const formBox = h('div');
    const saveBtn = h('button', { type: 'submit', class: 'btn btn-filled', text: 'Save' });
    const cancelBtn = h('button', { type: 'button', class: 'btn btn-gray', text: 'Cancel', onclick: cancel });
    const listBox = h('div', null, loading());
    const form = h('form', { novalidate: true, class: 'stack hall-form', onsubmit: save },
      errBox, formBox, h('div', { class: 'btn-row' }, cancelBtn, saveBtn));
    sh.setBody(form, listBox);

    // Backdrop taps don't close the window while the form has unsaved input.
    const dirty = () => (editing
      ? dateIn.value !== editing.date || Number(amountIn.value) !== editing.amount || paidByIn.value.trim() !== editing.paidBy
      : Boolean(amountIn.value || paidByIn.value.trim()));
    form.addEventListener('input', () => { sh.guard = dirty(); });

    function drawForm() {
      formBox.replaceChildren(group({
        title: editing ? 'Edit payment' : 'New payment',
        items: [field('Date', dateIn), field('Amount paid ($)', amountIn), field('Paid by', paidByIn)],
      }));
      sh.guard = dirty();
    }

    function fill(p) {
      editing = p;
      dateIn.value = p ? p.date : clubNow().date;
      amountIn.value = p ? String(p.amount) : '';
      paidByIn.value = p ? p.paidBy : '';
      errBox.replaceChildren();
      drawForm();
      drawList();
    }

    function cancel() {
      // Cancel an edit and go back to adding; otherwise close the window.
      if (editing) fill(null);
      else sh.close();
    }

    async function save(e) {
      e.preventDefault();
      const amount = Number(amountIn.value);
      const problem = !dateIn.value ? [dateIn, 'Choose the payment date.']
        : !(amount > 0) ? [amountIn, 'Enter the amount paid.']
          : !paidByIn.value.trim() ? [paidByIn, 'Enter who paid.'] : null;
      if (problem) {
        errBox.replaceChildren(banner('alert', problem[1], 'error'));
        problem[0].focus();
        return;
      }
      const body = { date: dateIn.value, amount, paidBy: paidByIn.value.trim() };
      saveBtn.disabled = true;
      try {
        const r = editing
          ? await api(`/api/admin/hall-payments/${editing.id}`, { method: 'PATCH', body })
          : await api('/api/admin/hall-payments', { method: 'POST', body });
        toast(editing ? 'Payment updated' : 'Payment saved');
        payments = r.payments;
        fill(null);
      } catch (err) {
        if (err.status === 401) return handleError(err);
        errBox.replaceChildren(banner('alert', err.message, 'error'));
      } finally {
        saveBtn.disabled = false;
      }
    }

    async function remove(p) {
      const ok = await confirmDialog({
        title: 'Delete this payment?',
        message: `${fmt.dollars(p.amount)} paid by ${p.paidBy} on ${fmt.dateLong(p.date)}.`,
        confirm: 'Delete', destructive: true,
      });
      if (!ok) return;
      try {
        const r = await api(`/api/admin/hall-payments/${p.id}`, { method: 'DELETE' });
        payments = r.payments;
        toast('Payment deleted');
        if (editing && editing.id === p.id) fill(null);
        else drawList();
      } catch (err) { handleError(err); }
    }

    function drawList() {
      if (!payments.length) {
        listBox.replaceChildren(group({ title: 'Payments', items: [cell({ ic: 'hall', c: 'gray', title: 'No payments yet', sub: 'Saved payments are listed here.' })] }));
        return;
      }
      const total = payments.reduce((n, p) => n + p.amount, 0);
      const when = (p) => `${fmt.dollars(p.amount)} on ${fmt.dateYear(p.date)}`;
      listBox.replaceChildren(h('section', { class: 'group' },
        h('h2', { class: 'group-title' }, h('span', { text: `Payments (${payments.length})` })),
        h('div', { class: 'rtable-wrap hall-wrap' }, h('table', { class: 'rtable compact hall-table' },
          h('thead', null, h('tr', null,
            h('th', { text: 'Date' }), h('th', { class: 'hall-by', text: 'Paid by' }), h('th', { class: 'r', text: 'Amount' }),
            h('th', null, h('span', { class: 'sr-only', text: 'Actions' })))),
          h('tbody', null, payments.map((p) => h('tr', { class: editing && editing.id === p.id ? 'editing' : null },
            h('td', null, h('div', { class: 'nowrap', text: fmt.dateYear(p.date) }), h('div', { class: 'hall-by-sub', text: p.paidBy })),
            h('td', { class: 'hall-by', text: p.paidBy }),
            h('td', { class: 'r nowrap', text: fmt.dollars(p.amount) }),
            h('td', { class: 'hall-actions' }, h('div', { class: 'hall-btns' },
              h('button', { type: 'button', class: 'btn btn-sm btn-gray', text: 'Edit', 'aria-label': `Edit ${when(p)}`, onclick: () => { fill(p); sh.body.scrollTop = 0; dateIn.focus(); } }),
              h('button', { type: 'button', class: 'btn btn-sm btn-gray del', text: 'Delete', 'aria-label': `Delete ${when(p)}`, onclick: () => remove(p) })))))),
          h('tfoot', null, h('tr', null,
            h('td', { text: 'Total' }), h('td', { class: 'hall-by' }), h('td', { class: 'r nowrap', text: fmt.dollars(total) }), h('td')))))));
    }

    fill(null);
    api('/api/admin/hall-payments')
      .then((r) => { payments = r.payments; drawList(); })
      .catch((err) => {
        if (err.status === 401) return handleError(err);
        listBox.replaceChildren(banner('alert', err.message, 'error'));
      });
  }

  function tile(ic, label, value, sub, extra, attn) {
    return h('div', { class: 'tile' + (attn ? ' attn' : '') },
      h('div', { class: 'tile-label' }, icon(ic), label),
      h('div', { class: 'tile-value', text: value }),
      sub ? h('div', { class: 'tile-sub', text: sub }) : null,
      extra);
  }

  /** Today's courts from opening to closing time (`hours`: today's { open, close }). */
  function courtTimeline(schedule, now, onChanged, hours) {
    const open = toMin(hours.open);
    const close = toMin(hours.close);
    const span = close - open;
    const rows = schedule.map((c) => {
      const track = h('div', { class: 'tl-track' });
      for (const b of c.items) {
        const s = Math.max(open, toMin(b.start));
        const e = Math.min(close, toMin(b.end));
        const st = STATUS[b.status] || STATUS.confirmed;
        track.append(h('button', {
          type: 'button', class: 'tl-seg', 'data-c': b.status === 'confirmed' ? null : st.c,
          style: { left: `calc(${((s - open) / span) * 100}% + 1px)`, width: `calc(${((e - s) / span) * 100}% - 2px)` },
          'aria-label': `${b.name}, ${fmt.range(b.start, b.end)}, ${st.label}`, title: `${b.name} · ${fmt.range(b.start, b.end)}`,
          onclick: () => openStaffDetail(b, onChanged),
        }));
      }
      if (now.minutes > open && now.minutes < close) track.append(h('span', { class: 'tl-now', style: { left: `${((now.minutes - open) / span) * 100}%` }, 'aria-hidden': 'true' }));
      return h('div', { class: 'tl-row' }, h('span', { class: 'k', text: c.name }), track, h('span', { class: 'v', text: fmt.pct(c.utilization) }));
    });
    const mid = open + Math.round(span / 2 / 60) * 60;
    return h('div', null,
      h('div', { class: 'tl' }, rows,
        h('div', { class: 'tl-axis', 'aria-hidden': 'true' }, h('span'), h('div', null, h('span', { text: fmt.time(hours.open) }), h('span', { text: fmt.time(toTime(mid)) }), h('span', { text: fmt.time(hours.close) })), h('span'))),
      h('div', { class: 'tl-legend' },
        h('span', null, h('i', { style: { '--c': 'var(--tint)' } }), 'Confirmed'),
        h('span', null, h('i', { style: { '--c': 'var(--orange)' } }), 'Pending'),
        h('span', null, h('i', { style: { '--c': 'var(--blue)' } }), 'Checked in'),
        h('span', null, h('i', { style: { '--c': 'var(--indigo)' } }), 'Blocked')));
  }

  // =====================================================================================
  // Staff: Schedule
  // =====================================================================================

  let schedDate = null;

  async function viewSchedule(main) {
    const today = CFG.now.date;
    if (!schedDate) schedDate = today;
    const pg = page(main, {
      title: 'Schedule',
      right: iconBtn('plus', 'New booking', () => openStaffEditor({ init: { date: schedDate }, onSaved: () => load() })),
    });
    const title = h('h2', { class: 'datebar-title' });
    const strip = dateStrip({ from: addDays(today, -14), to: addDays(today, Math.max(60, CFG.advanceDays)), value: schedDate, onPick: (d) => { schedDate = d; load(); } });
    const picker = datePicker({ value: schedDate, onPick: (d) => { schedDate = d; load(); } });
    const todayBtn = h('button', { type: 'button', class: 'btn btn-sm btn-gray', text: 'Today', onclick: () => { schedDate = CFG.now.date; load(); } });
    const searchIn = h('input', { type: 'search', placeholder: 'Search name, email, phone or reference', 'aria-label': 'Search all bookings' });
    const summary = h('div', { class: 'subtitle' });
    const box = h('div', { class: 'stack', style: { gap: '12px' } }, loading());
    const dayControls = h('div', { class: 'stack', style: { gap: '12px' } },
      h('section', { class: 'datebar', 'aria-label': 'Date' }, h('div', { class: 'datebar-row' }, title, h('div', { class: 'inline-actions' }, todayBtn, picker)), strip),
      summary);
    pg.content.append(
      h('div', { class: 'search' }, icon('search'), searchIn),
      dayControls,
      box);

    let data = [];
    let now = CFG.now;
    let reqId = 0;
    async function load(quiet) {
      const id = ++reqId;
      title.textContent = dayLabel(schedDate);
      strip.set(schedDate);
      picker.set(schedDate);
      if (!quiet) box.replaceChildren(loading());
      try {
        const r = await api(`/api/admin/bookings?from=${schedDate}&to=${schedDate}&type=all`);
        if (id !== reqId) return;
        data = r.bookings;
        now = r.now;
        draw();
      } catch (err) {
        if (id === reqId) handleError(err);
      }
    }

    function draw() {
      if (searchIn.value.trim()) return; // search results are showing instead
      const active = data.filter((b) => b.status !== 'cancelled');
      const bookings = active.filter((b) => b.type === 'booking');
      const cancelled = data.length - active.length;
      const revenue = bookings.reduce((n, b) => n + b.amount, 0);
      const hours = bookings.reduce((n, b) => n + (b.hours || 0), 0);
      summary.replaceChildren(
        h('span', { text: `${bookings.length} booking${bookings.length === 1 ? '' : 's'}` }),
        h('span', { text: sessionText(schedDate) }),
        h('span', { text: `${fmt.hours(hours)} booked hours` }),
        h('span', { text: fmt.money(revenue) }),
        ...(cancelled ? [h('span', { text: `${cancelled} cancelled` })] : []));
      const closed = closedOn(schedDate);
      const notice = closed ? closedBanner(schedDate, closed.name) : null;
      box.replaceChildren(...[notice, staffCourtDay({
        date: schedDate, now, bookings: data, closedName: closed && closed.name,
        onAdd: (court) => openStaffEditor({ init: { date: schedDate, court }, onSaved: () => load() }),
        onChanged: () => load(),
      })].filter(Boolean));
    }

    let searchTimer;
    let searchId = 0;
    let quietSearch = false;
    searchIn.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(async () => {
        const q = searchIn.value.trim();
        const id = ++searchId;
        if (!q) {
          dayControls.hidden = false;
          draw();
          return;
        }
        dayControls.hidden = true;
        if (!quietSearch) box.replaceChildren(loading());
        quietSearch = false;
        try {
          const r = await api(`/api/admin/bookings?type=booking&sort=desc&q=${encodeURIComponent(q)}`);
          if (id !== searchId) return;
          const rows = r.bookings.slice(0, 100);
          box.replaceChildren(rows.length
            ? group({ title: `${r.bookings.length} match${r.bookings.length === 1 ? '' : 'es'}${r.bookings.length > 100 ? ' (showing 100)' : ''}`, items: rows.map((b) => staffBookingCell(b, { showDate: true, onChanged: () => searchIn.dispatchEvent(new Event('input')) })) })
            : emptyState('search', 'No matches', `Nothing matches “${q}”. Try a name, email, phone number or reference.`));
        } catch (err) { handleError(err); }
      }, 250);
    });

    await load();
    // Refresh quietly when anyone changes a booking: the open day, or the search results.
    live.handler = () => {
      if (!searchIn.value.trim()) return load(true);
      quietSearch = true;
      searchIn.dispatchEvent(new Event('input'));
    };
  }

  // =====================================================================================
  // Staff: Reports
  // =====================================================================================

  const PERIODS = [
    ['today', 'Today'], ['yesterday', 'Yesterday'], ['week', 'This week'], ['last7', 'Last 7 days'], ['month', 'This month'],
    ['lastmonth', 'Last month'], ['last30', 'Last 30 days'], ['next30', 'Next 30 days'], ['year', 'This year'], ['all', 'All time'], ['custom', 'Custom range'],
  ];
  const STATUS_FILTERS = [
    ['', 'All statuses'], ['active', 'Active (not cancelled)'], ['pending', 'Pending payment'], ['confirmed', 'Confirmed'],
    ['completed', 'Checked in'], ['no_show', 'No-show'], ['cancelled', 'Cancelled'],
  ];
  const REPORT_DEFAULTS = { period: 'month', court: '', status: '', payment: '', method: '', plus: '', source: '', blocks: false, q: '', from: '', to: '', sort: 'asc' };
  const SOURCE_FILTERS = [['', 'Any channel'], ['online', 'Online (players)'], ['walkin', 'Walk-in'], ['staff', 'Staff (phone or desk)']];

  function periodRange(F) {
    const today = CFG.now.date;
    const monthStart = today.slice(0, 8) + '01';
    switch (F.period) {
      case 'today': return [today, today];
      case 'yesterday': return [addDays(today, -1), addDays(today, -1)];
      case 'week': {
        const s = addDays(today, -((weekdayOf(today) + 6) % 7));
        return [s, addDays(s, 6)];
      }
      case 'last7': return [addDays(today, -6), today];
      case 'month': return [monthStart, addDays(addMonths(monthStart, 1), -1)];
      case 'lastmonth': return [addMonths(monthStart, -1), addDays(monthStart, -1)];
      case 'last30': return [addDays(today, -29), today];
      case 'next30': return [today, addDays(today, 29)];
      case 'year': return [today.slice(0, 4) + '-01-01', today.slice(0, 4) + '-12-31'];
      case 'custom': return [F.from || today, F.to || F.from || today];
      default: return [null, null];
    }
  }

  function reportQuery(F) {
    const [from, to] = periodRange(F);
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    if (F.court) q.set('court', F.court);
    if (F.status) q.set('status', F.status === 'active' ? 'pending,confirmed,completed,no_show' : F.status);
    if (F.payment) q.set('payment', F.payment);
    if (F.method) q.set('method', F.method);
    if (F.plus) q.set('plus', F.plus);
    if (F.source) q.set('source', F.source);
    q.set('type', F.blocks ? 'all' : 'booking');
    if (F.q) q.set('q', F.q);
    q.set('sort', F.sort);
    return q.toString();
  }

  const activeFilterCount = (F) => [F.period !== 'all', F.court, F.status, F.payment, F.method, F.plus, F.source, F.q].filter(Boolean).length;

  async function viewReports(main) {
    const F = { ...REPORT_DEFAULTS, ...prefs.get('reportFilters', {}) };
    if (F.court && !CFG.courts.some((c) => String(c.id) === String(F.court))) F.court = '';
    const pg = page(main, { title: 'Reports' });
    const filtersBox = h('div', { class: 'report-filters no-print' });
    const scope = h('div', { class: 'filter-summary' });
    const results = h('div', { class: 'stack' }, loading());
    pg.content.append(h('div', { class: 'report-layout' }, filtersBox, h('div', { class: 'report-results stack' }, scope, results)));
    let metric = 'bookings';
    let shown = 50;

    const persist = () => prefs.set('reportFilters', F);

    function buildFilters() {
      const on = (key, rebuild) => (ev) => {
        F[key] = ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value;
        persist();
        if (rebuild) buildFilters();
        load();
      };
      const items = [
        field('Period', select(PERIODS.map(([v, l]) => ({ value: v, label: l })), F.period, { onchange: on('period', true), id: 'rf-period' })),
      ];
      if (F.period === 'custom') {
        const [from, to] = periodRange(F);
        items.push(field('From', h('input', { type: 'date', value: from, id: 'rf-from', onchange: (ev) => { F.from = ev.target.value; persist(); load(); } })));
        items.push(field('To', h('input', { type: 'date', value: to, id: 'rf-to', onchange: (ev) => { F.to = ev.target.value; persist(); load(); } })));
      }
      if (CFG.courts.length > 1) {
        items.push(h('div', { class: 'seg-cell' }, seg([{ value: '', label: 'All' }, ...CFG.courts.map((c) => ({ value: String(c.id), label: c.name }))], String(F.court || ''), (v) => { F.court = v; persist(); load(); }, 'Court')));
      }
      items.push(
        field('Status', select(STATUS_FILTERS.map(([v, l]) => ({ value: v, label: l })), F.status, { onchange: on('status'), id: 'rf-status' })),
        field('Payment', select([['', 'Any payment'], ['unpaid', 'Unpaid'], ['submitted', 'To verify'], ['paid', 'Paid'], ['refunded', 'Refunded']].map(([v, l]) => ({ value: v, label: l })), F.payment, { onchange: on('payment'), id: 'rf-payment' })),
        field('Method', select([['', 'Any method'], ['bank', 'Bank transfer'], ['venue', 'Pay at venue']].map(([v, l]) => ({ value: v, label: l })), F.method, { onchange: on('method'), id: 'rf-method' })),
        field('PLUS reserve', select([['', 'Any rate'], ['yes', 'PLUS reserve only'], ['no', 'Regular rate only']].map(([v, l]) => ({ value: v, label: l })), F.plus, { onchange: on('plus'), id: 'rf-plus' })),
        field('Channel', select(SOURCE_FILTERS.map(([v, l]) => ({ value: v, label: l })), F.source, { onchange: on('source'), id: 'rf-source' })),
        cell({ title: 'Include blocked time', right: toggle(F.blocks, (v) => { F.blocks = v; persist(); load(); }, 'Include blocked time', 'rf-blocks') }));
      let t;
      const searchIn = h('input', {
        type: 'search', value: F.q, placeholder: 'Name, email, phone or reference', id: 'rf-q',
        oninput: (ev) => { clearTimeout(t); t = setTimeout(() => { F.q = ev.target.value.trim(); persist(); load(); }, 300); },
      });
      items.push(field('Search', searchIn));
      filtersBox.replaceChildren(group({ title: 'Filters', items }));
    }

    function resetFilters(toAll) {
      Object.assign(F, REPORT_DEFAULTS, toAll ? { period: 'all' } : {});
      persist();
      buildFilters();
      load();
    }

    let reqId = 0;
    async function load(quiet) {
      const id = ++reqId;
      const qs = reportQuery(F);
      if (!quiet) results.replaceChildren(loading());
      try {
        const r = await api('/api/admin/reports?' + qs);
        if (id !== reqId) return;
        if (!quiet) shown = 50;
        drawScope(r, qs);
        drawResults(r);
      } catch (err) {
        if (id === reqId) handleError(err);
      }
    }

    function drawScope(r, qs) {
      const n = activeFilterCount(F);
      const s = r.summary;
      const range = F.period === 'all' && !r.rows.length ? 'All dates' : s.from === s.to ? fmt.dateMed(s.from) : `${fmt.dateMed(s.from)} – ${fmt.dateMed(s.to)}`;
      scope.replaceChildren(
        h('div', { class: 'what' },
          n ? h('span', { class: 'scope-pill' }, icon('sliders'), `${n} filter${n > 1 ? 's' : ''} on`) : h('span', { class: 'scope-pill all' }, 'All records, no filters'),
          h('span', null, h('strong', { text: `${fmt.num(s.bookings)} booking${s.bookings === 1 ? '' : 's'}` }), ` · ${range}`)),
        h('div', { class: 'inline-actions no-print' },
          n ? h('button', { type: 'button', class: 'btn btn-sm btn-gray', onclick: () => resetFilters(true) }, 'Show All Records') : h('button', { type: 'button', class: 'btn btn-sm btn-gray', onclick: () => resetFilters(false) }, 'This Month'),
          h('a', { class: 'btn btn-sm btn-tinted', href: '/api/admin/reports.csv?' + qs, download: '' }, icon('download'), 'Export CSV'),
          h('button', { type: 'button', class: 'btn btn-sm btn-tinted', onclick: () => window.print() }, icon('print'), 'Print')));
    }

    function drawResults(r) {
      const s = r.summary;
      const cur = r.currency;
      if (!r.rows.length) {
        results.replaceChildren(...[
          emptyState('chart', 'No bookings match these filters', 'Try a different period, or show all records.',
            h('button', { type: 'button', class: 'btn btn-tinted', onclick: () => resetFilters(true) }, 'Show All Records')),
          r.hall && r.hall.count ? hallSection(r) : null,
        ].filter(Boolean));
        return;
      }
      const tiles = h('div', { class: 'tiles t6' },
        tile('calendar', 'Bookings', fmt.num(s.active), `${s.cancelled} cancelled · ${s.noShows} no-show${s.noShows === 1 ? '' : 's'}`),
        tile('clock', 'Booked hours', fmt.hours(s.hours), `${fmt.num(s.players)} player visits`),
        tile('tag', 'Booked value', fmt.money(s.billed, cur), `Average ${fmt.money(s.averageValue, cur)}`),
        tile('cash', 'Collected', fmt.money(s.collected, cur), s.refunded ? `${fmt.money(s.refunded, cur)} refunded` : 'Paid bookings'),
        tile('alert', 'Outstanding', fmt.money(s.outstanding, cur), 'Unpaid or awaiting check', null, s.outstanding > 0),
        tile('court', 'Court use', fmt.pct(s.utilization), `${s.days} day${s.days === 1 ? '' : 's'} of opening hours`));

      const chartBox = h('div');
      const unitLabel = r.series.unit === 'day' ? 'day' : 'month';
      const drawChart = () => chartBox.replaceChildren(barChart({
        points: r.series.points,
        value: (p) => (metric === 'revenue' ? p.billed : p.active),
        label: (p) => (r.series.unit === 'day' ? fmt.dateShort(p.key) : fmt.monthShort(p.key)),
        tipTitle: (p) => (r.series.unit === 'day' ? fmt.date(p.key) : fmt.month(p.key)),
        fmtValue: (v) => (metric === 'revenue' ? fmt.money(v, cur) : `${v} booking${v === 1 ? '' : 's'}`),
        fmtAxis: (v) => (metric === 'revenue' ? fmt.moneyAxis(v, cur) : String(v)),
        integer: metric !== 'revenue',
        title: `${metric === 'revenue' ? 'Booked value' : 'Bookings'} by ${unitLabel}`,
      }));
      drawChart();
      const chartCard = h('section', { class: 'card' },
        h('div', { class: 'card-head' },
          h('div', null, h('h2', { class: 'card-title', text: `By ${unitLabel}` }), h('div', { class: 'card-sub', text: 'Cancelled bookings are left out.' })),
          h('div', { class: 'no-print' }, seg([{ value: 'bookings', label: 'Bookings' }, { value: 'revenue', label: 'Value' }], metric, (v) => { metric = v; drawChart(); }, 'Chart measure'))),
        chartBox);

      const totalHours = r.byCourt.reduce((n, g) => n + g.hours, 0);
      const courtTable = h('div', { class: 'rtable-wrap court-wrap' }, h('table', { class: 'rtable compact court-table' },
        h('thead', null, h('tr', null, h('th', { text: 'Court' }), h('th', { class: 'r', text: 'Bookings' }), h('th', { class: 'r', text: 'Booked hrs' }), h('th', { class: 'r', text: 'Value' }), h('th', { class: 'r', text: 'Collected' }))),
        h('tbody', null, r.byCourt.map((g) => h('tr', null,
          h('td', null, h('div', { text: g.name }), h('div', { class: 'meter', style: { maxWidth: '160px', marginTop: '6px' } }, h('span', { style: { width: totalHours ? `${(g.hours / totalHours) * 100}%` : '0' } }))),
          // data-label names each figure when the table turns into cards on narrow screens.
          h('td', { class: 'r', 'data-label': 'Bookings', text: fmt.num(g.active) }), h('td', { class: 'r', 'data-label': 'Booked hrs', text: fmt.hours(g.hours) }),
          h('td', { class: 'r', 'data-label': 'Value', text: fmt.money(g.billed, cur) }), h('td', { class: 'r', 'data-label': 'Collected', text: fmt.money(g.collected, cur) }))))));

      const byMethod = r.byMethod.map((g) => ({ ...g, label: METHOD[g.key] }));
      const dayItems = [1, 2, 3, 4, 5, 6, 0].map((d) => ({ k: fmt.dowLong(d), v: r.byWeekday.find((x) => x.day === d).bookings }));

      const sorted = r.rows;
      const visible = sorted.slice(0, shown);
      const desktop = h('div', { class: 'rows-desktop rtable-wrap' }, h('table', { class: 'rtable' },
        h('thead', null, h('tr', null, ['Date', 'Session', 'Court', 'Name', 'Players', 'Booked hrs', 'Status', 'Payment', 'Amount', 'Reference'].map((t, i) => h('th', { class: [4, 5, 8].includes(i) ? 'r' : null, text: t })))),
        h('tbody', null, visible.map((b) => h('tr', {
          tabindex: '0',
          onclick: () => openStaffDetail(b, () => load()),
          onkeydown: (ev) => { if (ev.key === 'Enter') openStaffDetail(b, () => load()); },
        },
        h('td', { class: 'nowrap', text: fmt.date(b.date) }), h('td', { class: 'nowrap', text: fmt.range(b.start, b.end) }), h('td', { class: 'nowrap', text: courtName(b.court) }),
        h('td', { text: b.name }), h('td', { class: 'r', text: b.type === 'booking' ? String(b.players) : '—' }),
        h('td', { class: 'r', text: b.type === 'booking' ? fmt.hours(b.hours) : '—' }),
        h('td', null, h('span', { class: 'chips' }, chip(STATUS, b.status), plusChip(b), walkInChip(b))), h('td', null, b.type === 'booking' ? chip(PAY, b.paymentStatus) : '—'),
        h('td', { class: 'r', text: fmt.money(b.amount, b.currency) }), h('td', { class: 'mono nowrap', text: b.ref })))),
        h('tfoot', null, h('tr', null,
          h('td', { colspan: '4', text: `${fmt.num(sorted.length)} row${sorted.length === 1 ? '' : 's'}${sorted.length > shown ? `, showing ${shown}` : ''}` }),
          h('td', { class: 'r', text: fmt.num(s.players) }), h('td', { class: 'r', text: fmt.hours(s.hours) }), h('td'), h('td'),
          h('td', { class: 'r', text: fmt.money(s.billed, cur) }), h('td')))));
      const mobile = h('div', { class: 'rows-mobile' }, h('div', { class: 'list' }, visible.map((b) => staffBookingCell(b, { showDate: true, onChanged: () => load() }))));
      const more = sorted.length > shown
        ? h('button', { type: 'button', class: 'btn btn-gray no-print', style: { justifySelf: 'center' }, onclick: () => { shown += 100; drawResults(r); } }, `Show ${Math.min(100, sorted.length - shown)} More`)
        : null;

      results.replaceChildren(
        tiles,
        chartCard,
        h('div', { class: 'cols c-1-1' },
          h('section', { class: 'group' }, h('h2', { class: 'group-title', text: 'By court' }), courtTable),
          h('div', { class: 'stack' },
            breakdownList('By status', r.byStatus.map((g) => ({ title: chip(STATUS, g.key), g })), cur),
            breakdownList('By payment', [
              ...r.byPayment.map((g) => ({ title: chip(PAY, g.key), g })),
              ...byMethod.map((g) => ({ title: g.label, g })),
            ], cur),
            breakdownList('By rate', (r.byRate || []).map((g) => ({ title: g.key === 'plus' ? plusChip({ plus: true }) : 'Regular rate', g })), cur),
            breakdownList('By channel', (r.bySource || []).map((g) => ({
              title: g.key === 'walkin' ? walkInChip({ source: 'walkin' }) : (SOURCE_FILTERS.find(([v]) => v === g.key) || [g.key, g.key])[1],
              g,
            })), cur))),
        // Side by side where there's room; stacked on phones.
        h('div', { class: 'cols c-1-1' },
          h('section', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', { class: 'card-title', text: 'By day of week' })), hbars(dayItems)),
          hallSection(r)),
        h('section', { class: 'group stack', style: { gap: '10px' } },
          h('div', { class: 'filter-summary' },
            h('h2', { class: 'group-title big', style: { padding: '0' }, text: `Booking list (${fmt.num(sorted.length)})` }),
            h('div', { class: 'no-print' }, seg([{ value: 'asc', label: 'Oldest first' }, { value: 'desc', label: 'Newest first' }], F.sort, (v) => { F.sort = v; persist(); load(); }, 'Sort order'))),
          desktop, mobile, more));
    }

    // SJV Hall payments dated in the report's period (the other filters are about bookings),
    // as a list that suits every screen size, with the total at the bottom.
    function hallSection(r) {
      const hall = r.hall || { payments: [], count: 0, total: 0 };
      const amount = (n) => h('span', { class: 'num', style: { color: 'var(--label)' }, text: fmt.dollars(n) });
      return group({
        title: `SJV Hall payments (${fmt.num(hall.count)})`,
        aside: h('button', { type: 'button', class: 'btn btn-sm btn-gray no-print', text: 'Manage', onclick: () => openHallPayments() }),
        items: hall.count
          ? [
            ...hall.payments.map((p) => cell({ ic: 'hall', c: 'orange', title: p.paidBy, sub: fmt.dateYear(p.date), value: amount(p.amount) })),
            cell({ title: h('strong', { text: 'Total' }), value: fmt.dollars(hall.total), strong: true, cls: 'hall-total' }),
          ]
          : [cell({ ic: 'hall', c: 'gray', title: 'No payments in this period', sub: 'Record SJV Hall payments with Manage, or in Settings.' })],
        foot: F.period === 'all' ? 'All SJV Hall payments.' : 'Payments dated in this report’s period. Court, status and other filters apply to bookings only.',
      });
    }

    // Count and value per group. Cancelled bookings carry no booked value; refunds show what was returned.
    function breakdownList(title, entries, cur) {
      const amountOf = (g) => (g.key === 'refunded' ? g.refunded : g.billed);
      return group({
        title,
        items: entries.length
          ? entries.map(({ title: t, g }) => cell({
            title: t,
            value: h('span', { class: 'num', style: { color: 'var(--label)' } },
              `${fmt.num(g.bookings)}${amountOf(g) ? ` · ${fmt.money(amountOf(g), cur)}` : ''}`),
          }))
          : [cell({ title: 'Nothing to show' })],
      });
    }

    buildFilters();
    await load();
    live.handler = () => load(true); // keep figures current as bookings come in
  }

  // =====================================================================================
  // Staff: Settings
  // =====================================================================================

  let settingsFocus = null;

  async function viewSettings(main) {
    const pg = page(main, { title: 'Settings' });
    const box = h('div', { class: 'stack' }, loading());
    pg.content.append(box);
    const res = await api('/api/admin/settings');
    let saved = res.settings;
    let D = JSON.parse(JSON.stringify(saved));
    const errBox = h('div');

    const saveBtn = h('button', { type: 'button', class: 'btn btn-filled btn-sm', text: 'Save Changes', onclick: () => save() });
    const discardBtn = h('button', { type: 'button', class: 'btn btn-gray btn-sm', text: 'Discard', onclick: () => { D = JSON.parse(JSON.stringify(saved)); changed(); buildAll(); } });
    const savebar = h('div', { class: 'savebar', role: 'region', 'aria-label': 'Unsaved changes' }, h('span', { class: 'msg', text: 'You have unsaved changes' }), h('div', { class: 'btns' }, discardBtn, saveBtn));
    savebar.hidden = true;
    main.append(savebar);

    const isDirty = () => JSON.stringify(D) !== JSON.stringify(saved);
    function changed() {
      const dirty = isDirty();
      savebar.hidden = !dirty;
      window.onbeforeunload = dirty ? (ev) => { ev.preventDefault(); ev.returnValue = ''; } : null;
      leaveGuard = dirty ? () => confirmDialog({ title: 'Discard changes?', message: 'Your settings changes haven’t been saved.', confirm: 'Discard', destructive: true }) : null;
    }

    // Each section can be rebuilt on its own, keeping focus on the control that changed it.
    const slots = {};
    function slot(name, fn) {
      const el = h('div');
      slots[name] = () => {
        const focusId = document.activeElement && document.activeElement.id;
        el.replaceChildren(fn());
        if (focusId) { const f = document.getElementById(focusId); if (f && el.contains(f)) f.focus(); }
      };
      slots[name]();
      return el;
    }
    const text = (key, attrs = {}) => h(attrs.multiline ? 'textarea' : 'input', {
      id: 'set-' + key, maxlength: attrs.maxlength || 80, placeholder: attrs.placeholder, type: attrs.type, inputmode: attrs.inputmode, 'aria-label': attrs.label,
      value: D[key], oninput: (ev) => { D[key] = ev.target.value; changed(); },
    });
    const number = (key, { min = 0, max, step = 1, decimal } = {}) => h('input', {
      id: 'set-' + key, type: 'number', min, max, step: decimal ? '0.01' : step, inputmode: decimal ? 'decimal' : 'numeric', class: 'right',
      value: String(D[key]), oninput: (ev) => { D[key] = ev.target.value === '' ? '' : Number(ev.target.value); changed(); },
    });
    const timeSel = (key, from, to, rebuild, label) => select(timeOptions(from, to), D[key], {
      id: 'set-' + key, 'aria-label': label || null, onchange: (ev) => { D[key] = ev.target.value; changed(); if (rebuild) slots[rebuild](); },
    });

    function clubSection() {
      return group({
        title: 'Club',
        items: [
          field('Club name', text('facilityName')),
          field('Address', text('address', { maxlength: 160, placeholder: 'Shown to players' })),
          field('Phone', text('contactPhone', { maxlength: 40, type: 'tel', placeholder: 'Optional' })),
          field('Email', text('contactEmail', { maxlength: 120, type: 'email', placeholder: 'Optional' })),
          field('Time zone', (() => { const s = timeZoneSelect(D.timezone); s.id = 'set-timezone'; s.addEventListener('change', (ev) => { D.timezone = ev.target.value; changed(); }); s.addEventListener('input', (ev) => { D.timezone = ev.target.value; changed(); }); return s; })()),
          field('Announcement', text('announcement', { multiline: true, maxlength: 300, placeholder: 'Optional message shown at the top of the booking page' }), { stack: true }),
        ],
        foot: 'Players see these details on the booking site. The time zone decides what “today” means.',
      });
    }

    function courtsSection() {
      const count = stepper({ id: 'set-courts', value: D.courtCount, min: res.limits.minCourts, max: res.limits.maxCourts, label: 'Courts', onChange: (v) => { D.courtCount = v; changed(); slots.courts(); } });
      const names = [];
      for (let i = 0; i < D.courtCount; i += 1) {
        names.push(field(`Court ${i + 1} name`, h('input', {
          id: 'set-court-' + i, maxlength: 30, value: D.courtNames[i],
          oninput: (ev) => { D.courtNames[i] = ev.target.value; changed(); },
        })));
      }
      return group({
        title: 'Courts',
        items: [cell({ ic: 'court', title: 'Number of courts', value: count.valueEl, right: count }), ...names],
        foot: `Choose between ${res.limits.minCourts} and ${res.limits.maxCourts} courts. Players can only book the courts listed here. You can’t remove a court that still has upcoming bookings.`,
      });
    }

    function hoursSection() {
      // Weekdays are Monday to Thursday; weekends are Friday to Sunday.
      const span = (key) => toMin(D[key + 'Close']) - toMin(D[key + 'Open']);
      const dayRows = (key, title, sub, c) => [
        cell({ ic: 'clock', c, title, sub, value: span(key) >= 60 ? fmt.dur(span(key)) : null }),
        field('Opens', timeSel(key + 'Open', 0, 23 * 60, 'hours', `${title} opening time`)),
        field('Closes', timeSel(key + 'Close', 60, 1440, 'hours', `${title} closing time`)),
      ];
      const short = [['weekday', 'weekdays'], ['weekend', 'weekends']].filter(([k]) => span(k) < 60).map(([, n]) => n);

      // Minimum players: 1, 2, 3 or 4. Maximum players: 5 or 6.
      const rulesFoot = h('p', { class: 'group-foot' });
      const setRulesFoot = () => {
        rulesFoot.textContent = `Online bookings need ${D.minPlayers} to ${D.maxPlayers} players per court; walk-ins aren’t limited. ` +
          'Release unpaid: bank transfer bookings with no payment after this many hours are cancelled automatically. Enter 0 to keep them until you cancel them.';
      };
      setRulesFoot();
      const pick = (key, values, label) => {
        const el = seg(values.map((v) => ({ value: v, label: String(v) })), D[key], (v) => { D[key] = v; changed(); setRulesFoot(); }, label);
        el.classList.add('pick');
        el.id = 'set-' + key;
        return el;
      };
      return h('div', { class: 'stack' },
        group({
          title: 'Opening hours',
          items: [
            ...dayRows('weekday', 'Weekdays', 'Monday to Thursday', 'tint'),
            ...dayRows('weekend', 'Weekends', 'Friday to Sunday', 'indigo'),
          ],
          foot: short.length
            ? `Closing time must be at least one hour after opening time (${short.join(' and ')}).`
            : 'A booking reserves a court for that day’s session, from opening to closing time. Customers pay for the hours they book: from 1 hour up to the length of the session, in half hours.',
        }),
        group({
          title: 'Booking rules',
          items: [
            cell({ title: 'Minimum players', sub: 'Online, per court', right: pick('minPlayers', [1, 2, 3, 4], 'Minimum players per court') }),
            cell({ title: 'Maximum players', sub: 'Online, per court', right: pick('maxPlayers', [5, 6], 'Maximum players per court') }),
            field('Book ahead', h('span', { style: { display: 'flex', alignItems: 'center', gap: '8px', flex: '1' } }, number('advanceDays', { min: 1, max: 365 }), h('span', { class: 'unit', text: 'days' }))),
            field('Cancel online', h('span', { style: { display: 'flex', alignItems: 'center', gap: '8px', flex: '1' } }, number('cancelCutoffHours', { min: 0, max: 168 }), h('span', { class: 'unit', text: 'hrs before' }))),
            field('Release unpaid', h('span', { style: { display: 'flex', alignItems: 'center', gap: '8px', flex: '1' } }, number('autoCancelHours', { min: 0, max: 168 }), h('span', { class: 'unit', text: 'hrs after' }))),
          ],
          foot: rulesFoot,
        }));
    }

    function pricingSection() {
      const items = [
        field('Currency', select(currencyOptions(res.currencies), D.currency, { id: 'set-currency', onchange: (ev) => { D.currency = ev.target.value; changed(); slots.pricing(); } })),
        field(`Rate per player / hr (${currencySign(D.currency)})`, number('pricePerHour', { decimal: true })),
      ];
      return h('div', { class: 'stack' },
        group({ title: 'Pricing', items, foot: 'Amount due = number of players × booked hours × rate per hour. Changes apply to new bookings only.' }),
        group({
          title: 'PLUS reserve (staff only)',
          items: [field(`PLUS rate per player / hr (${currencySign(D.currency)})`, number('plusRatePerHour', { decimal: true }))],
          foot: 'A special rate staff can apply with the PLUS reserve switch when making a booking. It replaces the regular rate for that booking: players × booked hours × PLUS rate. Players never see this option.',
        }));
    }

    function paymentsSection() {
      const accounts = D.bankAccounts.map((a) => {
        const inUse = a.id === D.activeBankAccountId;
        return cell({
          ic: 'bank', c: inUse ? 'tint' : 'gray',
          title: a.bankName,
          sub: `${a.accountName} · ${a.accountNumber}`,
          value: inUse ? h('span', { class: 'chip', 'data-c': 'green' }, h('span', { class: 'dot' }), 'In use') : null,
          chevron: true,
          onClick: () => openAccountSheet(a),
        });
      });
      accounts.push(cell({ ic: 'plus', title: 'Add Bank Account', cls: 'tint', onClick: () => openAccountSheet(null) }));
      return h('div', { class: 'stack', id: 'payments' },
        group({
          title: 'Payment options',
          items: [
            cell({ ic: 'bank', c: 'blue', title: 'Bank transfer', sub: 'Players see your account details after booking', right: toggle(D.allowBankTransfer, (v) => { D.allowBankTransfer = v; changed(); }, 'Bank transfer', 'set-allow-bank') }),
            cell({ ic: 'cash', c: 'green', title: 'Pay at venue', sub: 'Players pay at the front desk', right: toggle(D.allowPayAtVenue, (v) => { D.allowPayAtVenue = v; changed(); }, 'Pay at venue', 'set-allow-venue') }),
          ],
        }),
        group({
          title: 'Bank account for payments',
          items: accounts,
          foot: D.bankAccounts.length
            ? 'Players are told to pay into the account marked “In use”. Tap an account to edit it or to use it instead. Bookings that are still unpaid show the new account straight away.'
            : 'Add the account players should transfer money into. You can save several and switch between them.',
        }),
        group({
          title: 'Payment instructions',
          items: [field(null, text('paymentInstructions', { multiline: true, maxlength: 500, label: 'Payment instructions', placeholder: 'Shown with your bank details' }), { stack: true })],
        }));
    }

    function openAccountSheet(acct) {
      const isNew = !acct;
      const a = acct ? { ...acct } : {
        id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `acct-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        bankName: '', accountName: '', accountNumber: '', branch: '', swift: '', notes: '',
      };
      let use = isNew ? !D.bankAccounts.length : a.id === D.activeBankAccountId;
      const sh = openSheet({ title: isNew ? 'Add Bank Account' : 'Bank Account', guard: true });
      const errBox2 = h('div');
      const inp = (key, attrs = {}) => h(attrs.multiline ? 'textarea' : 'input', {
        maxlength: attrs.maxlength || 80, placeholder: attrs.placeholder || 'Required', value: a[key], 'aria-label': attrs.label,
        oninput: (ev) => { a[key] = ev.target.value; },
      });
      sh.setLeft(plainBtn('Cancel', sh.close));
      sh.setRight(plainBtn('Done', () => {
        const missing = [['bankName', 'bank name'], ['accountName', 'account name'], ['accountNumber', 'account number']].filter(([k]) => !String(a[k]).trim());
        if (missing.length) {
          errBox2.replaceChildren(banner('alert', `Enter the ${missing.map((m) => m[1]).join(', ')}.`, 'error'));
          return;
        }
        Object.keys(a).forEach((k) => { if (typeof a[k] === 'string') a[k] = a[k].trim(); });
        const i = D.bankAccounts.findIndex((x) => x.id === a.id);
        if (i >= 0) D.bankAccounts[i] = a;
        else D.bankAccounts.push(a);
        if (use) D.activeBankAccountId = a.id;
        else if (D.activeBankAccountId === a.id) D.activeBankAccountId = (D.bankAccounts.find((x) => x.id !== a.id) || a).id;
        changed();
        slots.payments();
        sh.guard = false;
        sh.close();
        toast('Account updated. Save changes to apply it.');
      }, true));
      const body = [
        errBox2,
        group({
          title: 'Account details',
          items: [
            field('Bank', inp('bankName', { placeholder: 'e.g. BDO, Chase, HSBC' })),
            field('Account name', inp('accountName')),
            field('Account no.', inp('accountNumber', { maxlength: 40 })),
            field('Branch', inp('branch', { placeholder: 'Optional' })),
            field('SWIFT / routing', inp('swift', { maxlength: 30, placeholder: 'Optional' })),
          ],
        }),
        group({ title: 'Note for players', items: [field(null, inp('notes', { multiline: true, maxlength: 200, label: 'Note for players', placeholder: 'Optional, e.g. “Put your booking reference in the remarks.”' }), { stack: true })] }),
        group({
          items: [cell({ ic: 'check', title: 'Use for player payments', right: toggle(use, (v) => { use = v; }, 'Use for player payments') })],
          foot: 'Only one account is shown to players at a time.',
        }),
      ];
      if (!isNew) {
        body.push(group({
          items: [cell({
            ic: 'trash', c: 'red', title: 'Delete Account', cls: 'danger',
            onClick: async () => {
              const ok = await confirmDialog({ title: 'Delete this account?', message: `${a.bankName} ${a.accountNumber} will no longer be shown to players.`, confirm: 'Delete', destructive: true });
              if (!ok) return;
              D.bankAccounts = D.bankAccounts.filter((x) => x.id !== a.id);
              if (D.activeBankAccountId === a.id) D.activeBankAccountId = D.bankAccounts[0] ? D.bankAccounts[0].id : null;
              changed();
              slots.payments();
              sh.guard = false;
              sh.close();
            },
          })],
        }));
      }
      sh.setBody(body);
    }

    // ---- Holidays and closures --------------------------------------------------------
    let holidayYear = null;
    const isClosed = (date) => D.closedDates.some((c) => c.date === date);
    function setClosed(date, name, kind, on) {
      D.closedDates = D.closedDates.filter((c) => c.date !== date);
      if (on) D.closedDates.push({ date, name, kind });
      D.closedDates.sort((a, b) => a.date.localeCompare(b.date));
      changed();
      slots.holidays();
    }

    function holidaysSection() {
      const today = clubNow().date;
      const years = [...new Set(res.holidays.map((x) => x.date.slice(0, 4)))];
      if (!holidayYear || !years.includes(holidayYear)) holidayYear = years[0];
      const list = res.holidays.filter((x) => x.date.startsWith(holidayYear));
      const upcoming = list.filter((x) => x.date >= today);
      const rows = list.map((x) => {
        const past = x.date < today;
        const sw = toggle(isClosed(x.date), (v) => setClosed(x.date, x.name, 'public', v), `Close the club for ${x.name}`, `set-hol-${x.date}`);
        sw.disabled = past;
        return cell({
          ic: 'flag', c: isClosed(x.date) ? 'red' : 'gray', title: x.name,
          sub: `${fmt.dateLong(x.date)}${past ? ' · passed' : isClosed(x.date) ? ' · closed' : ''}`, right: sw,
        });
      });
      const allClosed = upcoming.length > 0 && upcoming.every((x) => isClosed(x.date));
      if (upcoming.length) {
        rows.push(cell({
          ic: allClosed ? 'undo' : 'lock', c: 'tint', cls: 'tint',
          title: allClosed ? `Reopen All Upcoming ${holidayYear} Holidays` : `Close All Upcoming ${holidayYear} Holidays`,
          onClick: () => {
            const dates = new Set(upcoming.map((x) => x.date));
            D.closedDates = D.closedDates.filter((c) => !dates.has(c.date));
            if (!allClosed) upcoming.forEach((x) => D.closedDates.push({ date: x.date, name: x.name, kind: 'public' }));
            D.closedDates.sort((a, b) => a.date.localeCompare(b.date));
            changed();
            slots.holidays();
          },
        }));
      }
      const specials = D.closedDates.filter((c) => c.kind !== 'public' && c.date >= today);
      const specialRows = specials.map((c) => cell({
        ic: 'calendar', c: 'orange', title: c.name, sub: fmt.dateLong(c.date),
        right: h('button', { type: 'button', class: 'btn btn-sm btn-gray', text: 'Reopen', 'aria-label': `Reopen ${c.name}`, onclick: () => setClosed(c.date, c.name, c.kind, false) }),
      }));
      specialRows.push(cell({ ic: 'plus', title: 'Add Special Date', cls: 'tint', onClick: openSpecialDateSheet }));
      return h('div', { class: 'stack', id: 'holidays' },
        group({
          title: 'New Zealand public holidays',
          items: [h('div', { class: 'seg-cell' }, seg(years.map((y) => ({ value: y, label: y })), holidayYear, (v) => { holidayYear = v; slots.holidays(); }, 'Year')), ...rows],
          foot: 'Switch a holiday on to close the club that day. Closed dates can’t be booked online, as walk-ins or by staff, and players see them as closed. A date that already has bookings can’t be closed until they’re moved or cancelled. Regional anniversary days aren’t listed; add them below.',
        }),
        group({
          title: 'Special closures',
          items: specialRows,
          foot: 'Close the club on other days, such as your regional anniversary day, a tournament or maintenance. Reopen a date to allow bookings again.',
        }));
    }

    function openSpecialDateSheet() {
      const sh = openSheet({ title: 'Add Special Date', guard: true });
      const err = h('div');
      const dateIn = h('input', { type: 'date', min: clubNow().date });
      const nameIn = h('input', { maxlength: 60, placeholder: 'e.g. Auckland Anniversary Day' });
      sh.setLeft(plainBtn('Cancel', sh.close));
      sh.setRight(plainBtn('Add', () => {
        const problem = !dateIn.value ? 'Choose a date.'
          : dateIn.value < clubNow().date ? 'Choose today or a later date.'
            : !nameIn.value.trim() ? 'Enter a name for this closure.'
              : isClosed(dateIn.value) ? 'That date is already closed.' : null;
        if (problem) return err.replaceChildren(banner('alert', problem, 'error'));
        setClosed(dateIn.value, nameIn.value.trim(), 'special', true);
        sh.guard = false;
        sh.close();
        toast('Date added. Save changes to close it.');
      }, true));
      sh.setBody(err, group({ items: [field('Date', dateIn), field('Name', nameIn)], foot: 'Players will see the club as closed on this date.' }));
    }

    function accountSection() {
      const theme = prefs.get('appearance', 'system');
      return h('div', { class: 'stack' },
        group({ title: 'Appearance', items: [h('div', { class: 'seg-cell' }, seg([{ value: 'system', label: 'Automatic' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }], theme, applyTheme, 'Appearance'))], foot: 'Applies to this device only.' }),
        group({
          title: 'Staff account',
          items: [
            cell({ ic: 'hall', c: 'orange', title: 'SJV Hall Payment', sub: 'Record, edit or delete payments for the hall', chevron: true, onClick: () => openHallPayments() }),
            cell({ ic: 'key', c: 'gray', title: 'Change Password', chevron: true, onClick: openPasswordSheet }),
            cell({ ic: 'download', c: 'blue', title: 'Download Backup', sub: 'All settings and bookings as a JSON file', href: '/api/admin/backup', download: '' }),
            cell({ ic: 'globe', c: 'tint', title: 'Open Booking Site', href: '#/book', chevron: true }),
            cell({ ic: 'logout', c: 'red', title: 'Sign Out', cls: 'danger', onClick: signOut }),
          ],
        }));
    }

    function openPasswordSheet() {
      const sh = openSheet({ title: 'Change Password', guard: true });
      const cur = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'Required' });
      const n1 = h('input', { type: 'password', autocomplete: 'new-password', placeholder: 'At least 8 characters' });
      const n2 = h('input', { type: 'password', autocomplete: 'new-password', placeholder: 'Type it again' });
      const err = h('div');
      sh.setLeft(plainBtn('Cancel', sh.close));
      sh.setRight(plainBtn('Save', async () => {
        err.replaceChildren();
        if (n1.value.length < 8) return err.replaceChildren(banner('alert', 'Choose a new password with at least 8 characters.', 'error'));
        if (n1.value !== n2.value) return err.replaceChildren(banner('alert', 'The new passwords don’t match.', 'error'));
        try {
          await api('/api/admin/password', { method: 'POST', body: { current: cur.value, password: n1.value } });
          sh.guard = false;
          sh.close();
          toast('Password changed');
        } catch (e) {
          if (e.status === 401 && /current/i.test(e.message)) err.replaceChildren(banner('alert', e.message, 'error'));
          else handleError(e);
        }
      }, true));
      sh.setBody(err, group({ items: [field('Current', cur), field('New', n1), field('Confirm', n2)] }));
    }

    function buildAll() {
      box.replaceChildren(
        errBox,
        h('div', { class: 'cols c-1-1' },
          h('div', { class: 'stack' }, slot('club', clubSection), slot('courts', courtsSection), slot('pricing', pricingSection), slot('holidays', holidaysSection)),
          h('div', { class: 'stack' }, slot('hours', hoursSection), slot('payments', paymentsSection), slot('account', accountSection))));
    }

    async function save() {
      errBox.replaceChildren();
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      try {
        const r = await api('/api/admin/settings', { method: 'PUT', body: { settings: D } });
        saved = r.settings;
        D = JSON.parse(JSON.stringify(saved));
        changed();
        await loadConfig();
        ADMIN = await api('/api/admin/status'); // picks up a new PLUS reserve rate
        shell('admin', '/admin/settings');
        buildAll();
        toast('Settings saved');
      } catch (err) {
        if (err.status === 401) return handleError(err);
        errBox.replaceChildren(banner('alert', [h('strong', { text: 'Settings not saved' }), h('span', { text: err.message })], 'error'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    }

    buildAll();
    if (settingsFocus) {
      const target = document.getElementById(settingsFocus);
      settingsFocus = null;
      if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    }
  }

  // =====================================================================================
  // Start
  // =====================================================================================

  render();
})();
