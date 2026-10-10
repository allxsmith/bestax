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
 *   bestax-mcp/data/bulma-classes.json    the bestax-migrate bulma-classes
 *                                         table, for lookup_bulma_classes
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
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, dirname, extname, posix } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

import {
  frontmatter,
  sectionSpans,
  sectionBody,
  firstSentence,
} from './lib/api-page.mjs';
import {
  assertSkillsVetted,
  byCodePoint,
  failureText,
  readSkillNames,
  skillFiles,
  skillSlug,
} from './lib/skills.mjs';
import {
  clipAtWord,
  firstProseLine,
  mdFiles,
  missingApiPages,
  missingApiPagesMessage,
  readApiPages,
} from './lib/api-catalog.mjs';
import { docsRoute } from './lib/docs-url.mjs';
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
const CLASS_MAP = join(
  REPO,
  'bestax-migrate',
  'src',
  'sources',
  'bulma-classes',
  'class-map.ts'
);

const PACKAGE = '@allxsmith/bestax-bulma';
/** A name a page can document as a component: an exported identifier, capitalised. */
const COMPONENT_NAME = /^[A-Z][A-Za-z0-9]*$/;
const DOCS_BASE = 'https://bestax.io/docs';

/**
 * Bumped when the shape below changes incompatibly. The server refuses an index
 * it does not understand rather than silently serving half a field — the two
 * ship in the same tarball, so a mismatch means a broken build, not a user
 * running something old.
 *
 * 2: `cssVarIndex` maps a variable to every component that declares it, its
 * owner first, rather than to one name (#964).
 */
const SCHEMA_VERSION = 2;

const collapse = s =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * A page's catalog one-liner: the frontmatter description, or else the first
 * prose line of its `## Overview` section, cut to its first sentence and
 * clipped at a word.
 */
