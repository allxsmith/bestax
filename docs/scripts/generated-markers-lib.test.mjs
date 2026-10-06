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
  leakedMarkers,
  markerCounts,
  stripGeneratedMarkers,
  stripMarkers,
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

test('stripMarkers strips in one pass and counts what it removed and kept', () => {
  const src = lines(
    'Intro.',
    '',
    '```md',
    open('shown'),
    '```',
    '',
    open('a'),
    'Body.',
    close('a'),
    ''
  );
  const result = stripMarkers(src);
  assert.equal(result.out, stripGeneratedMarkers(src));
  assert.equal(result.stripped, 2);
  assert.equal(result.kept, 1);
  assert.deepEqual(markerCounts(src), { unfenced: 2, fenced: 1 });
  assert.deepEqual(stripMarkers(''), { out: '', stripped: 0, kept: 0 });
});

test('an open fence in a joined file hides later markers, and leakedMarkers says so', () => {
  // The review's reproduction: one page in llms-full.txt leaves a fence
  // open, so the next page's markers read as fenced and stay.
  const joined = lines(
    '# A',
    '```jsx',
    '<Tabs>',
    '',
    '---',
    '',
    '# B',
    open('props'),
    '| Prop | Type |',
    close('props'),
    ''
  );
  const { out, stripped, kept } = stripMarkers(joined);
  assert.equal(stripped, 0);
  assert.equal(kept, 2);
  assert.ok(out.includes(open('props')), 'the markers are still there');
  assert.match(
    leakedMarkers('llms-full.txt', kept, 0),
    /^llms-full\.txt: 2 marker line\(s\) are left inside code fences, and the source pages show 0 there\./
  );
  // Markers the sources show inside fences are accounted for.
  assert.equal(leakedMarkers('page.md', 1, 1), null);
  assert.equal(leakedMarkers('page.md', 0, 0), null);
});

test('the real docs pages show no marker inside a fence, and joined they leak none', () => {
  const docs = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs');
  const walk = dir =>
    readdirSync(dir, { withFileTypes: true }).flatMap(e =>
      e.isDirectory()
        ? walk(join(dir, e.name))
        : /\.mdx?$/.test(e.name)
          ? [join(dir, e.name)]
          : []
    );
  const pages = walk(docs).map(file => readFileSync(file, 'utf8'));
  const fenced = pages.reduce((sum, src) => sum + markerCounts(src).fenced, 0);
  // Joined the way docusaurus-plugin-llms joins llms-full.txt.
  const joined = stripMarkers(pages.join('\n\n---\n\n'));
  assert.equal(leakedMarkers('joined', joined.kept, fenced), null);
  assert.ok(joined.stripped > 0);
  assert.equal(countGeneratedMarkers(joined.out), 0);
});
