/*
 * The honeycomb behind the homepage hero, laid out once at module scope.
 *
 * Every position is measured from the centre of the field, which sits at the
 * centre of the hero, so the two wings stay balanced at any width. Cells are
 * pointy-top hexagons and odd rows shift right by half a cell, the way a
 * honeycomb packs.
 */

export const CELL_W = 108;
export const CELL_H = 125;
const PITCH_X = 114;
const PITCH_Y = 99;
const ROWS = 4;
const COLUMNS = 9;

/**
 * The component tiles. Each shows a small drawing of its component on the
 * front and the component's name on the back. `kind` is what the feature line
 * under the tagline lights up, and `group` is the small label under the name.
 */
export const TILES = [
  {
    id: 'tabs',
    r: -3,
    dx: -627,
    tone: 6,
    kind: 'layout',
    name: 'Tabs',
    group: 'component',
  },
  {
    id: 'button',
    r: -2,
    dx: -570,
    tone: 4,
    kind: 'ui',
    name: 'Button',
    group: 'element',
  },
  {
    id: 'calendar',
    r: -1,
    dx: -627,
    tone: 5,
    kind: 'forms',
    name: 'DateInput',
    group: 'form',
  },
  {
    id: 'switch',
    r: 0,
    dx: -570,
    tone: 4,
    kind: 'forms',
    name: 'Switch',
    group: 'form',
  },
  {
    id: 'progress',
    r: 1,
    dx: -627,
    tone: 4,
    kind: 'ui',
    name: 'Progress',
    group: 'element',
  },
  {
    id: 'tags',
    r: 1,
    dx: -513,
    tone: 3,
    kind: 'forms',
    name: 'Taginput',
    group: 'form',
  },
  {
    id: 'checkbox',
    r: 2,
    dx: -570,
    tone: 5,
    kind: 'forms',
    name: 'Checkbox',
    group: 'form',
  },
  {
    id: 'ai',
    r: 3,
    dx: -627,
    tone: 5,
    kind: 'ai',
    name: 'Skills + MCP',
    group: 'AI-ready',
  },
  {
    id: 'ts',
    r: -3,
    dx: 627,
    tone: 6,
    kind: 'ts',
    name: 'Typed props',
    group: 'TypeScript',
  },
  {
    id: 'select',
    r: -2,
    dx: 570,
    tone: 4,
    kind: 'forms',
    name: 'Select',
    group: 'form',
  },
  {
    id: 'slider',
    r: -1,
    dx: 627,
    tone: 3,
    kind: 'forms',
    name: 'Slider',
    group: 'form',
  },
  {
    id: 'content',
    r: 0,
    dx: 570,
    tone: 4,
    kind: 'layout',
    name: 'Content',
    group: 'element',
  },
  {
    id: 'notification',
    r: 1,
    dx: 627,
    tone: 6,
    kind: 'layout',
    name: 'Notification',
    group: 'element',
  },
  {
    id: 'rate',
    r: 2,
    dx: 570,
    tone: 5,
    kind: 'forms',
    name: 'Rate',
    group: 'form',
  },
  {
    id: 'grid',
    r: 3,
    dx: 627,
    tone: 6,
    kind: 'layout',
    name: 'Grid',
    group: 'layout',
  },
].map(tile => place(tile, tile.dx, tile.r * PITCH_Y));

/** A stable 0..1 value per cell, so the field looks the same on every load. */
function hash(r, c) {
  let h = (r * 374761393 + c * 668265263 + 97) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Dark near the copy, brighter out on the wings, never bright on the edges. */
function toneFor(r, c, dx) {
  const v = hash(r, c);
  const away = Math.abs(dx);
  let tone;
  if (away < 380) tone = v < 0.6 ? 0 : 1;
  else if (away < 470) tone = v < 0.4 ? 0 : v < 0.75 ? 1 : 2;
  else tone = v < 0.25 ? 0 : v < 0.5 ? 1 : v < 0.78 ? 2 : v < 0.93 ? 3 : 5;
  return Math.abs(r) === ROWS && tone > 2 ? 2 : tone;
}

/** Adds the frame and the power-on delay, which spreads out from the centre. */
function place(cell, dx, dy) {
  return {
    ...cell,
    dx,
    dy,
    x: dx - CELL_W / 2,
    y: Math.round(dy - CELL_H / 2),
    enter: Math.round(150 + Math.hypot(dx, dy * 1.3) * 0.55),
  };
}

const tileAt = new Set(TILES.map(tile => `${tile.r},${tile.dx}`));

/** The plain cells: everything in the field that is not a tile. */
export const CELLS = [];
for (let r = -ROWS; r <= ROWS; r++) {
  for (let c = -COLUMNS; c <= COLUMNS; c++) {
    const dx = c * PITCH_X + (Math.abs(r) % 2 ? PITCH_X / 2 : 0);
    if (Math.abs(dx) > 1090 || tileAt.has(`${r},${dx}`)) continue;
    CELLS.push(
      place({ key: `${r},${c}`, tone: toneFor(r, c, dx) }, dx, r * PITCH_Y)
    );
  }
}
