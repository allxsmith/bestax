#!/usr/bin/env node
/**
 * Fill the machine-owned regions of the API reference pages.
 *
 * Four regions per page, delimited by `<!-- bestax:generated <id> -->` markers:
 *
 *   overview  the one-line summary, from the component's TSDoc
 *   import    the import statement, from the public barrel
 *   props     the prop table(s), from the `<X>Props` interfaces
 *   cssvars   the CSS/Sass variable table, parsed from the SCSS
 *
 * Everything else on the page — Usage, Accessibility, Related Components,
 * Additional Resources, and any prose outside the markers — is hand-written and
 * preserved byte-for-byte. Deleting a marker pair opts that region out.
 *
 * Design contract, inherited from gen-component-catalog.mjs: plain node, no
 * build step, deterministic output (code-point sort, CRLF tolerated), and a CI
 * staleness gate that regenerates and diffs. It differs on one point — this
 * generator READS node_modules/bulma for the stock components' SCSS, so
 * `pnpm install` must have run. That is checked with a clear error rather than
 * an ENOENT stack.
 *
 * Regenerate with `pnpm gen` (which also refreshes the skill catalog, since
 * generated Overview sentences feed its one-liners).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

import {
  readRegions,
  replaceRegion,
  openMarker,
  closeMarker,
  upsertFrontmatter,
  renderTable,
  firstSentence,
  frontmatterTitle,
} from './lib/api-page.mjs';
import { mdFiles } from './lib/api-catalog.mjs';
import { extractComponent, varRootCandidates } from './lib/props-extract.mjs';
import { componentVars } from './lib/scss-vars.mjs';
import {
  SCSS_SOURCES,
  IMPORT_COMPANIONS,
  MANAGED_CATEGORIES,
  GENERATED_EXEMPT,
} from './lib/api-sources.mjs';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const API_DIR = join(REPO, 'docs', 'docs', 'api');
const PACKAGE = '@allxsmith/bestax-bulma';

/**
 * Component name -> the API page that documents it, e.g. `Column` ->
 * `columns/column.md`. Used to link a compound sub-component to its own page
 * rather than restating its whole table under the parent.
 */
let pageIndex = null;
async function pagesByTitle() {
  if (pageIndex) return pageIndex;
  pageIndex = new Map();
  for (const file of await mdFiles(API_DIR)) {
    const title = frontmatterTitle(await readFile(file, 'utf8'));
    if (title) {
      pageIndex.set(title, relative(API_DIR, file).split('\\').join('/'));
    }
  }
  return pageIndex;
}

let bulmaRoot = null;
function bulmaSassPath(rel) {
  if (!bulmaRoot) {
    try {
      bulmaRoot = dirname(require.resolve('bulma/package.json'));
    } catch {
      throw new Error(
        'Cannot resolve the `bulma` package. The CSS/Sass variable tables are ' +
          'parsed from its SCSS source, so run `pnpm install --frozen-lockfile` ' +
          'before `pnpm gen:api-docs`.'
      );
    }
  }
  const full = join(bulmaRoot, rel);
  if (!existsSync(full)) {
    throw new Error(
      `${rel} does not exist in the installed bulma package (${bulmaRoot}). ` +
        'If bulma was upgraded, update SCSS_SOURCES in scripts/lib/api-sources.mjs.'
    );
  }
  return full;
}

// ---------------------------------------------------------------------------
// Region renderers. Each returns the region body, or null to leave it alone.
// ---------------------------------------------------------------------------

