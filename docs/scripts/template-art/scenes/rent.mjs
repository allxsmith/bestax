/**
 * Rent: a rentals site's pictures, as blocky iso streets. Each is a small
 * diorama on a plinth: homes along a sidewalk, a riverside town by day, a
 * row of houses at night, and a chart of homes under a magnifying glass.
 */
import {
  Scene,
  document,
  fit,
  hash3,
  material,
  place,
  renderScene,
  rng,
} from '../voxel.mjs';
import { bandedSky, pixelText, textWidth } from '../backdrop.mjs';
import {
  bricksTexture,
  glassTexture,
  grain,
  leavesTexture,
  planksTexture,
  tilesTexture,
  waterTexture,
} from '../blocks.mjs';

// ---------------------------------------------------------------------------
// Materials

const NAVY = '#2b3a55';
const tex = {
  glass: glassTexture('rent-glass', '#a7d8ee', NAVY, { seed: 3 }),
  lit: glassTexture('rent-lit', '#ffd36b', NAVY, { seed: 4, shine: '#fff4c4' }),
  dark: glassTexture('rent-dark', '#3c4f74', '#1c2740', {
    seed: 5,
    shine: '#7c91bd',
  }),
  brick: bricksTexture('rent-brick', '#e0705f', '#f2d3c6', { seed: 6 }),
  sidewalk: tilesTexture('rent-sidewalk', '#dfe3e7', '#c3c9cf', {
    seed: 7,
    every: 4,
  }),
  water: waterTexture('rent-water', '#5fb2dc', { seed: 8 }),
  leaves: leavesTexture('rent-leaves', '#5aa86a', { seed: 9 }),
  planks: planksTexture('rent-deck', '#b98a5a', { seed: 10 }),
};

const M = {
  plinth: grain('rent-plinth', '#cfd6dd', { spread: 0.04 }),
  plinthDk: grain('rent-plinth-dk', '#aeb8c2', { spread: 0.04 }),
  grass: grain('rent-grass', '#8fcf7c', {
    spread: 0.06,
    side: '#cfd6dd',
  }),
  sidewalk: material({
    id: 'rent-sidewalk',
    top: tex.sidewalk,
    side: grain('rent-plinth', '#cfd6dd', { spread: 0.04 }).left,
  }),
  road: grain('rent-road', '#5d6577', { spread: 0.05, side: '#cfd6dd' }),
  roadLine: grain('rent-road-line', '#f3efe2', { spread: 0.03 }),
  curb: grain('rent-curb', '#b9c1c9', { spread: 0.04 }),
  white: grain('rent-white', '#f1f3f5', { spread: 0.035 }),
  cream: grain('rent-cream', '#fbefd8', { spread: 0.04 }),
  sand: grain('rent-sand', '#ead6b6', { spread: 0.04 }),
  blue: grain('rent-blue', '#a9cde2', { spread: 0.04 }),
  mint: grain('rent-mint', '#bfe4d2', { spread: 0.04 }),
  brick: material({ id: 'rent-brick', color: tex.brick }),
  navy: grain('rent-navy', NAVY, { spread: 0.06 }),
  roofGreen: grain('rent-roof-green', '#5fae6e', { spread: 0.06 }),
  roofCoral: grain('rent-roof-coral', '#de6a52', { spread: 0.06 }),
  door: grain('rent-door', '#18b59f', { spread: 0.05 }),
  doorCoral: grain('rent-door-coral', '#e76f61', { spread: 0.05 }),
  glass: material({ id: 'rent-glass', color: tex.glass }),
  lit: material({ id: 'rent-lit', color: tex.lit, flat: true }),
  dark: material({ id: 'rent-dark', color: tex.dark }),
  sign: grain('rent-sign', '#ffd447', { spread: 0.03 }),
  leaves: material({ id: 'rent-leaves', color: tex.leaves }),
  trunk: grain('rent-trunk', '#7a5636', { spread: 0.07 }),
  water: material({ id: 'rent-water', color: tex.water }),
  deck: material({ id: 'rent-deck', color: tex.planks }),
  lamp: grain('rent-lamp', '#fff0b0', { spread: 0.03, flat: true }),
  post: grain('rent-post', '#3a4660', { spread: 0.05 }),
};

// ---------------------------------------------------------------------------
// Builders

