/**
 * CV: the portrait beside the page's introduction, and the favicon.
 *
 * The portrait fills the page's right-hand column with `background-size:
 * cover`, which is tall and narrow on a desktop and a short wide strip on a
 * phone, so the figure stands in the middle, where both crops keep it, and
 * the designer's tools float around the edges, where losing them costs
 * nothing. The figure is invented: a blocky bust with a bob, headphones and
 * dots for eyes, holding up a tablet, and resembling no one.
 */
import {
  Scene,
  document,
  fit,
  material,
  place,
  renderScene,
} from '../voxel.mjs';
import { bandedSky, rect, sprite, squareSun } from '../backdrop.mjs';
import { grain } from '../blocks.mjs';

const W = 1600;
const H = 1600;

// The bust faces the viewer, so its fronts are stairs of left and right
// faces: the light falls on both alike, straight toward the viewer, or the
// stairs would show as stripes.
const light = {
  color: '#141838',
  left: 0.12,
  right: 0.16,
  ao: 0,
  dir: [0.3, 0.3, 1.5],
};

const M = {
  skin: grain('cv-skin', '#cf9670', { spread: 0.04 }),
  hair: grain('cv-hair', '#29243f', { spread: 0.08 }),
  sweater: grain('cv-sweater', '#8f72c9', { spread: 0.05 }),
  seam: grain('cv-seam', '#6f56a6', { spread: 0.05 }),
  stripe: grain('cv-stripe', '#f1e8da', { spread: 0.04 }),
  blush: grain('cv-blush', '#e08a7a', { spread: 0.04 }),
  collar: grain('cv-collar', '#f1e8da', { spread: 0.04 }),
  eye: grain('cv-eye', '#1b1d33', { spread: 0.05 }),
  band: grain('cv-band', '#353a62', { spread: 0.06 }),
  cup: grain('cv-cup', '#ff8a3d', { spread: 0.05 }),
  pad: grain('cv-pad', '#2c2f4f', { spread: 0.06 }),
};

/** Whether (dx, dy, dz), over radii (a, b, c), is inside a rounded box. */
function rounded(dx, dy, dz, a, b, c) {
  const p = dx / a;
  const q = dy / b;
  const r = dz / c;
  return p * p * p * p + q * q * q * q + r * r * r * r <= 1;
}

const R2 = Math.SQRT1_2;

/** The tablet's screen, a pixel a column: a page with a bar, a hero and a button. */
const TABLET = [
  'fffffffffffffff',
  'fnnnnnnnnnnnnnf',
  'fnrnynqnnnnnnnf',
  'fnnnnnnnnnnnnnf',
  'fwwwwwwwwwwwwwf',
  'fwoooooowllllwf',
  'fwoooooowwwwwwf',
  'fwoooooowllllwf',
  'fwoooooowwwwwwf',
  'fwoooooowlllwwf',
  'fwwwwwwwwwwwwwf',
  'fwqqqqwwwwwwwwf',
  'fwwwwwwwwwwwwwf',
  'fffffffffffffff',
];

// The screen gives off its own light, so its pixels are flat and even.
const lit = hex => material({ color: hex, flat: true });
const SCREEN = {
  f: grain('cv-tablet', '#1f2340', { spread: 0.05 }),
  n: lit('#3c4170'),
  r: lit('#ff6a3d'),
  y: lit('#f2c14e'),
  q: lit('#25b39b'),
  w: lit('#f3efe7'),
  o: lit('#ff9a52'),
  l: lit('#b9bfd6'),
};

/**
 * The bust, turned to face the viewer: its front looks along the x + y
 * diagonal, so its shoulders run level across the screen. Shapes are tested
 * in turned coordinates, a across the body and b toward the viewer, at each
 * block's centre. It is a sweater cut off below the image, a collar, a big
 * rounded head, a bob with a fringe, headphones, and two dots for eyes.
 */