/** First sentence of the component's TSDoc summary. */
function renderOverview(info) {
  const text = (info.tsdoc || '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return `\n${firstSentence(text)}\n`;
}

function renderImport(info) {
  const names = IMPORT_COMPANIONS[info.name] ?? [info.name];
  const list = names.join(', ');
  const single = `import { ${list} } from '${PACKAGE}';`;
  // Let prettier decide the final wrapping; emit the one-line form.
  return ['', '```tsx', single, '```', ''].join('\n');
}

function renderProps(info, { pages, relPath }) {
  const blocks = [];
  const [root, ...subs] = info.tables;
  if (!root) return null;

  // A sub-component re-exported as a standalone component has its own page.
  // Restating its table here would duplicate it and give it two places to
  // drift from; link instead. Sub-components with no page of their own
  // (`Table.Thead`, `Hero.Head`) still render in full — this page is the only
  // documentation they have.
  const ownPage = sub => {
    const page = sub.component && pages.get(sub.component);
    if (!page || page === relPath) return null;
    const from = relPath.split('/').slice(0, -1);
    const to = page.split('/');
    while (from.length && to.length > 1 && from[0] === to[0]) {
      from.shift();
      to.shift();
    }
    return [...from.map(() => '..'), ...to].join('/');
  };

  const table = t => {
    const rows = t.rows.map(r => [
      `\`${r.name}\``,
      r.type,
      r.default ? `\`${r.default}\`` : '—',
      r.description || '',
    ]);
    for (const extra of t.extraProps) {
      rows.push([
        `\`${extra.name}\``,
        extra.type || '—',
        extra.default ? `\`${extra.default}\`` : '—',
        extra.description,
      ]);
    }
    if (t.catchAll) {
      rows.push([
        '`...`',
        t.catchAll.text,
        '—',
        t.catchAll.helpers ? `See [Helper Props](${t.helpersLink})` : '',
      ]);
    }
    return renderTable(['Prop', 'Type', 'Default', 'Description'], rows);
  };

  // Type aliases named in a cell but too long to inline. Defining them once,
  // under the table that uses them, is the whole reason a cell is allowed to
  // say `BulmaGapValue` instead of listing 18 members — without it the cell is
  // strictly less informative than the prose it replaced.
  const types = t => {
    if (!t.types?.length) return null;
    return [
      '**Types:**',
      '',
      ...t.types.map(a => {
        const expansion = a.expansion
          .split(' | ')
          .map(p => `\`${p}\``)
          .join(' | ');
        // Whole summary, not just the first sentence: this list IS the
        // definition, and the sentences after the first are where the alias
        // explains its value space.
        const summary = a.summary
          ? ` — ${a.summary.replace(/\s+/g, ' ').trim()}`
          : '';
        return `- \`${a.name}\`: ${expansion}${summary}`;
      }),
    ].join('\n');
  };

  const withTypes = t => [table(t), types(t)].filter(Boolean);

  blocks.push(...withTypes(root));

  if (subs.length) {
    // A bullet per sub-component, carrying its TSDoc summary — the
    // hand-written pages described each one here ("Top bar for navigation or
    // branding") and a bare comma-separated list would drop those sentences.
    // Falls back to the inline list when no sub has a summary to show.
    const summaryOf = s => (s.summary ?? '').replace(/\s+/g, ' ').trim();
    const described = subs.filter(s => summaryOf(s));
    if (described.length === subs.length) {
      blocks.push(
        [
          '**Subcomponents:**',
          '',
          ...subs.map(s => {
            const link = ownPage(s);
            const label = link ? `[\`${s.path}\`](${link})` : `\`${s.path}\``;
            // Whole summary, not just the first sentence — this list is the
            // only place a sub-component is described in prose, and the pages
            // it replaces used more than one sentence for several of them.
            return `- ${label}: ${summaryOf(s)}`;
          }),
        ].join('\n')
      );
    } else {
      blocks.push(
        `**Subcomponents:** ${subs
          .map(s => {
            const link = ownPage(s);
            return link ? `[\`${s.path}\`](${link})` : `\`${s.path}\``;
          })
          .join(', ')}.`
      );
    }
    for (const sub of subs) {
      if (ownPage(sub) || sub.listOnly) continue;
      blocks.push(`### ${sub.path}`, ...withTypes(sub));
    }
  }
  return `\n${blocks.join('\n\n')}\n`;
}

