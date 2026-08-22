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
import { readFile, writeFile, readdir } from 'node:fs/promises';
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
} from './lib/api-page.mjs';
import { extractComponent } from './lib/props-extract.mjs';
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

const byCodePoint = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

async function mdFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await mdFiles(full)));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out.sort(byCodePoint);
}

function frontmatterTitle(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const t = m[1].match(/^title:[ \t]*(.+?)[ \t]*$/m);
  return t ? t[1].replace(/^['"]|['"]$/g, '') : null;
}

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

async function renderCssVars(info, { relPath }) {
  const sources = SCSS_SOURCES[info.name];
  if (!sources || !sources.length) return null;

  const rows = [];
  // A component can legitimately draw variables from more than one partial:
  // Bulma's form/shared.scss registers the `--bulma-input-*` set on a selector
  // list covering .control/.input/.textarea/.select, so those really do apply
  // to all four. Dedupe across files by CSS variable name, first source wins —
  // the same rule componentVars() applies within a file.
  const seen = new Set();
  let onRoot = false;
  for (const source of sources) {
    const file =
      source.pkg === 'bulma'
        ? bulmaSassPath(source.path)
        : join(REPO, source.path);
    const src = await readFile(file, 'utf8');
    // No per-entry override: gen-api-sources emits only { pkg, path }, and a
    // hand-added field inside the generated markers is erased on the next
    // regenerate. The real escape hatch is ROOT_CLASS_OVERRIDES /
    // VAR_PREFIX_OVERRIDES in props-extract.mjs, which survive regeneration.
    // This file once read a `source.root ?? …` here, and its own error
    // message advised adding the field the generator would delete (#464).
    const root = info.rootClass;
    const prefix = info.varPrefix;
    if (!root && !prefix) {
      throw new Error(
        `${info.name}: cannot determine the root class for ${source.path}. ` +
          `Add the component to ROOT_CLASS_OVERRIDES in ` +
          `scripts/lib/props-extract.mjs.`
      );
    }
    for (const row of componentVars(src, root, prefix)) {
      if (seen.has(row.cssVar)) continue;
      seen.add(row.cssVar);
      if (row.scope === 'root') onRoot = true;
      rows.push([
        `\`${row.cssVar}\``,
        row.sassVar ? `\`${row.sassVar}\`` : '—',
        `\`${row.value}\``,
      ]);
    }
  }
  if (!rows.length) return null;

  const depth = relPath.split('/').length - 1;
  const themeLink = `${'../'.repeat(depth)}helpers/theme.md`;
  // Where Bulma declares the defaults decides how to phrase this. Most
  // components register on their own selector; the semantic wrappers and
  // `Skeleton` get theirs from `:root` (or a mixin), and claiming otherwise
  // would send a reader looking for a declaration that is not there. Either way
  // the override advice is the same, because custom properties inherit.
  const target = info.rootClass ? `\`.${info.rootClass}\`` : 'its own';
  const lead = onRoot
    ? `\`${info.name}\` registers these variables on its own ` +
      `${target} element. Override them there (or via \`className\`) — ` +
      `a value set on an ancestor is only inherited, and loses to the ` +
      `component-level declaration. See [Theme](${themeLink}).`
    : `Bulma declares these variables globally rather than on ` +
      `\`${info.name}\`'s own element, so the defaults come from the theme. ` +
      `Override them anywhere above the component — on the element itself ` +
      `(via \`className\`/\`style\`) for a one-off, or on \`:root\` to retheme ` +
      `every instance. See [Theme](${themeLink}).`;

  return `\n${lead}\n\n${renderTable(['CSS Variable', 'Sass Variable', 'Default'], rows)}\n`;
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
