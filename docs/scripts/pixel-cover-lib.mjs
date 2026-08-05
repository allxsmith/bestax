/**
 * Reusable core for the blog's pixel-art covers (the house style established by
 * the v5-one-css-story and fighting-ai-training-bias covers): a 5x7 pixel font,
 * the shared palette, and rect-based drawing helpers that emit pure-<rect> SVG
 * with shape-rendering="crispEdges".
 *
 * This module draws nothing by itself — a per-post script composes scenes with
 * it and writes the SVG masters into docs/static/img/. The output contract is
 * enforced by scripts/rasterize-cover.mjs (1200x630, explicit width/height, an
 * opaque full-bleed background rect painted first); Canvas#svg() satisfies it
 * by construction.
 *
 * Usage sketch:
 *   import { Canvas, PALETTE as P, textW, starfield } from './pixel-cover-lib.mjs';
 *   const c = new Canvas();
 *   starfield(c, 41, 24);
 *   c.textShadow('HELLO', 90, 60, 12, P.yellow);
 *   writeFileSync('static/img/my-post.svg', c.svg('Hello, drawn as pixel art: ...'));
 *   // then: pnpm --filter @allxsmith/bestax-docs rasterize:cover static/img/my-post.svg
 */

export const COVER_WIDTH = 1200;
export const COVER_HEIGHT = 630;

// Palette lifted from docs/static/img/v5-one-css-story.svg so new covers stay
// in the established look. bg is the mandatory full-bleed background.
export const PALETTE = {
  bg: '#071a24',
  star1: '#ffffff',
  star2: '#7fc7c9',
  panel: '#26455a',
  panelLt: '#3f6b82',
  panelDk: '#142c3a',
  inner: '#0b2530',
  line: '#1a3648',
  teal: '#00d1b2',
  tealLt: '#4de8cc',
  tealDk: '#009e85',
  yellow: '#ffd24a',
  yellowDk: '#c79a1f',
  steel: '#7fb3bd',
  steelDk: '#4f7c8a',
  muted: '#8b97b0',
  white: '#f4f7ff',
  shadow: '#04303a',
  gray: '#5c6f85',
  grayLt: '#7c8ea3',
  grayDk: '#3d4d63',
  paper: '#e8eef6',
  paperDk: '#b9c6d8',
};

/**
 * Deterministic PRNG (LCG). Cover generation must be reproducible, so scene
 * scripts seed this instead of calling Math.random().
 */
