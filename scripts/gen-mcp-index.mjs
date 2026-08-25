#!/usr/bin/env node
/**
 * Generate the data index the bestax MCP server serves.
 *
 * Same sources as the API reference, read the same way — this generator adds no
 * new extraction, it re-renders what `gen-api-docs.mjs` already derives into a
 * shape an MCP client can query:
 *
 *   props / types / defaults   props-extract.mjs, in `markdown: false` mode
 *   CSS + Sass variables       scss-vars.mjs, over the SCSS_SOURCES map
 *   usage examples             the hand-written ```tsx live blocks under ## Usage
 *   accessibility / related    the hand-written sections of the same page
 *   skills                     the skills/ directory, read (never listed)
 *
 * Output, all committed so the diff is reviewable and CI can gate staleness:
 *
 *   bestax-mcp/data/catalog.json          every component, one line each
 *   bestax-mcp/data/components/<Name>.json  one per documented component
 *   bestax-mcp/data/skills.json           skill manifest (bodies are synced at
 *                                         build time, see bestax-mcp/scripts)
 *
 * Split three ways on purpose: a stdio server pays the parse cost on every
 * client launch, so startup reads only the catalog and pulls a component file
 * when a tool actually asks for one.
 *
 * Design contract, inherited from gen-component-catalog.mjs: plain node, no
 * build step, deterministic output (code-point sort — never localeCompare,
 * whose ICU differences would flake the CI diff), CRLF tolerated. Like
 * gen-api-docs.mjs it READS node_modules/bulma for the stock SCSS, so
 * `pnpm install` must have run.
 *
 * Completeness guard: cross-checks `bulma-ui/src/index.ts` and FAILS if an
 * exported component has no entry — a component an agent cannot look up is a
 * component it will reinvent.
 *
 * Regenerate with `pnpm gen:mcp` (or `pnpm gen`, which runs all three).
 */
import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, dirname, basename, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

import { sectionSpans, sectionBody, firstSentence } from './lib/api-page.mjs';
import { readSkillNames } from './lib/skills.mjs';
import { extractComponent, varRootCandidates } from './lib/props-extract.mjs';
import { componentVars } from './lib/scss-vars.mjs';
import {
  SCSS_SOURCES,
  IMPORT_COMPANIONS,
  GENERATED_EXEMPT,
} from './lib/api-sources.mjs';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const API_DIR = join(REPO, 'docs', 'docs', 'api');
const SKILLS_DIR = join(REPO, 'skills');
const INDEX_TS = join(REPO, 'bulma-ui', 'src', 'index.ts');
const OUT_DIR = join(REPO, 'bestax-mcp', 'data');

const PACKAGE = '@allxsmith/bestax-bulma';
const DOCS_BASE = 'https://bestax.io/docs';

/**
 * Bumped when the shape below changes incompatibly. The server refuses an index
 * it does not understand rather than silently serving half a field — the two
 * ship in the same tarball, so a mismatch means a broken build, not a user
 * running something old.
 */
const SCHEMA_VERSION = 1;

// Catalog one-liners are for scanning, not reading; the full summary is one
// tool call away on the component's own file. Same budget the skill catalog uses.
const MAX_PURPOSE = 160;

// Display order + human labels for the category dirs, mirroring
// gen-component-catalog.mjs. Categories NOT listed are appended alphabetically
// with a title-cased label, so a new api category is never silently dropped.
const CATEGORY_ORDER = [
  ['elements', 'Elements'],
  ['components', 'Components'],
  ['form', 'Form'],
  ['columns', 'Columns'],
  ['grid', 'Grid'],
  ['layout', 'Layout'],
  ['helpers', 'Helpers'],
];

// Exported names that intentionally have NO standalone API page (documented on
// a parent page). A NEW component missing its page will not be here, so the
// completeness guard flags it.
const UNDOCUMENTED_EXPORTS = new Set([
  'Tbody',
  'Td',
  'Tfoot',
  'Th',
  'Thead',
  'Tr', // documented on the Table page
]);

// Deterministic, locale-independent comparator. localeCompare varies with the
// runtime's ICU version and would make CI's regenerate-and-diff flake.
const byCodePoint = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const collapse = s =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim();

async function subdirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort(byCodePoint);
}

async function mdFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await mdFiles(full)));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out.sort(byCodePoint);
}

function frontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):[ \t]*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return out;
}

