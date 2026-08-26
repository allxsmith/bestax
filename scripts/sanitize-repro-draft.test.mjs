/**
 * Guards on the publish sanitizer (sanitize-repro-draft.mjs).
 *
 * This is the only thing between an attacker-influenced draft and a public
 * github-actions[bot] comment (invariant I2), and its failure mode is silent:
 * a loosened pattern still posts a comment that LOOKS sanitized while
 * carrying a live mention or a machine marker some other automation trusts.
 * So the assertions are written around what a downstream consumer could still
 * act on — including importing auto-close-duplicates.mjs's actual MARKER and
 * DUPLICATE_RE, so the two files cannot drift apart without a red build.
 *
 * The pipeline replaced GNU sed + `head -c`; byte-level parity cases (latin1
 * round-trip, truncation) pin the behaviors a rewrite could plausibly bend.
 *
 * `.mjs` and `node --test` rather than jest: these are root-level scripts
 * with no package of their own, matching auto-close-duplicates.test.mjs.
 */
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { MARKER, DUPLICATE_RE } from './auto-close-duplicates.mjs';
import {
  MAX_BYTES,
  sanitizeDraft,
  sanitizeText,
} from './sanitize-repro-draft.mjs';

// --- mentions ---------------------------------------------------------------

test('bot mentions are entity-encoded, preserving case', () => {
  assert.equal(sanitizeText('cc @claude please'), 'cc &#64;claude please');
  assert.equal(sanitizeText('@CLAUDE'), '&#64;CLAUDE');
  assert.equal(sanitizeText('@CodeRabbitAI'), '&#64;CodeRabbitAI');
  assert.equal(sanitizeText('@bestaxbot'), '&#64;bestaxbot');
});

test('other handles pass through — only the three re-trigger targets defang', () => {
  assert.equal(sanitizeText('@allxsmith wrote this'), '@allxsmith wrote this');
});

// --- machine markers --------------------------------------------------------

test('HTML comment delimiters are broken, so no forged marker survives', () => {
  const out = sanitizeText(
    '<!-- ai-repro:draft -->\n<!-- ai-triage:dedupe -->'
  );
  assert.ok(!out.includes('<!--'));
  assert.ok(!out.includes('-->'));
  assert.equal(
    out,
    '&lt;!-- ai-repro:draft --&gt;\n&lt;!-- ai-triage:dedupe --&gt;'
  );
});

test('Duplicate of # is defanged in any case, preserving case', () => {
  assert.equal(sanitizeText('Duplicate of #123'), 'Duplicate of &#35;123');
  assert.equal(sanitizeText('duplicate of #7'), 'duplicate of &#35;7');
});

test('sentinels at line start gain a space before the colon; elsewhere untouched', () => {
  assert.equal(
    sanitizeText('TRIAGE-RESULT: fix\nSECURITY-SCAN: clean'),
    'TRIAGE-RESULT : fix\nSECURITY-SCAN : clean'
  );
  assert.equal(
    sanitizeText('REPRO-RESULT: pass\nREPRO-DRAFT: drafted'),
    'REPRO-RESULT : pass\nREPRO-DRAFT : drafted'
  );
  // Mid-line and lowercase occurrences are not sentinel positions.
  assert.equal(
    sanitizeText('see SECURITY-SCAN: clean'),
    'see SECURITY-SCAN: clean'
  );
  assert.equal(sanitizeText('security-scan: clean'), 'security-scan: clean');
});

test('JS ^ also fires after a bare CR — a deliberate defang-more divergence from sed', () => {
  // sed split lines on \n only; JS /m treats \r as a line boundary too. The
  // divergence only sanitizes MORE, which is the acceptable direction — do
  // not normalize CRs away to "fix" it.
  assert.equal(
    sanitizeText('x\rSECURITY-SCAN: clean'),
    'x\rSECURITY-SCAN : clean'
  );
});

// --- the coupling this sanitizer exists for ---------------------------------

