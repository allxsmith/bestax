/**
 * Tropico: a fruit shop's pictures, as blocky voxel fruit. Fruit is built of
 * small blocks: an orange is a grained sphere with a leaf on its stalk, and a
 * halved fruit shows its flesh and seeds on the cut face, which faces up.
 */
import {
  Scene,
  cos,
  document,
  fit,
  hash3,
  material,
  noise,
  place,
  renderScene,
  rng,
  shade,
  sin,
  texture,
} from '../voxel.mjs';
import { bandedSky } from '../backdrop.mjs';
import { grain } from '../blocks.mjs';

const TAU = 6.283185307179586;

// ---------------------------------------------------------------------------
// Materials, made once and shared by every image.

/**
 * A grained block for fruit-sized voxels: one color with a coarse grain of
 * 4 by 4 texels in shades of it, which reads at the small size these blocks
 * are drawn and costs a quarter of a full texture.
 */
function fine(id, hex, { spread = 0.06, top, flat = false } = {}) {
  const tex = (key, c) =>
    noise(key, [c, shade(c, spread), shade(c, -spread)], {
      size: 4,
      weights: [5, 3, 3],
      seed: [...key].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7),
    });
  const side = tex(id, hex);
  return material({
    id,
    top: top ? tex(`${id}-t`, top) : side,
    side,
    flat,
  });
}

/** Three bands of one color, lit to dark, for a round thing's baked light. */
function bands(id, hex, { hi, lo, spread = 0.05 } = {}) {
  return [
    fine(`${id}-1`, hi ?? shade(hex, 0.16), { spread }),
    fine(`${id}-2`, hex, { spread }),
    fine(`${id}-3`, lo ?? shade(hex, -0.14), { spread }),
  ];
}

/** A small accent block: two flat shades of one color, picked per block. */
function dot(hex, spread = 0.06) {
  return material({ color: [hex, shade(hex, -spread)] });
}

const peel = bands('tropico-peel', '#ff8a14', { hi: '#ffaa3a', lo: '#ec6f0c' });
const fleshA = fine('tropico-flesh-a', '#ffa21f', { spread: 0.07 });
const fleshB = fine('tropico-flesh-b', '#ffb93f', { spread: 0.07 });
const pith = fine('tropico-pith', '#fff3d6', { spread: 0.03 });
const membrane = dot('#ffe2a0', 0.03);
const rindCut = fine('tropico-rind-cut', '#f47a0c', { spread: 0.05 });
const stalk = dot('#6b4a22');
const leaf = fine('tropico-leaf', '#2b8a3c', { spread: 0.07 });
const leafLt = fine('tropico-leaf-lt', '#45a849', { spread: 0.06 });
const leafVein = dot('#8ad46a', 0.04);
const wood = bands('tropico-wood', '#c4864c', { hi: '#d99a5e', lo: '#a26a3a' });
const woodRing = fine('tropico-wood-ring', '#a66c3b', { spread: 0.05 });
const woodIn = woodRing;
const pineSkin = bands('tropico-pine', '#e9b52f', {
  hi: '#f7cf55',
  lo: '#c98f1f',
});
const pineLine = fine('tropico-pine-line', '#8f6a1c', { spread: 0.06 });
const pineEye = dot('#6e5418');
const banana = bands('tropico-banana', '#ffd333', {
  hi: '#ffe46b',
  lo: '#e3aa1c',
});
const bananaEnd = dot('#5e4a1c');
const mango3 = [
  fine('tropico-mango-r', '#ec4f3a', { spread: 0.05 }),
  fine('tropico-mango-o', '#ff8a2a', { spread: 0.05 }),
  fine('tropico-mango-y', '#e2c23a', { spread: 0.05 }),
];
const papayaLt = fine('tropico-papaya', '#c3cc42', { spread: 0.05 });
const papayaDk = fine('tropico-papaya-dk', '#94a32e', { spread: 0.05 });
const papayaSkin = [papayaLt, papayaDk, papayaDk];
const papayaRim = dot('#ffcf6e', 0.04);
const papayaFlesh = fine('tropico-papaya-flesh', '#ff9442', { spread: 0.06 });
const papayaCore = dot('#f27a35');
const seed = dot('#2a1d1a', 0.12);
const guavaSkin = bands('tropico-guava', '#86b93f', {
  hi: '#a8d05a',
  lo: '#64952f',
});
const guavaBlush = fine('tropico-guava-blush', '#b8d35e', { spread: 0.05 });
const guavaRim = fine('tropico-guava-rim', '#fbdccb', { spread: 0.03 });
const guavaFlesh = fine('tropico-guava-flesh', '#f2788a', { spread: 0.06 });
const guavaPulp = fine('tropico-guava-pulp', '#e65a72', { spread: 0.06 });
const guavaSeed = dot('#f5e3ae', 0.04);
const limeRind = fine('tropico-lime-rind', '#3f8f2a', { spread: 0.05 });
const limePith = fine('tropico-lime-pith', '#eef5c8', { spread: 0.03 });
const limeA = fine('tropico-lime-a', '#9ccf3e', { spread: 0.07 });
const limeB = fine('tropico-lime-b', '#b5dc5a', { spread: 0.07 });
const limeSkin = dot('#d6ec9a', 0.03);
const kiwiSkin = fine('tropico-kiwi-skin', '#7a5a33', { spread: 0.07 });
const kiwiA = fine('tropico-kiwi-a', '#7dbb34', { spread: 0.07 });
const kiwiB = fine('tropico-kiwi-b', '#95cb45', { spread: 0.07 });
const kiwiCore = fine('tropico-kiwi-core', '#eef0c2', { spread: 0.03 });
const berryRed = bands('tropico-berry', '#e3343c', {
  hi: '#f45a55',
  lo: '#b8222e',
});
const berrySeed = dot('#ffd65a', 0.04);
const blue = bands('tropico-blue', '#3d4f9e', { hi: '#6577c2', lo: '#2b3878' });
const blueEye = dot('#1e2650', 0.05);
const pineFleshA = fine('tropico-pine-flesh-a', '#ffd23f', { spread: 0.06 });
const pineFleshB = fine('tropico-pine-flesh-b', '#ffe06a', { spread: 0.06 });
const pineRind = fine('tropico-pine-rind', '#a8782a', { spread: 0.08 });
const lemonRind = fine('tropico-lemon-rind', '#f2cf1d', { spread: 0.05 });
const lemonA = fine('tropico-lemon-a', '#fbe86a', { spread: 0.06 });
const lemonB = fine('tropico-lemon-b', '#fff18e', { spread: 0.06 });
const leafBig = fine('tropico-leaf-big', '#2e7f37', { spread: 0.06 });
const leafBigLt = fine('tropico-leaf-big-lt', '#3f9640', { spread: 0.06 });
const seedHi = dot('#5a4a40', 0.08);