/**
 * The CSS-variable rows for one component, each with where Bulma (or this
 * repo) declares its default: the `scope` the page's lead sentence and
 * markers turn into advice on where a reader can set it. Empty when the
 * component has no SCSS sources.
 *
 * Exported so `css-var-scopes.test.mjs` can hold every scope a page states to
 * the compiled stylesheet, from the same rows the page is rendered from.
 *
 * @returns {Promise<{scope: string, pkg: string, cssVar: string,
 *   sassVar: string|null, value: string, modifiers?: string[]}[]>}
 */
export async function cssVarRows(info) {
  const sources = SCSS_SOURCES[info.name];
  if (!sources || !sources.length) return [];

  // No per-entry override: gen-api-sources emits only { pkg, path }, and a
  // hand-added field inside the generated markers is erased on the next
  // regenerate. The real escape hatch is ROOT_CLASS_OVERRIDES /
  // VAR_PREFIX_OVERRIDES (and, for a component owning more than one of its
  // own repo partials, EXTRA_VAR_ROOTS) in props-extract.mjs, which survive
  // regeneration. This file once read a `source.root ?? …` here, and its own
  // error message advised adding the field the generator would delete (#464).
  const candidates = varRootCandidates(
    info.name,
    info.rootClass,
    info.varPrefix
  );
  if (!candidates.some(c => c.root || c.prefix)) {
    throw new Error(
      `${info.name}: cannot determine the root class or variable prefix. ` +
        `Add the component to ROOT_CLASS_OVERRIDES or — for a semantic ` +
        `wrapper with no prefixed class of its own — VAR_PREFIX_OVERRIDES ` +
        `in scripts/lib/props-extract.mjs.`
    );
  }

  const rows = [];
  // A component can legitimately draw variables from more than one partial:
  // Bulma's form/shared.scss registers the `--bulma-input-*` set on a selector
  // list covering .control/.input/.textarea/.select, so those really do apply
  // to all four. It can also draw variables from a SINGLE partial under a
  // DIFFERENT one of its own roots than the primary one (the date/time
  // pickers' internal calendar/wheel helpers, #543) — every candidate is
  // tried against every source. Dedupe across (file, candidate) by CSS
  // variable name, first match wins — the same rule componentVars() applies
  // within a file.
  const seen = new Set();
  for (const source of sources) {
    const file =
      source.pkg === 'bulma'
        ? bulmaSassPath(source.path)
        : join(REPO, source.path);
    const src = await readFile(file, 'utf8');
    for (const { root, prefix } of candidates) {
      if (!root && !prefix) continue;
      // An EXTRA root (its class differs from the component's primary
      // rootClass) is a constituent element the component also owns — the
      // pickers' calendar grid and time wheels, on `.dateinput`/`.timeinput`/
      // `.datetimeinput`, not the primary `.input`. Inside their own partial
      // that class IS the selector's root, so componentVars scores them
      // 'root'; but the page's 'root' lead names `.input` and tells the reader
      // to override there or via `className`, which loses — the element is
      // separate and can be portaled, so even inheritance breaks. Force
      // 'element' so the existing marker + note fire, exactly as Tabs'
      // `.tabs-root` vars already do via the primary-root constituent rule.
      const isExtra = root !== info.rootClass;
      for (const row of componentVars(src, root, prefix)) {
        if (seen.has(row.cssVar)) continue;
        seen.add(row.cssVar);
        rows.push({
          ...row,
          scope: isExtra ? 'element' : row.scope,
          pkg: source.pkg,
        });
      }
    }
  }
  return rows;
}

