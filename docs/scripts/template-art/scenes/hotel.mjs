/**
 * Hotel: the welcome hero, the four rooms, the reception and the gallery.
 *
 * The interiors are cutaway rooms: a floor and the two back walls, with the
 * furniture built in blocks inside. x runs down to the right, y down to the
 * left and z up, so the wall on the plane x = 0 is the back-left one on
 * screen and the wall on y = 0 the back-right one.
 */
import {
  Scene,
  document,
  fit,
  material,
  place,
  renderScene,
  shade,
  texture,
} from '../voxel.mjs';
import { bandedSky, cloud, rect, sprite, squareSun } from '../backdrop.mjs';
import {
  glassTexture,
  grain,
  planksTexture,
  streaksTexture,
  tilesTexture,
  waterTexture,
} from '../blocks.mjs';
import { palm } from '../props.mjs';

/** A grained block, its texture named for this template. */
const g = (name, hex, opts) => grain(`hotel-${name}`, hex, opts);

/** A grained texture, for a material whose faces differ. */
const gt = (name, hex, opts) => g(name, hex, opts).left;

/** A material of one texture on every face. */
const all = (tex, flat = false) => material({ id: tex.id, color: tex, flat });

/** Fabric hanging in folds: curtains and drapes. */
const folds = (name, hex) =>
  all(streaksTexture(`hotel-${name}`, hex, { seed: 5 }));

/** The two walls' materials for a paint: the cut faces take `cut`. */
function walls(paint, cut) {
  return {
    left: material({ top: cut, left: cut, right: paint }),
    right: material({ top: cut, right: cut, left: paint }),
  };
}

/**
 * A cutaway room: the floor on z = 0 inside the walls, the back-left wall on
 * x = 0 and the back-right wall on y = 0, both up to z = H. `band(z)` picks
 * the walls' paint for a row, so a room can have a dado or a frieze.
 */
function cutaway(s, { W, D, H, floor, band }) {
  s.box(1, 1, 0, W - 1, D - 1, 1, floor);
  for (let z = 0; z <= H; z++) {
    const pair = band(z);
    for (let y = 0; y < D; y++) s.set(0, y, z, pair.left);
    for (let x = 1; x < W; x++) s.set(x, 0, z, pair.right);
  }
}

/**
 * Paint a grid of cells into a wall, from `a0` along it and `z0` up, `w` by
 * `h`: `paint(i, k)` names each cell's block (a `g()` material), i across
 * and k up, or null to leave the wall. `wall` is 'left' (x = 0, `a` along y)
 * or 'right' (y = 0, `a` along x). A painted cell keeps the wall's cut on
 * its top and end, so a picture can reach the top row.
 */
function paintWall(s, t, wall, a0, z0, w, h, paint) {
  for (let i = 0; i < w; i++)
    for (let k = 0; k < h; k++) {
      const m = paint(i, k);
      if (!m) continue;
      const key = `${m.id}:${wall}`;
      if (!t.painted.has(key))
        t.painted.set(
          key,
          wall === 'left'
            ? material({
                top: t.cut,
                left: t.cut,
                right: m.right,
                flat: m.flat,
              })
            : material({ top: t.cut, right: t.cut, left: m.left, flat: m.flat })
        );
      const mat = t.painted.get(key);
      if (wall === 'left') s.set(0, a0 + i, z0 + k, mat);
      else s.set(a0 + i, 0, z0 + k, mat);
    }
}

/** A frame `w` by `h` in a wall, with `inner(i, k)` painting inside it. */
function framed(s, t, wall, a0, z0, w, h, frame, inner) {
  paintWall(s, t, wall, a0, z0, w, h, (i, k) =>
    i === 0 || k === 0 || i === w - 1 || k === h - 1
      ? frame
      : inner(i - 1, k - 1)
  );
}

/**
 * Map a room's local axes to the world: `a` along the wall and `b` out from
 * it into the room, so one piece of furniture can stand against either wall.
 */
function against(wall) {
  return wall === 'left' ? (a, b) => [1 + b, a] : (a, b) => [a, 1 + b];
}

/** A box in a wall's local axes. */
function lbox(s, wall, a, b, z, w, d, h, mat) {
  const P = against(wall);
  for (let i = 0; i < w; i++)
    for (let j = 0; j < d; j++)
      for (let k = 0; k < h; k++) {
        const [x, y] = P(a + i, b + j);
        s.set(x, y, z + k, mat);
      }
}

/**
 * A bed with its head against `wall`, `w` wide from `a` along the wall and
 * `len` long into the room. `pillows` lists the columns that get one.
 */
function bed(s, wall, a, w, len, m, { headH = 3, pillows } = {}) {
  lbox(s, wall, a, 0, 1, w, 1, headH, m.head);
  lbox(s, wall, a, 1, 1, w, len, 1, m.frame);
  for (let i = 0; i < w; i++) {
    const p = !pillows || pillows.includes(i);
    lbox(s, wall, a + i, 1, 2, 1, 1, 1, p ? m.pillow : m.sheet);
  }
  lbox(s, wall, a, 2, 2, w, 1, 1, m.sheet);
  lbox(s, wall, a, 3, 2, w, len - 2, 1, m.blanket);
}

/** A nightstand with a lamp on it, against `wall` at `a`. */
function nightstand(s, wall, a, { wood, drawer, base, lamp }) {
  lbox(s, wall, a, 0, 1, 1, 1, 1, wood);
  lbox(s, wall, a, 0, 2, 1, 1, 1, drawer);
  lbox(s, wall, a, 0, 3, 1, 1, 1, base);
  lbox(s, wall, a, 0, 4, 1, 1, 1, lamp);
}

/** A rug: the floor's top in `border` and `field` over a rectangle. */
function rug(s, x0, y0, w, d, border, field, floorSide) {
  const b = material({ top: border, side: floorSide });
  const f = material({ top: field, side: floorSide });
  for (let x = x0; x < x0 + w; x++)
    for (let y = y0; y < y0 + d; y++) {
      const edge = x === x0 || y === y0 || x === x0 + w - 1 || y === y0 + d - 1;
      s.set(x, y, 0, edge ? b : f);
    }
}

/**
 * A rug with a diamond in its middle: `border` round the edge, `field`, and
 * `inlay` where the cell is within `r` steps of the centre.
 */
function diamondRug(s, x0, y0, w, d, r, { border, field, inlay }, floorSide) {
  const mats = [border, field, inlay].map(top =>
    material({ top, side: floorSide })
  );
  const cx = x0 + (w - 1) / 2;
  const cy = y0 + (d - 1) / 2;
  for (let x = x0; x < x0 + w; x++)
    for (let y = y0; y < y0 + d; y++) {
      const edge = x === x0 || y === y0 || x === x0 + w - 1 || y === y0 + d - 1;
      const inside = Math.abs(x - cx) + Math.abs(y - cy) <= r;
      s.set(x, y, 0, mats[edge ? 0 : inside ? 2 : 1]);
    }
}

/** White balusters and a rail in front of `back`, for a balcony's edge. */
function railTexture(id, back, white) {
  return texture(id, 8, (u, v, r) => {
    if (v <= 1 || u === 1 || u === 5) return white;
    return r() < 0.25 ? shade(back, 0.1) : back;
  });
}

/**
 * A potted plant at (x, y): a pot two high, a stem, and leaves in clumps up
 * to `top`.
 */
function plant(s, x, y, top, { pot, stem, leaf, leafDk }) {
  s.box(x, y, 1, 1, 1, 2, pot);
  for (let z = 3; z < top - 1; z++) s.set(x, y, z, stem);
  const clumps = [
    [0, 0, top - 1, leaf],
    [0, 0, top, leaf],
    [-1, 0, top - 1, leafDk],
    [1, 0, top - 2, leaf],
    [0, 1, top - 2, leafDk],
    [0, -1, top - 1, leaf],
    [1, 0, top - 4, leafDk],
    [0, 1, top - 4, leaf],
    [-1, 0, top - 3, leaf],
    [0, 1, top - 1, leaf],
  ];
  for (const [i, j, z, m] of clumps) if (z > 2) s.set(x + i, y + j, z, m);
}

/**
 * A suitcase standing two blocks wide along x and two high, at (x, y): its
 * sides piped in `trim`, and a handle across the top of the pair.
 */
function suitcase(s, x, y, body, trim) {
  const dk = shade(body, -0.18);
  const side = texture(
    `hotel-case-${body.slice(1)}`,
    8,
    (u, v, r) => {
      if (v === 0 || v === 7) return trim;
      if (v === 3 && (u === 2 || u === 5)) return trim;
      return r() < 0.3 ? dk : body;
    },
    7
  );
  // The handle is a bar across the seam between the two tops.
  const handle = (id, second) =>
    texture(`hotel-case-${body.slice(1)}-${id}`, 8, (u, v, r) => {
      if (v === 0 || v === 7 || u === (second ? 7 : 0)) return trim;
      if ((second ? u <= 3 : u >= 4) && (v === 3 || v === 4)) return '#3a2a1e';
      return r() < 0.3 ? dk : body;
    });
  s.box(x, y, 1, 2, 1, 1, all(side));
  s.set(x, y, 2, material({ top: handle('a', false), side }));
  s.set(x + 1, y, 2, material({ top: handle('b', true), side }));
}

