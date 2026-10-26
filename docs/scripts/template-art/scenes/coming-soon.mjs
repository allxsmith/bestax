/**
 * Coming Soon: the page's full-screen background, a building site at dawn.
 *
 * The page sets its heading, links, blurb and signup form in the middle, in
 * dark text, so the middle is open sky: the crane stands at the left, the
 * half-built block at the right, and a pale skyline and the rising sun sit
 * low between them, under the form. The ground is one voxel scene with the
 * props, so they stand on it and cast their shadows on it; it runs along the
 * screen's horizontal, the x - y diagonal, and darkens toward the bottom for
 * the footer's white credit.
 */
import {
  Scene,
  document,
  hash3,
  material,
  place,
  renderScene,
  shade,
  texture,
} from '../voxel.mjs';
import { bandedSky, cloud, rect, sprite, squareSun } from '../backdrop.mjs';
import {
  bricksTexture,
  glassTexture,
  grain,
  planksTexture,
} from '../blocks.mjs';

const W = 1920;
const H = 1280;
const HORIZON = 960;
const SCALE = 8; // image pixels per lattice unit

const light = { color: '#1c1f3f', left: 0.14, right: 0.32, reach: 18 };

const V0 = 0; // the far row of ground, x + y, whose tops make the horizon
const OFFSET = { x: W / 2, y: HORIZON - SCALE * (V0 - 2) };
/** Where a world point lands in the image. */
const at = (x, y, z) => [
  OFFSET.x + SCALE * 2 * (x - y),
  OFFSET.y + SCALE * (x + y - 2 * z),
];
/**
 * World x and y for a screen column u = x - y and a depth v = x + y, the
 * depth nudged by one where u and v differ in parity.
 */
const xy = (u, v) => {
  const w = v + (Math.abs(u + v) % 2);
  return [(w + u) / 2, (w - u) / 2];
};

/**
 * A steel lattice: a frame and a cross brace, open between, so the sky shows
 * through. Open texels take no paint, which is why the block is drawn flat
 * (shading would tint the gaps) and each face gets its own shade instead.
 */
function lattice(id, hex) {
  const face = (suffix, c) =>
    texture(`${id}-${suffix}`, 8, (u, v) => {
      if (u === 0 || v === 0 || u === 7 || v === 7) return c;
      if (u === v || u + 1 === v) return shade(c, -0.08);
      return 'none';
    });
  return material({
    id,
    top: face('t', shade(hex, 0.06)),
    left: face('l', shade(hex, -0.12)),
    right: face('r', shade(hex, -0.3)),
    flat: true,
  });
}

/** An open steel frame, a scaffold's cell: the edges only. */
function frame(id, hex) {
  const face = (suffix, c) =>
    texture(`${id}-${suffix}`, 8, (u, v) =>
      u === 0 || v === 0 || u === 7 || v === 7 ? c : 'none'
    );
  return material({
    id,
    top: face('t', shade(hex, 0.1)),
    left: face('l', shade(hex, -0.05)),
    right: face('r', shade(hex, -0.25)),
    flat: true,
  });
}

const tex = (id, t) => material({ id, color: t });

const M = {
  ground: grain('coming-soon-ground', '#7b6a76', { spread: 0.06 }),
  far: [
    grain('coming-soon-far-0', '#a99aa6', { spread: 0.05 }),
    grain('coming-soon-far-1', '#9a8a97', { spread: 0.05 }),
    grain('coming-soon-far-2', '#8a7a87', { spread: 0.06 }),
  ],
  earth: grain('coming-soon-earth', '#6f5f6c', { spread: 0.06 }),
  concrete: grain('coming-soon-concrete', '#a9adbf', { spread: 0.05 }),
  // The slab's sides are the concrete's texture; only its top is lighter.
  slab: grain('coming-soon-concrete', '#a9adbf', {
    top: '#c3c6d3',
    spread: 0.05,
  }),
  mast: lattice('coming-soon-mast', '#f2b134'),
  yellow: grain('coming-soon-yellow', '#f2b134', { spread: 0.05 }),
  cab: grain('coming-soon-cab', '#f3f1ec', { spread: 0.04 }),
  cabGlass: tex(
    'coming-soon-cab-glass',
    glassTexture('coming-soon-cab-glass', '#9cc6e6', '#e9ecf3', { seed: 41 })
  ),
  pallet: tex(
    'coming-soon-pallet',
    planksTexture('coming-soon-pallet', '#b98a55', { seed: 42 })
  ),
  bricks: tex(
    'coming-soon-bricks',
    bricksTexture('coming-soon-bricks', '#c06a4f', '#e3d1bf', { seed: 43 })
  ),
  glass: tex(
    'coming-soon-glass',
    glassTexture('coming-soon-glass', '#a9cbe8', '#eef0f5', { seed: 45 })
  ),
  door: grain('coming-soon-door', '#56476a'),
  frame: frame('coming-soon-frame', '#5f78b6'),
  planks: tex(
    'coming-soon-planks',
    planksTexture('coming-soon-planks', '#c79d62', { seed: 46 })
  ),
  sand: grain('coming-soon-sand', '#dcc08a', { spread: 0.06 }),
  barrier: tex(
    'coming-soon-barrier',
    texture('coming-soon-barrier', 8, (u, v, r) => {
      const c = (u + v) % 8 < 4 ? '#ef7d3a' : '#f4efe8';
      return r() < 0.2 ? shade(c, -0.06) : c;
    })
  ),
  hut: grain('coming-soon-hut', '#6f86c4', { spread: 0.05 }),
};

