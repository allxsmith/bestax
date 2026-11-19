/**
 * Wedding Planner: the hero's invitation, the navbar logo, two testimonial
 * avatars, the contact letterbox, the five gallery cards and the four step
 * illustrations, in the page's lavender and pink.
 *
 * Small things (rings, a cake, a bouquet, glasses) are built from many small
 * blocks, like an object turned into blocks; the ceremony and the reception
 * are block-scale dioramas. Each object is its own scene, rendered and placed
 * at a shared scale, so an image's objects stay in proportion.
 */
import {
  Scene,
  cos,
  document,
  hash3,
  material,
  noise,
  place,
  renderScene,
  rng,
  shade,
  sin,
} from '../voxel.mjs';
import {
  bandedSky,
  cloud,
  pixelText,
  rect,
  sprite,
  squareSun,
  stars,
} from '../backdrop.mjs';
import { fringeTexture, grain } from '../blocks.mjs';

// ---------------------------------------------------------------------------
// Palette and light

const P = {
  ink: '#3a2152',
  lavender: '#c7b8ea',
  lavenderLt: '#e2d9f6',
  lavenderPale: '#f3effb',
  purple: '#8d74d9',
  purpleDk: '#5f4aa6',
  plum: '#46306b',
  pink: '#ee9fc2',
  pinkLt: '#f9d3e3',
  pinkDk: '#d6719e',
  rose: '#c4507f',
  blush: '#fbe6ee',
  cyan: '#72ddf7',
  gold: '#e7b647',
  goldLt: '#f8da84',
  goldDk: '#b4842a',
  white: '#fdfbff',
  cream: '#fff5ea',
  leaf: '#7dbf8c',
  leafDk: '#4e9468',
  wood: '#c99a6b',
  woodDk: '#97693f',
  warm: '#ffe7a3',
};

const LIGHT = { color: P.ink, left: 0.1, right: 0.27, shadow: 0.2, ao: 0.08 };

const fines = new Map();

/**
 * A grained material for the small blocks most of these images are built
 * from: one color with a grain of 4 by 4 texels in shades of it, which reads
 * as a block at this size and costs fewer bytes than the shared 8 by 8
 * grain. Its texture id is prefixed with this template's slug.
 */
function m(name, hex, { spread = 0.05, flat: glows = false } = {}) {
  const id = `wedding-${name}`;
  if (!fines.has(id)) {
    const seed = [...id].reduce(
      (a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0,
      7
    );
    const tex = noise(id, [hex, shade(hex, spread), shade(hex, -spread)], {
      size: 4,
      weights: [5, 2, 2],
      seed,
    });
    fines.set(id, material({ id, color: tex, flat: glows }));
  }
  return fines.get(id);
}

/** The shared 8 by 8 grain, for the ground of the block-scale dioramas. */
const big = (name, hex, o = {}) =>
  grain(`wedding-${name}`, hex, { spread: 0.06, ...o });

/** A block that gives off light: a candle flame, a bulb. */
const glow = (name, hex) => m(name, hex, { flat: true, spread: 0.03 });

/** A flat color, for single-block accents too small to show a grain. */
const dot = hex => material({ color: hex });

// ---------------------------------------------------------------------------
// Geometry helpers

/** Where a world point lands, in lattice units (the renderer's projection). */
const proj = (x, y, z) => [2 * (x - y), x + y - 2 * z];

const r2 = v => Math.round(v * 100) / 100;

/** Render a scene with this template's light. */
const render = (scene, o = {}) =>
  renderScene(scene, { light: { ...LIGHT, ...o } });

/**
 * Place a rendered scene at `scale` pixels a lattice unit, so the world point
 * `world` lands on the image's point `screen`.
 */
function anchor(rendered, scale, world, screen) {
  const [px, py] = proj(...world);
  return place(rendered, {
    scale,
    x: screen[0] - px * scale,
    y: screen[1] - py * scale,
  });
}

/** Add SVG drawn in the scene's lattice units on top of a rendered scene. */
const overlay = (rendered, svg) => ({ ...rendered, body: rendered.body + svg });

/**
 * SVG drawn in pixels (pixel text, a sprite) laid on a face plane, in
 * lattice units, its top-left at world (x, y, z), one pixel `px` blocks:
 * 'xz' on a face toward +y reading along +x, 'yz' on a face toward +x
 * reading along -y, 'xy' lying flat reading along +x.
 */
function onPlane(plane, [x, y, z], px, svg) {
  const [ox, oy] = proj(x, y, z);
  const t =
    plane === 'xz'
      ? [2 * px, px, 0, 2 * px]
      : plane === 'yz'
        ? [2 * px, -px, 0, 2 * px]
        : [2 * px, px, -2 * px, px];
  return `<g transform="matrix(${[...t, ox, oy].map(r2).join(' ')})">${svg}</g>`;
}

/**
 * A rectangle drawn on a face plane, in lattice units: on 'xz' (a face toward
 * +y at y) from (x, z) across w along +x and down h; on 'yz' (toward +x at
 * x) from (y, z) across w along -y.
 */
function faceRect(plane, at, w, h, fill) {
  const [x, y, z] = at;
  const c =
    plane === 'xz'
      ? [
          [x, y, z],
          [x + w, y, z],
          [x + w, y, z - h],
          [x, y, z - h],
        ]
      : [
          [x, y, z],
          [x, y - w, z],
          [x, y - w, z - h],
          [x, y, z - h],
        ];
  const pts = c.map(p =>
    proj(...p)
      .map(r2)
      .join(' ')
  );
  return `<path fill="${fill}" d="M${pts.join('L')}z"/>`;
}

/**
 * Blocks from rows of characters standing in a plane: each character is a
 * key into `mats`, '.' is empty. 'xz' rows run down in z and columns along
 * +x, `depth` blocks toward -y from `y`; 'yz' columns run along -y and depth
 * toward -x; 'xy' lies flat, rows along +y, depth up.
 */
function mask(scene, rows, [x, y, z], mats, { plane = 'xz', depth = 1 } = {}) {
  rows.forEach((row, v) =>
    [...row].forEach((ch, u) => {
      const mat = mats[ch];
      if (!mat) return;
      for (let d = 0; d < depth; d++) {
        if (plane === 'xz') scene.set(x + u, y - d, z - v, mat);
        else if (plane === 'yz') scene.set(x - d, y - u, z - v, mat);
        else scene.set(x + u, y + v, z + d, mat);
      }
    })
  );
  return scene;
}

/**
 * Fill every block in the box whose centre `inside(x, y, z)` accepts, with
 * the material `mat(x, y, z)` returns (or `mat` itself).
 */
function solid(scene, [x0, y0, z0], [x1, y1, z1], inside, mat) {
  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++)
        if (inside(x + 0.5, y + 0.5, z + 0.5)) {
          const mm = typeof mat === 'function' ? mat(x, y, z) : mat;
          if (mm) scene.set(x, y, z, mm);
        }
  return scene;
}

const HEART = [
  '.##.##.',
  '#######',
  '#######',
  '.#####.',
  '..###..',
  '...#...',
];

// ---------------------------------------------------------------------------
// Flat-layer helpers

/** A disc drawn in steps of `step` pixels, as one path. */
function steppedDisc(cx, cy, r, step, fill, opacity) {
  let d = '';
  for (let y = -r; y < r; y += step) {
    const mid = y + step / 2;
    const half =
      Math.floor(Math.sqrt(Math.max(0, r * r - mid * mid)) / step) * step;
    if (half > 0)
      d += `M${r2(cx - half)} ${r2(cy + y)}h${r2(2 * half)}v${step}h${r2(-2 * half)}z`;
  }
  const o = opacity === undefined ? '' : ` fill-opacity="${opacity}"`;
  return `<path fill="${fill}"${o} d="${d}"/>`;
}

/** A four-pointed sparkle, `s` pixels a dot. */
const sparkle = (x, y, s, color) =>
  sprite(
    ['..a..', '..a..', 'aabaa', '..a..', '..a..'],
    { a: color, b: shade(color, 0.5) },
    x - 2.5 * s,
    y - 2.5 * s,
    s
  );

/** A string of lights sagging from (x0, y0) to (x1, y1), `sag` pixels deep. */
function lights(
  x0,
  y0,
  x1,
  y1,
  sag,
  {
    count = 9,
    cord = '#6b5683',
    bulb = P.warm,
    size = 10,
    glowColor = '#fff3c9',
    glowOpacity = 0.35,
  } = {}
) {
  const step = 4;
  const n = Math.round((x1 - x0) / step);
  let d = '';
  const at = t => {
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t + sag * 4 * t * (1 - t);
    return [x, y];
  };
  for (let i = 0; i < n; i++) {
    const [x, y] = at(i / n);
    d += `M${r2(Math.round(x / step) * step)} ${r2(Math.round(y / step) * step)}h${step}v3h${-step}z`;
  }
  const out = [`<path fill="${cord}" d="${d}"/>`];
  let g = '';
  let b = '';
  let c = '';
  for (let i = 1; i < count; i++) {
    const [x, y] = at(i / count);
    const bx = Math.round(x / step) * step - size / 2;
    const by = Math.round(y / step) * step + 3;
    g += `M${r2(bx - size * 0.6)} ${r2(by - size * 0.3)}h${r2(size * 2.2)}v${r2(size * 2.2)}h${r2(-size * 2.2)}z`;
    c += `M${r2(bx + size * 0.2)} ${r2(by)}h${r2(size * 0.6)}v${r2(size * 0.4)}h${r2(-size * 0.6)}z`;
    b += `M${r2(bx)} ${r2(by + size * 0.4)}h${size}v${r2(size * 1.2)}h${-size}z`;
  }
  out.push(
    `<path fill="${glowColor}" fill-opacity="${glowOpacity}" d="${g}"/>`
  );
  out.push(`<path fill="${bulb}" d="${b}"/>`);
  out.push(`<path fill="${cord}" d="${c}"/>`);
  return out.join('');
}

// ---------------------------------------------------------------------------
// Gallery: the cake

/** A rose of 3 by 3 by 3 blocks, rounded, its heart darker, at (x, y, z). */
function rose(scene, x, y, z, petal, heart) {
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++)
      for (let k = -1; k <= 1; k++)
        if (Math.abs(i) + Math.abs(j) + Math.abs(k) < 3)
          scene.set(x + i, y + j, z + k, petal);
  scene.set(x, y, z + 1, heart);
  scene.set(x + 1, y, z, heart);
  scene.set(x, y + 1, z, heart);
  return scene;
}

function cakeScene() {
  const s = new Scene({ seed: 11 });
  const cloth = m('cloth', P.pinkLt);
  const clothDk = m('cloth-dk', shade(P.pinkLt, -0.07));
  const board = m('board', P.goldLt);
  const icing = m('icing', P.white, { spread: 0.03 });
  const ribbon = m('ribbon', P.pink);
  const roseA = m('rose-a', P.pinkDk);
  const roseAh = m('rose-a-h', P.rose);
  const roseB = m('rose-b', P.lavender);
  const roseBh = m('rose-b-h', P.purple);
  const roseC = m('rose-c', P.blush);
  const roseCh = m('rose-c-h', P.pink);
  const leaf = m('leaf', P.leaf);
  const stick = m('stick', P.gold);
  const heartA = m('heart-a', P.rose);
  const heartB = m('heart-b', P.purple);

  // A round table in a pink cloth that falls in folds to the floor.
  const T = 12;
  solid(
    s,
    [-T - 1, -T - 1, -11],
    [T + 1, T + 1, -1],
    (x, y, z) => {
      const r = Math.sqrt(x * x + y * y);
      return r <= T + (z < -1 ? 0.6 : 0);
    },
    // Folds: stripes of constant x - y run straight down the screen.
    (x, y, z) =>
      z === -1 ? cloth : Math.floor((x - y + 60) / 3) % 2 ? clothDk : cloth
  );
  // The board and three tiers, each with a ribbon round its foot.
  s.cylinder(0, 0, 0, 9.4, 1, board);
  const tiers = [
    [8, 1, 6],
    [6, 7, 5],
    [4, 12, 5],
  ];
  for (const [r, z, h] of tiers) {
    s.cylinder(0, 0, z, r, h, icing);
    s.cylinder(0, 0, z, r, 1, ribbon);
  }
  // Roses cascading down the front, with leaves.
  const roses = [
    [3, 3, 15, roseA, roseAh],
    [1, 4, 13, roseB, roseBh],
    [5, 4, 11, roseC, roseCh],
    [4, 5, 9, roseA, roseAh],
    [6, 4, 7, roseB, roseBh],
    [7, 5, 4, roseC, roseCh],
    [5, 7, 2, roseA, roseAh],
    [8, 3, 2, roseB, roseBh],
  ];
  for (const [x, y, z] of roses) {
    s.set(x - 1, y + 2, z, leaf);
    s.set(x + 2, y - 1, z - 1, leaf);
  }
  for (const [x, y, z, petal, heart] of roses) rose(s, x, y, z, petal, heart);
  // The topper: two hearts on gold sticks, leaning apart.
  for (let k = 17; k < 20; k++) {
    s.set(-4, 0, k, stick);
    s.set(0, -3, k, stick);
  }
  mask(s, HEART, [-7, 0, 25], { '#': heartA });
  mask(s, HEART, [0, 0, 25], { '#': heartB }, { plane: 'yz' });
  return s;
}