/** Buttoned upholstery, for a tufted headboard. */
function tuftTexture(id, base) {
  const dk = shade(base, -0.28);
  const lt = shade(base, 0.12);
  return texture(
    id,
    8,
    (u, v, r) => {
      if ((u === 1 && v === 1) || (u === 5 && v === 5)) return dk;
      if ((u === 2 && v === 2) || (u === 6 && v === 6)) return lt;
      return r() < 0.25 ? shade(base, -0.06) : base;
    },
    9
  );
}

/** A building's face with lit windows, for a skyline seen through glass. */
function towerTexture(id, wall, lit, seed) {
  return texture(
    id,
    8,
    (u, v, r) => {
      if (u % 3 === 1 && v % 3 === 1) return r() < 0.6 ? lit : shade(wall, 0.1);
      return wall;
    },
    seed
  );
}

const ROOM = { W: 13, D: 13, H: 8 };

/** The two palettes of room: gold and diamond. */
function theme(kind) {
  if (kind === 'gold') {
    const cut = gt('gold-cut', '#7a4f2a');
    return {
      cut,
      plaster: walls(gt('gold-plaster', '#f3e2bd', { spread: 0.035 }), cut),
      dado: walls(gt('gold-dado', '#c98f3a', { spread: 0.05 }), cut),
      trim: walls(gt('gold-trim', '#9b6a2c'), cut),
      floorSide: gt('gold-base', '#6e4a2a'),
      floorTop: planksTexture('hotel-gold-floor', '#b9824a', { seed: 41 }),
      wood: g('gold-wood', '#7b4b26'),
      drawer: g('gold-drawer', '#94602f'),
      lampBase: g('gold-lamp-base', '#5a3a1e'),
      lamp: g('gold-lamp', '#ffe7a0', { flat: true, spread: 0.03 }),
      frame: g('gold-frame', '#fbf1dc', { spread: 0.03 }),
      gilt: g('gold-gilt', '#e2b04a'),
      back: [
        [0, '#fbefd2'],
        [1, '#efd29a'],
      ],
      light: { color: '#2a1a10' },
      painted: new Map(),
    };
  }
  const cut = gt('blue-cut', '#22305a');
  return {
    cut,
    plaster: walls(gt('blue-plaster', '#dbe9f4', { spread: 0.035 }), cut),
    dado: walls(gt('blue-dado', '#3d5a96', { spread: 0.05 }), cut),
    trim: walls(gt('blue-trim', '#2a3c6c'), cut),
    floorSide: gt('blue-base', '#2b3550'),
    floorTop: gt('blue-carpet', '#9fb3c9', { spread: 0.05 }),
    wood: g('blue-wood', '#2e3a5e'),
    drawer: g('blue-drawer', '#43568a'),
    lampBase: g('blue-lamp-base', '#c9d3de'),
    lamp: g('blue-lamp', '#f2f8ff', { flat: true, spread: 0.03 }),
    frame: g('blue-frame', '#f4f8fb', { spread: 0.03 }),
    gilt: g('blue-gilt', '#d2a845'),
    back: [
      [0, '#eaf3fa'],
      [1, '#bcd3e8'],
    ],
    light: { color: '#101a30' },
    painted: new Map(),
  };
}

/** A room's shell in a theme: the floor, and the walls in their bands. */
function roomShell(s, t) {
  const { W, D, H } = ROOM;
  cutaway(s, {
    W,
    D,
    H,
    floor: material({ top: t.floorTop, side: t.floorSide }),
    band: z =>
      z === 0 ? t.trim : z <= 2 ? t.dado : z === 3 ? t.trim : t.plaster,
  });
}

function roomGoldSingle() {
  const s = new Scene({ seed: 11 });
  const t = theme('gold');
  roomShell(s, t);

  // A window on the back-left wall with the sun going down in it.
  const sky = [
    g('sunset-1', '#ffd27a', { flat: true, spread: 0.04 }),
    g('sunset-2', '#ffa36a', { flat: true, spread: 0.04 }),
    g('sunset-3', '#e8708a', { flat: true, spread: 0.04 }),
    g('sunset-4', '#9a5a9a', { flat: true, spread: 0.04 }),
  ];
  const sun = g('sunset-sun', '#fff2c2', { flat: true, spread: 0.02 });
  framed(s, t, 'left', 5, 3, 6, 5, t.frame, (i, k) =>
    i === 2 && k === 0 ? sun : sky[k]
  );
  // Curtains either side of it, and the rail they hang from.
  const curtain = folds('gold-curtain', '#d99a2e');
  paintWall(s, t, 'left', 4, 1, 8, 8, (i, k) =>
    k === 7 ? t.gilt : i === 0 || i === 7 ? curtain : null
  );
  // A small print on the back-right wall.
  framed(s, t, 'right', 2, 4, 4, 4, t.gilt, (i, k) =>
    k === 1
      ? g(`print-sky-${i}`, i ? '#ffe6a6' : '#9ccbe0')
      : g(`print-hill-${i}`, i ? '#5f9a52' : '#7fb36a')
  );

  // The bed against the back-right wall, with a nightstand and its lamp.
  bed(s, 'right', 6, 3, 6, {
    head: g('gold-head', '#d99a2e'),
    frame: t.wood,
    pillow: g('gold-pillow', '#ffffff', { spread: 0.03 }),
    sheet: g('gold-sheet', '#f3e4c4', { spread: 0.03 }),
    blanket: g('gold-blanket', '#e9b43c'),
  });
  nightstand(s, 'right', 10, {
    wood: t.wood,
    drawer: t.drawer,
    base: t.lampBase,
    lamp: t.lamp,
  });

  // An armchair by the window, facing into the room.
  const chair = g('gold-chair', '#efb52e');
  lbox(s, 'left', 6, 0, 1, 3, 2, 1, chair);
  lbox(s, 'left', 6, 0, 2, 3, 1, 2, chair);
  lbox(s, 'left', 6, 1, 2, 1, 1, 1, chair);
  lbox(s, 'left', 8, 1, 2, 1, 1, 1, chair);

  // A rug, and a suitcase standing by the foot of the bed.
  rug(
    s,
    3,
    5,
    3,
    5,
    gt('gold-rug-edge', '#a8442c'),
    gt('gold-rug', '#d86a3c'),
    t.floorSide
  );
  suitcase(s, 10, 9, '#2f8f86', '#e2b04a');
  return s;
}

function roomGoldDouble() {
  const s = new Scene({ seed: 12 });
  const t = theme('gold');
  roomShell(s, t);

  // A tall window on the back-left wall, a clear sky in it, between drapes
  // under a gilt pelmet.
  const gilt = t.gilt;
  const sky = g('noon-sky', '#a9d8f0', { flat: true, spread: 0.03 });
  const skyHi = g('noon-sky-hi', '#86c2e8', { flat: true, spread: 0.03 });
  const puff = g('noon-cloud', '#ffffff', { flat: true, spread: 0.02 });
  framed(s, t, 'left', 5, 2, 6, 6, t.frame, (i, k) =>
    (k === 2 && i >= 1) || (k === 3 && i === 2) ? puff : k === 3 ? skyHi : sky
  );
  const drape = folds('gold-drape', '#b8662a');
  paintWall(s, t, 'left', 3, 1, 10, 8, (i, k) =>
    k === 7 ? gilt : i <= 1 || i >= 8 ? drape : null
  );

  // The bed with a tufted headboard, a lamp either side and a print above.
  bed(
    s,
    'right',
    4,
    5,
    6,
    {
      head: all(tuftTexture('hotel-gold-tuft', '#e0a83a')),
      frame: t.wood,
      pillow: g('gold-pillow', '#ffffff', { spread: 0.03 }),
      sheet: g('gold-sheet', '#f3e4c4', { spread: 0.03 }),
      blanket: g('gold-blanket-2', '#d9952c'),
    },
    { headH: 4, pillows: [0, 1, 3, 4] }
  );
  for (const a of [2, 10])
    nightstand(s, 'right', a, {
      wood: t.wood,
      drawer: t.drawer,
      base: t.lampBase,
      lamp: t.lamp,
    });
  const art = [
    ['#f7d88c', '#f08a3c', '#f7d88c'],
    ['#6f9a4c', '#55803a', '#6f9a4c'],
  ];
  framed(s, t, 'right', 4, 5, 5, 4, gilt, (i, k) =>
    g(`print-${k}-${i}`, art[1 - k][i])
  );

  // A bench at the foot of the bed, on a rug.
  rug(
    s,
    3,
    6,
    7,
    6,
    gt('gold-rug-edge', '#a8442c'),
    gt('gold-rug', '#d86a3c'),
    t.floorSide
  );
  const bench = material({
    top: gt('gold-bench', '#e9b43c'),
    side: gt('gold-wood', '#7b4b26'),
  });
  s.box(4, 9, 1, 5, 1, 1, bench);
  return s;
}