/** The ground: rows of blocks from the horizon to past the bottom edge. */
function ground(s) {
  for (let v = V0; v < V0 + 39; v++)
    for (let u = -61; u <= 61; u++) {
      if ((u + v) % 2) continue;
      const [x, y] = xy(u, v);
      // Patches a few blocks across, from a coarse grid of hashes.
      const r = hash3(Math.floor(x / 3), Math.floor(y / 3), 0, 21);
      const fine = hash3(x, y, 0, 22);
      const band = Math.floor((v - V0) / 3);
      const mat =
        band < M.far.length
          ? M.far[band]
          : r > 0.72 && fine < 0.85
            ? M.earth
            : M.ground;
      s.set(x, y, 0, mat);
    }
}

/** Replace the ground with a pad, w by d, its corner at (x, y). */
function pad(s, x, y, w, d, mat = M.concrete) {
  for (let i = 0; i < w; i++)
    for (let j = 0; j < d; j++) s.set(x + i, y + j, 0, mat);
}

const MAST = 44;
const JIB = 13;

function crane(s, mx, my) {
  pad(s, mx - 2, my - 2, 6, 6);
  s.box(mx - 1, my - 1, 1, 4, 4, 1, M.concrete);
  s.box(mx, my, 2, 2, 2, MAST, M.mast);
  const top = 2 + MAST;
  // The slewing deck, the cab facing the jib, and the tower head above.
  s.box(mx - 1, my - 1, top, 4, 4, 1, M.yellow);
  s.box(mx + 2, my - 1, top + 1, 2, 2, 2, M.cab);
  s.set(mx + 3, my - 1, top + 2, M.cabGlass);
  s.set(mx + 3, my, top + 2, M.cabGlass);
  s.box(mx, my, top + 1, 1, 1, 6, M.mast);
  // The jib reaches toward the page's middle (screen right and up), the
  // counter-jib the other way with its weights.
  for (let i = 0; i < JIB; i++) s.set(mx, my - 1 - i, top + 1, M.mast);
  for (let i = 0; i < 6; i++) s.set(mx, my + 1 + i, top + 1, M.mast);
  s.box(mx, my + 4, top - 1, 1, 3, 2, M.concrete);
  // The load on the hook, a pallet of bricks on its way up.
  const hook = [mx, my - 5];
  const lz = top - 18;
  s.box(hook[0], hook[1] - 1, lz, 2, 2, 1, M.pallet);
  s.box(hook[0], hook[1] - 1, lz + 1, 2, 2, 1, M.bricks);
  return {
    trolley: at(hook[0] + 0.5, hook[1] - 0.5, top + 1),
    load: at(hook[0] + 1, hook[1], lz + 2),
    head: at(mx + 0.5, my + 0.5, top + 7),
    tip: at(mx + 0.5, my - JIB - 0.5, top + 2),
    tail: at(mx + 0.5, my + 6.5, top + 2),
  };
}

function siteHut(s, x, y) {
  s.box(x, y, 1, 3, 5, 3, M.hut);
  s.box(x, y, 4, 3, 5, 1, M.cab);
  s.set(x + 3 - 1, y + 2, 2, null);
  s.set(x + 1, y + 4, 2, M.cabGlass);
  s.set(x + 2, y + 1, 2, M.cabGlass);
  s.set(x + 2, y + 3, 2, M.cabGlass);
  s.set(x + 2, y + 2, 1, M.door);
  s.set(x + 2, y + 2, 2, M.door);
}