function galleryCake() {
  const W = 800;
  const H = 450;
  const layers = [];
  layers.push(
    bandedSky(
      W,
      360,
      [
        [0, '#f2ecfc'],
        [1, '#dcd0f4'],
      ],
      6
    )
  );
  layers.push(rect(0, 360, W, H - 360, '#bba8e2'));
  layers.push(rect(0, 360, W, 6, '#d0c2ee'));
  layers.push(lights(-24, 6, 824, 6, 38, { count: 15 }));
  for (const [x, y, sz, c] of [
    [120, 150, 5, '#ffffff'],
    [680, 120, 6, '#ffffff'],
    [210, 260, 4, P.pink],
    [610, 240, 4, P.purple],
  ])
    layers.push(sparkle(x, y, sz, c));
  const cake = render(cakeScene());
  layers.push(anchor(cake, 4.25, [0, 0, 0], [W / 2, 318]));
  return document({
    width: W,
    height: H,
    label: 'A blocky three-tier wedding cake on a round table',
    layers,
  });
}

// ---------------------------------------------------------------------------
// Gallery: the rings

/**
 * A ring standing upright with its face toward +y: a band `depth` blocks
 * deep, from radius R - t to R, centred on (cx, z) at y, with an optional
 * stone set on top.
 */
function ring(
  scene,
  [cx, y, cz],
  R,
  t,
  metal,
  { stone, shine, depth = 3 } = {}
) {
  for (let x = Math.floor(cx - R - 1); x <= cx + R + 1; x++)
    for (let z = Math.floor(cz - R - 1); z <= cz + R + 1; z++) {
      const dx = x + 0.5 - cx;
      const dz = z + 0.5 - cz;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d > R || d < R - t) continue;
      const mat = shine && dz > 0 && dx < 0 && d > R - t * 0.6 ? shine : metal;
      for (let k = 0; k < depth; k++) scene.set(x, y - k, z, mat);
    }
  if (stone) {
    const top = Math.floor(cz + R);
    const x = Math.floor(cx);
    const yy = y - Math.floor(depth / 2);
    scene.box(x - 1, yy - 1, top, 3, 3, 2, stone.body);
    scene.set(x, yy, top + 2, stone.body);
    scene.set(x - 1, yy + 1, top + 1, stone.light);
    scene.set(x, yy, top + 2, stone.light);
  }
  return scene;
}

function ringsScene() {
  const s = new Scene({ seed: 5 });
  const cloth = [
    m('satin-1', '#f6c4d8'),
    m('satin-2', '#f2bad0'),
    m('satin-3', '#f9cfe0'),
  ];
  const velvet = m('velvet', P.purple, { spread: 0.05 });
  const velvetDk = m('velvet-dk', P.purpleDk, { spread: 0.05 });
  const lining = m('lining', P.lavenderLt, { spread: 0.03 });
  const cushion = m('cushion', '#6d55b8', { spread: 0.05 });
  const slit = m('slit', P.plum);
  const gold = m('gold', P.gold, { spread: 0.05 });
  const goldLt = m('gold-lt', P.goldLt, { spread: 0.04 });
  const stone = { body: m('stone', P.cyan), light: m('stone-lt', '#d6f7ff') };
  const petals = [
    m('petal-1', P.pink),
    m('petal-2', P.white),
    m('petal-3', P.rose),
  ];

  // The cloth, wide enough to fill the frame, in soft diagonal folds.
  const folds = [0, 2, 0, 1, 0, 0, 2, 1, 0, 2, 2, 0, 1];
  for (let y = -80, i = 0; y < 80; i++) {
    const w = 3 + Math.floor(hash3(i, 0, 0, 2) * 6);
    s.box(-80, y, -1, 160, w, 1, cloth[folds[i % folds.length]]);
    y += w;
  }
  // The box: rounded at its upright corners, a cushion with a slit, and its
  // lid open behind, lined in lavender.
  const BW = 28;
  const BD = 18;
  const BH = 8;
  solid(
    s,
    [0, 0, 0],
    [BW - 1, BD - 1, BH - 1],
    (x, y) => {
      const cx = Math.min(x, BW - x);
      const cy = Math.min(y, BD - y);
      return cx + cy > 1.6;
    },
    (x, y, z) => (z === 0 ? velvetDk : velvet)
  );
  s.box(2, 2, BH - 1, BW - 4, BD - 4, 1, cushion);
  s.box(2, 9, BH - 1, BW - 4, 1, 1, slit);
  solid(
    s,
    [0, -3, BH],
    [BW - 1, 0, BH + 17],
    (x, y, z) => {
      const cx = Math.min(x, BW - x);
      const cz = Math.min(z - BH, BH + 18 - z);
      return cx + cz > 1.6;
    },
    velvet
  );
  s.box(2, 0, BH + 2, BW - 4, 1, 14, lining);
  // Two rings standing in the slit, one set with a pale blue stone.
  ring(s, [7, 10, BH + 4], 5, 1.6, gold, { shine: goldLt });
  ring(s, [21, 10, BH + 4], 5, 1.6, gold, { shine: goldLt, stone });
  // Petals on the cloth.
  const r = s.random;
  for (let i = 0; i < 46; i++) {
    const x = Math.floor(r() * 90) - 45;
    const y = Math.floor(r() * 90) - 45;
    if (x > -4 && x < BW + 4 && y > -6 && y < BD + 4) continue;
    const mat = petals[r() < 0.15 ? 2 : r() < 0.55 ? 1 : 0];
    s.set(x, y, 0, mat);
    if (r() < 0.6) s.set(x + 1, y, 0, mat);
    if (r() < 0.4) s.set(x, y + 1, 0, mat);
  }
  return s;
}

function galleryRings() {
  const W = 800;
  const H = 450;
  const scene = render(ringsScene());
  return document({
    width: W,
    height: H,
    label: 'Two blocky gold rings in an open purple box on a pink cloth',
    layers: [
      rect(0, 0, W, H, '#f6c4d8'),
      anchor(scene, 3.5, [14, 9, 8], [W / 2 + 10, 255]),
    ],
  });
}

// ---------------------------------------------------------------------------
// Gallery: the bouquet

/**
 * A dome of flowers: each block takes the flower whose heart is nearest, so
 * the dome is a patchwork of blooms, with a leaf between some of them.
 */
function bouquetScene() {
  const s = new Scene({ seed: 8 });
  // Each kind: its petals, the ring round its heart, and the heart.
  const kinds = [
    [m('bq-pink', P.pink), m('bq-pink-m', P.pinkDk), m('bq-pink-h', P.rose)],
    [
      m('bq-white', P.white, { spread: 0.03 }),
      m('bq-white-m', P.blush, { spread: 0.03 }),
      m('bq-white-h', P.goldLt),
    ],
    [
      m('bq-lav', P.lavender),
      m('bq-lav-m', P.purple),
      m('bq-lav-h', P.purpleDk),
    ],
    [
      m('bq-blush', P.pinkLt),
      m('bq-blush-m', P.pink),
      m('bq-blush-h', P.pinkDk),
    ],
  ];
  const leaf = m('bq-leaf', P.leaf);
  const leafDk = m('bq-leaf-dk', P.leafDk);
  const stem = m('bq-stem', '#6fae74');
  const ribbon = m('bq-ribbon', P.lavender);
  const ribbonDk = m('bq-ribbon-dk', P.purple);

  const RX = 12;
  const RZ = 8.5;
  // Flower hearts on a spiral over the dome.
  const hearts = [];
  const N = 21;
  for (let i = 0; i < N; i++) {
    const t = (i + 0.3) / N;
    const h = 1 - t * 0.92; // height on the dome, 1 at the crown
    const rr = Math.sqrt(1 - h * h);
    const a = i * 2.399963 + 0.6;
    hearts.push({
      x: RX * rr * cos(a),
      y: RX * rr * sin(a),
      z: RZ * h,
      kind: kinds[[0, 1, 2, 1, 3, 0, 2, 1][i % 8]],
    });
  }
  solid(
    s,
    [-RX - 1, -RX - 1, -2],
    [RX + 1, RX + 1, RZ + 1],
    (x, y, z) => {
      const d = (x * x + y * y) / (RX * RX) + (z * z) / (RZ * RZ);
      return d <= 1 && d > 0.5;
    },
    (x, y, z) => {
      let best = null;
      let bd = Infinity;
      let second = Infinity;
      for (const f of hearts) {
        const dx = x + 0.5 - f.x;
        const dy = y + 0.5 - f.y;
        const dz = z + 0.5 - f.z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < bd) {
          second = bd;
          bd = d;
          best = f;
        } else if (d < second) second = d;
      }
      // Leaves where two flowers meet, then each flower in rings.
      if (Math.sqrt(second) - Math.sqrt(bd) < 0.7) return z < 2 ? leafDk : leaf;
      if (bd < 1.6) return best.kind[2];
      if (bd < 4.5) return best.kind[1];
      return best.kind[0];
    }
  );
  // Leaves poking out under the rim.
  for (let i = 0; i < 18; i++) {
    const a = i * 0.349 + 0.2;
    for (let k = 0; k < 2; k++)
      s.set(
        Math.round((RX + 0.4 + k) * cos(a)),
        Math.round((RX + 0.4 + k) * sin(a)),
        -2 - k,
        k ? leafDk : leaf
      );
  }
  // The stems, gathered, and a lavender ribbon tied round them with a bow.
  s.cylinder(0, 0, -23, 3.4, 22, stem);
  s.cylinder(0, 0, -12, 4, 2, ribbon);
  // The bow: a loop on each face either side of the front corner, so the
  // two rise away from the knot alike, and two tails.
  const loop = ['..aaa.', '.abbba', 'abb.ba', '.abbba', '..aaa.'];
  const mats = { a: ribbonDk, b: ribbon };
  const K = [4, 4, -11];
  mask(
    s,
    loop.map(row => [...row].reverse().join('')),
    [K[0] - 6, K[1], K[2] + 2],
    mats
  );
  mask(s, loop, [K[0], K[1] - 1, K[2] + 2], mats, { plane: 'yz' });
  s.box(K[0] - 1, K[1] - 1, K[2] - 1, 2, 2, 2, ribbonDk);
  s.set(K[0], K[1], K[2], ribbonDk);
  for (let k = 0; k < 8; k++) {
    s.set(K[0] - 1 - (k >> 2), K[1], K[2] - 2 - k, ribbon);
    s.set(K[0], K[1] - 1 - (k >> 2), K[2] - 2 - k, ribbon);
  }
  return s;
}

