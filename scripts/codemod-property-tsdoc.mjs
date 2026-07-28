#!/usr/bin/env node
/**
 * ONE-TIME migration: move prop documentation from the `@property` block above
 * each `<X>Props` interface onto the interface members as inline TSDoc.
 *
 *   /**                                    /**
 *    * Props for the Footer component.      * Props for the Footer component.
 *    *                                      *​/
 *    * @property {string} [className] -     export interface FooterProps … {
 *    *   Additional CSS classes.              /** Additional CSS classes. *​/
 *    *​/                                       className?: string;
 *
 * Why bother: `@property` is a comment ABOUT the interface. TypeScript cannot
 * check it, so its hand-typed `{Type}` drifts from the real member type, and it
 * never reaches a user's editor. Inline TSDoc is verifiable by position, shows
 * up in IntelliSense, and is what `scripts/lib/props-extract.mjs` reads.
 *
 * Three rules that matter:
 *
 * 1. DESCRIPTIONS COME FROM THE DOCS PAGE FIRST. The hand-written tables in
 *    docs/docs/api are consistently richer than the `@property` lines
 *    (button.md explains what `ghost` and `text` render as; the source comment
 *    just says "Bulma color modifier"). Migrating from the source would quietly
 *    downgrade the docs.
 * 2. MERGE, NEVER OVERWRITE. 21 modules already carry some inline member TSDoc
 *    and 6 are mixed; a member that already has a comment is left alone.
 * 3. ORPHAN `@property` LINES ARE NOT DROPPED. 38 of them name props that live
 *    on a DOM base type rather than the interface. Those are rewritten as
 *    `@extraProp`, which props-extract renders as its own rows.
 *
 * Usage:
 *   node scripts/codemod-property-tsdoc.mjs --category=layout [--dry-run]
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const API_DIR = join(REPO, 'docs', 'docs', 'api');
const ts = require('typescript');
const prettier = require('prettier');

// ---------------------------------------------------------------------------
// Existing docs tables — the preferred description source.
// ---------------------------------------------------------------------------

function frontmatterTitle(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const t = m[1].match(/^title:[ \t]*(.+?)[ \t]*$/m);
  return t ? t[1].replace(/^['"]|['"]$/g, '') : null;
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

/**
 * prop name -> description, from every markdown table on the page.
 *
 * Handles all the shapes in the wild: `| Prop | Type | Default | Description |`,
 * `| Prop | Type | Description |`, and footer.md's `| Field | … |`. The
 * description is always the last column; the prop name is always the first.
 */
