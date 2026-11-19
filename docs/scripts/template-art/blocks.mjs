/**
 * The shared block library for the template images: textures and materials
 * every scene can use, so the eight templates read as one set.
 *
 * Every texture is generated here from a palette and a seed, 8 texels a side.
 * They are drawn for these images: none is copied or traced from a game's
 * textures or any other image.
 */
import {
  material,
  mix,
  noise,
  pick,
  shade,
  shades,
  texture,
} from './voxel.mjs';

const N = 8;

// ---------------------------------------------------------------------------
// Texture generators

/** Boards running across the face, with darker seams and a few knots. */
export function planksTexture(id, base, { seed = 3, boards = 4 } = {}) {
  const dark = shade(base, -0.28);
  const light = shade(base, 0.08);
  const h = N / boards;
  return texture(
    id,
    N,
    (u, v, r) => {
      if (v % h === h - 1) return dark;
      const board = Math.floor(v / h);
      if (u === (board * 3 + 2) % N && v % h === 0) return dark;
      return pick(r, [base, light, shade(base, -0.08)], [5, 2, 2]);
    },
    seed
  );
}

/** Bricks in running bond, with mortar lines. */
export function bricksTexture(id, brick, mortar, { seed = 5 } = {}) {
  return texture(
    id,
    N,
    (u, v, r) => {
      if (v % 4 === 3) return mortar;
      const offset = Math.floor(v / 4) % 2 ? 2 : 6;
      if ((u + offset) % 4 === 0) return mortar;
      return pick(
        r,
        [brick, shade(brick, -0.1), shade(brick, 0.08)],
        [5, 2, 1]
      );
    },
    seed
  );
}

/** Square tiles with grout, for floors and walls. */
export function tilesTexture(
  id,
  tile,
  grout,
  { seed = 7, every = 4, speckle } = {}
) {
  return texture(
    id,
    N,
    (u, v, r) => {
      if (u % every === every - 1 || v % every === every - 1) return grout;
      return speckle ? pick(r, [tile, speckle], [9, 1]) : tile;
    },
    seed
  );
}

/** Vertical streaks: bark, bamboo, reeds. */
export function streaksTexture(id, base, { seed = 9 } = {}) {
  const cols = Array.from(
    { length: N },
    (_, i) =>
      [base, shade(base, -0.15), shade(base, 0.1), shade(base, -0.28)][
        (i * 5 + seed) % 4
      ]
  );
  return texture(
    id,
    N,
    (u, v, r) => (r() < 0.18 ? shade(cols[u], -0.12) : cols[u]),
    seed
  );
}

/** Rings, for the cut end of a log. */
export function ringsTexture(id, wood, bark, { seed = 11 } = {}) {
  return texture(
    id,
    N,
    (u, v) => {
      const d = Math.max(Math.abs(u - 3.5), Math.abs(v - 3.5));
      if (d > 3) return bark;
      return d > 2 ? shade(wood, -0.12) : d > 1 ? wood : shade(wood, -0.18);
    },
    seed
  );
}

/** A framed pane, for windows. */
export function glassTexture(
  id,
  pane,
  frame,
  { seed = 13, shine = '#ffffff' } = {}
) {
  return texture(
    id,
    N,
    (u, v) => {
      if (u === 0 || v === 0 || u === N - 1 || v === N - 1) return frame;
      if (u + v === 5 || u + v === 6) return mix(pane, shine, 0.55);
      if (u + v === 9) return mix(pane, shine, 0.3);
      return pane;
    },
    seed
  );
}

/** A side face with a top fringe in another color: grass over soil, snow over stone. */
export function fringeTexture(id, top, under, { seed = 15, depth = 2 } = {}) {
  const depths = Array.from(
    { length: N },
    (_, u) => depth + ((u * 7 + seed) % 3 === 0 ? 1 : 0)
  );
  return texture(
    id,
    N,
    (u, v, r) => {
      if (v < depths[u]) return pick(r, top, [3, 2, 1]);
      return pick(r, under, [4, 2, 1]);
    },
    seed
  );
}

/** Wavy rows, for water seen from above. */
export function waterTexture(id, base, { seed = 17 } = {}) {
  const lt = shade(base, 0.18);
  const dk = shade(base, -0.08);
  return texture(
    id,
    N,
    (u, v, r) => {
      if ((u + 2 * v) % 8 === 0 && r() < 0.8) return lt;
      return r() < 0.25 ? dk : base;
    },
    seed
  );
}

/** Leaves: a clump of greens with a few dark gaps. */
export function leavesTexture(id, base, { seed = 19 } = {}) {
  return noise(
    id,
    [base, shade(base, 0.12), shade(base, -0.15), shade(base, -0.35)],
    {
      weights: [5, 3, 3, 1],
      seed,
    }
  );
}

// ---------------------------------------------------------------------------
// The palette