/**
 * What each scope tells a reader, as the page's lead sentence when every row
 * shares it, and as a marker plus a note below the table when only some do.
 *
 * Where Bulma declares a default decides where a value can be set from,
 * because a custom property inherits only as a fallback: an element that
 * declares a variable itself uses its own value whatever its ancestors say.
 * So `:root` is the one home a value set further up can override. A
 * component's own selector, a constituent element and the element a Bulma
 * mixin is included on all carry their own declaration, and an ancestor's
 * value (`Theme` included) never reaches them. Delete's page said otherwise
 * for its mixin-declared variables until #1021.
 *
 * The compound wording exists because the className advice is
 * specificity-dependent, not universal: LinkButton's defaults sit on
 * `.button.link-button` (0-2-0), and a single custom class added via
 * className is 0-1-0 — it loses regardless of stylesheet order, so the
 * documented override would silently do nothing. Review on #544 caught the
 * generated page giving exactly that advice.
 *
 * Every scope has a lead, a marker and a note, `root` included, so whichever
 * scope leads a page, every row whose scope differs is marked and explained.
 * `global` had no marker until #1021, and Control's page told readers that
 * the `--bulma-control-*` variables Bulma declares on `:root` lose to a
 * declaration on `.control` that does not exist. `root` had none either,
 * which was safe only while it sorted first in the order below.
 */
export function cssVarScopeText(info, rows, themeLink) {
  const target = info.rootClass ? `\`.${info.rootClass}\`` : 'its own';
  const element = info.rootClass
    ? `\`.${info.rootClass}\` element`
    : `\`${info.name}\` element`;
  const modifiers = [
    ...new Set(
      rows.filter(r => r.scope === 'mixin').flatMap(r => r.modifiers ?? [])
    ),
  ].map(m => `\`${m}\``);
  const modifierList =
    modifiers.length > 1
      ? `${modifiers.slice(0, -1).join(', ')} and ${modifiers.at(-1)}`
      : modifiers.join('');
  // A modifier that declares a mixin variable again is a compound selector,
  // so a lone `className` class loses to it on a sized component. The lead
  // and the note share these clauses, so whichever a page shows carries the
  // caveat: `root` and `global` sort ahead of `mixin`, so one such row on
  // the page puts the mixin rows on the note.
  const declaredAgain = modifierList
    ? `, and declares some of them again on ${modifierList}`
    : '';
  const mixinClassName =
    `with a class via \`className\` whose rule loads after the library ` +
    `styles` +
    (modifierList
      ? ` and, with one of those modifiers on, out-ranks the modifier's rule`
      : '');
  const leads = {
    compound:
      `\`${info.name}\` registers these variables on a compound selector ` +
      `(higher specificity than a single class). Override them with inline ` +
      `\`style\`, or with a selector that exceeds that specificity (one ` +
      `that only matches it must load after the library styles to win by ` +
      `source order) — a lone class via \`className\` loses to the ` +
      `component-level declaration. See [Theme](${themeLink}).`,
    element:
      `\`${info.name}\` registers these variables on its constituent ` +
      `elements, where the themed declarations live. A value set via ` +
      `\`className\`, the \`style\` prop, or any ancestor is only ` +
      `inherited and loses to the element's own declaration — override by ` +
      `targeting the declaring element in your CSS. See ` +
      `[Theme](${themeLink}).`,
    root:
      `\`${info.name}\` registers these variables on its own ` +
      `${target} element. Override them there (or via \`className\`) — ` +
      `a value set on an ancestor is only inherited, and loses to the ` +
      `component-level declaration. See [Theme](${themeLink}).`,
    mixin:
      `Bulma declares these variables on the ${element} itself, through a ` +
      `mixin its rule includes${declaredAgain}. A value set on an ancestor, ` +
      `on \`:root\` or through [Theme](${themeLink}) never reaches them, ` +
      `because the element's own declaration wins. Set them on the element: ` +
      `with the \`style\` prop, or ${mixinClassName}.`,
    global:
      `Bulma declares these variables globally rather than on ` +
      `\`${info.name}\`'s own element, so the defaults come from the theme. ` +
      `Override them anywhere above the component — on the element itself ` +
      `(via \`className\`/\`style\`) for a one-off, or on \`:root\` to retheme ` +
      `every instance. See [Theme](${themeLink}).`,
  };
  const markers = {
    root: '∗',
    compound: '†',
    element: '‡',
    global: '§',
    mixin: '¶',
  };
  const notes = {
    root:
      `∗ declared on the component's own element: override it there (or via ` +
      `\`className\`); a value set on an ancestor is only inherited and loses ` +
      `to that declaration.`,
    compound:
      `† declared on a compound selector (higher specificity than a single ` +
      `class): a lone \`className\` class loses — override with inline ` +
      `\`style\` or a selector exceeding that specificity (matching it ` +
      `wins only when loaded after the library styles).`,
    element:
      `‡ declared on a constituent element: values set via \`className\`, ` +
      `the \`style\` prop, or an ancestor are only inherited and lose — ` +
      `target the declaring element in your CSS.`,
    global:
      `§ declared globally, on \`:root\`, rather than on the element: set it ` +
      `on the element itself (via \`className\`/\`style\`) or on any ` +
      `ancestor, up to \`:root\` to retheme every instance.`,
    mixin:
      `¶ Bulma declares these on the element itself, through a mixin its ` +
      `rule includes${declaredAgain}. A value set on an ancestor, on ` +
      `\`:root\` or through Theme never reaches them, so set them on the ` +
      `element: with the \`style\` prop, or ${mixinClassName}.`,
  };
  return { leads, markers, notes };
}