// The direction the baked light comes from: up, and toward the viewer's left.
const SUN = (() => {
  const v = [-0.35, 0.55, 0.76];
  const n = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  return v.map(c => c / n);
})();

/** Pick a band for a surface normal (nx, ny, nz). */
function lit(mats, nx, ny, nz) {
  const l = nx * SUN[0] + ny * SUN[1] + nz * SUN[2];
  return mats[l > 0.55 ? 0 : l > -0.1 ? 1 : 2];
}

// ---------------------------------------------------------------------------
// Builders

/**
 * An ellipsoid of blocks centred on (cx, cy, cz), each block's material from
 * `mat(i, j, k, nx, ny, nz)`, the normal of the surface nearest it.
 */
function blob(s, cx, cy, cz, rx, ry, rz, mat) {
  for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++)
    for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++)
      for (let k = Math.floor(cz - rz); k <= Math.ceil(cz + rz); k++) {
        const dx = (i + 0.5 - cx) / rx;
        const dy = (j + 0.5 - cy) / ry;
        const dz = (k + 0.5 - cz) / rz;
        const d = dx * dx + dy * dy + dz * dz;
        if (d > 1) continue;
        const n = Math.sqrt(d) || 1;
        const m = mat(i, j, k, dx / n, dy / n, dz / n);
        if (m) s.set(i, j, k, m);
      }
}

/** A whole orange of radius r, its lowest layer at z, with a stalk and leaf. */
function orange(s, cx, cy, z, r, { leafDir = [1, 0], leaves = 1 } = {}) {
  const rz = r * 0.94;
  blob(s, cx, cy, z + rz, r, r, rz, (i, j, k, nx, ny, nz) =>
    lit(peel, nx, ny, nz)
  );
  // The stalk on the highest block over the centre.
  const sx = Math.floor(cx);
  const sy = Math.floor(cy);
  let top = z;
  while (s.has(sx, sy, top)) top++;
  s.set(sx, sy, top, stalk);
  for (let n = 0; n < leaves; n++) {
    const [ux, uy] = n === 0 ? leafDir : [-leafDir[1], leafDir[0]];
    leafBlade(s, sx, sy, top, ux, uy, Math.max(4, Math.round(r * 0.75)));
  }
  return top;
}

/**
 * A small leaf on a stalk at (x, y, z), lying along (ux, uy) and rising a
 * block every few: a pale midrib and a blade either side, widest in the
 * middle.
 */
function leafBlade(s, x, y, z, ux, uy, len) {
  const vx = -uy;
  const vy = ux;
  for (let t = 1; t <= len; t++) {
    const k = z + Math.floor((t - 1) / 3);
    const px = x + ux * t;
    const py = y + uy * t;
    s.set(px, py, k, t < len ? leafVein : leaf);
    const w = t === 1 || t === len ? 0 : t < len - 1 && len > 5 ? 2 : 1;
    for (let q = 1; q <= w; q++) {
      s.set(px + vx * q, py + vy * q, k, leafLt);
      s.set(px - vx * q, py - vy * q, k, leaf);
    }
  }
}

/** The segment (0 to n - 1) the direction (dx, dy) falls in. */
function sector(dx, dy, n, turn = 0.3) {
  for (let k = 0; k < n; k++) {
    const a0 = (TAU * k) / n + turn;
    const a1 = (TAU * (k + 1)) / n + turn;
    const c0 = cos(a0) * dy - sin(a0) * dx;
    const c1 = cos(a1) * dy - sin(a1) * dx;
    if (c0 >= 0 && c1 < 0) return k;
  }
  return 0;
}

/** Whether (dx, dy) lies on one of the n membranes between segments. */
function onMembrane(dx, dy, n, turn = 0.3) {
  for (let k = 0; k < n; k++) {
    const a = (TAU * k) / n + turn;
    const ux = cos(a);
    const uy = sin(a);
    if (dx * ux + dy * uy > 0 && Math.abs(dx * uy - dy * ux) < 0.5) return true;
  }
  return false;
}

/**
 * The cut face of a citrus fruit, as the material of the block at (dx, dy)
 * from its centre: rind, pith, segments in two tones split by membranes, and
 * a pale core.
 */
function citrusFace(dx, dy, r, n, { rind, pithMat, core, a, b, skin }) {
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > r - 0.9) return rind;
  if (d > r - 1.9) return pithMat;
  if (d < 1.2) return core;
  if (d > 2.2 && onMembrane(dx, dy, n)) return skin;
  return sector(dx, dy, n) % 2 ? a : b;
}

/** Half an orange, lying cut face up: a dome under a disc of segments. */
function halfOrange(s, cx, cy, z, r) {
  const h = Math.round(r * 0.9);
  blob(s, cx, cy, z + h, r, r, h, (i, j, k, nx, ny, nz) => {
    if (k >= z + h) return null;
    if (k === z + h - 1)
      return citrusFace(i + 0.5 - cx, j + 0.5 - cy, r, 9, {
        rind: rindCut,
        pithMat: pith,
        core: pith,
        a: fleshA,
        b: fleshB,
        skin: membrane,
      });
    return lit(peel, nx, ny, -nz * 0.3 + 0.5);
  });
}

/**
 * A flat leaf standing in a vertical plane: `plane` 'xz' faces +y (the
 * viewer's left) and 'yz' faces +x. It starts at (x, y, z) and runs `len`
 * blocks along the in-plane direction (h, v), h along the plane's
 * horizontal axis and v up, bending by `bend` radians by its tip. Up to `w`
 * either side of a pale rib, in two greens.
 */
function leafPlane(s, x, y, z, plane, [h, v], len, w, { bend = 0, mats } = {}) {
  const [rib, a, b] = mats ?? [leafVein, leafLt, leaf];
  const n0 = Math.sqrt(h * h + v * v);
  let dh = h / n0;
  let dv = v / n0;
  let ph = 0;
  let pv = 0;
  const steps = len * 3;
  for (let n = 0; n <= steps; n++) {
    const f = n / steps;
    const half =
      w * Math.sqrt(Math.max(0, sin(Math.PI * Math.min(1, f * 1.08))));
    for (let q = -half; q <= half + 1e-9; q += 0.34) {
      const m = Math.abs(q) < 0.4 ? rib : q > 0 ? a : b;
      const hh = ph - dv * q;
      const vv = pv + dh * q;
      const i = plane === 'xz' ? Math.floor(x + hh) : x;
      const j = plane === 'xz' ? y : Math.floor(y + hh);
      const k = Math.floor(z + vv);
      if (m === rib || !s.has(i, j, k)) s.set(i, j, k, m);
    }
    ph += dh / 3;
    pv += dv / 3;
    const turn = bend / steps;
    const c = cos(turn);
    const sn = sin(turn);
    [dh, dv] = [dh * c - dv * sn, dh * sn + dv * c];
  }
}

