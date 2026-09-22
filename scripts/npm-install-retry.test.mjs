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
 * succeeds or fails on command and never consults a cache. Deleting the flag
 * has to fail something here, or the outage it caused could return under a
 * larger budget and every case would stay green.
 *
 * Nothing here reaches the network or spawns anything. Both the runner and the
 * clock are injected, so the whole budget costs no time however large it is
 * set, and a crafted spec is never handed to a real subprocess that might give
 * it a second reading.
 *
 * `.mjs` and `node --test` rather than jest: root-level scripts with no
 * package of their own, matching consumer-sbom-meta.test.mjs.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  installWithRetry,
  runNpmInstall,
  defaultSleep,
  FATAL_SPAWN_CODES,
  parseArgs,
  positiveInteger,
  main,
  INSTALL_ARGS,
  DEFAULT_BUDGET_SECONDS,
  DEFAULT_SLEEP_SECONDS,
} from './npm-install-retry.mjs';

// A clock that only moves when the policy sleeps, so the budget costs a test
// nothing whatever it is set to and the assertions stay about spend rather
// than timing.
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
  assert.deepEqual(await h.promise, { ok: true, attempts: 1, waited: 0 });
  assert.equal(h.state.sleeps.length, 0);
  // Silent on the happy path: every release that resolves first time would
  // otherwise carry a measurement of zero.
  assert.equal(h.state.logs.length, 0);
});

test('a spec that propagates mid-wait is installed, not abandoned', async () => {
  // The whole point of the change: the old loop died here.
  const h = harness({
    succeedOnAttempt: 5,
    budgetSeconds: 600,
    sleepSeconds: 20,
  });
  assert.deepEqual(await h.promise, { ok: true, attempts: 5, waited: 80 });
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
  assert.deepEqual(await h.promise, { ok: false, attempts: 1, waited: 0 });
  assert.equal(h.state.sleeps.length, 0);
});

test('the last wait never lands past the deadline', async () => {
  // A budget the interval does NOT divide. With 600 and 20 the final sleep
  // lands exactly ON the deadline, so the overshoot guard changes nothing and
  // this case passed with the guard deleted — it was asserting arithmetic, not
  // behaviour. 50 and 20 leave a remainder, which is the only shape that can
  // tell the two policies apart.
  const h = harness({ budgetSeconds: 50, sleepSeconds: 20 });
  const result = await h.promise;
  const spent = h.state.sleeps.reduce((a, b) => a + b, 0);
  assert.equal(spent, 40 * 1000, 'stopped at the last wait that fits');
  assert.equal(spent <= 50 * 1000, true, 'slept past the budget');
  // The elapsed figure on the FAILURE return, which needs a budget where the
  // true answer is not zero. The small-budget case above cannot pin this:
  // there the real elapsed is 0, so `waited: 0` is indistinguishable from the
  // figure never being computed, and an exhausted release would report
  // `0s of 900s` forever.
  assert.equal(result.waited, 40, 'an exhausted leg must report what it spent');
  // Without the guard this is 4: a fourth attempt bought by a sleep that
  // overshot to 60s on a 50s budget.
  assert.equal(result.attempts, 3);
});

test('the measurement starts at the first retry, not the second', async () => {
  // The boundary of `attempt > 1`. With only a succeeds-on-3 case above it,
  // `attempt > 2` survives the suite while silently dropping the modal case:
  // one failure, one wait, then resolved.
  const h = harness({
    succeedOnAttempt: 2,
    budgetSeconds: 900,
    sleepSeconds: 20,
  });
  const result = await h.promise;
  assert.deepEqual(result, { ok: true, attempts: 2, waited: 20 });
  assert.deepEqual(h.state.logs, [
    'npm install "pkg@1.0.0" failed (attempt 1); retrying',
    'resolved after 20s and 2 attempts',
  ]);
});

test('a failed attempt names itself in the log, in order', async () => {
  const h = harness({
    succeedOnAttempt: 3,
    budgetSeconds: 600,
    sleepSeconds: 20,
  });
  await h.promise;
  // Quoted, because the spec goes through forLog on the way out. The quotes
  // are the visible edge of that: an unquoted spec here means the neutralising
  // was removed.
  assert.deepEqual(h.state.logs, [
    'npm install "pkg@1.0.0" failed (attempt 1); retrying',
    'npm install "pkg@1.0.0" failed (attempt 2); retrying',
    // The measurement, emitted only when it took more than one go. This is
    // the number that sizing the budget had to be reconstructed from, release
    // by release, out of the registry API.
    'resolved after 40s and 3 attempts',
  ]);
});

test('the real sleep actually waits', async () => {
  // The one function an injected clock cannot cover, and the mutant is quiet:
  // dropping the `ms` argument leaves every other case green, because they
  // all supply their own sleep, while turning a few dozen packument reads
  // into a few thousand inside the same budget.
  const start = Date.now();
  await defaultSleep(60);
  const waited = Date.now() - start;
  assert.equal(
    waited >= 50,
    true,
    `returned after ${waited}ms, expected a wait`
  );
});