function parseDocsDescriptions(md) {
  const out = new Map();
  const lines = md.split(/\r?\n/);
  let headers = null;
  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith('|')) {
      headers = null;
      continue;
    }
    const cells = t
      .replace(/^\||\|$/g, '')
      .split(/(?<!\\)\|/)
      .map(c => c.trim());
    if (!headers) {
      if (/^(prop|field|name)$/i.test(cells[0])) headers = cells;
      continue;
    }
    if (/^-{2,}/.test(cells[0])) continue;
    const name = cells[0].replace(/`/g, '').trim();
    const desc = cells[cells.length - 1].trim();
    if (!name || name === '...' || !desc || desc === '—') continue;
    if (!out.has(name)) out.set(name, desc.replace(/\\\|/g, '|'));
  }
  return out;
}

// ---------------------------------------------------------------------------
// @property parsing
// ---------------------------------------------------------------------------

/**
 * Parse `@property {Type} [name] - description` lines out of a raw JSDoc
 * comment. `{Type}` is discarded — the interface is the type source of truth.
 * Continuation lines (prettier wraps long descriptions) are folded in.
 */
function parsePropertyTags(comment) {
  const body = comment
    .replace(/^\/\*\*/, '')
    .replace(/\*\/$/, '')
    .split(/\r?\n/)
    .map(l => l.replace(/^\s*\*\s?/, ''));

  const tags = [];
  let current = null;
  const summary = [];
  for (const line of body) {
    // `line` never contains a newline (body is split above), so `[^}]` is both
    // equivalent to a lazy `[\s\S]+?` here and free of the backtracking that
    // lazy-quantifier-before-a-literal produces.
    const m = line.match(
      /^\s*@property\s+(?:\{([^}]+)\}\s*)?\[?([\w'"$-]+)\]?\s*(?:-\s*)?(.*)$/
    );
    if (m) {
      if (current) tags.push(current);
      current = {
        type: m[1] ?? null,
        name: m[2].replace(/^['"]|['"]$/g, ''),
        desc: (m[3] ?? '').trim(),
      };
      continue;
    }
    if (/^\s*@/.test(line)) {
      if (current) tags.push(current);
      current = null;
      continue;
    }
    if (current) {
      if (line.trim()) current.desc += ` ${line.trim()}`;
      continue;
    }
    if (!tags.length) summary.push(line);
  }
  if (current) tags.push(current);
  for (const t of tags) t.desc = t.desc.replace(/\s+/g, ' ').trim();
  return { tags, summary: summary.join('\n').trim() };
}

function memberName(member) {
  return member.name?.getText().replace(/^['"]|['"]$/g, '') ?? null;
}

function hasOwnJsDoc(member) {
  return ts
    .getJSDocCommentsAndTags(member)
    .some(d => ts.isJSDoc(d) && d.comment);
}

/** All interfaces in the file, plus a name->decl index for base lookups. */
function interfaceIndex(sf) {
  const map = new Map();
  for (const stmt of sf.statements) {
    if (ts.isInterfaceDeclaration(stmt)) map.set(stmt.name.text, stmt);
  }
  return map;
}

function lineIndent(src, pos) {
  const lineStart = src.lastIndexOf('\n', pos - 1) + 1;
  return src.slice(lineStart, pos).match(/^\s*/)[0];
}

// ---------------------------------------------------------------------------

async function processFile(file, docsByTitle, opts) {
  const original = await readFile(file, 'utf8');
  const sf = ts.createSourceFile(
    file,
    original,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const interfaces = interfaceIndex(sf);
  const edits = []; // { start, end, text }
  const report = {
    file: relative(REPO, file),
    inserted: 0,
    orphans: [],
    undocumented: [],
  };

  for (const [name, decl] of interfaces) {
    const jsdocs = ts.getJSDocCommentsAndTags(decl).filter(ts.isJSDoc);
    const jsdoc = jsdocs[jsdocs.length - 1];
    const raw = jsdoc ? original.slice(jsdoc.pos, jsdoc.end).trim() : '';
    const { tags } = raw ? parsePropertyTags(raw) : { tags: [] };
    if (!tags.length && !jsdoc) continue;

    // Descriptions available for this interface's props, docs page first.
    //
    // EXACT title match only. Falling back to the parent's page for a
    // sub-component (HeroHead -> Hero) borrows descriptions that are wrong in
    // context: Hero's `children` is "Hero content (often includes Hero.Head,
    // Hero.Body, Hero.Foot)", which is nonsense on Hero.Head itself. Where a
    // sub-component has no page, its `@property` lines are the better source.
    const component = name.replace(/Props$/, '');
    const docs = docsByTitle.get(component) ?? new Map();
    const byName = new Map(tags.map(t => [t.name, t.desc]));

    const ownNames = new Set(decl.members.map(memberName).filter(Boolean));

    // Members that lack a comment get one.
    for (const member of decl.members) {
      const mName = memberName(member);
      if (!mName) continue;
      if (hasOwnJsDoc(member)) continue;
      const fromDocs = docs.get(mName);
      const fromTag = byName.get(mName);
      const desc =
        fromDocs && fromTag
          ? fromDocs.length >= fromTag.length
            ? fromDocs
            : fromTag
          : (fromDocs ?? fromTag);
      if (!desc) {
        report.undocumented.push(`${name}.${mName}`);
        continue;
      }
      const start = member.getStart(sf);
      const indent = lineIndent(original, start);
      edits.push({ start, end: start, text: `/** ${desc} */\n${indent}` });
      report.inserted++;
    }

    // Orphans: @property lines with no matching own member. Before parking them
    // as @extraProp, check whether a locally-declared base interface has the
    // member — SliderSingleProps documents 16 props that live on SliderBaseProps.
    const orphans = tags.filter(t => !ownNames.has(t.name));
    const parked = [];
    for (const tag of orphans) {
      let placed = false;
      for (const clause of decl.heritageClauses ?? []) {
        for (const typeNode of clause.types) {
          const baseName = typeNode.expression.getText?.();
          const base = baseName && interfaces.get(baseName);
          if (!base) continue;
          const target = base.members.find(m => memberName(m) === tag.name);
          if (target && !hasOwnJsDoc(target)) {
            const start = target.getStart(sf);
            const indent = lineIndent(original, start);
            const desc = docs.get(tag.name) ?? tag.desc;
            edits.push({
              start,
              end: start,
              text: `/** ${desc} */\n${indent}`,
            });
            report.inserted++;
            placed = true;
          }
        }
      }
      if (!placed) {
        parked.push(tag);
        report.orphans.push(`${name}.${tag.name}`);
      }
    }

    // Rewrite the interface JSDoc: keep the summary, drop @property, park orphans.
    if (jsdoc && tags.length) {
      const { summary } = parsePropertyTags(raw);
      const indent = lineIndent(
        original,
        jsdoc.pos + (original.slice(jsdoc.pos).match(/^\s*/)?.[0].length ?? 0)
      );
      const lines = ['/**'];
      for (const l of (
        summary || `Props for the ${component} component.`
      ).split('\n')) {
        lines.push(` * ${l}`.trimEnd());
      }
      for (const tag of parked) {
        const type = tag.type ? `{${tag.type}} ` : '';
        lines.push(` * @extraProp ${type}[${tag.name}] - ${tag.desc}`);
      }
      lines.push(' */');
      const text = lines.map((l, i) => (i === 0 ? l : indent + l)).join('\n');
      const startsAt = jsdoc.end - raw.length;
      edits.push({ start: startsAt, end: jsdoc.end, text });
    }
  }

  if (!edits.length) return report;

  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  let out = original;
  for (const e of edits)
    out = out.slice(0, e.start) + e.text + out.slice(e.end);

  const config = await prettier.resolveConfig(file);
  out = await prettier.format(out, { ...config, filepath: file });

  if (!opts.dryRun) await writeFile(file, out);
  report.changed = out !== original;
  return report;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const catArg = args.find(a => a.startsWith('--category='));
  if (!catArg) {
    console.error(
      'Usage: node scripts/codemod-property-tsdoc.mjs --category=<dir> [--dry-run]'
    );
    process.exit(2);
  }
  const rawCategory = catArg.slice('--category='.length);

  // Resolve `--category` against the directories that actually exist under
  // src/ rather than interpolating it into a path. This script WRITES the
  // files it finds, so an unvalidated argv segment reaching `join()` is a
  // path-traversal sink (`--category=../../..`), and a typo would otherwise
  // fail with a bare ENOENT instead of naming the valid choices.
  const SRC_ROOT = join(REPO, 'bulma-ui', 'src');
  const categories = (await readdir(SRC_ROOT, { withFileTypes: true }))
    .filter(e => e.isDirectory() && !e.name.startsWith('__'))
    .map(e => e.name)
    .sort();
  const category = categories.find(c => c === rawCategory);
  if (!category) {
    console.error(
      `Unknown --category=${rawCategory}. Valid: ${categories.join(', ')}`
    );
    process.exit(2);
  }

  const docsByTitle = new Map();
  for (const f of await mdFiles(API_DIR)) {
    const src = await readFile(f, 'utf8');
    const title = frontmatterTitle(src);
    if (title) docsByTitle.set(title, parseDocsDescriptions(src));
  }

  const srcDir = join(REPO, 'bulma-ui', 'src', category);
  const files = (await readdir(srcDir))
    .filter(f => /\.tsx?$/.test(f) && !/\.(stories|test)\./.test(f))
    .sort()
    .map(f => join(srcDir, f));

  let inserted = 0;
  const orphans = [];
  const undocumented = [];
  for (const file of files) {
    const r = await processFile(file, docsByTitle, { dryRun });
    inserted += r.inserted;
    orphans.push(...r.orphans);
    undocumented.push(...r.undocumented);
    if (r.inserted) {
      process.stdout.write(
        `${r.changed === false ? '=' : dryRun ? '~' : '✓'} ${basename(file)} — ${r.inserted} member doc(s)\n`
      );
    }
  }

  process.stdout.write(
    `\n${inserted} member TSDoc comment(s) ${dryRun ? 'would be ' : ''}written.\n`
  );
  if (orphans.length) {
    process.stdout.write(
      `\n${orphans.length} @property line(s) had no matching member and were parked as ` +
        `@extraProp (review these — they may be real drift):\n  ${orphans.join('\n  ')}\n`
    );
  }
  if (undocumented.length) {
    process.stdout.write(
      `\n${undocumented.length} member(s) have NO description anywhere — write TSDoc by hand:\n  ` +
        undocumented.join('\n  ') +
        '\n'
    );
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