/** A row of striped barrier blocks, n long, along x or along y. */
function barrier(s, x, y, n, alongX = true) {
  for (let i = 0; i < n; i++)
    s.set(alongX ? x + i : x, alongX ? y : y + i, 1, M.barrier);
}

const BW = 12;
const BD = 9;
const STOREY = 4;
const FLOORS = 5;

function building(s, X0, Y0) {
  pad(s, X0 - 1, Y0 - 1, BW + 2, BD + 2);
  for (let f = 0; f < FLOORS; f++) {
    const z = 1 + f * STOREY;
    s.box(X0, Y0, z, BW, BD, 1, M.slab);
    // Columns at the corners and between.
    for (const cx of [X0, X0 + 6, X0 + BW - 1])
      for (const cy of [Y0, Y0 + BD - 1])
        s.box(cx, cy, z + 1, 1, 1, STOREY - 1, M.concrete);
    s.box(X0, Y0 + 4, z + 1, 1, 1, STOREY - 1, M.concrete);
    s.box(X0 + BW - 1, Y0 + 4, z + 1, 1, 1, STOREY - 1, M.concrete);
    // Walls: the lower floors finished, the next one half laid, the top
    // floor still bare columns.
    const rows = f < 3 ? STOREY - 1 : f === 3 ? 1 : 0;
    for (let k = 0; k < rows; k++) {
      const wz = z + 1 + k;
      for (let x = X0 + 1; x < X0 + BW - 1; x++) {
        if (x === X0 + 6) continue;
        const win = k === 1 && (x - X0) % 6 >= 2 && (x - X0) % 6 <= 4;
        s.set(x, Y0 + BD - 1, wz, win ? M.glass : M.bricks);
        s.set(x, Y0, wz, M.bricks);
      }
      for (let y = Y0 + 1; y < Y0 + BD - 1; y++) {
        if (y === Y0 + 4) continue;
        const win = k === 1 && y !== Y0 + 1 && y !== Y0 + BD - 2;
        s.set(X0 + BW - 1, y, wz, win ? M.glass : M.bricks);
        s.set(X0, y, wz, M.bricks);
      }
    }
  }
  // The door on the long side.
  s.box(X0 + 2, Y0 + BD - 1, 2, 2, 1, 2, M.door);
  // On the top floor, a pallet of bricks the crane brought up.
  s.box(X0 + 2, Y0 + 2, 2 + 4 * STOREY, 2, 2, 1, M.pallet);
  s.box(X0 + 2, Y0 + 2, 3 + 4 * STOREY, 2, 2, 1, M.bricks);
}

/** A pallet of bricks, two by two by two, its corner at (x, y). */
function bricks(s, x, y) {
  s.box(x, y, 1, 2, 2, 1, M.pallet);
  s.box(x, y, 2, 2, 2, 1, M.bricks);
}

/** A heap of sand: a round base, stepping up to a peak. */
function sandHeap(s, x, y) {
  for (let i = 0; i < 5; i++)
    for (let j = 0; j < 5; j++) {
      const d = Math.abs(i - 2) + Math.abs(j - 2);
      const h = d <= 1 ? 3 : d <= 2 ? 2 : d <= 3 ? 1 : 0;
      for (let k = 1; k <= h; k++) s.set(x + i, y + j, k, M.sand);
    }
}

/**
 * Scaffolding up the long side's upper floors: open steel frames with plank
 * decks. It is a scene of its own, drawn over the building on the same grid,
 * so the building shows through the frames.
 */
function scaffold(X0, Y0) {
  const s = new Scene({ seed: 14 });
  const y = Y0 + BD;
  for (let z = 1; z <= FLOORS * STOREY + 1; z++)
    for (let x = X0 + 5; x < X0 + BW; x++) {
      const deck = (z - 1) % STOREY === 0;
      s.set(x, y, z, deck ? M.planks : M.frame);
    }
  return s;
}

/** A flat, pale skyline far off, a few windows lit by the dawn. */
function skyline(seed, base, color, lit, { minH, maxH, gap }) {
  let x = -20;
  let d = '';
  let w = '';
  let i = 0;
  while (x < W + 20) {
    const bw = 60 + Math.floor(hash3(i, seed, 0, seed) * 4) * 20;
    const bh =
      minH +
      Math.floor(hash3(i, seed, 1, seed) * ((maxH - minH) / 20 + 1)) * 20;
    d += `M${x} ${base - bh}h${bw}v${bh}h${-bw}z`;
    for (let wy = base - bh + 20; wy < base - 20; wy += 30)
      for (let wx = x + 14; wx < x + bw - 14; wx += 24)
        if (hash3(wx, wy, i, seed) < 0.2) w += `M${wx} ${wy}h10v12h-10z`;
    x += bw + gap;
    i++;
  }
  return `<path fill="${color}" d="${d}"/><path fill="${lit}" d="${w}"/>`;
}

