#!/usr/bin/env node
/**
 * Regenerate the data blocks in `scripts/lib/api-sources.mjs`.
 *
 * Two maps that would otherwise be hand-maintained across ~90 components:
 *
 *   SCSS_SOURCES       component -> the SCSS partial(s) registering its CSS
 *                      variables, discovered by matching the component's root
 *                      class (from `usePrefixedClassNames`) against every
 *                      partial in bulma's sass tree and bulma-ui/src/scss.
 *   IMPORT_COMPANIONS  pages whose `## Import` deliberately imports more than
 *                      the page's own component, read from the page itself.
 *
 * Discovery beats hand-maintenance here because it is exact: a partial either
 * registers variables on the component's root selector or it does not.
 *
 * More than one match is normal and all matches are kept. Bulma's
 * `form/shared.scss` registers 30 `--bulma-input-*` variables on a selector
 * list covering `.control`, `.input`, `.textarea` and `.select`, so those
 * variables genuinely apply to all four components — a reader on the Select
 * page needs `--bulma-input-radius` as much as `--bulma-select-*`. Partials are
 * ordered by path for determinism, and `gen-api-docs.mjs` dedupes by CSS
 * variable name (first wins) when a name appears in more than one.
 *
 * Run after a Bulma upgrade or when adding a component:  pnpm gen:api-sources
 * The output is committed, so the diff is reviewable.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

import { componentVars } from './lib/scss-vars.mjs';
import {
  extractComponent,
  exportedModules,
  varRootCandidates,
} from './lib/props-extract.mjs';
import { GENERATED_EXEMPT } from './lib/api-sources.mjs';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const API_DIR = join(REPO, 'docs', 'docs', 'api');
const OUT = join(HERE, 'lib', 'api-sources.mjs');

const byCodePoint = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

async function mdFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const f = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await mdFiles(f)));
    else if (e.name.endsWith('.md')) out.push(f);
  }
  return out.sort(byCodePoint);
}

function frontmatterTitle(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const t = m[1].match(/^title:[ \t]*(.+?)[ \t]*$/m);
  return t ? t[1].replace(/^['"]|['"]$/g, '') : null;
}

/** Every SCSS partial that could register component variables. */
async function candidatePartials() {
  const out = [];
  let bulmaRoot;
  try {
    bulmaRoot = dirname(require.resolve('bulma/package.json'));
  } catch {
    throw new Error(
      'Cannot resolve the `bulma` package — run `pnpm install --frozen-lockfile` first.'
    );
  }
  // `base` and `utilities` are in the list because Bulma does not keep every
  // component's variables in its own folder: `--bulma-skeleton-*` lives in
  // `base/skeleton.scss`, `--bulma-code-*`/`pre-*`/`strong-*` in
  // `base/generic.scss`, and `--bulma-delete-*` inside a mixin in
  // `utilities/mixins.scss`. Scanning only the component folders is why those
  // pages showed no CSS variable table at all.
  for (const dir of [
    'base',
    'elements',
    'components',
    'form',
    'layout',
    'grid',
    'utilities',
  ]) {
    const d = join(bulmaRoot, 'sass', dir);
    if (!existsSync(d)) continue;
    for (const f of (await readdir(d)).sort(byCodePoint)) {
      if (f.endsWith('.scss')) {
        out.push({ pkg: 'bulma', path: `sass/${dir}/${f}`, full: join(d, f) });
      }
    }
  }
  for (const dir of ['components', 'elements', 'form']) {
    const d = join(REPO, 'bulma-ui', 'src', 'scss', dir);
    if (!existsSync(d)) continue;
    for (const f of (await readdir(d)).sort(byCodePoint)) {
      if (f.endsWith('.scss') && f !== '_index.scss') {
        out.push({
          pkg: 'repo',
          path: `bulma-ui/src/scss/${dir}/${f}`,
          full: join(d, f),
        });
      }
    }
  }
  return Promise.all(
    out.map(async c => ({ ...c, src: await readFile(c.full, 'utf8') }))
  );
}

/**
 * SCSS partials registering variables under any of `candidates` — a
 * component can carry both its bulma source and its own repo partial(s) (see
 * `varRootCandidates`/`EXTRA_VAR_ROOTS` in props-extract.mjs, #543). Deduped
 * by path; final order is by path for determinism, matching every other list
 * this generator writes.
 */
export function resolveScssHits(candidates, partials) {
  const hits = new Map();
  for (const { root, prefix } of candidates) {
    if (!root && !prefix) continue;
    for (const partial of partials) {
      if (hits.has(partial.path)) continue;
      if (componentVars(partial.src, root, prefix).length > 0) {
        hits.set(partial.path, partial);
      }
    }
  }
  return [...hits.values()].sort((a, b) => byCodePoint(a.path, b.path));
}

