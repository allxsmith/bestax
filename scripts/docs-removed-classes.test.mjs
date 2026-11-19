/**
 * Hold the examples to classes something still styles (#1358).
 *
 * Bulma v1 dropped a handful of Bulma 0.9's classes, `heading` among them. An
 * example that applies one renders, looks plausible, and styles nothing, so it
 * passes every other check. The Level page's statistics labelled each number
 * with `heading` for exactly that reason, and the docs feed the LLM index and
 * the MCP server, so agents copied it too.
 *
 * The dropped classes are read from the MCP index's Bulma class table, which
 * bestax-migrate's `REMOVED_IN_V1` generates, less any class bestax's own
 * stylesheet defines again for one of its extras.
 * The examples are what a reader copies: the jsx, tsx, and html fences in the
 * markdown under `docs/docs` and `skills`, a skill's `.jsx`/`.tsx` files, and
 * bulma-ui's stories. Only literal `class`/`className` strings are read.
 *
 * Two places show the old markup on purpose, as the input a migration starts
 * from or the output a codemod leaves with a TODO, and are left out.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';
import { fenceSpans, splitLines } from './lib/api-page.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const ROOTS = ['docs/docs', 'skills', 'bulma-ui/src'];
const LEGACY_ON_PURPOSE = [
  'docs/docs/guides/getting-started/migration/',
  'skills/bestax-migrate/',
];
const LANGS = new Set(['jsx', 'tsx', 'html']);
const CLASS_ATTR = /\bclass(?:Name)?=\{?\s*(["'`])([^"'`]*)\1/g;

/** Bulma 0.9 classes v1 dropped that bestax doesn't style either. */
function deadClasses() {
  const table = JSON.parse(
    readFileSync(join(REPO, 'bestax-mcp/data/bulma-classes.json'), 'utf8')
  );
  const own = new Set();
  const visit = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.name.endsWith('.scss')) {
        const scss = readFileSync(path, 'utf8');
        for (const m of scss.matchAll(/\.#\{iv\.\$class-prefix\}([\w-]+)/g)) {
          own.add(m[1]);
        }
      }
    }
  };
  visit(join(REPO, 'bulma-ui/src/scss'));
  return new Set(table.removed.filter(name => !own.has(name)));
}

/** Each example's code with the 1-based line it starts after. */
function examplesIn(file, src) {
  if (/\.stories\.tsx$|\.[jt]sx$/.test(file)) return [{ line: 0, code: src }];
  const { lines } = splitLines(src);
  const out = [];
  for (const { open, close } of fenceSpans(lines)) {
    const lang = lines[open].replace(/^ {0,3}(`{3,}|~{3,})/, '').trim();
    if (!LANGS.has(lang.split(/\s+/)[0])) continue;
    out.push({ line: open + 1, code: lines.slice(open + 1, close).join('\n') });
  }
  return out;
}

/** The files under ROOTS whose examples are read. */
function exampleFiles() {
  const out = [];
  const visit = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      const file = relative(REPO, path).split(sep).join('/');
      if (LEGACY_ON_PURPOSE.some(prefix => file.startsWith(prefix))) continue;
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') visit(path);
      } else if (
        file.startsWith('bulma-ui/')
          ? entry.name.endsWith('.stories.tsx')
          : /\.mdx?$|\.[jt]sx$/.test(entry.name)
      ) {
        out.push(file);
      }
    }
  };
  for (const root of ROOTS) visit(join(REPO, root));
  return out.sort();
}

/** Every dead class an example applies, as `file:line class`. */
function deadUses(files, dead, read) {
  const found = [];
  for (const file of files) {
    for (const { line, code } of examplesIn(file, read(file))) {
      code.split('\n').forEach((text, i) => {
        for (const [, , value] of text.matchAll(CLASS_ATTR)) {
          for (const name of value.split(/\s+/)) {
            if (dead.has(name)) found.push(`${file}:${line + i + 1} ${name}`);
          }
        }
      });
    }
  }
  return found;
}

describe('examples apply no class Bulma v1 dropped', () => {
  const dead = deadClasses();
  const read = file => readFileSync(join(REPO, file), 'utf8');

  it('reads the dropped classes', () => {
    assert.ok(dead.has('heading'));
    assert.ok(dead.has('tile'));
  });

  it('finds none in the docs, the skills, or the stories', () => {
    const found = deadUses(exampleFiles(), dead, read);
    assert.deepEqual(
      found,
      [],
      `Bulma v1 has no rule for these, so they style nothing; spell the look with helper props:\n${found.join('\n')}`
    );
  });

  it('reads class strings in fences, stories, and both attribute spellings', () => {
    const sources = {
      'a.md': [
        '```tsx live',
        '<Paragraph className="heading">Posts</Paragraph>',
        '```',
        '```html',
        '<div class="box tile">x</div>',
        '```',
        '```text',
        '<p class="heading">not an example</p>',
        '```',
      ].join('\n'),
      'b.stories.tsx': "const A = () => <p className={'heading'}>x</p>;",
    };
    assert.deepEqual(
      deadUses(Object.keys(sources), dead, f => sources[f]),
      ['a.md:2 heading', 'a.md:5 tile', 'b.stories.tsx:1 heading']
    );
  });
});
