/**
 * The build gate, exercised through the CLI rather than through `verifyArtifact`.
 *
 * `verifyArtifact` had unit coverage already and still shipped a hole: `main()`
 * skipped verification whenever `transform()` was a no-op, which silently exempted
 * the one shape the gate exists to catch (a mid-line tag the line-anchored pattern
 * deliberately ignores). Testing the pure function could not see that — the wiring
 * is what was wrong. So these run the real script against a temp directory.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const SCRIPT = fileURLToPath(
  new URL('./flatten-llms-tabs.mjs', import.meta.url)
);

/** Write `files` into a fresh temp build dir and run the script over it. */
async function runGate(files) {
  const dir = await mkdtemp(path.join(tmpdir(), 'flatten-gate-'));
  for (const [name, body] of Object.entries(files)) {
    const full = path.join(dir, name);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body);
  }

  try {
    const { stdout } = await run(process.execPath, [SCRIPT, dir]);
    return { ok: true, stdout, dir };
  } catch (error) {
    return { ok: false, stderr: error.stderr ?? '', code: error.code, dir };
  }
}

test('a clean artifact passes and is rewritten', async () => {
  const result = await runGate({
    'llms-full.txt': '# Docs\n\n<PackageManagerTabs command="add foo" />\n',
  });

  assert.ok(result.ok, `expected success, got: ${result.stderr}`);
  assert.match(result.stdout, /rewrote 1 file/);

  const out = await readFile(path.join(result.dir, 'llms-full.txt'), 'utf8');
  assert.match(out, /```bash\npnpm add foo\n```/);
});

test('the gate fails on a mid-line tag even though the transform is a no-op', async () => {
  // The regression. transform() leaves this untouched, so the old `after ===
  // before` early-continue skipped verification entirely and the build passed.
  const result = await runGate({
    'llms-full.txt':
      'Install it with <PackageManagerTabs command="add foo" /> today.\n',
  });

  assert.equal(result.ok, false, 'expected the build to fail');
  assert.match(result.stderr, /failed verification/);
  assert.match(result.stderr, /unflattened tab JSX/);
  assert.match(result.stderr, /llms-full\.txt/);
});

test('the gate fails on a dedented fence body', async () => {
  const result = await runGate({
    'docs/guide.md': [
      '1. **Step:**',
      '',
      '   ```bash',
      'pnpm add foo',
      '```',
      '',
      '<PackageManagerTabs command="install" />',
    ].join('\n'),
  });

  assert.equal(result.ok, false);
  assert.match(result.stderr, /dedented below its opening fence/);
});

test('artifacts with no tab JSX are not even read for problems', async () => {
  // The NEEDS_FLATTENING prefilter still applies — an unrelated malformed page
  // must not start failing the docs build.
  const result = await runGate({
    'docs/unrelated.md': '# Title\n\n```bash\nnever closed\n',
  });

  assert.ok(result.ok, `expected success, got: ${result.stderr}`);
  assert.match(result.stdout, /rewrote 0 file/);
});

test('non-artifact files are ignored', async () => {
  const result = await runGate({
    'robots.txt': '<PackageManagerTabs command="add foo" /> mid line\n',
    'assets/app.js': 'const x = "<Tabs>";\n',
  });

  assert.ok(result.ok, `expected success, got: ${result.stderr}`);
  assert.match(result.stdout, /rewrote 0 file/);
});