function background() {
  const layers = [];
  // A flat base under the sky's bands: the page shows the image shrunk, and
  // where two bands meet on a fraction of a pixel, the base shows through
  // rather than the page's own background.
  layers.push(rect(0, 0, W, HORIZON, '#e6e1ee'));
  layers.push(
    bandedSky(
      W,
      HORIZON,
      [
        [0, '#dfe2f0'],
        [0.5, '#e6e3f1'],
        [0.78, '#f1e0e6'],
        [1, '#f8dcc8'],
      ],
      12
    )
  );
  layers.push(
    squareSun(W / 2, HORIZON - 70, 150, '#fff6e6', {
      glow: ['#f5e1d8', '#f9e6d8', '#fcede0'],
      step: 30,
    })
  );
  for (const [x, y, w, h, seed, o] of [
    [120, 190, 22, 3, 3, 0.9],
    [1460, 150, 26, 3, 5, 0.9],
    [1540, 480, 12, 2, 7, 0.6],
    [660, 120, 10, 2, 9, 0.55],
  ])
    layers.push(
      cloud(x, y, w, h, 16, {
        seed,
        color: '#f7f6fb',
        shadow: '#dcdcec',
        opacity: o,
      })
    );
  // A few birds out early.
  const bird = ['x...x', '.x.x.', '..x..'];
  for (const [x, y, px] of [
    [1560, 330, 6],
    [1625, 300, 5],
    [1600, 362, 4],
  ])
    layers.push(sprite(bird, { x: '#8d88ad' }, x, y, px));
  layers.push(
    skyline(2, HORIZON, '#d3d3e5', '#f3e3d6', {
      minH: 60,
      maxH: 160,
      gap: 30,
    })
  );
  layers.push(
    skyline(5, HORIZON, '#babcd6', '#f4dcc4', {
      minH: 40,
      maxH: 100,
      gap: 70,
    })
  );
  // Under the scene, a flat ground color for the crane's open lattice to
  // show where it stands in front of the ground.
  layers.push(rect(0, HORIZON, W, H - HORIZON, '#7b6a76'));

  const s = new Scene({ seed: 13 });
  ground(s);
  const [cx, cy] = xy(-45, 16);
  const c = crane(s, cx, cy);
  siteHut(s, ...xy(-52, 12));
  const VB = 4; // the building's depth
  const [bx, by] = xy(34, VB);
  building(s, bx, by);
  bricks(s, ...xy(21, VB + 10));
  sandHeap(s, ...xy(50, VB + 14));
  barrier(s, ...xy(19, VB + 17), 4);
  bricks(s, ...xy(-34, 22));
  const r = renderScene(s, { light });
  layers.push(place(r, { scale: SCALE, ...OFFSET }));
  layers.push(
    place(renderScene(scaffold(bx, by), { light }), { scale: SCALE, ...OFFSET })
  );

  // The crane's ropes: the hook's line, and ties from the tower head.
  const p = ([x, y]) => `${Math.round(x)} ${Math.round(y)}`;
  layers.push(
    `<path fill="none" stroke="#5b5f78" stroke-width="3" d="M${p(c.head)}L${p(c.tip)}M${p(c.head)}L${p(c.tail)}"/>`
  );
  layers.push(
    rect(
      c.trolley[0] - 1.5,
      c.trolley[1],
      3,
      c.load[1] - c.trolley[1] - 16,
      '#4b4f68'
    )
  );

  // Dusk on the near ground, for the footer's credit: veils stacked from
  // each step to the bottom, so no two meet edge to edge.
  for (const y of [1120, 1160, 1200, 1240])
    layers.push(rect(0, y, W, H - y, '#1f1d38', 0.1));

  return document({
    width: W,
    height: H,
    label:
      'A blocky building site at dawn, with a tower crane at the left and a half-built block in scaffolding at the right',
    layers,
  });
}

export default [
  {
    path: 'public/media/background.svg',
    depicts:
      "A blocky building site at dawn: a yellow tower crane lifting a pallet of bricks at the left, a half-built brick block with scaffolding at the right, and a pale skyline under a rising square sun between them; the page's full-screen background.",
    draw: background,
  },
];
