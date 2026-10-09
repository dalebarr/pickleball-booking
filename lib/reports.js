'use strict';

const U = require('./util');
const B = require('./bookings');

const round2 = (n) => Math.round(n * 100) / 100;
const isActive = (b) => b.status !== 'cancelled';
const sortAsc = (a, b) => (a.date + a.start + a.court).localeCompare(b.date + b.start + b.court);

function list(v, allowed) {
  if (!v) return [];
  return String(v)
    .split(',')
    .map((x) => x.trim())
    .filter((x) => allowed.includes(x));
}

function parseFilters(q = {}) {
  const f = {
    from: U.isDate(q.from) ? q.from : null,
    to: U.isDate(q.to) ? q.to : null,
    court: [1, 2, 3].includes(Number(q.court)) ? Number(q.court) : null,
    status: list(q.status, B.STATUSES),
    payment: list(q.payment, B.PAYMENT_STATUSES),
    method: ['bank', 'venue'].includes(q.method) ? q.method : null,
    // PLUS reserve: "yes" = only PLUS reserves, "no" = only regular rate, absent = both.
    plus: q.plus === 'yes' ? true : q.plus === 'no' ? false : null,
    type: ['booking', 'block', 'all'].includes(q.type) ? q.type : 'booking',
    q: String(q.q || '').trim().toLowerCase().slice(0, 80),
    sort: q.sort === 'desc' ? 'desc' : 'asc',
  };
  if (f.from && f.to && f.from > f.to) [f.from, f.to] = [f.to, f.from];
  return f;
}

