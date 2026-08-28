/**
 * Guards on the pure decision logic in auto-close-duplicates.mjs.
 *
 * This script closes people's issues, and both of its failure modes are silent:
 * misclassify a human as automation and a live objection stops vetoing the
 * close; loosen the marker match and the wrong issue gets closed. Neither shows
 * up in a diff review — the code reads fine either way — so the assertions here
 * are written around the *consequence* rather than the implementation.
 *
 * `.mjs` and `node --test` rather than jest: these are root-level scripts with
 * no package of their own, matching how docs/scripts is covered.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTOCLOSE_SENTENCE,
  MARKER,
  parseArgs,
  isBot,
  isAutomationAuthor,
  findMarkerComment,
  ageInDays,
  humanCommentAfter,
} from './auto-close-duplicates.mjs';

const comment = (id, login, body, createdAt, type = 'User') => ({
  id,
  user: { login, type },
  body,
  created_at: createdAt,
});

// A real, actionable triage comment: the duplicate line, the objection notice
// the closer now requires, and the marker as the LAST non-empty line. Every
// live marker comment in the repo has this shape, because the renderer emits it
// by construction — and each part is separately load-bearing here.
const dedupe = n => `Duplicate of #${n}\n\n${AUTOCLOSE_SENTENCE}\n\n${MARKER}`;

// --- author classification ---------------------------------------------------

test('Bot-type and [bot]-suffixed logins are automation', () => {
  assert.equal(isBot({ login: 'github-actions[bot]', type: 'Bot' }), true);
  assert.equal(isBot({ login: 'claude[bot]', type: 'User' }), true); // suffix alone
  assert.equal(isBot({ login: 'someone', type: 'User' }), false);
  assert.equal(isBot(null), false);
});

test('bestaxbot counts as automation despite being a User to the API', () => {
  // The whole reason MACHINE_USERS exists: a PAT-driven machine account is
  // type "User", so isBot can never see it. If this regresses, bestaxbot's own
  // triage comment reads as a human objection and vetoes every close.
  const bot = { login: 'bestaxbot', type: 'User' };
  assert.equal(isBot(bot), false);
  assert.equal(isAutomationAuthor(bot), true);
});

test('a real contributor is never automation', () => {
  // The dangerous direction: classifying a human as automation silently
  // disarms the objection veto below.
  for (const login of ['allxsmith', 'bestaxbot-fan', 'notabot', 'bot']) {
    assert.equal(
      isAutomationAuthor({ login, type: 'User' }),
      false,
      `${login} must not be treated as automation`
    );
  }
});

// --- marker parsing ----------------------------------------------------------

test('the latest automation marker wins', () => {
  const found = findMarkerComment([
    comment(1, 'claude[bot]', dedupe(10), '2026-01-01T00:00:00Z', 'Bot'),
    comment(2, 'bestaxbot', dedupe(20), '2026-01-02T00:00:00Z'),
  ]);
  assert.equal(found.target, 20);
});

test('any of the three historical triage identities is accepted', () => {
  // Posted as claude[bot] pre-#312, github-actions[bot] during, bestaxbot now.
  for (const [login, type] of [
    ['claude[bot]', 'Bot'],
    ['github-actions[bot]', 'Bot'],
    ['bestaxbot', 'User'],
  ]) {
    const found = findMarkerComment([
      comment(1, login, dedupe(7), '2026-01-01T00:00:00Z', type),
    ]);
    assert.equal(found?.target, 7, `${login} should be a valid marker author`);
  }
});

test('a retraction is final — it never falls through to a superseded target', () => {
  // The newest marker comment IS the verdict. Skipping past one that names no
  // duplicate let "No duplicates found." resurrect the target it retracted, and
  // humanCommentAfter cannot veto that because the retraction is itself
  // automation-authored. This happens for real whenever the older comment
  // belongs to a different automation identity (pre-bestaxbot comments are
  // still live on open issues), because the retraction is then POSTed fresh
  // rather than edited over the top.
  assert.equal(
    findMarkerComment([
      comment(
        1,
        'github-actions[bot]',
        dedupe(100),
        '2026-01-01T00:00:00Z',
        'Bot'
      ),
      comment(
        2,
        'bestaxbot',
        `### AI triage\n\nNo duplicates found.\n\n${MARKER}`,
        '2026-02-01T00:00:00Z'
      ),
    ]),
    null
  );
});

test('a verdict that never warned is not actionable', () => {
  // The closer measures the objection window from this comment, so acting on
  // one that never carried the notice closes an issue whose readers were never
  // told a close was coming. That is exactly what happened to comments written
  // while AI_TRIAGE_AUTOCLOSE was `off` or `dry-run`: flipping the variable to
  // `on` made every one of them older than the window instantly closeable.
  assert.equal(
    findMarkerComment([
      comment(
        1,
        'bestaxbot',
        `Duplicate of #5\n\n${MARKER}`,
        '2026-01-01T00:00:00Z'
      ),
    ]),
    null
  );
});

test('a human cannot forge a close by writing the marker themselves', () => {
  assert.equal(
    findMarkerComment([
      comment(1, 'allxsmith', dedupe(99), '2026-01-01T00:00:00Z'),
    ]),
    null
  );
});

test('the marker and the Duplicate line are both required', () => {
  const at = '2026-01-01T00:00:00Z';
  assert.equal(
    findMarkerComment([comment(1, 'bestaxbot', 'Duplicate of #5', at)]),
    null,
    'no marker'
  );
  assert.equal(
    findMarkerComment([comment(1, 'bestaxbot', `${MARKER}\nrelated work`, at)]),
    null,
    'no duplicate line'
  );
});

test('a smuggled duplicate line in a real marker comment still parses', () => {
  // Documents the coupling with sanitize-repro-draft.mjs (claude-repro.yml's
  // publish sanitizer), which defangs "Duplicate of #" in drafted tests
  // precisely because github-actions[bot] is an author this parser trusts. If
  // that sanitizer regresses, this is the consumer that acts on the smuggled
  // line — sanitize-repro-draft.test.mjs imports MARKER and DUPLICATE_RE from
  // this file and asserts sanitized output can never satisfy them.
  const found = findMarkerComment([
    comment(
      1,
      'github-actions[bot]',
      `some text\nDuplicate of #42\nmore\n\n${AUTOCLOSE_SENTENCE}\n\n${MARKER}`,
      '2026-01-01T00:00:00Z',
      'Bot'
    ),
  ]);
  assert.equal(found.target, 42);
});

test('an automation comment merely QUOTING a triage comment is not the verdict', () => {
  // bestaxbot-reply.yml hands a session `gh issue comment` under the same PAT
  // with no deterministic sanitizer, so a reply explaining a verdict carries the
  // marker verbatim. Treating it as the verdict would restart the 14-day clock
  // from the reply's created_at and stop counting objections made after the
  // real marker comment. The renderer selects on the same last-line property.
  const real = comment(1, 'bestaxbot', dedupe(42), '2026-01-01T00:00:00Z');
  const quoting = comment(
    2,
    'bestaxbot',
    `As explained above (${MARKER}), #42 looks like the original.`,
    '2026-02-01T00:00:00Z'
  );
  assert.equal(findMarkerComment([real, quoting]).comment.id, 1);
});

// --- the objection veto ------------------------------------------------------

test('a human comment after the marker is an objection', () => {
  const marker = comment(1, 'bestaxbot', dedupe(5), '2026-01-01T00:00:00Z');
  const objection = comment(
    2,
    'allxsmith',
    'still broken',
    '2026-01-03T00:00:00Z'
  );
  assert.equal(humanCommentAfter([marker, objection], marker)?.id, 2);
});

test('automation chatter after the marker is not an objection', () => {
  const marker = comment(1, 'bestaxbot', dedupe(5), '2026-01-01T00:00:00Z');
  const noise = comment(
    2,
    'github-actions[bot]',
    'CI failed',
    '2026-01-03T00:00:00Z',
    'Bot'
  );
  assert.equal(humanCommentAfter([marker, noise], marker), null);
});

test('a human comment BEFORE the marker does not veto', () => {
  // The objection window starts at the marker: earlier discussion is what the
  // triage verdict was formed against, not a response to it.
  const earlier = comment(1, 'allxsmith', 'hmm', '2026-01-01T00:00:00Z');
  const marker = comment(2, 'bestaxbot', dedupe(5), '2026-01-02T00:00:00Z');
  assert.equal(humanCommentAfter([earlier, marker], marker), null);
});

test('same-second posts are ordered by id, not dropped', () => {
  const at = '2026-01-01T00:00:00Z';
  const marker = comment(5, 'bestaxbot', dedupe(5), at);
  const sameSecond = comment(6, 'allxsmith', 'wait', at);
  assert.equal(humanCommentAfter([marker, sameSecond], marker)?.id, 6);
  // ...and one that lost the tiebreak is genuinely earlier, so it must not veto.
  const before = comment(4, 'allxsmith', 'earlier', at);
  assert.equal(humanCommentAfter([before, marker], marker), null);
});

// --- age gate ----------------------------------------------------------------

test('ageInDays floors to whole elapsed days', () => {
  const base = Date.parse('2026-01-15T00:00:00Z');
  assert.equal(ageInDays('2026-01-01T00:00:00Z', base), 14);
  // One second short of 14 days is still 13 — the window must fully elapse.
  assert.equal(ageInDays('2026-01-01T00:00:01Z', base), 13);
});

// --- argument validation -----------------------------------------------------

test('parseArgs requires a repo and an explicit mode', () => {
  assert.deepEqual(parseArgs(['--repo=allxsmith/bestax', '--mode=dry-run']), {
    repo: 'allxsmith/bestax',
    mode: 'dry-run',
    waitDays: 14,
  });
  assert.throws(() => parseArgs(['--mode=on']), /--repo/);
  assert.throws(() => parseArgs(['--repo=allxsmith/bestax']), /--mode/);
  // No implicit default for mode: closing issues must be asked for by name.
  assert.throws(
    () => parseArgs(['--repo=allxsmith/bestax', '--mode=yes']),
    /--mode/
  );
  assert.throws(() => parseArgs(['--repo=nope', '--mode=on']), /--repo/);
});

test('parseArgs rejects a wait window that would skip the objection period', () => {
  for (const bad of ['0', '-1', '1.5', 'abc']) {
    assert.throws(
      () => parseArgs(['--repo=a/b', '--mode=on', `--wait-days=${bad}`]),
      /--wait-days/,
      `--wait-days=${bad} must be rejected`
    );
  }
});
