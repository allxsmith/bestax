/**
 * Holds scripts/lib/sync-skills.mjs, the copy both packages' sync-skills.mjs
 * scripts make. They are thin callers, so this is where the behaviour they
 * promise is tested: the checks before anything is emptied, the `.DS_Store`
 * filter, and for bestax-mcp the lock and the freshness stamp.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  chmodSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

import { copySkills, syncSkills } from './lib/sync-skills.mjs';
import {
  SKILL_REFUSAL,
  failureText,
  readSkillDirs,
  skillFiles,
  skillRefusal,
} from './lib/skills.mjs';

/** A repo-shaped temp dir holding skills/ with two skills and some noise. */
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'bestax-sync-skills-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const src = join(root, 'skills');
  const files = {
    'bestax-a/SKILL.md': '---\nname: bestax-a\n---\n',
    'bestax-a/references/x.md': '# x\n',
    'bestax-a/references/.DS_Store': 'finder',
    'bestax-b/SKILL.md': '---\nname: bestax-b\n---\n',
    'README.md': '# not a skill\n',
    'notes/todo.md': 'no SKILL.md, so not a skill\n',
  };
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(join(src, rel, '..'), { recursive: true });
    writeFileSync(join(src, rel), body);
  }
  const lines = [];
  return {
    root,
    src,
    dest: join(root, 'pkg', 'out'),
    stateDir: join(root, 'pkg', 'state'),
    lines,
    log: line => lines.push(line),
  };
}

/** The options create-bestax passes: no state dir, so no lock. */
const unlocked = f => ({ ...f, stateDir: undefined, label: 'out' });

/** Every path under `dir`, relative and sorted, directories included. */
const tree = dir => readdirSync(dir, { recursive: true }).sort();

/** What `run` rejected with, failing the test if it resolved. */
const rejection = run =>
  run.then(
    () => assert.fail('resolved'),
    err => err
  );

test('copies every skill, leaves .DS_Store out, and replaces a stale copy', async t => {
  const f = fixture(t);
  mkdirSync(join(f.dest, 'bestax-gone'), { recursive: true });
  await syncSkills(unlocked(f));
  assert.deepEqual(f.lines, ['[sync-skills] copied 2 skills -> out']);
  assert.equal(
    readFileSync(join(f.dest, 'bestax-a/references/x.md'), 'utf8'),
    '# x\n'
  );
  assert.ok(existsSync(join(f.dest, 'bestax-b/SKILL.md')));
  assert.ok(!existsSync(join(f.dest, 'bestax-a/references/.DS_Store')));
  assert.ok(!existsSync(join(f.dest, 'README.md')));
  assert.ok(!existsSync(join(f.dest, 'notes')));
  assert.ok(!existsSync(join(f.dest, 'bestax-gone')), 'a stale skill stays');
  assert.ok(!existsSync(f.stateDir), 'no state without a state dir');
  await syncSkills(unlocked(f));
  assert.equal(f.lines.length, 2, 'without a stamp, every run copies');
});

test('fails before touching the destination', async t => {
  const f = fixture(t);
  const missing = await rejection(
    syncSkills({ ...unlocked(f), src: join(f.root, 'nope') })
  );
  assert.match(String(missing), /^Error: \[sync-skills\] source not found: /);
  assert.equal(missing.code, SKILL_REFUSAL);
  assert.equal(failureText(missing), missing.message);
  const empty = join(f.root, 'empty');
  mkdirSync(empty);
  mkdirSync(join(f.dest, 'bestax-kept'), { recursive: true });
  await assert.rejects(
    syncSkills({ ...unlocked(f), src: empty }),
    /^Error: \[sync-skills\] no skills found in /
  );
  assert.ok(existsSync(join(f.dest, 'bestax-kept')), 'emptied anyway');
});

test('refuses untracked files in its own repository', async t => {
  const f = fixture(t);
  const git = (...args) =>
    execFileSync('git', ['-C', f.root, ...args], { stdio: 'ignore' });
  git('init', '-q');
  git('add', 'skills');
  writeFileSync(join(f.src, 'bestax-b', 'scratch.md'), 'draft\n');
  await assert.rejects(
    syncSkills(unlocked(f)),
    /^Error: \[sync-skills\] refusing to bundle untracked file\(s\) under skills\/: bestax-b\/scratch\.md\. `git add` them/
  );
  assert.ok(!existsSync(f.dest));
});

