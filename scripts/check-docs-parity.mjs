#!/usr/bin/env node
/**
 * MIGRATION GATE: prove that generating an API page did not lose anything the
 * hand-written page said.
 *
 * Every page under docs/docs/api is compared against its pre-migration self
 * (`origin/main` by default) and the run fails on any of:
 *
 *   - a prop the old table documented that the new one does not
 *   - a `Default` value that no longer appears for that prop
 *   - a distinctive word from a description that survives nowhere in the row
 *   - a URL that is no longer linked
 *   - a ```tsx live example whose body is not byte-identical
 *   - a line of prose (outside tables and fences) that no longer appears
 *
 * Spot-checking a few pages is how the boolean-default regression got through
 * on the pilot; this checks all 87. It is deliberately noisy about differences
 * it cannot prove are safe — read every hit rather than tuning the rules until
 * it passes.
 *
 * This is a migration tool, not permanent CI: once the migration lands,
 * `origin/main` becomes the new baseline and `docs-generated` in
 * check-conformance.mjs holds the line instead.
 *
 * Usage:
 *   node scripts/check-docs-parity.mjs [--category=elements] [--base=origin/main]
 */
import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const API_DIR = join(REPO, 'docs', 'docs', 'api');

// Words too common to prove anything by their absence. Anything that carries
// meaning about a prop — "centered", "shadow", "readonly" — is NOT here.
const STOPWORDS = new Set(
  (
    'a an and are as at be by can component do does e for from g have has i if ' +
    'in into is it its of on or s that the their then there these this to use ' +
    'used uses using was when where which will with you your not no also only ' +
    'each any all one two both same other than more most such via so'
  ).split(' ')
);

async function mdFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await mdFiles(full)));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out.sort();
}

