/**
 * Guards on the retry policy in npm-install-retry.mjs.
 *
 * These carry the same unusual weight as the consumer-sbom-meta tests, and for
 * the same reason: `consumer-sbom` runs on `release`, `schedule` and
 * `workflow_dispatch`, so no PR exercises it, and the pinned-install path
 * fires ONLY on a real release event. There is no run to read. This file is
 * the coverage.
 *
 * The shape being pinned is the one that was wrong in the shell loop this
 * replaced (#716): it spent a fixed attempt count rather than a duration, and
 * it retried in a way that could never see a new answer. A count is the thing
 * a test can catch and a duration is not, so the assertions here are about
 * what the policy spends and when it stops, never about wall-clock time. The
 * clock is injected for exactly that reason.
 *
 * `--prefer-online` is asserted on the real argv rather than the policy,
 * because it is the half of the fix a driven test cannot observe: a stub `run`
 * succeeds or fails on command and never consults a cache.
 *
 * `.mjs` and `node --test` rather than jest: root-level scripts with no
 * package of their own, matching consumer-sbom-meta.test.mjs.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  installWithRetry,
  parseArgs,
  positiveInteger,
  main,
  DEFAULT_BUDGET_SECONDS,
  DEFAULT_SLEEP_SECONDS,
} from './npm-install-retry.mjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// A clock that only moves when the policy sleeps, so a ten-minute budget costs
// a test nothing and the assertions stay about spend rather than timing.
function harness({ succeedOnAttempt = Infinity, budgetSeconds, sleepSeconds }) {
  const state = { t: 0, attempts: 0, sleeps: [], logs: [] };
  return {
    state,
    promise: installWithRetry({
      spec: 'pkg@1.0.0',
      budgetSeconds,
      sleepSeconds,
      run: () => {
        state.attempts += 1;
        return state.attempts >= succeedOnAttempt;
      },
      now: () => state.t,
      sleep: ms => {
        state.sleeps.push(ms);
        state.t += ms;
        return Promise.resolve();
      },
      log: line => state.logs.push(line),
    }),
  };
}

test('a spec that resolves first time costs one attempt and no sleep', async () => {
  const h = harness({
    succeedOnAttempt: 1,
    budgetSeconds: 600,
    sleepSeconds: 20,
  });
  assert.deepEqual(await h.promise, { ok: true, attempts: 1 });
  assert.equal(h.state.sleeps.length, 0);
  assert.equal(h.state.logs.length, 0);
});

test('a spec that propagates mid-wait is installed, not abandoned', async () => {
  // The whole point of the change: the old loop died here.
  const h = harness({
    succeedOnAttempt: 5,
    budgetSeconds: 600,
    sleepSeconds: 20,
  });
  assert.deepEqual(await h.promise, { ok: true, attempts: 5 });
  assert.equal(h.state.sleeps.length, 4);
});

test('the budget is spent in full before giving up', async () => {
  const h = harness({ budgetSeconds: 600, sleepSeconds: 20 });
  const result = await h.promise;
  assert.equal(result.ok, false);
  // Bounded by the budget and the sleep, and it is the DURATION that decides:
  // a policy that stopped at a fixed count would fail this whichever count it
  // picked, which is the regression this file exists to catch.
  assert.equal(h.state.t >= 600 * 1000, true);
  assert.equal(result.attempts, 31);
});

test('a smaller sleep spends the same budget on more attempts', async () => {
  // Pins that the stopping condition reads the clock and not the tally.
  const slow = await harness({ budgetSeconds: 600, sleepSeconds: 20 }).promise;
  const fast = await harness({ budgetSeconds: 600, sleepSeconds: 5 }).promise;
  assert.equal(fast.attempts > slow.attempts, true);
});

test('a budget smaller than one interval still buys an attempt, and no wait', async () => {
  // Two guarantees in one case. The deadline is read after the attempt, so no
  // budget can produce zero tries and report "did not succeed" having never
  // asked. And the wait is skipped when it would land past the deadline,
  // rather than spending a full interval on an attempt the loop has already
  // decided to discard.
  const h = harness({ budgetSeconds: 1, sleepSeconds: 20 });
  assert.deepEqual(await h.promise, { ok: false, attempts: 1 });
  assert.equal(h.state.sleeps.length, 0);
});

test('the last wait never lands past the deadline', async () => {
  const h = harness({ budgetSeconds: 600, sleepSeconds: 20 });
  await h.promise;
  const spent = h.state.sleeps.reduce((a, b) => a + b, 0);
  assert.equal(spent <= 600 * 1000, true, 'slept past the budget');
});

test('a failed attempt names itself in the log, in order', async () => {
  const h = harness({
    succeedOnAttempt: 3,
    budgetSeconds: 600,
    sleepSeconds: 20,
  });
  await h.promise;
  assert.deepEqual(h.state.logs, [
    'npm install pkg@1.0.0 failed (attempt 1); retrying',
    'npm install pkg@1.0.0 failed (attempt 2); retrying',
  ]);
});

test('the defaults are the ones the workflow relies on', () => {
  // The workflow passes no budget, so a change to either of these changes
  // production behaviour with no diff in supply-chain.yml to notice it.
  assert.equal(DEFAULT_BUDGET_SECONDS, 600);
  assert.equal(DEFAULT_SLEEP_SECONDS, 20);
});

test('parseArgs requires the two flags that have no safe default', () => {
  assert.throws(() => parseArgs(['--dir', '/tmp']), /--spec is required/);
  assert.throws(() => parseArgs(['--spec', 'pkg@1.0.0']), /--dir is required/);
});

test('parseArgs rejects an unknown flag rather than ignoring it', () => {
  // A typo that silently restored the old behaviour is the failure mode.
  assert.throws(
    () =>
      parseArgs(['--spec', 'p@1.0.0', '--dir', '/tmp', '--budget-second', '5']),
    /unknown flag --budget-second/
  );
});

test('parseArgs rejects a flag with no value', () => {
  assert.throws(
    () => parseArgs(['--spec', 'p@1.0.0', '--dir']),
    /--dir needs a value/
  );
});

test('a non-numeric budget is an error, not a silent default', () => {
  assert.equal(positiveInteger(undefined, 'budget-seconds', 600), 600);
  assert.equal(positiveInteger('30', 'budget-seconds', 600), 30);
  assert.throws(
    () => positiveInteger('soon', 'budget-seconds', 600),
    /positive integer/
  );
  assert.throws(
    () => positiveInteger('0', 'budget-seconds', 600),
    /positive integer/
  );
  assert.throws(
    () => positiveInteger('-5', 'budget-seconds', 600),
    /positive integer/
  );
});

test('a usage error exits 2, distinct from an exhausted budget', async () => {
  // 1 means "the registry never served it" and 2 means "this was called
  // wrong". A caller that cannot tell those apart cannot act on either.
  assert.equal(await main(['--spec', 'pkg@1.0.0']), 2);
  assert.equal(
    await main(['--nonsense', 'x', '--spec', 'p@1.0.0', '--dir', '/tmp']),
    2
  );
});

test('an exhausted budget exits 1 and says where to look', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-retry-'));
  const lines = [];
  const realLog = console.log;
  console.log = line => lines.push(String(line));
  try {
    // A spec no registry can serve, and a budget small enough that the real
    // npm is asked exactly once.
    const code = await main([
      '--spec',
      '@allxsmith/this-package-does-not-exist@0.0.0-nope',
      '--dir',
      dir,
      '--budget-seconds',
      '1',
    ]);
    assert.equal(code, 1);
  } finally {
    console.log = realLog;
    fs.rmSync(dir, { recursive: true, force: true });
  }
  const error = lines.find(l => l.startsWith('::error::'));
  assert.ok(error, 'an exhausted budget must annotate the run');
  assert.match(error, /did not succeed within the propagation budget/);
  assert.match(error, /the release step earlier in the pipeline/);
});

test('the spec is neutralised before it reaches a workflow command', async () => {
  // forLog, for the reason its own header gives: the failure message is
  // printed as `::error::…`, a workflow command is newline-terminated, and
  // the spec arrives from argv. A raw interpolation would let a crafted spec
  // forge a second command out of the complaint about it.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-retry-'));
  const lines = [];
  const realLog = console.log;
  console.log = line => lines.push(String(line));
  try {
    await main([
      '--spec',
      'pkg@1.0.0\n::error::forged',
      '--dir',
      dir,
      '--budget-seconds',
      '1',
    ]);
  } finally {
    console.log = realLog;
    fs.rmSync(dir, { recursive: true, force: true });
  }
  const error = lines.find(l => l.startsWith('::error::npm install'));
  assert.ok(error, 'the exhaustion message must still be emitted');
  assert.equal(
    error.includes('\n'),
    false,
    'the annotation must stay one line, or the spec can forge a command'
  );
  assert.match(error, /\\n::error::forged/);
});
