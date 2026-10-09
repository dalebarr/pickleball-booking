'use strict';
// Generates the logo and home-screen icons in public/icons: a pickleball paddle
// with a ball, on court green. Run with: node scripts/make-icons.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'public', 'icons');
const GREEN_TOP = [14, 140, 90];
const GREEN_BOTTOM = [8, 104, 66];

// The artwork, drawn on a 24 x 24 grid. The paddle is tilted; the ball is not.
const PADDLE = { tx: -1, ty: 1, rot: -40, cx: 12, cy: 12 };
const ART = [
  { g: PADDLE, shape: 'rect', x: 6.9, y: 1.4, w: 10.2, h: 13, r: 3.8, fill: '#16241C' }, // edge guard
  { g: PADDLE, shape: 'rect', x: 7.6, y: 2.1, w: 8.8, h: 11.6, r: 3.1, fill: '#FFFFFF' }, // face
  { g: PADDLE, shape: 'poly', pts: [[10.1, 14.1], [13.9, 14.1], [13.3, 15.9], [10.7, 15.9]], fill: '#16241C' }, // throat
  { g: PADDLE, shape: 'rect', x: 10.6, y: 15.2, w: 2.8, h: 7.4, r: 1.2, fill: '#16241C' }, // handle
  { g: PADDLE, shape: 'line', x1: 10.6, y1: 17.6, x2: 13.4, y2: 17.0, w: 0.7, fill: '#46705A' },
  { g: PADDLE, shape: 'line', x1: 10.6, y1: 19.6, x2: 13.4, y2: 19.0, w: 0.7, fill: '#46705A' },
  { shape: 'circle', cx: 18.6, cy: 5.4, r: 3.4, fill: '#D4E42A' },
  ...[[18.6, 5.4, 0.55], [18.6, 3.5, 0.5], [18.6, 7.3, 0.5], [16.95, 4.45, 0.5], [20.25, 4.45, 0.5], [16.95, 6.35, 0.5], [20.25, 6.35, 0.5]]
    .map(([cx, cy, r]) => ({ shape: 'circle', cx, cy, r, fill: '#97A80F' })),
];

// ---- SVG ----------------------------------------------------------------------------------

function svgShape(s) {
  switch (s.shape) {
    case 'rect': return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.r}" fill="${s.fill}"/>`;
    case 'poly': return `<path d="M${s.pts.map((p) => p.join(' ')).join('L')}Z" fill="${s.fill}"/>`;
    case 'line': return `<path d="M${s.x1} ${s.y1}L${s.x2} ${s.y2}" stroke="${s.fill}" stroke-width="${s.w}"/>`;
    default: return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${s.fill}"/>`;
  }
}

function svgArt() {
  const t = `translate(${PADDLE.tx} ${PADDLE.ty}) rotate(${PADDLE.rot} ${PADDLE.cx} ${PADDLE.cy})`;
  return `<g transform="${t}">${ART.filter((s) => s.g).map(svgShape).join('')}</g>` +
    ART.filter((s) => !s.g).map(svgShape).join('');
}

// ---- Raster -------------------------------------------------------------------------------

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

function toLocal(g, x, y) {
  // Undo the translate, then rotate back around the centre.
  const a = (-g.rot * Math.PI) / 180;
  const dx = x - g.tx - g.cx;
  const dy = y - g.ty - g.cy;
  return [g.cx + dx * Math.cos(a) - dy * Math.sin(a), g.cy + dx * Math.sin(a) + dy * Math.cos(a)];
}

function inside(s, x, y) {
  if (s.shape === 'circle') return (x - s.cx) ** 2 + (y - s.cy) ** 2 <= s.r * s.r;
  if (s.shape === 'rect') {
    if (x < s.x || x > s.x + s.w || y < s.y || y > s.y + s.h) return false;
    const dx = Math.max(s.x + s.r - x, 0, x - (s.x + s.w - s.r));
    const dy = Math.max(s.y + s.r - y, 0, y - (s.y + s.h - s.r));
    return dx * dx + dy * dy <= s.r * s.r;
  }
  if (s.shape === 'line') {
    const vx = s.x2 - s.x1;
    const vy = s.y2 - s.y1;
    const t = Math.max(0, Math.min(1, ((x - s.x1) * vx + (y - s.y1) * vy) / (vx * vx + vy * vy)));
    return (x - s.x1 - t * vx) ** 2 + (y - s.y1 - t * vy) ** 2 <= (s.w / 2) ** 2;
  }
  let c = false; // polygon, even-odd rule
  for (let i = 0, j = s.pts.length - 1; i < s.pts.length; j = i++) {
    const [xi, yi] = s.pts[i];
    const [xj, yj] = s.pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

const ART_SCALE = 0.78; // share of the icon the 24-unit artwork fills

function colorAt(u, v) {
  // u, v run 0..1 across the icon.
  let color = GREEN_TOP.map((c, i) => c + (GREEN_BOTTOM[i] - c) * v);
  const x = 12 + ((u - 0.5) * 24) / ART_SCALE;
  const y = 12 + ((v - 0.5) * 24) / ART_SCALE;
  for (const s of ART) {
    const [lx, ly] = s.g ? toLocal(s.g, x, y) : [x, y];
    if (inside(s, lx, ly)) color = hex(s.fill);
  }
  return color;
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
// Browser-tab icon: the artwork on a rounded green square.
fs.writeFileSync(path.join(OUT, 'icon.svg'),
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
  '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E8C5A"/><stop offset="1" stop-color="#086842"/></linearGradient></defs>' +
  '<rect width="64" height="64" rx="14" fill="url(#g)"/>' +
  `<g transform="translate(32 32) scale(${((64 * ART_SCALE) / 24).toFixed(3)}) translate(-12 -12)">${svgArt()}</g></svg>\n`);
// In-app logo shown next to the club name (transparent background).
fs.writeFileSync(path.join(OUT, 'logo.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${svgArt()}</svg>\n`);
console.log('Icons written to', OUT);