function roomDiamondSingle() {
  const s = new Scene({ seed: 13 });
  const t = theme('diamond');
  roomShell(s, t);

  // A window on the back-right wall, on a city skyline at dusk.
  const flat = { flat: true, spread: 0.03 };
  const dusk = [
    g('dusk-1', '#f0a8a0', flat),
    g('dusk-2', '#8a7cc0', flat),
    g('dusk-3', '#3f4f90', flat),
  ];
  const towers = [
    all(towerTexture('hotel-tower-1', '#1e2a4c', '#ffd77a', 3), true),
    all(towerTexture('hotel-tower-2', '#2a3a66', '#ffeaa8', 4), true),
  ];
  const moon = g('moon', '#fff6d8', { flat: true, spread: 0.02 });
  const heights = [2, 1, 3, 2, 1];
  framed(s, t, 'right', 2, 3, 7, 5, t.frame, (i, k) =>
    k < heights[i] ? towers[i % 2] : i === 4 && k === 2 ? moon : dusk[k]
  );

  // A writing desk under it, a lamp on it, and its chair.
  const deskTop = g('blue-desk', '#eef2f6', { spread: 0.03 });
  s.box(3, 1, 2, 5, 1, 1, deskTop);
  s.set(3, 1, 1, t.wood);
  s.set(7, 1, 1, t.wood);
  s.box(5, 1, 1, 2, 1, 1, t.drawer);
  s.set(7, 1, 3, t.lamp);
  const seat = g('blue-seat', '#6f93d6');
  s.set(5, 2, 1, seat);
  s.box(5, 3, 1, 1, 1, 2, seat);

  // The bed against the back-left wall.
  bed(s, 'left', 6, 3, 6, {
    head: g('blue-head', '#22305a'),
    frame: t.wood,
    pillow: g('blue-pillow', '#ffffff', { spread: 0.03 }),
    sheet: g('blue-sheet', '#e6eef6', { spread: 0.03 }),
    blanket: g('blue-blanket', '#4f78c8'),
  });
  nightstand(s, 'left', 10, {
    wood: t.wood,
    drawer: t.drawer,
    base: t.lampBase,
    lamp: t.lamp,
  });
  // A round mirror over the bed, wider than it is tall, in a brass ring.
  const glass = g('mirror', '#c9dcec', { flat: true, spread: 0.03 });
  const shine = g('mirror-shine', '#f2f9fe', { flat: true, spread: 0.02 });
  const span = [
    [2, 5],
    [1, 6],
    [0, 7],
    [0, 7],
    [1, 6],
    [2, 5],
  ];
  const inDisc = (i, k) =>
    k >= 0 && k < span.length && i >= span[k][0] && i <= span[k][1];
  paintWall(s, t, 'left', 3, 3, 8, 6, (i, k) => {
    if (!inDisc(i, k)) return null;
    let rim = false;
    for (let di = -1; di <= 1; di++)
      for (let dk = -1; dk <= 1; dk++) if (!inDisc(i + di, k + dk)) rim = true;
    if (rim) return t.gilt;
    return (i === 3 && k === 3) || (i === 4 && k === 4) || (i === 2 && k === 2)
      ? shine
      : glass;
  });

  diamondRug(
    s,
    8,
    3,
    5,
    5,
    1,
    {
      border: gt('blue-rug-edge-lt', '#5b7fc0'),
      field: gt('blue-rug', '#e3ebf3', { spread: 0.03 }),
      inlay: gt('blue-rug-inlay', '#22305a'),
    },
    t.floorSide
  );
  return s;
}

function roomDiamondDouble() {
  const s = new Scene({ seed: 14 });
  const t = theme('diamond');
  roomShell(s, t);

  // Glass doors on the back-right wall, onto a balcony over the sea.
  const flat = { flat: true, spread: 0.03 };
  const sky = g('sea-sky', '#bfe6f7', flat);
  const puff = g('sea-cloud', '#ffffff', { flat: true, spread: 0.02 });
  const sea = g('sea-deep', '#2f7fc4', flat);
  const seaHi = g('sea-hi', '#5aaee4', flat);
  const rail = all(railTexture('hotel-rail', '#2f7fc4', '#f4f8fb'), true);
  paintWall(s, t, 'right', 3, 1, 7, 7, (i, k) => {
    if (i === 0 || i === 3 || i === 6 || k === 6) return t.frame;
    if (k === 0) return rail;
    if (k === 1) return sea;
    if (k === 2) return seaHi;
    if (k === 4 && i !== 5) return puff;
    return sky;
  });

  // A tall plant in the corner by the doors.
  plant(s, 11, 2, 7, {
    pot: g('blue-pot', '#f2f5f8', { spread: 0.03 }),
    stem: g('plant-stem', '#5a4630'),
    leaf: g('plant-leaf', '#3f9a52'),
    leafDk: g('plant-leaf-dk', '#2c7a40'),
  });

  // The wide bed with a navy headboard, between two lamps.
  bed(
    s,
    'left',
    4,
    5,
    6,
    {
      head: all(tuftTexture('hotel-blue-tuft', '#2a3a6a')),
      frame: t.wood,
      pillow: g('blue-pillow', '#ffffff', { spread: 0.03 }),
      sheet: g('blue-sheet', '#e6eef6', { spread: 0.03 }),
      blanket: g('blue-blanket-2', '#7fa6dc'),
    },
    { headH: 4, pillows: [0, 1, 3, 4] }
  );
  for (const a of [2, 10])
    nightstand(s, 'left', a, {
      wood: t.wood,
      drawer: t.drawer,
      base: t.lampBase,
      lamp: t.lamp,
    });

  rug(
    s,
    2,
    3,
    8,
    8,
    gt('blue-rug-edge', '#22305a'),
    gt('blue-rug', '#e3ebf3', { spread: 0.03 }),
    t.floorSide
  );
  return s;
}

function roomImage(scene, t, label) {
  const r = renderScene(scene, { light: t.light });
  const at = fit(
    r.bounds,
    { width: 500, height: 333 },
    { mode: 'cover', align: [0.5, 0.3] }
  );
  return document({
    width: 500,
    height: 333,
    label,
    layers: [bandedSky(500, 333, t.back, 6), place(r, at)],
  });
}

// ---------------------------------------------------------------------------
// Outdoors

/**
 * A placement that puts the world point `w` at the image point `p`, with
 * `scale` pixels to a lattice unit.
 */
function anchor(scale, [wx, wy, wz], [px, py]) {
  return {
    scale,
    x: px - scale * 2 * (wx - wy),
    y: py - scale * (wx + wy - 2 * wz),
  };
}

/** Where a world point lands in the image, for a scene placed at `at`. */
function screen(at, x, y, z) {
  return [at.x + at.scale * 2 * (x - y), at.y + at.scale * (x + y - 2 * z)];
}

/**
 * A parasol: a pole `h` high from the ground at `z`, under a square canopy
 * with a scalloped rim in `a` and `b`.
 */
function parasol(s, x, y, z, { pole, a, b, h = 4 }) {
  for (let k = 0; k < h; k++) s.set(x, y, z + k, pole);
  const top = z + h;
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++) s.set(x + i, y + j, top, (i + j) % 2 ? b : a);
  s.set(x, y, top + 1, a);
}

/** A lounger `len` long, its back raised at the start: along x or y. */
function lounger(s, x, y, z, frame, pad, { len = 3, along = 'y' } = {}) {
  const m = material({ top: pad, side: frame });
  for (let j = 0; j < len; j++)
    s.set(x + (along === 'x' ? j : 0), y + (along === 'y' ? j : 0), z, m);
  s.set(x, y, z + 1, m);
}

