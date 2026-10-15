'use strict';

const crypto = require('crypto');
const U = require('./util');

const MAX_COURTS = 3;
const MIN_COURTS = 1;
const CURRENCIES = ['NZD', 'USD', 'PHP', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'HKD', 'JPY', 'INR', 'MYR', 'THB', 'IDR', 'AED', 'SAR', 'ZAR', 'MXN', 'BRL', 'KRW', 'CHF', 'SEK', 'NOK', 'DKK'];

// Statuses that hold a court. Cancelled bookings free the slot.
const OCCUPYING = new Set(['pending', 'confirmed', 'completed', 'no_show', 'blocked']);
const STATUSES = ['pending', 'confirmed', 'completed', 'no_show', 'cancelled', 'blocked'];
const PAYMENT_STATUSES = ['unpaid', 'submitted', 'paid', 'refunded', 'n/a'];

const DEFAULT_SETTINGS = Object.freeze({
  facilityName: 'Pickleball Club',
  address: '',
  contactPhone: '',
  contactEmail: '',
  announcement: '',
  timezone: 'UTC',
  currency: 'NZD',
  courtCount: 2,
  courtNames: ['Court 1', 'Court 2', 'Court 3'],
  // Opening hours: weekdays are Monday to Thursday, weekends Friday to Sunday.
  // A booking reserves a court for that day's session (opening to closing time).
  weekdayOpen: '07:00',
  weekdayClose: '22:00',
  weekendOpen: '07:00',
  weekendClose: '22:00',
  // Online bookings need between minPlayers (1–4) and maxPlayers (5–6) per court.
  // Walk-ins aren't limited.
  minPlayers: 4,
  maxPlayers: 6,
  advanceDays: 30,
  cancelCutoffHours: 24,
  autoCancelHours: 0,
  // Amount due = number of players × booked hours × rate per hour.
  pricePerHour: 20,
  plusRatePerHour: 30,
  allowBankTransfer: true,
  allowPayAtVenue: true,
  bankAccounts: [],
  activeBankAccountId: null,
  paymentInstructions: 'Use your booking reference as the transfer reference so we can match your payment.',
  // Dates the club is closed (public holidays and special dates): [{ date, name, kind }].
  closedDates: [],
});

function createInitialState() {
  return {
    version: 3,
    createdAt: new Date().toISOString(),
    setupComplete: false,
    auth: null,
    settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
    bookings: [],
  };
}

/** Fill in any settings added in later versions, and upgrade older data. */
function normalizeState(raw) {
  const state = raw || createInitialState();
  state.settings = { ...JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), ...(state.settings || {}) };
  if ((state.version || 1) < 2) {
    // Version 2: whole-session bookings with 4 to 6 players per court online.
    state.settings.minPlayers = 4;
    state.settings.maxPlayers = 6;
    delete state.settings.slotMinutes;
    delete state.settings.durations;
    state.version = 2;
    state.migrated = true;
  }
  if (state.version < 3) {
    // Version 3: separate weekday (Mon–Thu) and weekend (Fri–Sun) hours, the amount
    // due is players × booked hours × rate (no peak pricing), minimum players 1–4
    // and maximum players 5–6.
    const st = state.settings;
    const open = st.openTime || DEFAULT_SETTINGS.weekdayOpen;
    const close = st.closeTime || DEFAULT_SETTINGS.weekdayClose;
    st.weekdayOpen = open;
    st.weekdayClose = close;
    st.weekendOpen = open;
    st.weekendClose = close;
    for (const k of ['openTime', 'closeTime', 'peakEnabled', 'peakStart', 'peakEnd', 'peakPricePerHour']) delete st[k];
    st.minPlayers = Math.min(4, Math.max(1, Number(st.minPlayers) || 4));
    st.maxPlayers = Math.min(6, Math.max(5, Number(st.maxPlayers) || 6));
    state.version = 3;
    state.migrated = true;
  }
  state.bookings = Array.isArray(state.bookings) ? state.bookings : [];
  // Bookings made before booked hours existed were charged for the whole session.
  for (const b of state.bookings) {
    if (b.type === 'booking' && !(b.hours > 0)) b.hours = Math.round((b.duration / 60) * 2) / 2 || 1;
  }
  state.setupComplete = Boolean(state.setupComplete);
  return state;
}

// ---- Settings ------------------------------------------------------------------

function activeAccount(settings) {
  return settings.bankAccounts.find((a) => a.id === settings.activeBankAccountId) || null;
}