function applyFilters(bookings, f) {
  const rows = bookings.filter((b) => {
    if (f.type !== 'all' && b.type !== f.type) return false;
    if (f.from && b.date < f.from) return false;
    if (f.to && b.date > f.to) return false;
    if (f.court && b.court !== f.court) return false;
    if (f.status.length && !f.status.includes(b.status)) return false;
    if (f.payment.length && !f.payment.includes(b.paymentStatus)) return false;
    if (f.method && b.paymentMethod !== f.method) return false;
    if (f.plus !== null && Boolean(b.plus) !== f.plus) return false;
    if (f.q) {
      const hay = `${b.ref} ${b.name} ${b.email} ${b.phone} ${b.notes} ${b.paymentReference || ''}`.toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    return true;
  });
  rows.sort(sortAsc);
  if (f.sort === 'desc') rows.reverse();
  return rows;
}

function money(rows) {
  let billed = 0;
  let collected = 0;
  let outstanding = 0;
  let refunded = 0;
  for (const b of rows) {
    if (b.type !== 'booking') continue;
    if (isActive(b)) billed += b.amount;
    if (b.paymentStatus === 'paid') collected += b.amount;
    if (b.paymentStatus === 'refunded') refunded += b.amount;
    if (isActive(b) && (b.paymentStatus === 'unpaid' || b.paymentStatus === 'submitted')) outstanding += b.amount;
  }
  return { billed: round2(billed), collected: round2(collected), outstanding: round2(outstanding), refunded: round2(refunded) };
}

function report(state, query) {
  const s = state.settings;
  const f = parseFilters(query);
  const rows = applyFilters(state.bookings, f);
  const bookingRows = rows.filter((b) => b.type === 'booking');
  const active = bookingRows.filter(isActive);

  // The period used for utilization and the chart: the chosen range, or the
  // span of the matching bookings when no range is set.
  const dates = rows.map((b) => b.date).sort();
  const today = U.nowIn(s.timezone).date;
  const from = f.from || dates[0] || today;
  const to = f.to || dates[dates.length - 1] || today;
  const days = U.daysBetween(from, to) + 1;
  const openMinutes = U.toMin(s.closeTime) - U.toMin(s.openTime);
  const courts = f.court ? 1 : s.courtCount;
  const bookedMinutes = rows.filter((b) => b.type === 'booking' && B.OCCUPYING.has(b.status))
    .reduce((n, b) => n + b.duration, 0);
  const capacity = days * openMinutes * courts;

  const summary = {
    bookings: bookingRows.length,
    active: active.length,
    cancelled: bookingRows.filter((b) => b.status === 'cancelled').length,
    noShows: bookingRows.filter((b) => b.status === 'no_show').length,
    blocks: rows.filter((b) => b.type === 'block').length,
    hours: round2(active.reduce((n, b) => n + b.duration, 0) / 60),
    players: active.reduce((n, b) => n + (b.players || 0), 0),
    ...money(rows),
    utilization: capacity > 0 ? Math.min(1, bookedMinutes / capacity) : 0,
    averageValue: active.length ? round2(active.reduce((n, b) => n + b.amount, 0) / active.length) : 0,
    from,
    to,
    days,
  };

  const group = (keyFn, keys) => {
    const map = new Map(keys.map((k) => [k, []]));
    for (const b of bookingRows) {
      const k = keyFn(b);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(b);
    }
    return [...map].map(([key, items]) => {
      const live = items.filter(isActive);
      return {
        key,
        bookings: items.length,
        active: live.length,
        hours: round2(live.reduce((n, b) => n + b.duration, 0) / 60),
        ...money(items),
      };
    });
  };

  const courtKeys = f.court ? [f.court] : B.courtList(s).map((c) => c.id);
  const byCourt = group((b) => b.court, courtKeys).map((g) => ({ ...g, name: s.courtNames[g.key - 1] || `Court ${g.key}` }));
  const byStatus = group((b) => b.status, ['pending', 'confirmed', 'completed', 'no_show', 'cancelled']).filter((g) => g.bookings);
  const byPayment = group((b) => b.paymentStatus, ['unpaid', 'submitted', 'paid', 'refunded']).filter((g) => g.bookings);
  const byMethod = group((b) => b.paymentMethod, ['bank', 'venue']).filter((g) => g.bookings);
  const byRate = group((b) => (b.plus ? 'plus' : 'regular'), ['regular', 'plus']).filter((g) => g.bookings);

  // Time series: by day for short ranges, by month for long ones.
  const unit = days <= 62 ? 'day' : 'month';
  const keyOf = (d) => (unit === 'day' ? d : d.slice(0, 7));
  const keys = [];
  if (unit === 'day') {
    for (let d = from; d <= to; d = U.addDays(d, 1)) keys.push(d);
  } else {
    let [y, m] = from.slice(0, 7).split('-').map(Number);
    const end = to.slice(0, 7);
    for (let i = 0; i < 240; i++) {
      const k = `${y}-${String(m).padStart(2, '0')}`;
      keys.push(k);
      if (k >= end) break;
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
  }
  const series = { unit, points: group((b) => keyOf(b.date), keys).filter((g) => keys.includes(g.key)) };

  const open = U.toMin(s.openTime);
  const close = U.toMin(s.closeTime);
  const hourKeys = [];
  for (let h = Math.floor(open / 60); h * 60 < close; h++) hourKeys.push(h);
  const byHour = hourKeys.map((h) => ({
    hour: h,
    bookings: active.filter((b) => Math.floor(U.toMin(b.start) / 60) === h).length,
  }));
  const byWeekday = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
    day: d,
    bookings: active.filter((b) => U.weekday(b.date) === d).length,
  }));

  return { filters: f, currency: s.currency, summary, byCourt, byStatus, byPayment, byMethod, byRate, series, byHour, byWeekday, rows };
}