/**
 * A plinth: the diorama's base, `w` by `d` and `h` deep under z = 0, its top
 * left to `top(x, y)`, which returns the material of the top block or null
 * to leave the plinth showing.
 */
function plinth(s, w, d, h, top) {
  for (let x = 0; x < w; x++)
    for (let y = 0; y < d; y++) {
      for (let z = -h; z < 0; z++)
        s.set(x, y, z, z === -h ? M.plinthDk : M.plinth);
      const m = top(x, y);
      if (m) s.set(x, y, 0, m);
    }
}

/**
 * A building's walls from (x, y, z), w along x, d along y and h high, in
 * `wall`, with windows of `glass(i, k)` on its two faces the viewer sees:
 * the front (toward +y) and the side (toward +x). Windows sit in a grid of
 * `every` blocks from `from` up, `rows` of them.
 */
function building(
  s,
  x,
  y,
  z,
  w,
  d,
  h,
  wall,
  { glass = () => M.glass, every = 3, from = 1, rows = 99, side = true } = {}
) {
  s.box(x, y, z, w, d, h, wall);
  const win = (i, k) =>
    (k - from) % every === 0 && k >= from && (k - from) / every < rows;
  for (let k = z; k < z + h; k++) {
    for (let i = x + 1; i < x + w - 1; i++)
      if ((i - x) % 2 === 1 && win(i, k - z))
        s.set(i, y + d - 1, k, glass(i, k));
    if (side)
      for (let j = y + 1; j < y + d - 1; j++)
        if ((j - y) % 2 === 1 && win(j, k - z))
          s.set(x + w - 1, j, k, glass(j, k));
  }
}

/**
 * A pitched roof over a w by d footprint from (x, y) at height z, its ridge
 * along x, stepping in a block each side per course.
 */
function gableRoof(s, x, y, z, w, d, mat, { overhang = 1, gable } = {}) {
  const half = Math.ceil(d / 2) + overhang;
  for (let n = 0; n < half; n++) {
    const y0 = y - overhang + n;
    const y1 = y + d - 1 + overhang - n;
    if (y0 > y1) break;
    for (let i = x - overhang; i < x + w + overhang; i++) {
      s.set(i, y0, z + n, mat);
      s.set(i, y1, z + n, mat);
    }
    // Fill the gable ends under the roof.
    if (gable)
      for (let j = y0 + 1; j < y1; j++) {
        s.set(x, j, z + n, gable);
        s.set(x + w - 1, j, z + n, gable);
      }
  }
}

/** A round tree: a trunk and a lumpy crown, its foot at (x, y, z). */
function tree(s, x, y, z, { trunk = 3, r = 2.4, seed = 1 } = {}) {
  for (let k = 0; k < trunk; k++) s.set(x, y, z + k, M.trunk);
  const cz = z + trunk + r - 0.5;
  for (let i = Math.floor(x - r); i <= Math.ceil(x + r); i++)
    for (let j = Math.floor(y - r); j <= Math.ceil(y + r); j++)
      for (let k = Math.floor(cz - r); k <= Math.ceil(cz + r); k++) {
        const dx = i + 0.5 - (x + 0.5);
        const dy = j + 0.5 - (y + 0.5);
        const dz = k + 0.5 - cz;
        const lump = hash3(i, j, k, seed) * 0.8;
        if (dx * dx + dy * dy + dz * dz <= (r + lump - 0.2) * (r + lump - 0.2))
          s.set(i, j, k, M.leaves);
      }
}

/** A street lamp: a post and a lamp on top. */
function lamp(s, x, y, z, h = 4) {
  for (let k = 0; k < h; k++) s.set(x, y, z + k, M.post);
  s.set(x, y, z + h, M.lamp);
}

/**
 * Text in the pixel font painted on a face of the scene: `face` 'front'
 * reads along +x on a face toward +y, 'side' along -y on a face toward +x.
 * (x, y, z) is the top-left corner of the text on that face, in blocks, and
 * each dot is `dot` blocks. `at` places the rendered scene.
 */