export const C = {
  grass: '#6aa84f',
  grassLt: '#84c063',
  grassDk: '#4e8a3a',
  soil: '#8a5a3c',
  soilLt: '#9c6a48',
  soilDk: '#6e4630',
  stone: '#8d9096',
  sand: '#e6d39a',
  water: '#3f8fd8',
  sea: '#2f78c4',
  oak: '#b8874f',
  birch: '#d9c28f',
  darkwood: '#6b4a2f',
  bark: '#5d4128',
  leaves: '#4f9a3d',
  palm: '#5db047',
  snow: '#f4f7fb',
  terracotta: '#c8714a',
  cream: '#f1e6cf',
  white: '#f6f4ef',
  glass: '#a9d8ee',
  gold: '#f2c230',
  red: '#c9433a',
  navy: '#2e3f73',
  teal: '#2fa39a',
  pink: '#e98fb0',
  lavender: '#a58fd6',
  purple: '#7b55b5',
  orange: '#f08a24',
};

// ---------------------------------------------------------------------------
// Materials

export const T = {
  grassTop: noise(
    'grass-top',
    [C.grass, C.grassLt, C.grassDk, shade(C.grass, 0.2)],
    {
      weights: [5, 3, 3, 1],
      seed: 21,
    }
  ),
  grassSide: fringeTexture(
    'grass-side',
    [C.grass, C.grassLt, C.grassDk],
    [C.soil, C.soilLt, C.soilDk],
    {
      seed: 22,
    }
  ),
  soil: noise('soil', [C.soil, C.soilLt, C.soilDk], {
    weights: [5, 2, 2],
    seed: 23,
  }),
  stone: noise(
    'stone',
    [
      C.stone,
      shade(C.stone, 0.1),
      shade(C.stone, -0.12),
      shade(C.stone, -0.25),
    ],
    {
      weights: [5, 3, 3, 1],
      seed: 24,
    }
  ),
  sand: noise('sand', [C.sand, shade(C.sand, 0.08), shade(C.sand, -0.08)], {
    weights: [5, 2, 2],
    seed: 25,
  }),
  water: waterTexture('water', C.water, { seed: 26 }),
  sea: waterTexture('sea', C.sea, { seed: 27 }),
  oak: planksTexture('oak', C.oak, { seed: 28 }),
  birch: planksTexture('birch', C.birch, { seed: 29 }),
  darkwood: planksTexture('darkwood', C.darkwood, { seed: 30 }),
  bark: streaksTexture('bark', C.bark, { seed: 31 }),
  logTop: ringsTexture('log-top', C.oak, C.bark, { seed: 32 }),
  leaves: leavesTexture('leaves', C.leaves, { seed: 33 }),
  palm: leavesTexture('palm-leaves', C.palm, { seed: 34 }),
  brick: bricksTexture('brick', '#b5553f', '#d8c7b4', { seed: 35 }),
  glass: glassTexture('glass', C.glass, '#e8eef2', { seed: 36 }),
  snowSide: fringeTexture(
    'snow-side',
    [C.snow, '#ffffff', '#e3e9f1'],
    [C.stone, shade(C.stone, -0.1), shade(C.stone, 0.08)],
    {
      seed: 37,
    }
  ),
};

export const M = {
  grass: material({ id: 'grass', top: T.grassTop, side: T.grassSide }),
  soil: material({ id: 'soil', color: T.soil }),
  stone: material({ id: 'stone', color: T.stone }),
  sand: material({ id: 'sand', color: T.sand }),
  water: material({ id: 'water', color: T.water }),
  sea: material({ id: 'sea', color: T.sea }),
  oak: material({ id: 'oak', color: T.oak }),
  birch: material({ id: 'birch', color: T.birch }),
  darkwood: material({ id: 'darkwood', color: T.darkwood }),
  log: material({ id: 'log', top: T.logTop, side: T.bark }),
  leaves: material({ id: 'leaves', color: T.leaves }),
  palm: material({ id: 'palm', color: T.palm }),
  brick: material({ id: 'brick', color: T.brick }),
  glass: material({ id: 'glass', color: T.glass }),
  snow: material({
    id: 'snow',
    top: noise('snow-top', [C.snow, '#ffffff', '#e3e9f1'], { seed: 38 }),
    side: T.snowSide,
  }),
};

const grains = new Map();

/**
 * A block of one color with a grain of texels in shades of it, the look every
 * block-scale scene should use: a flat color reads as plastic, the grain as a
 * block. `id` names the texture, so two calls with the same id share it, and
 * a second call that asks for another color under the same id throws rather
 * than handing back the first. `top` and `side` take their own colors when
 * the faces differ.
 */
export function grain(
  id,
  hex,
  { spread = 0.07, seed, top, side, flat: glow = false } = {}
) {
  const make = (suffix, c) => {
    const key = `${id}${suffix}`;
    const asked = `${c} ${spread} ${seed}`;
    if (grains.has(key) && grains.get(key).asked !== asked) {
      throw new Error(
        `grain "${key}" is already a texture of another color or grain; give this one its own id`
      );
    }
    if (!grains.has(key)) {
      const s =
        seed ??
        [...key].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
      const tex = noise(
        key,
        [c, shade(c, spread), shade(c, -spread), shade(c, -2 * spread)],
        { weights: [6, 3, 3, 1], seed: s }
      );
      grains.set(key, { tex, asked });
    }
    return grains.get(key).tex;
  };
  return material({
    id,
    top: make(top ? '-t' : '', top ?? hex),
    side: make(side ? '-s' : '', side ?? hex),
    flat: glow,
  });
}

/** A flat material in a few shades of one color, for small voxels. */
export function flat(hex, { spread = 0.05, count = 3, glow = false } = {}) {
  return material({ color: shades(hex, spread, count), flat: glow });
}
