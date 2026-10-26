/**
 * Builders for things several scenes need: trees, palms, blocky people and
 * text set in blocks. Each adds blocks to a Scene where it is told to.
 */
import { FONT } from '../pixel-cover-lib.mjs';
import { material } from './voxel.mjs';
import { M } from './blocks.mjs';

/** A broadleaf tree with its trunk's foot at (x, y, z). */
export function tree(
  scene,
  x,
  y,
  z,
  { trunk = 4, crown = 2, log = M.log, leaves = M.leaves } = {}
) {
  for (let k = 0; k < trunk; k++) scene.set(x, y, z + k, log);
  const top = z + trunk;
  for (let i = -crown; i <= crown; i++)
    for (let j = -crown; j <= crown; j++)
      for (let k = -1; k <= crown - 1; k++) {
        const corner = Math.abs(i) === crown && Math.abs(j) === crown;
        const upper =
          k === crown - 1 && (Math.abs(i) === crown || Math.abs(j) === crown);
        if (!corner && !upper) scene.set(x + i, y + j, top + k, leaves);
      }
  scene.set(x, y, top + crown, leaves);
  return scene;
}

/**
 * A palm: a trunk leaning one block every `lean` blocks toward (dx, dy), and
 * four fronds drooping from its top.
 */
export function palm(
  scene,
  x,
  y,
  z,
  {
    height = 6,
    lean = 3,
    dx = 1,
    dy = 0,
    log = M.log,
    leaves = M.palm,
    frond = 3,
  } = {}
) {
  let cx = x;
  let cy = y;
  for (let k = 0; k < height; k++) {
    if (k && k % lean === 0) {
      cx += dx;
      cy += dy;
    }
    scene.set(cx, cy, z + k, log);
  }
  const top = z + height;
  scene.set(cx, cy, top, leaves);
  for (const [i, j] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ])
    for (let r = 1; r <= frond; r++) {
      const droop = r > 1 ? r - 2 : 0;
      scene.set(cx + i * r, cy + j * r, top - droop, leaves);
    }
  return scene;
}

/**
 * A blocky person, standing with feet at (x, y, z) and facing +x or +y
 * (`facing: 'x' | 'y'`), `scale` blocks to a body unit: legs 3 units high,
 * body 3, head 2. Colors are plain hex; `face` draws two eyes when true.
 */
export function person(
  scene,
  x,
  y,
  z,
  {
    facing = 'y',
    scale = 1,
    skin = '#e0ac80',
    hair = '#3b2a20',
    shirt = '#3d7bd9',
    legs = '#3b3f52',
    shoes = '#2a2a2a',
    face = true,
    longHair = false,
  } = {}
) {
  const mat = c => material({ color: c });
  const s = scale;
  const W = 2 * s; // shoulder width along the facing's cross axis
  const D = s; // depth
  const along = facing === 'y' ? [1, 0] : [0, 1];
  const put = (a, d, k, m) => {
    const px = x + along[0] * a + (facing === 'x' ? d : 0);
    const py = y + along[1] * a + (facing === 'y' ? d : 0);
    scene.set(px, py, z + k, m);
  };
  const box = (a0, a1, k0, k1, m, d0 = 0, d1 = D) => {
    for (let a = a0; a < a1; a++)
      for (let d = d0; d < d1; d++)
        for (let k = k0; k < k1; k++) put(a, d, k, m);
  };
  box(0, W, 0, s, mat(shoes));
  box(0, W, s, 3 * s, mat(legs));
  box(-s, W + s, 3 * s, 6 * s, mat(shirt));
  box(0, W, 6 * s, 8 * s, mat(skin));
  box(
    0,
    W,
    8 * s - Math.max(1, s >> 1),
    8 * s + Math.max(1, s >> 1),
    mat(hair),
    -Math.max(0, s >> 2),
    D
  );
  if (longHair) box(0, W, 5 * s, 7 * s, mat(hair), -1, 0);
  if (face && s >= 2) {
    const eye = mat('#2b2321');
    const k = 7 * s - 1;
    put(Math.floor(W / 4), D, k, eye);
    put(W - 1 - Math.floor(W / 4), D, k, eye);
  }
  return scene;
}

/**
 * Text set in blocks, in the 5x7 pixel font, standing in a plane: `plane`
 * 'xz' reads along +x on the face toward +y, 'yz' along -y on the face toward
 * +x, and 'xy' lies flat, reading along +x. (x, y, z) is the top-left dot.
 */
export function blockText(
  scene,
  str,
  x,
  y,
  z,
  mat,
  { plane = 'xz', size = 1 } = {}
) {
  [...str].forEach((ch, i) => {
    const glyph = FONT[ch];
    if (!glyph) return;
    glyph.forEach((row, j) => {
      [...row].forEach((bit, u) => {
        if (bit !== '1') return;
        const a = (i * 6 + u) * size;
        const b = j * size;
        for (let p = 0; p < size; p++)
          for (let q = 0; q < size; q++) {
            if (plane === 'xz') scene.set(x + a + p, y, z - b - q, mat);
            else if (plane === 'yz') scene.set(x, y - a - p, z - b - q, mat);
            else scene.set(x + a + p, y + b + q, z, mat);
          }
      });
    });
  });
  return scene;
}
