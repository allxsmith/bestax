#!/usr/bin/env node
/**
 * check-skill-reach.mjs — did a guidance edit actually reach the builder?
 *
 * `metrics.json`'s `skill_files` counts explicit reads under `.claude/skills/`. It cannot
 * see an auto-triggered SKILL.md, which Claude Code injects with no tool call — so a run
 * that had the whole skill in context reads as "engaged with nothing". That gap is not
 * cosmetic: it is the difference between "the guidance failed" and "the guidance was never
 * delivered", and those call for opposite fixes.
 *
 * The transcript settles it. If a skill's body was in context, its distinctive text is in
 * the transcript; if only its front-matter description was listed in the available-skills
 * manifest, it is not. So each marker is searched for verbatim, and the skill *name* is
 * reported separately because a name match alone proves only that the skill was offered.
 *
 * Usage:
 *   bin/check-skill-reach.mjs <runs-dir> [--json]
 *
 * Markers are the exact headings/strings a guidance edit introduced. Keep them unique
 * enough that a builder could not coin them independently — a heading is good, a common
 * phrase is not.
 */
import fs from 'node:fs';
import path from 'node:path';

import { scoreRun } from './lib/extras-usage.mjs';

const MARKERS = [
  {
    id: 'near-miss-table',
    skill: 'bestax-layout-scaffold',
    text: 'Three components core Bulma will talk you out of',
    what: 'the Toast/Dialog/LinkButton near-miss table (22dcff7)',
  },
  {
    id: 'form-after-submit',
    skill: 'bestax-form',
    text: 'What happens after submit',
    what: 'the Toast/Dialog post-submit section (22dcff7)',
  },
  {
    id: 'shadow-recipe',
    skill: 'bestax-layout-scaffold',
    text: 'featured-ring',
    what: 'the corrected --bulma-shadow CSS recipe (2935bb2)',
  },
];

const runsDir = process.argv[2];
if (!runsDir) {
  console.error('usage: check-skill-reach.mjs <runs-dir> [--json]');
  process.exit(2);
}
const asJson = process.argv.includes('--json');

const runs = fs
  .readdirSync(runsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .filter(n => fs.existsSync(path.join(runsDir, n, 'transcript.jsonl')))
  .sort();

const rows = [];
for (const run of runs) {
  const transcript = fs.readFileSync(
    path.join(runsDir, run, 'transcript.jsonl'),
    'utf8'
  );
  const row = { run, markers: {}, skillNamed: {} };
  for (const m of MARKERS) {
    row.markers[m.id] = transcript.includes(m.text);
    // A name match means the skill was *offered* (it is in the manifest of every run).
    // Only the body marker means it was delivered.
    row.skillNamed[m.skill] = transcript.includes(m.skill);
  }
  // A run still in flight has a transcript (written live) and no metrics.json. Its import
  // list is UNKNOWN, not empty — rendering that as a miss would report an unfinished arm as
  // a failed one. `done` gates every count below.
  let metrics = null;
  try {
    metrics = JSON.parse(
      fs.readFileSync(path.join(runsDir, run, 'metrics.json'), 'utf8')
    );
  } catch {
    /* still building */
  }
  row.done = metrics !== null;
  // Call sites, not import names. `import { ToastContainer, toast }` puts no symbol called
  // Toast in the list, which is how an arm that used Toast in all ten runs was published as
  // 0/10. See bin/lib/extras-usage.mjs.
  const { used } = row.done
    ? scoreRun(path.join(runsDir, run), ['Toast', 'Dialog', 'LinkButton'])
    : { used: null };
  row.toast = used ? used.has('Toast') : null;
  row.dialog = used ? used.has('Dialog') : null;
  row.linkButton = used ? used.has('LinkButton') : null;
  row.inlineStyles = metrics?.inline_style_count ?? null;
  rows.push(row);
}

if (asJson) {
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

console.log(`\n${runsDir} — did the guidance reach the builder?\n`);
for (const m of MARKERS) {
  const hit = rows.filter(r => r.markers[m.id]).length;
  console.log(`  ${m.id.padEnd(18)} ${hit}/${rows.length}  ${m.what}`);
}

const done = rows.filter(r => r.done);
const building = rows.length - done.length;
if (building) {
  console.log(
    `\n  ${building} run(s) still building — their component columns read "?", not a miss.`
  );
}

console.log('\n  run    table  form  shadow | Toast Dialog LinkBtn | inline');
console.log('  ' + '-'.repeat(64));
for (const r of rows) {
  const yn = b => (b === null ? '  ?  ' : b ? ' yes ' : '  .  ');
  console.log(
    `  ${r.run.padEnd(6)} ${yn(r.markers['near-miss-table'])} ${yn(
      r.markers['form-after-submit']
    )}${yn(r.markers['shadow-recipe'])}|${yn(r.toast)}${yn(r.dialog)}${yn(
      r.linkButton
    )}  |  ${String(r.inlineStyles ?? '-').padStart(3)}`
  );
}

// The mechanism check: among FINISHED runs the table actually reached, how often was each
// component used? A denominator of zero is reported as such rather than as 0%, because
// "never delivered" and "delivered and ignored" are different results.
const reached = done.filter(r => r.markers['near-miss-table']);
const missed = done.filter(r => !r.markers['near-miss-table']);
console.log('\n  Mechanism check (near-miss table):');
for (const [label, set] of [
  ['table in context', reached],
  ['table absent', missed],
]) {
  if (!set.length) {
    console.log(`    ${label.padEnd(18)} n=0 — nothing to conclude`);
    continue;
  }
  const c = k => set.filter(r => r[k]).length;
  console.log(
    `    ${label.padEnd(18)} n=${set.length}  Toast ${c('toast')}/${
      set.length
    }  Dialog ${c('dialog')}/${set.length}  LinkButton ${c('linkButton')}/${
      set.length
    }`
  );
}
console.log('');