function galleryBouquet() {
  const W = 800;
  const H = 450;
  const layers = [
    bandedSky(
      W,
      H,
      [
        [0, '#d9e6fb'],
        [0.6, '#eee6fb'],
        [1, '#fbe1ec'],
      ],
      8
    ),
    cloud(40, 70, 16, 3, 14, { seed: 4, color: '#ffffff', shadow: '#e4e8f8' }),
    cloud(560, 40, 14, 3, 14, { seed: 6, color: '#ffffff', shadow: '#e4e8f8' }),
    cloud(610, 300, 12, 2, 12, {
      seed: 9,
      color: '#ffffff',
      shadow: '#f1e2ef',
    }),
    cloud(-30, 330, 14, 2, 12, {
      seed: 2,
      color: '#ffffff',
      shadow: '#f1e2ef',
    }),
  ];
  for (const [x, y, sz, c] of [
    [170, 210, 5, P.pink],
    [640, 190, 5, P.purple],
    [230, 90, 4, '#ffffff'],
  ])
    layers.push(sparkle(x, y, sz, c));
  const bq = render(bouquetScene());
  layers.push(anchor(bq, 4.5, [0, 0, 0], [W / 2, 178]));
  return document({
    width: W,
    height: H,
    label: 'A blocky bridal bouquet tied with a lavender ribbon',
    layers,
  });
}

// ---------------------------------------------------------------------------
// Gallery: the ceremony and the reception, block-scale dioramas

const grassSide = fringeTexture(
  'wedding-grass-side',
  ['#8cc68a', '#a0d29a', '#76b479'],
  ['#b98f6c', '#a87f5e', '#c9a07c'],
  { seed: 41 }
);
const grassTop = noise(
  'wedding-grass-top',
  ['#8cc68a', '#a0d29a', '#76b479', '#b4dca9'],
  { weights: [5, 3, 3, 1], seed: 42 }
);
const GRASS = material({ id: 'wedding-grass', top: grassTop, side: grassSide });

/**
 * A white chair facing -y at (x, y, z): a seat 3 blocks wide on four legs and
 * a back of two posts and two rails, with a sash tied on when one is given.
 */
function chair(s, x, y, z, wood, sash) {
  for (const [i, j] of [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
  ])
    s.set(x + i, y + j, z, wood);
  s.box(x, y, z + 1, 3, 2, 1, wood);
  s.box(x, y + 1, z + 2, 1, 1, 3, wood);
  s.box(x + 2, y + 1, z + 2, 1, 1, 3, wood);
  s.box(x, y + 1, z + 4, 3, 1, 1, wood);
  if (sash) s.set(x + 1, y + 2, z + 4, sash);
}

/**
 * A blocky made-up figure facing +y, 2 blocks square, feet at (x, y, z):
 * legs or a skirt, a body with arms, a head and hair. `shirt` and `flower`
 * put a shirt front and a buttonhole on a suit; `hold` puts a posy in the
 * hands. Returns where its face is, for the eyes.
 */
function figure(s, x, y, z, o) {
  const { skin, hair, top, legs, skirt, veil, longHair, hold, shirt, flower } =
    o;
  if (skirt) {
    s.box(x - 1, y - 1, z, 4, 4, 2, skirt);
    s.box(x - 1, y, z + 2, 4, 3, 1, skirt);
    s.box(x, y, z + 3, 2, 2, 1, skirt);
  } else s.box(x, y, z, 2, 2, 4, legs);
  s.box(x, y, z + 4, 2, 2, 3, top);
  // Arms down the sides, hands brought forward to the front.
  for (const ax of [x - 1, x + 2]) {
    s.box(ax, y, z + 5, 1, 2, 2, skirt ? skin : top);
    s.set(ax, y + 1, z + 4, skin);
  }
  if (shirt) s.box(x, y + 1, z + 5, 1, 1, 2, shirt);
  if (flower) s.set(x + 1, y + 2, z + 6, flower);
  s.box(x, y, z + 7, 2, 2, 2, skin);
  s.box(x, y, z + 9, 2, 2, 1, hair);
  s.box(x, y - 1, z + 7, 2, 1, 3, hair);
  if (longHair) {
    s.box(x, y - 1, z + 4, 2, 1, 3, hair);
    s.set(x - 1, y, z + 8, hair);
    s.set(x + 2, y, z + 8, hair);
  }
  if (veil) {
    s.box(x, y - 2, z + 4, 2, 1, 6, veil);
    s.box(x - 1, y - 2, z + 2, 4, 1, 3, veil);
  }
  if (hold) {
    s.box(x, y + 2, z + 4, 2, 1, 1, hold);
    s.set(x, y + 2, z + 5, hold);
  }
  return [x, y + 2, z + 9];
}

/** Two eyes on a figure's face, drawn finer than a block, in lattice units. */
const eyes = ([x, y, z], color = '#2b2230') =>
  faceRect('xz', [x + 0.3, y, z - 0.35], 0.4, 0.6, color) +
  faceRect('xz', [x + 1.3, y, z - 0.35], 0.4, 0.6, color);

function ceremonyScene() {
  const s = new Scene({ seed: 21 });
  const sand = big('sand', '#f3dcc0');
  const sandDk = big('sand-dk', '#e3c5a5');
  const white = m('chair', P.white, { spread: 0.04 });
  const runner = m('runner', P.pinkLt);
  const sash = m('sash', P.pink);
  const archWood = m('arch', '#fbf6ff', { spread: 0.04 });
  const flowers = [
    m('c-pink', P.pink),
    m('c-white', P.white),
    m('c-lav', P.lavender),
    m('c-rose', P.pinkDk),
  ];
  const leaf = m('c-leaf', P.leaf);
  const petal = m('c-petal', P.pinkDk);

  const X = 30;
  const Y = 32;
  // The island: grass over soil, ringed by a sandy beach.
  for (let x = 0; x < X; x++)
    for (let y = 0; y < Y; y++) {
      const ex = Math.min(x, X - 1 - x);
      const ey = Math.min(y, Y - 1 - y);
      if (ex + ey < 3) continue;
      const beach = ex < 3 || ey < 3 || ex + ey < 7;
      const h = beach ? 2 : 3;
      for (let z = 0; z < h; z++)
        s.set(
          x,
          y,
          z,
          beach ? (z === h - 1 ? sand : sandDk) : z === h - 1 ? GRASS : sandDk
        );
    }
  // The aisle and the chairs either side of it.
  s.box(13, 9, 2, 4, Y - 12, 1, runner);
  for (let i = 0; i < 9; i++) {
    const r = hash3(i, 3, 1, 9);
    s.set(
      13 + Math.floor(r * 4),
      10 + Math.floor(hash3(i, 7, 2, 9) * 18),
      3,
      petal
    );
  }
  for (const y of [14, 19]) {
    for (const x of [5, 9]) chair(s, x, y, 3, white, x === 9 ? sash : null);
    for (const x of [17, 21]) chair(s, x, y, 3, white, x === 17 ? sash : null);
  }
  // Flower posts lining the front of the aisle.
  for (const [x, y] of [
    [11, 25],
    [18, 25],
  ]) {
    s.box(x, y, 3, 1, 1, 3, white);
    s.box(x, y, 6, 1, 1, 1, flowers[0]);
    s.set(x, y + 1, 6, leaf);
    s.set(x - 1, y, 6, flowers[2]);
  }
  // The arch: two posts and a rounded top, wound with flowers.
  const A = { x0: 8, x1: 21, y: 6 };
  for (const x of [A.x0, A.x1]) s.box(x, A.y - 1, 3, 2, 2, 9, archWood);
  const cx = (A.x0 + A.x1 + 2) / 2;
  for (let x = A.x0; x <= A.x1 + 1; x++)
    for (let z = 12; z < 22; z++) {
      const dx = x + 0.5 - cx;
      const dz = z + 0.5 - 12;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d <= 7 && d > 5) s.box(x, A.y - 1, z, 1, 2, 1, archWood);
    }
  // Flowers: on the crown of the arch and down its left post.
  const spots = [];
  for (let x = A.x0 - 1; x <= A.x1 + 2; x++)
    for (let z = 3; z < 22; z++)
      for (let y = A.y - 2; y <= A.y + 1; y++) {
        if (s.has(x, y, z)) continue;
        const near =
          s.get(x, y - 1, z) === archWood ||
          s.get(x, y + 1, z) === archWood ||
          s.get(x - 1, y, z) === archWood ||
          s.get(x + 1, y, z) === archWood ||
          s.get(x, y, z - 1) === archWood;
        if (!near) continue;
        const up =
          z > 15 || (x < cx - 2 && z > 4 && z < 15) || (x > cx + 2 && z < 7);
        const h = hash3(x, y, z, 5);
        if (up && h < 0.62) spots.push([x, y, z, h]);
      }
  for (const [x, y, z, h] of spots)
    s.set(x, y, z, h < 0.12 ? leaf : flowers[Math.floor(h * 31) % 4]);
  // The couple under the arch.
  const faces = [
    figure(s, 12, 7, 3, {
      skin: m('skin-a', '#e2a982'),
      hair: m('hair-a', '#4a3226'),
      top: m('suit', '#4d4a7a'),
      legs: m('trousers', '#3c3a63'),
      shirt: dot(P.white),
      flower: dot(P.pinkDk),
    }),
    figure(s, 17, 7, 3, {
      skin: m('skin-b', '#c98e68'),
      hair: m('hair-b', '#7a4a2e'),
      top: m('dress', P.white, { spread: 0.03 }),
      skirt: m('dress-skirt', P.white, { spread: 0.03 }),
      veil: m('veil', '#efe9fb', { spread: 0.03 }),
      longHair: true,
      hold: flowers[3],
    }),
  ];
  // Flower bushes at the front corners.
  for (const [x, y] of [
    [5, 26],
    [24, 27],
    [26, 7],
  ]) {
    s.ellipsoid(x + 0.5, y + 0.5, 4, 2.2, 2.2, 1.8, leaf);
    s.set(x, y, 5, flowers[0]);
    s.set(x + 1, y - 1, 4, flowers[1]);
    s.set(x - 1, y + 1, 4, flowers[3]);
  }
  return { s, faces };
}

function galleryCeremony() {
  const W = 800;
  const H = 450;
  const HZ = 250;
  const layers = [
    bandedSky(
      W,
      HZ,
      [
        [0, '#b9a5ea'],
        [0.5, '#f0b3d0'],
        [1, '#ffd5b0'],
      ],
      8
    ),
    squareSun(610, HZ - 18, 70, '#fff3d9', {
      glow: ['#ffd0b3', '#ffe2c6'],
      step: 12,
    }),
    cloud(60, 60, 14, 2, 12, { seed: 12, color: '#f6dcf1', shadow: '#e8c5e6' }),
    cloud(470, 100, 10, 2, 12, {
      seed: 13,
      color: '#ffe4ec',
      shadow: '#f4cbe0',
    }),
    bandedSky(
      W,
      H,
      [
        [0, '#c38ab9'],
        [1, '#6c5aa8'],
      ],
      6,
      HZ
    ),
  ];
  for (const [i, w] of [
    [0, 90],
    [1, 70],
    [2, 50],
  ])
    layers.push(
      rect(610 - w / 2, HZ + 12 + i * 22, w, 6, '#ffd9bd', 0.7 - i * 0.15)
    );
  const { s, faces } = ceremonyScene();
  const isl = overlay(render(s), faces.map(f => eyes(f)).join(''));
  layers.push(anchor(isl, 4.4, [15, 16, 2], [W / 2 - 30, 300]));
  return document({
    width: W,
    height: H,
    label: 'A blocky wedding ceremony on an island at sunset',
    layers,
  });
}

/** A chair at (x, y, z) facing +y or -y (`dir`), as `chair` draws it. */
function chairToward(s, x, y, z, dir, wood, sash) {
  if (dir < 0) return chair(s, x, y, z, wood, sash);
  const t = new Scene();
  chair(t, 0, 0, 0, wood, sash);
  t.each((i, j, k, mat) => s.set(x + i, y + 1 - j, z + k, mat));
}

