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
    money: (n, cur) => {
      try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur || CFG.currency }).format(n || 0);
      } catch {
        return `${cur || CFG.currency} ${(n || 0).toFixed(2)}`;
      }
    },
    moneyAxis: (n, cur) => {
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency', currency: cur || CFG.currency, notation: 'compact', maximumFractionDigits: 1,
        }).format(n || 0);
      } catch {
        return String(n);
      }
    },
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

  function dayLabel(d) {
    const diff = daysBetween(CFG.now.date, d);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    return fmt.dayTitle(d);
  }

  /** Minutes of a booking charged at the normal rate and at the peak rate. */
  function rateMinutes(start, duration) {
    const ps = toMin(CFG.peakStart);
    const pe = toMin(CFG.peakEnd);
    let normal = 0;
    let peak = 0;
    for (let m = start; m < start + duration; m += 30) {
      const seg = Math.min(30, start + duration - m);
      if (CFG.peakEnabled && m >= ps && m < pe) peak += seg;
      else normal += seg;
    }
    return { normal, peak };
  }

  /** Total = number of players × hours × rate per hour (peak rate inside peak time). */
  function priceFor(start, duration, players) {
    const { normal, peak } = rateMinutes(start, duration);
    const perPlayer = (normal * CFG.pricePerHour + peak * CFG.peakPricePerHour) / 60;
    return Math.round(perPlayer * players * 100) / 100;
  }

  /** The same sum in words, e.g. "4 players × 2 hrs × $20.00/hr". */
  function priceBreakdown(start, duration, players) {
    const { normal, peak } = rateMinutes(start, duration);
    const who = `${players} player${players === 1 ? '' : 's'}`;
    const part = (min, rate) => `${fmt.dur(min)} × ${fmt.money(rate)}/hr`;
    if (!peak) return `${who} × ${part(normal, CFG.pricePerHour)}`;
    if (!normal) return `${who} × ${part(peak, CFG.peakPricePerHour)} (peak)`;
    return `${who} × (${part(normal, CFG.pricePerHour)} + ${part(peak, CFG.peakPricePerHour)} peak)`;
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

  const isFutureStart = (date, start, now = clubNow()) => date > now.date || (date === now.date && toMin(start) > now.minutes);

  // ---- Live updates (staff screens) ------------------------------------------------------
  // The server pushes a message whenever a booking changes. The open staff screen
  // registers a refresh in live.handler; other people's new bookings also show a toast.
  // If the stream can't stay open, a slow poll keeps the screen current.

  const live = { es: null, handler: null, debounce: null, retry: null };

  const LIVE_TOASTS = {
    created: (e) => `New booking: ${e.name}, ${courtName(e.court)}, ${dayLabel(e.date)} at ${fmt.time(e.start)}`,
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

  function stepper({ value, min, max, onChange, label, id }) {
    let v = value;
    const out = h('span', { class: 'stepper-value', 'aria-live': 'polite' });
    const dec = h('button', { type: 'button', id: id ? id + '-dec' : null, 'aria-label': `Decrease ${label.toLowerCase()}` }, icon('minus'));
    const inc = h('button', { type: 'button', id: id ? id + '-inc' : null, 'aria-label': `Increase ${label.toLowerCase()}` }, icon('plus'));
    const el = h('div', { class: 'stepper', role: 'group', 'aria-label': label }, dec, inc);
    const sync = () => {
      out.textContent = String(v);
      dec.disabled = v <= min;
      inc.disabled = v >= max;
    };
    dec.onclick = () => { if (v > min) { v -= 1; sync(); onChange(v); } };
    inc.onclick = () => { if (v < max) { v += 1; sync(); onChange(v); } };
    sync();
    el.valueEl = out;
    el.get = () => v;
    return el;
  }

  const chip = (map, key) => {
    const m = map[key];
    return m ? h('span', { class: 'chip', 'data-c': m.c }, h('span', { class: 'dot' }), m.label) : null;
  };

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

  function dateStrip({ from, to, value, onPick }) {
    const today = CFG.now.date;
    const el = h('div', { class: 'datestrip', role: 'group', 'aria-label': 'Choose a day' });
    const btns = new Map();
    for (let d = from, i = 0; d <= to && i < 140; d = addDays(d, 1), i += 1) {
      const first = i === 0 || d.endsWith('-01');
      const b = h('button', {
        type: 'button',
        class: 'day' + (d === today ? ' today' : '') + (d < today ? ' past' : ''),
        'aria-pressed': String(d === value),
        'aria-label': (d === today ? 'Today, ' : '') + fmt.dateLong(d),
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

  // ---- Court grid -----------------------------------------------------------------------------

  /**
   * Courts across, time slots down. `busy` holds bookings (staff) or anonymous
   * busy intervals (players). Free cells call onFree(court, "HH:MM").
   */
  function scheduleGrid({ date, now, busy, staff, onFree, onItem }) {
    const courts = CFG.courts;
    const open = toMin(CFG.openTime);
    const close = toMin(CFG.closeTime);
    const step = CFG.slotMinutes;
    const rows = Math.ceil((close - open) / step);
    const rowH = step === 30 ? 40 : 56;
    const grid = h('div', { class: 'sched' + (staff ? ' staff' : ''), style: { '--courts': courts.length, '--rows': rows, '--row-h': rowH + 'px' } });
    grid.append(h('div', { class: 'sched-corner', style: { gridColumn: '1', gridRow: '1' } }));
    courts.forEach((c, i) => grid.append(h('div', { class: 'sched-court', style: { gridColumn: String(i + 2), gridRow: '1' }, text: c.name })));
    for (let r = 0; r < rows; r += 1) {
      const t = open + r * step;
      const label = step === 60 || t % 60 === 0 ? (t % 60 === 0 ? fmt.hour(t / 60) : fmt.time(toTime(t))) : '';
      grid.append(h('div', { class: 'sched-time', style: { gridColumn: '1', gridRow: String(r + 2) }, text: label }));
    }

    const isPast = date < now.date;
    const isToday = date === now.date;
    const occ = courts.map(() => new Array(rows).fill(false));
    const overlaps = (court, s, e) => busy.some((b) => b.court === court && toMin(b.start) < e && toMin(b.end) > s);

    for (const b of busy) {
      const ci = b.court - 1;
      if (ci < 0 || ci >= courts.length) continue;
      const s = toMin(b.start);
      const e = toMin(b.end);
      const r0 = clamp(Math.floor((s - open) / step), 0, rows);
      const r1 = clamp(Math.ceil((e - open) / step), 0, rows);
      if (r1 <= r0) continue;
      for (let r = r0; r < r1; r += 1) occ[ci][r] = true;
      const style = { gridColumn: String(ci + 2), gridRow: `${r0 + 2} / ${r1 + 2}` };
      if (staff) {
        const st = STATUS[b.status] || STATUS.confirmed;
        grid.append(h('button', {
          type: 'button', class: 'item staff', 'data-c': st.c, style,
          'aria-label': `${b.name}, ${courtName(b.court)}, ${fmt.range(b.start, b.end)}, ${st.label}`,
          onclick: () => onItem(b),
        }, h('span', { class: 'it-title', text: b.name }), h('span', { class: 'it-sub', text: `${fmt.range(b.start, b.end)} · ${st.label}` })));
      } else {
        grid.append(h('div', { class: 'item public', style, text: b.kind === 'blocked' ? 'Unavailable' : 'Booked' }));
      }
    }

    courts.forEach((c, ci) => {
      for (let r = 0; r < rows; r += 1) {
        if (occ[ci][r]) continue;
        const t = open + r * step;
        const style = { gridColumn: String(ci + 2), gridRow: String(r + 2) };
        const when = `${c.name}, ${fmt.time(toTime(t))}`;
        // Slots that have already started can't be booked by anyone.
        const started = isPast || (isToday && t <= now.minutes);
        if (staff) {
          grid.append(started
            ? h('div', { class: 'slot closed', style, 'aria-label': `${when}, time has passed`, role: 'img' })
            : h('button', {
              type: 'button', class: 'slot', style,
              'aria-label': `${when}, open. Add a booking`, title: 'Add a booking',
              onclick: () => onFree(c.id, toTime(t)),
            }, icon('plus')));
          continue;
        }
        const fits = !started && CFG.durations.some((d) => t + d <= close && !overlaps(c.id, t, t + d));
        if (!fits) {
          grid.append(h('div', { class: 'slot closed', style, 'aria-label': `${when}, not available`, role: 'img' }));
        } else {
          grid.append(h('button', {
            type: 'button', class: 'slot', style, 'aria-label': `${when}, available. Book this slot`,
            onclick: () => onFree(c.id, toTime(t)),
          }, icon('plus'), h('span', { class: 'slot-text', text: 'Book' })));
        }
      }
    });

    if (isToday && now.minutes > open && now.minutes < close) {
      const top = 44 + ((now.minutes - open) / step) * rowH;
      grid.append(h('div', { class: 'now-line', style: { top: top + 'px' }, 'aria-hidden': 'true' }));
    }
    return h('div', { class: 'sched-wrap' }, grid);
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
    '/admin/reports': { view: viewReports, area: 'admin' },
    '/admin/settings': { view: viewSettings, area: 'admin' },
    '/admin/login': { view: viewLogin, area: 'auth' },
    '/admin/setup': { view: viewSetup, area: 'auth' },
  };
  const NAV = {
    public: [['/book', 'Book', 'calendar'], ['/my', 'My Bookings', 'ticket'], ['/info', 'Club Info', 'info']],
    admin: [['/admin', 'Dashboard', 'grid'], ['/admin/schedule', 'Schedule', 'schedule'], ['/admin/reports', 'Reports', 'chart'], ['/admin/settings', 'Settings', 'sliders']],
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
      if (def.area !== 'public') ADMIN = await api('/api/admin/status');
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

  let bookDate = null;

  async function viewBook(main) {
    const pg = page(main, { title: 'Book a Court' });
    if (!CFG.setupComplete) {
      pg.content.append(emptyState('calendar', 'Online booking opens soon', 'This club is still setting up its courts. Please check back shortly.'));
      return;
    }
    pg.setSubtitle(
      meta('clock', `Open ${fmt.range(CFG.openTime, CFG.closeTime)}`),
      meta('court', `${CFG.courts.length} court${CFG.courts.length > 1 ? 's' : ''}`),
      meta('tag', `${fmt.money(CFG.pricePerHour)} per player per hour`));
    if (CFG.announcement) pg.content.append(banner('megaphone', CFG.announcement));

    const today = CFG.now.date;
    const last = addDays(today, CFG.advanceDays);
    if (!bookDate || bookDate < today || bookDate > last) bookDate = today;

    const title = h('h2', { class: 'datebar-title' });
    const strip = dateStrip({ from: today, to: addDays(today, Math.min(CFG.advanceDays, 90)), value: bookDate, onPick: (d) => { bookDate = d; load(); } });
    const picker = datePicker({ value: bookDate, min: today, max: last, onPick: (d) => { bookDate = d; load(); } });
    const gridBox = h('div', null, loading());
    pg.content.append(
      h('section', { class: 'datebar', 'aria-label': 'Date' }, h('div', { class: 'datebar-row' }, title, picker), strip),
      h('div', { class: 'stack', style: { gap: '12px' } },
        h('div', { class: 'legend', 'aria-hidden': 'true' },
          h('span', null, h('i', { class: 'l-open' }), 'Open'),
          h('span', null, h('i', { class: 'l-booked' }), 'Booked'),
          h('span', null, h('i', { class: 'l-closed' }), 'Not available')),
        gridBox,
        h('p', { class: 'group-foot', style: { padding: '0 4px' }, text: `Tap an open slot to book. Total = number of players × hours × ${fmt.money(CFG.pricePerHour)} per hour. Up to ${CFG.maxPlayers} players per court.` })));

    let reqId = 0;
    async function load(quiet) {
      const id = ++reqId;
      const date = bookDate;
      title.textContent = dayLabel(date);
      strip.set(date);
      picker.set(date);
      if (!quiet) gridBox.replaceChildren(loading());
      try {
        const av = await api(`/api/public/availability?date=${date}`);
        if (id !== reqId) return;
        gridBox.replaceChildren(scheduleGrid({
          date, now: av.now, busy: av.busy, staff: false,
          onFree: (court, start) => openBookSheet({ date, court, start, busy: av.busy, onBooked: () => load(true) }),
        }));
      } catch (err) {
        if (id !== reqId) return;
        gridBox.replaceChildren(emptyState('alert', 'Couldn’t load courts', err.message, h('button', { type: 'button', class: 'btn btn-tinted', text: 'Try Again', onclick: () => load() })));
      }
    }
    await load();
    const timer = setInterval(() => {
      if (!gridBox.isConnected) return clearInterval(timer);
      if (!document.hidden && !layers.length) load(true);
    }, 60000);
  }

  function openBookSheet({ date, court, start, busy, onBooked }) {
    const close = toMin(CFG.closeTime);
    const startMin = toMin(start);
    const saved = prefs.get('player', {});
    const fits = (c, d) => startMin + d <= close && !busy.some((b) => b.court === c && toMin(b.start) < startMin + d && toMin(b.end) > startMin);
    const methods = [];
    if (CFG.payment.bankTransfer) methods.push({ value: 'bank', label: 'Bank transfer' });
    if (CFG.payment.payAtVenue) methods.push({ value: 'venue', label: 'Pay at venue' });
    const S = {
      court,
      duration: CFG.durations.find((d) => fits(court, d)),
      method: methods[0] ? methods[0].value : 'venue',
      players: clamp(saved.players || Math.min(4, CFG.maxPlayers), 1, CFG.maxPlayers),
    };

    const sh = openSheet({ title: 'Book a Court', guard: true });
    sh.setLeft(plainBtn('Cancel', sh.close));

    const errBox = h('div');
    const courtSeg = seg(CFG.courts.map((c) => ({ value: c.id, label: c.name, disabled: !CFG.durations.some((d) => fits(c.id, d)) })),
      S.court, (v) => { S.court = v; refresh(); }, 'Court');
    const durSeg = seg(CFG.durations.map((d) => ({ value: d, label: fmt.dur(d) })), S.duration, (v) => { S.duration = v; refresh(); }, 'Booking length');
    const endNote = h('p', { class: 'group-foot' });
    const name = h('input', { autocomplete: 'name', maxlength: 80, placeholder: 'Required', value: saved.name || '' });
    const email = h('input', { type: 'email', autocomplete: 'email', inputmode: 'email', maxlength: 120, placeholder: 'you@example.com', value: saved.email || '' });
    const phone = h('input', { type: 'tel', autocomplete: 'tel', inputmode: 'tel', maxlength: 30, placeholder: 'Required', value: saved.phone || '' });
    const players = stepper({ value: S.players, min: 1, max: CFG.maxPlayers, label: 'Players', onChange: (v) => { S.players = v; refresh(); } });
    const notes = h('textarea', { maxlength: 300, placeholder: 'Anything the club should know (optional)', 'aria-label': 'Notes' });
    const methodSeg = methods.length > 1 ? seg(methods, S.method, (v) => { S.method = v; refresh(); }, 'Payment method') : null;
    const methodNote = h('p', { class: 'group-foot' });
    const total = h('strong');
    const breakdown = h('span', { class: 'breakdown' });
    const formId = 'book-form-' + ++uid;
    const submit = h('button', { type: 'submit', form: formId, class: 'btn btn-filled btn-lg', text: 'Confirm Booking' });

    const fields = { name, email, phone };
    const form = h('form', { id: formId, novalidate: true, class: 'stack', onsubmit: onSubmit },
      errBox,
      h('div', { class: 'summary-head' },
        h('h3', { text: dayLabel(date) === 'Today' || dayLabel(date) === 'Tomorrow' ? `${dayLabel(date)}, ${fmt.dateShort(date)}` : fmt.dayTitle(date) }),
        h('div', { class: 'meta' }, meta('clock', `Starts ${fmt.time(start)}`))),
      CFG.courts.length > 1 ? group({ title: 'Court', items: [h('div', { class: 'seg-cell' }, courtSeg)] }) : null,
      group({ title: 'How long', items: [h('div', { class: 'seg-cell' }, durSeg)], foot: endNote }),
      group({
        title: 'Your details',
        items: [field('Name', name), field('Email', email), field('Mobile', phone), cell({ title: 'Players', value: players.valueEl, right: players })],
        foot: 'The club uses these to find your booking and to reach you if plans change.',
      }),
      group({ title: 'Notes', items: [field(null, notes, { stack: true })] }),
      methods.length
        ? group({ title: 'Payment', items: [methodSeg ? h('div', { class: 'seg-cell' }, methodSeg) : row(methods[0].label, null)], foot: methodNote })
        : banner('alert', 'This club has not turned on any payment options yet. Contact the club to book.', 'warn'),
      h('p', { class: 'group-foot', style: { padding: '0 4px' }, text: cancelPolicyText() }));

    sh.setBody(form);
    sh.setFoot(h('div', { class: 'total' }, h('span', null, 'Total', breakdown), total), submit);
    if (!methods.length) submit.disabled = true;

    function refresh() {
      durSeg.disable((d) => !fits(S.court, d));
      if (!fits(S.court, S.duration)) {
        S.duration = CFG.durations.find((d) => fits(S.court, d));
        durSeg.set(S.duration);
      }
      const end = startMin + S.duration;
      const peak = CFG.peakEnabled && startMin < toMin(CFG.peakEnd) && end > toMin(CFG.peakStart);
      endNote.textContent = `Ends at ${fmt.time(toTime(end))}${peak ? ` · Peak rate of ${fmt.money(CFG.peakPricePerHour)} per player per hour applies from ${fmt.time(CFG.peakStart)}` : ''}`;
      total.textContent = fmt.money(priceFor(startMin, S.duration, S.players));
      breakdown.textContent = priceBreakdown(startMin, S.duration, S.players);
      methodNote.textContent = S.method === 'bank'
        ? `You’ll see the bank details on the next screen. ${CFG.autoCancelHours ? `Unpaid bookings are released after ${CFG.autoCancelHours} hour${CFG.autoCancelHours > 1 ? 's' : ''}.` : 'We hold your slot while we wait for your payment.'}`
        : 'Pay at the front desk before you play.';
    }
    refresh();

    async function onSubmit(e) {
      e.preventDefault();
      errBox.replaceChildren();
      Object.values(fields).forEach((f) => f.parentElement.classList.remove('invalid'));
      const problems = [];
      if (!name.value.trim()) problems.push([name, 'Enter your name.']);
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
      try {
        const b = await api('/api/public/bookings', {
          method: 'POST',
          body: {
            date, court: S.court, start, duration: S.duration, players: S.players, paymentMethod: S.method,
            name: name.value.trim(), email: email.value.trim(), phone: phone.value.trim(), notes: notes.value.trim(),
          },
        });
        prefs.set('player', { name: name.value.trim(), email: email.value.trim(), phone: phone.value.trim(), players: S.players });
        rememberBooking(b.ref, b.email);
        sh.guard = false;
        showPlayerBooking(sh, b, true);
        if (onBooked) onBooked(b);
      } catch (err) {
        errBox.replaceChildren(banner('alert', err.message, 'error'));
        sh.body.scrollTop = 0;
        submit.disabled = false;
        submit.textContent = 'Confirm Booking';
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

  function showPlayerBooking(sh, b, justBooked) {
    sh.setTitle(justBooked ? 'Booking Complete' : 'Your Booking');
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
        c: 'orange', ic: 'clock', title: 'Slot reserved',
        text: `Transfer ${amount} to confirm your booking.${b.holdUntil ? ` We hold this slot until ${fmt.stamp(b.holdUntil)}.` : ''}`,
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
          row('Time', fmt.range(b.start, b.end)),
          row('Court', b.courtName),
          row('Players', String(b.players)),
          row('Name', b.name),
          row('Total', fmt.money(b.amount, b.currency), { strong: true, sub: `${b.players} player${b.players === 1 ? '' : 's'} × ${fmt.dur(b.duration)}` }),
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
            message: `${fmt.date(b.date)}, ${fmt.range(b.start, b.end)} on ${b.courtName}. The court becomes available to other players.`,
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
        sub: `${b.courtName} · ${fmt.dur(b.duration)} · ${b.ref}`,
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

    const hours = [
      cell({ ic: 'clock', title: 'Open daily', value: fmt.range(c.openTime, c.closeTime) }),
      cell({ ic: 'tag', title: 'Rate per player', value: `${fmt.money(c.pricePerHour)} / hour` }),
    ];
    if (c.peakEnabled) hours.push(cell({ ic: 'tag', c: 'orange', title: `Peak rate per player (${fmt.range(c.peakStart, c.peakEnd)})`, value: `${fmt.money(c.peakPricePerHour)} / hour` }));
    hours.push(
      cell({ ic: 'calendar', title: 'Booking lengths', value: c.durations.map(fmt.dur).join(', ') }),
      cell({ ic: 'calPlus', title: 'Book ahead', value: `Up to ${c.advanceDays} days` }),
      cell({ ic: 'people', title: 'Players per court', value: `Up to ${c.maxPlayers}` }));

    const pay = [];
    if (c.payment.bankTransfer) pay.push(cell({ ic: 'bank', c: 'blue', title: 'Bank transfer', sub: c.payment.bank ? `${c.payment.bank.bankName} · ${c.payment.bank.accountName}` : null }));
    if (c.payment.payAtVenue) pay.push(cell({ ic: 'cash', c: 'green', title: 'Pay at the venue', sub: 'Front desk, before you play' }));

    const theme = prefs.get('appearance', 'system');
    pg.content.append(
      contact.length ? group({ title: 'Contact', items: contact }) : null,
      h('div', { class: 'cols c-1-1' },
        h('div', { class: 'stack' },
          group({ title: 'Hours and prices', items: hours, foot: 'Total = number of players × hours × rate per hour.' }),
          group({ title: 'Courts', items: c.courts.map((ct) => cell({ ic: 'court', title: ct.name })) })),
        h('div', { class: 'stack' },
          group({
            title: 'How booking works',
            items: [h('div', { class: 'steps' },
              ...[
                ['Pick an open slot', 'Choose a day and tap an open time on the Book tab.'],
                ['Add your details', 'Enter your name, email and mobile number.'],
                ['Pay', c.payment.bankTransfer ? 'Transfer the amount using your booking reference, or pay at the venue if offered.' : 'Pay at the front desk before you play.'],
                ['Manage it', 'Find, add to calendar or cancel your booking under My Bookings.'],
              ].map(([t, d], i) => h('div', { class: 'step' }, h('span', { class: 'n', text: String(i + 1) }), h('div', null, h('strong', { text: t }), h('p', { text: d })))))],
          }),
          group({
            title: 'Policies',
            items: [
              cell({ ic: 'x', c: 'red', title: 'Cancellations', sub: cancelPolicyText() }),
              cell({ ic: 'clock', c: 'orange', title: 'Unpaid bookings', sub: c.autoCancelHours ? `Bank transfer bookings not paid within ${c.autoCancelHours} hour${c.autoCancelHours > 1 ? 's' : ''} are released for others.` : 'Your slot is held until the club confirms your payment.' }),
            ],
          }),
          pay.length ? group({ title: 'Payment options', items: pay }) : null)),
      group({ title: 'Appearance', items: [h('div', { class: 'seg-cell' }, seg([{ value: 'system', label: 'Automatic' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }], theme, applyTheme, 'Appearance'))] }),
      group({ items: [cell({ ic: 'lock', c: 'gray', title: 'Staff sign in', sub: 'Manage bookings, reports and settings', href: '#/admin', chevron: true })] }));
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
    const curIn = select(CURRENCIES.map((c) => ({ value: c, label: c })), S.currency);
    const courts = stepper({ value: S.courtCount, min: 1, max: 3, label: 'Courts', onChange: (v) => { S.courtCount = v; } });
    const openIn = select(timeOptions(0, 23 * 60 + 30), '07:00');
    const closeIn = select(timeOptions(60, 1440), '22:00');
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
                openTime: openIn.value, closeTime: closeIn.value, pricePerHour: Number(rateIn.value),
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
    group({ title: 'Hours and price', items: [field('Opens', openIn), field('Closes', closeIn), field('Rate per player / hr', rateIn)], foot: 'Each booking costs: number of players × hours × rate per hour.' }),
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
        h('div', { class: 'meta' }, h('span', { class: 'mono', text: b.ref }), h('span', { text: b.source === 'online' ? 'Booked online' : 'Added by staff' }), h('span', { text: fmt.stamp(b.createdAt) })),
        h('div', { class: 'chips' }, chip(STATUS, b.status), b.type === 'booking' ? chip(PAY, b.paymentStatus) : null));
      const whenGroup = group({
        title: 'When',
        items: [row('Date', fmt.dateLong(b.date)), row('Time', fmt.range(b.start, b.end)), row('Court', courtName(b.court)), row('Length', fmt.dur(b.duration))],
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
        contact.push(row('Players', String(b.players)));
        if (b.notes) contact.push(h('div', { class: 'cell' }, h('div', { class: 'cell-main' }, h('div', { class: 'cell-sub', text: 'Notes' }), h('div', { class: 'cell-title', text: b.notes }))));
        nodes.push(group({ title: 'Player', items: contact }));
        const pay = [
          row('Amount', fmt.money(b.amount, b.currency), { strong: true, sub: `${b.players} player${b.players === 1 ? '' : 's'} × ${fmt.dur(b.duration)}` }),
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
          A('cancel', 'Cancel Booking', 'x', 'red', { danger: true, confirm: { title: 'Cancel this booking?', message: `${when} for ${b.name}. The court becomes available again.`, confirm: 'Cancel Booking', cancel: 'Keep', destructive: true } });
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

  function openStaffEditor({ init = {}, existing = null, onSaved } = {}) {
    const isEdit = Boolean(existing);
    const e = existing || {};
    const S = {
      type: isEdit ? e.type : init.type || 'booking',
      date: e.date || init.date || CFG.now.date,
      court: e.court || init.court || 1,
      start: e.start || init.start || CFG.openTime,
      duration: e.duration || CFG.durations[0] || 60,
      name: e.name || '',
      email: e.email || '',
      phone: e.phone || '',
      players: e.players || Math.min(4, CFG.maxPlayers),
      notes: e.notes || '',
      paymentMethod: e.paymentMethod === 'bank' ? 'bank' : 'venue',
      paymentStatus: e.paymentStatus && e.paymentStatus !== 'n/a' ? e.paymentStatus : 'unpaid',
      status: e.status && e.status !== 'blocked' ? e.status : 'confirmed',
      paymentReference: e.paymentReference || '',
    };
    let amountTouched = isEdit;
    const open = toMin(CFG.openTime);
    const close = toMin(CFG.closeTime);
    if (toMin(S.start) < open || toMin(S.start) >= close) S.start = CFG.openTime;
    if (!isEdit) {
      // New bookings start at the next open half hour: never a date or time that has passed.
      const now = clubNow();
      if (S.date < now.date) S.date = now.date;
      if (S.date === now.date && toMin(S.start) <= now.minutes) {
        const next = Math.max(open, Math.floor(now.minutes / 30) * 30 + 30);
        if (next <= close - 30) S.start = toTime(next);
        else {
          S.date = addDays(now.date, 1);
          S.start = CFG.openTime;
        }
      }
    }
    const pastMessage = 'That time has already passed. Choose a later time today or a future date.';
    // An existing booking may keep its own (possibly past) slot; anything else must be in the future.
    const keepsOwnSlot = (date, start) => isEdit && date === e.date && start === e.start;
    const startSel = h('select', { onchange: (ev) => { S.start = ev.target.value; syncTimes(); } });

    function syncStartOptions() {
      const now = clubNow();
      const options = timeOptions(open, close - 30).map((o) => ({ ...o, disabled: !isFutureStart(S.date, o.value, now) && !keepsOwnSlot(S.date, o.value) }));
      startSel.replaceChildren(...options.map((o) => h('option', { value: o.value, text: o.label, disabled: o.disabled || null })));
      const current = options.find((o) => o.value === S.start);
      if (!current || current.disabled) {
        const firstOpen = options.find((o) => !o.disabled);
        if (firstOpen) S.start = firstOpen.value;
      }
      startSel.value = S.start;
    }

    const sh = openSheet({ title: '', guard: true });
    const errBox = h('div');
    const saveBtn = plainBtn('Save', () => save(), true);
    sh.setLeft(plainBtn('Cancel', sh.close));
    sh.setRight(saveBtn);

    const amountIn = h('input', { type: 'number', inputmode: 'decimal', min: 0, step: '0.01', class: 'right', oninput: () => { amountTouched = true; syncPrice(); } });
    const durSel = h('select');
    const endNote = h('p', { class: 'group-foot' });
    const priceNote = h('div', { class: 'group-foot price-note' });

    // The amount follows players × hours × rate until staff type their own amount.
    function syncPrice() {
      const s = toMin(S.start);
      const byRate = priceFor(s, S.duration, S.players);
      if (!amountTouched) amountIn.value = String(byRate);
      const differs = amountTouched && Math.abs(Number(amountIn.value || 0) - byRate) > 0.005;
      priceNote.replaceChildren(
        h('span', { text: `${priceBreakdown(s, S.duration, S.players)} = ${fmt.money(byRate)}` }),
        differs ? h('button', { type: 'button', class: 'btn btn-plain btn-inline', text: 'Use This Amount', onclick: () => { amountTouched = false; syncPrice(); } }) : '');
    }

    function syncTimes() {
      const s = toMin(S.start);
      const max = close - s;
      durSel.replaceChildren(...Array.from({ length: Math.max(1, Math.floor(max / 30)) }, (_, i) => (i + 1) * 30).map((d) => h('option', { value: d, text: fmt.dur(d) })));
      if (S.duration > max) S.duration = Math.max(30, Math.floor(max / 30) * 30);
      durSel.value = String(S.duration);
      endNote.textContent = `Ends at ${fmt.time(toTime(s + S.duration))}.`;
      syncPrice();
    }

    function build() {
      sh.setTitle(isEdit ? (S.type === 'block' ? 'Edit Blocked Time' : 'Edit Booking') : (S.type === 'block' ? 'Block Court Time' : 'New Booking'));
      const dateIn = h('input', {
        type: 'date', value: S.date, min: isEdit ? null : clubNow().date,
        onchange: (ev) => {
          if (!ev.target.value) return;
          S.date = ev.target.value;
          syncStartOptions();
          syncTimes();
        },
      });
      syncStartOptions();
      durSel.onchange = () => { S.duration = Number(durSel.value); syncTimes(); };
      const nodes = [errBox];
      if (!isEdit) {
        nodes.push(h('div', null, seg([{ value: 'booking', label: 'Booking' }, { value: 'block', label: 'Block time' }], S.type, (v) => { S.type = v; build(); }, 'Type')));
      }
      nodes.push(group({
        title: 'When',
        items: [
          field('Date', dateIn),
          CFG.courts.length > 1 ? h('div', { class: 'seg-cell' }, seg(CFG.courts.map((c) => ({ value: c.id, label: c.name })), S.court, (v) => { S.court = v; }, 'Court')) : null,
          field('Starts', startSel),
          field('Length', durSel),
        ],
        foot: endNote,
      }));
      if (S.type === 'block') {
        const reason = h('input', { maxlength: 80, placeholder: 'e.g. Maintenance, coaching clinic', value: S.name === 'Court blocked' ? '' : S.name, oninput: (ev) => { S.name = ev.target.value; } });
        const notes = h('textarea', { maxlength: 300, 'aria-label': 'Notes', placeholder: 'Notes for staff (optional)', value: S.notes, oninput: (ev) => { S.notes = ev.target.value; } });
        nodes.push(group({ title: 'Details', items: [field('Reason', reason), field(null, notes, { stack: true })], foot: 'Players see blocked time as unavailable.' }));
      } else {
        const name = h('input', { maxlength: 80, placeholder: 'Required', value: S.name, autocomplete: 'off', oninput: (ev) => { S.name = ev.target.value; } });
        const email = h('input', { type: 'email', maxlength: 120, placeholder: 'Optional', value: S.email, autocomplete: 'off', oninput: (ev) => { S.email = ev.target.value; } });
        const phone = h('input', { type: 'tel', maxlength: 30, placeholder: 'Optional', value: S.phone, autocomplete: 'off', oninput: (ev) => { S.phone = ev.target.value; } });
        const players = stepper({ value: S.players, min: 1, max: 8, label: 'Players', onChange: (v) => { S.players = v; syncPrice(); } });
        const notes = h('textarea', { maxlength: 300, 'aria-label': 'Notes', placeholder: 'Notes (optional)', value: S.notes, oninput: (ev) => { S.notes = ev.target.value; } });
        const ref = h('input', { maxlength: 60, placeholder: 'Optional', value: S.paymentReference, oninput: (ev) => { S.paymentReference = ev.target.value; } });
        nodes.push(group({ title: 'Player', items: [field('Name', name), field('Email', email), field('Mobile', phone), cell({ title: 'Players', value: players.valueEl, right: players }), field(null, notes, { stack: true })] }));
        nodes.push(group({
          title: 'Payment',
          items: [
            field(`Amount (${CFG.currency})`, amountIn),
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
      const moved = !isEdit || S.date !== e.date || S.start !== e.start || S.court !== e.court;
      if (moved && !isFutureStart(S.date, S.start)) {
        errBox.replaceChildren(banner('alert', pastMessage, 'error'));
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

  function staffBookingCell(b, { showDate, onChanged }) {
    return cell({
      title: b.type === 'block' ? `${b.name} (blocked)` : b.name,
      sub: [showDate ? fmt.date(b.date) : null, fmt.range(b.start, b.end), courtName(b.court), b.type === 'booking' ? b.ref : null].filter(Boolean).join(' · '),
      value: h('span', { style: { display: 'grid', justifyItems: 'end', gap: '4px' } },
        b.type === 'booking' ? h('span', { class: 'num', style: { color: 'var(--label)' }, text: fmt.money(b.amount, b.currency) }) : null,
        h('span', { class: 'chips', style: { justifyContent: 'flex-end' } }, chip(STATUS, b.status), b.type === 'booking' && b.status !== 'cancelled' ? chip(PAY, b.paymentStatus) : null)),
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
      const tiles = h('div', { class: 'tiles t4' },
        tile('calendar', 'Bookings today', fmt.num(d.today.bookings), `${fmt.num(d.today.players)} players · ${fmt.money(d.today.revenue)}`),
        tile('court', 'Court use today', fmt.pct(d.today.utilization), `Across ${CFG.courts.length} court${CFG.courts.length > 1 ? 's' : ''}`, h('div', { class: 'meter', role: 'presentation' }, h('span', { style: { width: fmt.pct(d.today.utilization) } }))),
        tile('cash', `Collected in ${fmt.monthShort(d.month.key)}`, fmt.money(d.month.collected), `${fmt.money(d.month.billed)} booked in ${monthName}`),
        tile('alert', 'Payments to check', fmt.num(d.payments.toVerify), `${fmt.num(d.payments.unpaidUpcoming)} upcoming unpaid · ${fmt.money(d.payments.unpaidAmount)}`, null, d.payments.toVerify > 0));
      nodes.push(tiles);

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
          h('div', null, h('h2', { class: 'card-title', text: 'Courts today' }), h('div', { class: 'card-sub', text: `${fmt.range(CFG.openTime, CFG.closeTime)} · tap a booking for details` })),
          h('a', { class: 'btn btn-sm btn-gray', href: '#/admin/schedule', onclick: () => { schedDate = CFG.now.date; } }, 'Schedule')),
        courtTimeline(d.schedule, d.now, refresh));
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

  function tile(ic, label, value, sub, extra, attn) {
    return h('div', { class: 'tile' + (attn ? ' attn' : '') },
      h('div', { class: 'tile-label' }, icon(ic), label),
      h('div', { class: 'tile-value', text: value }),
      sub ? h('div', { class: 'tile-sub', text: sub }) : null,
      extra);
  }

  function courtTimeline(schedule, now, onChanged) {
    const open = toMin(CFG.openTime);
    const close = toMin(CFG.closeTime);
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
        h('div', { class: 'tl-axis', 'aria-hidden': 'true' }, h('span'), h('div', null, h('span', { text: fmt.time(CFG.openTime) }), h('span', { text: fmt.time(toTime(mid)) }), h('span', { text: fmt.time(CFG.closeTime) })), h('span'))),
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
  let schedMode = 'grid';

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
    const modeSeg = seg([{ value: 'grid', label: 'Courts' }, { value: 'list', label: 'List' }], schedMode, (v) => { schedMode = v; draw(); }, 'View');
    modeSeg.classList.add('inline');
    const searchIn = h('input', { type: 'search', placeholder: 'Search name, email, phone or reference', 'aria-label': 'Search all bookings' });
    const summary = h('div', { class: 'subtitle' });
    const box = h('div', null, loading());
    const dayControls = h('div', { class: 'stack', style: { gap: '12px' } },
      h('section', { class: 'datebar', 'aria-label': 'Date' }, h('div', { class: 'datebar-row' }, title, h('div', { class: 'inline-actions' }, todayBtn, picker)), strip),
      h('div', { class: 'datebar-row' }, modeSeg, summary));
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
      const hours = bookings.reduce((n, b) => n + b.duration, 0) / 60;
      summary.replaceChildren(
        h('span', { text: `${bookings.length} booking${bookings.length === 1 ? '' : 's'}` }),
        h('span', { text: `${fmt.hours(hours)} court-hours` }),
        h('span', { text: fmt.money(revenue) }),
        ...(cancelled ? [h('span', { text: `${cancelled} cancelled` })] : []));
      if (schedMode === 'grid') {
        box.replaceChildren(scheduleGrid({
          date: schedDate, now, busy: active, staff: true,
          onFree: (court, start) => openStaffEditor({ init: { date: schedDate, court, start }, onSaved: () => load() }),
          onItem: (b) => openStaffDetail(b, () => load()),
        }));
      } else if (!data.length) {
        box.replaceChildren(emptyState('calendar', 'No bookings on this day', 'Add a booking for a walk-in or phone call, or block time for maintenance.',
          h('button', { type: 'button', class: 'btn btn-tinted', onclick: () => openStaffEditor({ init: { date: schedDate }, onSaved: () => load() }) }, icon('plus'), 'New Booking')));
      } else {
        const sorted = [...data].sort((a, b) => (a.start + a.court).localeCompare(b.start + b.court));
        box.replaceChildren(group({ items: sorted.map((b) => staffBookingCell(b, { onChanged: () => load() })) }));
      }
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
  const REPORT_DEFAULTS = { period: 'month', court: '', status: '', payment: '', method: '', blocks: false, q: '', from: '', to: '', sort: 'asc' };

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
    q.set('type', F.blocks ? 'all' : 'booking');
    if (F.q) q.set('q', F.q);
    q.set('sort', F.sort);
    return q.toString();
  }

  const activeFilterCount = (F) => [F.period !== 'all', F.court, F.status, F.payment, F.method, F.q].filter(Boolean).length;

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
        results.replaceChildren(emptyState('chart', 'No bookings match these filters', 'Try a different period, or show all records.',
          h('button', { type: 'button', class: 'btn btn-tinted', onclick: () => resetFilters(true) }, 'Show All Records')));
        return;
      }
      const tiles = h('div', { class: 'tiles t6' },
        tile('calendar', 'Bookings', fmt.num(s.active), `${s.cancelled} cancelled · ${s.noShows} no-show${s.noShows === 1 ? '' : 's'}`),
        tile('clock', 'Court hours', fmt.hours(s.hours), `${fmt.num(s.players)} player visits`),
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
      const courtTable = h('div', { class: 'rtable-wrap' }, h('table', { class: 'rtable compact' },
        h('thead', null, h('tr', null, h('th', { text: 'Court' }), h('th', { class: 'r', text: 'Bookings' }), h('th', { class: 'r', text: 'Hours' }), h('th', { class: 'r', text: 'Value' }), h('th', { class: 'r', text: 'Collected' }))),
        h('tbody', null, r.byCourt.map((g) => h('tr', null,
          h('td', null, h('div', { text: g.name }), h('div', { class: 'meter', style: { maxWidth: '160px', marginTop: '6px' } }, h('span', { style: { width: totalHours ? `${(g.hours / totalHours) * 100}%` : '0' } }))),
          h('td', { class: 'r', text: fmt.num(g.active) }), h('td', { class: 'r', text: fmt.hours(g.hours) }),
          h('td', { class: 'r', text: fmt.money(g.billed, cur) }), h('td', { class: 'r', text: fmt.money(g.collected, cur) }))))));

      const byMethod = r.byMethod.map((g) => ({ ...g, label: METHOD[g.key] }));
      const hoursItems = r.byHour.map((x) => ({ k: fmt.hour(x.hour), v: x.bookings }));
      const dayItems = [1, 2, 3, 4, 5, 6, 0].map((d) => ({ k: fmt.dowLong(d), v: r.byWeekday.find((x) => x.day === d).bookings }));

      const sorted = r.rows;
      const visible = sorted.slice(0, shown);
      const desktop = h('div', { class: 'rows-desktop rtable-wrap' }, h('table', { class: 'rtable' },
        h('thead', null, h('tr', null, ['Date', 'Time', 'Court', 'Name', 'Players', 'Status', 'Payment', 'Amount', 'Reference'].map((t, i) => h('th', { class: [4, 7].includes(i) ? 'r' : null, text: t })))),
        h('tbody', null, visible.map((b) => h('tr', {
          tabindex: '0',
          onclick: () => openStaffDetail(b, () => load()),
          onkeydown: (ev) => { if (ev.key === 'Enter') openStaffDetail(b, () => load()); },
        },
        h('td', { class: 'nowrap', text: fmt.date(b.date) }), h('td', { class: 'nowrap', text: fmt.range(b.start, b.end) }), h('td', { class: 'nowrap', text: courtName(b.court) }),
        h('td', { text: b.name }), h('td', { class: 'r', text: b.type === 'booking' ? String(b.players) : '—' }),
        h('td', null, chip(STATUS, b.status)), h('td', null, b.type === 'booking' ? chip(PAY, b.paymentStatus) : '—'),
        h('td', { class: 'r', text: fmt.money(b.amount, b.currency) }), h('td', { class: 'mono nowrap', text: b.ref })))),
        h('tfoot', null, h('tr', null,
          h('td', { colspan: '4', text: `${fmt.num(sorted.length)} row${sorted.length === 1 ? '' : 's'}${sorted.length > shown ? `, showing ${shown}` : ''}` }),
          h('td', { class: 'r', text: fmt.num(s.players) }), h('td'), h('td'),
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
            ], cur))),
        h('div', { class: 'cols c-1-1' },
          h('section', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', { class: 'card-title', text: 'Busiest start times' })), hbars(hoursItems)),
          h('section', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', { class: 'card-title', text: 'By day of week' })), hbars(dayItems))),
        h('section', { class: 'group stack', style: { gap: '10px' } },
          h('div', { class: 'filter-summary' },
            h('h2', { class: 'group-title big', style: { padding: '0' }, text: `Booking list (${fmt.num(sorted.length)})` }),
            h('div', { class: 'no-print' }, seg([{ value: 'asc', label: 'Oldest first' }, { value: 'desc', label: 'Newest first' }], F.sort, (v) => { F.sort = v; persist(); load(); }, 'Sort order'))),
          desktop, mobile, more));
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
    const timeSel = (key, from, to, rebuild) => select(timeOptions(from, to), D[key], {
      id: 'set-' + key, onchange: (ev) => { D[key] = ev.target.value; changed(); if (rebuild) slots[rebuild](); },
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
      const slotSeg = seg([{ value: 30, label: 'Every 30 min' }, { value: 60, label: 'Every hour' }], D.slotMinutes, (v) => {
        D.slotMinutes = v;
        D.durations = D.durations.filter((d) => d % v === 0);
        if (!D.durations.length) D.durations = [60];
        changed();
        slots.hours();
      }, 'Start times');
      const choices = h('div', { class: 'choices', role: 'group', 'aria-label': 'Booking lengths players can choose' },
        res.durationChoices.map((d) => h('button', {
          type: 'button', class: 'choice', id: 'set-dur-' + d, 'aria-pressed': String(D.durations.includes(d)), disabled: d % D.slotMinutes ? true : null, text: fmt.dur(d),
          onclick: () => {
            D.durations = D.durations.includes(d) ? D.durations.filter((x) => x !== d) : [...D.durations, d].sort((a, b) => a - b);
            changed();
            slots.hours();
          },
        })));
      const players = stepper({ id: 'set-players', value: D.maxPlayers, min: 1, max: 8, label: 'Players per court', onChange: (v) => { D.maxPlayers = v; changed(); } });
      return h('div', { class: 'stack' },
        group({
          title: 'Opening hours',
          items: [field('Opens', timeSel('openTime', 0, 23 * 60)), field('Closes', timeSel('closeTime', 60, 1440)), h('div', { class: 'seg-cell' }, slotSeg)],
          foot: 'Start times are the slots players can tap on the booking grid.',
        }),
        group({
          title: 'Booking lengths',
          items: [choices],
          foot: D.durations.length ? `Players can book ${D.durations.map(fmt.dur).join(', ')}.` : 'Choose at least one booking length.',
        }),
        group({
          title: 'Booking rules',
          items: [
            cell({ title: 'Players per court', value: players.valueEl, right: players }),
            field('Book ahead', h('span', { style: { display: 'flex', alignItems: 'center', gap: '8px', flex: '1' } }, number('advanceDays', { min: 1, max: 365 }), h('span', { class: 'unit', text: 'days' }))),
            field('Cancel online', h('span', { style: { display: 'flex', alignItems: 'center', gap: '8px', flex: '1' } }, number('cancelCutoffHours', { min: 0, max: 168 }), h('span', { class: 'unit', text: 'hrs before' }))),
            field('Release unpaid', h('span', { style: { display: 'flex', alignItems: 'center', gap: '8px', flex: '1' } }, number('autoCancelHours', { min: 0, max: 168 }), h('span', { class: 'unit', text: 'hrs after' }))),
          ],
          foot: 'Release unpaid: bank transfer bookings with no payment after this many hours are cancelled automatically, freeing the court. Enter 0 to keep them until you cancel them.',
        }));
    }

    function pricingSection() {
      const items = [
        field('Currency', select(res.currencies.map((c) => ({ value: c, label: c })), D.currency, { id: 'set-currency', onchange: (ev) => { D.currency = ev.target.value; changed(); slots.pricing(); } })),
        field(`Rate per player / hr (${D.currency})`, number('pricePerHour', { decimal: true })),
        cell({ title: 'Peak pricing', sub: 'Charge a different rate at busy times', right: toggle(D.peakEnabled, (v) => { D.peakEnabled = v; changed(); slots.pricing(); }, 'Peak pricing', 'set-peak') }),
      ];
      if (D.peakEnabled) {
        items.push(
          field('Peak starts', timeSel('peakStart', 0, 23 * 60 + 30)),
          field('Peak ends', timeSel('peakEnd', 30, 1440)),
          field(`Peak rate per player / hr (${D.currency})`, number('peakPricePerHour', { decimal: true })));
      }
      return group({ title: 'Pricing', items, foot: 'Each booking costs: number of players × hours × rate per hour. Hours inside peak time use the peak rate. Changes apply to new bookings only.' });
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

    function accountSection() {
      const theme = prefs.get('appearance', 'system');
      return h('div', { class: 'stack' },
        group({ title: 'Appearance', items: [h('div', { class: 'seg-cell' }, seg([{ value: 'system', label: 'Automatic' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }], theme, applyTheme, 'Appearance'))], foot: 'Applies to this device only.' }),
        group({
          title: 'Staff account',
          items: [
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
          h('div', { class: 'stack' }, slot('club', clubSection), slot('courts', courtsSection), slot('pricing', pricingSection)),
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
