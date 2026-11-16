/**
 * Hold every `Modal` in the examples to a dialog with a name.
 *
 * An open `Modal` is a `role="dialog"`, and a dialog needs an accessible
 * name: without one a screen reader announces "dialog" as focus moves in,
 * with nothing to say what it's for, while `aria-modal` hides the page
 * around it. The props form wires `modalCardTitle` up as `aria-labelledby`,
 * and any other modal takes an `aria-label` or an `aria-labelledby` of its
 * own. Several Modal examples gave it none and rendered fine, so nothing else
 * caught it (#1894). This reads the jsx and tsx fences under `docs/docs` and
 * `skills` indented by at most three spaces, the `.tsx` examples in `skills`,
 * and bulma-ui's stories. It checks that a name is given, not that an
 * `aria-labelledby` points at an element that exists.
 *
 * The `bestax-migrate` references are left out, as the Menu.Item test leaves
 * them out: their fences pair another library's markup, whose `Modal` isn't
 * this one, with what the codemod writes for it.
 *
 * A modal passes when it has `modalCardTitle`, `aria-label` or
 * `aria-labelledby` with a value, or a spread, which this can't see into.
 *
 * Each source is parsed with TypeScript as a `.tsx` file and nothing is
 * compiled, so a fence that is only a fragment still reads.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';
import { fenceSpans, splitLines } from './lib/api-page.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const ts = createRequire(join(REPO, 'package.json'))('typescript');
const MODAL_PAGE = 'docs/docs/api/components/modal.md';
const LEFT_OUT = 'skills/bestax-migrate/references/';

/** The props that name each dialog component, beside the ARIA ones. */
const NAMING = {
  Modal: ['modalCardTitle'],
};
const ARIA = ['aria-label', 'aria-labelledby'];

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

/**
 * Whether an attribute holds a value: a string that isn't empty, or an
 * expression other than `undefined` or `null`.
 */
function holdsValue(prop) {
  const value = prop.initializer;
  if (value === undefined) return false;
  if (ts.isStringLiteral(value)) return value.text.trim() !== '';
  const expr = value.expression;
  if (expr === undefined) return false;
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
    return expr.text.trim() !== '';
  }
  return !(
    expr.kind === ts.SyntaxKind.NullKeyword ||
    (ts.isIdentifier(expr) && expr.text === 'undefined')
  );
}

/** Whether a dialog component's attributes give it a name. */
function named(tag, attributes) {
  const names = [...NAMING[tag], ...ARIA];
  return attributes.properties.some(
    prop =>
      ts.isJsxSpreadAttribute(prop) ||
      (names.includes(prop.name.getText()) && holdsValue(prop))
  );
}

/** Every dialog component in one piece of code, with its line and verdict. */
function readCode(code) {
  const sf = ts.createSourceFile(
    'example.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const found = [];
  const visit = node => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sf);
      if (Object.hasOwn(NAMING, tag)) {
        found.push({
          tag,
          offset: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line,
          ok: named(tag, node.attributes),
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

/** The same, for a whole file, each found as `{ tag, at, ok }`. */
function readFile(rel) {
  return sourcesOf(rel).flatMap(({ code, line }) =>
    readCode(code).map(({ tag, offset, ok }) => ({
      tag,
      at: `${rel}:${line + offset}`,
      ok,
    }))
  );
}

const FILES = [
  ...filesUnder('docs/docs', rel => /\.mdx?$/.test(rel)),
  ...filesUnder(
    'skills',
    rel => /\.(mdx?|tsx)$/.test(rel) && !rel.startsWith(LEFT_OUT)
  ),
  ...filesUnder('bulma-ui/src', rel => rel.endsWith('.stories.tsx')),
];

describe('Modal in the examples', () => {
  const found = FILES.flatMap(readFile);

  it('holds each way of naming a modal to whether it names it', () => {
    const verdicts = [
      ['<Modal active modalCardTitle="Edit">x</Modal>', true],
      ['<Modal active aria-label="Edit">x</Modal>', true],
      ['<Modal active aria-labelledby="edit-title">x</Modal>', true],
      ['<Modal active aria-label={label}>x</Modal>', true],
      ['<Modal {...props}>x</Modal>', true],
      ['<Modal active>x</Modal>', false],
      ['<Modal active modalCardFoot={foot}>x</Modal>', false],
      ['<Modal active aria-label="">x</Modal>', false],
      ['<Modal active aria-label={undefined}>x</Modal>', false],
      ['<Modal active aria-labelledby={null}>x</Modal>', false],
      ['<Modal active title="Edit">x</Modal>', false],
    ];
    // Every shape the rule gets wrong, so a failure names all of them.
    const wrong = verdicts
      .filter(([code, ok]) => readCode(code)[0].ok !== ok)
      .map(([code]) => code);
    assert.deepEqual(wrong, []);
  });

  it('reads the pages the Modal examples live on', () => {
    // So a moved page or a parse that finds nothing can't pass by reading
    // no modals at all.
    for (const rel of [
      MODAL_PAGE,
      'docs/docs/guides/library/components.md',
      'bulma-ui/src/components/Modal.stories.tsx',
    ]) {
      assert.ok(
        found.some(modal => modal.at.startsWith(`${rel}:`)),
        `found no Modal in ${rel}`
      );
    }
  });

  it('gives every modal a name', () => {
    const nameless = found.filter(modal => !modal.ok).map(modal => modal.at);
    assert.deepEqual(
      nameless,
      [],
      'These open a dialog with no name. Give each `modalCardTitle`, or an ' +
        '`aria-label`, or an `aria-labelledby` pointing at a heading ' +
        'inside it:\n  ' +
        nameless.join('\n  ')
    );
  });
});