function receptionScene() {
  const s = new Scene({ seed: 31 });
  const top = noise(
    'wedding-lawn-top',
    ['#5d8f7f', '#6a9c88', '#4f7f71', '#79a991'],
    {
      weights: [5, 3, 3, 1],
      seed: 43,
    }
  );
  const side = fringeTexture(
    'wedding-lawn-side',
    ['#5d8f7f', '#6a9c88', '#4f7f71'],
    ['#7a5a6e', '#6a4c60', '#8a687c'],
    { seed: 44 }
  );
  const lawn = material({ id: 'wedding-lawn', top, side });
  const earth = big('earth', '#6e5064');
  const deck = big('deck', '#b38a76');
  const cloth = m('table-cloth', '#fbf8ff', { spread: 0.03 });
  const runner = m('table-runner', P.lavender);
  const plate = m('plate', P.lavenderLt, { spread: 0.02 });
  const candle = m('candle', '#fff8ea', { spread: 0.02 });
  const flame = glow('flame', '#ffd56b');
  const chairs = m('chair-gold', '#d6a64f', { spread: 0.05 });
  const sash = m('sash-night', P.pink);
  const post = m('post', '#7a5a4a');
  const blooms = [
    m('r-pink', P.pink),
    m('r-lav', P.lavender),
    m('r-white', P.white),
  ];
  const leaf = m('r-leaf', '#5f9a78');

  const X = 32;
  const Y = 30;
  for (let x = 0; x < X; x++)
    for (let y = 0; y < Y; y++) {
      const ex = Math.min(x, X - 1 - x);
      const ey = Math.min(y, Y - 1 - y);
      if (ex + ey < 3) continue;
      for (let z = 0; z < 3; z++) s.set(x, y, z, z === 2 ? lawn : earth);
    }
  // A wooden deck under the table.
  s.box(4, 8, 2, 25, 13, 1, deck);
  // The long table, clothed to the deck, with a runner, plates, candles and
  // flowers down its middle.
  const T = { x0: 6, x1: 26, y0: 13, y1: 16 };
  s.box(T.x0, T.y0, 3, T.x1 - T.x0, T.y1 - T.y0 + 1, 3, cloth);
  s.box(T.x0, 14, 5, T.x1 - T.x0, 2, 1, runner);
  for (let x = T.x0 + 1; x < T.x1; x += 4) {
    s.set(x + 1, T.y0, 5, plate);
    s.set(x + 1, T.y1, 5, plate);
  }
  for (let x = T.x0 + 2; x < T.x1 - 1; x += 4) {
    if ((x - T.x0) % 8 === 2) {
      s.set(x, 14, 6, candle);
      s.set(x, 14, 7, flame);
      s.set(x + 1, 15, 6, candle);
      s.set(x + 1, 15, 7, candle);
      s.set(x + 1, 15, 8, flame);
    } else {
      s.box(x, 14, 6, 2, 2, 1, leaf);
      s.set(x, 14, 7, blooms[0]);
      s.set(x + 1, 15, 7, blooms[1]);
      s.set(x + 1, 14, 7, blooms[2]);
    }
  }
  // Chairs along the far side, facing out over the table, and the couple
  // in the middle two.
  for (let x = T.x0 + 1; x < T.x1 - 1; x += 4)
    chairToward(s, x, 10, 3, 1, chairs, sash);
  const faces = [];
  for (const [x, look] of [
    [
      T.x0 + 9,
      {
        skin: m('skin-a', '#e2a982'),
        hair: m('hair-a', '#4a3226'),
        top: m('suit', '#4d4a7a'),
        shirt: dot(P.white),
      },
    ],
    [
      T.x0 + 13,
      {
        skin: m('skin-b', '#c98e68'),
        hair: m('hair-b', '#7a4a2e'),
        top: m('dress', P.white, { spread: 0.03 }),
        long: true,
      },
    ],
  ]) {
    s.box(x, 11, 5, 2, 1, 3, look.top);
    s.box(x - 1, 11, 6, 1, 1, 2, look.long ? look.skin : look.top);
    s.box(x + 2, 11, 6, 1, 1, 2, look.long ? look.skin : look.top);
    if (look.shirt) s.box(x, 12, 6, 1, 1, 2, look.shirt);
    s.box(x, 11, 8, 2, 2, 2, look.skin);
    s.box(x, 11, 10, 2, 2, 1, look.hair);
    s.box(x, 10, 8, 2, 1, 3, look.hair);
    if (look.long) {
      s.set(x - 1, 11, 9, look.hair);
      s.set(x + 2, 11, 9, look.hair);
      s.box(x, 10, 5, 2, 1, 3, look.hair);
    }
    faces.push([x, 13, 10]);
  }
  // Lanterns on short posts along the near edge.
  const lantern = glow('lantern', '#ffe08a');
  for (const [x, y] of [
    [9, 26],
    [19, 26],
    [29, 16],
    [29, 8],
  ]) {
    s.box(x, y, 3, 1, 1, 2, post);
    s.set(x, y, 5, lantern);
  }
  // Four posts for the strings of lights.
  const posts = [
    [3, 4],
    [28, 4],
    [3, 25],
  ];
  for (const [x, y] of posts) s.box(x, y, 3, 1, 1, 14, post);
  // Bushes in flower at two corners.
  for (const [x, y] of [
    [27, 27],
    [6, 26],
  ]) {
    s.ellipsoid(x + 0.5, y + 0.5, 4, 2, 2, 1.6, leaf);
    s.set(x, y, 5, blooms[0]);
    s.set(x + 1, y, 4, blooms[2]);
  }
  return { s, posts, h: 17, faces };
}

/** Strings of lights between posts, in lattice units: a cord and its bulbs. */
function stringLights(pairs, h, { sag = 3.2, bulbs = 7 } = {}) {
  let cord = '';
  let halo = '';
  let bulb = '';
  for (const [[x0, y0], [x1, y1]] of pairs) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      pts.push(
        proj(
          x0 + 0.5 + (x1 - x0) * t,
          y0 + 0.5 + (y1 - y0) * t,
          h - sag * 4 * t * (1 - t)
        )
      );
    }
    cord += `M${pts.map(p => p.map(r2).join(' ')).join('L')}`;
    for (let i = 1; i < bulbs; i++) {
      const t = i / bulbs;
      const [px, py] = proj(
        x0 + 0.5 + (x1 - x0) * t,
        y0 + 0.5 + (y1 - y0) * t,
        h - sag * 4 * t * (1 - t)
      );
      halo += `M${r2(px - 1.4)} ${r2(py - 0.6)}h2.8v2.8h-2.8z`;
      bulb += `M${r2(px - 0.6)} ${r2(py + 0.2)}h1.2v1.3h-1.2z`;
    }
  }
  return (
    `<path fill="none" stroke="#3b2a4f" stroke-width=".3" d="${cord}"/>` +
    `<path fill="#ffe9a8" fill-opacity=".35" d="${halo}"/>` +
    `<path fill="#ffe39a" d="${bulb}"/>`
  );
}

function galleryReception() {
  const W = 800;
  const H = 450;
  const HZ = 300;
  const layers = [
    bandedSky(
      W,
      HZ,
      [
        [0, '#2a1d4f'],
        [0.7, '#4b3478'],
        [1, '#7a4f8f'],
      ],
      8
    ),
    stars({ x: 0, y: 0, width: W, height: 230 }, 60, {
      seed: 7,
      size: 3,
      colors: ['#ffffff', '#e8dcff', '#ffd9ec'],
    }),
    squareSun(110, 80, 54, '#fff4dc', {
      glow: ['#5d4a8f', '#7a67a8'],
      step: 10,
    }),
    bandedSky(
      W,
      H,
      [
        [0, '#3e2f6e'],
        [1, '#1f1740'],
      ],
      6,
      HZ
    ),
  ];
  for (const [i, w] of [
    [0, 60],
    [1, 44],
    [2, 30],
  ])
    layers.push(
      rect(
        110 - w / 2 + i * 6,
        HZ + 14 + i * 20,
        w,
        5,
        '#fff4dc',
        0.45 - i * 0.1
      )
    );
  const { s, posts, h, faces } = receptionScene();
  const r = render(s, {
    color: '#140c26',
    shadow: 0.24,
    left: 0.12,
    right: 0.32,
  });
  const [a, b, c] = posts;
  const lit = overlay(
    r,
    faces.map(f => eyes(f)).join('') +
      stringLights(
        [
          [a, b],
          [a, c],
          [c, b],
        ],
        h
      )
  );
  layers.push(anchor(lit, 4.3, [16, 15, 2], [W / 2 + 30, 300]));
  return document({
    width: W,
    height: H,
    label: 'A blocky reception table at night under strings of lights',
    layers,
  });
}

// ---------------------------------------------------------------------------
// Hero: a save-the-date card rising from its envelope

/** A round bloom of radius r at (cx, cy, cz): petals, a darker ring, a heart. */
function peony(s, [cx, cy, cz], r, [petal, mid, heart]) {
  solid(
    s,
    [Math.floor(cx - r), Math.floor(cy - r), Math.floor(cz - r)],
    [Math.ceil(cx + r), Math.ceil(cy + r), Math.ceil(cz + r)],
    (x, y, z) => {
      const dx = x - cx;
      const dy = y - cy;
      const dz = (z - cz) * 1.25;
      return dx * dx + dy * dy + dz * dz <= r * r;
    },
    (x, y, z) => {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const flat = Math.sqrt(dx * dx + dy * dy);
      if (z + 0.5 > cz && flat < r * 0.35) return heart;
      if (z + 0.5 > cz && flat < r * 0.7) return mid;
      return petal;
    }
  );
  return s;
}

/** A stem of `h` blocks with a leaf or two, from (x, y, z) up. */
function stem(s, x, y, z, h, green, leafMat) {
  for (let k = 0; k < h; k++) s.set(x, y, z + k, green);
  s.set(x + 1, y, z + Math.floor(h / 3), leafMat);
  s.set(x + 2, y, z + Math.floor(h / 3) + 1, leafMat);
  s.set(x - 1, y, z + Math.floor((2 * h) / 3), leafMat);
}

function envelopeScene() {
  const s = new Scene({ seed: 51 });
  const lav = m('env', '#bcaaf0', { spread: 0.04 });
  const lavDk = m('env-dk', '#9d88e2', { spread: 0.04 });
  const liner = m('env-liner', P.pink, { spread: 0.05 });
  const card = m('card', P.white, { spread: 0.025 });
  const seal = m('seal', P.rose);
  const sealLt = m('seal-lt', P.pink);
  const green = m('h-stem', '#6fae74');
  const leafMat = m('h-leaf', P.leaf);
  const pinkF = [
    m('h-pink', P.pink),
    m('h-pink-m', P.pinkDk),
    m('h-pink-h', P.rose),
  ];
  const lavF = [
    m('h-lav', P.lavender),
    m('h-lav-m', P.purple),
    m('h-lav-h', P.purpleDk),
  ];
  const whiteF = [
    m('h-white', P.white),
    m('h-white-m', P.blush),
    m('h-white-h', P.goldLt),
  ];

  const EW = 34;
  const ED = 6;
  const EH = 22;
  // Flowers tucked in behind.
  stem(s, -1, -1, 8, 20, green, leafMat);
  peony(s, [-0.5, -0.5, 30], 3, pinkF);
  stem(s, -3, -3, 8, 15, green, leafMat);
  peony(s, [-2.5, -2.5, 24.5], 2.4, whiteF);
  stem(s, 30, -2, 8, 19, green, leafMat);
  peony(s, [30.5, -1.5, 29], 3, lavF);
  stem(s, 26, -3, 8, 24, green, leafMat);
  peony(s, [26.5, -2.5, 33.5], 2.4, pinkF);
  // The envelope, open at the top, its flap folded up behind the card.
  s.shell(0, 0, 0, EW, ED, EH, lav, { top: false });
  s.box(1, 1, 1, EW - 2, 1, EH - 1, liner);
  for (let x = 0; x < EW; x++) {
    const h = Math.min(x, EW - 1 - x);
    for (let k = 0; k < Math.floor(h * 0.55); k++) s.set(x, 0, EH + k, liner);
  }
  // The card, standing in the envelope, rising well clear of it.
  s.box(5, 3, 4, EW - 10, 1, 37, card);
  // The front's seams: a V from the top corners down to the seal.
  for (let x = 0; x < EW; x++) {
    const h = Math.min(x, EW - 1 - x);
    const z = EH - 1 - Math.round(h * 0.62);
    s.set(x, ED - 1, z, lavDk);
  }
  mask(s, HEART, [14, ED, 13], { '#': seal });
  s.set(15, ED, 12, sealLt);
  s.set(16, ED, 12, sealLt);
  s.set(15, ED, 11, sealLt);
  return s;
}

