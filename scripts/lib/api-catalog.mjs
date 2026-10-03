/**
 * The API reference pages read as a catalog: which category directories
 * exist and in what order, which pages each one lists, whether every exported
 * component has one, and the pieces each page's one-line purpose is cut from.
 *
 * Two generators list every documented component, gen-component-catalog.mjs
 * (the skill's component-catalog.md) and gen-mcp-index.mjs (the MCP server's
 * catalog.json). Each used to carry its own copy of everything here, and the
 * copies had drifted on which pages count as documenting an export. A catalog
 * rule changes here or not at all.
 *
 * Output must be deterministic across machines and Node versions, so every
 * listing sorts by code point, never with localeCompare.
 */
import { readFile, readdir } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';

import { frontmatter } from './api-page.mjs';
import { byCodePoint } from './skills.mjs';

/**
 * Preferred display order and human labels for the category dirs under
 * docs/docs/api. Categories NOT listed here are still included (appended,
 * alphabetically, with a title-cased label) so a new api category is never
 * silently dropped.
 */
export const CATEGORY_ORDER = [
  ['elements', 'Elements'],
  ['components', 'Components'],
  ['form', 'Form'],
  ['columns', 'Columns'],
  ['grid', 'Grid'],
  ['layout', 'Layout'],
  ['helpers', 'Helpers'],
];

/**
 * Exported names that intentionally have NO standalone API page (they're
 * documented on a parent page). A NEW component missing its page will NOT be
 * here, so it gets flagged by the completeness guard. (`*Base` escape-hatch
 * variants are excluded by rule, not listed here.)
 */
export const UNDOCUMENTED_EXPORTS = new Set([
  'Tbody',
  'Td',
  'Tfoot',
  'Th',
  'Thead',
  'Tr', // documented on the Table page
]);

/**
 * Catalog one-liners are for scanning, not reading. The full summary is one
 * link or tool call away, so both catalogs clip to this budget.
 */
export const MAX_PURPOSE = 160;

/** The names of the directories directly inside `dir`, sorted. */
export async function subdirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort(byCodePoint);
}

/** Every file under `dir`, at any depth, whose name matches `pattern`, sorted. */
export async function mdFiles(dir, pattern = /\.md$/) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await mdFiles(full, pattern)));
    else if (pattern.test(entry.name)) out.push(full);
  }
  return out.sort(byCodePoint);
}

/**
 * The category dirs in `present` as [dir, label] pairs: the ones
 * CATEGORY_ORDER knows first, in its order, then the rest alphabetically with
 * a title-cased label.
 */
export function orderCategories(present) {
  const have = new Set(present);
  const known = CATEGORY_ORDER.filter(([dir]) => have.has(dir));
  const knownDirs = new Set(known.map(([dir]) => dir));
  const extra = [...have]
    .filter(dir => !knownDirs.has(dir))
    .sort(byCodePoint)
    .map(dir => [dir, dir.charAt(0).toUpperCase() + dir.slice(1)]);
  return [...known, ...extra];
}

/**
 * Every page a catalog lists, by category in display order:
 * [{ dir, label, pages: [{ file, relPath, slug, src, fm }] }], each category's
 * pages sorted by path. A page with no frontmatter `title:` is left out, and
 * missingApiPages reads this same list, so a page can never count as
 * documenting an export while the catalog drops it.
 */
export async function readApiPages(apiDir) {
  const categories = [];
  for (const [dir, label] of orderCategories(await subdirs(apiDir))) {
    const pages = [];
    for (const file of await mdFiles(join(apiDir, dir))) {
      const src = await readFile(file, 'utf8');
      const fm = frontmatter(src);
      if (!fm.title) continue;
      const relPath = relative(apiDir, file).split('\\').join('/');
      pages.push({
        file,
        relPath,
        slug: relPath.replace(/\.md$/, ''),
        src,
        fm,
      });
    }
    categories.push({ dir, label, pages });
  }
  return categories;
}

/**
 * The first line of `text` that reads as prose, trimmed, or ''. Admonitions,
 * JSX and HTML, imports, headings, images, lists, tables and quotes are not a
 * description, so they are skipped.
 */
