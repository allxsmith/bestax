#!/usr/bin/env node
/**
 * Generate the component catalog reference for the bestax-custom-component skill.
 *
 * Source of truth: the hand-written API reference pages under
 * `docs/docs/api/<category>/**.md`. Each page's frontmatter `title:` is the real
 * exported name (e.g. `ConfigProvider`), and the first sentence of its
 * `## Overview` is a curated one-line purpose. Walking these pages keeps the
 * catalog names accurate and in sync with the documented public surface.
 *
 * (We deliberately re-parse the api md rather than reuse docs/build/llms.txt:
 * llms.txt is a gitignored build artifact that requires a full docs build,
 * whereas this must run from source with no build and commit a tracked file.)
 *
 * Completeness guard: after writing, cross-check `bulma-ui/src/index.ts` and FAIL
 * if any exported component lacks an API page — so a new component can't be
 * silently missing from the catalog (which would let an agent reinvent it).
 *
 * Output (committed, names + one-line purpose only — full props stay in the API
 * pages, loaded on demand):
 *   skills/bestax-custom-component/references/component-catalog.md
 *
 * The catalog is intentionally lean (~140 lines) so it can load into an agent's
 * context cheaply. Run via `npm run gen:catalog`; CI fails if the committed file
 * is stale (regenerate + `git diff --exit-code`). The output MUST be
 * deterministic across machines/Node versions, so sorting is by code point (not
 * locale collation) and parsing tolerates CRLF.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const API_DIR = join(REPO, 'docs', 'docs', 'api');
const INDEX_TS = join(REPO, 'bulma-ui', 'src', 'index.ts');
const OUT = join(
  REPO,
  'skills',
  'bestax-custom-component',
  'references',
  'component-catalog.md'
);
const DOCS_BASE = 'https://bestax.io/docs/api';
const MAX_PURPOSE = 160;

// Preferred display order + human labels for the category dirs under
// docs/docs/api. Categories NOT listed here are still included (appended,
// alphabetically, with a title-cased label) so a new api category is never
// silently dropped.
const CATEGORY_ORDER = [
  ['elements', 'Elements'],
  ['components', 'Components'],
  ['form', 'Form'],
  ['columns', 'Columns'],
  ['grid', 'Grid'],
  ['layout', 'Layout'],
  ['helpers', 'Helpers'],
];

// Exported names that intentionally have NO standalone API page (they're
// documented on a parent page). A NEW component missing its page will NOT be
// here, so it gets flagged by the completeness guard. (`*Base` escape-hatch
// variants are excluded by rule, not listed here.)
const UNDOCUMENTED_EXPORTS = new Set([
  'Tbody',
  'Td',
  'Tfoot',
  'Th',
  'Thead',
  'Tr', // documented on the Table page
]);

// Deterministic, locale-independent comparator (code-point order). localeCompare
// varies with the runtime's ICU version and would make CI's regenerate-and-diff
// check flake across Node versions.
const byCodePoint = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

async function subdirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter(e => e.isDirectory()).map(e => e.name);
}

async function mdFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await mdFiles(full)));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

function frontmatterTitle(src) {
  // Tolerate CRLF: match up to the closing `---` on its own line.
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const t = m[1].match(/^title:[ \t]*(.+?)[ \t]*$/m);
  return t ? t[1].replace(/^['"]|['"]$/g, '') : null;
}

// Drop a trailing unbalanced inline-code backtick left by truncation.
function balanceBackticks(s) {
  if ((s.match(/`/g) || []).length % 2 === 0) return s;
  return s.slice(0, s.lastIndexOf('`')).trimEnd();
}

// Shorten a long purpose to the last natural boundary within the limit: prefer
// the last sentence/clause punctuation, fall back to a word boundary, then
// repair any split inline-code span and append an ellipsis.
function clip(s) {
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

function overviewSentence(src) {
  // First prose line after the `## Overview` (or `### Overview`) heading —
  // skip admonitions / HTML / import lines that aren't a description.
  const after = src.split(/^#{2,3}[ \t]+Overview[ \t]*$/m)[1];
  if (!after) return '';
  let line = '';
  for (const raw of after.split(/\r?\n/)) {
    const t = raw.trim();
    if (!t) continue;
    if (/^(:::|<|import\b|#|!\[|[-*|>])/.test(t)) continue; // not a prose sentence
    line = t;
    break;
  }
  if (!line) return '';
  let s = line.replace(/\s+/g, ' ').trim();
  // First sentence: a period ending a word of >1 char (skips "e.g." / "i.e.").
  const sentence = s.match(/^.*?[A-Za-z0-9)"'`][.](?=\s)/);
  if (sentence && sentence[0].length >= 40) s = sentence[0];
  return clip(s);
}

// Parse the public barrel for exported component names (Uppercase-initial value
// exports). Used only by the completeness guard.
function parseExportedComponents(src) {
  const out = [];
  for (const line of src.split(/\r?\n/)) {
    let m = line.match(/^export \* from '\.\/([^/]+)\/([^'/]+)'/);
    if (m) {
      out.push({ name: m[2], cat: m[1] });
      continue;
    }
    // `export { A, B } from './cat/Mod'` — value exports only (not `export type`).
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

async function main() {
  // Discover category dirs; order the known ones first, append any unknown.
  const present = new Set(await subdirs(API_DIR));
  const known = CATEGORY_ORDER.filter(([dir]) => present.has(dir));
  const knownDirs = new Set(known.map(([dir]) => dir));
  const extra = [...present]
    .filter(dir => !knownDirs.has(dir))
    .sort(byCodePoint)
    .map(dir => [dir, dir.charAt(0).toUpperCase() + dir.slice(1)]);
  const categories = [...known, ...extra];

  const sections = [];
  const documentedByCat = new Map(); // cat -> Set of page basenames (lowercased)
  let total = 0;

  for (const [dir, label] of categories) {
    const files = (await mdFiles(join(API_DIR, dir))).sort(byCodePoint);
    const pages = new Set();
    const rows = [];
    for (const file of files) {
      pages.add(basename(file, '.md').toLowerCase());
      const src = await readFile(file, 'utf8');
      const title = frontmatterTitle(src);
      if (!title) continue;
      const slug = relative(API_DIR, file)
        .replace(/\.md$/, '')
        .split('\\')
        .join('/');
      rows.push({ title, purpose: overviewSentence(src), slug });
    }
    documentedByCat.set(dir, pages);
    rows.sort((a, b) => byCodePoint(a.title, b.title));
    if (!rows.length) continue;
    total += rows.length;
    const lines = rows.map(
      r =>
        `- [${r.title}](${DOCS_BASE}/${r.slug})` +
        (r.purpose ? ` — ${r.purpose}` : '')
    );
    sections.push(`## ${label}\n\n${lines.join('\n')}`);
  }

  const header = `<!-- GENERATED by scripts/gen-component-catalog.mjs — do not edit by hand. -->
<!-- Regenerate with \`npm run gen:catalog\`. Source: docs/docs/api/**. -->

# Component catalog

Every **documented** component of \`@allxsmith/bestax-bulma\`, so you **don't
reinvent one that already exists**. Import everything from the package root
(\`@allxsmith/bestax-bulma\`). Scan this list first; if a component fits, use it
instead of hand-writing markup.

- **Full props are not listed here** (that would be too large to keep in context).
  Follow a component's link for its complete prop table, or see the per-skill
  references. Top-level components accept the shared Bulma **helper props**
  (\`m\`/\`p\` spacing, \`textColor\`/\`bgColor\`, \`textAlign\`, \`display\`, flex, …) —
  documented once in \`references/api.md\` — with rare exceptions (\`Skeleton\`).
- **Compound components** expose sub-parts via dot access (e.g. \`Card.Header\`,
  \`Navbar.Item\`, \`Tabs.Tab\`, \`Hero.Body\`, \`Columns.Column\`, \`Table.Tr\`); see the
  component's linked page for the full set. Sub-parts do **not** all take helper
  props: the \`Table.*\`, \`Menu.*\`, and \`Hero.*\` families do (most \`Navbar.*\`
  too), but \`Card.*\`, \`Modal.*\`, \`Tabs.*\`, and \`Message.*\` sub-parts take only
  \`className\` + HTML attributes — put helper props on the parent or on an
  element inside (\`Span\`, \`Paragraph\`, …) instead.
- Raw \`*Base\` form exports (\`InputBase\`, \`SelectBase\`, \`TextAreaBase\`, …) are
  escape-hatch variants of the convenience wrappers above them; see the Form docs.

${total} documented components. Generated from the API docs — every exported
component is guaranteed to appear (the generator fails if one lacks an API page).

${sections.join('\n\n')}
`;

  await writeFile(OUT, header);
  process.stdout.write(`Wrote ${relative(REPO, OUT)} (${total} components)\n`);

  // Completeness guard: every exported component must have an API page.
  const exports = parseExportedComponents(await readFile(INDEX_TS, 'utf8'));
  const missing = exports
    .filter(
      e =>
        /^[A-Z]/.test(e.name) && // components are PascalCase (skip hooks/utils)
        !e.name.endsWith('Base') && // raw escape-hatch variants: documented w/ wrapper
        !UNDOCUMENTED_EXPORTS.has(e.name) &&
        !documentedByCat.get(e.cat)?.has(e.name.toLowerCase())
    )
    .map(e => `${e.cat}/${e.name}`)
    .sort(byCodePoint);

  if (missing.length) {
    console.error(
      `\nERROR: ${missing.length} exported component(s) have no API page under docs/docs/api/ ` +
        `and are missing from the catalog:\n  ` +
        missing.join('\n  ') +
        `\n\nAdd an API page (docs/docs/api/<category>/<name>.md), or if the export ` +
        `is intentionally undocumented, add it to UNDOCUMENTED_EXPORTS in ` +
        `scripts/gen-component-catalog.mjs.\n`
    );
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