function calendarScene() {
  const s = new Scene({ seed: 52 });
  const page = m('cal-page', P.white, { spread: 0.025 });
  const head = m('cal-head', P.purple);
  const cell = m('cal-cell', P.lavenderLt, { spread: 0.03 });
  const ring = m('cal-ring', P.plum);
  const mark = m('cal-mark', P.rose);
  const markCell = m('cal-mark-cell', P.pinkLt);
  const back = m('cal-back', P.lavender);
  const W = 17;
  const H = 19;
  s.box(0, 0, 0, W, 2, H, page);
  s.box(0, 0, H - 4, W, 2, 4, head);
  s.box(0, -3, 0, W, 3, 2, back);
  for (const x of [4, 12]) {
    s.set(x, 1, H, ring);
    s.set(x, 1, H + 1, ring);
    s.set(x, 0, H + 1, ring);
  }
  // Four weeks of five days, the day itself circled.
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 5; c++) {
      const x = 1 + c * 3;
      const z = H - 6 - r * 3;
      const day = r === 2 && c === 3;
      s.box(x, 1, z - 1, 2, 1, 2, day ? markCell : cell);
      if (day) {
        for (let i = -1; i <= 2; i++) {
          s.set(x + i, 2, z + 1, mark);
          s.set(x + i, 2, z - 2, mark);
        }
        s.set(x - 1, 2, z, mark);
        s.set(x - 1, 2, z - 1, mark);
        s.set(x + 2, 2, z, mark);
        s.set(x + 2, 2, z - 1, mark);
      }
    }
  return s;
}

function pairOfRingsScene() {
  const s = new Scene({ seed: 53 });
  const gold = m('h-gold', P.gold, { spread: 0.05 });
  const goldLt = m('h-gold-lt', P.goldLt, { spread: 0.04 });
  const silver = m('h-silver', '#cfc4f2', { spread: 0.04 });
  const silverLt = m('h-silver-lt', '#ede8fc', { spread: 0.03 });
  const stone = {
    body: m('h-stone', P.cyan),
    light: m('h-stone-lt', '#d6f7ff'),
  };
  ring(s, [13, -4, 8], 6.5, 1.8, silver, { shine: silverLt, depth: 2 });
  ring(s, [6.5, 0, 7.5], 6.5, 1.8, gold, { shine: goldLt, stone, depth: 2 });
  return s;
}

/** A soft stepped shadow on the ground, in image pixels. */
function groundShadow(cx, cy, rx, ry, color = '#c9bbea', opacity = 0.5) {
  const step = Math.max(4, Math.round(ry / 4));
  let d = '';
  for (let y = -ry; y < ry; y += step) {
    const mid = (y + step / 2) / ry;
    const half =
      Math.round((rx * Math.sqrt(Math.max(0, 1 - mid * mid))) / step) * step;
    if (half > 0)
      d += `M${r2(cx - half)} ${r2(cy + y)}h${2 * half}v${step}h${-2 * half}z`;
  }
  return `<path fill="${color}" fill-opacity="${opacity}" d="${d}"/>`;
}

function heroInvitation() {
  const W = 1144;
  const H = 703;
  const S = 4.3;
  const layers = [steppedDisc(585, 350, 330, 22, P.lavenderPale)];
  const env = render(envelopeScene());
  // The card's words and a heart, printed on its face in the pixel font.
  const PX = 0.42;
  const centred = (dots, from, to) => from + (to - from - dots * PX) / 2;
  const words = [
    ['SAVE THE', 38],
    ['DATE', 33.5],
  ]
    .map(([t, z]) =>
      onPlane(
        'xz',
        [centred(t.length * 6 - 1, 5, 29), 4, z],
        PX,
        pixelText(t, 0, 0, 1, P.purple)
      )
    )
    .join('');
  const heartSmall = onPlane(
    'xz',
    [centred(7, 5, 29), 4, 28.8],
    PX,
    sprite(
      ['.##.##.', '#######', '.#####.', '..###..', '...#...'],
      { '#': P.pink },
      0,
      0,
      1
    )
  );
  const card = overlay(env, words + heartSmall);
  layers.push(groundShadow(585, 600, 230, 34));
  layers.push(groundShadow(255, 590, 110, 22));
  layers.push(groundShadow(905, 588, 105, 22));
  const cal = render(calendarScene());
  layers.push(anchor(cal, S, [8.5, 0, 0], [262, 585]));
  layers.push(anchor(card, S, [17, 3, 0], [585, 598]));
  const rings = render(pairOfRingsScene());
  layers.push(anchor(rings, S, [9, -2, 0.5], [905, 586]));
  for (const [x, y, sz, c] of [
    [175, 250, 6, P.gold],
    [1010, 215, 6, P.gold],
    [880, 140, 5, P.purple],
    [330, 150, 5, P.pink],
    [1060, 420, 4, P.purple],
    [120, 440, 4, P.pink],
    [770, 90, 4, P.gold],
  ])
    layers.push(sparkle(x, y, sz, c));
  return document({
    width: W,
    height: H,
    label: 'A blocky save-the-date card rising from a lavender envelope',
    layers,
  });
}

// ---------------------------------------------------------------------------
// The navbar logo: two linked rings, drawn as pixel art to read at 30px

function logo() {
  const N = 16;
  const A = [5.5, 9.5]; // purple, left
  const B = [10.5, 9.5]; // pink, right
  const RO = 5.3;
  const RI = 3.1;
  const dist = (c, i, j) => {
    const dx = i + 0.5 - c[0];
    const dy = j + 0.5 - c[1];
    return { dx, dy, d: Math.sqrt(dx * dx + dy * dy) };
  };
  const inBand = p => p.d <= RO && p.d >= RI;
  // Each hoop has a lit rim at its top left and a shaded one at its bottom
  // right, so it reads as a solid ring.
  const tone = (p, [lt, base, dk]) =>
    p.d > RO - 1.1 && p.dx + p.dy < -3
      ? lt
      : p.d > RO - 1.1 && p.dx + p.dy > 3
        ? dk
        : base;
  const purple = ['#a996ec', '#7d6bd6', '#5b48ad'];
  const pink = ['#f6b8d2', '#e58fb5', '#c8648f'];
  const all = [...purple, ...pink];
  const keys = 'abcdef';
  const key = c => keys[all.indexOf(c)];
  const rows = [];
  for (let j = 0; j < N; j++) {
    let row = '';
    for (let i = 0; i < N; i++) {
      const a = dist(A, i, j);
      const b = dist(B, i, j);
      const top = j + 0.5 < A[1];
      // Where the hoops cross, the pink lies over the purple at the top and
      // the purple over the pink at the bottom, with a gap round the one on
      // top, so they link.
      const over = top ? b : a;
      const under = top ? a : b;
      const overColors = top ? pink : purple;
      const underColors = top ? purple : pink;
      let c = '.';
      if (inBand(over)) c = key(tone(over, overColors));
      else if (inBand(under)) {
        const near = over.d > RO && over.d < RO + 0.95;
        const nearIn = over.d < RI && over.d > RI - 0.95;
        if (!(
          inBand(dist(top ? A : B, i, j)) &&
          (near || nearIn) &&
          Math.abs(i + 0.5 - 8) < 3
        ))
          c = key(tone(under, underColors));
      }
      row += c;
    }
    rows.push(row);
  }
  // A pale blue stone set on top of the pink ring.
  const gem = { g: '#72ddf7', h: '#d6f7ff', s: '#3fb5d6' };
  const put = (i, j, ch) => {
    rows[j] = rows[j].slice(0, i) + ch + rows[j].slice(i + 1);
  };
  put(9, 1, 'h');
  put(10, 1, 'g');
  put(11, 1, 'g');
  put(9, 2, 'g');
  put(10, 2, 'g');
  put(11, 2, 's');
  put(10, 3, 's');
  const pal = Object.fromEntries(all.map((c, i) => [keys[i], c]));
  return document({
    width: 64,
    height: 64,
    label: 'Two blocky linked rings',
    layers: [sprite(rows, { ...pal, ...gem }, 0, 0, 4)],
  });
}

// ---------------------------------------------------------------------------
// The testimonial avatars: invented blocky people in a stepped circle

/**
 * A head and shoulders, facing the viewer across the front corner. The head
 * is a rounded block; eyes, cheeks and a smile sit on its surface either
 * side of the corner, found by walking out from the middle.
 */
function bust({ skin, hair, shirt, collar, longHair, fringe }) {
  const s = new Scene({ seed: 61 });
  const C = [8, 8];
  // Shoulders.
  solid(
    s,
    [0, 0, 0],
    [15, 15, 6],
    (x, y, z) => {
      const dx = (x - C[0]) / 7.6;
      const dy = (y - C[1]) / 7.6;
      const dz = (z - 0) / 7.4;
      return dx * dx + dy * dy + dz * dz <= 1;
    },
    shirt
  );
  // Neck and head.
  s.cylinder(C[0], C[1], 6, 2.2, 3, skin);
  const H = { x: 8, y: 8, z: 13.2, r: 5.1, rz: 5.6 };
  const inHead = (x, y, z) => {
    const dx = (x - H.x) / H.r;
    const dy = (y - H.y) / H.r;
    const dz = (z - H.z) / H.rz;
    return dx * dx * dx * dx + dy * dy * dy * dy + dz * dz * dz * dz <= 1;
  };
  solid(s, [2, 2, 7], [14, 14, 19], inHead, skin);
  // The surface block a ray from the head's middle leaves through.
  const surface = (angle, z) => {
    const dx = cos(angle);
    const dy = sin(angle);
    let last = null;
    for (let t = 0; t < 9; t += 0.1) {
      const x = Math.floor(H.x + dx * t);
      const y = Math.floor(H.y + dy * t);
      if (s.get(x, y, z) === skin) last = [x, y, z];
    }
    return last;
  };
  const front = 0.7854; // the corner toward the viewer
  // Hair: a cap over the top and down the back.
  s.each((x, y, z, mat) => {
    if (mat !== skin || z < 9) return;
    const ux = x + 0.5 - H.x;
    const uy = y + 0.5 - H.y;
    const facing = (ux + uy) / Math.sqrt(2);
    const top = z >= 15;
    const back = facing < -0.6 && z >= (longHair ? 9 : 11);
    const side =
      Math.abs(ux - uy) > (longHair ? 4.1 : 4.6) && z >= (longHair ? 9 : 13);
    if (top || back || side) s.set(x, y, z, hair);
  });
  if (fringe)
    for (const [a, z] of fringe) {
      const p = surface(front + a, z);
      if (p) s.set(p[0] + (a < 0 ? 1 : 0), p[1] + (a > 0 ? 1 : 0), z, hair);
    }
  if (longHair) {
    // Hair falling over the shoulders behind.
    solid(
      s,
      [2, 2, 3],
      [14, 14, 10],
      (x, y, z) => {
        const ux = x - H.x;
        const uy = y - H.y;
        const facing = (ux + uy) / Math.sqrt(2);
        const d = Math.sqrt(ux * ux + uy * uy);
        return (
          facing < 0.5 &&
          d < 5.6 &&
          d > 2.4 &&
          !s.has(Math.floor(x), Math.floor(y), Math.floor(z))
        );
      },
      hair
    );
  }
  const eye = dot('#2b2230');
  const cheek = dot('#f29bb8');
  const smile = dot('#a3475f');
  for (const a of [-0.42, 0.42]) {
    for (const z of [12, 13]) {
      const p = surface(front + a, z);
      if (p) s.set(...p, eye);
    }
    const c = surface(front + a * 1.9, 10);
    if (c) s.set(...c, cheek);
  }
  for (const [a, z] of [
    [-0.34, 10],
    [0, 9],
    [0.34, 10],
    [-0.15, 9],
    [0.15, 9],
  ]) {
    const p = surface(front + a, z);
    if (p) s.set(...p, smile);
  }
  if (collar) {
    for (let k = 0; k < 3; k++) {
      for (const a of [-1, 1]) {
        const ang = front + a * (0.22 + k * 0.12);
        const x = Math.floor(C[0] + cos(ang) * (4.2 - k * 0.2));
        const y = Math.floor(C[1] + sin(ang) * (4.2 - k * 0.2));
        for (let z = 6; z >= 0; z--)
          if (s.get(x, y, z) === shirt && !s.has(x + 1, y + 1, z + 1)) {
            s.set(x, y, z - k, collar);
            break;
          }
      }
    }
  }
  return s;
}