function galleryPool() {
  const W = 1000;
  const H = 563;
  const HORIZON = 166;
  const layers = [];
  layers.push(
    bandedSky(
      W,
      HORIZON,
      [
        [0, '#7cc3ef'],
        [1, '#d6eefa'],
      ],
      7
    )
  );
  layers.push(
    squareSun(840, 62, 52, '#fff8d8', {
      glow: ['#d8f0fb', '#ecf8fd'],
      step: 10,
    })
  );
  layers.push(cloud(60, 40, 16, 3, 10, { seed: 4, shadow: '#cfe6f4' }));
  layers.push(cloud(560, 96, 12, 2, 10, { seed: 7, shadow: '#cfe6f4' }));
  layers.push(
    bandedSky(
      W,
      H,
      [
        [0, '#2f86c8'],
        [1, '#1f5f9e'],
      ],
      6,
      HORIZON
    )
  );
  [
    [90, 240, 60],
    [210, 300, 40],
    [820, 236, 70],
    [700, 280, 36],
    [900, 320, 50],
  ].forEach(([x, y, w]) => layers.push(rect(x, y, w, 5, '#8cc8ee', 0.7)));
  // An island far off, and a sail.
  layers.push(
    sprite(
      [
        '.......aaa......',
        '....aaaaaaaa....',
        '..aaaaaaaaaaaaa.',
        'aaaaaaaaaaaaaaaa',
      ],
      { a: '#4f8fae' },
      90,
      HORIZON - 32,
      8
    ),
    sprite(
      ['..s..', '..ss.', '.sss.', '.ssss', 'hhhhh'],
      { s: '#fbf8f1', h: '#3a4a6a' },
      720,
      HORIZON - 26,
      5
    )
  );

  const s = new Scene({ seed: 21 });
  const DW = 40;
  const DD = 40;
  const deck = material({
    top: tilesTexture('hotel-deck', '#f2e5c6', '#e3d1ad', { seed: 43 }),
    side: gt('pool-tile', '#a5e0e8', { spread: 0.04 }),
  });
  s.box(0, 0, 0, DW, DD, 2, deck);
  const water = all(waterTexture('hotel-pool-water', '#38c1d8', { seed: 44 }));
  for (let x = 7; x < 21; x++)
    for (let y = 7; y < 16; y++) {
      s.set(x, y, 1, null);
      s.set(x, y, 0, water);
    }
  // A float on the water.
  const ring = g('pool-ring', '#f07a8a');
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (i !== 1 || j !== 1) s.set(14 + i, 10 + j, 1, ring);

  // A low white wall along the back edges, the sea beyond it, with
  // flowering shrubs along it.
  const parapet = g('parapet', '#fbf8f1', { spread: 0.03 });
  for (let x = 0; x < DW; x++) s.set(x, 0, 2, parapet);
  for (let y = 0; y < DD; y++) s.set(0, y, 2, parapet);
  const bloom = g('bloom', '#e0559a');
  const shrub = g('shrub', '#4f9a3d');
  for (const [x, y] of [
    [1, 5],
    [1, 18],
    [5, 1],
    [19, 1],
  ]) {
    s.set(x, y, 2, shrub);
    s.set(x, y, 3, bloom);
    s.set(x + (y === 1 ? 1 : 0), y + (y === 1 ? 0 : 1), 2, bloom);
  }

  // Loungers under parasols on the two far sides of the pool, so nothing
  // tall stands between the water and the viewer.
  const frame = gt('lounger', '#a8774a');
  const pads = [gt('pad-coral', '#e0785c'), gt('pad-white', '#fbf6ec')];
  const pole = g('parasol-pole', '#8a6a44');
  const white = g('canvas-white', '#fbf6ec', { spread: 0.03 });
  const coral = g('canvas-coral', '#e0785c');
  const teal = g('canvas-teal', '#2fa39a');
  [8, 10, 15, 17].forEach((x, i) => lounger(s, x, 2, 2, frame, pads[i % 2]));
  parasol(s, 9, 3, 2, { pole, a: coral, b: white });
  parasol(s, 16, 3, 2, { pole, a: teal, b: white });
  [8, 10, 13, 15].forEach((y, i) =>
    lounger(s, 2, y, 2, frame, pads[(i + 1) % 2], { along: 'x' })
  );
  parasol(s, 3, 9, 2, { pole, a: teal, b: white });
  parasol(s, 3, 14, 2, { pole, a: coral, b: white });
  // Two more loungers on the near side, low enough to see over.
  [11, 14].forEach(x => lounger(s, x, 18, 2, frame, pads[0]));

  const trunk = { log: g('palm-trunk', '#8a6a44') };
  palm(s, 2, 22, 2, { ...trunk, height: 8, lean: 3, dx: 0, dy: 1, frond: 3 });
  palm(s, 23, 2, 2, { ...trunk, height: 9, lean: 4, dx: 1, dy: 0, frond: 3 });

  const r = renderScene(s, { light: { color: '#123050' } });
  layers.push(place(r, anchor(10, [0, 0, 2], [480, 172])));
  return document({
    width: W,
    height: H,
    label: 'A blocky hotel pool by day',
    layers,
  });
}

/**
 * A small thing drawn flat, as pixel art standing on a block's top: `rows`
 * and `palette` as for sprite(), its foot at the middle of the top of the
 * cell (x, y) at height z, and `px` pixels a dot.
 */
function item(at, x, y, z, rows, palette, px) {
  const [cx, cy] = screen(at, x + 0.5, y + 0.5, z);
  const w = rows[0].length * px;
  return sprite(rows, palette, cx - w / 2, cy - rows.length * px, px);
}

const WINE_GLASS = [
  'g...g',
  'g...g',
  'grrrg',
  '.grg.',
  '..g..',
  '..g..',
  '.ggg.',
];
const WINE_BOTTLE = ['.c.', '.b.', '.b.', 'bbb', 'blb', 'blb', 'bbb', 'bbb'];
const CANDLE = ['.f.', 'fyf', '.f.', 'ccc', 'ccc', 'ccc', 'bbb'];

/**
 * A string of lights between two image points, sagging `sag` pixels at
 * the middle: a thin wire and a bulb every `every` pixels.
 */
function lightString([x0, y0], [x1, y1], sag, { every = 28, bulb = 6 } = {}) {
  const n = Math.max(2, Math.round(Math.abs(x1 - x0) / every));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + 4 * sag * t * (1 - t)]);
  }
  const wire = pts
    .map(([x, y], i) => `${i ? 'L' : 'M'}${Math.round(x)} ${Math.round(y)}`)
    .join('');
  let bulbs = '';
  pts.slice(1, -1).forEach(([x, y]) => {
    const bx = Math.round(x - bulb / 2);
    const by = Math.round(y + 1);
    bulbs += `M${bx} ${by}h${bulb}v${bulb}h${-bulb}z`;
  });
  return (
    `<path fill="none" stroke="#3a2630" stroke-width="2" d="${wire}"/>` +
    `<path fill="#ffe7a0" d="${bulbs}"/>`
  );
}

function galleryTerrace() {
  const W = 1000;
  const H = 563;
  const HORIZON = 250;
  const layers = [];
  layers.push(
    bandedSky(
      W,
      HORIZON,
      [
        [0, '#4a3474'],
        [0.45, '#c2507a'],
        [0.8, '#f08a4e'],
        [1, '#fbc768'],
      ],
      9
    )
  );
  layers.push(
    cloud(560, 60, 18, 2, 12, {
      seed: 11,
      color: '#e486a0',
      shadow: '#b85a86',
      opacity: 0.85,
    })
  );
  layers.push(
    cloud(40, 120, 14, 2, 12, {
      seed: 12,
      color: '#f6a07a',
      shadow: '#d97a72',
      opacity: 0.85,
    })
  );
  layers.push(
    squareSun(250, HORIZON - 34, 88, '#fff0b8', {
      glow: ['#fbb45a', '#fcd27e'],
      step: 14,
    })
  );
  layers.push(
    bandedSky(
      W,
      H,
      [
        [0, '#8a4a7a'],
        [0.5, '#4a3062'],
        [1, '#24183c'],
      ],
      7,
      HORIZON
    )
  );
  [
    [0, 130],
    [1, 100],
    [2, 120],
    [3, 70],
  ].forEach(([i, w]) =>
    layers.push(
      rect(
        250 - w / 2 + ((i * 29) % 24) - 12,
        HORIZON + 12 + i * 22,
        w,
        7,
        '#ffcf80',
        0.75 - i * 0.12
      )
    )
  );

  const s = new Scene({ seed: 31 });
  const DW = 34;
  const DD = 34;
  const deck = material({
    top: planksTexture('hotel-terrace-deck', '#a8683e', { seed: 45 }),
    side: gt('terrace-edge', '#6e4128'),
  });
  s.box(0, 0, 0, DW, DD, 2, deck);

  // A railing along the far edges: posts, and a rail along their tops.
  const rail = g('terrace-rail', '#f4ece0', { spread: 0.03 });
  for (let a = 0; a < 22; a++) {
    s.set(a, 0, 3, rail);
    s.set(0, a, 3, rail);
    if (a % 3 === 0) {
      s.set(a, 0, 2, rail);
      s.set(0, a, 2, rail);
    }
  }
  // The table for two, laid with a white cloth, and its two chairs.
  const cloth = g('terrace-cloth', '#fbf7f0', { spread: 0.03 });
  s.box(5, 4, 2, 2, 2, 2, cloth);
  const chair = g('terrace-chair', '#2f5f7a');
  const cushion = material({
    top: gt('terrace-cushion', '#e0785c'),
    side: chair.left,
  });
  for (const [seat, back] of [
    [3, 2],
    [8, 9],
  ]) {
    s.box(seat, 4, 2, 1, 2, 1, cushion);
    s.box(back, 4, 2, 1, 2, 3, chair);
  }

  // Potted plants at the railing.
  const pot = g('terrace-pot', '#c8714a');
  const leaf = g('terrace-leaf', '#4f8a3a');
  const bloom = g('terrace-bloom', '#e0559a');
  for (const [x, y] of [
    [1, 9],
    [10, 1],
  ]) {
    s.box(x, y, 2, 2, 2, 1, pot);
    s.box(x, y, 3, 2, 2, 1, leaf);
    s.set(x, y + 1, 4, bloom);
    s.set(x + 1, y, 4, leaf);
  }

  const r = renderScene(s, {
    light: { dir: [-0.9, -0.2, 1], color: '#2a1030' },
  });
  const at = anchor(16, [0, 0, 2], [548, 268]);
  layers.push(place(r, at));
  // What stands on the table, spread across it and drawn back to front.
  const glass = { g: '#e6f0f6', r: '#8a1f3a' };
  layers.push(
    item(
      at,
      5.1,
      4.5,
      4,
      WINE_BOTTLE,
      { c: '#c8a46a', b: '#2c4a2e', l: '#f1e6cf' },
      6
    ),
    item(at, 4.85, 5.15, 4, WINE_GLASS, glass, 6),
    item(at, 6.15, 3.85, 4, WINE_GLASS, glass, 6),
    item(
      at,
      5.9,
      4.5,
      4,
      CANDLE,
      { f: '#ffb84a', y: '#fff3b0', c: '#c8343e', b: '#b8862e' },
      6
    )
  );
  // Strings of lights overhead.
  layers.push(
    lightString([-20, 26], [640, -6], 70),
    lightString([360, -6], [1020, 30], 70)
  );
  return document({
    width: W,
    height: H,
    label: 'A blocky table for two on a hotel terrace at sunset',
    layers,
  });
}

