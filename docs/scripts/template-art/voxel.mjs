/**
 * Voxel scenes drawn as SVG: the renderer behind the ported templates' images.
 *
 * A scene is a set of blocks on an integer grid, each with a material, and it
 * renders in the classic 2:1 isometric view: x runs down to the right, y down
 * to the left and z up. Only what the viewer can see is drawn. Every face is
 * split into the two screen triangles it covers, the blocks are painted from
 * back to front into a buffer of those triangles, and whatever is left in the
 * buffer is all that reaches the SVG. So nothing is drawn twice, faces that
 * share a paint merge into a few paths, and the file stays small.
 *
 * A material paints a face with a flat color, picked per block from a few
 * shades so a wall isn't one slab of color, or with a texture: a small grid of
 * texels written as an SVG pattern, which every face of that orientation
 * shares, since the faces of a grid all fall on one lattice. Side faces are
 * shaded, top faces near a taller block darken a little, and a block in the
 * way of the light casts a shadow, all as translucent overlays.
 *
 * Everything is seeded: the same scene code writes the same bytes, so the
 * test beside this module can hold each template image to the code that draws
 * it. Nothing here reads an image.
 */

/** A seeded PRNG (mulberry32): scenes use it instead of Math.random(). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sine and cosine from arithmetic alone. Math.sin and its kin are allowed to
 * differ between engines and releases, and one ulp is enough to move a block,
 * so scenes use these, plus Math.sqrt, which IEEE 754 fixes exactly.
 */
export function sin(x) {
  const TAU = 6.283185307179586;
  let t = x - TAU * Math.floor(x / TAU + 0.5); // into [-pi, pi]
  let sign = 1;
  if (t < 0) {
    t = -t;
    sign = -1;
  }
  if (t > TAU / 4) t = TAU / 2 - t; // into [0, pi/2]
  const t2 = t * t;
  // Taylor series to t^13: under 1e-9 off on [0, pi/2].
  let term = t;
  let sum = t;
  for (let n = 1; n <= 6; n++) {
    term *= -t2 / (2 * n * (2 * n + 1));
    sum += term;
  }
  return sign * sum;
}

export function cos(x) {
  return sin(x + 1.5707963267948966);
}

/** A stable number in [0, 1) for a grid position, for per-block variety. */
export function hash3(x, y, z, seed = 0) {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  for (const n of [x, y, z]) {
    h = Math.imul(h ^ (n | 0), 0x85ebca6b) >>> 0;
    h = (h ^ (h >>> 13)) >>> 0;
    h = Math.imul(h, 0xc2b2ae35) >>> 0;
    h = (h ^ (h >>> 16)) >>> 0;
  }
  return h / 4294967296;
}

// ---------------------------------------------------------------------------
// Colors

function parseHex(hex) {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map(c => c + c)
          .join('')
      : h;
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
}