function faceText(str, [x, y, z], face, dot, at, fill) {
  const p = (a, b, c) => [
    at.x + at.scale * 2 * (a - b),
    at.y + at.scale * (a + b - 2 * c),
  ];
  const [ox, oy] = p(x, y, z);
  const s = at.scale * dot;
  const m =
    face === 'front'
      ? [2 * s, s, 0, 2 * s, ox, oy]
      : [2 * s, -s, 0, 2 * s, ox, oy];
  return `<g transform="matrix(${m.map(n).join(' ')})">${pixelText(str, 0, 0, 1, fill)}</g>`;
}

function n(v) {
  const r = Math.round(v * 1000) / 1000;
  return Object.is(r, -0) ? '0' : String(r);
}

/** A rectangle with its corners stepped off, for a soft blocky backdrop. */
function steppedRect(x, y, w, h, step, steps, fill) {
  let d = '';
  for (let i = 0; i < steps; i++) {
    const inset = (steps - i) * step;
    d += `M${n(x + inset)} ${n(y + i * step)}h${n(w - 2 * inset)}v${n(step)}h${n(-(w - 2 * inset))}z`;
    d += `M${n(x + inset)} ${n(y + h - (i + 1) * step)}h${n(w - 2 * inset)}v${n(step)}h${n(-(w - 2 * inset))}z`;
  }
  d += `M${n(x)} ${n(y + steps * step)}h${n(w)}v${n(h - 2 * steps * step)}h${n(-w)}z`;
  return `<path fill="${fill}" d="${d}"/>`;
}

// ---------------------------------------------------------------------------
// Images

const light = { left: 0.15, right: 0.32, ao: 0.1 };

/**
 * The hero: three homes along a sidewalk, an apartment block with a
 * "For rent" sign, a narrow brick townhouse and a cottage.
 */
function heroHouse() {
  const s = new Scene({ seed: 5 });
  const W = 44;
  const D = 19;
  plinth(s, W, D, 2, (x, y) => {
    if (y >= 16) return y === 17 && x % 4 < 2 ? M.roadLine : M.road;
    if (y >= 12) return y === 15 ? M.curb : M.sidewalk;
    return M.grass;
  });
  // The apartment block: five floors, a flat roof with a navy parapet.
  building(s, 2, 3, 1, 12, 9, 16, M.white, { from: 2, every: 3 });
  s.box(2, 3, 17, 12, 9, 1, M.navy);
  s.box(3, 4, 17, 10, 7, 1, null);
  s.box(3, 4, 16, 10, 7, 1, M.white);
  // Its door.
  s.set(7, 11, 1, M.door);
  s.set(8, 11, 1, M.door);
  s.set(7, 11, 2, M.door);
  s.set(8, 11, 2, M.door);
  // The townhouse: narrow and tall, brick, with a cornice.
  building(s, 16, 4, 1, 7, 8, 14, M.brick, { from: 2, every: 4 });
  s.box(16, 4, 15, 7, 8, 1, M.navy);
  s.set(19, 11, 1, M.navy);
  s.set(19, 11, 2, M.navy);
  // A stoop in front of its door.
  s.set(19, 12, 1, M.curb);
  // The cottage: cream walls under a green pitched roof.
  building(s, 26, 4, 1, 12, 8, 6, M.cream, { from: 2, every: 9, side: false });
  gableRoof(s, 26, 4, 7, 12, 8, M.roofGreen, { gable: M.cream });
  s.set(36, 7, 4, M.glass);
  s.set(30, 11, 1, M.doorCoral);
  s.set(30, 11, 2, M.doorCoral);
  s.set(30, 11, 3, M.doorCoral);
  // A chimney.
  s.box(34, 6, 9, 2, 2, 4, M.brick);
  // Trees and bushes, and a lamp on the sidewalk.
  tree(s, 41, 7, 1, { trunk: 3, r: 2.4, seed: 3 });
  tree(s, 1, 14, 1, { trunk: 0, r: 1.2, seed: 4 });
  tree(s, 15, 13, 1, { trunk: 0, r: 1.1, seed: 6 });
  lamp(s, 24, 14, 1, 5);
  // A sign across the apartment block's front, over its first floor.
  s.box(2, 12, 5, 12, 1, 2, M.sign);

  const r = renderScene(s, { light });
  const IW = 561;
  const IH = 275;
  const at = fit(r.bounds, { width: IW, height: IH }, { pad: 4 });
  return document({
    width: IW,
    height: IH,
    label: 'A blocky street of three homes for rent',
    layers: [
      steppedRect(IW / 2 - 230, 26, 460, 230, 10, 4, '#e3f4f0'),
      place(r, at),
      faceText('FOR RENT', [2.48, 13, 6.82], 'front', 0.235, at, NAVY),
    ],
  });
}

