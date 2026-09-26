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
 *   no-bulma-component-class
 *                         which Bulma classes name a bestax component. That is
 *                         not the library's knowledge but bestax-migrate's:
 *                         its bulma-classes table (`class-map.ts`), imported
 *                         directly (node strips its types), the same way
 *                         gen-mcp-index.mjs reads it for lookup_bulma_classes.
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
const CLASS_MAP = join(
  REPO,
  'bestax-migrate',
  'src',
  'sources',
  'bulma-classes',
  'class-map.ts'
);

/**
 * Classes no-bulma-component-class must keep reporting, with the component it
 * names: a converted root, a part, and two families. A table that loses one
 * has lost what the rule is for, whatever else it still holds.
 */
const CLASS_ANCHORS = {
  button: 'Button',
  'hero-body': 'Hero.Body',
  card: 'Card',
  navbar: 'Navbar',
};

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

/**
 * The Bulma classes that name a bestax component, from bestax-migrate's
 * table, in the order its planner decides an element's component when the
 * element carries several: a family first (its markup is converted by hand,
 * whatever else is on it), then the converted roots by precedence. The rule
 * reports the first one an element carries, so the order is the decision.
 *
 * Parts of a family are left out: the family's outermost class is the one
 * place the codemod flags it, and the rule follows suit. Classes with nothing
 * to convert to (`plain`) are left out because there is no component to name.
 *
 * @param {() => Promise<any>} [load] the table module, for a test to replace.
 */
export async function bulmaComponentClasses(
  load = () => import(pathToFileURL(CLASS_MAP).href)
) {
  let map;
  try {
    map = await load();
  } catch (err) {
    throw new Error(
      `could not import ${CLASS_MAP}: ${err.message}. It is loaded with ` +
        `node's type stripping, which needs Node 22.18 or later.`,
      { cause: err }
    );
  }
  const roots = Object.entries(map.ROOTS);
  const families = roots.filter(
    ([, entry]) => entry.status === 'todo' && !entry.part
  );
  const rank = cls => {
    const index = map.PRECEDENCE.indexOf(cls);
    return index === -1 ? map.PRECEDENCE.length : index;
  };
  const mapped = roots
    .filter(([, entry]) => entry.status === 'mapped')
    .sort(([a], [b]) => rank(a) - rank(b));
  return {
    entries: [
      ...families.map(([cls, entry]) => [
        cls,
        { component: entry.target ?? null, converts: false },
      ]),
      ...mapped.map(([cls, entry]) => [
        cls,
        { component: entry.target ?? null, converts: true },
      ]),
    ],
  };
}

/**
 * Components the class table names that the library does not document as an
 * element, down to the part (`Hero.Bdy` fails where a root check would pass).
 *
 * @param {{entries: Array<[string, {component: string | null}]>}} classes
 * @param {Set<string>} elements every element path `collect()` read.
 */
export function unknownComponents(classes, elements) {
  return classes.entries
    .filter(([, { component }]) => component && !elements.has(component))
    .map(
      ([cls, { component }]) =>
        `\`.${cls}\` names \`${component}\`, which is not an element the ` +
        'library documents. The rule would point people at a component that is ' +
        'not there.'
    );
}

/**
 * What would make the class table wrong to write: empty, a class with no
 * component, a component the library does not export, or a lost anchor.
 * Every one of those would have the rule name something that is not there.
 *
 * @param {{entries: Array<[string, {component: string | null}]>}} classes
 * @param {Map<string, unknown>} exported the library's exports by name.
 */
export function classTableViolations(classes, exported) {
  const violations = [];
  if (!classes.entries.length) {
    violations.push(
      "no Bulma component classes found in bestax-migrate's class-map.ts. " +
        'Refusing to write a table that would silently disable ' +
        'no-bulma-component-class.'
    );
  }
  for (const [cls, { component }] of classes.entries) {
    if (!component) {
      violations.push(
        `\`.${cls}\` names no bestax component in class-map.ts; give it a ` +
          "`target` (a family's `todo(target, why)`), or the rule has " +
          'nothing to name.'
      );
    } else if (!exported.has(component.split('.')[0])) {
      violations.push(
        `\`.${cls}\` names \`${component}\`, which the library does not ` +
          'export. The rule would point people at a component that is not there.'
      );
    }
  }
  const found = new Map(classes.entries);
  for (const [cls, component] of Object.entries(CLASS_ANCHORS)) {
    if (found.get(cls)?.component !== component) {
      violations.push(
        `\`.${cls}\` no longer names \`${component}\`, so ` +
          'no-bulma-component-class would stop reporting it as that. If the ' +
          'table changed on purpose, update CLASS_ANCHORS here in the same change.'
      );
    }
  }
  return violations;
}