/** A pineapple standing at (cx, cy) on z: a diamond-scaled body and a crown. */
function pineapple(s, cx, cy, z, r, h) {
  const cz = z + h / 2;
  blob(s, cx, cy, cz, r, r, h / 2, (i, j, k, nx, ny, nz) => {
    const u = i - j;
    const a = (((u + k) % 4) + 4) % 4;
    const b = (((u - k) % 4) + 4) % 4;
    if (a === 0 || b === 0) return pineLine;
    if (a === 2 && b === 2) return pineEye;
    return lit(pineSkin, nx, ny, nz);
  });
  let top = z;
  const tx = Math.floor(cx);
  const ty = Math.floor(cy);
  while (s.has(tx, ty, top)) top++;
  // The crown: stiff pointed leaves fanning up from the top, in two planes.
  const spikes = [
    ['xz', [0, 1], 8, 0],
    ['xz', [-0.55, 1], 7, -0.3],
    ['xz', [0.55, 1], 7, 0.3],
    ['yz', [-0.5, 1], 7, -0.3],
    ['yz', [0.5, 1], 6, 0.3],
  ];
  for (const [plane, dir, len, bend] of spikes)
    leafPlane(s, tx, ty, top - 1, plane, dir, len, 1.1, { bend });
}

/**
 * A banana curved like a smile, `len` blocks long from (x, y, z) along the
 * level direction (ux, uy), its ends lifting `lift` blocks: a tube that thins
 * to each end, with a dark tip at both. Along (1, -1) it runs straight
 * across the picture, so its curve shows true.
 */
function bananaSmile(
  s,
  x,
  y,
  z,
  [ux, uy],
  len,
  { thick = 1.5, lift = 3 } = {}
) {
  const hn = Math.sqrt(ux * ux + uy * uy);
  const steps = Math.ceil(len * 3);
  for (let n = 0; n <= steps; n++) {
    const f = n / steps;
    const e = 2 * f - 1;
    const px = x + (ux / hn) * len * f;
    const py = y + (uy / hn) * len * f;
    const pz = z + thick + lift * e * e;
    const t = thick * (1 - 0.65 * e * e * e * e);
    const end = f < 0.035 || f > 0.965;
    for (let i = Math.floor(px - t); i <= Math.ceil(px + t); i++)
      for (let j = Math.floor(py - t); j <= Math.ceil(py + t); j++)
        for (let k = Math.floor(pz - t); k <= Math.ceil(pz + t); k++) {
          const dx = i + 0.5 - px;
          const dy = j + 0.5 - py;
          const dz = k + 0.5 - pz;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d > t) continue;
          s.set(
            i,
            j,
            k,
            end
              ? bananaEnd
              : lit(banana, dx / (d || 1), dy / (d || 1), dz / (d || 1))
          );
        }
  }
}

/** A mango lying on its side: red where the sun caught it, then orange, then yellow. */
function mango(s, cx, cy, z, rx, ry, rz) {
  blob(s, cx, cy, z + rz, rx, ry, rz, (i, j, k, nx, ny, nz) => {
    const warmth = nz * 0.7 - nx * 0.6 + (hash3(i, j, k, 4) - 0.5) * 0.35;
    return mango3[warmth > 0.25 ? 0 : warmth > -0.35 ? 1 : 2];
  });
}

/** Half a papaya, lying cut face up along x: orange flesh round a row of seeds. */
function halfPapaya(s, cx, cy, z, rx, ry, h) {
  blob(s, cx, cy, z + h, rx, ry, h, (i, j, k, nx, ny, nz) => {
    if (k >= z + h) return null;
    if (k < z + h - 1) return lit(papayaSkin, nx, ny, -nz * 0.3 + 0.5);
    const dx = (i + 0.5 - cx) / rx;
    const dy = (j + 0.5 - cy) / ry;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > 0.86) return papayaSkin[0];
    if (d > 0.74) return papayaRim;
    const cavity = (dx * dx) / 0.42 + (dy * dy) / 0.16;
    if (cavity < 0.55) return hash3(i, j, 7) < 0.3 ? seedHi : seed;
    if (cavity < 1) return papayaCore;
    return papayaFlesh;
  });
}

/**
 * An orange slice standing on edge, its cut face toward +y (the viewer's
 * left): a disc in the plane y = cy.
 */
function standingSlice(s, cx, cy, z, r) {
  const cz = z + r;
  for (let i = Math.floor(cx - r); i <= Math.ceil(cx + r); i++)
    for (let k = z; k <= Math.ceil(cz + r); k++) {
      const dx = i + 0.5 - cx;
      const dz = k + 0.5 - cz;
      if (dx * dx + dz * dz > r * r) continue;
      const face = citrusFace(dx, dz, r, 8, {
        rind: rindCut,
        pithMat: pith,
        core: pith,
        a: fleshA,
        b: fleshB,
        skin: membrane,
      });
      s.set(i, cy, k, face);
      s.set(i, cy - 1, k, rindCut);
    }
}

/**
 * A turned wooden bowl centred on (cx, cy): rim radius R, foot radius
 * `foot`, H blocks deep, its rings in two woods and its hollow filled to
 * `fill` blocks below the rim for the fruit to rest on.
 */
function bowl(s, cx, cy, z, R, foot, H, fill = 2) {
  const radius = k => foot + (R - foot) * Math.sqrt(Math.min(1, (k + 0.6) / H));
  for (let k = 0; k < H; k++) {
    const r = radius(k);
    const ringed = k % 3 === 1;
    for (let i = Math.floor(cx - r); i <= Math.ceil(cx + r); i++)
      for (let j = Math.floor(cy - r); j <= Math.ceil(cy + r); j++) {
        const dx = i + 0.5 - cx;
        const dy = j + 0.5 - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > r) continue;
        const wall = d > r - 1.6 || k === 0;
        if (wall) {
          const n = d || 1;
          const m = lit(wood, dx / n, dy / n, k === H - 1 ? 0.9 : 0);
          s.set(i, j, z + k, ringed && m !== wood[0] ? woodRing : m);
        } else if (k < H - fill) s.set(i, j, z + k, woodIn);
      }
  }
}

/**
 * A guava: a round fruit a little narrower at the top, green with a yellow
 * blush, and a small brown nub on top.
 */
