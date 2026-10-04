/**
 * Guards on generated-markers-lib.mjs, the marker strip behind the docs
 * build's strip-generated-markers.mjs and the README that
 * scripts/gen-skills-repo.mjs publishes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MARKER_LINE,
  countGeneratedMarkers,
  stripGeneratedMarkers,
} from './generated-markers-lib.mjs';

const open = id => `<!-- bestax:generated ${id} -->`;
const close = id => `<!-- /bestax:generated ${id} -->`;
const lines = (...l) => l.join('\n');

test('a marker pair goes, and the content between stays', () => {
  assert.equal(
    stripGeneratedMarkers(
      lines('Text.', '', open('a'), 'Body.', close('a'), '', 'More.', '')
    ),
    lines('Text.', '', 'Body.', '', 'More.', '')
  );
});

test('a marker between blank lines takes one of them with it', () => {
  assert.equal(
    stripGeneratedMarkers(
      lines('Text.', '', open('a'), '', 'Body.', '', close('a'), '', 'End.')
    ),
    lines('Text.', '', 'Body.', '', 'End.')
  );
  // An empty region between blank lines leaves one blank line.
  assert.equal(
    stripGeneratedMarkers(
      lines('Text.', '', open('a'), close('a'), '', 'End.')
    ),
    lines('Text.', '', 'End.')
  );
  // At the end of the file too.
  assert.equal(
    stripGeneratedMarkers(lines('Text.', '', close('a'), '', '')),
    lines('Text.', '', '')
  );
});

test('blank runs away from a marker are left alone', () => {
  const src = lines('One.', '', '', '', 'Two.', open('a'), 'x', close('a'), '');
  assert.equal(
    stripGeneratedMarkers(src),
    lines('One.', '', '', '', 'Two.', 'x', '')
  );
});

test('inside a fence, markers and blank lines are content', () => {
  const fenced = lines(
    '```md',
    open('props'),
    '',
    '',
    '',
    close('props'),
    '```'
  );
  const src = lines(
    'Intro.',
    '',
    fenced,
    '',
    open('a'),
    'Body.',
    close('a'),
    ''
  );
  assert.equal(
    stripGeneratedMarkers(src),
    lines('Intro.', '', fenced, '', 'Body.', '')
  );
  assert.equal(countGeneratedMarkers(src), 2);
  const tilde = lines('~~~', open('x'), '~~~', '');
  assert.equal(stripGeneratedMarkers(tilde), tilde);
  assert.equal(countGeneratedMarkers(tilde), 0);
});

test('CRLF lines are stripped and collapsed the way LF lines are', () => {
  const lf = lines('Text.', '', open('a'), '', 'Body.', '', close('a'), '', '');
  const crlf = lf.replace(/\n/g, '\r\n');
  assert.equal(
    stripGeneratedMarkers(crlf),
    stripGeneratedMarkers(lf).replace(/\n/g, '\r\n')
  );
  // Each kept line keeps its own ending, so a mixed file stays mixed.
  assert.equal(
    stripGeneratedMarkers(`a\r\n${open('x')}\nb\n${close('x')}\r\nc\r\n`),
    'a\r\nb\nc\r\n'
  );
});

test('only a whole line is a marker', () => {
  assert.ok(MARKER_LINE.test(`  ${open('a')}  `));
  assert.ok(MARKER_LINE.test(close('a-b')));
  assert.ok(!MARKER_LINE.test(`See ${open('a')} here`));
  assert.ok(!MARKER_LINE.test('<!-- bestax:generatedx -->'));
  const src = lines(`Prose ${open('a')}`, '');
  assert.equal(stripGeneratedMarkers(src), src);
  assert.equal(stripGeneratedMarkers(''), '');
  assert.equal(stripGeneratedMarkers(open('a')), '');
});

test('every marker on the real docs pages goes, and nothing else changes', () => {
  const docs = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs');
  const walk = dir =>
    readdirSync(dir, { withFileTypes: true }).flatMap(e =>
      e.isDirectory()
        ? walk(join(dir, e.name))
        : /\.mdx?$/.test(e.name)
          ? [join(dir, e.name)]
          : []
    );
  let pages = 0;
  for (const file of walk(docs)) {
    const src = readFileSync(file, 'utf8');
    const markers = countGeneratedMarkers(src);
    if (!markers) continue;
    pages++;
    const out = stripGeneratedMarkers(src);
    assert.equal(countGeneratedMarkers(out), 0, file);
    assert.equal(stripGeneratedMarkers(out), out, `${file} strips once`);
    const kept = src.split('\n').filter(l => !MARKER_LINE.test(l));
    const removedBlanks = kept.length - out.split('\n').length;
    assert.ok(
      removedBlanks >= 0 && removedBlanks <= markers,
      `${file}: at most one blank line per marker goes`
    );
  }
  assert.ok(pages > 0, 'the docs carry generated regions');
});