test('with a state dir, a current copy is left alone', async t => {
  const f = fixture(t);
  const sync = () => syncSkills({ ...f, label: 'out' });
  await sync();
  const stamp = readFileSync(join(f.stateDir, 'fingerprint'), 'utf8');
  assert.match(stamp, /^[0-9a-f]{64}\n$/);
  assert.ok(!existsSync(join(f.stateDir, 'lock')), 'the lock is released');

  writeFileSync(join(f.dest, 'marker'), 'kept');
  await sync();
  assert.ok(existsSync(join(f.dest, 'marker')), 'a current copy was redone');

  // .DS_Store never ships, so it does not make the copy stale either.
  writeFileSync(join(f.src, 'bestax-a', '.DS_Store'), 'finder');
  await sync();
  assert.ok(existsSync(join(f.dest, 'marker')));

  writeFileSync(join(f.src, 'bestax-b', 'SKILL.md'), 'changed\n');
  await sync();
  assert.ok(!existsSync(join(f.dest, 'marker')), 'a changed source was kept');
  assert.notEqual(readFileSync(join(f.stateDir, 'fingerprint'), 'utf8'), stamp);

  // A matching stamp with the copy gone still copies.
  rmSync(f.dest, { recursive: true });
  await sync();
  assert.ok(existsSync(join(f.dest, 'bestax-b', 'SKILL.md')));
  assert.deepEqual(f.lines, [
    '[sync-skills] copied 2 skills -> out',
    '[sync-skills] up to date (2 skills)',
    '[sync-skills] up to date (2 skills)',
    '[sync-skills] copied 2 skills -> out',
    '[sync-skills] copied 2 skills -> out',
  ]);
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    assert.equal(process.listenerCount(signal), 0, `${signal} handler left`);
  }
});

test('waits for a held lock, and reports an abandoned one', async t => {
  const f = fixture(t);
  const lockDir = join(f.stateDir, 'lock');
  mkdirSync(lockDir, { recursive: true });
  const lock = { pollMs: 5, timeoutMs: 50 };

  // Held by someone else for the whole wait.
  await assert.rejects(
    syncSkills({ ...f, label: 'out', lock }),
    /\[sync-skills\] timed out waiting for lock: /
  );

  // Released while we wait.
  setTimeout(() => rmSync(lockDir, { recursive: true }), 20);
  await syncSkills({ ...f, label: 'out', lock: { ...lock, timeoutMs: 5000 } });
  assert.deepEqual(f.lines, ['[sync-skills] copied 2 skills -> out']);

  // Older than any real run: reported with the fix, never reclaimed.
  mkdirSync(lockDir);
  const old = new Date(Date.now() - 120_000);
  utimesSync(lockDir, old, old);
  await assert.rejects(
    syncSkills({ ...f, label: 'out', lock }),
    /has been held for 1[0-9]{2}s, which means an earlier run was killed[\s\S]*rm -rf /
  );
  assert.ok(existsSync(lockDir), 'an abandoned lock was reclaimed');
});