/**
 * A riverside town by day: homes and low blocks along the far bank, an
 * arched bridge with a cyclist crossing, a boat on the river and trees along
 * the near bank.
 */
function cityDay() {
  const s = new Scene({ seed: 6 });
  const W = 50;
  const D = 26;
  const R0 = 11; // the river, from y = R0 to R1
  const R1 = 17;
  plinth(s, W, D, 3, (x, y) => {
    if (y >= R0 && y <= R1) return null;
    if (y === R0 - 1 || y === R1 + 1) return M.curb;
    if (y >= R0 - 4 && y < R0 - 1) return M.sidewalk;
    if (y > R1 + 1 && y <= R1 + 3) return M.sidewalk;
    return M.grass;
  });
  // The river, two blocks down.
  for (let x = 0; x < W; x++)
    for (let y = R0; y <= R1; y++) {
      s.set(x, y, -1, null);
      s.set(x, y, -2, M.water);
    }
  // The far bank: a row of homes and low blocks facing the river.
  const homes = [
    [1, 7, 9, M.blue, 'flat'],
    [9, 6, 6, M.cream, 'gable'],
    [16, 8, 11, M.white, 'flat'],
    [25, 6, 7, M.mint, 'gable'],
    [32, 7, 9, M.sand, 'flat'],
    [40, 8, 6, M.brick, 'gable'],
  ];
  homes.forEach(([x, w, h, wall, roof], i) => {
    const d = 5;
    const y = R0 - 4 - d;
    building(s, x, y, 1, w, d, h, wall, {
      from: 2,
      every: 3,
      side: i === homes.length - 1 || roof === 'flat',
    });
    if (roof === 'flat') s.box(x, y, h + 1, w, d, 1, M.navy);
    else
      gableRoof(s, x, y, h + 1, w, d, i % 2 ? M.roofCoral : M.roofGreen, {
        overhang: 0,
        gable: wall,
      });
    s.set(x + Math.floor(w / 2), y + d - 1, 1, i % 2 ? M.doorCoral : M.door);
    s.set(x + Math.floor(w / 2), y + d - 1, 2, i % 2 ? M.doorCoral : M.door);
  });
  // The bridge: a stone arch over the river, a plank deck and low rails.
  const BX = 21;
  const BW = 6;
  const stone = grain('rent-stone', '#d9d2c5', { spread: 0.05 });
  for (let y = R0 - 2; y <= R1 + 2; y++) {
    const t = (y + 0.5 - (R0 + R1 + 1) / 2) / ((R1 - R0 + 1) / 2);
    const open = Math.abs(t) < 1 ? Math.round(3.2 * Math.sqrt(1 - t * t)) : 0;
    for (let x = BX; x < BX + BW; x++) {
      for (let z = -2; z <= 1; z++) if (z >= -2 + open) s.set(x, y, z, stone);
      s.set(x, y, 2, M.deck);
    }
    if (y % 2 === 0 || y === R0 - 2 || y === R1 + 2) {
      s.set(BX, y, 3, stone);
      s.set(BX + BW - 1, y, 3, stone);
    }
  }
  // A cyclist on the bridge: two wheels, a frame and a rider.
  const cx = BX + 2;
  const cy = R0 + 1;
  const shirt = grain('rent-jersey', '#ffc93c', { spread: 0.05 });
  const skin = grain('rent-skin', '#b9825a', { spread: 0.04 });
  const helmet = M.doorCoral;
  for (const dy of [0, 4]) {
    s.set(cx, cy + dy, 3, M.navy);
    s.set(cx, cy + dy, 4, M.navy);
  }
  for (let dy = 1; dy <= 3; dy++) s.set(cx, cy + dy, 4, M.door);
  s.set(cx, cy + 2, 5, M.navy);
  s.set(cx, cy + 2, 6, shirt);
  s.set(cx, cy + 2, 7, shirt);
  s.set(cx, cy + 3, 6, shirt);
  s.set(cx, cy + 2, 8, skin);
  s.set(cx, cy + 2, 9, helmet);
  s.set(cx, cy + 3, 9, helmet);
  // A boat on the river.
  const bx = 33;
  const by = R0 + 2;
  s.box(bx, by, -1, 7, 3, 1, M.doorCoral);
  s.box(bx + 1, by, 0, 5, 3, 1, M.white);
  s.box(bx + 3, by + 1, 1, 2, 1, 1, M.glass);
  // Trees and lamps along the near bank.
  [3, 12, 30, 44].forEach((x, i) =>
    tree(s, x, R1 + 6, 1, { trunk: 2, r: 2, seed: 10 + i })
  );
  [8, 18, 38].forEach(x => lamp(s, x, R1 + 3, 1, 4));
  const r = renderScene(s, { light });
  const IW = 660;
  const IH = 305;
  return document({
    width: IW,
    height: IH,
    label: 'A blocky riverside town by day',
    layers: [place(r, fit(r.bounds, { width: IW, height: IH }, { pad: 4 }))],
  });
}