function fmt(v) {
  return JSON.stringify(v);
}

/** Object key, quoted when the name is not a bare identifier ("Valid value constants"). */
function key(name) {
  return /^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name);
}

async function main() {
  const partials = await candidatePartials();
  const mods = exportedModules();

  // ----- SCSS_SOURCES -------------------------------------------------------
  const scss = [];
  const unresolved = [];
  for (const name of [...mods.keys()].sort(byCodePoint)) {
    if (!/^[A-Z]/.test(name)) continue; // hooks/utils are not components
    let info;
    try {
      info = extractComponent(name);
    } catch {
      continue; // no resolvable component declaration (type-only export)
    }
    const root = info.rootClass;
    // The variable family, which is not always the root class — the semantic
    // wrappers (Code, Pre, Strong) render a bare element and own a `--bulma-…`
    // family anyway. See VAR_PREFIX_OVERRIDES in props-extract.mjs.
    const prefix = info.varPrefix;
    // Candidates but no confident pick means the name rule could not decide.
    // Refuse rather than guess — a wrong root class silently attaches another
    // component's CSS variables to this page.
    if (!root && !prefix && info.rootClassCandidates.length) {
      unresolved.push(
        `${name}: renders [${info.rootClassCandidates.join(', ')}] but none ` +
          `matches its name`
      );
      continue;
    }
    const candidates = varRootCandidates(name, root, prefix);
    const hits = candidates.some(c => c.root || c.prefix)
      ? resolveScssHits(candidates, partials)
      : [];
    scss.push({ name, hits, root });
  }

  if (unresolved.length) {
    console.error(
      `\nERROR: cannot determine the root class for ${unresolved.length} ` +
        `component(s). Add each to ROOT_CLASS_OVERRIDES — or, for a semantic ` +
        `wrapper with no prefixed class of its own, VAR_PREFIX_OVERRIDES — in ` +
        `scripts/lib/props-extract.mjs after checking the component source:\n  ` +
        unresolved.join('\n  ') +
        '\n'
    );
    process.exit(1);
  }

  const scssLines = scss.map(({ name, hits }) => {
    if (!hits.length) return `  ${key(name)}: [],`;
    const entries = hits
      .map(h => `{ pkg: ${fmt(h.pkg)}, path: ${fmt(h.path)} }`)
      .join(', ');
    return `  ${key(name)}: [${entries}],`;
  });

  // ----- IMPORT_COMPANIONS --------------------------------------------------
  const companions = [];
  for (const file of await mdFiles(API_DIR)) {
    const rel = relative(API_DIR, file).split('\\').join('/');
    // Exempt categories never render a generated import region.
    if (GENERATED_EXEMPT.has(rel.split('/')[0])) continue;
    const src = await readFile(file, 'utf8');
    const title = frontmatterTitle(src);
    if (!title) continue;
    const block = src.split(/^## Import\s*$/m)[1]?.split(/^## /m)[0] ?? '';
    const named = block.match(/import\s*\{([\s\S]*?)\}/);
    if (!named) continue;
    const names = named[1]
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (names.length > 1) {
      companions.push(`  ${key(title)}: [${names.map(fmt).join(', ')}],`);
    }
  }

  const src = await readFile(OUT, 'utf8');
  const replaced = src
    .replace(
      /(\/\/ <generated:scss-sources>\n)[\s\S]*?(\n\/\/ <\/generated:scss-sources>)/,
      `$1export const SCSS_SOURCES = {\n${scssLines.join('\n')}\n};$2`
    )
    .replace(
      /(\/\/ <generated:import-companions>\n)[\s\S]*?(\n\/\/ <\/generated:import-companions>)/,
      `$1export const IMPORT_COMPANIONS = {\n${companions.join('\n')}\n};$2`
    );

  const prettier = require('prettier');
  const formatted = await prettier.format(replaced, {
    ...(await prettier.resolveConfig(OUT)),
    filepath: OUT,
  });
  await writeFile(OUT, formatted);

  const withVars = scss.filter(s => s.hits.length).length;
  process.stdout.write(
    `Wrote ${relative(REPO, OUT)}\n` +
      `  SCSS_SOURCES: ${scss.length} components (${withVars} with variables, ` +
      `${scss.length - withVars} without)\n` +
      `  IMPORT_COMPANIONS: ${companions.length} pages\n`
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(err => {
    console.error(err.message ?? err);
    process.exit(1);
  });
}
