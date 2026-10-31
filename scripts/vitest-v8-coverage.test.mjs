/**
 * Covers scripts/lib/vitest-v8-coverage.mjs: a module one test runs half of
 * in its worker, and a child process of that test runs the other half of.
 *
 * Both runs use a real Vitest over a fixture, once with that provider and once
 * with Vitest's own, because what the module fixes is the stock provider's
 * merge of the two. The module has an import, so Vite's transform moves its
 * byte offsets, which is the case the stock merge gets wrong.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { fixture, here, runVitest } from './lib/nested-vitest.mjs';

const require = createRequire(import.meta.url);

/** Runs the fixture with `provider` and returns lib.mjs's function counts. */
function functionsCounted(provider) {
  const dir = fixture({
    'lib.mjs': [
      "import { basename } from 'node:path';",
      "import { format } from 'node:util';",
      "export const inWorker = () => basename('/a/b');",
      'export function inChild() {',
      "  return format('%s', 'child');",
      '}',
      '',
    ].join('\n'),
    'child.mjs': "import { inChild } from './lib.mjs';\ninChild();\n",
    'lib.test.mjs': [
      "import { spawnSync } from 'node:child_process';",
      "import { inWorker } from './lib.mjs';",
      "test('runs one function here and the other in a child', () => {",
      "  if (inWorker() !== 'b') throw new Error('inWorker changed');",
      "  const run = spawnSync(process.execPath, ['child.mjs'], {",
      '    cwd: import.meta.dirname,',
      '  });',
      '  if (run.status !== 0) throw new Error(String(run.stderr));',
      '});',
      '',
    ].join('\n'),
    'vitest.config.mjs': `export default ${JSON.stringify({
      test: {
        globals: true,
        include: ['lib.test.mjs'],
        coverage: {
          provider: 'custom',
          customProviderModule: provider,
          autoAttachSubprocess: true,
          exclude: ['lib.test.mjs', 'child.mjs', 'vitest.config.mjs'],
          reporter: ['json-summary'],
        },
      },
    })};\n`,
  });
  try {
    const { status, output } = runVitest(dir, ['--coverage']);
    assert.equal(status, 0, output);
    const summary = JSON.parse(
      readFileSync(join(dir, 'coverage', 'coverage-summary.json'), 'utf8')
    );
    const { covered, total } = summary[join(dir, 'lib.mjs')].functions;
    return `${covered}/${total}`;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('a function only a child process runs is counted', () => {
  assert.equal(functionsCounted(here('./vitest-v8-coverage.mjs')), '2/2');
});

test("Vitest's own provider still loses it, so the fix is still needed", () => {
  // When this fails, an upgrade has fixed the merge: point the root config
  // at `v8` and delete scripts/lib/vitest-v8-coverage.mjs and this file.
  const stock = require.resolve('@vitest/coverage-v8');
  assert.equal(functionsCounted(stock), '1/2');
});
