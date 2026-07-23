#!/usr/bin/env node
// collect-metrics.mjs <appDir> <transcript.jsonl>
// Mechanized metrics for the skill-loop experiment. Prints one JSON object to stdout.
// Requires: appDir is a git repo with a tag/ref "baseline" (the pristine scaffold commit).

import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const [appDir, transcriptPath] = process.argv.slice(2);
if (!appDir) {
  console.error('usage: collect-metrics.mjs <appDir> [transcript.jsonl]');
  process.exit(1);
}

const run = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, {
    cwd: appDir,
    encoding: 'utf8',
    timeout: opts.timeout ?? 300_000,
    maxBuffer: 64 * 1024 * 1024,
    ...opts,
  });

// ---- source inventory -------------------------------------------------------
const srcFiles = [];
const walk = dir => {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'dist') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(tsx?|css|scss|sass)$/.test(name)) srcFiles.push(p);
  }
};
if (existsSync(join(appDir, 'src'))) walk(join(appDir, 'src'));
const read = p => readFileSync(p, 'utf8');
const tsxFiles = srcFiles.filter(p => /\.tsx?$/.test(p));
const tsxText = tsxFiles.map(p => ({ p: relative(appDir, p), text: read(p) }));

const countAll = (re, files = tsxText) =>
  files.reduce((n, f) => n + (f.text.match(re) ?? []).length, 0);

// ---- typecheck + build ------------------------------------------------------
// Run tsc via the app's own binary; count distinct "error TS" diagnostics.
const tsc = run('npx', ['tsc', '-b', '--pretty', 'false', '--force']);
const tscOut = `${tsc.stdout ?? ''}${tsc.stderr ?? ''}`;
const tsc_errors = (tscOut.match(/error TS\d+/g) ?? []).length;
const vite = run('npx', ['vite', 'build'], { timeout: 420_000 });
const build_pass = tsc.status === 0 && vite.status === 0;

// ---- code metrics -----------------------------------------------------------
const inline_style_count = countAll(/style=\{\{/g);
const raw_bulma_classnames = countAll(
  /className\s*=\s*(?:"[^"]*\b(?:is-|has-)[^"]*"|'[^']*\b(?:is-|has-)[^']*'|\{`[^`]*\b(?:is-|has-)[^`]*`\})/g
);
const HANDROLLED = ['button', 'table', 'nav', 'footer', 'section', 'input', 'select', 'textarea', 'label'];
const handrolled_tags = Object.fromEntries(
  HANDROLLED.map(t => [t, countAll(new RegExp(`<${t}[\\s>/]`, 'g'))])
);
const handrolled_total = Object.values(handrolled_tags).reduce((a, b) => a + b, 0);

const importSet = new Set();
for (const f of tsxText) {
  for (const m of f.text.matchAll(
    /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]@allxsmith\/bestax-bulma['"]/g
  )) {
    m[1]
      .split(',')
      .map(s => s.trim().split(/\s+as\s+/)[0].trim())
      .filter(Boolean)
      .forEach(id => importSet.add(id));
  }
}

// ---- diffs vs pristine scaffold ---------------------------------------------
const diffCss = run('git', ['diff', 'baseline', '--', '*.css', '*.scss', '*.sass']);
const custom_css_added_lines = (diffCss.stdout ?? '')
  .split('\n')
  .filter(l => l.startsWith('+') && !l.startsWith('+++')).length;
const nameStatus = run('git', ['diff', '--name-status', 'baseline']);
const css_files_added = (nameStatus.stdout ?? '')
  .split('\n')
  .filter(l => /^A\t.*\.(css|scss|sass)$/.test(l)).length;

let deps_added = [];
try {
  const basePkg = JSON.parse(run('git', ['show', 'baseline:package.json']).stdout);
  const nowPkg = JSON.parse(read(join(appDir, 'package.json')));
  const keys = o => Object.keys({ ...o.dependencies, ...o.devDependencies });
  deps_added = keys(nowPkg).filter(k => !keys(basePkg).includes(k));
} catch { /* leave empty */ }

// ---- transcript metrics -----------------------------------------------------
let transcript = {
  skill_file_reads: null, skill_files: null, skill_invocations: null,
  claude_md_read: null, docs_fetches: null, docs_urls: null, web_calls_total: null,
  num_turns: null, duration_s: null, cost_usd: null, result_subtype: null, is_error: null,
};
if (transcriptPath && existsSync(transcriptPath)) {
  const skillFiles = new Set();
  let skillReads = 0, skillInvocations = 0, claudeMdRead = false, webTotal = 0;
  const docsUrls = new Set();
  let result = null;
  for (const line of read(transcriptPath).split('\n')) {
    if (!line.trim()) continue;
    let ev;
    try { ev = JSON.parse(line); } catch { continue; }
    if (ev.type === 'result') result = ev;
    const content = ev?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (block?.type !== 'tool_use') continue;
      const inputStr = JSON.stringify(block.input ?? {});
      if (block.name === 'Skill') skillInvocations++;
      if (inputStr.includes('.claude/skills/')) {
        skillReads++;
        const fp = block.input?.file_path ?? block.input?.path;
        if (typeof fp === 'string' && fp.includes('.claude/skills/')) skillFiles.add(fp.split('.claude/skills/')[1]);
      }
      if (/CLAUDE\.md/.test(inputStr) && ['Read', 'Grep'].includes(block.name)) claudeMdRead = true;
      if (['WebFetch', 'WebSearch'].includes(block.name)) {
        webTotal++;
        for (const m of inputStr.matchAll(/https?:\/\/[^"\\\s]*bestax\.io[^"\\\s]*/g)) docsUrls.add(m[0]);
      }
    }
  }
  transcript = {
    skill_file_reads: skillReads,
    skill_files: [...skillFiles].sort(),
    skill_invocations: skillInvocations,
    claude_md_read: claudeMdRead,
    docs_fetches: docsUrls.size,
    docs_urls: [...docsUrls].sort(),
    web_calls_total: webTotal,
    num_turns: result?.num_turns ?? null,
    duration_s: result?.duration_ms != null ? Math.round(result.duration_ms / 1000) : null,
    cost_usd: result?.total_cost_usd ?? null,
    result_subtype: result?.subtype ?? null,
    is_error: result?.is_error ?? null,
  };
}

console.log(JSON.stringify({
  app_dir: appDir,
  tsc_errors,
  build_pass,
  inline_style_count,
  raw_bulma_classnames,
  handrolled_tags,
  handrolled_total,
  bestax_named_imports: importSet.size,
  bestax_import_list: [...importSet].sort(),
  custom_css_added_lines,
  css_files_added,
  deps_added,
  src_tsx_files: tsxFiles.length,
  src_total_lines: tsxText.reduce((n, f) => n + f.text.split('\n').length, 0),
  ...transcript,
}, null, 2));