function guava(s, cx, cy, z, r) {
  const rz = r * 1.04;
  const cz = z + rz;
  blob(s, cx, cy, cz, r * 1.08, r * 1.08, rz, (i, j, k, nx, ny, nz) => {
    // Narrower toward the top.
    const dx = i + 0.5 - cx;
    const dy = j + 0.5 - cy;
    const lim = r * 1.08 * (1 - 0.16 * Math.max(0, nz));
    if (dx * dx + dy * dy > lim * lim) return null;
    if (nz > -0.1 && nz < 0.55 && ny > 0.35 && hash3(i, j, k, 6) < 0.5)
      return guavaBlush;
    return lit(guavaSkin, nx, ny, nz);
  });
  // The dried flower end on top: a small dark cross.
  const tx = Math.floor(cx);
  const ty = Math.floor(cy);
  let top = z;
  while (s.has(tx, ty, top)) top++;
  for (const [i, j] of [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ])
    s.set(tx + i, ty + j, top - (i || j ? 1 : 0), stalk);
}

/** Half a guava, lying cut face up: pink flesh, a pale rim and a ring of seeds. */
function halfGuava(s, cx, cy, z, r) {
  const h = Math.round(r * 0.95);
  blob(s, cx, cy, z + h, r, r, h, (i, j, k, nx, ny, nz) => {
    if (k >= z + h) return null;
    if (k < z + h - 1) return lit(guavaSkin, nx, ny, -nz * 0.3 + 0.5);
    const dx = i + 0.5 - cx;
    const dy = j + 0.5 - cy;
    const d = Math.sqrt(dx * dx + dy * dy) / r;
    if (d > 0.9) return guavaSkin[1];
    if (d > 0.78) return guavaRim;
    if (d > 0.62) return guavaFlesh;
    if (d > 0.36) return hash3(i, j, 8) < 0.42 ? guavaSeed : guavaPulp;
    return guavaPulp;
  });
}

/**
 * A broad leaf lying flat on z, centred on (cx, cy), `len` long along the
 * level direction (ux, uy) and up to `w` wide: a pale midrib, side veins
 * running out toward the tip, and two greens either side.
 */
function flatLeaf(s, cx, cy, z, [ux, uy], len, w, { stalkLen = 3 } = {}) {
  const n = Math.sqrt(ux * ux + uy * uy);
  const ax = ux / n;
  const ay = uy / n;
  const R = Math.ceil(len / 2 + w);
  for (let i = Math.floor(cx - R); i <= Math.ceil(cx + R); i++)
    for (let j = Math.floor(cy - R); j <= Math.ceil(cy + R); j++) {
      const dx = i + 0.5 - cx;
      const dy = j + 0.5 - cy;
      const t = (dx * ax + dy * ay) / len + 0.5; // 0 at the stalk, 1 at the tip
      const v = -dx * ay + dy * ax;
      if (t < 0 || t > 1) continue;
      // Rounder near the stalk, pointed at the tip.
      const half =
        (w / 2) * Math.sqrt(Math.max(0, sin(Math.PI * t * 0.92 + 0.12)));
      if (Math.abs(v) > half) continue;
      const vein = (t * len - Math.abs(v) * 1.2 + 100) % 5 < 1;
      const m =
        Math.abs(v) < 0.6
          ? leafVein
          : vein
            ? leafLt
            : v > 0
              ? leafBigLt
              : leafBig;
      s.set(i, j, z, m);
    }
  // A short stalk.
  for (let t = 1; t <= stalkLen; t++)
    s.set(
      Math.floor(cx - ax * (len / 2 + t)),
      Math.floor(cy - ay * (len / 2 + t)),
      z,
      stalk
    );
}

/**
 * A soft shadow on the ground under a scene, as a path in the scene's
 * lattice units: the outline of everything seen from above, nudged away
 * from the light by `off` blocks. Drawn under the scene, it seats things on
 * the page.
 */
function groundShadow(s, { off = [1, -1], z = 0 } = {}) {
  const cells = new Set();
  s.each((x, y) => cells.add(`${x + off[0]},${y + off[1]}`));
  const rows = new Map();
  for (const key of cells) {
    const [x, y] = key.split(',').map(Number);
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y).push(x);
  }
  const p = (px, py) => [2 * (px - py), px + py - 2 * z];
  let d = '';
  for (const [y, xs] of [...rows].sort((a, b) => a[0] - b[0])) {
    xs.sort((a, b) => a - b);
    let start = xs[0];
    for (let n = 1; n <= xs.length; n++) {
      if (n < xs.length && xs[n] === xs[n - 1] + 1) continue;
      const end = xs[n - 1] + 1;
      const [a, b, c, e] = [
        p(start, y),
        p(end, y),
        p(end, y + 1),
        p(start, y + 1),
      ];
      d += `M${a[0]} ${a[1]}L${b[0]} ${b[1]}L${c[0]} ${c[1]}L${e[0]} ${e[1]}z`;
      if (n < xs.length) start = xs[n];
    }
  }
  return d;
}

/** The ground shadow placed with the scene it belongs to. */
function shadowLayer(d, { scale, x, y }, color = '#5c2a10', opacity = 0.1) {
  return `<path transform="matrix(${num(scale)} 0 0 ${num(scale)} ${num(x)} ${num(y)})" fill="${color}" fill-opacity="${opacity}" d="${d}"/>`;
}

/** A citrus or kiwi slice lying flat, one or two blocks thick, cut face up. */
function slice(s, cx, cy, r, face, edge, thick = 2) {
  for (let i = Math.floor(cx - r); i <= Math.ceil(cx + r); i++)
    for (let j = Math.floor(cy - r); j <= Math.ceil(cy + r); j++) {
      const dx = i + 0.5 - cx;
      const dy = j + 0.5 - cy;
      if (dx * dx + dy * dy > r * r) continue;
      if (thick > 1) s.set(i, j, 0, edge);
      s.set(i, j, thick - 1, face(dx, dy, i, j));
    }
}

/** The face of a kiwi slice: brown skin, green flesh, black seeds round a pale core. */
function kiwiFace(r) {
  return (dx, dy) => {
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > r - 0.9) return kiwiSkin;
    if (d < 1.5) return kiwiCore;
    if (d > 2 && d < 3.3 && sector(dx, dy, 10) % 2 === 0) return seed;
    return sector(dx, dy, 14) % 2 ? kiwiA : kiwiB;
  };
}

