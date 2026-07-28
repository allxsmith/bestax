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

import {
  sectionSpans,
  sectionBody,
  splitLines,
  openMarker,
  closeMarker,
  firstSentence,
} from './lib/api-page.mjs';
import { exportedModules } from './lib/props-extract.mjs';
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

async function seedTsdoc(category, { dryRun }) {
  const mods = exportedModules();
  const pages = new Map();
  for (const file of await mdFiles(API_DIR)) {
    const rel = relative(API_DIR, file).split('\\').join('/');
    if (rel.split('/')[0] !== category) continue;
    const src = await readFile(file, 'utf8');
    const title = frontmatterTitle(src);
    if (title) pages.set(title, { file, src });
  }

  let changed = 0;
  for (const [title, { src }] of [...pages].sort()) {
    const entry = mods.get(title);
    if (!entry) continue;
    const tsFile = join(REPO, 'bulma-ui', 'src', entry.cat, `${entry.mod}.tsx`);
    const source = await readFile(tsFile, 'utf8');
    const sf = ts.createSourceFile(
      tsFile,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

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

    // Find the component's own JSDoc: the declaration named `title`, or the
    // implementation it wraps (`Hero` -> `HeroComponent`).
    let target = null;
    for (const stmt of sf.statements) {
      if (!ts.isVariableStatement(stmt)) continue;
      for (const decl of stmt.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue;
        const init = decl.initializer;
        const isWrap =
          init &&
          ts.isCallExpression(init) &&
          init.expression.getText() === 'withSubComponents';
        if (decl.name.text === title && !isWrap) target = stmt;
        if (decl.name.text === title && isWrap) {
          const base = init.arguments[0]?.getText();
          for (const s2 of sf.statements) {
            if (!ts.isVariableStatement(s2)) continue;
            for (const d2 of s2.declarationList.declarations) {
              if (ts.isIdentifier(d2.name) && d2.name.text === base)
                target = s2;
            }
          }
        }
      }
    }
    if (!target) {
      console.warn(
        `! ${title}: no component declaration found in ${relative(REPO, tsFile)}`
      );
      continue;
    }

    const docs = ts.getJSDocCommentsAndTags(target).filter(ts.isJSDoc);
    const jsdoc = docs[docs.length - 1];
    if (!jsdoc) {
      console.warn(`! ${title}: component has no JSDoc block to seed`);
      continue;
    }
    const current = (ts.getTextOfJSDocComment(jsdoc.comment) ?? '')
      .replace(/\s+/g, ' ')
      .trim();
    // The docs page always wins. No quality heuristic: the page's Overview was
    // written to introduce the component, the TSDoc summaries were not, and
    // scoring them by length picks the wrong one (Container's summary is longer
    // overall but opens with "Container component for Bulma."). Every
    // replacement is printed instead — a human reads the list, because this
    // text ships in the .d.ts and users' editor tooltips.
    if (firstSentence(current) === sentence) continue; // already seeded

    const raw = source.slice(jsdoc.pos, jsdoc.end);
    const lead = raw.match(/^\s*/)[0];
    const indent = ' ';
    // Replace only the summary lines (up to the first blank ` *` or a tag).
    const body = raw
      .trim()
      .replace(/^\/\*\*/, '')
      .replace(/\*\/$/, '');
    const rest = body
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
    const replacement =
      lead +
      lines.join(`\n${indent}`.replace('\n ', '\n')).replace(/\n/g, '\n');

    const next =
      source.slice(0, jsdoc.pos) + replacement + source.slice(jsdoc.end);
    const formatted = await prettier.format(next, {
      ...(await prettier.resolveConfig(tsFile)),
      filepath: tsFile,
    });
    if (!dryRun) await writeFile(tsFile, formatted);
    changed++;
    process.stdout.write(
      `✓ ${title}\n    was: "${current}"\n    now: "${sentence}"\n`
    );
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

function buildProps(body) {
  return wrap('props', `\n${body.trim()}\n`);
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
      else if (p.heading === 'Props') p.body = buildProps(p.body);
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
    await seedTsdoc(category, { dryRun });
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