function toHex(rgb) {
  return (
    '#' +
    rgb
      .map(v =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  );
}

/** Mix two hex colors, `t` of the way from `a` to `b`. */
export function mix(a, b, t) {
  const pa = parseHex(a);
  const pb = parseHex(b);
  return toHex(pa.map((v, i) => v + (pb[i] - v) * t));
}

/** Lighten (amount > 0) or darken (amount < 0) a hex color toward white or black. */
export function shade(hex, amount) {
  return amount >= 0
    ? mix(hex, '#ffffff', amount)
    : mix(hex, '#000000', -amount);
}

/** A few shades around one color, for a flat material's per-block variety. */
export function shades(hex, spread = 0.06, count = 3) {
  if (count === 1) return [hex];
  return Array.from({ length: count }, (_, i) =>
    shade(hex, -spread + (2 * spread * i) / (count - 1))
  );
}

// ---------------------------------------------------------------------------
// Textures

/**
 * A texture: a square grid of texel colors. `fn(u, v, random)` returns the
 * color of texel (u, v), u across and v down from the top-left, and `random`
 * is seeded from `seed`, so the same arguments make the same texture.
 */
export function texture(id, size, fn, seed = 1) {
  const random = rng(seed);
  const cells = [];
  for (let v = 0; v < size; v++) {
    const row = [];
    for (let u = 0; u < size; u++) row.push(fn(u, v, random));
    cells.push(row);
  }
  return { id, size, cells };
}

/**
 * Pick from `palette` by weight: `weights[i]` is the share of palette[i].
 * The common building block of noisy textures.
 */
export function pick(random, palette, weights) {
  const w = weights ?? palette.map(() => 1);
  const total = w.reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (let i = 0; i < palette.length; i++) {
    r -= w[i];
    if (r < 0) return palette[i];
  }
  return palette[palette.length - 1];
}

/** A texture of scattered texels from a palette. */
export function noise(id, palette, { size = 8, weights, seed = 1 } = {}) {
  return texture(id, size, (u, v, r) => pick(r, palette, weights), seed);
}

// ---------------------------------------------------------------------------
// Materials

let materialCount = 0;

/**
 * A material. Each face takes a paint: a texture, a hex color, or an array of
 * hex colors (one picked per block). `color` sets all three faces at once,
 * `top` and `side` override it, and `left`/`right` override `side`.
 *
 * `flat: true` skips the side shading, ambient darkening and shadows, for a
 * block that gives off light (a lamp, a lit window, the sun on the sea).
 */
export function material({
  id,
  color,
  top,
  side,
  left,
  right,
  flat = false,
} = {}) {
  const base = color;
  const s = side ?? base;
  return {
    id: id ?? `m${materialCount++}`,
    top: top ?? base,
    left: left ?? s,
    right: right ?? s,
    flat,
  };
}

// ---------------------------------------------------------------------------
// Scenes

const OFFSET = 1 << 11;
const SPAN = 1 << 12;

function packKey(x, y, z) {
  return ((x + OFFSET) * SPAN + (y + OFFSET)) * SPAN + (z + OFFSET);
}

function unpackKey(k) {
  const z = (k % SPAN) - OFFSET;
  const rest = Math.floor(k / SPAN);
  const y = (rest % SPAN) - OFFSET;
  const x = Math.floor(rest / SPAN) - OFFSET;
  return [x, y, z];
}

/** A set of blocks on an integer grid. Coordinates stay within ±2000. */
export class Scene {
  constructor({ seed = 1 } = {}) {
    this.seed = seed;
    this.blocks = new Map();
    this.random = rng(seed);
  }

  /** Place `mat` at (x, y, z), or clear the cell when `mat` is null. */
  set(x, y, z, mat) {
    const k = packKey(x, y, z);
    if (mat) this.blocks.set(k, mat);
    else this.blocks.delete(k);
    return this;
  }

  get(x, y, z) {
    return this.blocks.get(packKey(x, y, z)) ?? null;
  }

  has(x, y, z) {
    return this.blocks.has(packKey(x, y, z));
  }

  /** Fill the box from (x, y, z) that is w wide (x), d deep (y) and h high (z). */
  box(x, y, z, w, d, h, mat) {
    for (let i = x; i < x + w; i++)
      for (let j = y; j < y + d; j++)
        for (let k = z; k < z + h; k++) this.set(i, j, k, mat);
    return this;
  }

  /** The box's walls only: its outside layer, open or closed at top and bottom. */
  shell(x, y, z, w, d, h, mat, { top = true, bottom = true } = {}) {
    for (let i = x; i < x + w; i++)
      for (let j = y; j < y + d; j++)
        for (let k = z; k < z + h; k++) {
          const edge = i === x || i === x + w - 1 || j === y || j === y + d - 1;
          const cap = (top && k === z + h - 1) || (bottom && k === z);
          if (edge || cap) this.set(i, j, k, mat);
        }
    return this;
  }

  /** A solid ellipsoid centred on (cx, cy, cz) with radii rx, ry, rz. */
  ellipsoid(cx, cy, cz, rx, ry, rz, mat) {
    for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++)
      for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++)
        for (let k = Math.floor(cz - rz); k <= Math.ceil(cz + rz); k++) {
          const dx = (i + 0.5 - cx) / rx;
          const dy = (j + 0.5 - cy) / ry;
          const dz = (k + 0.5 - cz) / rz;
          if (dx * dx + dy * dy + dz * dz <= 1) this.set(i, j, k, mat);
        }
    return this;
  }

  /** A sphere of radius r centred on (cx, cy, cz). */
  sphere(cx, cy, cz, r, mat) {
    return this.ellipsoid(cx, cy, cz, r, r, r, mat);
  }

  /** An upright cylinder: a disc of radius r at (cx, cy), from z up h blocks. */
  cylinder(cx, cy, z, r, h, mat) {
    for (let i = Math.floor(cx - r); i <= Math.ceil(cx + r); i++)
      for (let j = Math.floor(cy - r); j <= Math.ceil(cy + r); j++) {
        const dx = i + 0.5 - cx;
        const dy = j + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r)
          for (let k = z; k < z + h; k++) this.set(i, j, k, mat);
      }
    return this;
  }

  /** Call fn(x, y, z, mat) for every block. */
  each(fn) {
    for (const [k, mat] of this.blocks) fn(...unpackKey(k), mat);
  }

  /** Copy another scene's blocks in, shifted by (dx, dy, dz). */
  stamp(other, dx = 0, dy = 0, dz = 0) {
    other.each((x, y, z, mat) => this.set(x + dx, y + dy, z + dz, mat));
    return this;
  }
}