function avatar({ bg, ...look }, label) {
  const clip = 'wedding-avatar-clip';
  const disc = steppedDisc(32, 32, 31, 4, bg);
  const head = render(bust(look), { ao: 0.06, shadow: 0.16 });
  const placed = anchor(head, 1.12, [8, 8, 12], [32, 31]);
  const path = disc.match(/ d="([^"]+)"/)[1];
  const svg = document({
    width: 64,
    height: 64,
    label,
    defs: [`<clipPath id="${clip}"><path d="${path}"/></clipPath>`],
    layers: [
      disc,
      {
        svg: `<g clip-path="url(#${clip})">${placed.svg}</g>`,
        defs: placed.defs,
      },
    ],
  });
  // The originals are 64pt square on a 64-unit viewBox; keep that size.
  return svg.replace('width="64" height="64"', 'width="64pt" height="64pt"');
}

const avatarOne = () =>
  avatar(
    {
      bg: P.lavenderLt,
      skin: m('av1-skin', '#d39a70'),
      hair: m('av1-hair', '#2f2626'),
      shirt: m('av1-shirt', P.purple),
      collar: m('av1-collar', P.white, { spread: 0.03 }),
    },
    'A blocky made-up client with short dark hair'
  );

const avatarTwo = () =>
  avatar(
    {
      bg: '#f9dbe8',
      skin: m('av2-skin', '#efc09b'),
      hair: m('av2-hair', '#7b4a2c'),
      shirt: m('av2-shirt', P.pink),
      longHair: true,
      fringe: [
        [-0.6, 14],
        [0.6, 14],
      ],
    },
    'A blocky made-up client with long brown hair'
  );

// ---------------------------------------------------------------------------
// Contact: a letterbox on its post, a letter on its way in

function mailboxScene() {
  const s = new Scene({ seed: 71 });
  const grass = m('mb-grass', '#8cc68a');
  const grassSide = m('mb-grass-side', '#b98f6c');
  const wood = m('mb-post', P.wood);
  const body = m('mb-body', P.purple);
  const bodyLt = m('mb-body-lt', '#a996ec');
  const inside = m('mb-inside', P.plum);
  const flag = m('mb-flag', P.pinkDk);
  const pole = m('mb-pole', '#5b4a7a');
  const letter = m('mb-letter', P.white, { spread: 0.025 });
  const seam = dot(P.lavenderLt);
  const heart = m('mb-heart', P.rose);
  const handle = dot(P.goldLt);
  const leaf = m('mb-leaf', P.leaf);
  const green = m('mb-stem', '#6fae74');
  const sprig = m('mb-sprig', P.purple);
  const pinkF = [m('mb-pink', P.pink), dot(P.pinkDk), dot(P.rose)];
  const whiteF = [m('mb-white', P.white), dot(P.blush), dot(P.goldLt)];
  const lavF = [m('mb-lav', P.lavender), dot(P.purple), dot(P.purpleDk)];

  // A round patch of garden.
  solid(
    s,
    [-10, -8, 0],
    [20, 22, 1],
    (x, y) => {
      const dx = x - 5;
      const dy = y - 7;
      return dx * dx + dy * dy <= 13.5 * 13.5;
    },
    (x, y, z) => (z === 1 ? grass : grassSide)
  );
  // The post, and the box on it: a straight body under a rounded top, open
  // at the front, its door folded down.
  s.box(4, 6, 2, 2, 2, 16, wood);
  const X0 = 0;
  const XW = 10;
  const Y0 = 0;
  const YL = 16;
  const Z0 = 18;
  solid(
    s,
    [X0, Y0, Z0],
    [X0 + XW - 1, Y0 + YL - 1, Z0 + 11],
    (x, y, z) => {
      const dx = x - (X0 + XW / 2);
      const dz = z - (Z0 + 6);
      return z < Z0 + 6 || dx * dx + dz * dz <= 25;
    },
    (x, y, z) => {
      const dx = x + 0.5 - (X0 + XW / 2);
      const dz = z + 0.5 - (Z0 + 6);
      const innerX = x > X0 && x < X0 + XW - 1;
      const innerZ = z > Z0 && (z < Z0 + 6 || dx * dx + dz * dz <= 16);
      if (innerX && innerZ && y > Y0) return inside;
      return z >= Z0 + 8 && x < X0 + XW / 2 ? bodyLt : body;
    }
  );
  // The interior stays as dark blocks, and the front wall is left open.
  for (let x = X0 + 1; x < X0 + XW - 1; x++)
    for (let z = Z0 + 1; z < Z0 + 11; z++)
      if (s.get(x, Y0 + YL - 1, z) === inside) s.set(x, Y0 + YL - 1, z, null);
  // The door, hinged at the bottom of the opening and hanging down.
  s.box(X0 + 1, Y0 + YL, Z0 - 6, XW - 2, 1, 7, body);
  s.set(X0 + 4, Y0 + YL + 1, Z0 - 4, handle);
  s.set(X0 + 5, Y0 + YL + 1, Z0 - 4, handle);
  // The flag, raised on the right side.
  for (let k = 0; k < 17; k++) s.set(X0 + XW, Y0 + 4, Z0 + 1 + k, pole);
  s.box(X0 + XW, Y0 + 5, Z0 + 13, 1, 6, 4, flag);
  // A letter half way in, sealed with a heart.
  s.box(X0 + 2, Y0 + 11, Z0 + 2, 6, 9, 1, letter);
  for (let i = 0; i < 3; i++) {
    s.set(X0 + 2 + i, Y0 + 19 - i, Z0 + 2, seam);
    s.set(X0 + 7 - i, Y0 + 19 - i, Z0 + 2, seam);
  }
  mask(
    s,
    ['#.#', '###', '.#.'],
    [X0 + 4, Y0 + 15, Z0 + 2],
    { '#': heart },
    { plane: 'xy' }
  );
  // Flowers round the foot of the post.
  const blooms = [
    [0, 10, pinkF, 2.3, 4],
    [10, 11, whiteF, 2.1, 3],
    [1, 2, lavF, 2, 3],
    [11, 4, pinkF, 2.2, 5],
    [5, 15, lavF, 2.3, 3],
    [-3, 6, whiteF, 2, 2],
  ];
  for (const [x, y, kind, r, h] of blooms) {
    stem(s, x, y, 2, h, green, leaf);
    peony(s, [x + 0.5, y + 0.5, 2 + h + r * 0.6], r, kind);
  }
  // Stepping stones up to the post.
  const stone = m('mb-stone', '#e9e2f5');
  for (const [x, y] of [
    [6, 12],
    [7, 15],
    [6, 18],
  ])
    s.box(x, y, 1, 2, 2, 1, stone);
  for (const [x, y] of [
    [14, 9],
    [-4, 11],
  ]) {
    s.set(x, y, 2, leaf);
    s.set(x + 1, y, 2, leaf);
    s.set(x, y + 1, 2, leaf);
    s.set(x, y, 3, sprig);
  }
  return s;
}

function contactMailbox() {
  const W = 812;
  const H = 734;
  const layers = [steppedDisc(406, 372, 340, 22, P.lavenderPale)];
  const mb = render(mailboxScene());
  layers.push(anchor(mb, 7.2, [5, 7, 1], [400, 520]));
  for (const [x, y, sz, c] of [
    [150, 200, 7, P.gold],
    [660, 150, 6, P.purple],
    [700, 420, 5, P.pink],
    [130, 470, 5, P.purple],
  ])
    layers.push(sparkle(x, y, sz, c));
  const heart = [
    '.##.##.',
    '#######',
    '#######',
    '.#####.',
    '..###..',
    '...#...',
  ];
  for (const [x, y, px, c] of [
    [560, 120, 6, P.pink],
    [610, 60, 4, P.rose],
    [520, 40, 3, P.pink],
  ])
    layers.push(sprite(heart, { '#': c }, x, y, px));
  return document({
    width: W,
    height: H,
    label: 'A blocky letterbox on its post with a letter going in',
    layers,
  });
}

// ---------------------------------------------------------------------------
// The steps: each on a soft white stepped disc, over the section's gradient

/** A ring lying flat: a band from radius R - t to R round (cx, cy), at z. */
function flatRing(s, [cx, cy, z], R, t, metal, { shine, height = 1 } = {}) {
  for (let x = Math.floor(cx - R - 1); x <= cx + R + 1; x++)
    for (let y = Math.floor(cy - R - 1); y <= cy + R + 1; y++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > R || d < R - t) continue;
      for (let k = 0; k < height; k++)
        s.set(x, y, z + k, shine && dx + dy < -R * 0.9 ? shine : metal);
    }
  return s;
}

function agreementScene() {
  const s = new Scene({ seed: 81 });
  const board = m('ag-board', P.lavender);
  const boardDk = m('ag-board-dk', '#a996e0');
  const paper = m('ag-paper', P.white, { spread: 0.025 });
  const clip = m('ag-clip', P.gold);
  const clipLt = dot(P.goldLt);
  const ink = m('ag-ink', P.purple);
  const line = m('ag-line', P.lavenderLt, { spread: 0.03 });
  const box = m('ag-box', P.purpleDk);
  const tick = m('ag-tick', P.pink);
  const wax = m('ag-wax', P.rose);
  const waxLt = m('ag-wax-lt', P.pink);
  const pen = m('ag-pen', P.purple);
  const penLt = dot('#a996ec');
  const nib = m('ag-nib', P.gold);
  const gold = m('ag-gold', P.gold);
  const goldLt = dot(P.goldLt);
  const silver = m('ag-silver', '#cfc4f2');
  const silverLt = dot('#ede8fc');
  const BW = 24;
  const BH = 30;
  // A clipboard standing up, a page of the plan on it. What is written on
  // the page is coloured into its front layer of blocks.
  s.box(0, 0, 0, BW, 2, BH, board);
  s.box(0, -4, 0, BW, 4, 2, boardDk);
  s.box(2, 2, 2, BW - 4, 1, BH - 5, paper);
  const write = (x, z, mat) => s.set(x, 2, z, mat);
  // The clip at the top.
  s.box(9, 2, BH - 3, 6, 2, 3, clip);
  s.box(10, 2, BH, 4, 1, 1, clip);
  s.set(10, 4, BH - 2, clipLt);
  // A heart for a heading, and a rule under it.
  HEART.forEach((row, v) =>
    [...row].forEach((c, u) => c === '#' && write(8 + u, 24 - v, tick))
  );
  for (let x = 4; x < BW - 4; x++) write(x, 17, ink);
  // The checklist: three lines, the first two ticked.
  for (let r = 0; r < 3; r++) {
    const z = 14 - r * 3;
    for (const [i, k] of [
      [0, 0],
      [1, 0],
      [0, -1],
      [1, -1],
    ])
      write(4 + i, z + k, r < 2 ? tick : box);
    const len = [12, 10, 11][r];
    for (let x = 8; x < 8 + len; x++) write(x, z, line);
    for (let x = 8; x < 4 + len; x++) write(x, z - 1, line);
  }
  // A signature, and a wax seal beside it, standing out from the page.
  for (let x = 4; x < 12; x++) {
    const z = 4 + Math.round(sin(x * 1.3) * 1.1);
    write(x, z, ink);
    if (x % 3 === 0) write(x, z + 1, ink);
  }
  for (let x = 13; x < 20; x++)
    for (let z = 1; z < 8; z++) {
      const dx = x + 0.5 - 16.5;
      const dz = z + 0.5 - 4.5;
      if (dx * dx + dz * dz <= 11) s.set(x, 3, z, wax);
    }
  mask(s, ['#.#', '###', '.#.'], [15, 3, 6], { '#': waxLt });
  // The pen, laid in front of the board, and two rings beside it.
  for (let x = 2; x < 22; x++) {
    s.box(x, 8, 0, 1, 2, 2, x < 5 ? penLt : pen);
  }
  s.set(22, 8, 0, nib);
  s.set(22, 9, 0, nib);
  s.set(23, 8, 0, nib);
  s.box(6, 8, 2, 6, 1, 1, nib);
  flatRing(s, [-6, 7, 0], 4.2, 1.5, gold, { shine: goldLt, height: 2 });
  flatRing(s, [-2.5, 11.5, 0], 4.2, 1.5, silver, {
    shine: silverLt,
    height: 2,
  });
  return s;
}