/**
 * Square stars, seeded, in the box but none behind the scene: a bright dot
 * behind it would show through the hairline seams between its faces.
 * `top(px)` is the highest the scene reaches at column px.
 */
function starsAbove(box, count, top, { seed = 1, size = 3, colors }) {
  const r = rng(seed);
  const d = {};
  for (let i = 0; i < count; i++) {
    const c = colors[Math.floor(r() * colors.length)];
    const sz = r() < 0.2 ? size * 2 : size;
    const x = box.x + Math.floor(r() * box.width);
    const y = box.y + Math.floor(r() * box.height);
    if (y + sz > top(x) - 6 || y + sz > top(x + sz) - 6) continue;
    d[c] = (d[c] ?? '') + `M${x} ${y}h${sz}v${sz}h${-sz}z`;
  }
  return Object.entries(d)
    .map(([c, p]) => `<path fill="${c}" d="${p}"/>`)
    .join('');
}

/** For each 4-pixel column of the picture, the highest point of a placed scene. */
function skyline(s, at) {
  const cols = new Map();
  s.each((x, y, z) => {
    for (const [a, b] of [
      [x, y],
      [x + 1, y],
      [x, y + 1],
      [x + 1, y + 1],
    ]) {
      const px = at.x + at.scale * 2 * (a - b);
      const py = at.y + at.scale * (a + b - 2 * (z + 1));
      const c = Math.floor(px / 4);
      if (!cols.has(c) || cols.get(c) > py) cols.set(c, py);
    }
  });
  return px => {
    let m = Infinity;
    for (let c = Math.floor(px / 4) - 1; c <= Math.floor(px / 4) + 1; c++)
      if (cols.has(c)) m = Math.min(m, cols.get(c));
    return m;
  };
}

/** A blocky crescent: a pixel disc with an offset disc taken out of it. */
function crescent(cx, cy, r, cell, fill, [ox, oy] = [0.45, -0.3]) {
  let d = '';
  const n = Math.ceil(r / cell);
  for (let j = -n; j < n; j++)
    for (let i = -n; i < n; i++) {
      const x = (i + 0.5) * cell;
      const y = (j + 0.5) * cell;
      const inA = x * x + y * y <= r * r;
      const bx = x - ox * r * 1.1;
      const by = y - oy * r * 1.1;
      const inB = bx * bx + by * by <= r * r * 0.8;
      if (inA && !inB)
        d += `M${n0(cx + i * cell)} ${n0(cy + j * cell)}h${cell}v${cell}h-${cell}z`;
    }
  return `<path fill="${fill}" d="${d}"/>`;
}

function n0(v) {
  return n(Math.round(v * 100) / 100);
}

/**
 * A street of five row houses in the evening, under a crescent moon: some
 * rooms lit, a "For rent" banner on one, two street trees and lamps.
 */