function bust() {
  const s = new Scene({ seed: 5 });
  const N = 24;
  const each = fn => {
    for (let x = -N; x < N; x++)
      for (let y = -N; y < N; y++) fn(x, y, (x - y) * R2, (x + y + 1) * R2);
  };
  // The torso: shoulders sloping from the neck and rounding over into
  // arms, a band knitted across the chest, the foot below the image.
  const SH = 14; // the shoulders' top, at the neck
  const top = a => {
    const r = Math.abs(a);
    if (r <= 4) return SH;
    if (r <= 10.5) return SH - (r - 4) * 0.4;
    const t = (r - 10.5) / 3.9;
    return SH - 2.6 - t * t * 7;
  };
  each((x, y, a, b) => {
    if (Math.abs(a) > 14.4) return;
    const depth = Math.abs(a) > 10.5 ? 4.6 : 5.4; // the arms a little slimmer
    if (!rounded(0, b, 0, 1, depth, 1)) return;
    const t = top(a);
    for (let z = -60; z + 0.5 < t; z++) {
      const arm = Math.abs(a) > 10.6;
      const seam = Math.abs(Math.abs(a) - 10.6) < 0.75 && z < SH - 6;
      const band = !arm && (z === 5 || z === 6);
      s.set(x, y, z, seam ? M.seam : band ? M.stripe : M.sweater);
    }
  });
  // A tablet held up to the viewer, showing a page being designed. Its
  // screen is the front layer, x + y + 1 = 9, where each block shows its
  // left and right faces side by side, so a column there is a pixel.
  const TZ = 2; // the tablet's top row
  TABLET.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      const c = 2 * i - 14; // x - y on the screen layer
      for (const k of [8, 9]) {
        const cc = k === 9 ? c : c + 1;
        if (k === 8 && i === row.length - 1) continue;
        const x = (k - 1 + cc) / 2;
        const y = x - cc;
        s.set(x, y, TZ - j, k === 9 ? SCREEN[ch] : SCREEN.f);
      }
    })
  );
  // The hands at its sides, and the sleeves from the arms to them.
  each((x, y) => {
    const k = x + y + 1;
    if (k < 7 || k > 9) return;
    const c = Math.abs(x - y);
    for (let z = TZ - 9; z <= TZ - 3; z++) {
      if ((c === 15 || c === 16) && z >= TZ - 8 && z <= TZ - 4)
        s.set(x, y, z, M.skin);
      else if ((c === 17 || c === 18) && k < 9) s.set(x, y, z, M.sweater);
    }
  });
  // Thumbs over the tablet's frame.
  for (const c of [-13, 13])
    for (let z = TZ - 7; z <= TZ - 5; z++) {
      const x = (10 - 1 + c) / 2;
      s.set(x, x - c, z, M.skin);
    }
  // A ribbed collar round the neck, and the neck.
  each((x, y, a, b) => {
    const d = a * a + (b - 0.6) * (b - 0.6);
    if (d <= 30 && d > 13) {
      s.set(x, y, SH - 1, M.collar);
      if (b > 1.2) s.set(x, y, SH, M.collar);
    }
    if (d <= 13) for (let z = SH - 1; z < SH + 4; z++) s.set(x, y, z, M.skin);
  });
  // The head.
  const HZ = SH + 11; // its centre
  const head = (a, b, z) => rounded(a, b - 0.4, z + 0.5 - HZ, 7.6, 7.2, 8.2);
  each((x, y, a, b) => {
    for (let z = HZ - 9; z < HZ + 9; z++)
      if (head(a, b, z)) s.set(x, y, z, M.skin);
  });
  // The hair: a shell one block out, down past the jaw at the sides and
  // back, and a fringe across the forehead, swept to one side.
  each((x, y, a, b) => {
    for (let z = HZ - 11; z < HZ + 11; z++) {
      if (head(a, b, z)) continue;
      if (!rounded(a, b + 0.3, z + 0.5 - HZ - 0.8, 8.9, 8.5, 9.1)) continue;
      const rz = z - HZ;
      const fringe = 2.5 - a * 0.25;
      const front = b > 4.5;
      const ok = front ? rz >= fringe : rz >= -5 - (b < -2 ? 2 : 0);
      if (ok) s.set(x, y, z, M.hair);
    }
  });
  // Headphones: a band over the crown and a cup over each ear.
  each((x, y, a, b) => {
    if (Math.abs(b) > 1.6) return;
    // The band runs up from the cups and into the hair, which hides it
    // over the crown.
    for (let z = HZ + 3; z < HZ + 7; z++) {
      const dz = z + 0.5 - HZ;
      const d = a * a + dz * dz;
      if (Math.abs(b) < 0.8 && d >= 100 && d < 124 && !s.has(x, y, z))
        s.set(x, y, z, M.band);
    }
    const r = Math.abs(a);
    if (r > 8.4 && r < 10.9)
      for (let z = HZ - 3; z < HZ + 4; z++) s.set(x, y, z, M.cup);
  });
  // Two eyes, on the face's surface.
  for (const k of [-4, 3]) {
    for (const ez of [HZ - 1, HZ]) {
      for (const kk of [k, k + 1]) {
        // Walk toward the viewer along x - y = kk to the last block.
        let best = null;
        for (let t = -N; t < N; t++) {
          const x = Math.ceil((t + kk) / 2);
          const y = x - kk;
          if (s.get(x, y, ez) === M.skin) best = [x, y];
        }
        if (best) s.set(best[0], best[1], ez, M.eye);
      }
    }
  }
  // A blush under each eye.
  for (const kk of [-6, -5, 5, 6]) {
    let best = null;
    for (let t = -N; t < N; t++) {
      const x = Math.ceil((t + kk) / 2);
      const y = x - kk;
      if (s.get(x, y, HZ - 3) === M.skin) best = [x, y];
    }
    if (best) s.set(best[0], best[1], HZ - 3, M.blush);
  }
  return s;
}

