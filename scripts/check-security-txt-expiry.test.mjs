/**
 * Guards on the pure decision logic in check-security-txt-expiry.mjs.
 *
 * Every failure mode of this script is silence. It is a reminder with no CI
 * gate behind it, so if the date parsing quietly returns nothing, or the
 * window arithmetic is off by a day, or the marker stops matching, the result
 * is not a red build — it is an expired security.txt that nobody was told
 * about, which is the exact outcome the file exists to prevent. Nothing in a
 * diff review would show it either: the code reads fine either way.
 *
 * So the assertions below are written around the consequence (did it decide to
 * notify, would it open a second issue) rather than the implementation. The
 * clock is injected everywhere — a test that depends on the real date would
 * start failing on a specific day in 2027, which is a nasty way to learn this.
 *
 * `.mjs` and `node --test` rather than jest: these are root-level scripts with
 * no package of their own, matching auto-close-duplicates.test.mjs.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MARKER,
  DEFAULT_WARN_DAYS,
  parseArgs,
  parseExpires,
  daysUntil,
  shouldNotify,
  renderIssue,
  findMarkerIssue,
} from './check-security-txt-expiry.mjs';

const NOW = Date.parse('2026-08-15T00:00:00.000Z');
const txt = expires =>
  [
    '# a comment line',
    'Contact: mailto:security@bestax.io',
    'Preferred-Languages: en',
    `Expires: ${expires}`,
  ].join('\n');

// --- argument parsing --------------------------------------------------------

test('parseArgs requires a well-formed --repo', () => {
  assert.throws(() => parseArgs([]), /--repo=owner\/name is required/);
  assert.throws(
    () => parseArgs(['--repo=nope']),
    /--repo=owner\/name is required/
  );
  assert.equal(parseArgs(['--repo=allxsmith/bestax']).repo, 'allxsmith/bestax');
});

test('parseArgs defaults the window to 30 days and rejects nonsense', () => {
  assert.equal(parseArgs(['--repo=a/b']).warnDays, DEFAULT_WARN_DAYS);
  assert.equal(parseArgs(['--repo=a/b', '--warn-days=7']).warnDays, 7);
  assert.throws(
    () => parseArgs(['--repo=a/b', '--warn-days=x']),
    /non-negative/
  );
  assert.throws(
    () => parseArgs(['--repo=a/b', '--warn-days=-1']),
    /non-negative/
  );
});

test('parseArgs carries --dry-run through', () => {
  assert.equal(parseArgs(['--repo=a/b']).dryRun, false);
  assert.equal(parseArgs(['--repo=a/b', '--dry-run']).dryRun, true);
});

// --- Expires parsing ---------------------------------------------------------
// These throw on purpose. Returning null would let a malformed file read as
// "nothing due", which is the silent failure this whole file is about.

test('parseExpires reads the date, ignoring comments and case', () => {
  assert.equal(
    parseExpires(txt('2027-08-15T00:00:00.000Z')).toISOString(),
    '2027-08-15T00:00:00.000Z'
  );
  assert.equal(
    parseExpires('expires: 2027-08-15T00:00:00.000Z').toISOString(),
    '2027-08-15T00:00:00.000Z'
  );
});

test('parseExpires ignores an Expires that is only inside a comment', () => {
  assert.throws(
    () =>
      parseExpires(
        '# Expires: 2027-08-15T00:00:00.000Z\nContact: mailto:x@y.z'
      ),
    /no `Expires:` field/
  );
});

test('parseExpires throws when the field is missing', () => {
  assert.throws(
    () => parseExpires('Contact: mailto:x@y.z'),
    /no `Expires:` field/
  );
  assert.throws(() => parseExpires(''), /no `Expires:` field/);
});

test('parseExpires throws on an unparseable date rather than guessing', () => {
  assert.throws(() => parseExpires(txt('next tuesday')), /non-RFC-3339/);
});

test('parseExpires rejects dates new Date() would happily accept', () => {
  // The reason the format check exists. `new Date()` is far looser than
  // RFC 3339 and its non-ISO handling is implementation-defined, so without
  // an explicit check these all parse into real dates and the script cheerfully
  // reports "nothing to do" about a file securitytxt.org rejects.
  for (const bad of [
    'August 15, 2027',
    '2027/08/15',
    '08/15/2027',
    '2027-08-15', // date only: RFC 9116 wants a full date-time
    '2027-08-15T00:00:00', // no offset
    '2027-08-15T00:00Z', // no seconds
  ]) {
    assert.throws(
      () => parseExpires(txt(bad)),
      /non-RFC-3339/,
      `expected "${bad}" to be rejected`
    );
  }
});

test('parseExpires accepts the RFC 3339 shapes that are actually legal', () => {
  for (const good of [
    '2027-08-15T00:00:00Z',
    '2027-08-15T00:00:00.000Z',
    '2027-08-15T00:00:00+05:30',
    '2027-08-15t00:00:00z', // RFC 3339 allows lower case
  ]) {
    assert.ok(
      parseExpires(txt(good)) instanceof Date,
      `expected "${good}" to parse`
    );
  }
});

test('parseExpires rejects a date that does not exist rather than rolling it over', () => {
  // JS turns 2027-02-30 into 2027-03-02 without complaint, which would make the
  // reminder fire against a date nobody wrote.
  assert.throws(
    () => parseExpires(txt('2027-02-30T00:00:00Z')),
    /does not exist/
  );
});

test('the rollover check is independent of the offset', () => {
  // The first version compared toISOString() against the input, which only
  // works for a `Z` value: a legitimate +05:30 timestamp shifts the UTC date by
  // a day, so the check was skipped for offsets and this case slipped through.
  // Validating the Y-M-D alone has no such blind spot.
  assert.throws(
    () => parseExpires(txt('2027-02-30T00:00:00+05:30')),
    /does not exist/
  );
  assert.throws(
    () => parseExpires(txt('2027-04-31T12:00:00-08:00')),
    /does not exist/
  );
  assert.throws(
    () => parseExpires(txt('2027-02-29T00:00:00Z')),
    /does not exist/
  ); // 2027 is not a leap year

  // ...while real dates with offsets still parse, including a genuine leap day.
  assert.ok(parseExpires(txt('2028-02-29T00:00:00Z')) instanceof Date);
  assert.ok(parseExpires(txt('2027-03-31T23:59:59+05:30')) instanceof Date);
});

test('parseExpires refuses a file with two Expires fields', () => {
  const two = `${txt('2027-08-15T00:00:00.000Z')}\nExpires: 2028-01-01T00:00:00.000Z`;
  assert.throws(() => parseExpires(two), /exactly one/);
});

// --- window arithmetic -------------------------------------------------------

test('daysUntil counts whole days and goes negative once passed', () => {
  assert.equal(daysUntil(new Date('2026-09-14T00:00:00.000Z'), NOW), 30);
  assert.equal(daysUntil(new Date('2026-08-16T00:00:00.000Z'), NOW), 1);
  assert.equal(daysUntil(new Date('2026-08-15T00:00:00.000Z'), NOW), 0);
  assert.equal(daysUntil(new Date('2026-08-10T00:00:00.000Z'), NOW), -5);
});

test('daysUntil rounds toward zero, so a part-day never inflates the count', () => {
  // Every case above lands on an exact midnight, which is the one situation
  // where floor and trunc agree — so they all passed while the rounding was
  // wrong. Real dates are fractional, and the direction leaks into the issue
  // title: with floor, a file that expired three days and one second ago
  // announced itself as "EXPIRED 4 day(s) ago". Caught by running the script,
  // not by these tests, which is why the fractional cases are pinned here now.
  const plus = ms => new Date(NOW + ms);
  assert.equal(daysUntil(plus(9.99 * 864e5), NOW), 9); // 9 whole days remain
  assert.equal(daysUntil(plus(-3.0001 * 864e5), NOW), -3); // 3 whole days ago
});

test('daysUntil never returns -0, because renderIssue branches on days < 0', () => {
  // Math.trunc(-0.5) is -0, and `-0 < 0` is false. Left unnormalised, a file
  // that expired a few hours ago takes the NOT-expired branch and announces
  // itself in the future tense. assert/strict compares with Object.is, so this
  // assertion actually distinguishes -0 from 0 — a loose == would not.
  const halfDayAgo = daysUntil(new Date(NOW - 0.5 * 864e5), NOW);
  assert.equal(halfDayAgo, 0);
  assert.ok(!Object.is(halfDayAgo, -0), 'must be +0, not -0');
  assert.doesNotMatch(renderIssue(halfDayAgo, new Date(NOW)).title, /EXPIRED/);
});

test('the 30-day boundary notifies rather than waiting one more week', () => {
  // The cron is weekly. If day 30 did not notify, the next run would land on
  // day 23 — still fine — but an off-by-one the other way would silently skip
  // a whole cycle, so the boundary is asserted explicitly.
  assert.equal(shouldNotify(31), false);
  assert.equal(shouldNotify(30), true);
  assert.equal(shouldNotify(0), true);
  assert.equal(shouldNotify(-1), true);
});

test('shouldNotify honours a custom window', () => {
  assert.equal(shouldNotify(10, 7), false);
  assert.equal(shouldNotify(7, 7), true);
});

// --- issue rendering ---------------------------------------------------------

test('the issue body always carries the marker', () => {
  // Lose this and every weekly run opens another issue.
  assert.ok(
    renderIssue(30, new Date('2026-09-14T00:00:00.000Z')).body.includes(MARKER)
  );
  assert.ok(
    renderIssue(-3, new Date('2026-08-12T00:00:00.000Z')).body.includes(MARKER)
  );
});

test('an expired file is worded differently from an approaching one', () => {
  const soon = renderIssue(12, new Date('2026-08-27T00:00:00.000Z'));
  const past = renderIssue(-3, new Date('2026-08-12T00:00:00.000Z'));

  assert.match(soon.title, /expires in 12 day/);
  assert.doesNotMatch(soon.title, /EXPIRED/);

  // Past tense and an absolute day count — "-3 days" would read as a bug.
  assert.match(past.title, /EXPIRED 3 day\(s\) ago/);
  assert.match(past.body, /worse than/);
});

test('the issue names the file and the renewal steps', () => {
  const { body } = renderIssue(5, new Date('2026-08-20T00:00:00.000Z'), {
    file: 'docs/static/.well-known/security.txt',
  });
  assert.match(body, /docs\/static\/\.well-known\/security\.txt/);
  assert.match(body, /securitytxt\.org/);
});

// --- idempotency -------------------------------------------------------------

test('findMarkerIssue matches on the marker, not the title', () => {
  const issues = [
    { number: 1, body: 'unrelated' },
    { number: 2, body: `${MARKER}\nrenew it` },
  ];
  assert.equal(findMarkerIssue(issues).number, 2);
});

test('findMarkerIssue ignores pull requests carrying the marker', () => {
  // A PR that quotes the marker (e.g. the PR that added this script) must not
  // be mistaken for the reminder issue and PATCHed.
  const issues = [
    { number: 9, body: `${MARKER}\nin a PR body`, pull_request: { url: 'x' } },
    { number: 10, body: `${MARKER}\nthe real issue` },
  ];
  assert.equal(findMarkerIssue(issues).number, 10);
});

test('findMarkerIssue survives a null body and an empty list', () => {
  assert.equal(findMarkerIssue([{ number: 1, body: null }]), undefined);
  assert.equal(findMarkerIssue([]), undefined);
  assert.equal(findMarkerIssue(undefined), undefined);
});
