/**
 * Event Participation: the event's gold logo, shown at 96 pixels above the
 * page's heading, on a cream page or a near-black one as the reader picks.
 *
 * So it stands on its own on either: no backdrop, a gold whose light faces
 * hold up against the cream and whose shaded ones stay warm on the black,
 * and a number big enough to read at that size. The medal faces the viewer:
 * it is built along the x + y diagonal, where each column of blocks shows a
 * left and a right face side by side, so the number reads level, a column a
 * pixel.
 */
import {
  Scene,
  document,
  fit,
  material,
  place,
  renderScene,
  shades,
} from '../voxel.mjs';
import { sprite } from '../backdrop.mjs';
import { FONT } from '../../pixel-cover-lib.mjs';

const S = 128;

/**
 * A gold block in a few shades, picked per block. At 96 pixels a block is
 * three pixels across, where a texel grain is too fine to see and its
 * pattern lets the page show through between texels, so the variety is per
 * block instead.
 */
const gold = (side, top) =>
  material({ side: shades(side, 0.05), top: shades(top, 0.04) });

const M = {
  gold: gold('#ffd84a', '#fff3b0'),
  rim: gold('#f0b52c', '#ffe07a'),
  shine: gold('#ffd95c', '#fff1b0'),
  shade: gold('#d08f1c', '#eab23a'),
  field: gold('#b07818', '#c98d22'),
};

// Light straight toward the viewer, so a column's two faces match and the
// medal's face reads flat; only the tops, the bevels, catch more.
const light = {
  color: '#3a2208',
  left: 0.05,
  right: 0.08,
  ao: 0,
  dir: [0.3, 0.3, 1.5],
};

/**
 * Set a block by screen column c (x - y), layer k (x + y + 1, toward the
 * viewer) and height z. A layer holds every other column.
 */
function put(s, c, k, z, mat) {
  if ((((c - k + 1) % 2) + 2) % 2) return;
  const x = (k - 1 + c) / 2;
  s.set(x, x - c, z, mat);
}

/**
 * The medal: a dark gold field inside a raised rim, and "50" in the pixel
 * font a block proud of it, a pixel two blocks high.
 */
function medal() {
  const s = new Scene({ seed: 50 });
  const R = 15.6; // the medal's radius, in columns
  const ZC = 7.5; // its centre's height
  for (let c = -17; c <= 17; c++)
    for (let z = -12; z < 28; z++) {
      const dz = z + 0.5 - ZC;
      const d = c * c + dz * dz;
      if (d > R * R) continue;
      const rim = d > (R - 2.4) * (R - 2.4);
      // The rim catches the light at its upper left and falls into shade
      // at its lower right.
      const side = dz - c;
      const metal = side > 9 ? M.shine : side < -9 ? M.shade : M.rim;
      for (const k of [1, 2]) put(s, c, k, z, rim ? metal : M.field);
      if (rim) put(s, c, 3, z, metal);
    }
  // The number, centred: eleven columns wide, fourteen blocks high, on the
  // layer in front of the field. The font's zero is slashed, which at this
  // size reads as a letter, so the zero takes the round O.
  const glyphs = [FONT['5'], FONT.O];
  const width = glyphs.length * 6 - 1;
  glyphs.forEach((glyph, n) =>
    glyph.forEach((row, j) =>
      [...row].forEach((bit, u) => {
        if (bit !== '1') return;
        const c = 2 * (n * 6 + u - (width - 1) / 2);
        for (const dz of [0, 1])
          put(s, c, 3, Math.round(ZC + 6.5) - 2 * j - dz, M.gold);
      })
    )
  );
  return s;
}

function logo() {
  const r = renderScene(medal(), { light });
  const at = fit(r.bounds, { x: 0, y: 0, width: S, height: S }, { pad: 4 });
  const spark = ['.y.', 'yYy', '.y.'];
  return document({
    width: S,
    height: S,
    label: 'A blocky gold medal with the number 50',
    layers: [
      place(r, at),
      sprite(spark, { y: '#f4c534', Y: '#fff4c4' }, 104, 8, 4),
      sprite(spark, { y: '#f4c534', Y: '#fff4c4' }, 10, 106, 3),
    ],
  });
}

export default [
  {
    path: 'public/media/event_logo_gold.svg',
    depicts:
      "A blocky gold medal with the number 50 in the pixel font standing proud of its face, inside a raised rim, with two small sparkles; the event's logo.",
    draw: logo,
  },
];