function cityNight() {
  const s = new Scene({ seed: 7 });
  const night = {
    plinth: grain('rent-n-plinth', '#58637c', { spread: 0.04 }),
    plinthDk: grain('rent-n-plinth-dk', '#465068', { spread: 0.04 }),
    walk: grain('rent-n-walk', '#7d889c', { spread: 0.04, side: '#58637c' }),
    road: grain('rent-n-road', '#363e52', { spread: 0.05, side: '#58637c' }),
    line: grain('rent-n-line', '#c9c4a8', { spread: 0.03 }),
    cornice: grain('rent-n-cornice', '#232c44', { spread: 0.05 }),
    step: grain('rent-n-step', '#8a93a6', { spread: 0.04 }),
    leaves: material({
      id: 'rent-n-leaves',
      color: leavesTexture('rent-n-leaves', '#2f6f5a', { seed: 12 }),
    }),
    banner: grain('rent-n-banner', '#f7f3ea', { spread: 0.02 }),
  };
  const walls = [
    grain('rent-n-blue', '#4d6e94', { spread: 0.04 }),
    grain('rent-n-plum', '#8c4f62', { spread: 0.04 }),
    grain('rent-n-green', '#4b8570', { spread: 0.04 }),
    grain('rent-n-violet', '#6c5b93', { spread: 0.04 }),
    grain('rent-n-slate', '#3f6a8a', { spread: 0.04 }),
  ];
  const W = 46;
  const D = 15;
  for (let x = 0; x < W; x++)
    for (let y = 0; y < D; y++) {
      for (let z = -2; z < 0; z++)
        s.set(x, y, z, z === -2 ? night.plinthDk : night.plinth);
      s.set(
        x,
        y,
        0,
        y >= 11
          ? y === 12 && x % 4 < 2
            ? night.line
            : night.road
          : y >= 8
            ? night.walk
            : night.plinth
      );
    }
  // Five houses side by side, their fronts on the sidewalk.
  const homes = [
    [1, 9, 11],
    [10, 8, 14],
    [18, 9, 12],
    [27, 9, 15],
    [36, 9, 12],
  ];
  homes.forEach(([x, w, h], i) => {
    const y = 2;
    const d = 6;
    s.box(x, y, 1, w, d, h, walls[i]);
    s.box(x, y, h + 1, w, d, 1, night.cornice);
    // Windows two blocks wide in rows of floors, some lit.
    for (let f = 0; f * 4 + 5 < h; f++) {
      const k = f * 4 + 5;
      for (const wx of [x + 1, x + w - 3]) {
        const on = hash3(wx, f, i, 9) < 0.55;
        const m = on ? M.lit : M.dark;
        for (const dx of [0, 1])
          for (const dk of [0, 1]) s.set(wx + dx, y + d - 1, k + dk, m);
      }
    }
    // A door with a lit fanlight, and a step.
    const dx = x + Math.floor(w / 2);
    s.set(dx, y + d - 1, 1, night.cornice);
    s.set(dx, y + d - 1, 2, night.cornice);
    s.set(dx, y + d - 1, 3, M.lit);
    s.set(dx, y + d, 1, night.step);
    // The last house's side windows.
    if (i === homes.length - 1)
      for (let f = 0; f * 4 + 5 < h; f++)
        for (const j of [y + 1, y + 3])
          for (const dk of [0, 1])
            s.set(x + w - 1, j, f * 4 + 5 + dk, f % 2 ? M.lit : M.dark);
  });
  // The banner across the fourth house, between its windows.
  const [bx, bw] = [homes[3][0] + 1, homes[3][1] - 2];
  s.box(bx, 8, 7, bw, 1, 6, night.banner);
  // Two street trees and three lamps along the sidewalk.
  [9, 26].forEach((x, i) =>
    tree(s, Math.floor(x), 10, 1, { trunk: 3, r: 2.2, seed: 20 + i })
  );
  s.each((x, y, z, m) => {
    if (m === M.leaves) s.set(x, y, z, night.leaves);
  });
  const lamps = [3, 18, 44];
  lamps.forEach(x => lamp(s, x, 10, 1, 5));

  const r = renderScene(s, {
    light: { ...light, color: '#0b1020', shadow: 0.3 },
  });
  const IW = 660;
  const IH = 309;
  const at = fit(
    r.bounds,
    { x: 70, y: 40, width: 520, height: 266 },
    { align: [0.5, 1] }
  );
  const sky = bandedSky(
    IW,
    IH,
    [
      [0, '#1a2340'],
      [1, '#3a4a78'],
    ],
    7
  );
  // Pools of lamplight on the sidewalk.
  const p = (a, b, c) => [
    at.x + at.scale * 2 * (a - b),
    at.y + at.scale * (a + b - 2 * c),
  ];
  const cell = (a, b) =>
    'M' +
    [p(a, b, 1), p(a + 1, b, 1), p(a + 1, b + 1, 1), p(a, b + 1, 1)]
      .map(([x, y]) => `${n0(x)} ${n0(y)}`)
      .join('L') +
    'z';
  let pool = '';
  for (const x of lamps) {
    for (let i = -2; i <= 2; i++)
      for (let j = -2; j <= 1; j++)
        if (
          Math.abs(i) + Math.abs(j) <= 2 &&
          !(i === 0 && j === 0) &&
          10 + j >= 8
        )
          pool += cell(x + i, 10 + j);
  }
  return document({
    width: IW,
    height: IH,
    label: 'A blocky street of row houses at night',
    defs: [
      `<clipPath id="rent-night-panel">${steppedRect(0, 0, IW, IH, 6, 4, '#000')}</clipPath>`,
    ],
    layers: [
      `<g clip-path="url(#rent-night-panel)">${sky}`,
      starsAbove(
        { x: 10, y: 10, width: IW - 20, height: 190 },
        60,
        skyline(s, at),
        {
          seed: 5,
          size: 3,
          colors: ['#ffffff', '#cfdcff', '#ffe9b0'],
        }
      ),
      crescent(548, 62, 34, 6, '#ffe39a'),
      place(r, at),
      `<path fill="#ffd36b" fill-opacity="0.2" d="${pool}"/>`,
      faceText(
        'FOR',
        [bx + (bw - 17 * 0.28) / 2, 9, 12.55],
        'front',
        0.28,
        at,
        '#d9534f'
      ),
      faceText(
        'RENT',
        [bx + (bw - 23 * 0.28) / 2, 9, 9.95],
        'front',
        0.28,
        at,
        '#d9534f'
      ),
      '</g>',
    ],
  });
}