// ---------------------------------------------------------------------------
// The tools floating round the figure

const T = {
  cream: grain('cv-cream', '#f3efe7', { spread: 0.03 }),
  navy: grain('cv-navy', '#2a2f57', { spread: 0.05 }),
  bar: grain('cv-bar', '#d9dcea', { spread: 0.03 }),
  line: grain('cv-line', '#b9bfd6', { spread: 0.03 }),
  orange: grain('cv-cup', '#ff8a3d', { spread: 0.05 }),
  yellow: grain('cv-yellow', '#f2c14e', { spread: 0.05 }),
  teal: grain('cv-teal', '#25b39b', { spread: 0.05 }),
  lilac: grain('cv-lilac', '#8f86d9', { spread: 0.05 }),
};

const toolLight = { color: '#141838', left: 0.1, right: 0.3, ao: 0.06 };

/**
 * A panel standing in the x-z plane, its face toward +y: `rows` of
 * characters, top first, each a block whose color `pal` names.
 */
function panel(rows, pal, depth = 1) {
  const s = new Scene({ seed: 21 });
  rows.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (!pal[ch]) return;
      for (let d = 0; d < depth; d++)
        s.set(i, -d, rows.length - j, d ? (pal.back ?? pal[ch]) : pal[ch]);
    })
  );
  return s;
}

/** A browser window: a bar with three dots, a heading, a picture, lines. */
function browser() {
  return panel(
    [
      '.bbbbbbbbbbbbbbbb.',
      'bbobybtbbbbbbbbbbb',
      'bbbbbbbbbbbbbbbbbb',
      'cccccccccccccccccc',
      'cnnnnnnnnnnnnccccc',
      'cccccccccccccccccc',
      'cooooocclllllllccc',
      'cooooocccccccccccc',
      'cooooocclllllccccc',
      'cooooocccccccccccc',
      'ccccccccctttttcccc',
      '.cccccccccccccccc.',
    ],
    {
      b: T.bar,
      o: T.orange,
      y: T.yellow,
      t: T.teal,
      c: T.cream,
      n: T.navy,
      l: T.line,
      back: T.bar,
    },
    2
  );
}

/** A code tag on a tile: an angle bracket, a slash, an angle bracket. */
function codeTag() {
  const lt = ['...n', '..n.', '.n..', 'n...', '.n..', '..n.', '...n'];
  const sl = ['..n', '..n', '.n.', '.n.', '.n.', 'n..', 'n..'];
  const gt = lt.map(r => [...r].reverse().join(''));
  const rows = lt.map((r, j) => `c${r}c${sl[j]}c${gt[j]}c`.replace(/\./g, 'c'));
  const edge = 'c'.repeat(rows[0].length);
  return panel(
    [`.${edge.slice(2)}.`, edge, ...rows, edge, `.${edge.slice(2)}.`],
    { c: T.cream, n: T.navy, back: T.bar },
    2
  );
}