/**
 * Read the library and build the tables, refusing to return a bad one.
 *
 * The extractor is a parameter with the real one as its default, which is the
 * only way a test reaches the `throw` below. Everything else here is pure or
 * tested: `replacementFrom` and `guardViolations` have their own suites, and
 * `render` has one. The line that turns a violation list into a failure had
 * none, because on the real library every guard is dead code — deleting it
 * changed no output and left the node suite, `gen:eslint-meta:check` and
 * `pnpm all` green, which is a bad property for the thing standing between a
 * corrupt table and a consumer's source.
 *
 * @param {{exportedModules?: Function, extractComponent?: Function}} [deps]
 */
export function collect(deps = {}) {
  const readModules = deps.exportedModules ?? exportedModules;
  const readComponent = deps.extractComponent ?? extractComponent;
  const names = [...readModules().keys()].filter(n => /^[A-Z]/.test(n)).sort();

  /** element path → prop → { replacement, note } */
  const deprecated = new Map();
  /** element path → every prop name it declares, to validate replacements */
  const knownProps = new Map();
  /** element paths whose `color` is a text alias */
  const textAlias = new Set();

  for (const name of names) {
    const info = readComponent(name, { markdown: false });
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
  // Every element path the library documents, compound parts included, so
  // the class table can be held to real JSX names (`Hero.Body`, not just `Hero`).
  return { deprecated, textAlias, elements: new Set(knownProps.keys()) };
}

export function render({ deprecated, textAlias, classes = [] }) {
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

  return `// Generated by scripts/gen-eslint-meta.mjs from the library's TSDoc and
// bestax-migrate's bulma-classes table.
// Do not edit by hand — run \`pnpm gen:eslint-meta\`. CI fails on a stale one.

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

/** A Bulma class that names a bestax component. */
export interface BulmaComponentClass {
  /** The bestax component, dotted for a part (\`Hero.Body\`). */
  readonly component: string;
  /**
   * Whether \`bestax-migrate bulma-classes\` converts the element. False for a
   * family whose component renders its own parts, converted by hand.
   */
  readonly converts: boolean;
}

/**
 * Bulma classes that name a bestax component, from bestax-migrate's
 * bulma-classes table. In the order the codemod decides an element's
 * component when it carries several: a family first, then by precedence.
 */
export const BULMA_COMPONENT_CLASSES: ReadonlyMap<string, BulmaComponentClass> =
  new Map<string, BulmaComponentClass>([
${classes
  .map(
    ([cls, { component, converts }]) =>
      `    [${JSON.stringify(cls)}, { component: ${JSON.stringify(component)}, converts: ${converts} }],`
  )
  .join('\n')}
  ]);
`;
}

/**
 * The class table is checked first, and refuses before the library is read.
 *
 * @param {{loadClassMap?: () => Promise<any>}} [deps] for a test to replace.
 */
export async function build(deps = {}) {
  const classes = await bulmaComponentClasses(deps.loadClassMap);
  const violations = classTableViolations(classes, exportedModules());
  if (violations.length) throw new Error(violations.join('\n'));
  const tables = collect();
  const unknown = unknownComponents(classes, tables.elements);
  if (unknown.length) throw new Error(unknown.join('\n'));
  const out = render({ ...tables, classes: classes.entries });
  const prettier = require('prettier');
  const config = await prettier.resolveConfig(OUT);
  return prettier.format(out, { ...config, filepath: OUT });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const text = await build();
  await writeFile(OUT, text, 'utf8');
  console.log(`wrote ${OUT}`);
}