// ---------------------------------------------------------------------------
// Projection

// Lattice units: a block's top is 4 wide and 2 high, and its sides 2 high, so
// every corner of every block lands on integer coordinates.
function proj(x, y, z) {
  return [2 * (x - y), x + y - 2 * z];
}

// The screen triangle containing a point, as a key. Lines of the lattice run
// vertically every 2 units and at slopes of ±1/2.
function triKey(px, py) {
  const i = Math.floor(px / 2);
  const m = Math.floor((py - px / 2) / 2);
  const n = Math.floor((py + px / 2) / 2);
  return `${i},${m},${n}`;
}

function centroid(a, b, c) {
  return [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
}

// The two triangles of each face, as world corners.
const FACES = {
  top: {
    normal: [0, 0, 1],
    tris: (x, y, z) => [
      [
        [x, y, z + 1],
        [x + 1, y + 1, z + 1],
        [x, y + 1, z + 1],
      ],
      [
        [x, y, z + 1],
        [x + 1, y, z + 1],
        [x + 1, y + 1, z + 1],
      ],
    ],
  },
  left: {
    normal: [0, 1, 0],
    tris: (x, y, z) => [
      [
        [x, y + 1, z + 1],
        [x + 1, y + 1, z + 1],
        [x, y + 1, z],
      ],
      [
        [x + 1, y + 1, z + 1],
        [x + 1, y + 1, z],
        [x, y + 1, z],
      ],
    ],
  },
  right: {
    normal: [1, 0, 0],
    tris: (x, y, z) => [
      [
        [x + 1, y + 1, z + 1],
        [x + 1, y, z + 1],
        [x + 1, y, z],
      ],
      [
        [x + 1, y + 1, z + 1],
        [x + 1, y, z],
        [x + 1, y + 1, z],
      ],
    ],
  },
};

// Pattern placement per orientation, in lattice units: the texel axes u and v
// and the origin of the tile, so tile (0..size) covers exactly one face.
const PATTERN_BASIS = {
  top: { u: [2, 1], v: [-2, 1], o: [0, -2] },
  left: { u: [2, 1], v: [0, 2], o: [-2, -1] },
  right: { u: [2, -1], v: [0, 2], o: [0, 0] },
};

function num(n) {
  const r = Math.round(n * 1000) / 1000;
  return Object.is(r, -0) ? '0' : String(r);
}

function patternDefs(tex) {
  const runs = new Map();
  tex.cells.forEach((row, v) => {
    let u = 0;
    while (u < row.length) {
      const color = row[u];
      let end = u + 1;
      while (end < row.length && row[end] === color) end++;
      if (!runs.has(color)) runs.set(color, []);
      runs.get(color).push(`M${u} ${v}h${end - u}v1h${u - end}z`);
      u = end;
    }
  });
  const body = [...runs]
    .map(([color, d]) => `<path fill="${color}" d="${d.join('')}"/>`)
    .join('');
  const n = tex.size;
  const defs = [];
  for (const [orient, b] of Object.entries(PATTERN_BASIS)) {
    const t = [b.u[0] / n, b.u[1] / n, b.v[0] / n, b.v[1] / n, b.o[0], b.o[1]]
      .map(num)
      .join(' ');
    const id = `${tex.id}-${orient}`;
    const common = `id="${id}" patternUnits="userSpaceOnUse" width="${n}" height="${n}" patternTransform="matrix(${t})"`;
    defs.push(
      orient === 'top'
        ? `<pattern ${common}>${body}</pattern>`
        : `<pattern ${common} href="#${tex.id}-top"/>`
    );
  }
  return defs;
}

// ---------------------------------------------------------------------------
// Rendering

const DEFAULT_LIGHT = {
  // Toward the light: up, toward +y (screen left) and a little toward -x.
  dir: [-0.45, 0.8, 1.5],
  shadow: 0.28,
  left: 0.16,
  right: 0.34,
  ao: 0.1,
  color: '#141a33',
  reach: 40,
};

/**
 * Render a scene. Returns the SVG for its pattern definitions and its body in
 * lattice units, plus the body's bounds, for `fit()` and `compose()`.
 *
 * `light` tunes the shading (see DEFAULT_LIGHT); `light: false` draws flat.
 */
export function renderScene(scene, { light = {} } = {}) {
  const L = light === false ? null : { ...DEFAULT_LIGHT, ...light };
  const order = [];
  scene.each((x, y, z, mat) => order.push([x, y, z, mat]));
  order.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));

  // Painter's pass into the triangle buffer.
  const buffer = new Map();
  for (const [x, y, z, mat] of order) {
    for (const [orient, face] of Object.entries(FACES)) {
      const [nx, ny, nz] = face.normal;
      if (scene.has(x + nx, y + ny, z + nz)) continue;
      face.tris(x, y, z).forEach((corners, half) => {
        const pts = corners.map(c => proj(...c));
        const key = triKey(...centroid(...pts));
        buffer.set(key, { x, y, z, mat, orient, half, pts });
      });
    }
  }

  // Group what survived: by face first, so a face whose two halves both show
  // becomes one cell of its plane, and a half face stays a triangle.
  const faces = new Map();
  for (const t of buffer.values()) {
    const fk = `${t.x},${t.y},${t.z},${t.orient}`;
    if (!faces.has(fk)) faces.set(fk, { ...t, halves: [] });
    faces.get(fk).halves.push(t.pts);
  }

  const paints = new Map(); // paint key -> fill
  const defs = new Map();
  const groups = new Map(); // layer key -> { fill, opacity, cells: Map(plane -> []), tris: [] }

  function group(key, fill, opacity) {
    if (!groups.has(key))
      groups.set(key, { fill, opacity, planes: new Map(), tris: [] });
    return groups.get(key);
  }

  function paintOf(face) {
    const p = face.mat[face.orient];
    if (p && typeof p === 'object' && !Array.isArray(p)) {
      if (!defs.has(p.id)) defs.set(p.id, patternDefs(p).join(''));
      return {
        key: `t:${p.id}-${face.orient}`,
        fill: `url(#${p.id}-${face.orient})`,
      };
    }
    const colors = Array.isArray(p) ? p : [p ?? '#ff00ff'];
    const c =
      colors.length === 1
        ? colors[0]
        : colors[
            Math.floor(
              hash3(face.x, face.y, face.z, scene.seed) * colors.length
            )
          ];
    return { key: `c:${c}`, fill: c };
  }

  function occludedTowardLight(px, py, pz) {
    const [dx, dy, dz] = L.dir;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const step = 0.4;
    for (let t = 0.6; t < L.reach; t += step) {
      const x = Math.floor(px + (dx / len) * t);
      const y = Math.floor(py + (dy / len) * t);
      const z = Math.floor(pz + (dz / len) * t);
      if (scene.has(x, y, z)) return true;
    }
    return false;
  }

  function aoLevel(f) {
    const { x, y, z } = f;
    let n = 0;
    if (f.orient === 'top') {
      for (const [i, j, w] of [
        [1, 0, 1],
        [-1, 0, 1],
        [0, 1, 1],
        [0, -1, 1],
        [1, 1, 0.5],
        [-1, 1, 0.5],
        [1, -1, 0.5],
        [-1, -1, 0.5],
      ])
        if (scene.has(x + i, y + j, z + 1)) n += w;
    } else {
      const [nx, ny] = FACES[f.orient].normal;
      const ax = f.orient === 'left' ? [1, 0] : [0, 1];
      for (const [a, k, w] of [
        [1, 0, 1],
        [-1, 0, 1],
        [0, -1, 1],
        [0, 1, 0.5],
      ])
        if (scene.has(x + nx + ax[0] * a, y + ny + ax[1] * a, z + k)) n += w;
    }
    return Math.min(3, Math.round(n));
  }

  for (const f of faces.values()) {
    const keys = [];
    const paint = paintOf(f);
    paints.set(paint.key, paint.fill);
    keys.push([paint.key, paint.fill, 1]);
    if (L && !f.mat.flat) {
      if (f.orient !== 'top') {
        keys.push([`shade-${f.orient}`, L.color, L[f.orient]]);
      }
      const ao = L.ao ? aoLevel(f) : 0;
      if (ao) keys.push([`ao-${ao}`, L.color, L.ao * ao]);
      if (L.shadow) {
        const [nx, ny, nz] = FACES[f.orient].normal;
        const c = [
          f.x + 0.5 + nx * 0.51,
          f.y + 0.5 + ny * 0.51,
          f.z + 0.5 + nz * 0.51,
        ];
        const lit = nx * L.dir[0] + ny * L.dir[1] + nz * L.dir[2] > 0;
        if (lit && occludedTowardLight(...c))
          keys.push(['shadow', L.color, L.shadow]);
      }
    }
    for (const [key, fill, opacity] of keys) {
      const g = group(key, fill, opacity);
      if (f.halves.length === 2) {
        const plane =
          f.orient === 'top'
            ? `z${f.z}`
            : f.orient === 'left'
              ? `y${f.y}`
              : `x${f.x}`;
        if (!g.planes.has(plane)) g.planes.set(plane, []);
        const cell =
          f.orient === 'top'
            ? [f.x, f.y]
            : f.orient === 'left'
              ? [f.x, f.z]
              : [f.y, f.z];
        g.planes.get(plane).push({ orient: f.orient, cell, f });
      } else {
        g.tris.push(f.halves[0]);
      }
    }
  }

  // Merge each plane's cells into rectangles, greedily, and write paths.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const grow = pts => {
    for (const [px, py] of pts) {
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
  };

  const poly = pts => {
    grow(pts);
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++)
      d += `l${pts[i][0] - pts[i - 1][0]} ${pts[i][1] - pts[i - 1][1]}`;
    return d + 'z';
  };

  function rectCorners(orient, plane, a0, b0, a1, b1) {
    if (orient === 'top') {
      const z = plane + 1;
      return [
        proj(a0, b0, z),
        proj(a1, b0, z),
        proj(a1, b1, z),
        proj(a0, b1, z),
      ];
    }
    if (orient === 'left') {
      const y = plane + 1;
      return [
        proj(a0, y, b1),
        proj(a1, y, b1),
        proj(a1, y, b0),
        proj(a0, y, b0),
      ];
    }
    const x = plane + 1;
    return [proj(x, a1, b1), proj(x, a0, b1), proj(x, a0, b0), proj(x, a1, b0)];
  }

  function mergeCells(items) {
    const orient = items[0].orient;
    const plane =
      orient === 'top'
        ? items[0].f.z
        : orient === 'left'
          ? items[0].f.y
          : items[0].f.x;
    const set = new Set(items.map(it => `${it.cell[0]},${it.cell[1]}`));
    const cells = items
      .map(it => it.cell)
      .sort((p, q) => p[1] - q[1] || p[0] - q[0]);
    const out = [];
    for (const [a, b] of cells) {
      if (!set.has(`${a},${b}`)) continue;
      let w = 1;
      while (set.has(`${a + w},${b}`)) w++;
      let h = 1;
      outer: for (;;) {
        for (let i = 0; i < w; i++)
          if (!set.has(`${a + i},${b + h}`)) break outer;
        h++;
      }
      for (let i = 0; i < w; i++)
        for (let j = 0; j < h; j++) set.delete(`${a + i},${b + j}`);
      out.push(rectCorners(orient, plane, a, b, a + w, b + h));
    }
    return out;
  }

  const order2 = [...groups.entries()].sort(([a], [b]) => {
    const rank = k =>
      k.startsWith('t:') || k.startsWith('c:')
        ? 0
        : k.startsWith('shade')
          ? 1
          : k.startsWith('ao')
            ? 2
            : 3;
    return rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0);
  });

  const paths = [];
  for (const [key, g] of order2) {
    let d = '';
    for (const items of g.planes.values())
      for (const pts of mergeCells(items)) d += poly(pts);
    for (const pts of g.tris) d += poly(pts);
    if (!d) continue;
    const isPaint = key.startsWith('t:') || key.startsWith('c:');
    const attrs = isPaint
      ? `fill="${g.fill}" stroke="${g.fill}" stroke-width=".08" stroke-linejoin="round"`
      : `fill="${g.fill}" fill-opacity="${num(g.opacity)}"`;
    paths.push(`<path ${attrs} d="${d}"/>`);
  }

  return {
    defs: [...defs.values()],
    body: paths.join(''),
    bounds:
      minX === Infinity
        ? { x: 0, y: 0, width: 0, height: 0 }
        : { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
  };
}

