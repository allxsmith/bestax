#!/usr/bin/env node
/**
 * Write the ESLint plugin's component metadata from the library's own TSDoc.
 *
 * Two of the plugin's rules need to know things only the library knows, and
 * both go stale the moment a prop is renamed:
 *
 *   no-deprecated-props   which props carry `@deprecated`, and what replaces
 *                         them. The replacement is not a separate field — it
 *                         is in the note, phrased "Use `X` instead", which is
 *                         where the autofix comes from.
 *   no-color-as-surface   which elements treat `color` as a TEXT alias rather
 *                         than a filled variant. `<Box color="primary">` sets
 *                         text colour; `<Button color="primary">` fills the
 *                         button. Getting that backwards is the whole point of
 *                         the rule, so the set is read from the TSDoc sentence
 *                         the library states it in, never hand-listed.
 *
 * Source is `scripts/lib/props-extract.mjs` — the same extractor behind
 * gen-mcp-index.mjs and gen-api-docs.mjs, so this adds no new extraction and
 * cannot disagree with the API reference. Reading bestax-mcp/data/ instead
 * would couple two generated artifacts and impose an order between them.
 *
 * Design contract, inherited from gen-component-catalog.mjs: plain node, no
 * build step, deterministic output (code-point sort), and the output is run
 * through prettier before writing so the committed bytes are exactly what
 * `format:check` wants. Staleness is gated by `pnpm gen:eslint-meta:check`.
 *
 * Keys are the JSX element name as written, so a compound part is
 * "Navbar.Brand". That distinction is load-bearing: `<Buttons>` takes a text
 * alias, `<Buttons.Button>` takes a real variant.
 */
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { exportedModules, extractComponent } from './lib/props-extract.mjs';

const require = createRequire(import.meta.url);
const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(REPO, 'eslint-plugin', 'src', 'generated', 'metadata.ts');

/**
 * The sentence the library uses to mark a text-alias `color`. Authored
 * identically across those components on purpose (see the TSDoc on Box,
 * Block, Card, …), which is what makes it matchable at all.
 *
 * KNOWN INCOMPLETE, and deliberately so for now. The phrase is prose, not
 * behaviour: other components funnel `color` into the helper's text slot with
 * the same `color: textColor ?? color` construct as `Box`, and emit no
 * `is-<color>` class either, but word their TSDoc "Bulma color modifier" and
 * so are missed. Naming them here would be a closed list that goes stale and
 * reads as exhaustive; the construct is what to grep for, and the miss set
 * includes compound parts whose parent IS in the set. The miss direction is a
 * false negative on an opt-in rule, which is the safe one; the fix is to key
 * on that construct instead of on the sentence, which is its own change with
 * its own dogfooding. Until then the generated comment says the set is
 * partial rather than implying it is exhaustive.
 */
const TEXT_ALIAS_MARKER = /Text color alias/i;

/**
 * Components whose text-alias status is load-bearing for the rule's message.
 *
 * The emptiness guard below only catches a total wipeout; a rewording of ONE
 * component's TSDoc would drop it from the rule with a legitimate-looking diff
 * and no failure. Anchoring on names rather than on a count means a legitimate
 * addition needs no edit here, while a rewording of one of these fails loudly.
 */
const TEXT_ALIAS_ANCHORS = ['Box', 'Card', 'Content'];

/**
 * `Use \`isFullwidth\` instead — …` → `isFullwidth`.
 *
 * The capture is restricted to characters a JSX attribute name can actually
 * contain. It previously admitted `.`, which cannot appear in a prop name and
 * so matched only the one shape that can never be a valid fix: the library
 * carries `@deprecated Use \`Tabs.Tab\` with an \`index\` prop instead.` and
 * escaped solely because "with an" sits between the backtick and "instead".
 * Had it not, the rule would have written `Tabs.Tab=` into a consumer's
 * source and `eslint --fix` would have produced a file that does not parse.
 */
export function replacementFrom(note) {
  const m = /^Use `([A-Za-z0-9_]+)` instead/.exec(note ?? '');
  return m ? m[1] : null;
}

/**
 * Everything that must hold before this table is written, as a list rather
 * than as five `throw`s inside `collect()`.
 *
 * Pure so a test can drive it: `collect()` reads the real library, so on the
 * happy path every guard is dead code, and deleting one changed no output and
 * left `gen:eslint-meta:check`, `pnpm all` and the node suite green. The same
 * shape as `manifestViolations` in check-conformance.mjs, and extracted for
 * the same reason.
 *
 * @param {{deprecated: Map, textAlias: Set, knownProps: Map}} collected
 * @returns {string[]} one message per violation, empty when all guards hold
 */
