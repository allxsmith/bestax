/**
 * Hold every `Menu.Item` in the examples to an element the keyboard can reach.
 *
 * `Menu.Item` renders an `<a>` by default, and an `<a>` with no `href` isn't a
 * link: Tab skips it, and assistive tech doesn't present it as one. Most of
 * the Menu examples were written that way, the way Bulma's own example is,
 * and they render fine, so nothing else caught it (#1095). This reads the jsx
 * and tsx fences under `docs/docs` and `skills`, the `.tsx` examples in
 * `skills`, and bulma-ui's stories.
 *
 * An item passes with an `href`, with a `to` (a router link through `as`),
 * with an `as` naming a tag other than `a` (a `<button>`, or a `<span>` that is
 * static on purpose), or with a spread, which this can't see into. Each source
 * is parsed with TypeScript as a `.tsx` file and nothing is compiled, so a
 * fence that is only a fragment still reads.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { fenceSpans, splitLines } from './lib/api-page.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const ts = createRequire(join(REPO, 'package.json'))('typescript');
const TAGS = new Set(['Menu.Item', 'MenuItem']);

/** Repo-relative paths under `dir` whose name passes `keep`. */
function filesUnder(dir, keep) {
  return readdirSync(join(REPO, dir), { recursive: true })
    .map(name => join(dir, name).split(sep).join('/'))
    .filter(rel => !rel.includes('/node_modules/') && keep(rel));
}

/** The jsx and tsx in one file, each with the line its code starts on. */
function sourcesOf(rel) {
  const src = readFileSync(join(REPO, rel), 'utf8');
  if (rel.endsWith('.tsx')) return [{ code: src, line: 1 }];
  const { lines } = splitLines(src);
  return fenceSpans(lines)
    .filter(({ open }) =>
      /^ {0,3}(`{3,}|~{3,})\s*(jsx|tsx)\b/.test(lines[open])
    )
    .map(({ open, close }) => ({
      code: lines.slice(open + 1, close).join('\n'),
      line: open + 2,
    }));
}

/** Whether the item's attributes give it something the keyboard can reach. */
function reachable(attributes) {
  return attributes.properties.some(prop => {
    if (ts.isJsxSpreadAttribute(prop)) return true;
    const name = prop.name.getText();
    if (name === 'href' || name === 'to') return true;
    return (
      name === 'as' &&
      prop.initializer !== undefined &&
      ts.isStringLiteral(prop.initializer) &&
      prop.initializer.text !== 'a'
    );
  });
}

/** Every `Menu.Item` in `rel`, as `{ at, ok }`, `at` being `file:line`. */
function itemsIn(rel) {
  const out = [];
  for (const { code, line } of sourcesOf(rel)) {
    const sf = ts.createSourceFile(
      'example.tsx',
      code,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );
    const visit = node => {
      if (
        (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
        TAGS.has(node.tagName.getText(sf))
      ) {
        const offset = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line;
        out.push({
          at: `${rel}:${line + offset}`,
          ok: reachable(node.attributes),
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return out;
}

const FILES = [
  ...filesUnder('docs/docs', rel => /\.mdx?$/.test(rel)),
  ...filesUnder('skills', rel => /\.(mdx?|tsx)$/.test(rel)),
  ...filesUnder('bulma-ui/src', rel => rel.endsWith('.stories.tsx')),
];

describe('Menu.Item in the examples', () => {
  const items = FILES.flatMap(itemsIn);

  it('reads the pages the Menu examples live on', () => {
    // So a moved page or a parse that finds nothing can't pass by reading
    // no items at all.
    for (const rel of [
      'docs/docs/api/components/menu.md',
      'docs/docs/guides/library/components.md',
      'bulma-ui/src/components/Menu.stories.tsx',
    ]) {
      assert.ok(
        items.some(item => item.at.startsWith(`${rel}:`)),
        `found no Menu.Item in ${rel}`
      );
    }
  });

  it('gives every item an href, a router link or a tag of its own', () => {
    const unreachable = items.filter(item => !item.ok).map(item => item.at);
    assert.deepEqual(
      unreachable,
      [],
      'These render an <a> with no href, which Tab skips. Give each an ' +
        '`href`, a router link through `as` and its `to`, or `as="button"`:\n  ' +
        unreachable.join('\n  ')
    );
  });
});