/** Color swatches: four cubes, stepping down. */
function swatches() {
  const s = new Scene({ seed: 22 });
  [T.orange, T.yellow, T.teal, T.lilac].forEach((m, i) =>
    s.box(i * 4, 0, 6 - i * 2, 3, 3, 3, m)
  );
  return s;
}

/** A pointer arrow, in pixels. */
const CURSOR = [
  'k.........',
  'kk........',
  'kwk.......',
  'kwwk......',
  'kwwwk.....',
  'kwwwwk....',
  'kwwwwwk...',
  'kwwwwwwk..',
  'kwwwwwwwk.',
  'kwwwwwkkkk',
  'kwwkwwk...',
  'kwk.kwwk..',
  'kk..kwwk..',
  'k....kwwk.',
  '.....kwwk.',
  '......kk..',
];

/** A four-point sparkle. */
const SPARK = ['..y..', '..y..', 'yyYyy', '..y..', '..y..'];

/** A pen tool's curve: a run of square dots, two anchors, their handles. */
function penCurve(x0, y0) {
  const px = 9;
  let d = '';
  // A cubic from (0, 20) to (28, 0), in dots, sampled densely.
  const P = [
    [0, 22],
    [6, 2],
    [18, 26],
    [28, 4],
  ];
  const seen = new Set();
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    const u = 1 - t;
    const bx =
      u * u * u * P[0][0] +
      3 * u * u * t * P[1][0] +
      3 * u * t * t * P[2][0] +
      t * t * t * P[3][0];
    const by =
      u * u * u * P[0][1] +
      3 * u * u * t * P[1][1] +
      3 * u * t * t * P[2][1] +
      t * t * t * P[3][1];
    const k = `${Math.round(bx)},${Math.round(by)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    d += `M${x0 + Math.round(bx) * px} ${y0 + Math.round(by) * px}h${px}v${px}h${-px}z`;
  }
  const out = [`<path fill="#f3efe7" d="${d}"/>`];
  // Handles: dotted lines out from each anchor to a round-ish knob.
  const handle = (ax, ay, hx, hy) => {
    let h = '';
    const n = 7;
    for (let i = 1; i < n; i++) {
      const x = Math.round(ax + ((hx - ax) * i) / n);
      const y = Math.round(ay + ((hy - ay) * i) / n);
      h += `M${x0 + x * px + 2} ${y0 + y * px + 2}h6v6h-6z`;
    }
    out.push(`<path fill="#9aa2d6" d="${h}"/>`);
    out.push(rect(x0 + hx * px - 5, y0 + hy * px - 5, 20, 20, '#9aa2d6'));
  };
  handle(0, 22, 6, 2);
  handle(28, 4, 18, 26);
  for (const [ax, ay] of [P[0], P[3]]) {
    out.push(rect(x0 + ax * px - 10, y0 + ay * px - 10, 30, 30, '#f3efe7'));
    out.push(rect(x0 + ax * px - 5, y0 + ay * px - 5, 20, 20, '#ff6a3d'));
  }
  return out.join('');
}

function tool(scene, box) {
  const r = renderScene(scene, { light: toolLight });
  return place(r, fit(r.bounds, box));
}

function portrait() {
  const layers = [];
  // A flat base under the bands: the image is shown shrunk, and where two
  // bands meet on a fraction of a pixel, the base shows rather than the page.
  layers.push(rect(0, 0, W, H, '#20264f'));
  layers.push(
    bandedSky(
      W,
      H,
      [
        [0, '#262d5c'],
        [1, '#1a1f43'],
      ],
      10
    )
  );
  // A dotted grid, like a design tool's canvas.
  layers.push(`<rect width="${W}" height="${H}" fill="url(#cv-dots)"/>`);
  layers.push(
    squareSun(800, 700, 600, '#ff5a1f', {
      glow: ['#3d2f63', '#5a3462'],
      step: 30,
    })
  );

  // The tools, behind the figure where they reach it.
  layers.push(tool(browser(), { x: 105, y: 170, width: 340, height: 290 }));
  layers.push(tool(codeTag(), { x: 1185, y: 190, width: 300, height: 240 }));
  layers.push(tool(swatches(), { x: 110, y: 1130, width: 270, height: 230 }));
  layers.push(penCurve(1222, 800));
  layers.push(sprite(CURSOR, { k: '#1b1d33', w: '#f3efe7' }, 250, 620, 9));
  for (const [x, y, px] of [
    [1220, 540, 9],
    [330, 560, 7],
    [1400, 1230, 8],
    [180, 980, 6],
  ])
    layers.push(sprite(SPARK, { y: '#f2c14e', Y: '#fff3c4' }, x, y, px));

  // A design tool's selection round the portrait's frame: a hairline box
  // with a handle at each corner and midpoint.
  {
    const x0 = 440;
    const y0 = 340;
    const x1 = 1160;
    const y1 = 1060;
    const line = '#9aa2d6';
    layers.push(
      `<path fill="none" stroke="${line}" stroke-width="3" d="M${x0} ${y0}H${x1}V${y1}H${x0}z"/>`
    );
    for (const [hx, hy] of [
      [x0, y0],
      [(x0 + x1) / 2, y0],
      [x1, y0],
      [x1, (y0 + y1) / 2],
      [x1, y1],
      [x0, y1],
      [x0, (y0 + y1) / 2],
    ]) {
      layers.push(rect(hx - 11, hy - 11, 22, 22, line));
      layers.push(rect(hx - 7, hy - 7, 14, 14, '#f3efe7'));
    }
  }

  const b = renderScene(bust(), { light });
  // The bust at a fixed scale, its head's top a little below the sun's.
  const SCALE = 9.2;
  layers.push(
    place(b, {
      scale: SCALE,
      x: 800 - (b.bounds.x + b.bounds.width / 2) * SCALE,
      y: 420 - b.bounds.y * SCALE,
    })
  );

  return document({
    width: W,
    height: H,
    defs: [
      '<pattern id="cv-dots" patternUnits="userSpaceOnUse" width="60" height="60"><rect x="38" y="38" width="5" height="5" fill="#36407a"/></pattern>',
    ],
    label:
      "A blocky figure in headphones holding up a tablet, before a square orange sun, among a web designer's tools",
    layers,
  });
}

/** The favicon: a blocky K on an orange block, made to read at 16 pixels. */
function favicon() {
  // A 16 by 16 grid, four pixels a cell, so at 16 pixels a cell is a pixel.
  const K = [
    '................',
    '................',
    '................',
    '....kk....kk....',
    '....kk...kk.....',
    '....kk..kk......',
    '....kk.kk.......',
    '....kkkk........',
    '....kkkk........',
    '....kk.kk.......',
    '....kk..kk......',
    '....kk...kk.....',
    '....kk....kk....',
    '................',
    '................',
    '................',
  ];
  // The letter's shadow, one cell down and to the right, gives it depth.
  const shadow = K.map((row, j) =>
    [...row]
      .map((_, i) =>
        (K[j - 1]?.[i - 1] === 'k' ||
          K[j]?.[i - 1] === 'k' ||
          K[j - 1]?.[i] === 'k') &&
        row[i] !== 'k'
          ? 's'
          : '.'
      )
      .join('')
  );
  return document({
    width: 64,
    height: 64,
    label: 'A blocky letter K',
    layers: [
      '<rect width="64" height="64" rx="12" fill="#c7340a"/>',
      '<rect width="64" height="58" rx="12" fill="#ff470f"/>',
      rect(8, 4, 48, 4, '#ff6a3a'),
      sprite(shadow, { s: '#a82a06' }, 0, 0, 4),
      sprite(K, { k: '#fff6ee' }, 0, 0, 4),
    ],
  });
}

export default [
  {
    path: 'public/media/background.svg',
    depicts:
      'An invented blocky figure in a soft purple sweater and orange headphones, holding up a tablet that shows a web page, before a square orange sun framed like a selected layer, with a browser window, a code tag, a pointer, a pen curve and color swatches floating on a dotted indigo backdrop. It portrays no one.',
    draw: portrait,
  },
  {
    path: 'public/favicon.svg',
    depicts:
      'A blocky white letter K with a dark orange shadow, on an orange rounded square.',
    draw: favicon,
  },
];