/**
 * The stand-in for every listing's photo: a calm grey field of large
 * blocks, a small grey house on a plinth and its size in pixel letters.
 */
function listingPlaceholder() {
  const IW = 640;
  const IH = 360;
  const cell = 40;
  const random = rng(3);
  const greys = ['#e4e7eb', '#e1e5e9', '#e7eaed'];
  const byColor = {};
  for (let y = 0; y < IH; y += cell)
    for (let x = 0; x < IW; x += cell) {
      const c = greys[Math.floor(random() * greys.length)];
      byColor[c] = (byColor[c] ?? '') + `M${x} ${y}h${cell}v${cell}h-${cell}z`;
    }
  const field = Object.entries(byColor)
    .map(([c, d]) => `<path fill="${c}" d="${d}"/>`)
    .join('');

  const s = new Scene({ seed: 8 });
  const g = (id, hex) => grain(`rent-ph-${id}`, hex, { spread: 0.03 });
  const base = g('base', '#c9ced5');
  const wall = g('wall', '#f2f4f6');
  const roof = g('roof', '#a9b1bb');
  const door = g('door', '#b8bfc8');
  const win = g('win', '#cfd5dc');
  s.box(0, 0, 0, 12, 12, 1, base);
  building(s, 2, 2, 1, 8, 7, 5, wall, {
    glass: () => win,
    from: 2,
    every: 9,
  });
  gableRoof(s, 2, 2, 6, 8, 7, roof, { gable: wall });
  s.set(6, 8, 1, door);
  s.set(6, 8, 2, door);
  const r = renderScene(s, {
    light: { color: '#4a5566', left: 0.1, right: 0.22, ao: 0.08, shadow: 0.16 },
  });
  const at = fit(r.bounds, { x: 245, y: 70, width: 150, height: 150 });
  const label = '640 x 360';
  const px = 5;
  return document({
    width: IW,
    height: IH,
    label: 'A grey placeholder with a blocky house, 640 by 360',
    layers: [
      field,
      place(r, at),
      pixelText(label, (IW - textWidth(label, px)) / 2, 252, px, '#9aa3ae'),
    ],
  });
}

/**
 * Market insight: a bar chart rising to the right, and a magnifying glass
 * held over a small house in front of it.
 */
