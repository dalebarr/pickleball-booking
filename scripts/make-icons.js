'use strict';
// Generates the home-screen icons in public/icons (a pickleball on court green).
// Run with: node scripts/make-icons.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'public', 'icons');
const GREEN_TOP = [14, 140, 90];
const GREEN_BOTTOM = [8, 104, 66];
const BALL = [212, 228, 42];
const HOLE = [151, 168, 15];

// Ball and holes in a 24-unit space, matching the in-app logo.
const BALL_R = 9;
const HOLES = [[12, 12, 1.25], [12, 7.1, 1.05], [12, 16.9, 1.05], [7.75, 9.55, 1.05], [16.25, 9.55, 1.05], [7.75, 14.45, 1.05], [16.25, 14.45, 1.05]];

function colorAt(x, y) {
  // x, y in 0..1 of the icon; the ball fills the middle 64%.
  const u = 12 + (x - 0.5) * 24 / 0.64 * (BALL_R * 2 / 24);
  const v = 12 + (y - 0.5) * 24 / 0.64 * (BALL_R * 2 / 24);
  const bg = GREEN_TOP.map((c, i) => c + (GREEN_BOTTOM[i] - c) * y);
  if ((u - 12) ** 2 + (v - 12) ** 2 > BALL_R ** 2) return bg;
  for (const [hx, hy, hr] of HOLES) if ((u - hx) ** 2 + (v - hy) ** 2 <= hr * hr) return HOLE;
  return BALL;
}

function render(size) {
  const ss = 4; // supersampling for smooth edges
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let py = 0; py < size; py++) {
    raw[py * (size * 3 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const c = colorAt((px + (sx + 0.5) / ss) / size, (py + (sy + 0.5) / ss) / size);
          r += c[0]; g += c[1]; b += c[2];
        }
      }
      const o = py * (size * 3 + 1) + 1 + px * 3;
      raw[o] = Math.round(r / ss / ss);
      raw[o + 1] = Math.round(g / ss / ss);
      raw[o + 2] = Math.round(b / ss / ss);
    }
  }
  return png(size, size, raw);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'apple-touch-icon.png'), render(180));
fs.writeFileSync(path.join(OUT, 'icon-192.png'), render(192));
fs.writeFileSync(path.join(OUT, 'icon-512.png'), render(512));
fs.writeFileSync(path.join(OUT, 'icon.svg'),
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
  '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E8C5A"/><stop offset="1" stop-color="#086842"/></linearGradient></defs>' +
  '<rect width="64" height="64" rx="14" fill="url(#g)"/>' +
  '<g transform="translate(32 32) scale(2.27) translate(-12 -12)"><circle cx="12" cy="12" r="9" fill="#D4E42A"/>' +
  '<g fill="#97A80F">' + HOLES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('') + '</g></g></svg>\n');
console.log('Icons written to', OUT);
