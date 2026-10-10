/**
 * Guards on generated-markers-lib.mjs, the marker strip and checks behind the
 * docs build's strip-generated-markers.mjs and the README that
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
  markersOutsideCode,
  stripGeneratedMarkers,
  stripMarkers,
  unclosedFence,
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

/** The real docs pages, as paths. */
function realPages() {
  const docs = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs');
  const walk = dir =>
    readdirSync(dir, { withFileTypes: true }).flatMap(e =>
      e.isDirectory()
        ? walk(join(dir, e.name))
        : /\.mdx?$/.test(e.name)
          ? [join(dir, e.name)]
          : []
    );
  return walk(docs);
}

test('every marker on the real docs pages goes, and nothing else changes', () => {
  let pages = 0;
  for (const file of realPages()) {
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

test('stripMarkers strips in one pass and counts what it removed', () => {
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
  assert.deepEqual(stripMarkers(src), {
    out: stripGeneratedMarkers(src),
    stripped: 2,
  });
  assert.deepEqual(stripMarkers(''), { out: '', stripped: 0 });
});

test('markersOutsideCode finds a marker comment in prose, as written or escaped', () => {
  const src = lines(
    `See ${open('a')} here.`,
    `${close('a')} too.`,
    '&lt;!-- bestax:generated a --&gt;',
    '&lt;!--/bestax:generated a--&gt;',
    // Not a marker: prose naming it, and a longer name.
    'A bestax:generated region.',
    '<!-- bestax:generatedx -->',
    // A backtick with no partner opens no code span.
    `It\`s ${open('a')}`,
    ''
  );
  assert.deepEqual(markersOutsideCode(src), [1, 2, 3, 4, 7]);
});

test('markersOutsideCode passes over fences and inline code spans', () => {
  const src = lines(
    '```md',
    open('a'),
    '&lt;!-- /bestax:generated a --&gt;',
    '```',
    '~~~',
    `See ${open('a')} here.`,
    '~~~',
    `Opens with \`${open('a')}\`, closes with \`\`${close('a')}\`\`.`,
    // A span runs to a closing run as long as its opening, and no further.
    `A span: \`a \`\` ${open('a')}\` and after it ${close('a')}.`,
    ''
  );
  assert.deepEqual(markersOutsideCode(src), [9]);
});

test('unclosedFence names a fence left open, which hides the markers after it', () => {
  // One page in llms-full.txt leaves a fence open, so the next page's
  // markers read as code, and only the open fence gives them away.
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
  assert.equal(stripMarkers(joined).stripped, 0);
  assert.deepEqual(markersOutsideCode(joined), []);
  assert.equal(unclosedFence(joined), 2);
  assert.equal(unclosedFence(lines('Text.', '```')), 2);
  assert.equal(unclosedFence(lines('````md', '```', 'x', '```', '')), 1);
  // Closed on the last line, with or without a final newline, is closed.
  assert.equal(unclosedFence(lines('```', 'x', '```')), 0);
  assert.equal(unclosedFence(lines('```', 'x', '```', '')), 0);
  assert.equal(unclosedFence(''), 0);
});

test('the real docs pages, joined, leave no marker outside code', () => {
  const pages = realPages().map(file => readFileSync(file, 'utf8'));
  // Joined the way docusaurus-plugin-llms joins llms-full.txt.
  const joined = stripMarkers(pages.join('\n\n---\n\n'));
  assert.ok(joined.stripped > 0);
  assert.deepEqual(markersOutsideCode(joined.out), []);
  assert.equal(unclosedFence(joined.out), 0);
});