/**
 * Where to put a rendered scene so it sits in a box of the image: `contain`
 * fits it inside with `pad` pixels to spare, `cover` fills the box and crops.
 * `align` is [x, y] from 0 (left/top) to 1 (right/bottom).
 */
export function fit(
  bounds,
  box,
  { mode = 'contain', pad = 0, align = [0.5, 0.5], zoom = 1 } = {}
) {
  const bw = box.width - 2 * pad;
  const bh = box.height - 2 * pad;
  const sx = bw / bounds.width;
  const sy = bh / bounds.height;
  const scale = (mode === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy)) * zoom;
  const x =
    (box.x ?? 0) +
    pad +
    (bw - bounds.width * scale) * align[0] -
    bounds.x * scale;
  const y =
    (box.y ?? 0) +
    pad +
    (bh - bounds.height * scale) * align[1] -
    bounds.y * scale;
  return { scale, x, y };
}

/**
 * Place a rendered scene with a scale and offset: a layer for `document()`,
 * which carries the scene's pattern definitions with it.
 */
export function place(rendered, { scale, x, y }) {
  return {
    svg: `<g transform="matrix(${num(scale)} 0 0 ${num(scale)} ${num(x)} ${num(y)})">${rendered.body}</g>`,
    defs: rendered.defs,
  };
}

/**
 * A whole SVG document. `layers` are painted in order: SVG strings, or what
 * `place()` returns, whose definitions are collected. `defs` takes any other
 * definitions, such as gradients. `label` becomes the image's accessible name.
 */
export function document({ width, height, label, defs = [], layers = [] }) {
  const all = [...defs];
  const parts = layers.map(layer => {
    if (typeof layer === 'string') return layer;
    all.push(...layer.defs);
    return layer.svg;
  });
  const uniq = [...new Set(all)];
  const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(label)}">`;
  return (
    head +
    `<title>${escapeText(label)}</title>` +
    (uniq.length ? `<defs>${uniq.join('')}</defs>` : '') +
    parts.join('') +
    '</svg>\n'
  );
}

function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeText(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}
