/**
 * Login: the page's full-screen background and its favicon.
 */
import { Scene, document, fit, hash3, place, renderScene } from '../voxel.mjs';
import { bandedSky, cloud, rect, sprite, squareSun } from '../backdrop.mjs';
import { C, grain } from '../blocks.mjs';

const W = 1920;
const H = 1280;
const HORIZON = 760;

function lighthouse() {
  const s = new Scene({ seed: 7 });
  const rock = grain('login-rock', '#4b3550');
  const rockTop = grain('login-rock-top', '#4b3550', { top: '#6b4d66' });
  const sand = grain('login-sand', '#d8a98a');
  const white = grain('login-white', '#f1e9e1', { spread: 0.04 });
  const red = grain('login-red', '#c4475f', { spread: 0.05 });
  const lamp = grain('login-lamp', '#ffe9a3', { spread: 0.04, flat: true });
  const roof = grain('login-roof', '#a8374f', { spread: 0.05 });
  const gallery = grain('login-gallery', '#3b2a3d');
  const door = grain('login-door', '#5a3a2c');

  // A rocky island, highest under the tower, with a beach at the waterline.
  const W = 13;
  const D = 11;
  for (let x = 0; x < W; x++)
    for (let y = 0; y < D; y++) {
      const dx = (x - 6) / 6.5;
      const dy = (y - 5) / 5.5;
      const r = dx * dx + dy * dy;
      if (r > 1) continue;
      const h = Math.max(
        1,
        Math.round((1 - r) * 4.2 + hash3(x, y, 0, 3) * 1.2)
      );
      for (let z = 0; z < h; z++)
        s.set(x, y, z, z === h - 1 ? (r > 0.72 ? sand : rockTop) : rock);
    }
  // The tower: a 3x3 column in bands, a gallery, the lamp and a roof.
  const base = 5;
  for (let z = 0; z < base; z++) s.box(5, 4, z, 3, 3, 1, rock);
  for (let k = 0; k < 10; k++)
    s.box(5, 4, base + k, 3, 3, 1, Math.floor(k / 2) % 2 ? red : white);
  s.set(6, 6, base, door);
  s.set(6, 6, base + 1, door);
  s.box(4, 3, base + 10, 5, 5, 1, gallery);
  s.box(5, 4, base + 11, 3, 3, 2, lamp);
  s.box(5, 4, base + 13, 3, 3, 1, roof);
  s.set(6, 5, base + 14, roof);
  return s;
}

function sailboat() {
  const s = new Scene({ seed: 9 });
  const hull = grain('login-hull', '#5a3349');
  const sail = grain('login-sail', '#f6e7d2', { spread: 0.04 });
  const mast = grain('login-mast', '#3a2433');
  s.box(0, 0, 0, 7, 2, 1, hull);
  s.box(1, 0, 1, 5, 2, 1, hull);
  for (let k = 0; k < 8; k++) s.set(3, 0, 2 + k, mast);
  for (let k = 0; k < 7; k++)
    for (let i = 4; i < 4 + Math.ceil((7 - k) / 2); i++)
      s.set(i, 0, 2 + k, sail);
  for (let k = 0; k < 5; k++)
    for (let i = 3 - Math.ceil((5 - k) / 2); i < 3; i++)
      s.set(i, 0, 2 + k, sail);
  return s;
}

const light = { color: '#2a1230', left: 0.14, right: 0.32 };

