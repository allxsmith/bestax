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
import { fileURLToPath } from 'node:url';
import { exportedModules, extractComponent } from './lib/props-extract.mjs';

const require = createRequire(import.meta.url);
const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(REPO, 'eslint-plugin', 'src', 'generated', 'metadata.ts');

/**
 * The sentence the library uses to mark a text-alias `color`. Authored
 * identically across those components on purpose (see the TSDoc on Box,
 * Block, Card, …), which is what makes it safe to match on.
 *
 * A rename of this phrase must fail loudly rather than silently empty the
 * rule, so the caller asserts the match count is non-zero.
 */
const TEXT_ALIAS_MARKER = /Text color alias/i;

/** `Use \`isFullwidth\` instead — …` → `isFullwidth`. */
export function replacementFrom(note) {
  const m = /^Use `([A-Za-z0-9_.]+)` instead/.exec(note ?? '');
  return m ? m[1] : null;
}

export function collect() {
  const names = [...exportedModules().keys()]
    .filter(n => /^[A-Z]/.test(n))
    .sort();

  /** element path → prop → { replacement, note } */
  const deprecated = new Map();
  /** element paths whose `color` is a text alias */
  const textAlias = new Set();

  for (const name of names) {
    const info = extractComponent(name, { markdown: false });
    for (const table of info.tables ?? []) {
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

  if (!deprecated.size) {
    throw new Error(
      'no deprecated props found — props-extract stopped reporting ' +
        '`deprecated`, or every @deprecated tag was removed. Refusing to ' +
        'write a table that would silently disable no-deprecated-props.'
    );
  }
  if (!textAlias.size) {
    throw new Error(
      `no text-alias color props found — the TSDoc phrase ${TEXT_ALIAS_MARKER} ` +
        'no longer matches. Refusing to write a set that would silently ' +
        'disable no-color-as-surface.'
    );
  }
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
// Do not edit by hand — run \`pnpm gen:eslint-meta\`. CI fails on a stale copy.

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
 * Elements with a real \`is-<color>\` modifier (\`Button\`, \`Hero\`,
 * \`Notification\`, \`Progress\`, …) are deliberately absent.
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const text = await build();
  await writeFile(OUT, text, 'utf8');
  console.log(`wrote ${OUT}`);
}
