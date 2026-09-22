/**
 * Install one published spec, outlasting the registry that has to serve it.
 *
 * `consumer-sbom` pins the released leg to an exact version, and an exact
 * version is the one thing `latest` never was: unresolvable for a while after
 * `npm publish` returns. The `release` event fires when the GitHub release is
 * created, the version becomes installable when the registry finishes
 * propagating it, and nothing in CI can hurry the second clock.
 *
 * This lived as a shell loop in supply-chain.yml and was wrong in two ways at
 * once, on every release-triggered run for over a week, with nothing able to
 * catch it (#716):
 *
 *   - it retried without `--prefer-online`, so npm answered attempts two and
 *     three from the `~/.npm` packument attempt one had just cached. The
 *     sleeps proved the cache agreed with itself and nothing more.
 *   - it spent a fixed attempt count rather than a duration, and the count
 *     bought well under a minute.
 *
 * It is here rather than in the workflow because rule 9 of .github/CLAUDE.md
 * puts logic worth testing outside YAML, and this logic is worth testing for a
 * specific reason: `consumer-sbom` runs on `release`, `schedule` and
 * `workflow_dispatch`, so no PR event reaches it, and the released-leg path
 * fires ONLY on a real release. The test sibling is the only thing that can
 * fail when this policy is wrong. The version it replaces had no such thing,
 * which is exactly how it stayed broken.
 *
 * What this deliberately does NOT do is treat a version that will never exist
 * differently from one that has not propagated yet. Both return the same
 * `ETARGET / No matching version found`: the packument resolves and the
 * version is absent, with nothing to say whether it is absent forever. Since
 * the error cannot distinguish them, waiting is the only correct response, and
 * the message on exhaustion names the release step as the place to look.
 */
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { forLog } from './consumer-sbom-meta.mjs';

// The budget covers a clock nobody here controls: the gap between a release
// going up and the registry writing the new version into the packument. That
// gap has now been measured across the releases preceding this change, and it
// is usually under a couple of minutes but was once an order of magnitude
// worse — the numbers and how they were taken are on #716. This is set to
// clear the worst observed case with margin rather than the typical one,
// because the cost of being generous falls only on a release that was already
// broken, and it is cheap either way: this fires per release event, not per
// PR.
//
// These are what production runs on. The workflow passes neither flag, so
// changing a value here changes every release with no diff in
// supply-chain.yml to notice it, which is why a test pins both. The flags
// exist for the tests and for running the script by hand, not because
// anything configures them: the step hardcodes --spec and --dir, and
// workflow_dispatch on this workflow declares no inputs at all.
export const DEFAULT_BUDGET_SECONDS = 900;
export const DEFAULT_SLEEP_SECONDS = 20;

/**
 * The arguments every attempt carries, as data so a test can assert them.
 *
 * `--prefer-online` is load-bearing and its absence is invisible: drop it and
 * the retries still run, still log, still respect the budget, and still cannot
 * see a new answer, which is half of what kept #716 broken for a week. A
 * driven test cannot catch that — a stub runner never consults a cache — so
 * the list is pinned here instead of spelled inline at the call.
 */
export const INSTALL_ARGS = ['install', '--prefer-online', '--ignore-scripts'];

/**
 * Spawn failures no wait can fix: npm absent, or present and not runnable.
 *
 * An allowlist of fatal codes rather than a denylist of transient ones, so an
 * unrecognised spawn error is retried instead of ending the run. That trade is
 * deliberate but it is not free: a permanent failure outside this set
 * (`ENOEXEC`, `ENAMETOOLONG`) spends the whole budget and is then reported
 * with a propagation diagnosis it does not deserve. Wasting the budget on a
 * doomed leg is recoverable by reading the log; failing a release because a
 * runner was briefly out of file descriptors is not.
 */
export const FATAL_SPAWN_CODES = new Set(['ENOENT', 'EACCES', 'EPERM']);

/**
 * Retry `run` until it succeeds or the budget is spent.
 *
 * Every dependency that touches the outside world is injected so the policy
 * can be driven without a registry, a subprocess, or a real wait: `run`
 * reports success, `now` is the clock, `sleep` is the delay.
 *
 * The deadline is read only BETWEEN attempts, so an install that hangs rather
 * than failing is bounded by the job timeout instead of this budget. That was
 * true of the shell loop too, and it is not something a retry policy can fix.
 */