function dashboard(state) {
  const s = state.settings;
  const now = U.nowIn(s.timezone);
  const today = now.date;
  const bookings = state.bookings.filter((b) => b.type === 'booking');
  const openMinutes = U.toMin(s.closeTime) - U.toMin(s.openTime);
  const courts = B.courtList(s);

  const todays = bookings.filter((b) => b.date === today && isActive(b));
  const todayMinutes = todays.reduce((n, b) => n + b.duration, 0);
  const month = today.slice(0, 7);
  const monthRows = bookings.filter((b) => b.date.startsWith(month));
  const lastMonthKey = U.addDays(month + '-01', -1).slice(0, 7);
  const lastMonthRows = bookings.filter((b) => b.date.startsWith(lastMonthKey));

  const trend = [];
  for (let i = -13; i <= 0; i++) {
    const d = U.addDays(today, i);
    const rows = bookings.filter((b) => b.date === d && isActive(b));
    trend.push({ date: d, bookings: rows.length, revenue: round2(rows.reduce((n, b) => n + b.amount, 0)) });
  }
  const ahead = [];
  for (let i = 0; i < 7; i++) {
    const d = U.addDays(today, i);
    const rows = bookings.filter((b) => b.date === d && isActive(b));
    ahead.push({ date: d, bookings: rows.length, minutes: rows.reduce((n, b) => n + b.duration, 0) });
  }

  const isUpcoming = (b) => b.date > today || (b.date === today && U.toMin(b.end) > now.minutes);
  const upcoming = bookings
    .filter((b) => ['pending', 'confirmed'].includes(b.status) && isUpcoming(b))
    .sort(sortAsc);
  const unpaidUpcoming = upcoming.filter((b) => b.paymentStatus === 'unpaid');
  const toVerify = bookings
    .filter((b) => b.paymentStatus === 'submitted' && isActive(b))
    .sort((a, b) => String(a.paymentSubmittedAt).localeCompare(String(b.paymentSubmittedAt)));

  const schedule = courts.map((c) => {
    const items = state.bookings
      .filter((b) => b.date === today && b.court === c.id && B.OCCUPYING.has(b.status))
      .sort(sortAsc);
    const minutes = items.filter((b) => b.type === 'booking').reduce((n, b) => n + b.duration, 0);
    return { court: c.id, name: c.name, utilization: openMinutes ? minutes / openMinutes : 0, items };
  });

  return {
    now,
    currency: s.currency,
    today: {
      date: today,
      bookings: todays.length,
      players: todays.reduce((n, b) => n + (b.players || 0), 0),
      revenue: round2(todays.reduce((n, b) => n + b.amount, 0)),
      utilization: openMinutes ? todayMinutes / (openMinutes * courts.length) : 0,
    },
    month: {
      key: month,
      bookings: monthRows.filter(isActive).length,
      ...money(monthRows),
      lastMonth: { key: lastMonthKey, ...money(lastMonthRows) },
    },
    payments: {
      toVerify: toVerify.length,
      toVerifyAmount: round2(toVerify.reduce((n, b) => n + b.amount, 0)),
      unpaidUpcoming: unpaidUpcoming.length,
      unpaidAmount: round2(unpaidUpcoming.reduce((n, b) => n + b.amount, 0)),
    },
    trend,
    ahead,
    schedule,
    upcoming: upcoming.slice(0, 8),
    toVerify: toVerify.slice(0, 10),
    checklist: {
      bankAccount: s.bankAccounts.length > 0,
      contact: Boolean(s.contactPhone || s.contactEmail),
      timezone: s.timezone !== 'UTC',
    },
  };
}

// ---- CSV ------------------------------------------------------------------------------------

function csvCell(v) {
  let s = v === null || v === undefined ? '' : String(v);
  // Stop spreadsheet apps from treating player-entered text as a formula.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

const STATUS_LABEL = {
  pending: 'Pending payment', confirmed: 'Confirmed', completed: 'Checked in', no_show: 'No-show',
  cancelled: 'Cancelled', blocked: 'Blocked',
};
const PAYMENT_LABEL = { unpaid: 'Unpaid', submitted: 'To verify', paid: 'Paid', refunded: 'Refunded', 'n/a': '' };
const METHOD_LABEL = { bank: 'Bank transfer', venue: 'Pay at venue', none: '' };

function toCsv(state, rows) {
  const s = state.settings;
  const header = [
    'Reference', 'Type', 'Date', 'Start', 'End', 'Minutes', 'Court', 'Name', 'Email', 'Phone', 'Players',
    'Rate', 'Status', 'Payment status', 'Payment method', 'Amount', 'Currency', 'Transfer reference', 'Paid into',
    'Source', 'Booked at', 'Notes',
  ];
  const lines = [header.map(csvCell).join(',')];
  for (const b of rows) {
    lines.push([
      b.ref, b.type === 'block' ? 'Blocked time' : 'Booking', b.date, b.start, b.end, b.duration,
      s.courtNames[b.court - 1] || `Court ${b.court}`, b.name, b.email, b.phone, b.players,
      b.plus ? 'PLUS reserve' : 'Regular',
      STATUS_LABEL[b.status] || b.status, PAYMENT_LABEL[b.paymentStatus] || '', METHOD_LABEL[b.paymentMethod] || '',
      b.amount.toFixed(2), b.currency, b.paymentReference || '',
      b.bank ? `${b.bank.bankName} ${b.bank.accountNumber}` : '', b.source, b.createdAt, b.notes,
    ].map(csvCell).join(','));
  }
  return '﻿' + lines.join('\r\n') + '\r\n';
}

module.exports = { parseFilters, applyFilters, report, dashboard, toCsv };