/** Body of the `## Overview` section, first sentence, clipped for the catalog. */
function purposeOf(fm, sections, lines) {
  const explicit = collapse(fm.description);
  const overview = sections.find(s => /^Overview$/i.test(s.heading));
  const text =
    explicit ||
    collapse(
      (overview ? sectionBody(lines, overview) : '')
        .split(/\r?\n/)
        // Skip admonitions, JSX, imports, headings, images, lists and quotes —
        // the same filter gen-component-catalog.mjs applies.
        .find(l => l.trim() && !/^(:::|<|import\b|#|!\[|[-*|>])/.test(l.trim()))
    );
  if (!text) return '';
  const sentence = firstSentence(text);
  if (sentence.length <= MAX_PURPOSE) return sentence;
  const cut = sentence.slice(0, MAX_PURPOSE);
  const at = Math.max(cut.lastIndexOf(' '), MAX_PURPOSE - 40);
  return `${cut
    .slice(0, at)
    .replace(/[,;:([]$/, '')
    .trim()}…`;
}

/**
 * The hand-written ```tsx live blocks under `## Usage`, each tagged with the
 * `###` subheading it sits under.
 *
 * These are the library's only curated examples — 897 of them, every one
 * executed by react-live on the docs site, so they are known to compile against
 * the current API. Storybook has more, but nothing extracts them yet.
 */
function usageExamples(lines, section) {
  if (!section) return [];
  const out = [];
  let heading = null;
  let fence = null;
  let buf = [];
  for (const raw of lines.slice(section.start + 1, section.end)) {
    const open = raw.match(/^(\s*)(`{3,}|~{3,})\s*(.*)$/);
    if (fence) {
      // Only a fence of the same kind and at least the same length closes.
      if (open && open[2][0] === fence.char && open[2].length >= fence.len) {
        out.push({ title: heading ?? 'Usage', code: buf.join('\n') });
        fence = null;
        buf = [];
        continue;
      }
      buf.push(raw);
      continue;
    }
    if (open) {
      const lang = open[3].trim().split(/\s+/)[0];
      // `tsx live`, `tsx`, `jsx` — but not `bash`/`scss` install snippets.
      if (/^(tsx|jsx)$/.test(lang)) {
        fence = { char: open[2][0], len: open[2].length };
        buf = [];
      }
      continue;
    }
    const h = raw.match(/^###[ \t]+(.+?)[ \t]*$/);
    if (h) heading = h[1];
  }
  return out;
}

/** Component names linked from `## Related Components`, resolved via the page index. */
function relatedComponents(lines, section, pageByPath, relPath) {
  if (!section) return [];
  const dir = relPath.split('/').slice(0, -1);
  const names = new Set();
  for (const m of sectionBody(lines, section).matchAll(
    /\[([^\]]+)\]\(([^)]+?\.md)\)/g
  )) {
    // Resolve the relative target against this page's directory, so the name
    // comes from the target page's frontmatter rather than the link text (which
    // is sometimes pluralised or lower-cased).
    const parts = [...dir];
    for (const seg of m[2].split('/')) {
      if (seg === '.' || seg === '') continue;
      if (seg === '..') parts.pop();
      else parts.push(seg);
    }
    const title = pageByPath.get(parts.join('/'));
    const name = title ?? m[1].replace(/[`*]/g, '').trim();
    if (name) names.add(name);
  }
  return [...names].sort(byCodePoint);
}

/** The Storybook deep link a page offers under `## Additional Resources`. */
function storybookLink(lines, section) {
  if (!section) return null;
  const m = sectionBody(lines, section).match(
    /https:\/\/bestax\.io\/storybook\/\?path=[^\s)]+/
  );
  return m ? m[0] : null;
}

let bulmaRoot = null;
function bulmaSassPath(rel) {
  if (!bulmaRoot) {
    try {
      bulmaRoot = dirname(require.resolve('bulma/package.json'));
    } catch {
      throw new Error(
        'Cannot resolve the `bulma` package. CSS/Sass variables are parsed from ' +
          'its SCSS source, so run `pnpm install --frozen-lockfile` before ' +
          '`pnpm gen:mcp`.'
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

/**
 * CSS variable triples for a component. Deliberately the same walk and the same
 * first-source-wins dedupe as `renderCssVars` in gen-api-docs.mjs — a component
 * can legitimately draw variables from more than one partial.
 */
async function cssVarsFor(info) {
  const sources = SCSS_SOURCES[info.name];
  if (!sources?.length) return [];
  // No per-entry override, same as gen-api-docs: gen-api-sources emits
  // only { pkg, path }, and a hand-added `root:` field is erased on the
  // next regenerate — honoring it here while the docs generator ignored it
  // would let the two surfaces ship contradicting tables (#544 review; the
  // old line also conflated a root CLASS with the var PREFIX, which
  // diverge exactly where VAR_PREFIX_OVERRIDES applies). Trying every
  // candidate from `varRootCandidates` (not just the primary root/prefix)
  // keeps this in step with gen-api-docs.mjs's renderCssVars for a
  // component that owns more than one of its own repo partials (#543).
  const candidates = varRootCandidates(
    info.name,
    info.rootClass,
    info.varPrefix
  );
  if (!candidates.some(c => c.root || c.prefix)) return [];
  const rows = [];
  const seen = new Set();
  for (const source of sources) {
    const file =
      source.pkg === 'bulma'
        ? bulmaSassPath(source.path)
        : join(REPO, source.path);
    const src = await readFile(file, 'utf8');
    for (const { root, prefix } of candidates) {
      if (!root && !prefix) continue;
      // An EXTRA root (differing from the primary rootClass) is a constituent
      // element the component owns — the pickers' calendar/wheel helpers on
      // `.dateinput`/`.timeinput`/`.datetimeinput`, not the primary `.input`.
      // componentVars scores them 'root' inside their own partial, but 'root'
      // advice names `.input`/`className` and loses (separate, portalable
      // element). Force 'element' so the MCP scope agrees with the docs page
      // (gen-api-docs.mjs renderCssVars), which does the same (#543).
      const isExtra = root !== info.rootClass;
      for (const row of componentVars(src, root, prefix)) {
        if (seen.has(row.cssVar)) continue;
        seen.add(row.cssVar);
        rows.push({
          css: row.cssVar,
          sass: row.sassVar || null,
          default: row.value,
          // The scope survives verbatim: collapsing 'compound' into
          // 'component' made the server give the className override advice
          // that silently loses at 0-2-0 — the exact #464 failure, on the
          // MCP surface, while the docs page said the opposite (#544 review).
          scope: isExtra ? 'element' : row.scope,
        });
      }
    }
  }
  return rows;
}

/** Strip the frontmatter block, leaving the page body. */
function withoutFrontmatter(src) {
  return src.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trimStart();
}

function propRow(r) {
  return {
    name: r.name,
    type: r.type,
    default: r.default ?? null,
    description: collapse(r.description),
    required: false,
    inherited: Boolean(r.inherited),
    deprecated: Boolean(r.deprecated),
    ...(r.deprecationNote ? { deprecationNote: r.deprecationNote } : {}),
    ...(r.valuesRef ? { valuesRef: r.valuesRef } : {}),
  };
}

// ---------------------------------------------------------------------------

/**
 * The skills roster, READ from the directory — never a hardcoded list. The
 * predicate (a directory holding a SKILL.md) lives in scripts/lib/skills.mjs,
 * shared with both sync scripts and check-conformance.
 */
async function readSkills() {
  const out = [];
  for (const name of await readSkillNames(SKILLS_DIR)) {
    const skillFile = join(SKILLS_DIR, name, 'SKILL.md');
    const src = await readFile(skillFile, 'utf8');
    const fm = frontmatter(src);
    const listing = async sub => {
      const dir = join(SKILLS_DIR, name, sub);
      if (!existsSync(dir)) return [];
      const entries = await readdir(dir, { withFileTypes: true });
      const files = [];
      for (const e of entries.filter(x => x.isFile())) {
        const body = await readFile(join(dir, e.name), 'utf8');
        files.push({
          id: basename(e.name, extname(e.name)),
          file: `${sub}/${e.name}`,
          bytes: Buffer.byteLength(body),
        });
      }
      return files.sort((a, b) => byCodePoint(a.id, b.id));
    };
    out.push({
      name: fm.name || name,
      // The frontmatter description is already written as a trigger surface —
      // keyword-dense, ending in a "Use when…" clause. It is exactly what an
      // MCP tool/prompt description needs, so it ships verbatim.
      description: collapse(fm.description),
      // `bestax-theming` -> `theming`. The prompt name an MCP client shows.
      promptName: (fm.name || name).replace(/^bestax-/, ''),
      dir: name,
      references: await listing('references'),
      examples: await listing('examples'),
    });
  }
  return out.sort((a, b) => byCodePoint(a.name, b.name));
}

function parseExportedComponents(src) {
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
 * Serialise through prettier, exactly as gen-api-docs.mjs does for markdown.
 *
 * `JSON.stringify(x, null, 2)` is NOT prettier-stable — prettier collapses a
 * short array onto one line and stringify never does. Committing raw stringify
 * output means the first person to run a formatter over the repo (or an editor
 * with format-on-save) rewrites 68 files and breaks `gen:mcp:check` until
 * someone works out why. Formatting here makes the committed output a fixpoint.
 */
async function json(value) {
  const prettier = require('prettier');
  const config = await prettier.resolveConfig(OUT_DIR);
  return prettier.format(JSON.stringify(value), {
    ...config,
    parser: 'json',
  });
}

export async function build() {
  const present = new Set(await subdirs(API_DIR));
  const known = CATEGORY_ORDER.filter(([dir]) => present.has(dir));
  const knownDirs = new Set(known.map(([dir]) => dir));
  const categories = [
    ...known,
    ...[...present]
      .filter(dir => !knownDirs.has(dir))
      .sort(byCodePoint)
      .map(dir => [dir, dir.charAt(0).toUpperCase() + dir.slice(1)]),
  ];

  // Page path -> frontmatter title, for resolving Related Components links.
  const pageByPath = new Map();
  for (const file of await mdFiles(API_DIR)) {
    const title = frontmatter(await readFile(file, 'utf8')).title;
    if (title) {
      pageByPath.set(relative(API_DIR, file).split('\\').join('/'), title);
    }
  }

  const catalogEntries = [];
  const components = new Map();
  const cssVarIndex = {};
  const categoryList = [];
  // category -> page basenames, for the completeness guard. Deliberately keyed
  // on the FILE rather than the frontmatter title, matching
  // gen-component-catalog.mjs: `export * from './helpers/Config'` names a
  // module, and the page that documents it is `config.md` titled
  // `ConfigProvider`. Matching on title would flag that as missing.
  const pagesByCat = new Map();

  for (const [dir, label] of categories) {
    const members = [];
    for (const file of await mdFiles(join(API_DIR, dir))) {
      const src = await readFile(file, 'utf8');
      const relPath = relative(API_DIR, file).split('\\').join('/');
      const fm = frontmatter(src);
      if (!fm.title) continue;
      const name = fm.title;
      if (!pagesByCat.has(dir)) pagesByCat.set(dir, new Set());
      pagesByCat.get(dir).add(basename(file, '.md').toLowerCase());

      const { lines, sections } = sectionSpans(src);
      const find = re => sections.find(s => re.test(s.heading));
      const purpose = purposeOf(fm, sections, lines);
      const slug = relPath.replace(/\.md$/, '');
      const docsUrl = `${DOCS_BASE}/api/${slug}`;

      // `helpers/` documents hooks and utilities: four of its six pages use
      // `## API` with a signature block and have no props interface at all.
      // Running the props extractor over them yields nothing, so they ship as
      // prose instead — which is what `get_helper_props` wants anyway.
      const isHelper =
        GENERATED_EXEMPT.has(dir) || GENERATED_EXEMPT.has(relPath);

      const common = {
        name,
        kind: isHelper ? 'helper' : 'component',
        category: dir,
        slug,
        docsUrl,
        examples: usageExamples(lines, find(/^Usage$/i)),
        accessibility: (() => {
          const s = find(/^Accessibility$/i);
          return s ? sectionBody(lines, s) : null;
        })(),
        related: relatedComponents(
          lines,
          find(/^Related Components$/i),
          pageByPath,
          relPath
        ),
        storybook: storybookLink(lines, find(/^Additional Resources$/i)),
      };

      let record;
      if (isHelper) {
        record = {
          ...common,
          summary: purpose,
          import: `import { ${name} } from '${PACKAGE}';`,
          // The whole page. These are reference prose, not tables, and an agent
          // asking "how do I do spacing without inline styles" needs all of it.
          doc: withoutFrontmatter(src).trimEnd(),
          parts: [],
          cssVars: [],
        };
      } else {
        const info = extractComponent(name, { markdown: false });
        const cssVars = await cssVarsFor(info);
        for (const v of cssVars) cssVarIndex[v.css] = name;
        record = {
          ...common,
          summary: collapse(info.tsdoc),
          import: `import { ${(IMPORT_COMPANIONS[name] ?? [name]).join(
            ', '
          )} } from '${PACKAGE}';`,
          sourceFile: relative(REPO, info.sourceFile).split('\\').join('/'),
          rootClass: info.rootClass ?? null,
          parts: info.tables.map(t => ({
            path: t.path,
            summary: collapse(t.summary),
            // A sub-component re-exported standalone has its own page; naming
            // it lets the server point there instead of restating the table.
            component: t.component ?? null,
            // A sub with an inline DOM props type rather than a named
            // `*Props` interface (`Navbar.Divider`) has no table at all — it
            // still belongs in the list, with an empty one.
            props: (t.rows ?? []).map(propRow),
            extraProps: (t.extraProps ?? []).map(propRow),
            catchAll: t.catchAll?.text ?? null,
            types: (t.types ?? []).map(a => ({
              name: a.name,
              expansion: a.expansion,
              summary: collapse(a.summary),
            })),
          })),
          cssVars,
        };
      }

      components.set(name, record);
      members.push(name);
      catalogEntries.push({
        name,
        kind: record.kind,
        category: dir,
        purpose,
        slug,
        import: record.import,
        compound: record.parts.length > 1,
        propCount: record.parts.reduce((n, p) => n + p.props.length, 0),
        exampleCount: record.examples.length,
      });
    }
    if (members.length) {
      categoryList.push({
        id: dir,
        label,
        components: members.sort(byCodePoint),
      });
    }
  }

  const version = JSON.parse(
    await readFile(join(REPO, 'bulma-ui', 'package.json'), 'utf8')
  ).version;

  const catalog = {
    schemaVersion: SCHEMA_VERSION,
    generatedFrom: { package: PACKAGE, version },
    docsBase: DOCS_BASE,
    categories: categoryList,
    components: catalogEntries.sort((a, b) => byCodePoint(a.name, b.name)),
    cssVarIndex: Object.fromEntries(
      Object.entries(cssVarIndex).sort((a, b) => byCodePoint(a[0], b[0]))
    ),
  };

  return {
    catalog,
    components,
    pagesByCat,
    skills: { skills: await readSkills() },
  };
}

export async function main() {
  const { catalog, components, pagesByCat, skills } = await build();

  // Rewrite the component directory rather than overwriting in place: a
  // component that was removed must lose its file, or the staleness gate
  // passes while the server still answers for something that no longer exists.
  const componentDir = join(OUT_DIR, 'components');
  await rm(componentDir, { recursive: true, force: true });
  await mkdir(componentDir, { recursive: true });

  await writeFile(join(OUT_DIR, 'catalog.json'), await json(catalog));
  await writeFile(join(OUT_DIR, 'skills.json'), await json(skills));
  for (const [name, record] of [...components].sort((a, b) =>
    byCodePoint(a[0], b[0])
  )) {
    await writeFile(join(componentDir, `${name}.json`), await json(record));
  }

  // Completeness guard. Runs after writing so the failure names what to fix
  // rather than leaving a half-written index behind.
  const exports = parseExportedComponents(await readFile(INDEX_TS, 'utf8'));
  const missing = exports
    .filter(
      e =>
        /^[A-Z]/.test(e.name) && // components are PascalCase (skip hooks/utils)
        !e.name.endsWith('Base') && // escape-hatch variants: documented w/ wrapper
        !UNDOCUMENTED_EXPORTS.has(e.name) &&
        !pagesByCat.get(e.cat)?.has(e.name.toLowerCase())
    )
    .map(e => `${e.cat}/${e.name}`)
    .sort(byCodePoint);

  if (missing.length) {
    console.error(
      `\nERROR: ${missing.length} exported component(s) are missing from the MCP ` +
        `index:\n  ${missing.join('\n  ')}\n\n` +
        `Add an API page (docs/docs/api/<category>/<name>.md) whose frontmatter ` +
        `title: matches the export, or add the name to UNDOCUMENTED_EXPORTS in ` +
        `scripts/gen-mcp-index.mjs if it is documented on a parent page.\n`
    );
    process.exit(1);
  }

  process.stdout.write(
    `Wrote ${relative(REPO, OUT_DIR)} (${catalog.components.length} components, ` +
      `${skills.skills.length} skills, bestax-bulma ${catalog.generatedFrom.version})\n`
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(err => {
    console.error(err.message ?? err);
    process.exit(1);
  });
}
