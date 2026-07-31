#!/usr/bin/env node
/**
 * REVIEW AID: for every prop the hand-written pages already documented, show
 * how its Description cell changed.
 *
 * `check-docs-parity.mjs` proves nothing was LOST — every distinctive word from
 * the old cell still appears in the new row. That is a different question from
 * "did the wording get worse". A description can keep all its words and still
 * read badly, because the codemod had two hand-written sources for each prop
 * (the docs table and the source comment) and merged them: where neither
 * contained the other it kept BOTH sentences, page first.
 *
 * So this reports the changes rather than judging them, bucketed by why they
 * differ. Only props present in the old page are considered — a prop the tables
 * never documented has no prior wording to regress from.
 *
 *   unchanged  identical after whitespace normalisation
 *   extended   the old sentence survives verbatim, with more appended
 *   merged     both sources kept, docs text first (read these)
 *   replaced   the new text does not contain the old one (read these FIRST)
 *
 * Usage:
 *   node scripts/check-docs-wording.mjs [--category=elements] [--base=origin/main]
 *   node scripts/check-docs-wording.mjs --only=replaced,merged
 */
import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const API_DIR = join(REPO, 'docs', 'docs', 'api');

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
    return null;
  }
}

/**
 * prop name -> Description cell, for every table on the page. Fence-aware, and
 * header-per-table because pages mix 3- and 4-column shapes — reading the last
 * cell works for both, which is why the description is taken from the end.
 */
function descriptions(src) {
  const out = new Map();
  const lines = src.split(/\r?\n/);
  let fence = null;
  let headers = null;

  for (const line of lines) {
    const open = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (open && open[1][0] === fence[0] && open[1].length >= fence.length) {
        fence = null;
      }
      continue;
    }
    if (open) {
      fence = open[1];
      continue;
    }
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
    if (/^:?-{2,}/.test(cells[0])) continue;
    const name = cells[0].replace(/`/g, '').trim();
    const desc = cells[cells.length - 1].trim();
    if (!name || name === '...' || /^--/.test(name)) continue;
    if (!desc || desc === '—') continue;
    // EVERY table's row for this name, not just the first. A page can document
    // `label` twice — once as a component prop, once as a field of a type it
    // accepts — and comparing the wrong one invents changes that did not happen.
    if (!out.has(name)) out.set(name, []);
    out.get(name).push(desc);
  }
  return out;
}

const norm = t => t.replace(/\\\|/g, '|').replace(/\s+/g, ' ').trim();
const loose = t =>
  norm(t)
    .toLowerCase()
    .replace(/[.\s]+$/, '');

function classify(before, after) {
  if (norm(before) === norm(after)) return 'unchanged';
  const b = loose(before);
  const a = loose(after);
  if (a.startsWith(b)) return 'extended';
  if (a.includes(b)) return 'merged';
  return 'replaced';
}

async function main() {
  const args = process.argv.slice(2);
  const base =
    args.find(a => a.startsWith('--base='))?.slice('--base='.length) ??
    'origin/main';
  const category = args
    .find(a => a.startsWith('--category='))
    ?.slice('--category='.length);
  const only = args
    .find(a => a.startsWith('--only='))
    ?.slice('--only='.length)
    .split(',');

  const counts = { unchanged: 0, extended: 0, merged: 0, replaced: 0 };
  const byPage = new Map();

  for (const file of await mdFiles(API_DIR)) {
    const rel = relative(REPO, file).split('\\').join('/');
    const apiRel = relative(API_DIR, file).split('\\').join('/');
    if (category && apiRel.split('/')[0] !== category) continue;

    const before = gitShow(base, rel);
    if (before == null) continue;
    const oldDesc = descriptions(before);
    if (!oldDesc.size) continue;
    const newDesc = descriptions(await readFile(file, 'utf8'));

    for (const [name, wasList] of oldDesc) {
      const nowList = newDesc.get(name);
      if (!nowList) continue; // parity check owns dropped props
      // Best pairing wins: with several rows for a name, a prop is only changed
      // if NO old wording survives on any of the new rows.
      const rank = { unchanged: 0, extended: 1, merged: 2, replaced: 3 };
      let best = null;
      for (const was of wasList) {
        for (const now of nowList) {
          const kind = classify(was, now);
          if (!best || rank[kind] < rank[best.kind]) best = { kind, was, now };
        }
      }
      counts[best.kind]++;
      if (best.kind === 'unchanged') continue;
      if (only && !only.includes(best.kind)) continue;
      if (!byPage.has(apiRel)) byPage.set(apiRel, []);
      byPage.get(apiRel).push({
        name,
        kind: best.kind,
        was: norm(best.was),
        now: norm(best.now),
      });
    }
  }

  for (const [page, entries] of byPage) {
    process.stdout.write(`\n${page}\n`);
    for (const e of entries) {
      process.stdout.write(`  [${e.kind}] \`${e.name}\`\n`);
      process.stdout.write(`      was: ${e.was}\n`);
      process.stdout.write(`      now: ${e.now}\n`);
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  process.stdout.write(
    `\n${total} previously-documented prop(s) compared against ${base}\n` +
      `  unchanged ${counts.unchanged}\n` +
      `  extended  ${counts.extended}  (old sentence intact, more appended)\n` +
      `  merged    ${counts.merged}  (both sources kept)\n` +
      `  replaced  ${counts.replaced}  (old sentence NOT contained — review)\n`
  );
}

main().catch(err => {
  console.error(err.message ?? err);
  process.exit(1);
});
