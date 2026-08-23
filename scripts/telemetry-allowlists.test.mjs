/**
 * Holds the `telemetry-allowlists` conformance check to its failure contract
 * (#550 review): every parse/import failure must surface as a violation, and
 * a CLI value the worker does not list must be named. Fixtures drive the
 * branches the real (agreeing) tree never executes — the same reason
 * skills-roster.test.mjs is shaped this way.
 */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  constStringArray,
  cssModes,
  missingFromWorker,
  migrateSourceNames,
  checkTelemetryAllowlists,
} from './check-conformance.mjs';

test('the real tree passes the whole check', async () => {
  assert.deepEqual(await checkTelemetryAllowlists(), []);
});

test('a null producer is a loud violation, never a silent pass', () => {
  const v = missingFromWorker('template', null, ['vite'], 'worker.ts');
  assert.equal(v.length, 1);
  assert.match(v[0], /could not parse producer values for template/);
});

test('a missing or malformed worker array is a loud violation', () => {
  const v = missingFromWorker('template', ['vite'], null, 'worker.ts');
  assert.equal(v.length, 1);
  assert.match(v[0], /worker schema array is missing or malformed/);
});

test('a CLI value absent from the worker allowlist is named', () => {
  const v = missingFromWorker('template', ['vite', 'next'], ['vite'], 'w.ts');
  assert.equal(v.length, 1);
  assert.match(v[0], /'next'/);
  assert.match(v[0], /silently dropped/);
  assert.deepEqual(missingFromWorker('template', ['vite'], ['vite'], 'w'), []);
});

test('constStringArray parses the worker shape and nulls on absence', () => {
  const src = "const TEMPLATE_VALUES = ['vite', 'vite-ts'] as const;";
  assert.deepEqual(constStringArray(src, 'TEMPLATE_VALUES'), [
    'vite',
    'vite-ts',
  ]);
  assert.equal(constStringArray(src, 'MISSING_VALUES'), null);
});

test('cssModes parses the cli shape and nulls when it stops matching', () => {
  assert.deepEqual(
    cssModes("const CSS_MODES: CssMode[] = ['bestax', 'keep'];"),
    ['bestax', 'keep']
  );
  assert.equal(cssModes('const CSS_MODES = reshaped;'), null);
});

test('an unparseable source declaration is reported, not skipped', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'bestax-sources-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  mkdirSync(join(dir, 'good'));
  writeFileSync(
    join(dir, 'good', 'index.ts'),
    "export const good: MigrationSource = {\n  name: 'good-source',\n};\n"
  );
  mkdirSync(join(dir, 'reshaped'));
  writeFileSync(
    join(dir, 'reshaped', 'index.ts'),
    "export const bad = defineSource('bad-source');\n"
  );
  mkdirSync(join(dir, 'not-a-source'));

  const { names, unparsed } = await migrateSourceNames(dir);
  assert.deepEqual(names, ['good-source']);
  assert.deepEqual(unparsed, ['reshaped']);
});