export async function installWithRetry({
  spec,
  budgetSeconds = DEFAULT_BUDGET_SECONDS,
  sleepSeconds = DEFAULT_SLEEP_SECONDS,
  run,
  now = () => Date.now(),
  sleep,
  log = console.log,
} = {}) {
  const started = now();
  const deadline = started + budgetSeconds * 1000;
  const elapsed = () => Math.round((now() - started) / 1000);
  let attempt = 0;
  for (;;) {
    attempt += 1;
    if (await run(spec)) {
      // Said out loud when it took more than one go, because nothing used to
      // record it: sizing the budget meant reading publish timestamps out of
      // the registry API afterwards, release by release.
      //
      // Read it as how long this leg waited, and nothing more. It is not a
      // measurement of propagation: it starts when this script starts, which
      // is already some way into the job and later still than the publish, and
      // it has one-interval granularity because the version may have become
      // servable anywhere in the wait before the attempt that noticed. What it
      // is good for is comparing against the budget, which starts at the same
      // instant, to see whether the budget is nowhere near being spent or
      // nearly was. This line prints the spend alone; the exhaustion message
      // is the one that prints both.
      //
      // It also only lives in the run log, so it is a rolling window rather
      // than a record: read it while the runs still exist.
      const waited = elapsed();
      if (attempt > 1) {
        log(`resolved after ${waited}s and ${attempt} attempts`);
      }
      return { ok: true, attempts: attempt, waited };
    }
    // Checked after the attempt rather than before it, so the budget always
    // buys at least one try however small it is set.
    //
    // The second half stops a wait that would land past the deadline. Without
    // it a budget shorter than one interval still sleeps a full one, to make
    // an attempt whose result the loop has already decided to discard — so a
    // leg that cannot be fixed by waiting reports its failure an interval
    // later than it knew it.
    //
    // The first half is redundant while `wait` is positive, which
    // positiveInteger currently guarantees by rejecting zero. It stays as the
    // condition that means what it says: the budget is spent. The second is a
    // refinement of it, and would silently allow one extra attempt at exactly
    // the deadline if a zero interval ever became reachable.
    const wait = sleepSeconds * 1000;
    if (now() >= deadline || now() + wait > deadline) {
      return { ok: false, attempts: attempt, waited: elapsed() };
    }
    // forLog here as well as on the exhaustion message. This line prints on
    // every attempt rather than once, so it is the likelier of the two to
    // carry a crafted spec into a workflow command, not the safer one.
    log(`npm install ${forLog(spec)} failed (attempt ${attempt}); retrying`);
    await sleep(wait);
  }
}

/**
 * One real `npm install`, inheriting stdio so the runner log keeps npm's own
 * diagnosis of each failure.
 *
 * An argument array, never a shell string: the spec reaches this from argv,
 * and a shell would give anything in it a second reading.
 *
 * `spawn` is injected so a test can read the argv this builds. That is the
 * only way to catch a dropped `--prefer-online`, since the flag's effect is a
 * cache decision inside npm rather than anything the caller observes.
 *
 * A spawn that could never start is thrown rather than returned as a failed
 * attempt. No amount of waiting installs anything when `npm` is not on PATH,
 * so retrying would spend the whole budget and then blame propagation for a
 * missing binary.
 *
 * Only the permanent codes though. `spawnSync` also reports resource failures
 * this way — `EAGAIN` from a fork, `EMFILE` — and those are precisely the
 * transient class this loop exists to absorb, which the shell loop happened to
 * retry by treating every non-zero result the same. Narrowing to the codes a
 * wait cannot fix keeps the fast failure for a missing binary without
 * converting a busy runner into a red release. A process that started and was
 * killed by a signal stays retryable for the same reason.
 */
export function runNpmInstall(spec, cwd, spawn = spawnSync, log = console.log) {
  const result = spawn('npm', [...INSTALL_ARGS, spec], {
    cwd,
    stdio: 'inherit',
  });
  if (result.error) {
    if (FATAL_SPAWN_CODES.has(result.error.code)) {
      // The cwd is named because libuv reports a failed chdir in the child
      // exactly as it reports a missing binary: both arrive as ENOENT, and
      // "spawn npm ENOENT" alone sends a reader to PATH when the directory
      // is what is missing.
      throw new Error(
        `could not run npm in ${forLog(cwd)}: ${result.error.message}`
      );
    }
    // Said out loud because nothing else will. `stdio: 'inherit'` carries
    // npm's own diagnosis when npm runs, but a spawn that failed produced no
    // output to inherit, so without this the errno is nowhere and the run
    // shows a column of bare retry lines under a propagation diagnosis that
    // does not fit.
    log(
      `npm could not be started (${result.error.code}), treating as a failed attempt`
    );
    return false;
  }
  return result.status === 0;
}