function stepAgreement() {
  const W = 885;
  const H = 857;
  const scene = render(agreementScene());
  return document({
    width: W,
    height: H,
    label: 'A blocky clipboard with a wedding checklist, a pen and two rings',
    layers: [
      steppedDisc(442, 430, 400, 24, '#ffffff', 0.55),
      groundShadow(430, 650, 290, 46, '#b89fd8', 0.3),
      anchor(scene, 6.2, [10, 4, 0], [440, 640]),
      sparkle(150, 230, 8, P.gold),
      sparkle(760, 180, 7, P.purple),
      sparkle(780, 520, 6, P.pink),
    ],
  });
}

function gownScene() {
  const s = new Scene({ seed: 82 });
  const brass = m('gw-brass', P.gold);
  const brassDk = m('gw-brass-dk', P.goldDk);
  const hanger = m('gw-hanger', P.wood);
  const dress = m('gw-dress', P.white, { spread: 0.03 });
  const lace = m('gw-lace', '#d9cdf4', { spread: 0.03 });
  const sash = m('gw-sash', P.pink);
  const tag = m('gw-tag', P.pinkDk);
  const comb = dot(P.goldLt);
  const shoe = m('gw-shoe', P.pink);
  const shoeDk = m('gw-shoe-dk', P.pinkDk);
  const tape = m('gw-tape', '#f5d76e');
  const tick = dot('#8a6d2a');
  const rug = m('gw-rug', P.lavenderLt);
  const rugEdge = m('gw-rug-edge', P.lavender);
  const L = 34;
  const TOP = 46;
  // A round rug under the rail.
  solid(
    s,
    [-8, -10, -1],
    [L + 8, 12, -1],
    (x, y) => {
      const dx = (x - L / 2) / 23;
      const dy = (y - 1) / 11;
      return dx * dx + dy * dy <= 1;
    },
    (x, y) => {
      const dx = (x + 0.5 - L / 2) / 23;
      const dy = (y + 0.5 - 1) / 11;
      return dx * dx + dy * dy > 0.8 ? rugEdge : rug;
    }
  );
  // The rail: two uprights on feet and a bar across the top.
  for (const x of [0, L]) {
    s.box(x, 0, 0, 1, 1, TOP, brass);
    s.box(x, -4, 0, 1, 9, 1, brassDk);
  }
  s.box(0, 0, TOP, L + 1, 1, 1, brass);
  // A hanger hooked over the bar, and the gown on it.
  const gx = 12;
  s.set(gx, 0, TOP + 1, hanger);
  s.set(gx, 1, TOP + 1, hanger);
  s.set(gx, 1, TOP, hanger);
  s.set(gx, 1, TOP - 1, hanger);
  for (let i = 1; i <= 7; i++) {
    const z = TOP - 2 - Math.floor(i / 2);
    s.set(gx - i, 1, z, hanger);
    s.set(gx + i, 1, z, hanger);
  }
  // The bodice, a sash at the waist and a full skirt that flares to the hem.
  const waist = TOP - 15;
  solid(
    s,
    [gx - 4, -3, waist],
    [gx + 4, 5, TOP - 5],
    (x, y, z) => {
      const h = (z - waist) / 10;
      const rx = 2.6 + h * 1.4;
      const ry = 1.6 + h * 0.4;
      const dx = (x - (gx + 0.5)) / rx;
      const dy = (y - 1.5) / ry;
      return dx * dx + dy * dy <= 1;
    },
    dress
  );
  s.cylinder(gx + 0.5, 1.5, waist, 3, 1, sash);
  // Three tiers of ruffles, each flaring out to a lace edge.
  const hem = 2;
  const tiers = [
    [waist - 1, waist - 9, 3.4, 6.2],
    [waist - 9, waist - 18, 5.6, 8.6],
    [waist - 18, hem, 8, 11.2],
  ];
  for (const [z1, z0, r0, r1] of tiers)
    solid(
      s,
      [gx - 13, -12, z0],
      [gx + 13, 14, z1],
      (x, y, z) => {
        const t = (z1 - z) / (z1 - z0);
        const r = z === z0 ? r1 + 0.7 : r0 + (r1 - r0) * t;
        const dx = (x - (gx + 0.5)) / r;
        const dy = (y - 1.5) / (r * 0.62);
        return dx * dx + dy * dy <= 1;
      },
      (x, y, z) => (z === z0 ? lace : dress)
    );
  // The tag, hanging from the hanger on a thread.
  s.set(gx + 6, 2, TOP - 6, tag);
  s.box(gx + 6, 2, TOP - 10, 3, 1, 3, tag);
  // The veil's hook, near the far upright.
  const vx = 27;
  s.set(vx, 0, TOP + 1, hanger);
  s.set(vx, 1, TOP + 1, hanger);
  s.set(vx, 1, TOP, hanger);
  s.box(vx - 2, 1, TOP - 2, 5, 1, 1, comb);
  // A pair of shoes and a measuring tape on the rug.
  // Heeled shoes, toes toward +y: a heel, a raised seat, the arch and the
  // toe box.
  for (const [x, y] of [
    [24, 6],
    [28, 5],
  ]) {
    s.set(x, y, 0, shoeDk);
    s.set(x, y, 1, shoeDk);
    s.box(x, y, 2, 2, 2, 1, shoe);
    s.box(x, y + 2, 1, 2, 1, 1, shoe);
    s.box(x, y + 3, 0, 2, 2, 1, shoe);
    s.box(x, y + 4, 1, 2, 1, 1, shoeDk);
    s.set(x, y, 3, shoe);
    s.set(x + 1, y, 3, shoe);
  }
  flatRing(s, [-1, 6, 0], 3.6, 1.6, tape);
  for (let x = 2; x < 9; x++) s.set(x, 8, 0, x % 2 ? tick : tape);
  for (let x = 2; x < 9; x++) s.set(x, 9, 0, tape);
  return s;
}

/** The veil, drawn on its own so it can be a little sheer. */
function veilScene() {
  const s = new Scene({ seed: 83 });
  const veil = m('gw-veil', '#f4f0fd', { spread: 0.03 });
  const lace = m('gw-lace', '#d9cdf4', { spread: 0.03 });
  const TOP = 46;
  const vx = 27;
  solid(
    s,
    [vx - 5, 1, 6],
    [vx + 5, 2, TOP - 3],
    (x, y, z) => {
      const t = (TOP - 3 - z) / (TOP - 9);
      const half = 2 + t * 3.2;
      return Math.abs(x - (vx + 0.5)) <= half && (y < 2 || t > 0.5);
    },
    (x, y, z) => (z === 6 ? lace : veil)
  );
  return s;
}

function stepGown() {
  const W = 709;
  const H = 779;
  // A softer light, so the white folds of the skirt don't read as grey.
  const soft = { left: 0.06, right: 0.17, ao: 0.05, shadow: 0.14 };
  const scene = render(gownScene(), soft);
  return document({
    width: W,
    height: H,
    label: 'A blocky wedding gown on a rail, with its veil, shoes and a tape',
    layers: [
      steppedDisc(354, 390, 340, 22, '#ffffff', 0.55),
      anchor(scene, 4.9, [17, 1, 0], [354, 640]),
      (v => ({ ...v, svg: `<g opacity="0.82">${v.svg}</g>` }))(
        anchor(render(veilScene(), soft), 4.9, [17, 1, 0], [354, 640])
      ),
      sparkle(110, 170, 7, P.gold),
      sparkle(620, 250, 6, P.pink),
    ],
  });
}

function albumScene() {
  const s = new Scene({ seed: 84 });
  const cover = m('al-cover', P.purple);
  const coverDk = m('al-cover-dk', P.purpleDk);
  const page = m('al-page', P.cream, { spread: 0.025 });
  const edge = m('al-edge', '#f1e4d6', { spread: 0.03 });
  const frame = m('al-frame', P.white, { spread: 0.02 });
  const tape = m('al-tape', '#fbe7a6', { spread: 0.02 });
  const ribbon = m('al-ribbon', P.pinkDk);
  const sticker = m('al-sticker', P.rose);
  const stickerLt = dot(P.pink);
  const stemMat = dot(P.leafDk);
  const leafMat = dot(P.leaf);
  const petal = m('al-petal', P.pink);
  const petalLt = dot(P.pinkLt);
  const centre = dot(P.goldLt);
  const PW = 22; // each page, across
  const PD = 28; // and deep
  const T = 3; // the stack of pages
  // The cover, a little larger than the pages, and the two page blocks
  // dipping toward the spine.
  s.box(-1, -1, 0, 2 * PW + 3, PD + 2, 1, cover);
  s.box(PW, -1, 0, 3, PD + 2, 1, coverDk);
  for (const [x0, side] of [
    [0, 1],
    [PW + 3, -1],
  ])
    for (let i = 0; i < PW; i++) {
      const fromSpine = side > 0 ? PW - 1 - i : i;
      const h = T + (fromSpine < 2 ? -1 : 0);
      for (let k = 1; k <= h; k++)
        s.box(x0 + i, 0, k, 1, PD, 1, k === h ? page : edge);
    }
  const top = T + 1;
  // A photo: a white frame round a little picture from rows of keys.
  const photo = (x, y, rows, pal) => {
    const w = rows[0].length + 2;
    const d = rows.length + 2;
    s.box(x, y, top - 1, w, d, 1, frame);
    rows.forEach((row, j) =>
      [...row].forEach((c, i) => s.set(x + 1 + i, y + 1 + j, top - 1, pal[c]))
    );
    // Tape over two corners, flush with the page.
    for (const [i, j] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [w - 1, d - 1],
      [w - 2, d - 1],
      [w - 1, d - 2],
    ])
      s.set(x + i, y + j, top - 1, tape);
  };
  const sky = dot('#f6b6cf');
  const sky2 = dot('#fbd5c4');
  const sun = dot('#fff1cf');
  const sea = dot('#8d7bd6');
  const lav = dot(P.lavender);
  const wht = dot(P.white);
  const pnk = dot(P.pinkDk);
  const gld = dot(P.gold);
  const grn = dot(P.leaf);
  // A sunset over the sea.
  photo(
    2,
    3,
    [
      'ppppppppp',
      'ppppppppp',
      'qqqssqqqq',
      'qqqssqqqq',
      'eeeeeeeee',
      'eeeeeeeee',
      'eeeeeeeee',
    ],
    { p: sky, q: sky2, s: sun, e: sea }
  );
  // A cake.
  photo(
    9,
    15,
    [
      'lllllllll',
      'llllkllll',
      'lllwwwlll',
      'lllpppll',
      'llwwwwwll',
      'lwwwwwwwl',
      'lpppppppl',
      'lllllllll',
    ].map(r => r.padEnd(9, 'l')),
    { l: lav, w: wht, p: pnk, k: gld }
  );
  // Two rings.
  photo(
    PW + 6,
    2,
    [
      'lllllllll',
      'lgggllll',
      'lg.gssss',
      'lg.gs..s',
      'lgggs..s',
      'lllssssl',
      'lllllllll',
    ].map(r => r.padEnd(9, 'l').replace(/\./g, 'l')),
    { l: dot(P.pinkLt), g: gld, s: dot('#b8a8ea') }
  );
  // A tree in bloom.
  photo(
    PW + 10,
    14,
    [
      'wwwwwwwww',
      'wwwpppwww',
      'wwpppppww',
      'wwpppppww',
      'wwwpppwww',
      'wwwwbwwww',
      'gggggbggg',
      'ggggggggg',
    ],
    { w: dot('#dfeefb'), p: dot(P.pink), b: dot(P.woodDk), g: grn }
  );
  // A pressed flower on the left page, and a heart sticker on the right.
  const fx = 15;
  const fy = 5;
  for (let k = 0; k < 7; k++)
    s.set(fx - (k >> 1), fy + 3 + k, top - 1, stemMat);
  s.set(fx - 2, fy + 6, top - 1, leafMat);
  s.set(fx - 3, fy + 7, top - 1, leafMat);
  for (const [i, j] of [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
    [-1, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
  ])
    s.set(fx + i, fy + 1 + j, top, (i + j) % 2 ? petal : petalLt);
  s.set(fx, fy + 1, top, centre);
  mask(s, HEART, [PW + 17, 3, top - 1], { '#': sticker }, { plane: 'xy' });
  s.set(PW + 18, 4, top - 1, stickerLt);
  s.set(PW + 19, 4, top - 1, stickerLt);
  // A ribbon bookmark from the head of the spine across the right page and
  // over its near edge, forked at the end.
  for (let y = 0; y < PD; y++) s.set(PW + 4, y, top, ribbon);
  for (let k = 0; k < 8; k++) {
    if (k < 6) s.set(PW + 4, PD, top - k, ribbon);
    else {
      s.set(PW + 3, PD, top - k, ribbon);
      s.set(PW + 5, PD, top - k, ribbon);
    }
  }
  return s;
}

