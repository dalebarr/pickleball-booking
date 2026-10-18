'use strict';

// SJV Hall payments: what the club has paid for the hall. Staff only.
// Each payment is { id, date, amount, paidBy, createdAt, updatedAt }.

const crypto = require('crypto');
const U = require('./util');

const round2 = (n) => Math.round(n * 100) / 100;

/** Newest payment date first. */
function list(state) {
  return [...state.hallPayments].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

function find(state, id) {
  const p = state.hallPayments.find((x) => x.id === id);
  if (!p) throw U.bad('Payment not found', 404);
  return p;
}

/** Validate a payment. `base` is the payment being edited, so missing fields keep their value. */
function sanitize(input, base = {}) {
  const v = { ...base, ...(input || {}) };
  if (!U.isDate(v.date)) throw U.bad('Choose the payment date');
  return {
    date: v.date,
    amount: U.money(v.amount, { name: 'Amount paid', min: 0.01 }),
    paidBy: U.str(v.paidBy, { name: 'Paid by', min: 1, max: 80 }),
  };
}

function create(state, input) {
  const now = new Date().toISOString();
  const p = { id: crypto.randomUUID(), ...sanitize(input), createdAt: now, updatedAt: now };
  state.hallPayments.push(p);
  return p;
}

function update(state, id, input) {
  const p = find(state, id);
  Object.assign(p, sanitize(input, p), { updatedAt: new Date().toISOString() });
  return p;
}

function remove(state, id) {
  const p = find(state, id);
  state.hallPayments = state.hallPayments.filter((x) => x.id !== id);
  return p;
}

/** Totals for the dashboard: all payments, and this month's (club time). */
function summary(state) {
  const month = U.nowIn(state.settings.timezone).date.slice(0, 7);
  const all = state.hallPayments;
  const latest = list(state)[0] || null;
  return {
    total: round2(all.reduce((n, p) => n + p.amount, 0)),
    count: all.length,
    month: round2(all.filter((p) => p.date.startsWith(month)).reduce((n, p) => n + p.amount, 0)),
    monthKey: month,
    last: latest ? { date: latest.date, amount: latest.amount, paidBy: latest.paidBy } : null,
  };
}

module.exports = { list, create, update, remove, summary };