/** A strawberry standing on its tip: red, seeded, a star of leaves on top. */
function strawberry(s, cx, cy, r, h) {
  for (let k = 0; k < h; k++) {
    const f = (k + 0.5) / h;
    const rad =
      r *
      (f < 0.75
        ? 0.35 + 0.65 * Math.sqrt(f / 0.75)
        : Math.sqrt(1 - ((f - 0.75) / 0.25) * 0.55));
    for (let i = Math.floor(cx - r); i <= Math.ceil(cx + r); i++)
      for (let j = Math.floor(cy - r); j <= Math.ceil(cy + r); j++) {
        const dx = i + 0.5 - cx;
        const dy = j + 0.5 - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > rad) continue;
        const nz = (f - 0.6) * 1.4;
        const m =
          d > rad - 1 && (i + j * 2 + k * 3) % 5 === 0
            ? berrySeed
            : lit(berryRed, dx / (d || 1), dy / (d || 1), nz);
        s.set(i, j, k, m);
      }
  }
  const tx = Math.floor(cx);
  const ty = Math.floor(cy);
  for (const [i, j] of [
    [0, 0],
    [1, 0],
    [2, 0],
    [-1, 0],
    [-2, 0],
    [0, 1],
    [0, 2],
    [0, -1],
    [0, -2],
    [1, 1],
    [-1, -1],
  ])
    s.set(tx + i, ty + j, h, Math.abs(i) + Math.abs(j) > 1 ? leafLt : leaf);
  s.set(tx, ty, h + 1, stalk);
}

/** A small round berry of radius r with a dark eye on top. */
function berry(s, cx, cy, r) {
  blob(s, cx, cy, r, r, r, r * 0.9, (i, j, k, nx, ny, nz) =>
    lit(blue, nx, ny, nz)
  );
  let top = 0;
  while (s.has(Math.floor(cx), Math.floor(cy), top)) top++;
  s.set(Math.floor(cx), Math.floor(cy), top - 1, blueEye);
}

/** A pineapple ring lying flat: the core cut out of its middle. */
function pineRing(s, cx, cy, r) {
  for (let i = Math.floor(cx - r); i <= Math.ceil(cx + r); i++)
    for (let j = Math.floor(cy - r); j <= Math.ceil(cy + r); j++) {
      const dx = i + 0.5 - cx;
      const dy = j + 0.5 - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > r || d < 2.1) continue;
      const edge = d > r - 0.9;
      s.set(
        i,
        j,
        0,
        edge ? pineRind : sector(dx, dy, 16) % 2 ? pineFleshA : pineFleshB
      );
    }
}

/** A stepped disc in flat color: a pixel circle `cell` pixels to a step. */
function pixelDisc(cx, cy, r, cell, fill) {
  let d = '';
  const rows = Math.ceil(r / cell);
  for (let n = -rows; n < rows; n++) {
    const y = (n + 0.5) * cell;
    const half = Math.sqrt(Math.max(0, r * r - y * y));
    const w = Math.round(half / cell) * cell;
    if (w > 0)
      d += `M${num(cx - w)} ${num(cy + n * cell)}h${num(2 * w)}v${num(cell)}h${num(-2 * w)}z`;
  }
  return `<path fill="${fill}" d="${d}"/>`;
}

function num(v) {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
}

// ---------------------------------------------------------------------------
// Images

const warm = { color: '#5c1600', left: 0.12, right: 0.26, ao: 0 };

function cardIcon() {
  const s = new Scene({ seed: 11 });
  orange(s, 5, 5, 0, 5, { leafDir: [0, -1], leaves: 2 });
  const r = renderScene(s, { light: warm });
  const W = 75;
  const H = 74;
  return document({
    width: W,
    height: H,
    label: 'A blocky orange with a leaf',
    layers: [place(r, fit(r.bounds, { width: W, height: H }, { pad: 3 }))],
  });
}

function oranges() {
  const s = new Scene({ seed: 12 });
  orange(s, 9, 9, 0, 8.5, { leafDir: [1, 0], leaves: 2 });
  orange(s, 29, 6, 0, 7.5);
  halfOrange(s, 21, 25, 0, 9.5);
  const r = renderScene(s, { light: warm });
  const W = 345;
  const H = 200;
  const spot = fit(r.bounds, { width: W, height: H }, { pad: 8 });
  return document({
    width: W,
    height: H,
    label: 'Two blocky oranges and a halved one',
    layers: [shadowLayer(groundShadow(s), spot), place(r, spot)],
  });
}

function guavas() {
  const s = new Scene({ seed: 14 });
  flatLeaf(s, 15, 9, 0, [1, -0.35], 32, 18);
  guava(s, 10, 9, 1, 6.2);
  guava(s, 21, 5, 1, 5.6);
  halfGuava(s, 19, 24, 0, 7.6);
  const r = renderScene(s, { light: warm });
  const W = 322;
  const H = 275;
  const spot = fit(r.bounds, { width: W, height: H }, { pad: 8 });
  return document({
    width: W,
    height: H,
    label: 'Two blocky guavas on a leaf and a halved one',
    layers: [shadowLayer(groundShadow(s), spot), place(r, spot)],
  });
}

function fruitBowl() {
  const s = new Scene({ seed: 13 });
  // Every size below is in blocks at this scale, so the bowl can be drawn
  // finer or coarser by changing one number.
  const S = 1.35;
  const q = v => Math.round(v * S);
  const C = q(14);
  const rim = q(6);
  // Where a thing goes, by its place across the picture (a) and its depth
  // (d), both in blocks from the bowl's centre: x - y and x + y.
  const at = (a, d) => [C + q((d + a) / 2), C + q((d - a) / 2)];
  // Broad leaves in a V behind the fruit, from the back of the bowl.
  leafPlane(s, ...at(-9, -7), rim - 2, 'xz', [-0.8, 1], q(12), 3.4 * S, {
    bend: 0.7,
  });
  leafPlane(s, ...at(9, -7), rim - 2, 'yz', [-0.8, 1], q(12), 3.4 * S, {
    bend: 0.7,
  });
  bowl(s, C, C, 0, 12 * S, 7 * S, rim + 1, 2);
  pineapple(s, ...at(0, -8), rim - 1, 3.8 * S, q(12));
  mango(s, ...at(12, -4), rim, 3.6 * S, 2.8 * S, 2.7 * S);
  orange(s, ...at(5, 2), rim - 1, 3.9 * S, { leafDir: [1, 0] });
  orange(s, ...at(-5, 1), rim - 1, 3.7 * S, { leaves: 0 });
  // A bunch of bananas over the front left, running across the picture.
  bananaSmile(s, ...at(-15, 7), rim, [1, -1], q(10), {
    lift: 3 * S,
    thick: 1.35 * S,
  });
  bananaSmile(s, ...at(-14, 9), rim - 1, [1, -1], q(10), {
    lift: 3 * S,
    thick: 1.35 * S,
  });
  halfPapaya(s, ...at(8, 11), rim - 2, 4.6 * S, 2.8 * S, q(3));
  standingSlice(s, ...at(-10, 20), 0, 4.6 * S);
  const r = renderScene(s, { light: warm });
  const W = 624;
  const H = 448;
  const spot = fit(
    r.bounds,
    { width: W, height: H },
    { pad: 16, align: [0.5, 0.5] }
  );
  return document({
    width: W,
    height: H,
    label: 'A blocky wooden bowl of tropical fruit',
    layers: [pixelDisc(W / 2, H / 2 + 4, 196, 14, '#ffe2c4'), place(r, spot)],
  });
}