test('a signal while waiting exits 130 and leaves the lock it never held', async t => {
  const f = fixture(t);
  const lockDir = join(f.stateDir, 'lock');
  mkdirSync(lockDir, { recursive: true });
  const lib = pathToFileURL(join(import.meta.dirname, 'lib/sync-skills.mjs'));
  const options = { ...f, lines: undefined, log: undefined, label: 'out' };
  // The child says when its signal handlers are in, which is just before it
  // starts waiting on the lock this test holds.
  const child = spawn(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import { syncSkills } from ${JSON.stringify(lib.href)};
       const run = syncSkills(${JSON.stringify({ ...options, lock: { pollMs: 5 } })});
       const tick = setInterval(() => {
         if (process.listenerCount('SIGTERM')) {
           clearInterval(tick);
           process.stdout.write('waiting\\n');
         }
       }, 5);
       await run;`,
    ],
    { stdio: ['ignore', 'pipe', 'inherit'] }
  );
  await new Promise(resolve => child.stdout.once('data', resolve));
  child.kill('SIGTERM');
  const code = await new Promise(resolve => child.on('exit', resolve));
  assert.equal(code, 130);
  assert.ok(existsSync(lockDir), 'a lock this run never held was removed');
});

test('a symbolic link in a skill is refused before anything is copied', async t => {
  for (const locked of [false, true]) {
    const f = fixture(t);
    symlinkSync(
      join(f.src, 'bestax-a', 'references', 'x.md'),
      join(f.src, 'bestax-b', 'linked.md')
    );
    const opts = locked ? f : unlocked(f);
    const err = await rejection(syncSkills(opts));
    assert.match(
      String(err),
      /^Error: \[sync-skills\] .*bestax-b\/linked\.md is a symbolic link\. Commit the real file or directory\.$/
    );
    // Tagged, and still coded as a refusal, with the walk's own error kept.
    assert.equal(err.code, SKILL_REFUSAL);
    assert.equal(err.cause.code, SKILL_REFUSAL);
    assert.equal(failureText(err), err.message);
    assert.ok(!existsSync(f.dest), locked ? 'locked run copied' : 'copied');
    await assert.rejects(skillFiles(join(f.src, 'bestax-b')), /symbolic link/);
  }
});

test('the failure text follows one signal, the refusal code', () => {
  const refusal = skillRefusal('[sync-skills] no skills found in /x');
  assert.equal(refusal.code, 'ESKILLREFUSAL');
  assert.equal(failureText(refusal), refusal.message);
  // The tag alone no longer counts. Only the code does.
  const tagged = new Error('[sync-skills] looks like a refusal');
  assert.equal(failureText(tagged), tagged.stack);
  const crash = new TypeError('boom');
  assert.equal(failureText(crash), crash.stack);
  assert.match(failureText(crash), /TypeError: boom\n\s+at /);
  assert.equal(failureText({ message: 'no stack' }), 'no stack');
  assert.equal(failureText('plain'), 'plain');
});

test('a symlinked file at the top of skills/ is not listed as a skill', async t => {
  const f = fixture(t);
  symlinkSync(join(f.src, 'README.md'), join(f.src, 'AGENTS.md'));
  symlinkSync(join(f.src, 'gone'), join(f.src, 'dangling'));
  const names = (await readSkillDirs(f.src)).map(d => d.name);
  assert.deepEqual(names, ['bestax-a', 'bestax-b', 'notes']);
  // Nothing under a skill is a link, so the sync has nothing to refuse.
  await syncSkills(unlocked(f));
  assert.deepEqual(f.lines, ['[sync-skills] copied 2 skills -> out']);
});

test('a link added while waiting on the lock is refused, not copied', async t => {
  const f = fixture(t);
  const lockDir = join(f.stateDir, 'lock');
  mkdirSync(lockDir, { recursive: true });
  const run = rejection(
    syncSkills({ ...f, label: 'out', lock: { pollMs: 5, timeoutMs: 5000 } })
  );
  // The signal handlers go in just before the run starts waiting.
  while (!process.listenerCount('SIGTERM')) await sleep(1);
  symlinkSync(
    join(f.src, 'bestax-a', 'SKILL.md'),
    join(f.src, 'bestax-b', 'late.md')
  );
  rmSync(lockDir, { recursive: true });
  const err = await run;
  assert.match(err.message, /bestax-b\/late\.md is a symbolic link/);
  assert.equal(err.code, SKILL_REFUSAL);
  assert.ok(!existsSync(f.dest), 'the late link was copied');
  assert.ok(!existsSync(join(f.stateDir, 'fingerprint')), 'stamped anyway');
  assert.ok(!existsSync(lockDir), 'the lock was kept');
});

test('the copy ships exactly the vetted list, not what is on disk by then', async t => {
  const f = fixture(t);
  // Both appear after the walk, so neither is in the list it produced.
  writeFileSync(join(f.src, 'bestax-a', 'late.md'), 'late\n');
  symlinkSync(
    join(f.src, 'bestax-a', 'SKILL.md'),
    join(f.src, 'bestax-b', 'late-link.md')
  );
  mkdirSync(join(f.dest, 'bestax-stale'), { recursive: true });
  await copySkills(f.dest, [
    {
      name: 'bestax-a',
      dir: join(f.src, 'bestax-a'),
      files: ['SKILL.md', 'references/x.md'],
    },
    { name: 'bestax-b', dir: join(f.src, 'bestax-b'), files: ['SKILL.md'] },
  ]);
  assert.deepEqual(tree(f.dest), [
    'bestax-a',
    'bestax-a/SKILL.md',
    'bestax-a/references',
    'bestax-a/references/x.md',
    'bestax-b',
    'bestax-b/SKILL.md',
  ]);
  assert.equal(
    readFileSync(join(f.dest, 'bestax-a/references/x.md'), 'utf8'),
    '# x\n'
  );
});

test('a symlinked skill directory is listed, then refused rather than skipped', async t => {
  for (const locked of [false, true]) {
    const f = fixture(t);
    const outside = join(f.root, 'outside-skill');
    mkdirSync(outside);
    writeFileSync(join(outside, 'SKILL.md'), '---\nname: bestax-c\n---\n');
    symlinkSync(outside, join(f.src, 'bestax-c'));
    const dirs = await readSkillDirs(f.src);
    assert.deepEqual(
      dirs.find(d => d.name === 'bestax-c'),
      { name: 'bestax-c', hasSkillFile: true, isSymlink: true },
      'the linked skill is not silently dropped'
    );
    assert.equal(dirs.find(d => d.name === 'bestax-a').isSymlink, false);
    await assert.rejects(
      syncSkills(locked ? f : unlocked(f)),
      /^Error: \[sync-skills\] .*bestax-c is a symbolic link\. Commit the real directory\.$/
    );
    assert.ok(!existsSync(f.dest), 'copied anyway');
  }
});

test('a symlink named .DS_Store is skipped, and never copied', async t => {
  for (const locked of [false, true]) {
    const f = fixture(t);
    // `ln -s /dev/null .DS_Store` is how people stop Finder writing one.
    symlinkSync('/dev/null', join(f.src, 'bestax-b', '.DS_Store'));
    symlinkSync(
      join(f.src, 'bestax-a', 'SKILL.md'),
      join(f.src, 'bestax-a', '.DS_Store')
    );
    assert.deepEqual(await skillFiles(join(f.src, 'bestax-b')), ['SKILL.md']);
    await syncSkills(locked ? { ...f, label: 'out' } : unlocked(f));
    assert.deepEqual(f.lines, ['[sync-skills] copied 2 skills -> out']);
    assert.deepEqual(tree(f.dest), [
      'bestax-a',
      'bestax-a/SKILL.md',
      'bestax-a/references',
      'bestax-a/references/x.md',
      'bestax-b',
      'bestax-b/SKILL.md',
    ]);
  }
});

test('an unexpected error is not tagged as a refusal and keeps its stack', async t => {
  if (process.getuid?.() === 0) return t.skip('root ignores file modes');
  const f = fixture(t);
  const locked = join(f.src, 'bestax-a', 'references');
  chmodSync(locked, 0o000);
  // Restored here, not in t.after: the fixture's cleanup hook runs first and
  // could not remove a directory it cannot read.
  let err;
  try {
    err = await syncSkills(unlocked(f)).then(
      () => assert.fail('resolved'),
      e => e
    );
  } finally {
    chmodSync(locked, 0o755);
  }
  assert.equal(err.code, 'EACCES');
  assert.doesNotMatch(err.message, /^\[sync-skills\]/);
  assert.equal(failureText(err), err.stack);
});

test('a committed symlink in a real repository is refused as a link', async t => {
  const f = fixture(t);
  const git = (...args) =>
    execFileSync(
      'git',
      [
        '-C',
        f.root,
        '-c',
        'user.name=t',
        '-c',
        'user.email=t@t',
        '-c',
        'commit.gpgsign=false',
        ...args,
      ],
      { stdio: 'pipe' }
    );
  symlinkSync('SKILL.md', join(f.src, 'bestax-b', 'alias.md'));
  git('init', '-q');
  git('add', '-A');
  git('commit', '-q', '-m', 'fixture');
  await assert.rejects(
    syncSkills(unlocked(f)),
    /^Error: \[sync-skills\] .*bestax-b\/alias\.md is a symbolic link\. Commit the real file or directory\.$/
  );
});
