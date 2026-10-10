'use strict';

// New Zealand national public holidays (Holidays Act 2003), with the "Mondayised"
// observed days when a holiday falls on a weekend. Regional anniversary days differ
// by region, so clubs add those themselves as special dates.

// Matariki moves each year and is set in law (Te Kāhui o Matariki Public Holiday Act 2022).
const MATARIKI = {
  2025: '06-20', 2026: '07-10', 2027: '06-25', 2028: '07-14', 2029: '07-06', 2030: '06-21',
};

const iso = (y, m, d) => new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);
const dayOfWeek = (s) => new Date(s + 'T00:00:00Z').getUTCDay();
const addDays = (s, n) => {
  const d = new Date(s + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Easter Sunday (Gregorian calendar, Meeus/Jones/Butcher method). */
function easterSunday(y) {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return iso(y, month, day);
}

/** The nth Monday of a month (n = 1 for the first). */
function nthMonday(y, month, n) {
  const first = 1 + ((8 - dayOfWeek(iso(y, month, 1))) % 7);
  return iso(y, month, first + 7 * (n - 1));
}

// Waitangi Day and Anzac Day: a weekend holiday is also observed on the Monday after.
function single(list, date, name) {
  list.push({ date, name });
  const w = dayOfWeek(date);
  if (w === 6) list.push({ date: addDays(date, 2), name: `${name} (observed)` });
  if (w === 0) list.push({ date: addDays(date, 1), name: `${name} (observed)` });
}

// New Year (1–2 Jan) and Christmas (25–26 Dec) come in pairs, Mondayised together.
function pair(list, first, name1, name2) {
  list.push({ date: first, name: name1 }, { date: addDays(first, 1), name: name2 });
  const w = dayOfWeek(first);
  if (w === 5) list.push({ date: addDays(first, 3), name: `${name2} (observed)` });
  if (w === 6) {
    list.push({ date: addDays(first, 2), name: `${name1} (observed)` }, { date: addDays(first, 3), name: `${name2} (observed)` });
  }
  if (w === 0) list.push({ date: addDays(first, 2), name: `${name1} (observed)` });
}

/** National public holidays for a year, sorted by date. */
function nzPublicHolidays(year) {
  const out = [];
  pair(out, iso(year, 1, 1), 'New Year’s Day', 'Day after New Year’s Day');
  single(out, iso(year, 2, 6), 'Waitangi Day');
  const easter = easterSunday(year);
  out.push({ date: addDays(easter, -2), name: 'Good Friday' }, { date: addDays(easter, 1), name: 'Easter Monday' });
  single(out, iso(year, 4, 25), 'Anzac Day');
  out.push({ date: nthMonday(year, 6, 1), name: 'King’s Birthday' });
  if (MATARIKI[year]) out.push({ date: `${year}-${MATARIKI[year]}`, name: 'Matariki' });
  out.push({ date: nthMonday(year, 10, 4), name: 'Labour Day' });
  pair(out, iso(year, 12, 25), 'Christmas Day', 'Boxing Day');
  return out.sort((x, y) => x.date.localeCompare(y.date));
}

module.exports = { nzPublicHolidays, easterSunday };