function sanitizeBankAccount(a) {
  if (!a || typeof a !== 'object') throw U.bad('Bank account details are missing');
  return {
    id: typeof a.id === 'string' && /^[\w-]{6,64}$/.test(a.id) ? a.id : crypto.randomUUID(),
    bankName: U.str(a.bankName, { name: 'Bank name', min: 1, max: 80 }),
    accountName: U.str(a.accountName, { name: 'Account name', min: 1, max: 80 }),
    accountNumber: U.str(a.accountNumber, { name: 'Account number', min: 1, max: 40 }),
    branch: U.str(a.branch, { name: 'Branch', max: 80 }),
    swift: U.str(a.swift, { name: 'SWIFT / routing code', max: 30 }),
    notes: U.str(a.notes, { name: 'Account notes', max: 200 }),
  };
}

/**
 * Validate a settings update. `input` may be partial; missing fields keep their
 * current value. Throws an HttpError with a readable message on bad input.
 */
function sanitizeSettings(state, input) {
  const cur = state.settings;
  const v = { ...cur, ...(input || {}) };
  const s = {};

  s.facilityName = U.str(v.facilityName, { name: 'Club name', min: 1, max: 80 });
  s.address = U.str(v.address, { name: 'Address', max: 160 });
  s.contactPhone = U.str(v.contactPhone, { name: 'Contact phone', max: 40 });
  s.contactEmail = U.email(v.contactEmail, { required: false });
  s.announcement = U.str(v.announcement, { name: 'Announcement', max: 300 });

  s.timezone = U.str(v.timezone, { name: 'Time zone', min: 1, max: 64 });
  if (!U.isValidTimeZone(s.timezone)) throw U.bad('Choose a valid time zone');
  s.currency = U.str(v.currency, { name: 'Currency', min: 3, max: 3 }).toUpperCase();
  if (!CURRENCIES.includes(s.currency)) throw U.bad('Choose a currency from the list');

  s.courtCount = U.int(v.courtCount, { name: 'Number of courts', min: MIN_COURTS, max: MAX_COURTS });
  const names = Array.isArray(v.courtNames) ? v.courtNames : cur.courtNames;
  s.courtNames = [0, 1, 2].map((i) =>
    U.str(names[i] || `Court ${i + 1}`, { name: `Court ${i + 1} name`, min: 1, max: 30 })
  );

  for (const [key, label] of [['weekday', 'Weekday (Monday–Thursday)'], ['weekend', 'Weekend (Friday–Sunday)']]) {
    s[`${key}Open`] = U.time(v[`${key}Open`], `${label} opening time`);
    s[`${key}Close`] = U.time(v[`${key}Close`], `${label} closing time`);
    if (U.toMin(s[`${key}Close`]) - U.toMin(s[`${key}Open`]) < 60) {
      throw U.bad(`${label} closing time must be at least one hour after opening time`);
    }
  }
  s.minPlayers = Number(v.minPlayers);
  if (![1, 2, 3, 4].includes(s.minPlayers)) throw U.bad('Minimum players per court must be 1, 2, 3 or 4');
  s.maxPlayers = Number(v.maxPlayers);
  if (![5, 6].includes(s.maxPlayers)) throw U.bad('Maximum players per court must be 5 or 6');
  s.advanceDays = U.int(v.advanceDays, { name: 'Days bookable ahead', min: 1, max: 365 });
  s.cancelCutoffHours = U.int(v.cancelCutoffHours, { name: 'Cancellation notice', min: 0, max: 168 });
  s.autoCancelHours = U.int(v.autoCancelHours, { name: 'Unpaid booking hold', min: 0, max: 168 });

  s.pricePerHour = U.money(v.pricePerHour, { name: 'Rate per player per hour' });
  s.plusRatePerHour = U.money(v.plusRatePerHour, { name: 'PLUS reserve rate per player per hour' });

  s.allowBankTransfer = U.bool(v.allowBankTransfer);
  s.allowPayAtVenue = U.bool(v.allowPayAtVenue);
  if (!s.allowBankTransfer && !s.allowPayAtVenue) {
    throw U.bad('Turn on at least one payment option');
  }
  const accounts = Array.isArray(v.bankAccounts) ? v.bankAccounts : [];
  if (accounts.length > 10) throw U.bad('You can save up to 10 bank accounts');
  s.bankAccounts = accounts.map(sanitizeBankAccount);
  s.activeBankAccountId = s.bankAccounts.some((a) => a.id === v.activeBankAccountId)
    ? v.activeBankAccountId
    : (s.bankAccounts[0] ? s.bankAccounts[0].id : null);
  s.paymentInstructions = U.str(v.paymentInstructions, { name: 'Payment instructions', max: 500 });

  const closures = Array.isArray(v.closedDates) ? v.closedDates : [];
  if (closures.length > 400) throw U.bad('You can close up to 400 dates');
  const seen = new Set();
  s.closedDates = closures
    .map((c) => {
      if (!c || !U.isDate(c.date)) throw U.bad('Choose a valid date for each closure');
      return { date: c.date, name: U.str(c.name, { name: 'Closure name', min: 1, max: 60 }), kind: c.kind === 'public' ? 'public' : 'special' };
    })
    .filter((c) => !seen.has(c.date) && seen.add(c.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  // A newly closed date must not have bookings on it.
  const today = U.nowIn(s.timezone).date;
  const wasClosed = new Set((cur.closedDates || []).map((c) => c.date));
  for (const c of s.closedDates) {
    if (wasClosed.has(c.date) || c.date < today) continue;
    const booked = state.bookings.filter((b) => b.date === c.date && b.type === 'booking' && OCCUPYING.has(b.status));
    if (booked.length) {
      throw U.bad(
        `${prettyDate(c.date)} (${c.name}) has ${booked.length} booking${booked.length > 1 ? 's' : ''}. ` +
          'Move or cancel them before closing that date.',
        409
      );
    }
  }

  // Removing a court that still has upcoming bookings would strand them.
  if (s.courtCount < cur.courtCount) {
    const today = U.nowIn(s.timezone).date;
    const stranded = state.bookings.filter(
      (b) => b.court > s.courtCount && b.date >= today && OCCUPYING.has(b.status)
    );
    if (stranded.length) {
      const courts = [...new Set(stranded.map((b) => b.court))].sort().map((c) => cur.courtNames[c - 1]);
      throw U.bad(
        `${courts.join(' and ')} still ${courts.length > 1 ? 'have' : 'has'} ${stranded.length} upcoming ` +
          `booking${stranded.length > 1 ? 's' : ''}. Move or cancel them before reducing the number of courts.`,
        409
      );
    }
  }
  return s;
}

function publicConfig(state) {
  const s = state.settings;
  const account = activeAccount(s);
  return {
    setupComplete: state.setupComplete,
    facilityName: s.facilityName,
    address: s.address,
    contactPhone: s.contactPhone,
    contactEmail: s.contactEmail,
    announcement: s.announcement,
    timezone: s.timezone,
    currency: s.currency,
    courts: courtList(s),
    hours: {
      weekday: { open: s.weekdayOpen, close: s.weekdayClose },
      weekend: { open: s.weekendOpen, close: s.weekendClose },
    },
    minPlayers: s.minPlayers,
    maxPlayers: s.maxPlayers,
    advanceDays: s.advanceDays,
    cancelCutoffHours: s.cancelCutoffHours,
    autoCancelHours: s.autoCancelHours,
    pricePerHour: s.pricePerHour,
    payment: {
      bankTransfer: s.allowBankTransfer && Boolean(account),
      payAtVenue: s.allowPayAtVenue,
      bank: account ? publicAccount(account) : null,
      instructions: s.paymentInstructions,
    },
    closedDates: upcomingClosures(s),
    now: U.nowIn(s.timezone),
  };
}

// ---- Closed dates (holidays) ----------------------------------------------------------

function closedOn(s, date) {
  return (s.closedDates || []).find((c) => c.date === date) || null;
}

function upcomingClosures(s) {
  const today = U.nowIn(s.timezone).date;
  return (s.closedDates || []).filter((c) => c.date >= today).map((c) => ({ date: c.date, name: c.name }));
}

function prettyDate(date) {
  return new Intl.DateTimeFormat('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(date + 'T00:00:00Z'));
}

function publicAccount(a) {
  return {
    bankName: a.bankName,
    accountName: a.accountName,
    accountNumber: a.accountNumber,
    branch: a.branch,
    swift: a.swift,
    notes: a.notes,
  };
}

function courtList(s) {
  return Array.from({ length: s.courtCount }, (_, i) => ({ id: i + 1, name: s.courtNames[i] }));
}

// ---- Pricing and availability -------------------------------------------------------

/**
 * Amount due = number of players × booked hours × rate per hour. A PLUS reserve
 * (staff only) uses the PLUS reserve rate instead of the regular rate.
 */
function priceFor(s, hours, players, plus) {
  const rate = plus ? s.plusRatePerHour : s.pricePerHour;
  return Math.round(players * hours * rate * 100) / 100;
}

/** Weekdays are Monday to Thursday; weekends are Friday to Sunday. */
function isWeekend(date) {
  const d = U.weekday(date);
  return d === 0 || d === 5 || d === 6;
}

/** Opening and closing time for a date. */
function hoursFor(s, date) {
  return isWeekend(date)
    ? { open: s.weekendOpen, close: s.weekendClose }
    : { open: s.weekdayOpen, close: s.weekdayClose };
}

/**
 * Booked hours: what the customer pays for, from 1 hour up to the length of
 * that day's session, in half-hour steps.
 */
function bookedHours(value, maxHours) {
  const n = Number(value);
  if (value === '' || value === null || value === undefined || !Number.isFinite(n) ||
      n < 1 || n > maxHours || Math.round(n * 2) !== n * 2) {
    throw U.bad(`Booked hours must be from 1 to ${maxHours} hours, in half-hour steps`);
  }
  return n;
}

/**
 * The first booking or blocked time overlapping a slot. `blocksOnly` ignores
 * bookings: a booking never locks a court, so others can book it too.
 */
function findConflict(state, date, court, start, end, excludeId, blocksOnly = false) {
  return state.bookings.find(
    (b) =>
      b.id !== excludeId &&
      b.date === date &&
      b.court === court &&
      OCCUPYING.has(b.status) &&
      (!blocksOnly || b.type === 'block') &&
      U.toMin(b.start) < end &&
      U.toMin(b.end) > start
  );
}

/** What is on each court on a date, for the booking pages: no names, just the number of players. */
function availability(state, date) {
  return state.bookings
    .filter((b) => b.date === date && OCCUPYING.has(b.status) && b.court <= state.settings.courtCount)
    .map((b) => (b.type === 'block'
      ? { court: b.court, start: b.start, end: b.end, kind: 'blocked' }
      : { court: b.court, start: b.start, end: b.end, kind: 'booked', players: b.players || 0 }));
}

// ---- Creating and editing bookings ---------------------------------------------------

function log(b, what) {
  b.history = (b.history || []).concat({ at: new Date().toISOString(), what }).slice(-30);
}

function uniqueRef(state) {
  for (;;) {
    const ref = U.makeRef();
    if (!state.bookings.some((b) => b.ref === ref)) return ref;
  }
}

const PAST_MESSAGE = 'That date’s session has already ended. Choose today (before closing time) or a future date.';

/** True while a booking on this date that ends at `end` (minutes) hasn't finished yet. */
function notOver(s, date, end) {
  return U.minutesUntil(U.nowIn(s.timezone), date, end) > 0;
}

/** The whole session on a date: opening to closing time from Settings (weekday or weekend). */
function sessionSlot(s, date) {
  if (!U.isDate(date)) throw U.bad('Choose a valid date');
  const { open, close } = hoursFor(s, date);
  return { start: open, duration: U.toMin(close) - U.toMin(open) };
}

/**
 * Validate the slot (date/court/time) part of a booking. Nobody can book a
 * session that has already ended. Players book within the booking window.
 * `allowPast` (walk-ins) lets staff record a walk-in on any date, past included.
 * `keepsSlot` is for edits that leave an existing booking where it is.
 * `shareCourt` (all bookings) allows overlapping other bookings, but never blocked time.
 * `anyDate` (staff on the walk-in and booking pages) lifts the players' booking
 * window, so any future date can be booked.
 * Nobody can book a date the club has closed (public holidays and special dates).
 */
function validateSlot(state, input, {
  staff, excludeId, checkConflict = true, allowPast = false, keepsSlot = false, shareCourt = false, anyDate = false,
}) {
  const s = state.settings;
  if (!U.isDate(input.date)) throw U.bad('Choose a valid date');
  const court = U.int(input.court, { name: 'Court', min: 1, max: s.courtCount });
  const start = U.toMin(input.start);
  if (Number.isNaN(start)) throw U.bad('Choose a start time');
  const duration = U.int(input.duration, { name: 'Booking length (minutes)', min: 30, max: 1440 });
  if (duration % 30) throw U.bad('Booking length must be in 30-minute steps');
  // A booking left where it is keeps its time even if the opening hours change later.
  const hours = hoursFor(s, input.date);
  if (!keepsSlot && (start < U.toMin(hours.open) || start + duration > U.toMin(hours.close))) {
    throw U.bad(`Bookings on ${prettyDate(input.date)} must fit between ${hours.open} and ${hours.close}`);
  }
  if (!allowPast && !keepsSlot && !notOver(s, input.date, start + duration)) throw U.bad(PAST_MESSAGE);
  const closed = !keepsSlot && closedOn(s, input.date);
  if (closed) throw U.bad(`The club is closed on ${prettyDate(input.date)} for ${closed.name}. Choose another date.`);
  if (!staff && !anyDate) {
    const ahead = U.daysBetween(U.nowIn(s.timezone).date, input.date);
    if (ahead > s.advanceDays) throw U.bad(`Bookings open ${s.advanceDays} days ahead. Choose an earlier date.`);
  }
  const clash = checkConflict && findConflict(state, input.date, court, start, start + duration, excludeId, shareCourt);
  if (clash) {
    throw U.bad(
      `${s.courtNames[court - 1]} is already ${clash.type === 'block' ? 'blocked' : 'booked'} on ` +
        `${prettyDate(input.date)}. Choose another court or date.`,
      409
    );
  }
  return { date: input.date, court, start: U.toTime(start), end: U.toTime(start + duration), duration };
}

/** Where a booking came from. Walk-ins are customers booked in person at the desk. */
const SOURCES = ['online', 'staff', 'walkin'];

/**
 * Create a booking for a date and court. Online bookings and walk-ins always
 * cover the whole session, from opening to closing time in Settings.
 * Online bookings need minPlayers to maxPlayers per court; walk-ins don't.
 * `staff`: a signed-in staff member is booking from the public booking page.
 * `walkIn`: a staff member is booking a walk-in customer (staff only).
 * Staff may apply the PLUS reserve rate; players may not.
 */
function createPublicBooking(state, input, { staff = false, walkIn = false } = {}) {
  const s = state.settings;
  const byStaff = staff || walkIn;
  const plus = byStaff && U.bool(input.plus); // PLUS reserve is a staff-only option
  if (!state.setupComplete) throw U.bad('Online booking is not open yet', 503);
  // Bookings don't lock a court: online bookings and walk-ins are accepted on a
  // court that is already booked (blocked time and closed dates still stop them).
  // Staff (walk-ins, or booking from the public page) aren't bound by the booking
  // window; walk-ins can also be recorded for any past date.
  const slot = validateSlot(state, { ...input, ...sessionSlot(s, input.date) }, {
    staff: false, shareCourt: true, anyDate: byStaff, allowPast: walkIn,
  });
  const hours = bookedHours(input.hours, slot.duration / 60);
  const method = input.paymentMethod === 'venue' ? 'venue' : 'bank';
  if (method === 'bank' && !(s.allowBankTransfer && activeAccount(s))) {
    throw U.bad('Bank transfer is not available right now. Choose pay at the venue.');
  }
  // A walk-in customer is at the venue, so paying there is always possible.
  if (method === 'venue' && !s.allowPayAtVenue && !walkIn) throw U.bad('Choose bank transfer to pay for this booking');
  const paidNow = walkIn && U.bool(input.paid);

  const now = new Date().toISOString();
  const players = U.int(input.players, { name: 'Players', min: 1, max: 12 });
  if (!walkIn && (players < s.minPlayers || players > s.maxPlayers)) {
    throw U.bad(`Online bookings are for ${s.minPlayers} to ${s.maxPlayers} players per court.`);
  }
  const b = {
    id: crypto.randomUUID(),
    ref: uniqueRef(state),
    type: 'booking',
    ...slot,
    name: U.str(input.name, { name: 'Name', min: 1, max: 80 }),
    email: U.email(input.email),
    phone: U.phone(input.phone),
    players,
    hours,
    notes: U.str(input.notes, { name: 'Notes', max: 300 }),
    status: method === 'bank' && !paidNow ? 'pending' : 'confirmed',
    paymentStatus: paidNow ? 'paid' : 'unpaid',
    paymentMethod: method,
    plus,
    amount: priceFor(s, hours, players, plus),
    currency: s.currency,
    paymentReference: U.str(walkIn ? input.paymentReference : '', { name: 'Payment reference', max: 60 }),
    bank: paidNow && method === 'bank' && activeAccount(s) ? publicAccount(activeAccount(s)) : null,
    source: walkIn ? 'walkin' : staff ? 'staff' : 'online',
    createdAt: now,
    updatedAt: now,
  };
  if (paidNow) b.paidAt = now;
  const extras = [plus ? 'PLUS reserve' : '', paidNow ? 'paid at the desk' : ''].filter(Boolean).join(', ');
  log(b, (walkIn ? 'Walk-in booked by staff' : staff ? 'Booked by staff' : 'Booked online') + (extras ? ` (${extras})` : ''));
  state.bookings.push(b);
  return b;
}

/** Staff create or edit. `existing` is the booking being edited, if any. */
function upsertStaffBooking(state, input, existing) {
  const s = state.settings;
  const base = existing || {};
  let merged = { ...base, ...input };
  const type = (existing ? existing.type : input.type) === 'block' ? 'block' : 'booking';
  // New bookings and bookings moved to another date or court must be in the
  // future. Editing details of a past booking (notes, payment) is still allowed.
  // A walk-in may be moved to any date, past included, and keeps sharing courts.
  const moved = !existing || merged.date !== existing.date || Number(merged.court) !== existing.court;
  // New and moved bookings (and blocked time) cover that date's whole session;
  // a booking left where it is keeps its original time.
  merged = moved
    ? { ...merged, ...sessionSlot(s, merged.date) }
    : { ...merged, start: existing.start, duration: existing.duration };
  const walkIn = base.source === 'walkin';
  const slot = validateSlot(state, merged, {
    staff: true,
    excludeId: base.id,
    checkConflict: type === 'block' || merged.status !== 'cancelled',
    keepsSlot: !moved,
    allowPast: walkIn,
    // Bookings share courts with other bookings; blocked time needs the court to itself.
    shareCourt: type === 'booking',
  });
  const now = new Date().toISOString();
  const plus = U.bool(merged.plus);
  let b;
  if (type === 'block') {
    b = {
      ...base,
      id: base.id || crypto.randomUUID(),
      ref: base.ref || uniqueRef(state),
      type,
      ...slot,
      name: U.str(merged.name || 'Court blocked', { name: 'Reason', min: 1, max: 80 }),
      email: '',
      phone: '',
      players: 0,
      notes: U.str(merged.notes, { name: 'Notes', max: 300 }),
      plus,
      status: 'blocked',
      paymentStatus: 'n/a',
      paymentMethod: 'none',
      amount: 0,
      currency: s.currency,
      source: 'staff',
      createdAt: base.createdAt || now,
      updatedAt: now,
    };
  } else {
    const status = STATUSES.includes(merged.status) && merged.status !== 'blocked' ? merged.status : 'confirmed';
    const paymentStatus = ['unpaid', 'submitted', 'paid', 'refunded'].includes(merged.paymentStatus)
      ? merged.paymentStatus
      : 'unpaid';
    const players = U.int(merged.players || 1, { name: 'Players', min: 1, max: 12 });
    // Booked hours go up to the session length; a booking left where it is may
    // keep hours booked under longer opening hours.
    const maxHours = Math.max(slot.duration / 60, existing && !moved ? Number(base.hours) || 0 : 0);
    const hours = bookedHours(merged.hours ?? Math.min(maxHours, Math.max(1, slot.duration / 60)), maxHours);
    const amount = merged.amount === undefined || merged.amount === null || merged.amount === ''
      ? priceFor(s, hours, players, plus)
      : U.money(merged.amount, { name: 'Amount' });
    b = {
      ...base,
      id: base.id || crypto.randomUUID(),
      ref: base.ref || uniqueRef(state),
      type,
      ...slot,
      name: U.str(merged.name, { name: 'Name', min: 1, max: 80 }),
      email: U.email(merged.email, { required: false }),
      phone: U.phone(merged.phone, { required: false }),
      players,
      hours,
      notes: U.str(merged.notes, { name: 'Notes', max: 300 }),
      plus,
      status,
      paymentStatus,
      paymentMethod: merged.paymentMethod === 'bank' ? 'bank' : 'venue',
      amount,
      currency: base.currency || s.currency,
      paymentReference: U.str(merged.paymentReference, { name: 'Payment reference', max: 60 }),
      bank: base.bank || null,
      source: base.source || 'staff',
      createdAt: base.createdAt || now,
      updatedAt: now,
    };
    if (paymentStatus === 'paid' && !b.paidAt) b.paidAt = now;
    if (paymentStatus === 'paid' && b.paymentMethod === 'bank' && !b.bank && activeAccount(s)) {
      b.bank = publicAccount(activeAccount(s));
    }
    if (status === 'cancelled' && !b.cancelledAt) b.cancelledAt = now;
  }
  if (existing) {
    log(b, describeEdit(existing, b));
    Object.assign(existing, b);
    return existing;
  }
  log(b, type === 'block' ? 'Court blocked by staff' : 'Booked by staff');
  state.bookings.push(b);
  return b;
}

function describeEdit(before, after) {
  const changes = [];
  if (before.date !== after.date || before.start !== after.start || before.end !== after.end || before.court !== after.court) {
    changes.push('time or court');
  }
  if (before.status !== after.status) changes.push(`status to ${after.status.replace('_', '-')}`);
  if (before.paymentStatus !== after.paymentStatus) changes.push(`payment to ${after.paymentStatus}`);
  if (before.hours !== after.hours) changes.push('booked hours');
  if (before.amount !== after.amount) changes.push('amount');
  return changes.length ? `Changed ${changes.join(', ')}` : 'Details edited';
}

const ACTIONS = {
  confirm(state, b) {
    if (b.status !== 'pending') throw U.bad('Only pending bookings can be confirmed');
    b.status = 'confirmed';
    return 'Confirmed';
  },
  mark_paid(state, b) {
    if (b.paymentStatus === 'paid') throw U.bad('This booking is already paid');
    b.paymentStatus = 'paid';
    b.paidAt = new Date().toISOString();
    if (b.status === 'pending') b.status = 'confirmed';
    const acct = activeAccount(state.settings);
    if (b.paymentMethod === 'bank' && !b.bank && acct) b.bank = publicAccount(acct);
    return 'Payment received';
  },
  mark_unpaid(state, b) {
    b.paymentStatus = 'unpaid';
    b.paidAt = null;
    return 'Marked unpaid';
  },
  check_in(state, b) {
    if (!['pending', 'confirmed'].includes(b.status)) throw U.bad('Only active bookings can be checked in');
    b.status = 'completed';
    b.checkedInAt = new Date().toISOString();
    return 'Checked in';
  },
  no_show(state, b) {
    if (!['pending', 'confirmed'].includes(b.status)) throw U.bad('Only active bookings can be marked no-show');
    b.status = 'no_show';
    return 'Marked no-show';
  },
  cancel(state, b, reason) {
    if (b.status === 'cancelled') throw U.bad('This booking is already cancelled');
    b.status = 'cancelled';
    b.cancelledAt = new Date().toISOString();
    b.cancelReason = reason || 'Cancelled by staff';
    return b.cancelReason;
  },
  restore(state, b) {
    if (b.status !== 'cancelled') throw U.bad('Only cancelled bookings can be restored');
    if (b.source !== 'walkin' && !notOver(state.settings, b.date, U.toMin(b.end))) {
      throw U.bad('This booking’s session has already ended, so it can’t be restored. Make a new booking instead.');
    }
    const closed = closedOn(state.settings, b.date);
    if (closed) throw U.bad(`The club is closed on that date for ${closed.name}. Reopen the date in Settings first.`);
    // Other bookings don't matter (courts are shared); only blocked time does.
    const clash = findConflict(state, b.date, b.court, U.toMin(b.start), U.toMin(b.end), b.id, true);
    if (clash) throw U.bad('That court has been blocked since this booking was cancelled', 409);
    b.status = b.paymentStatus === 'paid' || b.paymentMethod === 'venue' ? 'confirmed' : 'pending';
    b.cancelledAt = null;
    b.cancelReason = '';
    return 'Restored';
  },
  refund(state, b) {
    if (b.paymentStatus !== 'paid') throw U.bad('Only paid bookings can be refunded');
    b.paymentStatus = 'refunded';
    b.refundedAt = new Date().toISOString();
    return 'Refunded';
  },
};

function applyAction(state, b, action, reason) {
  const fn = ACTIONS[action];
  if (!fn) throw U.bad('Unknown action');
  if (b.type === 'block') throw U.bad('Blocked time has no booking actions. Edit or delete it instead.');
  const what = fn(state, b, reason);
  b.updatedAt = new Date().toISOString();
  log(b, what);
  return b;
}

// ---- Player self-service ---------------------------------------------------------------

function findForPlayer(state, ref, email) {
  const r = String(ref || '').trim().toUpperCase();
  const e = String(email || '').trim().toLowerCase();
  if (!r || !e) throw U.bad('Enter your booking reference and email');
  const b = state.bookings.find((x) => x.ref === r && x.type === 'booking' && x.email === e);
  if (!b) throw U.bad('No booking matches that reference and email', 404);
  return b;
}

function playerCanCancel(state, b) {
  if (!['pending', 'confirmed'].includes(b.status)) return false;
  const now = U.nowIn(state.settings.timezone);
  return U.minutesUntil(now, b.date, U.toMin(b.start)) >= state.settings.cancelCutoffHours * 60;
}

function playerView(state, b) {
  const s = state.settings;
  const acct = activeAccount(s);
  // Unpaid bookings show the account currently in use, so changing the
  // account in Settings takes effect for everyone who still has to pay.
  const bank = b.paymentMethod === 'bank'
    ? (['paid', 'refunded', 'submitted'].includes(b.paymentStatus) && b.bank) || (acct ? publicAccount(acct) : null)
    : null;
  return {
    ref: b.ref,
    date: b.date,
    start: b.start,
    end: b.end,
    duration: b.duration,
    hours: b.hours,
    court: b.court,
    courtName: s.courtNames[b.court - 1] || `Court ${b.court}`,
    name: b.name,
    email: b.email,
    phone: b.phone,
    players: b.players,
    notes: b.notes,
    status: b.status,
    paymentStatus: b.paymentStatus,
    paymentMethod: b.paymentMethod,
    paymentReference: b.paymentReference,
    amount: b.amount,
    currency: b.currency,
    bank,
    paymentInstructions: s.paymentInstructions,
    canCancel: playerCanCancel(state, b),
    cancelCutoffHours: s.cancelCutoffHours,
    autoCancelHours: s.autoCancelHours,
    holdUntil: b.status === 'pending' && b.paymentStatus === 'unpaid' && s.autoCancelHours
      ? new Date(Date.parse(b.createdAt) + s.autoCancelHours * 3600000).toISOString()
      : null,
    cancelReason: b.cancelReason || '',
    createdAt: b.createdAt,
    facilityName: s.facilityName,
    address: s.address,
    timezone: s.timezone,
  };
}

function playerCancel(state, b) {
  if (!playerCanCancel(state, b)) {
    throw U.bad(
      state.settings.cancelCutoffHours
        ? `Bookings can be cancelled online up to ${state.settings.cancelCutoffHours} hours before the start time. Contact the club for help.`
        : 'This booking can no longer be cancelled online. Contact the club for help.'
    );
  }
  return applyAction(state, b, 'cancel', 'Cancelled by player');
}

function playerPaymentNotice(state, b, reference) {
  if (b.status === 'cancelled') throw U.bad('This booking is cancelled');
  if (b.paymentMethod !== 'bank') throw U.bad('This booking is paid at the venue');
  if (b.paymentStatus === 'paid') throw U.bad('This booking is already marked as paid');
  b.paymentReference = U.str(reference, { name: 'Transfer reference', min: 1, max: 60 });
  b.paymentStatus = 'submitted';
  b.paymentSubmittedAt = new Date().toISOString();
  const acct = activeAccount(state.settings);
  if (acct) b.bank = publicAccount(acct);
  b.updatedAt = b.paymentSubmittedAt;
  log(b, 'Player reported payment sent');
  return b;
}

/** Cancel bank-transfer bookings left unpaid past the hold time. Returns changed bookings. */
function sweepExpired(state) {
  const hours = state.settings.autoCancelHours;
  if (!hours) return [];
  const cutoff = Date.now() - hours * 3600000;
  const changed = [];
  for (const b of state.bookings) {
    if (
      b.type === 'booking' &&
      b.status === 'pending' &&
      b.paymentStatus === 'unpaid' &&
      b.paymentMethod === 'bank' &&
      Date.parse(b.createdAt) < cutoff
    ) {
      b.status = 'cancelled';
      b.cancelledAt = new Date().toISOString();
      b.cancelReason = `Payment not received within ${hours} hours`;
      b.updatedAt = b.cancelledAt;
      log(b, b.cancelReason);
      changed.push(b);
    }
  }
  return changed;
}

module.exports = {
  MAX_COURTS,
  MIN_COURTS,
  CURRENCIES,
  OCCUPYING,
  STATUSES,
  SOURCES,
  PAYMENT_STATUSES,
  DEFAULT_SETTINGS,
  createInitialState,
  normalizeState,
  sanitizeSettings,
  publicConfig,
  courtList,
  activeAccount,
  priceFor,
  hoursFor,
  sessionSlot,
  availability,
  closedOn,
  createPublicBooking,
  upsertStaffBooking,
  applyAction,
  findForPlayer,
  playerView,
  playerCancel,
  playerPaymentNotice,
  sweepExpired,
};
