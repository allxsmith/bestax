/**
 * Flat layers for behind and in front of a voxel scene: skies, blocky clouds,
 * a square sun, stars, and pixel text and sprites. Each returns SVG markup in
 * the image's own pixels; gradients come back as definitions to pass to
 * `document()` alongside the scene's.
 */
import { FONT } from '../pixel-cover-lib.mjs';
import { rng } from './voxel.mjs';

function n(v) {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
}

/** A rectangle, optionally translucent. */
export function rect(x, y, w, h, fill, opacity) {
  const o = opacity === undefined ? '' : ` fill-opacity="${n(opacity)}"`;
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}"${o}/>`;
}

/**
 * A vertical gradient: `stops` is [[offset 0..1, color], ...]. Returns the
 * definition and a full-size rectangle that paints it.
 */
export function gradient(
  id,
  width,
  height,
  stops,
  { x1 = 0, y1 = 0, x2 = 0, y2 = 1 } = {}
) {
  const def =
    `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
    stops
      .map(([o, c]) => `<stop offset="${n(o)}" stop-color="${c}"/>`)
      .join('') +
    '</linearGradient>';
  return {
    def,
    layer: `<rect width="${width}" height="${height}" fill="url(#${id})"/>`,
  };
}

/**
 * A sky in hard bands rather than a smooth fade, the way a pixel game draws
 * one: `stops` as for gradient(), split into `bands` flat stripes.
 */
export function bandedSky(width, height, stops, bands = 8, top = 0) {
  const out = [];
  const h = (height - top) / bands;
  for (let i = 0; i < bands; i++) {
    const t = bands === 1 ? 0 : i / (bands - 1);
    out.push(rect(0, top + i * h, width, h + 0.5, colorAt(stops, t)));
  }
  return out.join('');
}

function colorAt(stops, t) {
  for (let i = 1; i < stops.length; i++) {
    const [o0, c0] = stops[i - 1];
    const [o1, c1] = stops[i];
    if (t <= o1) {
      const k = o1 === o0 ? 0 : (t - o0) / (o1 - o0);
      return lerpHex(c0, c1, k);
    }
  }
  return stops[stops.length - 1][1];
}

function lerpHex(a, b, t) {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return (
    '#' +
    pa
      .map((v, i) =>
        Math.round(v + (pb[i] - v) * t)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  );
}

/**
 * A flat blocky cloud: rows of cells `cell` pixels square, seeded so each
 * cloud has its own outline. `w` and `h` are in cells.
 */
export function cloud(
  x,
  y,
  w,
  h,
  cell,
  { seed = 1, color = '#ffffff', shadow = '#dfe8f2', opacity = 1 } = {}
) {
  const r = rng(seed);
  const rows = [];
  for (let j = 0; j < h; j++) {
    const inset = Math.floor((h - 1 - j) * (0.6 + r() * 0.8));
    const start = Math.max(0, inset - Math.floor(r() * 2));
    const end = w - Math.max(0, inset - Math.floor(r() * 2));
    rows.push([start, end]);
  }
  let d = '';
  rows.forEach(([a, b], j) => {
    if (b > a)
      d += `M${n(x + a * cell)} ${n(y + j * cell)}h${n((b - a) * cell)}v${n(cell)}h${n(-(b - a) * cell)}z`;
  });
  const [a, b] = rows[h - 1];
  const under = `M${n(x + a * cell)} ${n(y + h * cell)}h${n((b - a) * cell)}v${n(cell * 0.6)}h${n(-(b - a) * cell)}z`;
  const o = opacity === 1 ? '' : ` fill-opacity="${n(opacity)}"`;
  return `<path fill="${shadow}"${o} d="${under}"/><path fill="${color}"${o} d="${d}"/>`;
}

/** A square sun or moon with a stepped glow around it. */
export function squareSun(cx, cy, size, color, { glow = [], step } = {}) {
  const s = step ?? size / 4;
  const out = [];
  glow.forEach((c, i) => {
    const g = size + 2 * s * (glow.length - i);
    out.push(rect(cx - g / 2, cy - g / 2, g, g, c));
  });
  out.push(rect(cx - size / 2, cy - size / 2, size, size, color));
  return out.join('');
}

/** Scattered square stars, seeded, inside the box. */
export function stars(
  box,
  count,
  { seed = 1, size = 3, colors = ['#ffffff', '#cfe0ff'] } = {}
) {
  const r = rng(seed);
  let d = {};
  for (let i = 0; i < count; i++) {
    const c = colors[Math.floor(r() * colors.length)];
    const s = r() < 0.2 ? size * 2 : size;
    const x = box.x + Math.floor(r() * box.width);
    const y = box.y + Math.floor(r() * box.height);
    d[c] = (d[c] ?? '') + `M${x} ${y}h${s}v${s}h${-s}z`;
  }
  return Object.entries(d)
    .map(([c, p]) => `<path fill="${c}" d="${p}"/>`)
    .join('');
}

/** The width in pixels of `str` in the 5x7 pixel font at `px` pixels a dot. */
export function textWidth(str, px) {
  return str.length ? (str.length * 6 - 1) * px : 0;
}

/** Text in the 5x7 pixel font, its top-left at (x, y), `px` pixels a dot. */
export function pixelText(str, x, y, px, fill, { opacity } = {}) {
  let d = '';
  [...str].forEach((ch, i) => {
    const glyph = FONT[ch];
    if (!glyph) return;
    glyph.forEach((row, j) => {
      let u = 0;
      while (u < row.length) {
        if (row[u] !== '1') {
          u++;
          continue;
        }
        let end = u;
        while (end < row.length && row[end] === '1') end++;
        d += `M${n(x + (i * 6 + u) * px)} ${n(y + j * px)}h${n((end - u) * px)}v${n(px)}h${n(-(end - u) * px)}z`;
        u = end;
      }
    });
  });
  const o = opacity === undefined ? '' : ` fill-opacity="${n(opacity)}"`;
  return d ? `<path fill="${fill}"${o} d="${d}"/>` : '';
}

/**
 * Pixel art from rows of characters: each character is a key into `palette`
 * (a color), and '.' or a space is empty. Top-left at (x, y), `px` a pixel.
 */
export function sprite(rows, palette, x, y, px) {
  const byColor = {};
  rows.forEach((row, j) => {
    let u = 0;
    while (u < row.length) {
      const ch = row[u];
      if (ch === '.' || ch === ' ' || !palette[ch]) {
        u++;
        continue;
      }
      let end = u;
      while (end < row.length && row[end] === ch) end++;
      const c = palette[ch];
      byColor[c] =
        (byColor[c] ?? '') +
        `M${n(x + u * px)} ${n(y + j * px)}h${n((end - u) * px)}v${n(px)}h${n(-(end - u) * px)}z`;
      u = end;
    }
  });
  return Object.entries(byColor)
    .map(([c, d]) => `<path fill="${c}" d="${d}"/>`)
    .join('');
}