function purposeOf(fm, sections, lines) {
  const overview = sections.find(s => /^Overview$/i.test(s.heading));
  const text =
    collapse(fm.description) ||
    firstProseLine(overview ? sectionBody(lines, overview) : '');
  return text ? clipAtWord(firstSentence(text)) : '';
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

/**
 * The import a page written as prose shows under `## Import`: its first code
 * block, when that block imports from the library.
 *
 * Built from the title instead, the constants page printed
 * `import { Valid value constants } from …`, which is not code (#935), and the
 * pages that pair a component with its hooks (`ConfigProvider, useConfig`) lost
 * the hooks. The title stands in only when it is an identifier, and a page with
 * neither stops the build rather than ship an import that cannot compile.
 */
export function helperImport(name, lines, section, relPath) {
  const body = section ? sectionBody(lines, section) : '';
  const block = body.match(
    /^(`{3,}|~{3,})[ \t]*[jt]sx?\b[^\n]*\n([\s\S]*?)\n\1/m
  );
  const code = block?.[2].trim();
  if (code && code.includes(`from '${PACKAGE}'`)) return code;
  if (/^[A-Za-z_$][\w$]*$/.test(name)) {
    return `import { ${name} } from '${PACKAGE}';`;
  }
  throw new Error(
    `[gen-mcp-index] ${relPath}: "${name}" is not an identifier, and the page ` +
      `has no ## Import code block importing from ${PACKAGE} to show instead.`
  );
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

/** A row's scope as the server's `CssVar.scope` union spells it. */
const mcpScope = scope => (scope === 'mixin' ? 'root' : scope);

/**
 * CSS variable triples for a component. Deliberately the same walk and the same
 * first-source-wins dedupe as `cssVarRows` in gen-api-docs.mjs — a component
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
  // keeps this in step with gen-api-docs.mjs's cssVarRows for a
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
      // (gen-api-docs.mjs cssVarRows), which does the same (#543).
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
          // The one exception is 'mixin', which the server has no advice
          // for: Bulma's mixin lands on the component's own element
          // (`.delete`), so the server's 'root' advice (set it there or via
          // className, an ancestor loses) is the true one, where the 'global'
          // the parser used to report sent agents to `:root` (#1021).
          scope: isExtra ? 'element' : mcpScope(row.scope),
        });
      }
    }
  }
  return rows;
}

/**
 * Every component that declares a CSS variable, the one it belongs to first.
 *
 * Several components read the same partial: DateTimeInput renders DateInput's
 * calendar, so it declares every `--bulma-dateinput-*` variable too, and the
 * form controls all read Bulma's `--bulma-input-*`. The index used to keep one
 * name per variable, whichever component the generator read last, so the
 * calendar's variables were "declared by DateTimeInput" and an agent theming
 * DateInput was sent to the wrong component (#964).
 *
 * A variable belongs to the declarer it is named after: the one whose name,
 * lower-cased with or without hyphens between its words, the variable continues
 * after `--bulma-`. The longest such name wins, so `--bulma-icon-text-*` goes
 * to IconText over Icon. The rest follow in code-point order. A variable named
 * after none of its declarers (`--bulma-picker-popover-*`, which the pickers
 * share) has no owner, and its declarers are all in code-point order.
 *
 * Every declarer stays in the list, since an override reaches each of them.
 */
export function orderDeclarers(cssVar, names) {
  const rest = cssVar.replace(/^--bulma-/, '');
  const named = name => {
    const keys = [
      name.toLowerCase(),
      name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
    ];
    return Math.max(
      0,
      ...keys
        .filter(k => rest === k || rest.startsWith(`${k}-`))
        .map(k => k.length)
    );
  };
  const sorted = [...new Set(names)].sort(byCodePoint);
  const owner = sorted.reduce(
    (best, name) => (named(name) > (best ? named(best) : 0) ? name : best),
    null
  );
  return owner ? [owner, ...sorted.filter(n => n !== owner)] : sorted;
}

/**
 * The props of a component documented on a prose page (`helpers/`), read when
 * the page's title is capitalised like a component's. A lower-case title (a
 * hook) or one that is not an identifier (`Valid value constants`) is never
 * read.
 *
 * A capitalised title that names no export stops the build, rather than
 * shipping the page as prose. A typo in a real component's title would
 * otherwise take its prop table out of the index without a word, which is
 * what #933 was. The message names the page and the rule, since the
 * extractor's own points at the barrel, and a prose page's fix is usually its
 * title. `extract` is a test seam.
 */
export function proseComponentInfo(name, relPath, extract = extractComponent) {
  let info;
  try {
    info = extract(name, { markdown: false });
  } catch (err) {
    if (err?.code !== 'BESTAX_NOT_EXPORTED') throw err;
    throw new Error(
      `[gen-mcp-index] ${relPath}: the title "${name}" is capitalised like a ` +
        `component, so the MCP index reads its props, and bulma-ui/src/index.ts ` +
        `exports no such name. Title the page after the export it documents, ` +
        `or give it a title that is not a component's.`,
      { cause: err }
    );
  }
  // An export that is no component (a props type) resolves, and reads as empty.
  // Shipped as prose, get_props would call it "not a component". A component
  // whose props are all inherited still has its catch-all row.
  const hasProps = info.tables.some(
    t => t.rows?.length || t.extraProps?.length || t.catchAll
  );
  if (!hasProps) {
    throw new Error(
      `[gen-mcp-index] ${relPath}: the title "${name}" names ` +
        `${relative(REPO, info.sourceFile).split('\\').join('/')} but finds no ` +
        `props there, so the page would ship as prose and get_props would call ` +
        `it "not a component". Title the page after the component it documents.`
    );
  }
  return info;
}

/**
 * A page's markdown with every link made absolute, for markdown the index ships
 * on its own: a hook's API block, a prose page, an Accessibility section. On the
 * site `./valid-values.md` and `#scheme-backgrounds` resolve. Served away from
 * the page, the first names a file in the reader's own workspace and the second
 * a section the answer does not carry.
 *
 * A link to another page goes to the route Docusaurus serves for it, a link
 * within the page to the page's own URL, and a site-absolute one to bestax.io.
 * Fenced code is left as it is.
 */
export function absoluteLinks(markdown, relPath) {
  const page = posix.join('api', relPath);
  const origin = new URL(DOCS_BASE).origin;
  const urlOf = path =>
    `${DOCS_BASE}/${docsRoute(path.replace(/\.mdx?$/, ''))}`;
  const resolve = target => {
    if (target.startsWith('#')) return `${urlOf(page)}${target}`;
    if (target.startsWith('/')) return `${origin}${target}`;
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return target;
    const [path, fragment = ''] = target.split(/(?=#)/);
    if (!/\.mdx?$/.test(path)) return target;
    return `${urlOf(posix.join(posix.dirname(page), path))}${fragment}`;
  };
  // A fence may sit indented up to three spaces, as one in a list item does. A
  // target may sit in angle brackets, and may be followed by a title.
  return markdown
    .split(/^([ \t]{0,3}(?:```|~~~)[^\n]*\n[\s\S]*?^[ \t]*(?:```|~~~)[ \t]*)$/m)
    .map((part, i) =>
      i % 2
        ? part
        : part.replace(/\]\(\s*(<[^>]*>|[^)\s]+)/g, (_, t) =>
            t.startsWith('<')
              ? `](<${resolve(t.slice(1, -1))}>`
              : `](${resolve(t)}`
          )
    )
    .join('');
}

/**
 * A record with `absoluteLinks` applied to every string it carries but its
 * examples, which are code. Summaries come from TSDoc and purposes from
 * frontmatter, and both were written for the page too (`[Column](./column.md)`).
 */
function withAbsoluteLinks(value, relPath, key = '') {
  if (key === 'examples') return value;
  if (typeof value === 'string') return absoluteLinks(value, relPath);
  if (Array.isArray(value))
    return value.map(v => withAbsoluteLinks(v, relPath));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        withAbsoluteLinks(v, relPath, k),
      ])
    );
  }
  return value;
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
 *
 * The manifest lists what the sync scripts ship, so it reads the skills the
 * way they do: it refuses untracked files exactly as they refuse to bundle
 * them, and lists files through the same walk that leaves `.DS_Store` out.
 * Indexing every file on disk let a local run list a file that never ships.
 */
export async function readSkills(skillsDir = SKILLS_DIR) {
  const names = await readSkillNames(skillsDir);
  assertSkillsVetted(skillsDir, names, 'index');
  const out = [];
  for (const name of names) {
    // One walk per skill, from its root, so a symbolic link anywhere in it is
    // refused just as the sync scripts refuse it: the skill directory itself,
    // SKILL.md, or any file below. The listings below are cut from this walk.
    const shipped = await skillFiles(join(skillsDir, name));
    const skillFile = join(skillsDir, name, 'SKILL.md');
    const src = await readFile(skillFile, 'utf8');
    const fm = frontmatter(src);
    // Walks nested directories, not just the top level. A skill that serves
    // more than one subject groups its references per subject
    // (`references/rbx/component-map.md`), and a flat readdir dropped every
    // one of those from the index silently — the file simply stopped being
    // served, with `gen:mcp:check` still green because the output it compared
    // was consistently wrong.
    //
    // `id` is the lookup key behind `bestax://skills/{name}/references/{ref}`,
    // so it has to stay unique and free of slashes: a nested file is keyed by
    // its path with separators replaced (`rbx-component-map`). Top-level files
    // keep exactly the id they had.
    //
    // Moving a file INTO a subdirectory therefore changes its id — when
    // bestax-migrate's references were split per source, `component-map`
    // became `react-bulma-components-component-map`. That is unavoidable once
    // two subjects each have a `component-map`, and it is a real (small) break
    // for anyone who pinned the old resource URI. Nothing in this repo pins
    // one, and agents discover ids through `get_skill` rather than hardcoding
    // them, so the rename is accepted rather than aliased.
    const listing = async sub => {
      const prefix = `${sub}/`;
      const files = [];
      for (const file of shipped) {
        if (!file.startsWith(prefix)) continue;
        const rel = file.slice(prefix.length);
        const body = await readFile(join(skillsDir, name, file), 'utf8');
        files.push({
          id: rel.replace(extname(rel), '').replace(/\//g, '-'),
          file,
          bytes: Buffer.byteLength(body),
        });
      }
      // `a-b/x.md` and `a/b-x.md` both flatten to `a-b-x`, and `id` is the
      // MCP resource lookup key — two files answering to one key would make
      // the served content depend on ordering. No such pair exists today;
      // fail loudly rather than let one appear silently.
      const seen = new Map();
      for (const f of files) {
        if (seen.has(f.id)) {
          throw new Error(
            `[gen-mcp-index] duplicate reference id "${f.id}" in ${name}/${sub}: ` +
              `${seen.get(f.id)} and ${f.file} flatten to the same key`
          );
        }
        seen.set(f.id, f.file);
      }
      return files.sort((a, b) => byCodePoint(a.id, b.id));
    };
    out.push({
      // Keyed off the directory, like every roster and install line. The
      // skills-roster check holds the frontmatter name to it, as the Agent
      // Skills spec requires.
      name,
      // The frontmatter description is already written as a trigger surface —
      // keyword-dense, ending in a "Use when…" clause. It is exactly what an
      // MCP tool/prompt description needs, so it ships verbatim.
      description: collapse(fm.description),
      // The prompt name an MCP client shows.
      promptName: skillSlug(name),
      dir: name,
      references: await listing('references'),
      examples: await listing('examples'),
    });
  }
  // In readSkillNames' order, which is code-point order.
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

/**
 * The codemod's own table, for `lookup_bulma_classes`: what bestax renders for
 * a Bulma class, read from the same file the codemod plans with, so the two
 * cannot disagree about a class. Imported rather than scraped (node strips its
 * types), the way check-conformance.mjs reads create-bestax's constants; it
 * imports nothing, so this pulls in no transform code.
 *
 * Only what a lookup reports goes into the index. What decides whether a
 * whole element converts (attributes, refs, spreads) stays the codemod's.
 */
/**
 * What the items of a list with this root become, when the table finds them
 * by where they sit (`PLACED`): the element each item holds, and where its
 * attributes go.
 */
function itemsOf(placed, token) {
  if (!placed || !Object.hasOwn(placed, token)) return null;
  const entry = placed[token];
  return {
    target: entry.target,
    tag: entry.tag,
    child: entry.absorbs.tag,
    itemProps: entry.absorbs.elementProps ?? [],
    modifiers: entry.absorbs.modifiers ?? {},
    after: entry.absorbs.after ?? null,
  };
}

export async function bulmaClassTable() {
  let map;
  try {
    map = await import(pathToFileURL(CLASS_MAP).href);
  } catch (err) {
    throw new Error(
      `could not import ${relative(REPO, CLASS_MAP)}: ${err.message}. ` +
        `It is loaded with node's type stripping, which needs Node 22.18 or later.`,
      { cause: err }
    );
  }
  const roots = Object.fromEntries(
    Object.entries(map.ROOTS).map(([token, entry]) => [
      token,
      {
        status: entry.status,
        target: entry.target ?? null,
        tag: entry.tag ?? null,
        as: entry.as ?? null,
        sizeDrivesTag: entry.sizeDrivesTag ?? false,
        textColor: entry.textColor ?? null,
        bgColor: entry.bgColor ?? null,
        part: entry.part ?? false,
        why: entry.why ?? null,
        modifiers: entry.modifiers ?? {},
        omits: entry.omits ?? {},
        wrapsChildren: entry.wrapsChildren ?? null,
        folds: entry.folds ?? null,
        absorbs: entry.absorbs ?? null,
        writes: entry.writes ?? null,
        countsChildren: entry.countsChildren ?? null,
        buildsIcons: entry.buildsIcons ?? false,
        buildsFile: entry.buildsFile ?? false,
        noHelpers: entry.noHelpers ?? false,
        helpersLeftOut: entry.helpersLeftOut ?? {},
        otherTagsStay: entry.otherTagsStay ?? null,
        topLevelOnly: entry.topLevelOnly ?? false,
        items: itemsOf(map.PLACED, token),
        parent: entry.parent ?? null,
        rendersText: entry.rendersText ?? null,
        classNameReplaces: entry.classNameReplaces ?? false,
      },
    ])
  );
  return {
    schemaVersion: SCHEMA_VERSION,
    roots,
    precedence: map.PRECEDENCE,
    wrappers: map.WRAPPERS,
    helpers: Object.fromEntries(map.HELPER_TOKENS),
    legacy: map.LEGACY_09,
    passthrough: map.PASSTHROUGH.map(group => ({
      why: group.why,
      match: group.match.source,
    })),
  };
}

export async function build() {
  // Category dirs in display order, each with its titled pages. The
  // completeness guard reads the same list, so a page it counts as
  // documented is a page this index serves.
  const categories = await readApiPages(API_DIR);

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

  for (const { dir, label, pages } of categories) {
    const members = [];
    for (const { src, fm, relPath, slug } of pages) {
      const name = fm.title;

      const { lines, sections } = sectionSpans(src);
      const find = re => sections.find(s => re.test(s.heading));
      const purpose = absoluteLinks(purposeOf(fm, sections, lines), relPath);
      // `slug` stays the file-path identity; the URL takes the route
      // Docusaurus actually serves, which collapses `grid/grid` (#597).
      const docsUrl = `${DOCS_BASE}/api/${docsRoute(slug)}`;

      // `helpers/` pages are prose rather than generated tables, and most of
      // them document hooks and utilities with an `## API` signature block and
      // no props at all. Those ship as prose, with the signature on its own.
      //
      // The rest document components (Theme, ConfigProvider, Portal,
      // ClientOnly), and those get the props table every other component
      // gets, from their props interface (#933). Shipping them as prose too
      // left get_props with no table to give and pointed a builder at
      // get_helper_props, which describes none of them. Their page still
      // ships, for `include: ["reference"]`, since it carries prose the
      // table does not, such as the hooks a provider pairs with.
      const proseOnly =
        GENERATED_EXEMPT.has(dir) || GENERATED_EXEMPT.has(relPath);
      const info = !proseOnly
        ? extractComponent(name, { markdown: false })
        : COMPONENT_NAME.test(name)
          ? proseComponentInfo(name, relPath)
          : null;
      // A capitalised title that read no props has already stopped the build.
      const isHelper = proseOnly && !info;

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

      // The whole page. These are reference prose, not tables, and an agent
      // asking "how do I do spacing without inline styles" needs all of it.
      const doc = proseOnly ? withoutFrontmatter(src).trimEnd() : null;

      let record;
      if (isHelper) {
        const api = find(/^API$/i);
        record = {
          ...common,
          summary: purpose,
          import: helperImport(name, lines, find(/^Import$/i), relPath),
          // The signature block alone: what a hook takes and returns, at a
          // fraction of the page. It is the hook's answer to a props table.
          api: api ? sectionBody(lines, api) : null,
          doc,
          parts: [],
          cssVars: [],
        };
      } else {
        const cssVars = await cssVarsFor(info);
        for (const v of cssVars) (cssVarIndex[v.css] ??= []).push(name);
        record = {
          ...common,
          summary: collapse(info.tsdoc),
          // A prose page's own Import block, as for a hook: IMPORT_COMPANIONS
          // is generated from the generated pages only, so it would drop the
          // hook a provider pairs with (`ConfigProvider, useConfig`).
          import: proseOnly
            ? helperImport(name, lines, find(/^Import$/i), relPath)
            : `import { ${(IMPORT_COMPANIONS[name] ?? [name]).join(
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
          ...(doc ? { doc } : {}),
        };
      }

      record = withAbsoluteLinks(record, relPath);
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
      Object.entries(cssVarIndex)
        .sort((a, b) => byCodePoint(a[0], b[0]))
        .map(([css, names]) => [css, orderDeclarers(css, names)])
    ),
  };

  return {
    catalog,
    components,
    missing: missingApiPages(await readFile(INDEX_TS, 'utf8'), categories),
    skills: { skills: await readSkills() },
    bulmaClasses: await bulmaClassTable(),
  };
}

export async function main() {
  const { catalog, components, missing, skills, bulmaClasses } = await build();

  // Rewrite the component directory rather than overwriting in place: a
  // component that was removed must lose its file, or the staleness gate
  // passes while the server still answers for something that no longer exists.
  const componentDir = join(OUT_DIR, 'components');
  await rm(componentDir, { recursive: true, force: true });
  await mkdir(componentDir, { recursive: true });

  await writeFile(join(OUT_DIR, 'catalog.json'), await json(catalog));
  await writeFile(join(OUT_DIR, 'skills.json'), await json(skills));
  await writeFile(
    join(OUT_DIR, 'bulma-classes.json'),
    await json(bulmaClasses)
  );
  for (const [name, record] of [...components].sort((a, b) =>
    byCodePoint(a[0], b[0])
  )) {
    await writeFile(join(componentDir, `${name}.json`), await json(record));
  }

  // Completeness guard. Runs after writing so the failure names what to fix
  // rather than leaving a half-written index behind.
  if (missing.length) {
    console.error(missingApiPagesMessage(missing, 'the MCP index'));
    process.exit(1);
  }

  process.stdout.write(
    `Wrote ${relative(REPO, OUT_DIR)} (${catalog.components.length} components, ` +
      `${skills.skills.length} skills, bestax-bulma ${catalog.generatedFrom.version})\n`
  );
}

/**
 * The command line's failure handler: failureText, so a refusal prints its
 * message and anything else its stack, then exit 1. `error` and `exit` are
 * injectable so the tests can drive it.
 */
export function reportFailure(
  err,
  { error = console.error, exit = process.exit } = {}
) {
  error(failureText(err));
  exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(err => reportFailure(err));
}