// ---------------------------------------------------------------------------
// The restaurant, the bar, the spa and the reception

/**
 * A pendant lamp: a shade `w` wide whose sides glow, with a brass top, its
 * underside at height z. Returns the point its cord hangs from. Lamps go in
 * a scene of their own, drawn over the room and what stands on its tables,
 * since nothing in a room is ever in front of one.
 */
function pendant(s, x, y, z, w, shade) {
  s.box(x, y, z, w, w, 1, shade);
  return [x + w / 2, y + w / 2, z + 1];
}

/** Cords from points in the image straight up to its top edge. */
function cords(points, color = '#2a1a14', width = 2) {
  const d = points
    .map(([x, y]) => `M${Math.round(x)} 0V${Math.round(y)}`)
    .join('');
  return `<path fill="none" stroke="${color}" stroke-width="${width}" d="${d}"/>`;
}

/** A chair whose seat is at (x, y) and whose back stands at (bx, by). */
function chair(s, x, y, bx, by, seat, back) {
  s.set(x, y, 1, seat);
  for (let z = 1; z <= 2; z++) s.set(bx, by, z, back);
}

function galleryRestaurant() {
  const W = 20;
  const D = 10;
  const H = 8;
  const s = new Scene({ seed: 41 });
  const cut = gt('rest-cut', '#3a2418');
  const t = { cut, painted: new Map() };
  const plaster = walls(gt('rest-plaster', '#e9d6b4', { spread: 0.035 }), cut);
  const panel = walls(
    planksTexture('hotel-rest-panel', '#6b3f26', { seed: 46, boards: 2 }),
    cut
  );
  const rail = walls(gt('rest-rail', '#c99a3c'), cut);
  cutaway(s, {
    W,
    D,
    H,
    floor: material({
      top: planksTexture('hotel-rest-floor', '#7a4a2c', { seed: 47 }),
      side: gt('rest-base', '#3a2418'),
    }),
    band: z => (z === 0 ? rail : z <= 2 ? panel : z === 3 ? rail : plaster),
  });

  // Tall paned windows on the back-right wall, the evening in them, each
  // with an arched head.
  const pane = (name, hex) => {
    const tex = glassTexture(`hotel-${name}`, hex, '#3a2418', {
      shine: '#ffe6c0',
    });
    return material({ id: tex.id, color: tex, flat: true });
  };
  const dusk = [
    pane('eve-1', '#f39a5c'),
    pane('eve-2', '#d0607a'),
    pane('eve-3', '#7a4a8e'),
    pane('eve-4', '#3e3c7c'),
    pane('eve-5', '#2a2c60'),
  ];
  for (const a of [2, 8, 14])
    paintWall(s, t, 'right', a, 2, 4, 6, (i, k) =>
      k === 5 ? (i === 1 || i === 2 ? dusk[4] : null) : dusk[k]
    );

  // A banquette along the back-left wall, with sconces over it.
  const velvet = g('rest-velvet', '#8a2a3a');
  s.box(1, 4, 1, 1, D - 5, 2, velvet);
  s.box(2, 4, 1, 1, D - 5, 1, velvet);
  const sconce = g('rest-sconce', '#ffe2a0', { flat: true, spread: 0.03 });
  for (const a of [3, 9]) paintWall(s, t, 'left', a, 5, 1, 1, () => sconce);
  const art = ['#2f5a4e', '#c99a3c', '#e07a5c', '#3e3c7c'];
  framed(s, t, 'left', 4, 4, 5, 4, g('rest-gilt', '#c99a3c'), (i, k) =>
    g(`rest-art-${(i + 2 * k) % 4}`, art[(i + 2 * k) % 4])
  );

  // Tables laid in white, their chairs, and a pendant over each.
  const cloth = g('rest-cloth', '#fbf7f0', { spread: 0.03 });
  const back = g('rest-chair', '#4a2c1c');
  const shade = material({
    top: gt('rest-brass', '#8a6424'),
    side: gt('rest-glow', '#f8c866', { spread: 0.04 }),
    flat: true,
  });
  const tables = [
    [5, 2, true],
    [12, 2, true],
    [3, 6, false],
    [10, 6, true],
  ];
  const lamps = new Scene({ seed: 42 });
  const hooks = [];
  for (const [x, y, both] of tables) {
    s.box(x, y, 1, 2, 2, 2, cloth);
    for (const j of [0, 1]) {
      if (both) chair(s, x - 1, y + j, x - 2, y + j, velvet, back);
      chair(s, x + 2, y + j, x + 3, y + j, velvet, back);
    }
    hooks.push(pendant(lamps, x, y, 5, 2, shade));
  }

  const r = renderScene(s, { light: { color: '#120a08', ao: 0.14 } });
  const at = fit(
    r.bounds,
    { width: 1000, height: 563 },
    { mode: 'cover', align: [0.5, 0.3], zoom: 0.84 }
  );
  const candle = { f: '#ffb84a', y: '#fff3b0', c: '#f2dca8', b: '#b8862e' };
  return document({
    width: 1000,
    height: 563,
    label: 'A blocky hotel restaurant in the evening',
    layers: [
      rect(0, 0, 1000, 563, '#24160f'),
      place(r, at),
      ...tables.map(([x, y]) =>
        item(at, x + 0.5, y + 0.5, 3, CANDLE, candle, 4)
      ),
      cords(hooks.map(h => screen(at, ...h))),
      place(renderScene(lamps, { light: false }), at),
    ],
  });
}

const BOTTLES = [
  ['.c.', '.b.', '.b.', 'bbb', 'blb', 'blb', 'bbb', 'bbb'],
  ['.c.', '.b.', 'bbb', 'blb', 'bbb'],
  ['cc', 'bb', 'bb', 'll', 'bb', 'bb'],
  ['.c.', '.b.', '.b.', '.b.', 'bbb', 'blb', 'bbb'],
];
const MARTINI = [
  'ggggggg',
  '.gpppg.',
  '..gpg..',
  '...g...',
  '...g...',
  '..ggg..',
];
const HIGHBALL = [
  '....s',
  '...s.',
  'g.s.g',
  'gooog',
  'gooog',
  'gooog',
  '.ggg.',
];

