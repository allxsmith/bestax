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

function renderProps(info) {
  const blocks = [];
  const [root, ...subs] = info.tables;
  if (!root) return null;

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
        '—',
        extra.description,
      ]);
    }
    if (t.catchAll) {
      rows.push([
        '`...`',
        t.catchAll,
        '—',
        `See [Helper Props](${t.helpersLink})`,
      ]);
    }
    return renderTable(['Prop', 'Type', 'Default', 'Description'], rows);
  };

  blocks.push(table(root));

  if (subs.length) {
    blocks.push(
      `**Subcomponents:** ${subs.map(s => `\`${s.path}\``).join(', ')}.`
    );
    for (const sub of subs) {
      blocks.push(`### ${sub.path}`, table(sub));
    }
  }
  return `\n${blocks.join('\n\n')}\n`;
}

async function renderCssVars(info, { relPath }) {
  const sources = SCSS_SOURCES[info.name];
  if (!sources || !sources.length) return null;

  const rows = [];
  for (const source of sources) {
    const file =
      source.pkg === 'bulma'
        ? bulmaSassPath(source.path)
        : join(REPO, source.path);
    const src = await readFile(file, 'utf8');
    const root = source.root ?? info.rootClass;
    if (!root) {
      throw new Error(
        `${info.name}: cannot determine the root class for ${source.path}. Add a ` +
          `\`root\` to its SCSS_SOURCES entry in scripts/lib/api-sources.mjs.`
      );
    }
    for (const row of componentVars(src, root)) {
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
  const lead =
    `\`${info.name}\` registers these variables on its own ` +
    `\`.${info.rootClass}\` element. Override them there (or via \`className\`) — ` +
    `a value set on an ancestor is only inherited, and loses to the ` +
    `component-level declaration. See [Theme](${themeLink}).`;

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
    props: renderProps(info),
    cssvars: await renderCssVars(info, { relPath }),
  };

  let out = src;
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