/**
 * Which scope's lead a page uses when its rows differ: the first of these the
 * page has. Every other scope on it is marked. The order only chooses the
 * lead. Each scope has its own marker and note, and the renderer refuses a
 * scope missing any of its wording, so no order renders a row without it.
 */
export const CSS_VAR_SCOPE_ORDER = [
  'root',
  'global',
  'mixin',
  'element',
  'compound',
];

/**
 * The scopes among `scopes` that `text` (from `cssVarScopeText`) cannot
 * render in full, each with what it lacks: a lead, a marker, a note, or a
 * place in `order`. Empty when every one of them can lead a page or be
 * marked on one.
 */
export function cssVarScopeGaps(
  { leads, markers, notes },
  scopes,
  order = CSS_VAR_SCOPE_ORDER
) {
  const gaps = [];
  for (const scope of scopes) {
    const missing = [
      !Object.hasOwn(leads, scope) && 'lead',
      !Object.hasOwn(markers, scope) && 'marker',
      !Object.hasOwn(notes, scope) && 'note',
      !order.includes(scope) && 'place in the order',
    ].filter(Boolean);
    if (missing.length) gaps.push(`${scope} (no ${missing.join(', no ')})`);
  }
  return gaps;
}

/**
 * The CSS & Sass Variables region for a component's rows. One scope, one
 * lead: the page-wide sentence may only claim what holds for EVERY row. On a
 * mixed page the baseline scope's lead applies and the minority rows carry a
 * marker with their own note below the table, so one compound- or
 * element-scoped row does not rewrite the advice for every
 * className-overridable row on the page, and vice versa (#544 review).
 *
 * `order` is there so a test can render under a different one and show that
 * no order loses a row's wording. The generator always uses the default.
 */
export function renderCssVarRows(
  info,
  rows,
  themeLink,
  { order = CSS_VAR_SCOPE_ORDER } = {}
) {
  if (!rows.length) return null;
  const text = cssVarScopeText(info, rows, themeLink);
  const { leads, markers, notes } = text;
  const scopes = new Set(rows.map(r => r.scope));
  const gaps = cssVarScopeGaps(text, scopes, order);
  if (gaps.length) {
    throw new Error(
      `${info.name}: incomplete wording for CSS-variable scope(s): ` +
        `${gaps.join('; ')}. Give each scope a lead, a marker and a note in ` +
        `cssVarScopeText, and a place in CSS_VAR_SCOPE_ORDER ` +
        `(scripts/gen-api-docs.mjs).`
    );
  }
  const baseline = order.find(s => scopes.has(s));
  const marked = [...scopes].filter(s => s !== baseline);

  const cells = rows.map(r => {
    const cells = [
      `\`${r.cssVar}\``,
      r.sassVar ? `\`${r.sassVar}\`` : '—',
      `\`${r.value}\``,
    ];
    return r.scope === baseline
      ? cells
      : [`${cells[0]} ${markers[r.scope]}`, cells[1], cells[2]];
  });
  const table = renderTable(
    ['CSS Variable', 'Sass Variable', 'Default'],
    cells
  );
  const tail = marked.length
    ? `\n\n${marked.map(s => notes[s]).join('\n\n')}`
    : '';
  return `\n${leads[baseline]}\n\n${table}${tail}\n`;
}