function gitShow(base, relPath) {
  try {
    return execFileSync('git', ['show', `${base}:${relPath}`], {
      cwd: REPO,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch {
    return null; // new page, nothing to compare against
  }
}

// ---------------------------------------------------------------------------
// Parsing. Fence-aware throughout: helpers/theme.md has `---` inside fences and
// several pages have pipe characters inside code examples.
// ---------------------------------------------------------------------------

function scan(src) {
  const lines = src.split(/\r?\n/);
  const tableRows = []; // cell arrays
  const prose = [];
  const fences = []; // { info, body }
  let fence = null;

  for (const line of lines) {
    const open = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (
        open &&
        open[1][0] === fence.marker[0] &&
        open[1].length >= fence.marker.length &&
        !open[2].trim()
      ) {
        fences.push({ info: fence.info, body: fence.body.join('\n') });
        fence = null;
      } else {
        fence.body.push(line);
      }
      continue;
    }
    if (open) {
      fence = { marker: open[1], info: open[2].trim(), body: [] };
      continue;
    }
    const t = line.trim();
    if (t.startsWith('|') && t.endsWith('|')) {
      const cells = t
        .replace(/^\||\|$/g, '')
        .split(/(?<!\\)\|/)
        .map(c => c.trim());
      if (!/^:?-{2,}/.test(cells[0])) tableRows.push(cells);
      continue;
    }
    if (!t || t === '---' || /^<!--/.test(t)) continue;
    prose.push(t);
  }
  return { tableRows, prose, fences };
}

/**
 * Prop name -> the whole row, joined. Keyed by the first cell with backticks
 * stripped, which is how every table shape in the repo names its prop, and
 * matching against the JOINED row rather than the description cell alone —
 * "(default: `true`)" legitimately migrates from the description into the
 * Default column.
 */
function propRows(src) {
  const out = new Map();
  // Header tracked PER TABLE. Pages mix 3-column (`Prop | Type | Description`)
  // and 4-column tables, so a page-wide header reads the description of a
  // 3-column row as its default.
  let header = null;
  for (const cells of scan(src).tableRows) {
    if (/^(prop|field|name)$/i.test(cells[0])) {
      header = cells;
      continue;
    }
    const name = cells[0].replace(/`/g, '').trim();
    if (!name || name === '...') continue;
    if (/^--/.test(name)) continue; // CSS variable tables
    // Prefer a row from a table that HAS a Default column. Several pages carry
    // a short 2-column summary table before the real props table; taking the
    // first occurrence reads every default there as "absent".
    const hasDefault = (header?.indexOf('Default') ?? -1) >= 0;
    const prev = out.get(name);
    if (!prev) {
      out.set(name, { cells, header, all: [cells] });
      continue;
    }
    // Keep EVERY table's row for this name. A page can document `label` twice —
    // once as a component prop, once as a field of a type it accepts — and
    // matching only one of them reports the other's wording as lost.
    prev.all.push(cells);
    if (hasDefault && (prev.header?.indexOf('Default') ?? -1) < 0) {
      out.set(name, { cells, header, all: prev.all });
    }
  }
  return out;
}

/** `Default` column value, or null when the table has no such column. */
function defaultCell(row) {
  const i = row.header?.indexOf('Default') ?? -1;
  const cell = i >= 0 ? row.cells[i] : null;
  return cell ? cell.replace(/`/g, '').trim() : null;
}

function codeSpans(text) {
  return [...text.matchAll(/`([^`]+)`/g)].map(m => m[1]);
}

function words(text) {
  return [
    ...new Set(
      text
        .replace(/`[^`]*`/g, ' ') // code spans compared separately, verbatim
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .toLowerCase()
        .split(/[^a-z0-9-]+/)
        .filter(w => w.length > 2 && !STOPWORDS.has(w))
        // Stemmed: a description rewritten from "Disables the input" to
        // "Disabled state" has not lost the word, only its inflection.
        .map(w => w.replace(/(ings|ing|edly|ed|es|s)$/, ''))
        .filter(Boolean)
    ),
  ];
}

/**
 * Stem every word in a string. Token-wise, not a global regex: applying the
 * suffix strip to raw text turns "typed-digit" into "typ-digit" and "is-active"
 * into "i-active", which then match nothing.
 */
function stemAll(text) {
  return text
    .toLowerCase()
    .replace(/[a-z0-9-]+/g, w => w.replace(/(ings|ing|edly|ed|es|s)$/, ''));
}

function urls(src) {
  return new Set([...src.matchAll(/https?:\/\/[^\s)<>"'\]]+/g)].map(m => m[0]));
}

// ---------------------------------------------------------------------------

/**
 * The colour literals that `[Bulma color](../helpers/valid-values.md)` stands
 * in for. Replacing a 19-member union with that link is the single biggest
 * readability win in the generated tables, but it does drop the literals from
 * the cell — so it only counts as safe for spans the linked page really lists.
 */
let validValues = null;
async function validValueSpans() {
  if (validValues) return validValues;
  // Read the real arrays, not valid-values.md — that page abbreviates the
  // colour list with an ellipsis, so half the literals are not on it.
  const src = await readFile(
    join(REPO, 'bulma-ui', 'src', 'helpers', 'bulmaClassHelpers.ts'),
    'utf8'
  );
  validValues = new Set();
  for (const m of src.matchAll(/const valid\w+ = \[([\s\S]*?)\] as const/g)) {
    for (const lit of m[1].matchAll(/'([^']*)'/g)) {
      validValues.add(`'${lit[1]}'`);
      validValues.add(lit[1]);
    }
  }
  return validValues;
}

function comparePage(relPath, before, after, covered) {
  const losses = [];
  const add = (kind, detail) => losses.push({ kind, detail });

  const oldRows = propRows(before);
  const newRows = propRows(after);
  const newHaystack = [...newRows.values()]
    .flatMap(r => r.all.map(c => c.join(' | ')))
    .join('\n');

  // `**Types:**` footnotes define the aliases a cell is allowed to name instead
  // of expanding. A row that says `BulmaGapValue` carries everything its
  // definition says, so fold the definition into that row before comparing.
  const typeDefs = new Map(
    [...after.matchAll(/^-[ \t]+`([\w.]+)`:[ \t]*(.+)$/gm)].map(m => [
      m[1],
      m[2],
    ])
  );
  const expand = row => {
    let out = row;
    for (const [name, def] of typeDefs) {
      if (row.includes(name)) out += ` | ${def}`;
    }
    return out;
  };

  for (const [name, old] of oldRows) {
    const cells = old.cells;
    // Prose-y cells like `m`/`p` name a family of helper props, not one prop;
    // the catch-all row covers them and there is nothing to match on.
    if (!/^[\w'"$-]+$/.test(name)) continue;
    const target = newRows.get(name);
    if (!target) {
      add('prop', `\`${name}\` is documented in ${relPath} but not generated`);
      continue;
    }
    const row = expand(target.all.map(c => c.join(' | ')).join('\n'));

    const oldDefault = defaultCell(old);
    const newDefault = defaultCell(target);
    if (oldDefault && oldDefault !== '—' && newDefault !== oldDefault) {
      if (!row.includes(oldDefault)) {
        add(
          'default',
          `\`${name}\` default was \`${oldDefault}\`, now ${newDefault ? `\`${newDefault}\`` : 'absent'}`
        );
      }
    }

    const linksValidValues = row.includes('valid-values.md');
    // The TYPE cell is the one place the generator is MEANT to differ: it reads
    // the real type, so a hand-copied `React.Ref<HTMLElement>` becoming
    // `React.Ref<HTMLDivElement>`, or `function` becoming the real signature,
    // is a correction rather than a loss. What a reader cannot lose from a type
    // cell is its enumerable values, so only literal spans are held to account
    // there. Every span in the description is still checked in full.
    const typeIdx = old.header?.findIndex(h => /^type$/i.test(h)) ?? -1;
    const isLiteral = t =>
      /^(['"].*['"]|-?\d+(\.\d+)?|true|false|null)$/.test(t);
    // Prose words are only checked against the DESCRIPTION cell. Old type
    // cells contain prose of their own ("as above", "see docs") whose wording
    // a generated cell has no reason to reproduce; what a type cell actually
    // says is compared as code spans, just below.
    const oldDescription = cells[cells.length - 1];
    const spans = cells.flatMap((cell, i) =>
      i === 0
        ? []
        : codeSpans(cell).map(span => ({ span, type: i === typeIdx }))
    );
    for (const { span, type: fromType } of spans) {
      // A union the old page wrapped in ONE code span is now one span per
      // member, so check the members individually before calling it a loss.
      const parts = span
        .split(/\\?\||,/)
        .map(p => p.trim())
        .filter(Boolean);
      const present = p =>
        row.includes(p) ||
        newHaystack.includes(p) ||
        (linksValidValues && covered.has(p)) ||
        p === '...' ||
        p === '…';
      if (parts.every(present)) continue;
      const lost = parts.filter(
        p => !present(p) && (!fromType || isLiteral(p))
      );
      if (!lost.length) continue;
      add(
        'code',
        `\`${name}\`: ${lost.map(p => `\`${p}\``).join(', ')} no longer appears`
      );
    }
    for (const w of words(oldDescription)) {
      if (!stemAll(row).includes(w)) {
        add('word', `\`${name}\`: "${w}" no longer appears in its row`);
      }
    }
  }

  const beforeScan = scan(before);
  const afterScan = scan(after);

  const afterFences = new Set(afterScan.fences.map(f => f.body));
  for (const f of beforeScan.fences) {
    if (!/\blive\b/.test(f.info)) continue;
    if (!afterFences.has(f.body)) {
      add('example', `live example changed:\n${f.body.split('\n')[0]}…`);
    }
  }

  // Sentence-level, not line-level: the Overview marker splits the opening
  // paragraph in two (generated first sentence, hand-written remainder), so a
  // line-for-line comparison reports every migrated page as having lost prose
  // it still carries verbatim.
  // Compared case- and punctuation-insensitively: an em dash rewritten as a
  // colon is not a lost sentence, and flagging it buries the real losses.
  const norm = t =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  // A sentence survives if some line of the new page still carries all of its
  // content words. Substring matching would flag "For forms." as lost when the
  // page now says "For labeled/structured forms." — a rewrite, not a loss.
  const afterLines = afterScan.prose.map(norm);
  const afterAll = afterLines.join(' | ');
  for (const line of beforeScan.prose) {
    for (const sentence of line.split(/(?<=[.:!?])\s+/)) {
      const s = norm(sentence);
      if (s.length <= 2) continue;
      if (afterAll.includes(s)) continue;
      const need = s.split(' ').filter(w => w.length > 2 && !STOPWORDS.has(w));
      if (!need.length) continue;
      if (afterLines.some(l => need.every(w => l.includes(w)))) continue;
      add('prose', `dropped: ${sentence.trim()}`);
    }
  }

  const afterUrls = urls(after);
  for (const u of urls(before)) {
    if (!afterUrls.has(u)) add('url', `link dropped: ${u}`);
  }

  return losses;
}

async function main() {
  const args = process.argv.slice(2);
  const base =
    args.find(a => a.startsWith('--base='))?.slice('--base='.length) ??
    'origin/main';
  const category = args
    .find(a => a.startsWith('--category='))
    ?.slice('--category='.length);

  const covered = await validValueSpans();

  let checked = 0;
  let failed = 0;
  let total = 0;

  for (const file of await mdFiles(API_DIR)) {
    const rel = relative(REPO, file).split('\\').join('/');
    const apiRel = relative(API_DIR, file).split('\\').join('/');
    if (category && apiRel.split('/')[0] !== category) continue;

    const before = gitShow(base, rel);
    if (before == null) continue;
    const after = await readFile(file, 'utf8');
    checked++;
    if (before === after) continue;

    const losses = comparePage(apiRel, before, after, covered);
    if (!losses.length) continue;
    failed++;
    total += losses.length;
    process.stdout.write(`\n✗ ${rel} — ${losses.length} loss(es)\n`);
    for (const l of losses) {
      process.stdout.write(`    [${l.kind}] ${l.detail}\n`);
    }
  }

  process.stdout.write(
    `\n${checked} page(s) compared against ${base}: ` +
      `${failed} with losses, ${total} loss(es) total.\n`
  );
  if (total) process.exit(1);
}

main().catch(err => {
  console.error(err.message ?? err);
  process.exit(1);
});