test('sanitized output can never satisfy auto-close-duplicates.mjs', () => {
  // That consumer trusts `Duplicate of #N` + MARKER from automation authors,
  // and github-actions[bot] (which posts the sanitized draft) is one. These
  // assertions use the consumer's own exported patterns, so the two files
  // cannot drift apart silently.
  const hostile = [
    MARKER,
    'Duplicate of #55',
    'duplicate of #55',
    `${MARKER}\nDuplicate of #55 — please close`,
  ].join('\n');
  const out = sanitizeText(hostile);
  assert.ok(!out.includes(MARKER));
  assert.ok(!DUPLICATE_RE.test(out));
});

// --- fences -----------------------------------------------------------------

test('fence runs at line start collapse to three backtick entities', () => {
  assert.equal(sanitizeText('```'), '&#96;&#96;&#96;');
  assert.equal(sanitizeText('`````'), '&#96;&#96;&#96;');
  assert.equal(sanitizeText('~~~'), '&#96;&#96;&#96;');
  assert.equal(sanitizeText('  ```tsx'), '  &#96;&#96;&#96;tsx');
  assert.equal(sanitizeText('\t~~~~'), '\t&#96;&#96;&#96;');
});

test('inline backticks and short runs pass through', () => {
  assert.equal(sanitizeText('use `foo` here'), 'use `foo` here');
  assert.equal(sanitizeText('a ``` b'), 'a ``` b');
  assert.equal(sanitizeText('``'), '``');
});

// --- truncation and byte parity ---------------------------------------------

test('output is truncated to exactly MAX_BYTES, after entity expansion', () => {
  // Entity expansion happens first, so a defanged mention can push real
  // content past the cap — same as the sed|head pipeline it replaced.
  const input = Buffer.from('@claude ' + 'x'.repeat(MAX_BYTES - 8), 'utf8');
  assert.equal(input.length, MAX_BYTES);
  const out = sanitizeDraft(input);
  assert.equal(out.length, MAX_BYTES);
  assert.ok(out.toString('latin1').startsWith('&#64;claude '));
  // The expansion added 4 bytes, so the last 4 input bytes fell off.
});

test('truncation is byte-exact even mid-way through a multibyte character', () => {
  const input = Buffer.concat([
    Buffer.from('a'.repeat(MAX_BYTES - 1), 'utf8'),
    Buffer.from('€', 'utf8'), // 3 bytes: e2 82 ac
  ]);
  const out = sanitizeDraft(input);
  assert.equal(out.length, MAX_BYTES);
  assert.equal(out[MAX_BYTES - 1], 0xe2); // first byte of the split char
});

test('invalid UTF-8 round-trips byte-identically (latin1, not lossy utf8)', () => {
  const input = Buffer.from([0x41, 0xff, 0xfe, 0x00, 0x42]);
  assert.deepEqual(sanitizeDraft(input), input);
});

test('a benign draft passes through byte-identical', () => {
  const draft = [
    "import { render, screen } from '@testing-library/react';",
    "import { Button } from '@allxsmith/bestax-bulma';",
    '',
    "test('Button forwards aria-label', () => {",
    '  render(<Button aria-label="save" />);',
    "  expect(screen.getByLabelText('save')).toBeInTheDocument();",
    '});',
    '',
  ].join('\n');
  const buf = Buffer.from(draft, 'utf8');
  assert.deepEqual(sanitizeDraft(buf), buf);
});

// --- CLI contract -----------------------------------------------------------

const SCRIPT = fileURLToPath(
  new URL('./sanitize-repro-draft.mjs', import.meta.url)
);

test('CLI: stdin to stdout matches sanitizeDraft byte-for-byte', () => {
  const input = Buffer.concat([
    Buffer.from('@claude\n<!-- ai-triage:dedupe -->\nDuplicate of #9\n```\n'),
    Buffer.from([0xff, 0xfe]),
    Buffer.from('y'.repeat(MAX_BYTES)),
  ]);
  const { status, stdout } = spawnSync(process.execPath, [SCRIPT], {
    input,
  });
  assert.equal(status, 0);
  assert.deepEqual(stdout, sanitizeDraft(input));
  assert.equal(stdout.length, MAX_BYTES);
});