async function renderCssVars(info, { relPath }) {
  const rows = await cssVarRows(info);
  const depth = relPath.split('/').length - 1;
  return renderCssVarRows(info, rows, `${'../'.repeat(depth)}helpers/theme.md`);
}

// ---------------------------------------------------------------------------

/**
 * Compute the fully-rendered page for one file, without writing it. Exported so
 * `check-conformance.mjs` can diff in memory for the staleness gate.
 */
export async function renderPage(file, src) {
  const relPath = relative(API_DIR, file).split('\\').join('/');
  const category = relPath.split('/')[0];
  const title = frontmatterTitle(src);
  if (!title) return { src, skipped: 'no frontmatter title' };
  if (GENERATED_EXEMPT.has(category) || GENERATED_EXEMPT.has(relPath)) {
    return { src, skipped: 'exempt' };
  }

  const regions = readRegions(src, `docs/docs/api/${relPath}`);
  if (!regions.size) return { src, skipped: 'no generated regions' };

  if (MANAGED_CATEGORIES.has(category) && !(title in SCSS_SOURCES)) {
    throw new Error(
      `${title} (docs/docs/api/${relPath}) has no SCSS_SOURCES entry. Add one in ` +
        `scripts/lib/api-sources.mjs — use \`[]\` if the component registers no ` +
        `CSS variables, so the omission is a decision rather than an oversight.`
    );
  }

  const depth = relPath.split('/').length - 1;
  const info = extractComponent(title, { depth });

  const bodies = {
    overview: renderOverview(info),
    import: renderImport(info),
    props: renderProps(info, { pages: await pagesByTitle(), relPath }),
    cssvars: await renderCssVars(info, { relPath }),
  };

  let out = src;

  // `cssvars` is the one region the generator may CREATE. Every other region
  // keeps the never-create rule, where a missing marker pair is the opt-out —
  // but this section is not opt-outable: `docs-sections` requires it whenever
  // the component has SCSS_SOURCES, so a page without it is simply broken.
  // Creating it means a Bulma upgrade that introduces variables is a `pnpm gen`
  // away, not six hand-edits plus a conformance failure telling you so.
  if (bodies.cssvars && !regions.has('cssvars')) {
    out = `${out.replace(/\s*$/, '')}\n\n---\n\n## CSS & Sass Variables\n\n${openMarker(
      'cssvars'
    )}\n${closeMarker('cssvars')}\n`;
    regions.set('cssvars', true);
  }

  for (const [id, body] of Object.entries(bodies)) {
    if (body == null || !regions.has(id)) continue;
    out = replaceRegion(out, id, body, `docs/docs/api/${relPath}`);
  }

  // docusaurus-plugin-llms takes each page's llms.txt description from the first
  // non-heading paragraph — which is a marker line once regions exist. Make the
  // description explicit so the LLM index stays clean.
  if (regions.has('overview') && bodies.overview) {
    out = upsertFrontmatter(
      out,
      'description',
      bodies.overview.trim(),
      'sidebar_label'
    );
  }

  const prettier = require('prettier');
  const config = await prettier.resolveConfig(file);
  out = await prettier.format(out, { ...config, filepath: file });
  return { src: out };
}

export async function main() {
  const files = await mdFiles(API_DIR);
  let changed = 0;
  let managed = 0;

  for (const file of files) {
    const src = await readFile(file, 'utf8');
    const { src: out, skipped } = await renderPage(file, src);
    if (skipped) continue;
    managed++;
    if (out !== src) {
      await writeFile(file, out);
      changed++;
      process.stdout.write(`✓ ${relative(REPO, file)}\n`);
    }
  }
  process.stdout.write(`${managed} generated page(s), ${changed} updated.\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(err => {
    console.error(err.message ?? err);
    process.exit(1);
  });
}