function galleryBar() {
  const W = 18;
  const D = 11;
  const H = 8;
  const s = new Scene({ seed: 51 });
  const cut = gt('bar-cut', '#1a1622');
  const t = { cut, painted: new Map() };
  const plaster = walls(gt('bar-wall', '#2c2f4a', { spread: 0.05 }), cut);
  const panel = walls(
    planksTexture('hotel-bar-panel', '#5a3424', { seed: 48, boards: 2 }),
    cut
  );
  const brass = walls(gt('bar-brass', '#c99a3c'), cut);
  // A floor of black and white tiles.
  const tile = [
    material({ top: gt('bar-tile-dk', '#2a2a32'), side: cut }),
    material({
      top: gt('bar-tile-lt', '#d9d2c2', { spread: 0.04 }),
      side: cut,
    }),
  ];
  cutaway(s, {
    W,
    D,
    H,
    floor: tile[0],
    band: z => (z === 0 ? brass : z <= 2 ? panel : z === 3 ? brass : plaster),
  });
  for (let x = 1; x < W; x++)
    for (let y = 1; y < D; y++) s.set(x, y, 0, tile[(x + y) % 2]);

  // Shelves set into the back-right wall, lit from behind, for the
  // bottles, over a low back bar.
  const glowWall = g('bar-backlight', '#f0a850', { flat: true, spread: 0.05 });
  const shelf = g('bar-shelf', '#3a2418');
  const shelves = [3, 5, 7];
  paintWall(s, t, 'right', 3, 3, 12, 6, (i, k) =>
    shelves.includes(3 + k) ? shelf : glowWall
  );
  s.box(
    3,
    1,
    1,
    12,
    1,
    2,
    material({
      top: gt('bar-back-top', '#3a2418'),
      side: gt('bar-back', '#5a3424'),
    })
  );

  // The counter, its top in dark marble, a brass rail along its foot, and
  // stools before it.
  const counter = material({
    top: gt('bar-counter-top', '#2a2430', { spread: 0.06 }),
    side: planksTexture('hotel-bar-counter', '#7a4a2c', {
      seed: 49,
      boards: 2,
    }),
  });
  s.box(3, 5, 1, 12, 1, 3, counter);
  s.box(3, 6, 1, 12, 1, 1, g('bar-rail', '#c99a3c'));
  const leather = g('bar-leather', '#b8343e');
  const chrome = g('bar-chrome', '#9aa4b0', { spread: 0.05 });
  for (const x of [4, 7, 10, 13]) {
    s.set(x, 8, 1, chrome);
    s.set(x, 8, 2, leather);
  }

  // A window at night on the back-left wall.
  const starry = texture('hotel-bar-night', 8, (u, v, r) =>
    r() < 0.05 ? '#fff4c8' : r() < 0.3 ? '#232c5a' : '#1e2650'
  );
  const night = material({ id: starry.id, color: starry, flat: true });
  const moonM = g('bar-moon', '#f6efd0', { flat: true, spread: 0.02 });
  framed(s, t, 'left', 3, 3, 6, 5, g('bar-frame', '#5a3424'), (i, k) =>
    i === 3 && k === 2 ? moonM : night
  );

  const r = renderScene(s, { light: { color: '#0a0812', ao: 0.14 } });
  const at = fit(
    r.bounds,
    { width: 1000, height: 563 },
    { mode: 'cover', align: [0.5, 0.3], zoom: 0.84 }
  );
  const colors = [
    '#e09a3a',
    '#4a9a5a',
    '#4a7ad0',
    '#c0404a',
    '#d8e4ea',
    '#8a5ac0',
  ];
  const bottles = [];
  shelves.forEach((z, row) => {
    for (let i = 0; i < 14; i++) {
      const c = colors[(i * 5 + row * 2) % colors.length];
      const pal = { b: c, c: '#3a2418', l: '#f1e6cf' };
      const shape = BOTTLES[(i * 3 + row) % BOTTLES.length];
      bottles.push(item(at, 3 + i * 0.85, 0.5, z + 1, shape, pal, 3.5));
    }
  });
  const drinks = [
    item(at, 6, 5, 4, MARTINI, { g: '#e6f0f6', p: '#f07aa0' }, 5),
    item(
      at,
      10,
      5,
      4,
      HIGHBALL,
      { g: '#e6f0f6', o: '#f8a040', s: '#e04a5a' },
      5
    ),
  ];
  return document({
    width: 1000,
    height: 563,
    label: 'A blocky hotel bar at night',
    layers: [
      rect(0, 0, 1000, 563, '#14111c'),
      place(r, at),
      ...bottles,
      ...drinks,
    ],
  });
}

const STONES = [
  '...aa...',
  '..aaaa..',
  '..dddd..',
  '.bbbbbb.',
  'bbbbbbbb',
  '.dddddd.',
  '.cccccc.',
  'cccccccc',
  '.cccccc.',
];
const ORCHID = [
  '.pp..pp.',
  'pyp.pyp.',
  '.pp..pp.',
  '..g..g..',
  '...g.g..',
  '....g...',
  '...ttt..',
  '...ttt..',
  '....t...',
];
const LAVENDER = [
  '.v...v.',
  '.v.v.v.',
  'vv.v.vv',
  '.g.v.g.',
  '.g.g.g.',
  '..ggg..',
  '.ttttt.',
  '.ttttt.',
  '..ttt..',
];
const SHORT_CANDLE = ['.f.', 'fyf', '.f.', 'ccc', 'bbb'];

/** Three rolled towels, two below and one on top, seen end on. */
function towelRolls() {
  const roll = ['.www.', 'wsssw', 'wswsw', 'wsssw', '.www.'];
  const rows = Array.from({ length: 9 }, () => Array(10).fill('.'));
  for (const [ox, oy] of [
    [2, 0],
    [0, 4],
    [5, 4],
  ])
    roll.forEach((r, j) =>
      [...r].forEach((c, i) => {
        if (c !== '.') rows[oy + j][ox + i] = c;
      })
    );
  return rows.map(r => r.join(''));
}

/** Bamboo: a green stem in segments, each with a pale ring at its node. */
function bambooTexture(id) {
  const cols = [
    '#6e9e3e',
    '#7fb04a',
    '#8cbc56',
    '#6e9e3e',
    '#5e8c34',
    '#7fb04a',
    '#8cbc56',
    '#5e8c34',
  ];
  return texture(id, 8, (u, v, r) => {
    if (v === 7) return '#c8d890';
    if (v === 6) return '#4e7a2c';
    return r() < 0.12 ? shade(cols[u], -0.1) : cols[u];
  });
}

function gallerySpa() {
  const W = 18;
  const D = 11;
  const H = 10;
  const s = new Scene({ seed: 61 });
  const cut = gt('spa-cut', '#6b5a48');
  const t = { cut, painted: new Map() };
  const stoneWall = walls(gt('spa-wall', '#d8cfbe', { spread: 0.04 }), cut);
  const teak = walls(
    planksTexture('hotel-spa-teak', '#9a6a40', { seed: 50, boards: 2 }),
    cut
  );
  cutaway(s, {
    W,
    D,
    H,
    floor: material({
      top: tilesTexture('hotel-spa-floor', '#dcd6ca', '#c6bfb0', { seed: 51 }),
      side: gt('spa-base', '#7a6a58'),
    }),
    band: z => (z <= 1 ? teak : stoneWall),
  });

  // A paper screen on the back-left wall, the day glowing through it.
  const paper = texture('hotel-spa-paper', 8, (u, v) =>
    u === 0 || v === 0 ? '#b8905e' : u === 4 || v === 4 ? '#d8c09a' : '#fbf4e2'
  );
  const screenM = material({ id: paper.id, color: paper, flat: true });
  paintWall(s, t, 'left', 3, 3, 6, 4, () => screenM);

  // The shelf on the back-right wall between two clumps of bamboo.
  const shelf = material({
    top: planksTexture('hotel-spa-shelf', '#a8743f', { seed: 52, boards: 2 }),
    side: gt('spa-shelf-edge', '#7a5230'),
  });
  s.box(3, 1, 4, 8, 1, 1, shelf);
  const bamboo = all(bambooTexture('hotel-spa-bamboo'));
  const leaf = g('spa-bamboo-leaf', '#6aa84a');
  for (const [x, y, h, lx, ly] of [
    [1, 1, 10, 1, 0],
    [2, 2, 8, -1, 0],
    [11, 1, 9, 1, 0],
    [12, 2, 7, 1, 0],
  ]) {
    for (let z = 1; z <= h; z++) s.set(x, y, z, bamboo);
    s.set(x + lx, y + ly, h - 1, leaf);
  }

  // A plunge pool in the floor, and a teak bench beside it.
  const rim = g('spa-rim', '#bdb4a2', { spread: 0.04 });
  const water = all(waterTexture('hotel-spa-water', '#4fb8b0', { seed: 53 }));
  for (let x = 2; x < 8; x++)
    for (let y = 5; y < 10; y++) {
      const edge = x === 2 || y === 5 || x === 7 || y === 9;
      s.set(x, y, 0, edge ? rim : water);
    }
  s.box(2, 5, 1, 6, 1, 1, rim);
  s.box(2, 5, 1, 1, 5, 1, rim);
  const bench = material({
    top: planksTexture('hotel-spa-bench', '#a8743f', { seed: 54, boards: 2 }),
    side: gt('spa-bench-leg', '#6b4a2f'),
  });
  s.box(9, 5, 1, 2, 4, 1, bench);

  const r = renderScene(s, { light: { color: '#2a2418' } });
  // Close in on the shelf.
  const at = anchor(21, [7, 1, 5], [560, 250]);
  const flame = { f: '#ffb84a', y: '#fff3b0', c: '#f6ecd8', b: '#9a7a5a' };
  const towel = { w: '#fbf8f2', s: '#d8d0c2' };
  const px = at.scale * 0.42;
  const things = [
    item(
      at,
      3.1,
      1,
      5,
      STONES,
      { a: '#b4b0a8', b: '#94908a', c: '#7a7670', d: '#55524e' },
      px
    ),
    item(at, 4.3, 1, 5, CANDLE, flame, px),
    item(at, 5, 1, 5, SHORT_CANDLE, flame, px),
    item(at, 6.3, 1, 5, towelRolls(), towel, px),
    item(
      at,
      7.9,
      1,
      5,
      ORCHID,
      { p: '#f4c2dc', y: '#e8b040', g: '#4a8a3a', t: '#fbf8f2' },
      px
    ),
    item(
      at,
      9.4,
      1,
      5,
      LAVENDER,
      { v: '#9a7ad0', g: '#5a8a4a', t: '#c8714a' },
      px
    ),
    item(at, 9.5, 6.5, 2, towelRolls(), towel, px),
    item(at, 4, 7, 1, SHORT_CANDLE, flame, px * 0.8),
    item(at, 5.5, 6.5, 1, SHORT_CANDLE, flame, px * 0.8),
  ];
  return document({
    width: 1000,
    height: 563,
    label: 'A blocky hotel spa',
    layers: [rect(0, 0, 1000, 563, '#e8e2d4'), place(r, at), ...things],
  });
}