function rentalHouse() {
  const s = new Scene({ seed: 9 });
  const bar = [
    grain('rent-bar-1', '#9ee6d8', { spread: 0.04 }),
    grain('rent-bar-2', '#5fd6c0', { spread: 0.04 }),
    grain('rent-bar-3', '#22c4a8', { spread: 0.04 }),
    grain('rent-bar-4', '#00a88f', { spread: 0.04 }),
  ];
  s.box(0, -1, -1, 14, 16, 1, M.plinth);
  // Four bars along -y, so they step up toward the picture's right.
  [4, 6, 9, 12].forEach((h, i) => s.box(9, 9 - 3 * i, 0, 2, 2, h, bar[i]));
  // A small house at the front left.
  building(s, 0, 8, 0, 6, 6, 4, M.cream, { from: 1, every: 9, side: false });
  gableRoof(s, 0, 8, 4, 6, 6, M.roofCoral, { overhang: 0, gable: M.cream });
  s.set(3, 13, 0, M.door);
  s.set(3, 13, 1, M.door);
  s.set(1, 13, 2, M.glass);
  s.set(5, 10, 2, M.glass);
  // The magnifying glass: a navy ring standing in front of the house, its
  // handle running down to the right.
  const ring = M.navy;
  const cx = 7.5;
  const cz = 8;
  const gy = 15;
  for (let i = 2; i <= 15; i++)
    for (let k = 1; k <= 14; k++) {
      const dx = i + 0.5 - cx;
      const dz = k + 0.5 - cz;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d <= 4.6 && d >= 3.5) s.set(i, gy, k, ring);
    }
  for (let t = 0; t < 3; t++)
    for (const w of [0, 1])
      s.set(Math.floor(cx + 3.2 + t) + w, gy, Math.floor(cz - 3.2 - t), M.post);
  const r = renderScene(s, { light });
  const IW = 200;
  const IH = 142;
  const at = fit(r.bounds, { width: IW, height: IH }, { pad: 3 });
  // The lens: a pale tint over what shows through the ring.
  const p = (a, b, c) => [
    at.x + at.scale * 2 * (a - b),
    at.y + at.scale * (a + b - 2 * c),
  ];
  let lens = '';
  for (let i = 2; i <= 15; i++)
    for (let k = 1; k <= 14; k++) {
      const dx = i + 0.5 - cx;
      const dz = k + 0.5 - cz;
      if (Math.sqrt(dx * dx + dz * dz) >= 3.5) continue;
      const q = [
        p(i, gy + 1, k + 1),
        p(i + 1, gy + 1, k + 1),
        p(i + 1, gy + 1, k),
        p(i, gy + 1, k),
      ];
      lens += `M${q.map(([x, y]) => `${n0(x)} ${n0(y)}`).join('L')}z`;
    }
  return document({
    width: IW,
    height: IH,
    label: 'A blocky rising bar chart and a magnifying glass over a house',
    layers: [
      place(r, at),
      `<path fill="#bfe8f5" fill-opacity="0.3" d="${lens}"/>`,
    ],
  });
}

export default [
  {
    path: 'public/media/hero-house.svg',
    depicts:
      'A blocky street of three homes on a sidewalk: a white apartment block with a "For rent" sign, a narrow brick townhouse and a cream cottage with a green roof, with trees and a street lamp.',
    draw: heroHouse,
  },
  {
    path: 'public/media/city-day.svg',
    depicts:
      'A blocky riverside town by day: homes and low blocks along the far bank, an arched bridge with a cyclist crossing, a boat on the river and trees along the near bank.',
    draw: cityDay,
  },
  {
    path: 'public/media/city-night.svg',
    depicts:
      'A blocky street of five row houses in the evening under a blocky crescent moon and stars, some windows lit, a "For rent" banner on one house, two street trees and lamps.',
    draw: cityNight,
  },
  {
    path: 'public/media/listing-placeholder.svg',
    depicts:
      'A calm grey placeholder of large blocks with a small grey blocky house and the label "640 x 360" in pixel letters, standing in for a listing\'s photo.',
    draw: listingPlaceholder,
  },
  {
    path: 'public/media/rental-house.svg',
    depicts:
      'A blocky bar chart rising to the right in shades of teal, with a navy magnifying glass held over a small house in front of it.',
    draw: rentalHouse,
  },
];
