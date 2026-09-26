#!/usr/bin/env node
// Guard for the metrics the migration eval grades on: `bulma_component_classes`,
// `bestax_migrate_todos` and the `baseline` block beside them.
//
//   node eval/agent-loop/bin/test-migration-metrics.mjs
//
// A migration run is scored on how far those numbers move from baseline to the end, so a
// baseline read from the wrong tree, or a class count that quietly reads zero, would score
// a run that did nothing as a run that finished. Real git fixtures, the real collector,
// the real ESLint rule; only tsc and vite are stubbed. Needs the eslint-plugin build.

import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const COLLECTOR = join(HERE, 'collect-metrics.mjs');
const PLUGIN = join(
  HERE,
  '..',
  '..',
  '..',
  'eslint-plugin',
  'dist',
  'index.js'
);
if (!existsSync(PLUGIN)) {
  console.error(
    'the eslint-plugin build is missing; run `pnpm --filter @allxsmith/eslint-plugin-bestax build` first'
  );
  process.exit(1);
}

const git = (cwd, ...args) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 't',
      GIT_AUTHOR_EMAIL: 't@t',
      GIT_COMMITTER_NAME: 't',
      GIT_COMMITTER_EMAIL: 't@t',
    },
  });

// Three plain elements with a component class (box, button, card), one of them carrying
// an `is-` modifier, which is what raw_bulma_classnames counts.
const RAW = `export const A = () => (
  <div className="box">
    <button className="button is-primary">Save</button>
    <div className="card">Card</div>
  </div>
);
`;

// Two converted, the card left as markup with the codemod's TODO on it.
const MIGRATED = `import { Box, Button } from '@allxsmith/bestax-bulma';

export const A = () => (
  <Box>
    <Button color="primary">Save</Button>
    {/* TODO(bestax-migrate): convert the card by hand */}
    <div className="card">Card</div>
  </Box>
);
`;

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'agent-loop-migrate-'));
  const app = join(root, 'app');
  mkdirSync(join(app, 'src'), { recursive: true });
  mkdirSync(join(app, 'node_modules', '.bin'), { recursive: true });
  for (const name of ['tsc', 'vite']) {
    const p = join(app, 'node_modules', '.bin', name);
    writeFileSync(p, '#!/bin/sh\nexit 0\n');
    chmodSync(p, 0o755);
  }
  writeFileSync(join(app, 'package.json'), '{"name":"app"}\n');
  writeFileSync(join(app, '.gitignore'), 'node_modules\ndist\n');
  writeFileSync(join(app, 'src', 'App.tsx'), RAW);
  git(app, 'init', '-q', '.');
  git(app, 'add', '-A');
  git(app, 'commit', '-qm', 'baseline');
  git(app, 'tag', 'baseline');
  return { root, app };
}

const collect = app =>
  JSON.parse(
    execFileSync('node', [COLLECTOR, app, '', 'test'], { encoding: 'utf8' })
  );

const CASES = [
  [
    'untouched: the final tree reads the same as the baseline',
    () => {},
    {
      bulma_component_classes: 3,
      raw_bulma_classnames: 1,
      bestax_migrate_todos: 0,
      baseline: { bulma_component_classes: 3, raw_bulma_classnames: 1 },
    },
  ],
  [
    'migrated: the counts move and the baseline stays put',
    ({ app }) => writeFileSync(join(app, 'src', 'App.tsx'), MIGRATED),
    {
      bulma_component_classes: 1,
      raw_bulma_classnames: 0,
      bestax_migrate_todos: 1,
      baseline: { bulma_component_classes: 3, raw_bulma_classnames: 1 },
    },
  ],
  [
    'a new file counts in the final tree and not in the baseline',
    ({ app }) =>
      writeFileSync(
        join(app, 'src', 'Extra.tsx'),
        'export const B = () => <div className="notification">Hi</div>;\n'
      ),
    {
      bulma_component_classes: 4,
      raw_bulma_classnames: 1,
      bestax_migrate_todos: 0,
      baseline: { bulma_component_classes: 3, raw_bulma_classnames: 1 },
    },
  ],
  [
    'a file that does not parse nulls the count rather than reading zero',
    ({ app }) =>
      writeFileSync(
        join(app, 'src', 'Broken.tsx'),
        'export const B = () => (<div className="box">;\n'
      ),
    {
      bulma_component_classes: null,
      unparsed_files: ['src/Broken.tsx'],
      baseline: { bulma_component_classes: 3 },
    },
  ],
  [
    'a modifier inside a conditional className still counts as raw',
    ({ app }) =>
      writeFileSync(
        join(app, 'src', 'Tabs.tsx'),
        `export const T = ({ on }: { on: boolean }) => (
  <ul>
    <li className={on ? 'is-active' : ''}>One</li>
    <li className={cx('tab', !on && 'is-active')}>Two</li>
  </ul>
);
`
      ),
    {
      raw_bulma_classnames: 3,
      baseline: { raw_bulma_classnames: 1 },
    },
  ],
  [
    'deleting the markup shrinks the tree, and the baseline keeps its size',
    ({ app }) =>
      writeFileSync(
        join(app, 'src', 'App.tsx'),
        'export const A = () => null;\n'
      ),
    {
      bulma_component_classes: 0,
      src_tsx_files: 1,
      src_total_lines: 2,
      baseline: {
        bulma_component_classes: 3,
        src_tsx_files: 1,
        src_total_lines: 7,
      },
    },
  ],
];

const pick = (m, want) =>
  Object.fromEntries(
    Object.keys(want).map(k => [
      k,
      k === 'baseline'
        ? Object.fromEntries(
            Object.keys(want.baseline).map(b => [b, m.baseline?.[b]])
          )
        : m[k],
    ])
  );

let failed = 0;
for (const [label, mutate, want] of CASES) {
  const fx = fixture();
  try {
    mutate(fx);
    const got = pick(collect(fx.app), want);
    if (JSON.stringify(got) === JSON.stringify(want)) {
      console.log(`ok    ${label}`);
    } else {
      failed++;
      console.error(`FAIL  ${label}`);
      console.error(`        expected ${JSON.stringify(want)}`);
      console.error(`        got      ${JSON.stringify(got)}`);
    }
  } finally {
    rmSync(fx.root, { recursive: true, force: true });
  }
}

console.log(
  failed === 0 ? `\n${CASES.length} cases pass` : `\n${failed} FAILURES`
);
process.exit(failed === 0 ? 0 : 1);