/**
 * A made-up customer, head and shoulders, facing the viewer's left: a round
 * face with a wide smile, rosy cheeks and dark curls under a straw sun hat,
 * in a green shirt with a white collar. Nobody in particular.
 */
function client() {
  const s = new Scene({ seed: 21 });
  const skin = grain('tropico-skin', '#c98a5a', { spread: 0.035 });
  const skinDk = grain('tropico-skin-dk', '#b37648', { spread: 0.035 });
  const cheek = grain('tropico-cheek', '#e08a72', { spread: 0.03 });
  const hair = grain('tropico-hair', '#3a2418', { spread: 0.08 });
  const eye = grain('tropico-eye', '#24170f', { spread: 0.04 });
  const eyeHi = grain('tropico-eye-hi', '#fdf6ea', { spread: 0.02 });
  const mouth = grain('tropico-mouth', '#5e241e', { spread: 0.04 });
  const shirt = grain('tropico-shirt', '#2f9a5a', { spread: 0.06 });
  const collar = grain('tropico-collar', '#f4f0e6', { spread: 0.03 });
  const straw = grain('tropico-straw', '#e8c374', { spread: 0.07 });
  const strawDk = grain('tropico-straw-dk', '#d2a95e', { spread: 0.07 });
  const band = grain('tropico-band', '#f26a2e', { spread: 0.05 });

  // The head: HW wide (x), HD deep (y), HH high, its face on the front layer.
  const HX = 3;
  const HY = 0;
  const HW = 10;
  const HD = 9;
  const HZ = 10;
  const HH = 11;
  const F = HY + HD - 1;

  // Shoulders and chest, rounded at the top corners.
  const X0 = 0;
  const X1 = 16;
  for (let i = X0; i < X1; i++)
    for (let j = 1; j < 8; j++)
      for (let k = -6; k < 8; k++) {
        const edge = Math.min(i - X0, X1 - 1 - i);
        if (k >= 6 && edge < 2) continue;
        if (k === 7 && edge < 4) continue;
        s.set(i, j, k, shirt);
      }
  // An open collar round the neck.
  for (const [i, k] of [
    [5, 7],
    [6, 7],
    [6, 6],
    [7, 6],
    [10, 7],
    [9, 7],
    [9, 6],
    [8, 6],
  ])
    s.set(i, 7, k, collar);
  s.set(7, 7, 7, skinDk);
  s.set(8, 7, 7, skinDk);
  s.box(6, 3, 8, 4, 4, 2, skinDk);

  // The head, its edges and corners rounded off.
  for (let i = HX; i < HX + HW; i++)
    for (let j = HY; j < HY + HD; j++)
      for (let k = HZ; k < HZ + HH; k++) {
        const ci = Math.min(i - HX, HX + HW - 1 - i);
        const cj = Math.min(j - HY, HY + HD - 1 - j);
        const ck = Math.min(k - HZ, HZ + HH - 1 - k);
        if (ci + cj < 1 || ci + ck < 1 || cj + ck < 1) continue;
        s.set(i, j, k, skin);
      }
  const put = (i, k, m) => s.set(HX + i, F, HZ + k, m);
  // Eyes, each a tall dark block pair with a glint on top.
  for (const e of [3, 6]) {
    put(e, 4, eye);
    put(e, 5, eye);
    put(e, 6, eyeHi);
  }
  // A small nose.
  s.set(HX + 4, F + 1, HZ + 3, skinDk);
  // Rosy cheeks and a smile turned up at the ends.
  put(1, 3, cheek);
  put(8, 3, cheek);
  for (let i = 3; i <= 6; i++) put(i, 1, mouth);
  put(2, 2, mouth);
  put(7, 2, mouth);
  // An ear on the side toward the viewer.
  s.box(HX + HW, HY + 3, HZ + 3, 1, 2, 3, skinDk);
  // Dark curls round the back and sides of the head, under the hat.
  for (let i = HX - 1; i <= HX + HW; i++)
    for (let j = HY - 1; j <= HY + HD - 2; j++)
      for (let k = HZ + 5; k < HZ + HH; k++) {
        const ci = Math.min(i - HX, HX + HW - 1 - i);
        const cj = Math.min(j - HY, HY + HD - 1 - j);
        if (ci < 0 && cj < 0) continue;
        const shell = ci <= 0 || cj <= 0;
        if (!shell) continue;
        if (i === HX + HW && j >= HY + 2 && j <= HY + 5 && k < HZ + 7) continue;
        if (k < HZ + 7 && hash3(i, j, k, 2) < 0.35) continue;
        s.set(i, j, k, hair);
      }
  // Sideburns in front of the ear, and a fringe under the brim.
  s.set(HX + HW - 1, F - 1, HZ + 6, hair);
  s.set(HX + HW - 1, F - 2, HZ + 6, hair);
  for (let i = 0; i < HW; i++) if (i % 3 !== 1) put(i, HH - 1, hair);

  // The straw hat, pushed back so the brim clears the face: the brim rises
  // toward the front, round a crown with an orange band.
  const cx = HX + HW / 2;
  const cy = HY + HD / 2 - 1;
  const brimZ = HZ + HH;
  for (let i = Math.floor(cx - 9); i <= Math.ceil(cx + 9); i++)
    for (let j = Math.floor(cy - 9); j <= Math.ceil(cy + 9); j++) {
      const dx = i + 0.5 - cx;
      const dy = j + 0.5 - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      const lift = Math.max(0, Math.floor((dy + 0.4 * dx - 2) / 2.5));
      if (d <= 7.6) s.set(i, j, brimZ + lift, d > 6.7 ? strawDk : straw);
      if (d <= 4.8)
        for (let k = brimZ + 1; k <= brimZ + 5; k++)
          s.set(
            i,
            j,
            k,
            k === brimZ + 2 ? band : (i + j + k) % 4 === 0 ? strawDk : straw
          );
    }

  const r = renderScene(s, {
    light: {
      color: '#3a1a10',
      left: 0.1,
      right: 0.28,
      ao: 0.07,
      dir: [-0.4, 1.7, 1.1],
    },
  });
  const W = 380;
  const H = 315;
  const spot = fit(
    r.bounds,
    { width: W, height: H },
    { pad: 0, align: [0.5, 0], zoom: 1.36 }
  );
  spot.y += 8;
  return document({
    width: W,
    height: H,
    label: 'A blocky made-up customer in a straw hat, smiling',
    layers: [
      bandedSky(
        W,
        H,
        [
          [0, '#ffe8cf'],
          [1, '#ffc596'],
        ],
        7
      ),
      pixelDisc(W / 2, H * 0.47, 150, 15, '#fff2e0'),
      place(r, spot),
    ],
  });
}

