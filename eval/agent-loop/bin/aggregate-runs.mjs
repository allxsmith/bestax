#!/usr/bin/env node
// aggregate-runs.mjs — distribution statistics across a runs directory.
//
//   node bin/aggregate-runs.mjs <runs-dir> [--extras <completeness.md>]
//
// Built for a campaign rather than a loop: when the same configuration runs ten times, the
// interesting object is the distribution, not any single scorecard. Prints per-arm mean,
// median and range for the mechanized metrics, plus a per-slot extras hit-rate when an
// addendum is supplied.
//
// Arms are inferred from the run-id prefix (sk*/mc*/…), which is how the campaign names
// them. `brief` from metrics.json is reported alongside so a mislabelled arm is visible
// rather than silently pooled.
//
// Only runs with a metrics.json are considered — the same "is this a datapoint" test the
// batch runner and run-iteration.sh both use. A run killed by a container restart has a
// transcript but no metrics, and must not be counted: its truncation point is arbitrary,
// unlike a budget or timeout kill the rubric can read.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [runsDir, ...rest] = process.argv.slice(2);
if (!runsDir) {
  console.error(
    'usage: aggregate-runs.mjs <runs-dir> [--extras <completeness.md>]'
  );
  process.exit(1);
}
const extrasIdx = rest.indexOf('--extras');
const extrasPath = extrasIdx >= 0 ? rest[extrasIdx + 1] : null;

// The extras roster, scraped from the addendum's §9 table so it cannot drift from the
// grader's authority.
//
// TABLE ROWS ONLY. The section's prose deliberately names components that are NOT slots —
// the casing traps it warns about (`NumberInput`, `TagInput`) and the core-Bulma
// substitutions it tells the grader to reject (`Modal`, `Button`). Scraping the whole
// section pulled all four in as if they were expected extras.
function loadSlots(path) {
  const md = readFileSync(path, 'utf8');
  const start = md.indexOf('## Expected extras');
  if (start < 0) return null;
  const end = md.indexOf('\n## ', start + 1);
  const section = md.slice(start, end < 0 ? undefined : end);
  const names = new Set();
  for (const line of section.split('\n')) {
    if (!line.trimStart().startsWith('|')) continue;
    if (/^\s*\|[\s|:-]*\|?\s*$/.test(line)) continue; // separator row
    // Skip the header row: it has no backticked names anyway, but be explicit.
    for (const m of line.matchAll(/`([A-Z][A-Za-z]+)`/g)) names.add(m[1]);
  }
  return [...names];
}

const runs = readdirSync(runsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort()
  .map(id => {
    const p = join(runsDir, id, 'metrics.json');
    return existsSync(p)
      ? { id, m: JSON.parse(readFileSync(p, 'utf8')) }
      : null;
  })
  .filter(Boolean);

if (!runs.length) {
  console.error(`no runs with metrics.json under ${runsDir}`);
  process.exit(1);
}

const armOf = id => id.replace(/[0-9]+$/, '') || 'all';
const arms = [...new Set(runs.map(r => armOf(r.id)))].sort();

const stat = xs => {
  const v = xs.filter(x => typeof x === 'number').sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return {
    n: v.length,
    mean: v.reduce((a, b) => a + b, 0) / v.length,
    median: v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2,
    min: v[0],
    max: v[v.length - 1],
  };
};

const FIELDS = [
  ['bestax_named_imports', 0],
  ['custom_css_added_lines', 0],
  ['inline_style_count', 0],
  ['raw_bulma_classnames', 0],
  ['handrolled_total', 0],
  ['tsc_errors', 0],
  ['src_total_lines', 0],
  ['num_turns', 0],
  ['duration_s', 0],
  ['cost_usd', 2],
];

const fmt = (x, d) => (x == null ? '—' : x.toFixed(d));

for (const arm of arms) {
  const rs = runs.filter(r => armOf(r.id) === arm);
  const briefs = [...new Set(rs.map(r => r.m.brief))];
  console.log(
    `\n=== arm "${arm}"  n=${rs.length}  brief(s): ${briefs.join(', ')} ===`
  );
  console.log(`    runs: ${rs.map(r => r.id).join(' ')}`);
  const green = rs.filter(r => r.m.build_pass && r.m.tsc_errors === 0).length;
  const ok = rs.filter(r => r.m.result_subtype === 'success').length;
  console.log(
    `    green builds: ${green}/${rs.length}   not truncated: ${ok}/${rs.length}`
  );
  console.log(
    `    ${'field'.padEnd(24)} ${'mean'.padStart(9)} ${'median'.padStart(9)} ${'min'.padStart(8)} ${'max'.padStart(8)}`
  );
  for (const [f, d] of FIELDS) {
    const s = stat(rs.map(r => r.m[f]));
    if (!s) continue;
    console.log(
      `    ${f.padEnd(24)} ${fmt(s.mean, d).padStart(9)} ${fmt(s.median, d).padStart(9)} ${fmt(s.min, d).padStart(8)} ${fmt(s.max, d).padStart(8)}`
    );
  }

  if (extrasPath && existsSync(extrasPath)) {
    const slots = loadSlots(extrasPath);
    if (slots) {
      console.log(
        `\n    extras hit-rate (presence in bestax_import_list, n=${rs.length}):`
      );
      const rows = slots
        .map(s => ({
          s,
          hits: rs.filter(r => r.m.bestax_import_list?.includes(s)).length,
        }))
        .sort((a, b) => a.hits - b.hits || a.s.localeCompare(b.s));
      for (const { s, hits } of rows) {
        const pct = Math.round((hits / rs.length) * 100);
        console.log(
          `      ${s.padEnd(16)} ${String(hits).padStart(2)}/${rs.length}  ${String(pct).padStart(3)}%`
        );
      }
      console.log(
        '      (presence only — rubric-v2 §9 also requires each to be load-bearing)'
      );
    }
  }
}

console.log(`\ntotal runs with metrics: ${runs.length}`);
console.log(
  `total recorded spend: $${runs.reduce((a, r) => a + (r.m.cost_usd ?? 0), 0).toFixed(2)}`
);