export function lcg(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

// 5x7 pixel font, rows top->bottom, '1' = filled. Lowercase descenders
// (g j p q y) carry 9 rows; everything else 7. Coverage: A-Z a-z 0-9 . - _ / :
// and space. Unknown characters render as a space.
export const FONT = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  a: ['00000', '00000', '01110', '00001', '01111', '10001', '01111'],
  b: ['10000', '10000', '11110', '10001', '10001', '10001', '11110'],
  c: ['00000', '00000', '01111', '10000', '10000', '10000', '01111'],
  d: ['00001', '00001', '01111', '10001', '10001', '10001', '01111'],
  e: ['00000', '00000', '01110', '10001', '11111', '10000', '01110'],
  f: ['00110', '01000', '11110', '01000', '01000', '01000', '01000'],
  g: [
    '00000',
    '00000',
    '01111',
    '10001',
    '10001',
    '01111',
    '00001',
    '00001',
    '01110',
  ],
  h: ['10000', '10000', '11110', '10001', '10001', '10001', '10001'],
  i: ['00100', '00000', '01100', '00100', '00100', '00100', '01110'],
  j: [
    '00010',
    '00000',
    '00110',
    '00010',
    '00010',
    '00010',
    '00010',
    '10010',
    '01100',
  ],
  k: ['10000', '10000', '10010', '10100', '11000', '10100', '10010'],
  l: ['01100', '00100', '00100', '00100', '00100', '00100', '01110'],
  m: ['00000', '00000', '11010', '10101', '10101', '10101', '10101'],
  n: ['00000', '00000', '11110', '10001', '10001', '10001', '10001'],
  o: ['00000', '00000', '01110', '10001', '10001', '10001', '01110'],
  p: [
    '00000',
    '00000',
    '11110',
    '10001',
    '10001',
    '11110',
    '10000',
    '10000',
    '10000',
  ],
  q: [
    '00000',
    '00000',
    '01111',
    '10001',
    '10001',
    '01111',
    '00001',
    '00001',
    '00001',
  ],
  r: ['00000', '00000', '10110', '11001', '10000', '10000', '10000'],
  s: ['00000', '00000', '01111', '10000', '01110', '00001', '11110'],
  t: ['01000', '01000', '11110', '01000', '01000', '01001', '00110'],
  u: ['00000', '00000', '10001', '10001', '10001', '10011', '01101'],
  v: ['00000', '00000', '10001', '10001', '10001', '01010', '00100'],
  w: ['00000', '00000', '10001', '10101', '10101', '10101', '01010'],
  x: ['00000', '00000', '10001', '01010', '00100', '01010', '10001'],
  y: [
    '00000',
    '00000',
    '10001',
    '10001',
    '10001',
    '01111',
    '00001',
    '00001',
    '01110',
  ],
  z: ['00000', '00000', '11111', '00010', '00100', '01000', '11111'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  6: ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  _: ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

/** Rendered width of a string at pixel scale s (glyphs advance 6*s, minus the trailing gap). */
export const textW = (str, s) => str.length * 6 * s - s;

/** Escape a string for use inside a double-quoted XML attribute. */
const escapeXmlAttr = value =>
  String(value).replace(
    /[&<>"']/g,
    ch =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[ch]
  );

/**
 * Accumulates <rect> elements and emits the final cover SVG. All drawing is
 * axis-aligned rects so crispEdges stays honest; keep coordinates on a 3px or
 * 6px grid like the existing covers.
 */
export class Canvas {
  constructor() {
    this.parts = [];
  }

  /** Append a raw SVG fragment (e.g. a <g filter="url(#glow)"> wrapper). */
  raw(s) {
    this.parts.push(s);
  }

  rect(x, y, w, h, fill, opacity) {
    if (w <= 0 || h <= 0) return;
    const o = opacity !== undefined ? ` opacity="${opacity}"` : '';
    this.parts.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${o}/>`
    );
  }

  /** Bevelled box: base fill, light top+left edge, dark bottom+right edge. */
  bevel(x, y, w, h, base, lt, dk, e = 6) {
    this.rect(x, y, w, h, base);
    this.rect(x, y, w, e, lt);
    this.rect(x, y, e, h, lt);
    this.rect(x, y + h - e, w, e, dk);
    this.rect(x + w - e, y, e, h, dk);
  }

  /**
   * Pixel text; (x, y) is the top-left of the 7-row glyph box, s is the pixel
   * size. Horizontal runs are merged into single rects to keep files small.
   */
  text(str, x, y, s, fill, opacity) {
    for (let i = 0; i < str.length; i++) {
      const g = FONT[str[i]] ?? FONT[' '];
      const gx = x + i * 6 * s;
      for (let r = 0; r < g.length; r++) {
        const row = g[r];
        let c = 0;
        while (c < 5) {
          if (row[c] === '1') {
            let run = 1;
            while (c + run < 5 && row[c + run] === '1') run++;
            this.rect(gx + c * s, y + r * s, run * s, s, fill, opacity);
            c += run;
          } else c++;
        }
      }
    }
  }

  /** Headline text with the house drop shadow (PALETTE.shadow offset behind). */
  textShadow(str, x, y, s, fill) {
    const o = s >= 9 ? 6 : 3;
    this.text(str, x + o, y + o, s, PALETTE.shadow);
    this.text(str, x, y, s, fill);
  }

  /**
   * Emit the complete SVG. Satisfies the rasterize-cover.mjs contract: literal
   * width/height, matching viewBox, opaque full-bleed background rect first.
   * Pass the post's alt text as ariaLabel so the two never drift; it is
   * escaped for the attribute, so `&` or quotes in the alt are safe.
   */
  svg(ariaLabel) {
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${COVER_WIDTH}" height="${COVER_HEIGHT}" viewBox="0 0 ${COVER_WIDTH} ${COVER_HEIGHT}" role="img" aria-label="${escapeXmlAttr(ariaLabel)}" shape-rendering="crispEdges">`,
      `<defs><filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="softglow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="26"/></filter></defs>`,
      `<rect x="0" y="0" width="${COVER_WIDTH}" height="${COVER_HEIGHT}" fill="${PALETTE.bg}"/>`,
      ...this.parts,
      `</svg>`,
      '',
    ].join('\n');
  }
}

/** Scatter of 6px star pixels on the background, seeded for reproducibility. */
export function starfield(c, seed, n, y0 = 24, y1 = COVER_HEIGHT - 24) {
  const rnd = lcg(seed);
  for (let i = 0; i < n; i++) {
    const x = 24 + Math.floor(rnd() * ((COVER_WIDTH - 48) / 6)) * 6;
    const y = y0 + Math.floor(rnd() * ((y1 - y0) / 6)) * 6;
    const major = rnd() > 0.55;
    c.rect(
      x,
      y,
      6,
      6,
      major ? PALETTE.star1 : PALETTE.star2,
      major ? 0.9 : 0.5
    );
  }
}