/**
 * The floor the banner's fruit lies on: deep green blocks, drawn as one
 * pattern of 4 by 4 blocks laid on the top-face lattice, so it costs the
 * same however much of the picture it covers.
 */
function floorPattern(id, base) {
  const B = 4;
  const T = 4;
  const n = B * T;
  const random = rng(31);
  const blockShade = Array.from(
    { length: B * B },
    () => (random() - 0.5) * 0.11
  );
  const tex = texture(
    id,
    n,
    (u, v, r) => {
      const b = Math.floor(v / T) * B + Math.floor(u / T);
      const c = shade(base, blockShade[b]);
      const g = r();
      return g < 0.12 ? shade(c, -0.035) : c;
    },
    32
  );
  // A tile of B blocks a side: the top basis of voxel.mjs, B times over.
  const t = [(2 * B) / n, B / n, (-2 * B) / n, B / n, 0, 0].map(num).join(' ');
  // A solid ground under the texels, so no seam between them lets the page
  // through, then each color's runs along a row.
  const runs = new Map();
  tex.cells.forEach((row, v) => {
    let u = 0;
    while (u < n) {
      let end = u + 1;
      while (end < n && row[end] === row[u]) end++;
      if (!runs.has(row[u])) runs.set(row[u], '');
      runs.set(
        row[u],
        runs.get(row[u]) + `M${u} ${v}h${end - u}v1h${u - end}z`
      );
      u = end;
    }
  });
  const body =
    `<rect width="${n}" height="${n}" fill="${shade(base, -0.01)}"/>` +
    [...runs].map(([c, d]) => `<path fill="${c}" d="${d}"/>`).join('');
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${n}" height="${n}" patternTransform="matrix(${t})">${body}</pattern>`;
}

function tastyBanner() {
  const W = 1920;
  const H = 780;
  const S = 3.3; // pixels to a lattice unit
  const O = [960, 0]; // where the floor's (0, 0) lands
  // The title's band. The page shows the banner's top 400 pixels, from its
  // top-left corner, and centres the title in them.
  const BAND = [126, 274];

  // The fruit, each built and rendered once.
  const models = [];
  const model = (name, build) => {
    const sc = new Scene({ seed: 40 + models.length });
    build(sc);
    const r = renderScene(sc, { light: { ...warm, color: '#0c2414' } });
    models.push({
      id: `tropico-${name}`,
      r,
      shadow: groundShadow(sc, { off: [1, -1] }),
    });
  };
  const citrus = (r, n, rind, pithMat, fa, fb, skin) => sc =>
    slice(
      sc,
      Math.ceil(r),
      Math.ceil(r),
      r,
      (dx, dy) =>
        citrusFace(dx, dy, r, n, {
          rind,
          pithMat,
          core: pithMat,
          a: fa,
          b: fb,
          skin,
        }),
      rind,
      1
    );
  model(
    'orange-slice',
    citrus(6.2, 9, rindCut, pith, fleshA, fleshB, membrane)
  );
  model(
    'lime-slice',
    citrus(5.3, 8, limeRind, limePith, limeA, limeB, limeSkin)
  );
  model('lemon-slice', citrus(5.6, 9, lemonRind, pith, lemonA, lemonB, pith));
  model('kiwi-slice', sc => slice(sc, 6, 6, 5.6, kiwiFace(5.6), kiwiSkin, 1));
  model('pine-ring', sc => pineRing(sc, 7, 7, 6.6));
  model('strawberry', sc => strawberry(sc, 4, 4, 3.8, 8));
  model('berries', sc => {
    berry(sc, 2, 2, 2.2);
    berry(sc, 6, 3, 2.2);
    berry(sc, 3, 6.5, 2.1);
  });
  model('mint', sc =>
    flatLeaf(sc, 7, 5, 0, [1, -0.6], 13, 6.5, { stalkLen: 1 })
  );
  model('mint-b', sc =>
    flatLeaf(sc, 5, 7, 0, [0.5, 1], 12, 6, { stalkLen: 1 })
  );

  const defs = [floorPattern('tropico-floor', '#1b5530')];
  for (const m of models) {
    defs.push(...m.r.defs);
    defs.push(
      `<g id="${m.id}"><path fill="#06140b" fill-opacity="0.3" d="${m.shadow}"/>${m.r.body}</g>`
    );
  }

  // Scatter the fruit in staggered rows, keeping clear of the title's band.
  const random = rng(77);
  const uses = [];
  const order = [0, 6, 3, 7, 1, 5, 4, 8, 2];
  const rows = [58, 338, 508, 676];
  let turn = 0;
  rows.forEach((cy, row) => {
    for (let n = 0; n < 16; n++) {
      const cx = 30 + n * 124 + (row % 2) * 62 + (random() - 0.5) * 24;
      const py = cy + (n % 2 ? 16 : -16) + (random() - 0.5) * 14;
      const m = models[order[turn++ % order.length]];
      const b = m.r.bounds;
      // The lattice point under the target, snapped to a floor cell.
      const lx = (cx - O[0]) / S - (b.x + b.width / 2);
      const ly = (py - O[1]) / S - (b.y + b.height / 2);
      const gx = Math.round((ly + lx / 2) / 2);
      const gy = Math.round((ly - lx / 2) / 2);
      const tx = O[0] + S * 2 * (gx - gy);
      const ty = O[1] + S * (gx + gy);
      const top = ty + S * b.y;
      const bottom = ty + S * (b.y + b.height);
      if (bottom > BAND[0] - 4 && top < BAND[1] + 4) continue;
      uses.push(
        `<use href="#${m.id}" transform="matrix(${num(S)} 0 0 ${num(S)} ${num(tx)} ${num(ty)})"/>`
      );
    }
  });

  const floor = `<g transform="matrix(${num(S)} 0 0 ${num(S)} ${num(O[0])} ${num(O[1])})"><rect x="${num(-O[0] / S)}" y="${num(-O[1] / S)}" width="${num(W / S)}" height="${num(H / S)}" fill="url(#tropico-floor)"/></g>`;
  // The title's band: a darker, calmer stripe with stepped edges.
  const band =
    `<rect x="0" y="${BAND[0] + 12}" width="${W}" height="${BAND[1] - BAND[0] - 24}" fill="#0a2614" fill-opacity="0.34"/>` +
    `<rect x="0" y="${BAND[0]}" width="${W}" height="${BAND[1] - BAND[0]}" fill="#0a2614" fill-opacity="0.2"/>`;
  return document({
    width: W,
    height: H,
    label: 'Blocky fruit scattered on deep green',
    defs,
    layers: [floor, band, ...uses],
  });
}

