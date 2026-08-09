#!/usr/bin/env node
// Guard for `app_modified` / `files_changed_vs_baseline` — the input the rubric gate zeroes
// an entire run on, so a wrong value here is the most expensive kind of wrong number.
//
//   node eval/agent-loop/bin/test-app-modified.mjs
//
// Two bugs have already lived in this one field: it did not exist (so category 1's
// "unmodified → 0" anchor was unreachable and an untouched scaffold scored 15/15), and then
// the collector measured AFTER running its own tsc/vite, so its `tsconfig.tsbuildinfo`
// counted as builder work and would have marked every run modified. Both are cases below.
//
// Builds real git fixtures and runs the real collector — stubbing only tsc/vite, so the
// ordering between "measure the diff" and "run the build" is exercised for real.

import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  chmodSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const COLLECTOR = join(
  dirname(fileURLToPath(import.meta.url)),
  'collect-metrics.mjs'
);
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

/** A scaffold at its baseline tag: stub toolchain, realistic .gitignore, one committed src file. */
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'agent-loop-appmod-'));
  const app = join(root, 'app');
  mkdirSync(join(app, 'src'), { recursive: true });
  mkdirSync(join(app, 'node_modules', '.bin'), { recursive: true });

  // Stubs that write where the real tools write: tsc drops tsconfig.tsbuildinfo in the app
  // root (NOT covered by the scaffold .gitignore — see runs/i09), vite writes dist/.
  const bin = (name, body) => {
    const p = join(app, 'node_modules', '.bin', name);
    writeFileSync(p, `#!/bin/sh\n${body}\nexit 0\n`);
    chmodSync(p, 0o755);
  };
  bin('tsc', 'echo "{}" > tsconfig.tsbuildinfo');
  bin('vite', 'mkdir -p dist && echo x > dist/bundle.js');

  writeFileSync(join(app, 'package.json'), '{"name":"app"}\n');
  writeFileSync(join(app, 'src', 'a.ts'), 'export const A = 1;\n');
  writeFileSync(join(app, '.gitignore'), 'node_modules\ndist\n'); // matches the vite-ts template
  writeFileSync(
    join(root, 't.jsonl'),
    '{"type":"result","subtype":"success"}\n'
  );

  git(app, 'init', '-q', '.');
  git(app, 'add', '-A');
  git(app, 'commit', '-qm', 'baseline');
  git(app, 'tag', 'baseline');
  return { root, app, transcript: join(root, 't.jsonl') };
}

const collect = ({ app, transcript }) =>
  JSON.parse(
    execFileSync('node', [COLLECTOR, app, transcript, 'test'], {
      encoding: 'utf8',
    })
  );

const CASES = [
  [
    "untouched scaffold — the collector's OWN tsbuildinfo must not count",
    () => {},
    false,
  ],
  [
    'builder CREATED a source file, nothing staged',
    ({ app }) =>
      writeFileSync(join(app, 'src', 'NewPage.tsx'), 'export const B = 2;\n'),
    true,
  ],
  [
    "same, after the runner's git add -A (must not double count)",
    ({ app }) => {
      writeFileSync(join(app, 'src', 'NewPage.tsx'), 'export const B = 2;\n');
      git(app, 'add', '-A');
    },
    true,
  ],
  [
    'builder MODIFIED an existing tracked file, unstaged',
    ({ app }) =>
      writeFileSync(join(app, 'src', 'a.ts'), 'export const A = 99;\n'),
    true,
  ],
  [
    'only gitignored build output present',
    ({ app }) => {
      mkdirSync(join(app, 'dist'), { recursive: true });
      writeFileSync(join(app, 'dist', 'stale.js'), 'x\n');
    },
    false,
  ],
];

let failed = 0;
for (const [label, mutate, wantModified] of CASES) {
  const fx = fixture();
  try {
    mutate(fx);
    const m = collect(fx);
    const ok = m.app_modified === wantModified;
    if (!ok) {
      failed++;
      console.error(`FAIL  ${label}`);
      console.error(
        `        expected app_modified=${wantModified}, got ${m.app_modified} (files_changed=${m.files_changed_vs_baseline})`
      );
    } else {
      console.log(
        `ok    ${label}  [files_changed=${m.files_changed_vs_baseline}]`
      );
    }
  } finally {
    rmSync(fx.root, { recursive: true, force: true });
  }
}

console.log(
  failed === 0 ? `\n${CASES.length} cases pass` : `\n${failed} FAILURES`
);
process.exit(failed === 0 ? 0 : 1);
