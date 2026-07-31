#!/usr/bin/env node
/**
 * ONE-TIME migration: move an API page's sections into the canonical order and
 * wrap the derivable ones in generated-region markers.
 *
 * Two modes, run in this order per category:
 *
 *   --seed-tsdoc   copy each page's Overview sentence INTO the component's
 *                  TSDoc summary. This direction is deliberate: the existing
 *                  summaries are mechanical ("Bulma Hero component root.") and
 *                  far worse than the curated docs prose, so generating the
 *                  Overview from today's TSDoc would regress every page. The
 *                  summary also ships in the .d.ts and users' editor tooltips,
 *                  so review the printed replacements.
 *
 *   (default)      reorder sections, insert markers, and seed each region with
 *                  the content already on the page. `gen-api-docs.mjs` then
 *                  takes ownership of those regions.
 *
 * Refuses to touch a page with duplicate `## ` headings (form/checkbox.md has
 * a pre-existing duplicated footer) — merging them silently would lose prose.
 *
 * Delete this script once the last category is migrated; the permanent
 * `docs-section-order` conformance check holds the line afterwards.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

import {
  sectionSpans,
  sectionBody,
  openMarker,
  closeMarker,
  firstSentence,
} from './lib/api-page.mjs';
import { exportedModules, extractComponent } from './lib/props-extract.mjs';
import { SCSS_SOURCES } from './lib/api-sources.mjs';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const API_DIR = join(REPO, 'docs', 'docs', 'api');
const ts = require('typescript');
const prettier = require('prettier');

/**
 * Canonical section order. Anything not listed keeps its position in the
 * `unknown` bucket (rank 3), preserving relative order — that is what keeps
 * pages with "Keyboard Navigation", "Form Submission", "Programmatic API" etc.
 * intact.
 */
const RANK = {
  Overview: 0,
  Import: 1,
  Usage: 2,
  Accessibility: 4,
  'Related Components': 5,
  'Additional Resources': 6,
  Props: 7,
  'CSS & Sass Variables': 8,
};
const UNKNOWN_RANK = 3;

async function mdFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await mdFiles(full)));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out.sort();
}