const LAMP = [
  '...kk...',
  '..kkkk..',
  '.kkkkkk.',
  'kkkkkkkk',
  '.yyyyyy.',
  '..yyyy..',
];
const BELL = ['...k...', '..yyy..', '.yyyyy.', 'yyyyyyy', 'kkkkkkk'];
const VASE = [
  '.r.p.r.',
  'rrpppr.',
  '.r.p.rr',
  '..ggg..',
  '...g...',
  '..bbb..',
  '..bbb..',
  '.bbbbb.',
  '..bbb..',
];

/** Vertical slats of wood with dark gaps between, for a lobby wall. */
function slatsTexture(id, wood) {
  return texture(id, 8, (u, v, r) => {
    if (u % 4 === 3) return shade(wood, -0.45);
    return r() < 0.25
      ? shade(wood, -0.08)
      : u % 4 === 0
        ? shade(wood, 0.08)
        : wood;
  });
}

/** A pigeonhole: a dark box in a pale frame, a key's brass tag in it. */
function cubbyTexture(id, frame, inside, tag) {
  return texture(id, 8, (u, v) => {
    if (u === 0 || v === 0 || u === 7 || v === 7) return frame;
    if (u === 4 && v >= 2 && v <= 3) return '#3a3a3a';
    if (u >= 3 && u <= 4 && v >= 4 && v <= 5) return tag;
    return inside;
  });
}

/** A clock face: white, a dark rim and two hands. */
function clockTexture(id, hour) {
  return texture(id, 8, (u, v) => {
    const corner = (u === 0 || u === 7) && (v === 0 || v === 7);
    if (corner) return '#c99a3c';
    if (u === 0 || v === 0 || u === 7 || v === 7) return '#2a2420';
    if (u === 3 && v >= 2 && v <= 4) return '#2a2420';
    if (v === 4 && (hour ? u >= 4 && u <= 5 : u >= 1 && u <= 2))
      return '#2a2420';
    return '#fbf8f0';
  });
}

/** Marble: white with grey veins running across. */
function marbleTexture(id) {
  return texture(id, 8, (u, v, r) => {
    if ((u + 2 * v) % 7 === 0 && r() < 0.8) return '#b8b4b0';
    return r() < 0.2 ? '#e6e2dc' : '#f6f3ee';
  });
}

function reception() {
  const W = 13;
  const D = 11;
  const H = 8;
  const s = new Scene({ seed: 71 });
  const cut = gt('rec-cut', '#5a3a24');
  const t = { cut, painted: new Map() };
  const slats = all(slatsTexture('hotel-rec-slats', '#b07a48'));
  const plaster = walls(gt('rec-plaster', '#efe6d6', { spread: 0.035 }), cut);
  const base = walls(gt('rec-base', '#5a3a24'), cut);
  cutaway(s, {
    W,
    D,
    H,
    floor: material({
      top: tilesTexture('hotel-rec-floor', '#e4dccd', '#cfc5b2', { seed: 55 }),
      side: gt('rec-floor-edge', '#7a6a58'),
    }),
    band: z => (z === 0 ? base : plaster),
  });
  // The slatted wall behind the desk.
  paintWall(s, t, 'right', 1, 1, W - 1, H, () => slats);

  // Room keys in pigeonholes on the slats.
  const cubby = cubbyTexture(
    'hotel-rec-cubby',
    '#e8d4b0',
    '#4a2e1c',
    '#e2b04a'
  );
  const cubbyM = material({ id: cubby.id, color: cubby });
  paintWall(s, t, 'right', 5, 4, 5, 3, () => cubbyM);

  // Clocks on the back-left wall, for the time at home and away.
  [0, 1, 0].forEach((h, i) => {
    const c = clockTexture(`hotel-rec-clock-${h}`, h);
    paintWall(s, t, 'left', 2 + 2 * i, 6, 1, 1, () =>
      material({ id: c.id, color: c })
    );
  });

  // The desk: wood below a marble top.
  const desk = material({
    top: marbleTexture('hotel-rec-marble'),
    side: planksTexture('hotel-rec-desk', '#8a5a34', { seed: 56, boards: 2 }),
  });
  s.box(3, 4, 1, 9, 1, 2, desk);
  s.box(3, 1, 1, 1, 4, 2, desk);

  // A runner before the desk.
  rug(
    s,
    5,
    6,
    6,
    3,
    gt('rec-rug-edge', '#7a2a34'),
    gt('rec-rug', '#a8404a'),
    gt('rec-floor-edge', '#7a6a58')
  );

  // A potted palm by the desk.
  s.set(2, 9, 1, g('rec-pot', '#c8714a'));
  palm(s, 2, 9, 2, {
    log: g('palm-trunk', '#8a6a44'),
    height: 4,
    lean: 9,
    frond: 2,
  });

  const r = renderScene(s, { light: { color: '#2a1a10' } });
  const at = fit(
    r.bounds,
    { width: 600, height: 338 },
    { mode: 'cover', align: [0.5, 0.3], zoom: 0.9 }
  );
  const px = at.scale * 0.42;
  // Three lamps over the desk, hung from cords, drawn last since nothing
  // stands in front of them.
  const lamps = [4.5, 7.5, 10.5].map(x =>
    item(at, x - 0.5, 3.5, 6, LAMP, { k: '#2a2420', y: '#ffe2a0' }, px)
  );
  const hooks = [4.5, 7.5, 10.5].map(x => {
    const [hx, hy] = screen(at, x, 4, 6);
    return [hx, hy - 6 * px];
  });
  return document({
    width: 600,
    height: 338,
    label: 'A blocky hotel reception',
    layers: [
      rect(0, 0, 600, 338, '#efe6d6'),
      place(r, at),
      item(at, 5.2, 4, 3, BELL, { y: '#e2b04a', k: '#5a3a24' }, px),
      item(
        at,
        9,
        4,
        3,
        VASE,
        { r: '#e0485a', p: '#f6a0c0', g: '#4a8a3a', b: '#3a6ac0' },
        px
      ),
      cords(hooks),
      ...lamps,
    ],
  });
}

// ---------------------------------------------------------------------------
// The welcome

/** Roof tiles in rows, for the wings' and the tower's tops. */
function roofTexture(id, tile) {
  return texture(id, 8, (u, v, r) => {
    if (v % 4 === 3) return shade(tile, -0.22);
    if ((u + (v >> 2) * 2) % 4 === 0) return shade(tile, -0.1);
    return r() < 0.2 ? shade(tile, 0.08) : tile;
  });
}

/**
 * The hotel: a tower on the corner and two wings along the back edges of a
 * courtyard, the left wing on x < T and the right wing on y < T, with its
 * pool, loungers, parasols and palms. The courtyard floor is z = 0.
 */