function stepAlbum() {
  const W = 945;
  const H = 653;
  const scene = render(albumScene());
  return document({
    width: W,
    height: H,
    label: 'A blocky open wedding album with photos taped to its pages',
    layers: [
      steppedDisc(472, 326, 320, 22, '#ffffff', 0.55),
      anchor(scene, 5.6, [23.5, 14, 0], [472, 380]),
      sparkle(120, 140, 7, P.gold),
      sparkle(840, 110, 6, P.purple),
      sparkle(860, 520, 6, P.pink),
    ],
  });
}

// The celebration: two glasses meeting in a toast

/**
 * A champagne flute whose foot is at (fx, fy, 0), leaning by `tilt` along
 * the screen's left-to-right direction (x - y), so a pair of them meet
 * evenly in the middle: a foot, a stem and a tall bowl, filled with wine to
 * `FILL` of its height, with bubbles in it.
 */
const FLUTE = { STEM: 12, BOWL: 22, R: 4.5, FILL: 0.7 };

function flute(s, fx, fy, tilt, { glass, glassLt, wine, wineLt, bubble }) {
  const { STEM, BOWL, R, FILL } = FLUTE;
  const c = cos(tilt);
  const sn = sin(tilt);
  const local = (x, y, z) => {
    const dx = x - fx;
    const dy = y - fy;
    const a = (dx - dy) / Math.SQRT2;
    const b = (dx + dy) / Math.SQRT2;
    return { u: a * c - z * sn, w: a * sn + z * c, b };
  };
  solid(
    s,
    [Math.floor(fx - 16), Math.floor(fy - 16), 0],
    [Math.ceil(fx + 16), Math.ceil(fy + 16), STEM + BOWL + 2],
    (x, y, z) => {
      const { u, w, b } = local(x, y, z);
      const r = Math.sqrt(u * u + b * b);
      if (w < 0) return false;
      if (w < 1.2) return r <= 3.2;
      if (w < STEM) return r <= 0.85;
      if (w < STEM + BOWL) {
        const t = (w - STEM) / BOWL;
        return r <= 1 + (R - 1) * Math.sqrt(t);
      }
      return false;
    },
    (x, y, z) => {
      const { u, w, b } = local(x + 0.5, y + 0.5, z + 0.5);
      const t = (w - STEM) / BOWL;
      if (t > 0.04 && t < FILL) {
        if (hash3(x, y, z, 9) < 0.08) return bubble;
        return u - b < -1.8 ? wineLt : wine;
      }
      return u - b < -1.8 ? glassLt : glass;
    }
  );
}

function celebrationScene() {
  const s = new Scene({ seed: 85 });
  const mats = {
    glass: m('cl-glass', '#eceefb', { spread: 0.03 }),
    glassLt: dot('#ffffff'),
    wine: m('cl-wine', '#f0c85e', { spread: 0.04 }),
    wineLt: m('cl-wine-lt', '#f9e39b', { spread: 0.03 }),
    bubble: dot('#fff6d4'),
  };
  const t = 0.34;
  const { STEM, BOWL, R } = FLUTE;
  const A = (STEM + BOWL) * sin(t) + R * cos(t) - 0.6;
  const d = A / Math.SQRT2;
  flute(s, -d, d, t, mats);
  flute(s, d, -d, -t, mats);
  return s;
}

function balloonScene(color, light) {
  const s = new Scene({ seed: 86 });
  const body = m(`cl-balloon-${color.slice(1)}`, color);
  s.ellipsoid(0, 0, 7.4, 4.2, 4.2, 5.2, body);
  s.set(-2, 2, 10, dot(light));
  s.set(-2, 2, 9, dot(light));
  s.set(-1, 2, 10, dot(light));
  s.box(-1, -1, 1, 2, 2, 1, body);
  return s;
}

function stepCelebration() {
  const W = 1135;
  const H = 713;
  const layers = [steppedDisc(567, 380, 330, 22, '#ffffff', 0.55)];
  // Bunting along a sagging cord.
  const flags = [P.pink, P.lavender, P.cyan, P.goldLt, P.pinkDk, P.purple];
  let cord = '';
  const at = t => [140 + t * 860, 92 + 90 * 4 * t * (1 - t)];
  for (let i = 0; i <= 60; i++) {
    const [x, y] = at(i / 60);
    cord += `M${r2(x)} ${r2(y)}h15v4h-15z`;
  }
  layers.push(`<path fill="#7d6bd6" d="${cord}"/>`);
  const tri = [
    '#########',
    '.#######.',
    '.#######.',
    '..#####..',
    '..#####..',
    '...###...',
    '....#....',
  ];
  for (let i = 0; i < 11; i++) {
    const [x, y] = at((i + 0.5) / 11);
    layers.push(
      sprite(tri, { '#': flags[i % flags.length] }, x - 27, y + 2, 6)
    );
  }
  // Balloons on strings, either side.
  for (const [bx, by, color, light, scale] of [
    [200, 330, P.pink, P.pinkLt, 6.2],
    [300, 420, P.lavender, P.lavenderPale, 5.2],
    [935, 340, P.cyan, '#d6f7ff', 6.2],
    [835, 430, P.pinkLt, '#ffffff', 5],
  ]) {
    const b = render(balloonScene(color, light), { ao: 0.03, shadow: 0 });
    let str = '';
    for (let k = 0; k < 30; k++) {
      const yy = by + 4 + k * 6;
      str += `M${r2(bx + sin(k * 0.6) * 5 - 1.5)} ${yy}h3v6h-3z`;
    }
    layers.push(`<path fill="#9b8bc9" d="${str}"/>`);
    layers.push(anchor(b, scale, [0, 0, 1], [bx, by]));
  }
  // The glasses, rims meeting in the middle.
  const glasses = render(celebrationScene(), {
    left: 0.06,
    right: 0.17,
    ao: 0.05,
    shadow: 0.12,
  });
  layers.push(anchor(glasses, 5.3, [0, 0, 0], [567, 645]));
  // A splash where they meet, and confetti everywhere.
  const r = rng(87);
  const colors = [P.pink, P.purple, P.cyan, P.gold, P.pinkDk, P.lavender];
  let conf = {};
  for (let i = 0; i < 70; i++) {
    const x = 60 + r() * (W - 120);
    const y = 150 + r() * (H - 220);
    if (Math.abs(x - 567) < 310 && y > 230) continue;
    const c = colors[Math.floor(r() * colors.length)];
    const w = r() < 0.5 ? 8 : 12;
    const h = w === 8 ? 12 : 6;
    conf[c] =
      (conf[c] ?? '') + `M${Math.round(x)} ${Math.round(y)}h${w}v${h}h${-w}z`;
  }
  for (const [c, d] of Object.entries(conf))
    layers.push(`<path fill="${c}" d="${d}"/>`);
  for (const [x, y, sz] of [
    [535, 220, 5],
    [600, 200, 4],
    [567, 175, 6],
  ])
    layers.push(sparkle(x, y, sz, P.gold));
  // Drops of wine thrown up where the rims meet.
  layers.push(
    sprite(
      ['.a.....a.', '...b.b...', 'a.......a', '..b...b..'],
      { a: P.goldLt, b: '#f0c85e' },
      536,
      228,
      7
    )
  );
  return document({
    width: W,
    height: H,
    label: 'Two blocky glasses of champagne raised in a toast, under bunting',
    layers,
  });
}

export default [
  {
    path: 'public/img/avatar-1.svg',
    depicts:
      'A blocky made-up client with short dark hair and a purple shirt, smiling, in a lavender stepped circle. It shows no real person.',
    draw: avatarOne,
  },
  {
    path: 'public/img/avatar-2.svg',
    depicts:
      'A blocky made-up client with long brown hair and a pink top, smiling, in a pink stepped circle. It shows no real person.',
    draw: avatarTwo,
  },
  {
    path: 'public/img/contact-mailbox.svg',
    depicts:
      'A blocky purple letterbox on a wooden post in a round garden patch, its flag up and its door open, a letter sealed with a heart half way in, and flowers round the post.',
    draw: contactMailbox,
  },
  {
    path: 'public/img/gallery-bouquet.svg',
    depicts:
      'A blocky bridal bouquet of pink, white and lavender flowers with green leaves, tied with a lavender ribbon bow, against a pale sky with blocky clouds.',
    draw: galleryBouquet,
  },
  {
    path: 'public/img/gallery-cake.svg',
    depicts:
      'A blocky three-tier wedding cake with a cascade of flowers and a topper of two hearts, on a round table in a pink cloth under a string of lights.',
    draw: galleryCake,
  },
  {
    path: 'public/img/gallery-ceremony.svg',
    depicts:
      'A blocky wedding on a little island at sunset: a flowered arch with a couple under it, white chairs either side of a pink aisle, and the sea behind with a square sun on the horizon.',
    draw: galleryCeremony,
  },
  {
    path: 'public/img/gallery-reception.svg',
    depicts:
      'A blocky reception at night on a little lawn island: a long table laid with candles, plates and flowers, the couple seated behind it among gold chairs, strings of lights on three posts, and a square moon over the water.',
    draw: galleryReception,
  },
  {
    path: 'public/img/gallery-rings.svg',
    depicts:
      'Two blocky gold rings, one set with a pale blue stone, standing in an open purple ring box on a pink cloth scattered with petals.',
    draw: galleryRings,
  },
  {
    path: 'public/img/hero-invitation.svg',
    depicts:
      'A blocky "Save the date" card rising from a lavender envelope sealed with a heart, with flowers tucked behind, a calendar with the day circled and a pair of rings, on a pale lavender disc.',
    draw: heroInvitation,
  },
  {
    path: 'public/img/logo.svg',
    depicts:
      'Two linked rings in pixel blocks, one purple and one pink, the pink one set with a pale blue stone.',
    draw: logo,
  },
  {
    path: 'public/img/step-agreement.svg',
    depicts:
      'A blocky wedding plan on a lavender clipboard, two of its checklist lines ticked, signed and sealed with a heart, with a pen laid in front and two rings beside it.',
    draw: stepAgreement,
  },
  {
    path: 'public/img/step-album.svg',
    depicts:
      'A blocky open wedding album with four photos taped to its pages (a sunset, a cake, two rings and a tree in bloom), a pressed flower, a heart sticker and a pink ribbon bookmark.',
    draw: stepAlbum,
  },
  {
    path: 'public/img/step-celebration.svg',
    depicts:
      'Two blocky glasses of champagne leaning together in a toast, under a string of bunting, with balloons and confetti.',
    draw: stepCelebration,
  },
  {
    path: 'public/img/step-gown.svg',
    depicts:
      'A blocky tiered wedding gown with a pink sash on a hanger hooked over a brass rail, with its tag, a sheer veil on its own hook, a pair of pink shoes and a measuring tape on a round rug.',
    draw: stepGown,
  },
];