export function firstProseLine(text) {
  for (const raw of String(text).split(/\r?\n/)) {
    const t = raw.trim();
    if (t && !/^(:::|<|import\b|#|!\[|[-*|>])/.test(t)) return t;
  }
  return '';
}

/** Drop a trailing unbalanced inline-code backtick left by truncation. */
function balanceBackticks(s) {
  if ((s.match(/`/g) || []).length % 2 === 0) return s;
  return s.slice(0, s.lastIndexOf('`')).trimEnd();
}

/**
 * The skill catalog's clip. Shorten `s` to the last natural boundary within
 * MAX_PURPOSE: prefer the last sentence or clause punctuation, fall back to a
 * word boundary, then repair any split inline-code span and append an
 * ellipsis.
 */
export function clipAtClause(s) {
  if (s.length <= MAX_PURPOSE) return s;
  let cut = s.slice(0, MAX_PURPOSE);
  const lastPunct = Math.max(
    cut.lastIndexOf('.'),
    cut.lastIndexOf(','),
    cut.lastIndexOf(';'),
    cut.lastIndexOf(':'),
    cut.lastIndexOf(')'),
    cut.lastIndexOf(']')
  );
  if (lastPunct >= 40) {
    cut = cut.slice(0, lastPunct + 1);
  } else {
    const sp = cut.lastIndexOf(' ');
    if (sp >= 40) cut = cut.slice(0, sp);
  }
  // Balance code spans, then drop a dangling opener or clause separator.
  cut = balanceBackticks(cut)
    .replace(/[ ([]+$/, '')
    .replace(/[,;:]$/, '');
  return cut + '…';
}

/**
 * The MCP catalog's clip. Shorten `s` at the last word boundary within
 * MAX_PURPOSE (no earlier than 40 characters before it), drop a dangling
 * opener or clause separator, and append an ellipsis.
 */
export function clipAtWord(s) {
  if (s.length <= MAX_PURPOSE) return s;
  const cut = s.slice(0, MAX_PURPOSE);
  const at = Math.max(cut.lastIndexOf(' '), MAX_PURPOSE - 40);
  return `${cut
    .slice(0, at)
    .replace(/[,;:([]$/, '')
    .trim()}…`;
}

/**
 * The barrel's exports as [{ name, cat }]: each `export * from './cat/Mod'`
 * as the module name, and each name in `export { A, B } from './cat/Mod'`
 * (value exports only, not `export type`).
 */
export function parseExportedComponents(src) {
  const out = [];
  for (const line of src.split(/\r?\n/)) {
    let m = line.match(/^export \* from '\.\/([^/]+)\/([^'/]+)'/);
    if (m) {
      out.push({ name: m[2], cat: m[1] });
      continue;
    }
    m = line.match(/^export \{ ([^}]+) \} from '\.\/([^/]+)\/([^'/]+)'/);
    if (m) {
      for (const raw of m[1].split(',')) {
        const name = raw
          .trim()
          .split(/\s+as\s+/)
          .pop();
        if (name) out.push({ name, cat: m[2] });
      }
    }
  }
  return out;
}

/**
 * The completeness guard: the components exported by the barrel source
 * `indexSrc` that no page in `categories` (from readApiPages) documents, as
 * sorted `category/Name` strings. Hooks and utilities (not PascalCase),
 * `*Base` escape hatches and UNDOCUMENTED_EXPORTS are exempt.
 *
 * Keyed on the page's FILE name rather than its title, because
 * `export * from './helpers/Config'` names a module, and the page that
 * documents it is `config.md` titled `ConfigProvider`. Matching on the title
 * would flag that as missing.
 */
export function missingApiPages(indexSrc, categories) {
  const pagesByCat = new Map(
    categories.map(({ dir, pages }) => [
      dir,
      new Set(pages.map(p => basename(p.file, '.md').toLowerCase())),
    ])
  );
  return parseExportedComponents(indexSrc)
    .filter(
      e =>
        /^[A-Z]/.test(e.name) &&
        !e.name.endsWith('Base') &&
        !UNDOCUMENTED_EXPORTS.has(e.name) &&
        !pagesByCat.get(e.cat)?.has(e.name.toLowerCase())
    )
    .map(e => `${e.cat}/${e.name}`)
    .sort(byCodePoint);
}

/** What a generator prints when `missing` is not empty. `from` names its output. */
export function missingApiPagesMessage(missing, from) {
  return (
    `\nERROR: ${missing.length} exported component(s) have no API page ` +
    `under docs/docs/api/ and are missing from ${from}:\n  ` +
    missing.join('\n  ') +
    `\n\nA page counts when it sits under docs/docs/api/<category>/, its ` +
    `file name is the export's name in any letter case (button.md for ` +
    `Button), and it has a frontmatter title:. Add that page, or, if a ` +
    `parent page documents the export, add the name to UNDOCUMENTED_EXPORTS ` +
    `in scripts/lib/api-catalog.mjs.\n`
  );
}