export function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key.startsWith('--'))
      throw new Error(`unexpected argument ${forLog(key)}`);
    if (i + 1 >= argv.length) throw new Error(`${key} needs a value`);
    flags[key.slice(2)] = argv[i + 1];
  }
  // Unknown flags are rejected rather than ignored, for the reason the sibling
  // script gives: every optional flag here weakens the policy by being absent,
  // so a typo would silently restore the behaviour this replaced.
  const known = ['spec', 'dir', 'budget-seconds', 'sleep-seconds'];
  for (const name of Object.keys(flags)) {
    if (!known.includes(name)) {
      throw new Error(`unknown flag --${name}`);
    }
  }
  for (const name of ['spec', 'dir']) {
    if (!flags[name]) throw new Error(`--${name} is required`);
  }
  return flags;
}

/**
 * Read a positive integer flag, rejecting anything else.
 *
 * A non-numeric budget silently becoming the default is the same class of
 * quiet downgrade as an ignored flag, so it is an error instead.
 */
export function positiveInteger(value, name, fallback) {
  if (value === undefined) return fallback;
  if (!/^[0-9]+$/.test(String(value)) || Number(value) === 0) {
    throw new Error(
      `--${name} must be a positive integer, got ${forLog(value)}`
    );
  }
  return Number(value);
}

/**
 * The real wait, exported so a test can time it.
 *
 * As an inline default it was the one function in this module nothing could
 * call, and dropping the `ms` argument left every case green while turning a
 * few dozen packument reads into a few thousand inside the same budget.
 */
export function defaultSleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exit codes stay distinct for a reader rather than for a caller: 0 installed,
 * 1 the registry never served the spec, 2 this was called wrong or could not
 * run npm at all. Nothing branches on them — the step is a plain `run:` under
 * `bash -e`, so 1 and 2 both simply fail it — but the number is in the log
 * next to the message, and "called wrong" and "the registry never served it"
 * send a human to different places.
 *
 * `deps` exists for the tests. Without it the only way to drive `main` is to
 * let it shell out to the real registry, which puts the network inside
 * `pnpm test` and hands a crafted spec to whatever npm decides to invoke for
 * it.
 *
 * `run` and `spawn` are separate on purpose. Injecting `run` replaces the
 * installer wholesale, which is what most cases want, but it also skips the
 * line that maps the parsed flags onto `runNpmInstall` — so an argument
 * swapped there would fail every release with the suite green. Injecting
 * `spawn` instead leaves that wiring in the path and stubs only the
 * subprocess.
 */
export async function main(argv = process.argv.slice(2), deps = {}) {
  const { run, spawn, now, sleep = defaultSleep, log = console.log } = deps;
  let flags;
  let budgetSeconds;
  let sleepSeconds;
  try {
    flags = parseArgs(argv);
    budgetSeconds = positiveInteger(
      flags['budget-seconds'],
      'budget-seconds',
      DEFAULT_BUDGET_SECONDS
    );
    sleepSeconds = positiveInteger(
      flags['sleep-seconds'],
      'sleep-seconds',
      DEFAULT_SLEEP_SECONDS
    );
  } catch (error) {
    log(`::error::${error.message}`);
    return 2;
  }

  let ok;
  let attempts;
  let waited;
  try {
    ({ ok, attempts, waited } = await installWithRetry({
      spec: flags.spec,
      budgetSeconds,
      sleepSeconds,
      run: run ?? (spec => runNpmInstall(spec, flags.dir, spawn, log)),
      now,
      sleep,
      log,
    }));
  } catch (error) {
    // Only runNpmInstall throws, and only when the process never started.
    log(`::error::${error.message}`);
    return 2;
  }

  if (!ok) {
    log(
      `::error::npm install ${forLog(flags.spec)} did not succeed within the ` +
        `propagation budget (${waited}s of ${budgetSeconds}s, ${attempts} ` +
        `attempts). If that ` +
        `version never published, the release step earlier in the pipeline is ` +
        `where to look; if it did publish, the registry took longer to serve ` +
        `it than this budget allows.`
    );
    return 1;
  }
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = await main();
}