function hotelResort() {
  const s = new Scene({ seed: 81 });
  const G = 64; // the courtyard's reach along each axis
  const T = 4; // the wings' depth
  const K = 10; // the tower's footprint
  const TOWER = 20;
  const wingH = a => (a < 30 ? 14 : a < 44 ? 11 : 8);

  const terracotta = g('hero-wall', '#c4643e', { spread: 0.05 });
  const cream = g('hero-cream', '#ecdcbc', { spread: 0.035 });
  const pane = glassTexture('hotel-hero-glass', '#6aa6d4', '#ecdcbc', {
    shine: '#cfe8f8',
  });
  const glass = material({ id: pane.id, color: pane });
  const shop = glassTexture('hotel-hero-shop', '#3f7aa8', '#ecdcbc', {
    shine: '#a8d0ec',
  });
  const shopGlass = material({ id: shop.id, color: shop });
  const roof = material({
    top: roofTexture('hotel-hero-roof', '#a8472e'),
    side: cream.left,
  });

  // The courtyard: pale stone, a pool cut into it.
  const deck = material({
    top: tilesTexture('hotel-hero-deck', '#efe3c8', '#e0d0b0', { seed: 57 }),
    side: cream.left,
  });
  s.box(0, 0, 0, G, G, 1, deck);
  const water = all(waterTexture('hotel-hero-pool', '#36bfd6', { seed: 58 }));
  const rim = cream;
  for (let x = 13; x < G; x++)
    for (let y = 13; y < G; y++) {
      if (x > 34 || y > 34) continue;
      const edge = x === 13 || y === 13 || x === 34 || y === 34;
      s.set(x, y, 0, edge ? rim : water);
    }
  // Two floats on the water, in the parasols' canvas.
  const white = g('hero-canvas-white', '#fbf6ec', { spread: 0.03 });
  const coral = g('hero-canvas-coral', '#e0785c');
  for (const [fx, fy, ring] of [
    [17, 24, coral],
    [25, 17, white],
  ]) {
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        if (i !== 1 || j !== 1) s.set(fx + i, fy + j, 1, ring);
  }

  /**
   * The paint of a facade cell `a` along the face and `z` up, for a block
   * of height `h` whose top row is its roof.
   */
  const facade = (a, z, h, wall) => {
    if (z === h) return roof;
    if (z <= 3) {
      if (z === 3) return cream;
      return a % 3 === 0 ? cream : shopGlass;
    }
    const r = (z - 4) % 3;
    if (r === 2) return cream;
    return a % 2 === 0 ? glass : wall;
  };

  // The wings.
  for (let a = K; a < G; a++) {
    const h = wingH(a);
    for (let z = 1; z <= h; z++)
      for (let d = 0; d < T; d++) {
        const outer = d === T - 1;
        s.set(
          d,
          a,
          z,
          outer ? facade(a, z, h, terracotta) : z === h ? roof : cream
        );
        s.set(
          a,
          d,
          z,
          outer ? facade(a, z, h, terracotta) : z === h ? roof : cream
        );
      }
  }
  // The tower, with balconies on its upper floors.
  for (let x = 0; x < K; x++)
    for (let y = 0; y < K; y++)
      for (let z = 1; z <= TOWER; z++) {
        const face = x === K - 1 ? y : y === K - 1 ? x : -1;
        if (face < 0) s.set(x, y, z, z === TOWER ? roof : cream);
        else s.set(x, y, z, facade(face + 1, z, TOWER, terracotta));
      }
  const trunk = g('palm-trunk', '#8a6a44');
  const rail = trunk;
  for (let z = 7; z < TOWER - 1; z += 6)
    for (let a = 1; a < K - 1; a++) {
      s.set(K, a, z, rail);
      s.set(a, K, z, rail);
    }
  // A canopy over the tower's door.
  const teal = g('hero-canvas-teal', '#2fa39a');
  const awning = teal;
  s.box(K, 2, 3, 2, 6, 1, awning);
  s.box(2, K, 3, 6, 2, 1, awning);

  // Loungers under parasols along the pool's two far sides.
  const frame = gt('hero-lounger', '#a8774a');
  const pad = [white.top, teal.top];
  const pole = trunk;
  [16, 18, 23, 25, 30, 32].forEach((a, i) => {
    lounger(s, 9, a, 1, frame, pad[i % 2], { along: 'x' });
    lounger(s, a, 9, 1, frame, pad[(i + 1) % 2]);
  });
  for (const [a, c] of [
    [17, coral],
    [24, teal],
    [31, coral],
  ]) {
    parasol(s, 7, a, 1, { pole, a: c, b: white });
    parasol(s, a, 7, 1, { pole, a: c === coral ? teal : coral, b: white });
  }

  // Palms along the wings, kept off the middle where the welcome sits.
  for (const [x, y, h, dx, dy] of [
    [6, 38, 12, 1, 0],
    [38, 6, 12, 0, 1],
    [6, 50, 11, 1, 0],
    [50, 6, 11, 0, 1],
    [12, 40, 9, 0, 1],
    [40, 12, 9, 1, 0],
  ])
    palm(s, x, y, 1, { log: trunk, height: h, lean: 5, dx, dy, frond: 4 });

  return s;
}

function background() {
  const W = 2400;
  const H = 1134;
  const layers = [
    bandedSky(
      W,
      H,
      [
        [0, '#f4fafd'],
        [0.5, '#d2ebf8'],
        [1, '#9fd0ee'],
      ],
      10
    ),
    squareSun(640, 330, 110, '#fff2b4', {
      glow: ['#fdf4c8', '#f9f8e4'],
      step: 18,
    }),
    cloud(40, 130, 18, 4, 22, { seed: 21, shadow: '#dcebf5' }),
    cloud(1640, 140, 18, 4, 22, { seed: 22, shadow: '#dcebf5' }),
    cloud(1960, 380, 12, 3, 20, { seed: 23, shadow: '#dcebf5' }),
    cloud(240, 470, 12, 3, 18, { seed: 24, shadow: '#dcebf5', opacity: 0.85 }),
  ];
  // Hills far off, seen over the wings' ends.
  const hill = (x0, base, steps, color) => {
    let d = `M${x0} ${H}`;
    steps.forEach(([dx, y]) => {
      d += `V${base - y}h${dx}`;
    });
    return `<path fill="${color}" d="${d}V${H}z"/>`;
  };
  layers.push(
    hill(
      0,
      820,
      [
        [90, 60],
        [110, 90],
        [140, 120],
        [120, 100],
        [160, 70],
        [200, 40],
        [180, 20],
      ],
      '#9ec7a8'
    ),
    hill(
      1480,
      820,
      [
        [160, 30],
        [180, 60],
        [150, 90],
        [130, 120],
        [140, 100],
        [120, 80],
        [140, 60],
        [120, 40],
      ],
      '#9ec7a8'
    )
  );
  const r = renderScene(hotelResort(), { light: { color: '#3a1e14', ao: 0 } });
  layers.push(place(r, anchor(12, [0, 0, 0], [1200, 600])));
  return document({
    width: W,
    height: H,
    label:
      'A blocky hotel by day: a terracotta tower and two wings round a courtyard pool, with loungers, parasols and palms',
    layers,
  });
}

export default [
  {
    path: 'public/media/background.svg',
    depicts:
      'A blocky hotel by day: a terracotta tower on the corner of two long wings that wrap a courtyard pool, with loungers, striped parasols and palms under a pale banded sky; the background of the full-height welcome.',
    draw: background,
  },
  {
    path: 'public/media/room-gold-single.svg',
    depicts:
      'A blocky single hotel room in warm gold tones: a single bed, a lamp on a nightstand, a gold armchair, a suitcase and a window at sunset.',
    draw: () =>
      roomImage(
        roomGoldSingle(),
        theme('gold'),
        'A blocky single room in gold tones'
      ),
  },
  {
    path: 'public/media/room-gold-double.svg',
    depicts:
      'A blocky double hotel room in warm gold tones: a wide bed with a tufted gold headboard between two lamps, a framed print, a bench and a draped window.',
    draw: () =>
      roomImage(
        roomGoldDouble(),
        theme('gold'),
        'A blocky double room in gold tones'
      ),
  },
  {
    path: 'public/media/room-diamond-single.svg',
    depicts:
      'A blocky single hotel room in cool blues: a single bed with a navy headboard under a round mirror, a writing desk with a lamp, and a window on a city skyline at dusk.',
    draw: () =>
      roomImage(
        roomDiamondSingle(),
        theme('diamond'),
        'A blocky single room in cool blues'
      ),
  },
  {
    path: 'public/media/room-diamond-double.svg',
    depicts:
      'A blocky double hotel room in cool blues: a wide bed with a navy headboard between two lamps, a tall plant and glass doors onto a balcony over the sea.',
    draw: () =>
      roomImage(
        roomDiamondDouble(),
        theme('diamond'),
        'A blocky double room in cool blues'
      ),
  },
  {
    path: 'public/media/reception.svg',
    depicts:
      'A blocky hotel reception: a marble-topped wooden desk with a bell and flowers under three pendant lamps, a slatted wall with room keys in pigeonholes, clocks, and a potted palm.',
    draw: reception,
  },
  {
    path: 'public/media/gallery-pool.svg',
    depicts:
      'A blocky hotel pool by day, with loungers and striped parasols on its tiled deck and the sea beyond its low white wall.',
    draw: galleryPool,
  },
  {
    path: 'public/media/gallery-restaurant.svg',
    depicts:
      'A blocky hotel restaurant in the evening: tables laid in white with candles under glowing pendant lamps, a velvet banquette, and tall windows on a dusk sky.',
    draw: galleryRestaurant,
  },
  {
    path: 'public/media/gallery-spa.svg',
    depicts:
      'A blocky hotel spa: stacked stones, candles, rolled towels, an orchid and lavender on a wooden shelf between bamboo stems, beside a paper screen and a small plunge pool.',
    draw: gallerySpa,
  },
  {
    path: 'public/media/gallery-terrace.svg',
    depicts:
      'A blocky table for two on a hotel terrace, with a candle and wine glasses under strings of lights, as a square sun sets over the sea beyond its railing.',
    draw: galleryTerrace,
  },
  {
    path: 'public/media/gallery-bar.svg',
    depicts:
      'A blocky hotel bar at night: red stools at a wooden counter with two cocktails on it, lit shelves of bottles behind, and a starry window.',
    draw: galleryBar,
  },
];