test('a spawn that failed says so, since it prints nothing itself', async () => {
  // stdio inherit carries npm's own diagnosis when npm runs. A spawn-level
  // failure produced no output to inherit, so without this line the errno is
  // nowhere and the log is a column of bare retry lines.
  const lines = [];
  const spawn = () => ({
    error: Object.assign(new Error('spawn npm EAGAIN'), { code: 'EAGAIN' }),
  });
  assert.equal(
    runNpmInstall('pkg@1.0.0', '/tmp', spawn, l => lines.push(l)),
    false
  );
  assert.equal(lines.length, 1);
  assert.match(lines[0], /EAGAIN/);
});

test('the defaults are the ones the workflow relies on', () => {
  // The workflow passes no budget, so a change to either of these changes
  // production behaviour with no diff in supply-chain.yml to notice it.
  assert.equal(DEFAULT_BUDGET_SECONDS, 900);
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

test('parseArgs rejects a bare value where a flag belongs', () => {
  // `--spec --dir /tmp` would otherwise read `--dir` as the spec and leave
  // the real dir as a stray positional.
  assert.throws(
    () => parseArgs(['pkg@1.0.0', '--dir', '/tmp']),
    /unexpected argument/
  );
  assert.throws(
    () => parseArgs(['--spec', 'pkg@1.0.0', '/tmp']),
    /unexpected argument/
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
  //
  // The log is captured rather than left to fall through to console.log:
  // these messages are `::error::` workflow commands, and on a runner an
  // uncaptured one is filed as a failure annotation against a green test run.
  const lines = [];
  const log = l => lines.push(l);
  assert.equal(await main(['--spec', 'pkg@1.0.0'], { log }), 2);
  assert.equal(
    await main(['--nonsense', 'x', '--spec', 'p@1.0.0', '--dir', '/tmp'], {
      log,
    }),
    2
  );
  assert.equal(lines.length, 2, 'each usage error says why');
});

test('main exits 0 when the install succeeds, and says nothing', async () => {
  // The entry point's success path. Everything below main was covered and
  // this was not, so `return 0` could become `return 1` with the whole suite
  // green while every leg of every release failed under `bash -e`.
  const lines = [];
  const code = await main(['--spec', 'pkg@1.0.0', '--dir', '/tmp'], {
    run: () => true,
    sleep: () => Promise.resolve(),
    log: l => lines.push(l),
  });
  assert.equal(code, 0);
  assert.deepEqual(lines, [], 'a clean install must annotate nothing');
});

test('main hands the spec and the dir to npm the right way round', async () => {
  // The one production line between parseArgs and spawnSync: injecting `run`
  // replaces the installer and skips it, so this case stubs `spawn` instead
  // and leaves the wiring in the path. Swapping the two arguments here fails
  // every release with exit 2 while every other case stays green.
  const calls = [];
  const code = await main(['--spec', 'pkg@2.3.4', '--dir', '/somewhere'], {
    spawn: (cmd, args, opts) => {
      calls.push({ cmd, args, opts });
      return { status: 0 };
    },
    sleep: () => Promise.resolve(),
    log: () => {},
  });
  assert.equal(code, 0);
  assert.deepEqual(calls, [
    {
      cmd: 'npm',
      args: ['install', '--prefer-online', '--ignore-scripts', 'pkg@2.3.4'],
      opts: { cwd: '/somewhere', stdio: 'inherit' },
    },
  ]);
});

test('an exhausted budget exits 1 and says where to look', async () => {
  const lines = [];
  // The clock is injected as well as the sleep. Without it this case's runtime
  // depends on the code under test: it is instant only because the production
  // overshoot guard stops after one attempt, and it busy-looped for a real
  // second under the mutant that removed that guard.
  let clock = 0;
  const code = await main(
    // A budget with room for real waits, so the message pins a spend that is
    // not zero. With a one-second budget the true elapsed IS zero, and then
    // `0s` proves nothing about whether the figure was computed at all.
    ['--spec', 'pkg@1.0.0', '--dir', '/tmp', '--budget-seconds', '50'],
    {
      run: () => false,
      now: () => clock,
      sleep: ms => {
        clock += ms;
        return Promise.resolve();
      },
      log: l => lines.push(l),
    }
  );
  assert.equal(code, 1);
  const error = lines.find(l => l.startsWith('::error::'));
  assert.ok(error, 'an exhausted budget must annotate the run');
  assert.match(error, /did not succeed within the propagation budget/);
  assert.match(error, /the release step earlier in the pipeline/);
  assert.match(
    error,
    /\(40s of 50s, 3 attempts\)/,
    'the message carries the spend'
  );
});

test('every attempt carries --prefer-online, and the spec comes last', () => {
  // Row 1 of the third review: the flag whose absence caused the outage was
  // the one thing no test read. It cannot be observed through the policy,
  // because a stub runner never consults a cache, so it is read off the argv
  // the real runner builds.
  const calls = [];
  const spawn = (cmd, args, opts) => {
    calls.push({ cmd, args, opts });
    return { status: 0 };
  };
  assert.equal(runNpmInstall('pkg@1.0.0', '/somewhere', spawn), true);
  assert.deepEqual(calls, [
    {
      cmd: 'npm',
      args: ['install', '--prefer-online', '--ignore-scripts', 'pkg@1.0.0'],
      opts: { cwd: '/somewhere', stdio: 'inherit' },
    },
  ]);
  // Pinned as data too, so dropping it from the constant fails here even if
  // the call site is rewritten.
  assert.equal(INSTALL_ARGS.includes('--prefer-online'), true);
  assert.equal(INSTALL_ARGS.includes('--ignore-scripts'), true);
});

test('a non-zero npm exit is a failed attempt, not a crash', () => {
  const spawn = () => ({ status: 1 });
  assert.equal(runNpmInstall('pkg@1.0.0', '/tmp', spawn), false);
});

test('a signal-killed npm stays retryable', () => {
  // status null with no spawn error: the process ran and was killed. That is
  // the transient case this loop exists to absorb, so it must not be fatal.
  const spawn = () => ({ status: null, signal: 'SIGKILL' });
  assert.equal(runNpmInstall('pkg@1.0.0', '/tmp', spawn), false);
});

test('an npm that never started is fatal, not retried to the deadline', async () => {
  // Retrying a missing binary spends the whole budget and then blames
  // propagation for something propagation cannot explain.
  const spawn = () => ({
    error: Object.assign(new Error('spawn npm ENOENT'), { code: 'ENOENT' }),
  });
  // The directory is part of the message on purpose: libuv reports a failed
  // chdir identically to a missing binary, so `/could not run npm/` alone
  // passes with the cwd removed and the reader still sent to PATH.
  assert.throws(
    () => runNpmInstall('pkg@1.0.0', '/tmp/nowhere', spawn),
    /could not run npm in "\/tmp\/nowhere"/
  );

  const lines = [];
  const code = await main(['--spec', 'pkg@1.0.0', '--dir', '/tmp'], {
    run: () => {
      throw new Error('could not run npm: spawn npm ENOENT');
    },
    sleep: () => Promise.resolve(),
    log: l => lines.push(l),
  });
  assert.equal(
    code,
    2,
    'a missing npm is an environment failure, not a slow registry'
  );
  assert.ok(
    lines.some(l => l.includes('could not run npm')),
    'the annotation must name the real cause'
  );
});

test('a spawn failure a wait could fix stays retryable', () => {
  // EAGAIN from a fork and EMFILE are a busy machine, which is what the budget
  // is for. Treating every spawn-level error as permanent turned those into a
  // red release, and the shell loop retried them by accident of treating all
  // failures alike.
  for (const code of ['EAGAIN', 'EMFILE']) {
    const spawn = () => ({
      error: Object.assign(new Error(`spawn npm ${code}`), { code }),
    });
    // The log is captured, not left to console.log: the diagnosis line this
    // path now emits would otherwise print during `pnpm test`, which is the
    // leak #723 is about.
    const lines = [];
    assert.equal(
      runNpmInstall('pkg@1.0.0', '/tmp', spawn, l => lines.push(l)),
      false,
      `${code} must be a failed attempt, not a fatal error`
    );
    assert.match(lines[0], new RegExp(code));
  }
});

test('the fatal codes are the ones no wait can fix', () => {
  assert.deepEqual([...FATAL_SPAWN_CODES].sort(), [
    'EACCES',
    'ENOENT',
    'EPERM',
  ]);
});

test('the spec is neutralised in both places it is printed', async () => {
  // forLog, for the reason its own header gives: these print as `::error::`
  // and `npm install …` lines, a workflow command ends at a newline, and the
  // spec arrives from argv. The retry line is the one printed on EVERY
  // attempt, and it was the one still interpolating raw.
  const crafted = 'pkg@1.0.0\n::error::forged';
  const lines = [];
  // The clock is injected alongside the sleep. An instant sleep with a real
  // clock does not skip the wait, it busy-loops until the budget elapses in
  // wall-clock time — which is how this case first took the better part of a
  // minute to assert something instant.
  let clock = 0;
  const code = await main(
    ['--spec', crafted, '--dir', '/tmp', '--budget-seconds', '60'],
    {
      run: () => false,
      now: () => clock,
      sleep: ms => {
        clock += ms;
        return Promise.resolve();
      },
      log: l => lines.push(String(l)),
    }
  );
  assert.equal(code, 1);
  assert.ok(
    lines.length > 1,
    'the budget must have bought at least one retry line'
  );
  for (const line of lines) {
    assert.equal(
      line.includes('\n'),
      false,
      `a printed line carried a raw newline and could forge a command: ${JSON.stringify(line)}`
    );
  }
  assert.ok(
    lines.some(l => /failed \(attempt 1\); retrying/.test(l)),
    'the retry line is the one printed on every attempt, so it must be covered'
  );
});