export function guardViolations({ deprecated, textAlias, knownProps }) {
  const violations = [];

  if (!deprecated.size) {
    violations.push(
      'no deprecated props found — props-extract stopped reporting ' +
        '`deprecated`, or every @deprecated tag was removed. Refusing to ' +
        'write a table that would silently disable no-deprecated-props.'
    );
  }
  if (!textAlias.size) {
    violations.push(
      `no text-alias color props found — the TSDoc phrase ${TEXT_ALIAS_MARKER.source} ` +
        'no longer matches. Refusing to write a set that would silently ' +
        'disable no-color-as-surface.'
    );
  }

  // A replacement the rule will write as an attribute name has to be a prop
  // the element actually declares. Parsing English into an edit is only safe
  // while that holds, and this is what keeps it true rather than true by luck.
  for (const [element, props] of deprecated) {
    for (const [prop, { replacement }] of props) {
      if (replacement === null) continue;
      if (!knownProps.get(element)?.has(replacement)) {
        violations.push(
          `${element}.${prop} says its replacement is \`${replacement}\`, ` +
            `which is not a prop ${element} declares. Either the note was ` +
            `reworded or replacementFrom read it wrongly; writing that as an ` +
            `attribute name would corrupt a consumer's source.`
        );
      }
    }
  }

  // `no-color-as-surface` rewrites `color` to `textColor` on every element in
  // this set, so each one has to declare `textColor` — the same guard the
  // deprecation replacements get, rather than a claim about how many do.
  for (const element of textAlias) {
    if (!knownProps.get(element)?.has('textColor')) {
      violations.push(
        `${element} is in the text-alias set but does not declare ` +
          '`textColor`, which is what no-color-as-surface rewrites `color` ' +
          'to. Writing it would produce a prop the element does not accept.'
      );
    }
  }

  const missing = TEXT_ALIAS_ANCHORS.filter(n => !textAlias.has(n));
  if (missing.length) {
    violations.push(
      `${missing.join(', ')} no longer ${
        missing.length === 1 ? 'matches' : 'match'
      } ${TEXT_ALIAS_MARKER.source}, so ` +
        'no-color-as-surface would stop reporting them. If the TSDoc was ' +
        'reworded on purpose, update TEXT_ALIAS_MARKER (or the anchors) here ' +
        'in the same change.'
    );
  }

  return violations;
}

export function collect() {
  const names = [...exportedModules().keys()]
    .filter(n => /^[A-Z]/.test(n))
    .sort();

  /** element path → prop → { replacement, note } */
  const deprecated = new Map();
  /** element path → every prop name it declares, to validate replacements */
  const knownProps = new Map();
  /** element paths whose `color` is a text alias */
  const textAlias = new Set();

  for (const name of names) {
    const info = extractComponent(name, { markdown: false });
    for (const table of info.tables ?? []) {
      // Every element's own prop names, so a replacement or a rewrite target
      // can be checked against what the element actually declares.
      knownProps.set(table.path, new Set((table.rows ?? []).map(r => r.name)));
      for (const row of table.rows ?? []) {
        if (row.deprecated) {
          if (!deprecated.has(table.path))
            deprecated.set(table.path, new Map());
          // A prop can appear under two parts of the same component; the first
          // reading wins and the note is identical either way.
          const props = deprecated.get(table.path);
          if (!props.has(row.name)) {
            props.set(row.name, {
              replacement: replacementFrom(row.deprecationNote),
              note: row.deprecationNote ?? null,
            });
          }
          continue;
        }
        if (
          row.name === 'color' &&
          TEXT_ALIAS_MARKER.test(row.description ?? '')
        ) {
          textAlias.add(table.path);
        }
      }
    }
  }

  const violations = guardViolations({ deprecated, textAlias, knownProps });
  if (violations.length) throw new Error(violations.join('\n'));
  return { deprecated, textAlias };
}

export function render({ deprecated, textAlias }) {
  const entries = [...deprecated.entries()].sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0
  );
  const rows = entries.map(([element, props]) => {
    const inner = [...props.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(
        ([prop, { replacement, note }]) =>
          `    ${JSON.stringify(prop)}: { replacement: ${
            replacement === null ? 'null' : JSON.stringify(replacement)
          }, note: ${JSON.stringify(note)} },`
      )
      .join('\n');
    return `  ${JSON.stringify(element)}: {\n${inner}\n  },`;
  });

  return `// Generated by scripts/gen-eslint-meta.mjs from the library's TSDoc.
// Do not edit by hand — run \`pnpm gen:eslint-meta\`, which \`pnpm all\` runs.

/** What a deprecated prop should become, and why it was deprecated. */
export interface Deprecation {
  /** The prop to use instead, when the note names one. Drives the autofix. */
  readonly replacement: string | null;
  /** The library's own deprecation note, quoted to the user verbatim. */
  readonly note: string | null;
}

/**
 * Deprecated props, keyed by the JSX element name as written — so a compound
 * part is \`"Navbar.Brand"\`.
 */
export const DEPRECATED_PROPS: Readonly<
  Record<string, Readonly<Record<string, Deprecation>>>
> = {
${rows.join('\n')}
};

/**
 * Elements whose \`color\` prop is a text-colour alias, NOT a filled surface
 * variant. On these, \`color\` renders \`has-text-<color>\` exactly like
 * \`textColor\`, and a coloured background needs \`bgColor\`.
 *
 * NOT exhaustive. Membership is read from the TSDoc sentence the library uses
 * to say so, and components that behave identically while wording it
 * differently are missed, compound parts included. So absence here does NOT
 * mean the element has a real \`is-<color>\` modifier: it means no sentence
 * claimed otherwise. Elements that genuinely do have one are also absent, so
 * this set is evidence of a text alias and never of a real variant.
 */
export const TEXT_ALIAS_COLOR_ELEMENTS: readonly string[] = [
${[...textAlias]
  .sort()
  .map(n => `  ${JSON.stringify(n)},`)
  .join('\n')}
];
`;
}

export async function build() {
  const out = render(collect());
  const prettier = require('prettier');
  const config = await prettier.resolveConfig(OUT);
  return prettier.format(out, { ...config, filepath: OUT });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const text = await build();
  await writeFile(OUT, text, 'utf8');
  console.log(`wrote ${OUT}`);
}