function frontmatterTitle(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const t = m[1].match(/^title:[ \t]*(.+?)[ \t]*$/m);
  return t ? t[1].replace(/^['"]|['"]$/g, '') : null;
}

// ---------------------------------------------------------------------------
// Mode 1: seed component TSDoc from the docs Overview sentence.
// ---------------------------------------------------------------------------

/**
 * Replace the summary lines of `declName`'s JSDoc with `sentence`, keeping
 * every tag below it. Returns null when there is nothing to do.
 */
async function seedSummary(source, declName, sentence, tsFile, title) {
  const sf = ts.createSourceFile(
    tsFile,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  // The declaration named `declName`, or the implementation it wraps
  // (`Hero` -> `HeroComponent`).
  let target = null;
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || decl.name.text !== declName) continue;
      const init = decl.initializer;
      const isWrap =
        init &&
        ts.isCallExpression(init) &&
        init.expression.getText() === 'withSubComponents';
      if (!isWrap) {
        target = stmt;
        continue;
      }
      const base = init.arguments[0]?.getText();
      for (const s2 of sf.statements) {
        if (!ts.isVariableStatement(s2)) continue;
        for (const d2 of s2.declarationList.declarations) {
          if (ts.isIdentifier(d2.name) && d2.name.text === base) target = s2;
        }
      }
    }
  }
  if (!target) {
    console.warn(
      `! ${title}: no declaration named ${declName} in ${relative(REPO, tsFile)}`
    );
    return null;
  }

  const docs = ts.getJSDocCommentsAndTags(target).filter(ts.isJSDoc);
  const jsdoc = docs[docs.length - 1];
  if (!jsdoc) {
    console.warn(`! ${title}: ${declName} has no JSDoc block to seed`);
    return null;
  }
  const was = (ts.getTextOfJSDocComment(jsdoc.comment) ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  // The docs page always wins. No quality heuristic: the page's Overview was
  // written to introduce the component, the TSDoc summaries were not, and
  // scoring them by length picks the wrong one (Container's summary is longer
  // overall but opens with "Container component for Bulma."). Every
  // replacement is printed instead — a human reads the list, because this
  // text ships in the .d.ts and users' editor tooltips.
  if (firstSentence(was) === sentence) return null; // already seeded

  const raw = source.slice(jsdoc.pos, jsdoc.end);
  const lead = raw.match(/^\s*/)[0];
  const rest = raw
    .trim()
    .replace(/^\/\*\*/, '')
    .replace(/\*\/$/, '')
    .split(/\r?\n/)
    .map(l => l.replace(/^\s*\*\s?/, ''))
    .join('\n');
  const tagsAt = rest.search(/^@/m);
  const tail = tagsAt === -1 ? '' : rest.slice(tagsAt).trimEnd();

  const lines = ['/**', ` * ${sentence}`];
  if (tail) {
    lines.push(' *');
    for (const l of tail.split('\n')) lines.push(` * ${l}`.trimEnd());
  }
  lines.push(' */');

  return {
    src:
      source.slice(0, jsdoc.pos) +
      lead +
      lines.join('\n') +
      source.slice(jsdoc.end),
    was,
  };
}

async function seedTsdoc(category, { dryRun, base }) {
  const mods = exportedModules();
  const pages = new Map();
  for (const file of await mdFiles(API_DIR)) {
    const rel = relative(API_DIR, file).split('\\').join('/');
    if (rel.split('/')[0] !== category) continue;
    // `--base=origin/main` reads the PRE-migration page. Needed to seed a
    // category that was already migrated: the generated `**Subcomponents:**`
    // list has replaced the hand-written bullets this seeds from.
    const src = base
      ? execFileSync('git', ['show', `${base}:${relative(REPO, file)}`], {
          cwd: REPO,
          encoding: 'utf8',
        })
      : await readFile(file, 'utf8');
    const title = frontmatterTitle(src);
    if (title) pages.set(title, { file, src });
  }

  let changed = 0;
  for (const [title, { src }] of [...pages].sort()) {
    const entry = mods.get(title);
    if (!entry) continue;
    const tsFile = join(REPO, 'bulma-ui', 'src', entry.cat, `${entry.mod}.tsx`);
    const source = await readFile(tsFile, 'utf8');

    // The page's first Overview prose sentence.
    const after = src.split(/^#{2,3}[ \t]+Overview[ \t]*$/m)[1] ?? '';
    let prose = '';
    for (const raw of after.split(/\r?\n/)) {
      const t = raw.trim();
      if (!t) continue;
      if (/^(:::|<|import\b|#|!\[|[-*|>])/.test(t)) continue;
      prose = t;
      break;
    }
    if (!prose) continue;
    const sentence = firstSentence(prose);

    // Sub-component summaries come from the page's `**Subcomponents:**` list,
    // where the hand-written pages described each one ("Top bar for navigation
    // or branding"). The source summaries there are as mechanical as the root's
    // ("Bulma Hero head section."), and the generated list renders these.
    const seeds = [[title, sentence]];
    let info = null;
    try {
      info = extractComponent(title);
    } catch {
      /* not extractable — root seed still applies */
    }
    const bySubPath = new Map(
      (info?.tables ?? []).slice(1).map(t => [t.path, t.impl])
    );
    for (const m of src.matchAll(
      /^[-*][ \t]+`([\w.]+)`[ \t]*[:—-][ \t]*(.+)$/gm
    )) {
      const impl = bySubPath.get(m[1]);
      if (impl) seeds.push([impl, firstSentence(m[2].trim())]);
    }

    let source2 = source;
    for (const [declName, text] of seeds) {
      const next = await seedSummary(source2, declName, text, tsFile, title);
      if (!next) continue;
      source2 = next.src;
      changed++;
      process.stdout.write(
        `\u2713 ${declName}\n    was: "${next.was}"\n    now: "${text}"\n`
      );
    }
    if (source2 !== source && !dryRun) {
      await writeFile(
        tsFile,
        await prettier.format(source2, {
          ...(await prettier.resolveConfig(tsFile)),
          filepath: tsFile,
        })
      );
    }
  }
  process.stdout.write(
    `\n${changed} TSDoc summar(ies) ${dryRun ? 'would be ' : ''}seeded.\n`
  );
}

// ---------------------------------------------------------------------------
// Mode 2: reorder + insert markers.
// ---------------------------------------------------------------------------

function wrap(id, body) {
  return [openMarker(id), body, closeMarker(id)].join('\n');
}

function buildOverview(body) {
  // Split the leading paragraph so only its first sentence is generated; the
  // remainder (and any admonition) stays hand-written below the region.
  const lines = body.split('\n');
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  const para = lines[i] ?? '';
  const sentence = firstSentence(para);
  const remainder = para.slice(sentence.length).trim();
  const after = lines.slice(i + 1);
  const tail = [remainder, ...after].join('\n').replace(/^\n+/, '');
  return [wrap('overview', `\n${sentence}\n`), tail.trim()]
    .filter(Boolean)
    .join('\n\n');
}

function buildImport(body) {
  return wrap('import', `\n${body.trim()}\n`);
}

/**
 * Wrap only the prop TABLES, leaving any surrounding prose in the section but
 * outside the generated region.
 *
 * 15 pages carry hand-written prose under `## Props` — admonitions, footnotes,
 * and in `card.md` a 32-line prose sub-API. Wrapping the whole section would
 * put that inside a region the generator overwrites, i.e. delete it.
 *
 * The region spans the first table line to the last. Anything before or after
 * survives untouched. Prose *between* tables cannot survive (the generator owns
 * that span), so this returns `null` for those pages instead of eating it —
 * the caller reports them for hand relocation.
 */
function buildProps(body, subPaths) {
  const lines = body.split('\n');
  const isTable = l => l.trimStart().startsWith('|');
  const first = lines.findIndex(isTable);
  if (first === -1) return null; // no table to own
  // A `###` heading that is NOT one of the component's sub-components ends the
  // generated span — `taginput.md` documents the `TaginputTag` type that way,
  // and swallowing it would put a hand-written type reference inside a region
  // the generator rewrites.
  let stop = lines.length;
  for (let i = first; i < lines.length; i++) {
    const h = lines[i].trim().match(/^#{3,}\s+(.+?)\s*$/);
    if (h && !subPaths.has(h[1].replace(/`/g, ''))) {
      stop = i;
      break;
    }
  }
  let last = first;
  for (let i = stop - 1; i >= first; i--) {
    if (isTable(lines[i])) {
      last = i;
      break;
    }
  }

  const stray = [];
  for (let i = first; i <= last; i++) {
    const t = lines[i].trim();
    if (!t || isTable(lines[i]) || /^#{3,}\s/.test(t)) continue;
    stray.push(t);
  }
  if (stray.length) return { conflict: stray };

  const before = lines.slice(0, first).join('\n').trim();
  const after = lines
    .slice(last + 1)
    .join('\n')
    .trim();
  const region = wrap(
    'props',
    `\n${lines.slice(first, last + 1).join('\n')}\n`
  );
  return [before, region, after].filter(Boolean).join('\n\n');
}

async function migratePage(file, { dryRun, reorderOnly }) {
  const relPath = relative(API_DIR, file).split('\\').join('/');
  const src = await readFile(file, 'utf8');
  const title = frontmatterTitle(src);
  if (!title) return null;

  const { lines, sections, preambleEnd } = sectionSpans(src);

  const seen = new Set();
  for (const s of sections) {
    if (seen.has(s.heading)) {
      console.error(
        `✗ docs/docs/api/${relPath} has a duplicate "## ${s.heading}" section. ` +
          `Merge them by hand first — this script will not guess which prose to keep.`
      );
      return null;
    }
    seen.add(s.heading);
  }

  const preamble = lines.slice(0, preambleEnd).join('\n').trimEnd();

  const parts = sections.map((s, idx) => ({
    heading: s.heading,
    body: sectionBody(lines, s),
    rank: RANK[s.heading] ?? UNKNOWN_RANK,
    idx,
  }));

  // `--reorder-only` moves sections into the canonical order without adding
  // generated regions — for pages that share the house ordering but whose
  // content is not a component props table (helpers/theme.md, helpers/config.md).
  if (!reorderOnly) {
    for (const p of parts) {
      if (p.heading === 'Overview') p.body = buildOverview(p.body);
      else if (p.heading === 'Import') p.body = buildImport(p.body);
      else if (p.heading === 'Props') {
        // Dot paths of this component's sub-components, so a `### Hero.Head`
        // heading stays inside the generated span while a `### TaginputTag`
        // type reference ends it.
        let subPaths = new Set();
        try {
          subPaths = new Set(
            extractComponent(title)
              .tables.slice(1)
              .map(t => t.path)
          );
        } catch {
          /* not extractable — treat every ### as foreign */
        }
        const built = buildProps(p.body, subPaths);
        if (built === null) {
          console.error(
            `\u2717 docs/docs/api/${relPath}: "## Props" has no table to generate. ` +
              `Check the page by hand.`
          );
          return null;
        }
        if (built.conflict) {
          console.error(
            `\u2717 docs/docs/api/${relPath}: prose sits BETWEEN prop tables and ` +
              `would be overwritten by the generated region. Move it above the ` +
              `first table or below the last, then re-run. Offending line(s):\n` +
              built.conflict.map(l => `      ${l.slice(0, 90)}`).join('\n')
          );
          return null;
        }
        p.body = built;
      }
    }
  }

  // Append the new CSS variables section when the component has any.
  if (
    !reorderOnly &&
    SCSS_SOURCES[title]?.length &&
    !seen.has('CSS & Sass Variables')
  ) {
    parts.push({
      heading: 'CSS & Sass Variables',
      body: wrap('cssvars', '\n\n'),
      rank: RANK['CSS & Sass Variables'],
      idx: parts.length,
    });
  }

  parts.sort((a, b) => a.rank - b.rank || a.idx - b.idx);

  const rendered = parts.map(p => `## ${p.heading}\n\n${p.body}`.trimEnd());
  const out = `${preamble}\n\n${rendered.join('\n\n---\n\n')}\n`;

  const formatted = await prettier.format(out, {
    ...(await prettier.resolveConfig(file)),
    filepath: file,
  });
  if (!dryRun && formatted !== src) await writeFile(file, formatted);
  return { relPath, changed: formatted !== src };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const reorderOnly = args.includes('--reorder-only');
  const catArg = args.find(a => a.startsWith('--category='));
  if (!catArg) {
    console.error(
      'Usage: node scripts/migrate-api-pages.mjs --category=<dir> [--seed-tsdoc] [--dry-run]'
    );
    process.exit(2);
  }
  const category = catArg.slice('--category='.length);

  if (args.includes('--seed-tsdoc')) {
    await seedTsdoc(category, {
      dryRun,
      base: args.find(a => a.startsWith('--base='))?.slice('--base='.length),
    });
    return;
  }

  let changed = 0;
  for (const file of await mdFiles(API_DIR)) {
    const rel = relative(API_DIR, file).split('\\').join('/');
    if (rel.split('/')[0] !== category) continue;
    const r = await migratePage(file, { dryRun, reorderOnly });
    if (r?.changed) {
      changed++;
      process.stdout.write(
        `${dryRun ? '~' : '✓'} docs/docs/api/${r.relPath}\n`
      );
    }
  }
  process.stdout.write(
    `\n${changed} page(s) ${dryRun ? 'would be ' : ''}migrated.\n`
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