function background() {
  const defs = [];
  const layers = [];
  layers.push(
    bandedSky(
      W,
      HORIZON,
      [
        [0, '#fff3c4'],
        [0.55, '#ffd789'],
        [1, '#f6a060'],
      ],
      10
    )
  );
  layers.push(
    squareSun(470, HORIZON - 20, 200, '#fff6d6', {
      glow: ['#ffcf7a', '#ffe1a0'],
      step: 26,
    })
  );
  layers.push(
    cloud(140, 170, 34, 3, 16, {
      seed: 3,
      color: '#fff7dd',
      shadow: '#ffe7b0',
      opacity: 0.85,
    })
  );
  layers.push(
    cloud(1360, 270, 26, 3, 16, {
      seed: 5,
      color: '#fff7dd',
      shadow: '#ffe7b0',
      opacity: 0.85,
    })
  );
  layers.push(
    cloud(80, 520, 18, 2, 14, {
      seed: 8,
      color: '#ffc98a',
      shadow: '#f8b277',
      opacity: 0.7,
    })
  );
  layers.push(
    bandedSky(
      W,
      H,
      [
        [0, '#c45f7a'],
        [0.4, '#7c3a63'],
        [1, '#2c1630'],
      ],
      9,
      HORIZON
    )
  );
  // The sun's path on the water, and a few glints.
  [
    [0, 150],
    [1, 120],
    [2, 170],
    [3, 90],
    [4, 120],
    [5, 60],
  ].forEach(([i, w]) =>
    layers.push(
      rect(
        470 - w / 2 + ((i * 37) % 30) - 15,
        HORIZON + 22 + i * 34,
        w,
        10,
        '#ffd994',
        0.8 - i * 0.1
      )
    )
  );
  [
    [880, 880, 90],
    [1120, 960, 70],
    [260, 1010, 80],
  ].forEach(([x, y, w]) => layers.push(rect(x, y, w, 8, '#e07f93', 0.5)));

  const house = renderScene(lighthouse(), { light });
  const at = fit(
    house.bounds,
    { x: 1380, y: 380, width: 500, height: 600 },
    { align: [0.5, 1] }
  );
  // The lamp's beam, behind the tower.
  layers.push(
    `<path fill="#fff4c8" fill-opacity="0.35" d="M${Math.round(at.x + 0.42 * house.bounds.width * at.scale)} ${Math.round(at.y + 0.28 * house.bounds.height * at.scale + house.bounds.y * at.scale)}L980 380L980 560z"/>`
  );
  layers.push(place(house, at));

  const boat = renderScene(sailboat(), { light });
  layers.push(
    place(
      boat,
      fit(
        boat.bounds,
        { x: 1130, y: HORIZON - 130, width: 130, height: 150 },
        { align: [0.5, 1] }
      )
    )
  );

  // Birds.
  const bird = ['x...x', '.x.x.', '..x..'];
  [
    [1250, 420, 6],
    [1310, 380, 5],
    [1190, 455, 4],
  ].forEach(([x, y, px]) =>
    layers.push(sprite(bird, { x: '#7a3a55' }, x, y, px))
  );

  return document({
    width: W,
    height: H,
    label:
      'A blocky sea at sunset, with a square sun on the horizon, a sailboat and a lighthouse on a rocky island',
    defs,
    layers,
  });
}

function favicon() {
  const lock = [
    '....kkkkkk....',
    '...kk....kk...',
    '..kk......kk..',
    '..k........k..',
    '..k........k..',
    '.aaaaaaaaaaaa.',
    '.abbbbbbbbbba.',
    '.abbbbddbbbba.',
    '.abbbddddbbba.',
    '.abbbbddbbbba.',
    '.abbbbddbbbba.',
    '.abbbbbbbbbba.',
    '.aaaaaaaaaaaa.',
  ];
  return document({
    width: 64,
    height: 64,
    label: 'A blocky padlock',
    layers: [
      '<rect width="64" height="64" rx="12" fill="#2a1a12"/>',
      sprite(
        lock,
        { k: '#c9c2b8', a: '#b45309', b: C.gold, d: '#4a2a0c' },
        4,
        6,
        4
      ),
    ],
  });
}

export default [
  {
    path: 'public/media/background.svg',
    depicts:
      "A blocky sea at sunset: a square sun half set on the horizon at the left, a sailboat, and a striped lighthouse on a rocky island at the right with its beam lit; the page's full-screen background.",
    draw: background,
  },
  {
    path: 'public/favicon.svg',
    depicts: 'A blocky gold padlock on a dark rounded square.',
    draw: favicon,
  },
];
