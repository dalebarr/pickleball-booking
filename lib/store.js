'use strict';

// All data lives in memory while the server runs and is written through to a
// backend on every change. Two backends:
//   - JSON file (default): data/db.json next to the app, or DATA_DIR.
//   - PostgreSQL: set DATABASE_URL (for hosts without a persistent disk).
// The server is a single process, so in-memory checks (like double-booking)
// are race-free.

const fs = require('fs');
const path = require('path');

class JsonBackend {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, 'db.json');
    this.timer = null;
    this.state = null;
    this.flushing = Promise.resolve();
  }

  describe() {
    return `JSON file at ${this.file}`;
  }

  async load() {
    fs.mkdirSync(this.dir, { recursive: true });
    try {
      return JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') return null;
      throw new Error(`Could not read ${this.file}: ${err.message}`);
    }
  }

  // Writes are coalesced: many changes in one tick produce one file write.
  schedule(state) {
    this.state = state;
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.flushing = this.flushing.then(() => this.write()).catch((err) => {
        console.error('Failed to save data:', err);
      });
    }, 25);
  }

  async write() {
    const json = JSON.stringify(this.state, null, 1);
    const tmp = this.file + '.tmp';
    await fs.promises.writeFile(tmp, json);
    try {
      await fs.promises.rename(tmp, this.file);
    } catch {
      // Windows can refuse a rename while another program holds the file.
      await fs.promises.writeFile(this.file, json);
      await fs.promises.rm(tmp, { force: true });
    }
  }

  saveMeta(state) { this.schedule(state); }
  saveBooking(state) { this.schedule(state); }
  deleteBooking(state) { this.schedule(state); }

  async close() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
      await this.write();
    }
    await this.flushing;
  }
}

class PgBackend {
  constructor(url, pgModule) {
    const { Pool } = pgModule || require('pg');
    const local = /@(localhost|127\.0\.0\.1)(:|\/)/.test(url);
    const ssl = local || /sslmode=/.test(url) || process.env.DATABASE_SSL === 'false'
      ? undefined
      : { rejectUnauthorized: false };
    this.pool = new Pool({ connectionString: url, ssl, max: 4 });
    // One queue keeps writes in the order they happened.
    this.queue = Promise.resolve();
  }

  describe() {
    return 'PostgreSQL (DATABASE_URL)';
  }

  async load() {
    await this.pool.query(
      'CREATE TABLE IF NOT EXISTS pb_meta (id INTEGER PRIMARY KEY, data JSONB NOT NULL)'
    );
    await this.pool.query(
      'CREATE TABLE IF NOT EXISTS pb_bookings (id TEXT PRIMARY KEY, data JSONB NOT NULL)'
    );
    const meta = await this.pool.query('SELECT data FROM pb_meta WHERE id = 1');
    if (!meta.rows.length) return null;
    const rows = await this.pool.query('SELECT data FROM pb_bookings');
    return { ...meta.rows[0].data, bookings: rows.rows.map((r) => r.data) };
  }

  enqueue(fn) {
    this.queue = this.queue.then(fn).catch((err) => console.error('Failed to save data:', err));
  }

  saveMeta(state) {
    const { bookings, ...meta } = state;
    const json = JSON.stringify(meta);
    this.enqueue(() =>
      this.pool.query(
        'INSERT INTO pb_meta (id, data) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data',
        [json]
      )
    );
  }

  saveBooking(state, booking) {
    const json = JSON.stringify(booking);
    this.enqueue(() =>
      this.pool.query(
        'INSERT INTO pb_bookings (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data',
        [booking.id, json]
      )
    );
  }

  deleteBooking(state, id) {
    this.enqueue(() => this.pool.query('DELETE FROM pb_bookings WHERE id = $1', [id]));
  }

  async saveAll(state) {
    this.saveMeta(state);
    for (const b of state.bookings) this.saveBooking(state, b);
    await this.queue;
  }

  async close() {
    await this.queue;
    await this.pool.end();
  }
}

function createBackend({ databaseUrl, dataDir, pgModule } = {}) {
  if (databaseUrl) return new PgBackend(databaseUrl, pgModule);
  return new JsonBackend(dataDir);
}

module.exports = { createBackend, JsonBackend, PgBackend };