/**
 * A model rendered once and kept in the definitions, with the soft shadow
 * it casts, for `<use>` to place as often as a picture needs it.
 */
function makeModel(id, build, light) {
  const sc = new Scene({ seed: 60 });
  build(sc);
  const r = renderScene(sc, { light });
  return {
    id,
    r,
    def: `<g id="${id}"><path fill="#3a1a08" fill-opacity="0.16" d="${groundShadow(sc)}"/>${r.body}</g>`,
  };
}

/** A `<use>` of a model standing on block (gx, gy, gz) of a lattice at origin O, S to a unit. */
function useAt(m, gx, gy, gz, S, O) {
  const tx = O[0] + S * 2 * (gx - gy);
  const ty = O[1] + S * (gx + gy - 2 * gz);
  return `<use href="#${m.id}" transform="matrix(${num(S)} 0 0 ${num(S)} ${num(tx)} ${num(ty)})"/>`;
}

/**
 * The left half of a plate of orange slices with mint, at the right edge of
 * the contact section: the page puts this picture at its right edge, so the
 * plate's centre sits on the picture's right edge and the page cuts it in
 * half. Two whole oranges sit at the back of the plate.
 */
function orangeDish() {
  const W = 261;
  const H = 497;
  const S = 3;
  const R = 29;
  // The plate's centre block is (0, 0), on the picture's right edge.
  const O = [W, 286];
  const plateWhite = grain('tropico-plate', '#fbf8f2', { spread: 0.025 });
  const plateRim = grain('tropico-plate-rim', '#cfe3ea', { spread: 0.035 });
  const plateSide = grain('tropico-plate-side', '#e9f1f3', { spread: 0.03 });
  const plate = new Scene({ seed: 61 });
  for (let i = -R - 1; i <= R; i++)
    for (let j = -R - 1; j <= R; j++) {
      // Only the half that shows, and a little past the edge.
      if (2 * (i - j) > 6) continue;
      const d = Math.sqrt((i + 0.5) * (i + 0.5) + (j + 0.5) * (j + 0.5));
      if (d > R) continue;
      plate.set(i, j, 0, plateSide);
      if (d < R - 7) plate.set(i, j, 1, plateWhite);
      else {
        plate.set(i, j, 1, plateSide);
        plate.set(i, j, 2, d > R - 2.4 ? plateRim : plateWhite);
      }
    }
  // Two whole oranges at the back of the plate, one with its leaves.
  orange(plate, -20.5, -7.5, 2, 7, { leafDir: [0, 1], leaves: 2 });
  orange(plate, -11, -19, 2, 6.4, { leaves: 0 });
  const plateR = renderScene(plate, { light: { ...warm, ao: 0.07 } });

  const sliceM = makeModel(
    'tropico-dish-slice',
    sc =>
      slice(
        sc,
        7,
        7,
        6.6,
        (dx, dy) =>
          citrusFace(dx, dy, 6.6, 9, {
            rind: rindCut,
            pithMat: pith,
            core: pith,
            a: fleshA,
            b: fleshB,
            skin: membrane,
          }),
        rindCut,
        1
      ),
    warm
  );
  const mintM = makeModel(
    'tropico-dish-mint',
    sc => {
      flatLeaf(sc, 5, 3, 0, [1, -0.7], 8, 4, { stalkLen: 0 });
      flatLeaf(sc, 3, 7, 0, [0.3, 1], 7, 3.6, { stalkLen: 0 });
    },
    warm
  );
  // Slices fanned round the plate's well, each resting a little over the
  // last, and mint tucked between them.
  const items = [];
  [58, 86, 114, 142, 170, 198].forEach((deg, n) => {
    const a = (deg * Math.PI) / 180;
    items.push([
      sliceM,
      Math.round(19.5 * cos(a)),
      Math.round(19.5 * sin(a)),
      n % 2,
    ]);
  });
  items.push([sliceM, -4, 5, 1]);
  items.push([mintM, -13, 9, 2]);
  items.push([mintM, -1, 14, 2]);
  items.push([mintM, -16, -3, 2]);
  const uses = items
    .slice()
    .sort((a, b) => a[1] + a[2] + 2 * a[3] - (b[1] + b[2] + 2 * b[3]))
    .map(([m, gx, gy, gz]) =>
      m === sliceM
        ? useAt(m, gx - 7, gy - 7, gz + 2, S, O)
        : useAt(m, gx - 4, gy - 4, gz + 2, S, O)
    );

  return document({
    width: W,
    height: H,
    label: 'Half a blocky plate of orange slices with mint',
    defs: [sliceM.def, mintM.def, ...sliceM.r.defs, ...mintM.r.defs],
    layers: [place(plateR, { scale: S, x: O[0], y: O[1] }), ...uses],
  });
}

export default [
  {
    path: 'public/images/card-item-1.svg',
    depicts: 'A blocky orange with a leaf on its stalk, drawn as a small icon.',
    draw: cardIcon,
  },
  {
    path: 'public/images/orange.svg',
    depicts:
      'Two blocky whole oranges, one with leaves, beside a halved orange showing its segments on the cut face.',
    draw: oranges,
  },
  {
    path: 'public/images/guava.svg',
    depicts:
      'Two blocky green guavas on a broad leaf beside a halved guava showing its pink flesh and a ring of seeds.',
    draw: guavas,
  },
  {
    path: 'public/images/client.svg',
    depicts:
      'A blocky made-up customer, not a real person: a smiling face under a straw sun hat, with dark curls and a green shirt, on a peach background.',
    draw: client,
  },
  {
    path: 'public/images/tasty-banner.svg',
    depicts:
      'A floor of deep green blocks scattered with blocky orange, lemon, lime and kiwi slices, pineapple rings, strawberries, blueberries and mint leaves, with a darker, empty band across its upper middle where the page puts the banner title.',
    draw: tastyBanner,
  },
  {
    path: 'public/images/orange-dish.svg',
    depicts:
      'The left half of a blocky pale blue and white plate of orange slices with mint leaves and two whole oranges, cut off by the right edge.',
    draw: orangeDish,
  },
  {
    path: 'public/images/slide-img.svg',
    depicts:
      'A blocky wooden bowl of tropical fruit on a pale orange disc: a pineapple, bananas, oranges, a mango, a halved papaya and an orange slice, with leaves behind.',
    draw: fruitBowl,
  },
];
