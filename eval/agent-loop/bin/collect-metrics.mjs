#!/usr/bin/env node
// collect-metrics.mjs <appDir> <transcript.jsonl>
// Mechanized metrics for the agent-loop eval harness. Prints one JSON object to stdout.
// Requires: appDir is a git repo with a tag/ref "baseline" (the pristine scaffold commit).

import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { harvestSkillPaths } from './lib/skill-paths.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const [appDir, transcriptPath, runMetaArg] = process.argv.slice(2);
if (!appDir) {
  console.error(
    'usage: collect-metrics.mjs <appDir> [transcript.jsonl] [run-meta-json|brief-name]'
  );
  process.exit(1);
}

// Run identity. Without it a runs/ directory cannot be split back into loops or variants,
// and "the previous run of the same variant" stops being mechanically determinable — which
// is how an improver ends up comparing against another loop's evidence.
// Accepts a JSON object, or a bare string meaning the brief name alone.
let runMeta = {
  brief: null,
  model: null,
  budget_usd: null,
  timeout_s: null,
  tooling_rev: null,
};
if (runMetaArg) {
  if (runMetaArg.trimStart().startsWith('{')) {
    try {
      runMeta = { ...runMeta, ...JSON.parse(runMetaArg) };
    } catch (e) {
      // Loud, but not fatal: the measurements are still valid and the build was expensive.
      console.error(
        `warning: unparseable run-meta, identity omitted — ${e.message}`
      );
    }
  } else {
    runMeta = { ...runMeta, brief: runMetaArg };
  }
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

// ---- diffs vs pristine scaffold ---------------------------------------------
// MUST run BEFORE the typecheck+build below. Those write into the app, so measuring
// afterwards could count OUR artifacts as the builder's work and mark every run modified,
// defeating the rubric gate.
const diffCss = run('git', [
  'diff',
  'baseline',
  '--',
  '*.css',
  '*.scss',
  '*.sass',
]);
const custom_css_added_lines = (diffCss.stdout ?? '')
  .split('\n')
  .filter(l => l.startsWith('+') && !l.startsWith('+++')).length;
const nameStatus = run('git', ['diff', '--name-status', 'baseline']);
const css_files_added = (nameStatus.stdout ?? '')
  .split('\n')
  .filter(l => /^A\t.*\.(css|scss|sass)$/.test(l)).length;

// Did the builder change anything at all? The pristine scaffold typechecks and builds
// cleanly, so `build_pass=true, tsc_errors=0` is also exactly what an UNTOUCHED app
// reports — the rubric gate reads app_modified to tell "built it perfectly" from "did
// nothing", and zeroes the whole run when it is false.
//
// `git diff` only sees TRACKED (or staged) paths, so a builder that merely CREATED files —
// new page components, the common case — registers as zero changes unless something staged
// them first. The runner does `git add -A` before calling this, but the collector is
// documented as standalone-runnable, and a metric that silently depends on the caller
// having staged is exactly the proxy-for-the-real-property trap. Count untracked files too.
// No double counting: once staged, a file appears in the diff and not in ls-files --others.
const untracked = run('git', ['ls-files', '--others', '--exclude-standard']);
const nonEmptyLines = s => (s ?? '').split('\n').filter(l => l.trim()).length;
const files_changed_vs_baseline =
  nonEmptyLines(nameStatus.stdout) + nonEmptyLines(untracked.stdout);

// The same source at the baseline tag, so a metric can be read before and after. Only the
// migration eval hands the builder source worth measuring at baseline (its hook writes a
// raw-Bulma app there), but every run gets the block: it is cheap, and a scaffold's own
// numbers are a fact about the starting point too.
const baselineTsx = (
  run('git', ['ls-tree', '-r', '--name-only', 'baseline', '--', 'src'])
    .stdout ?? ''
)
  .split('\n')
  .filter(p => /\.tsx?$/.test(p))
  .map(p => ({ p, text: run('git', ['show', `baseline:${p}`]).stdout ?? '' }));

let deps_added = [];
try {
  const basePkg = JSON.parse(
    run('git', ['show', 'baseline:package.json']).stdout
  );
  const nowPkg = JSON.parse(read(join(appDir, 'package.json')));
  const keys = o => Object.keys({ ...o.dependencies, ...o.devDependencies });
  deps_added = keys(nowPkg).filter(k => !keys(basePkg).includes(k));
} catch {
  /* leave empty */
}

// ---- typecheck + build ------------------------------------------------------
// Run tsc via the app's own binary; count distinct "error TS" diagnostics.
const tsc = run('npx', ['tsc', '-b', '--pretty', 'false', '--force']);
const tscOut = `${tsc.stdout ?? ''}${tsc.stderr ?? ''}`;
const tsc_errors = (tscOut.match(/error TS\d+/g) ?? []).length;
const vite = run('npx', ['vite', 'build'], { timeout: 420_000 });
const build_pass = tsc.status === 0 && vite.status === 0;

// ---- code metrics -----------------------------------------------------------
/**
 * Counts `no-bulma-component-class` reports in a set of files: plain elements styled with
 * a Bulma class bestax has a component for. The rule itself, from this repo's ESLint
 * plugin build, rather than a second regex, so the number reads markup exactly the way the
 * shipped rule does. Null when the plugin is not built, with a warning: every loop still
 * collects, and only the migration eval (whose hook refuses to run without the build)
 * depends on the number.
 *
 * Null too when a file does not parse, with the file named in `unparsed`. ESLint reports
 * a parse failure as one fatal message and no rule reports, so summing the rule's reports
 * would read a broken file as fully converted: a run killed mid-edit would score as done.
 */
async function loadClassCounter() {
  const plugin = join(REPO, 'eslint-plugin', 'dist', 'index.js');
  if (!existsSync(plugin)) {
    console.error(
      'warning: eslint-plugin is not built, so bulma_component_classes is null'
    );
    return null;
  }
  try {
    const fromPlugin = createRequire(
      join(REPO, 'eslint-plugin', 'package.json')
    );
    const { Linter } = fromPlugin('eslint');
    const parser = fromPlugin('@typescript-eslint/parser');
    const { default: bestax } = await import(pathToFileURL(plugin).href);
    const linter = new Linter();
    const config = [
      {
        files: ['**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
          parser,
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
        plugins: { bestax },
        rules: { 'bestax/no-bulma-component-class': 'error' },
      },
    ];
    return files => {
      let count = 0;
      const unparsed = [];
      for (const f of files) {
        const messages = linter.verify(f.text, config, f.p);
        if (messages.some(m => m.fatal)) unparsed.push(f.p);
        else count += messages.filter(m => m.ruleId).length;
      }
      if (unparsed.length) {
        console.error(
          `warning: ${unparsed.join(', ')} did not parse, so bulma_component_classes is null`
        );
      }
      return { count: unparsed.length ? null : count, unparsed };
    };
  } catch (e) {
    console.error(
      `warning: could not load the ESLint rule, so bulma_component_classes is null — ${e.message}`
    );
    return null;
  }
}
const countComponentClasses = await loadClassCounter();

// A className whose string, template, or string inside a flat expression
// (`{open ? 'is-active' : ''}`, `{cx('tab', open && 'is-active')}`) carries a modifier.
const RAW_BULMA =
  /className\s*=\s*(?:"[^"]*\b(?:is-|has-)[^"]*"|'[^']*\b(?:is-|has-)[^']*'|\{`[^`]*\b(?:is-|has-)[^`]*`\}|\{[^{}`]*?['"][^'"]*\b(?:is-|has-)[^'"]*['"][^{}`]*\})/g;
const HANDROLLED = [
  'button',
  'table',
  'nav',
  'footer',
  'section',
  'input',
  'select',
  'textarea',
  'label',
];

/** The source metrics, for any set of files: the final tree, or the baseline's. */
function codeMetrics(files) {
  const count = re => countAll(re, files);
  const handrolled_tags = Object.fromEntries(
    HANDROLLED.map(t => [t, count(new RegExp(`<${t}[\\s>/]`, 'g'))])
  );
  const classes = countComponentClasses?.(files) ?? {
    count: null,
    unparsed: null,
  };
  return {
    inline_style_count: count(/style=\{\{/g),
    raw_bulma_classnames: count(RAW_BULMA),
    bulma_component_classes: classes.count,
    unparsed_files: classes.unparsed,
    // What the bestax-migrate codemod leaves where it would not guess.
    bestax_migrate_todos: count(/TODO\(bestax-migrate\)/g),
    handrolled_tags,
    handrolled_total: Object.values(handrolled_tags).reduce((a, b) => a + b, 0),
    src_tsx_files: files.length,
    src_total_lines: files.reduce((n, f) => n + f.text.split('\n').length, 0),
  };
}
const {
  inline_style_count,
  raw_bulma_classnames,
  bulma_component_classes,
  unparsed_files,
  bestax_migrate_todos,
  handrolled_tags,
  handrolled_total,
  src_tsx_files,
  src_total_lines,
} = codeMetrics(tsxText);
const atBaseline = codeMetrics(baselineTsx);

const importSet = new Set();
for (const f of tsxText) {
  for (const m of f.text.matchAll(
    /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]@allxsmith\/bestax-bulma['"]/g
  )) {
    m[1]
      .split(',')
      .map(s =>
        s
          .trim()
          .split(/\s+as\s+/)[0]
          .trim()
      )
      .filter(Boolean)
      .forEach(id => importSet.add(id));
  }
}

// ---- transcript metrics -----------------------------------------------------
let transcript = {
  skill_file_reads: null,
  skill_files: null,
  skill_refs_unresolved: null,
  skill_files_complete: null,
  skill_invocations: null,
  claude_md_read: null,
  // Guidance can also arrive over MCP. Counted separately from the skill/docs channels
  // because a run configured with an MCP server and no skills legitimately scores zero on
  // every field above — which reads as "did not engage" when the truth is "engaged
  // elsewhere". Null (not 0) when there is no transcript, same as its neighbours.
  mcp_tool_calls: null,
  mcp_tools_used: null,
  // MCP *resources* are the second channel a server exposes, reached through the built-in
  // ReadMcpResourceTool/ListMcpResourcesTool rather than an mcp__-prefixed name. Counted
  // apart from tools so "used the server" and "used it two different ways" stay distinct.
  // (Prompts are the third channel and deliberately have no counter: a non-interactive
  // `claude -p` builder cannot invoke a slash command, so the number would be a constant
  // zero that reads as a finding about the server.)
  mcp_resource_reads: null,
  docs_fetches: null,
  docs_urls: null,
  web_calls_total: null,
  num_turns: null,
  duration_s: null,
  cost_usd: null,
  result_subtype: null,
  is_error: null,
};
if (transcriptPath && existsSync(transcriptPath)) {
  const skillFiles = new Set();
  let skillReads = 0,
    skillRefsUnresolved = 0,
    skillInvocations = 0,
    claudeMdRead = false,
    mcpCalls = 0,
    mcpResourceReads = 0,
    webTotal = 0;
  const mcpTools = new Set();
  const docsUrls = new Set();
  let result = null;
  for (const line of read(transcriptPath).split('\n')) {
    if (!line.trim()) continue;
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    if (ev.type === 'result') result = ev;
    const content = ev?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (block?.type !== 'tool_use') continue;
      const inputStr = JSON.stringify(block.input ?? {});
      if (block.name === 'Skill') skillInvocations++;
      // `mcp__<server>__<tool>` is the harness's own naming for every MCP tool, so the
      // prefix identifies the channel without hardcoding which server this run configured.
      if (/^mcp__/.test(block.name ?? '')) {
        mcpCalls++;
        mcpTools.add(block.name);
      }
      if (['ReadMcpResourceTool', 'ListMcpResourcesTool'].includes(block.name))
        mcpResourceReads++;
      if (inputStr.includes('.claude/skills/')) {
        skillReads++;
        // Harvest paths from the whole input, not just file_path: builders that reach
        // references with Bash `cat`/`sed` counted reads but left skill_files empty
        // (i05, i08, i10 of the original run). The pattern lives in lib/skill-paths.mjs so
        // bin/test-skill-paths.mjs guards this exact code rather than a copy of it.
        const { paths, unresolved } = harvestSkillPaths(inputStr);
        for (const p of paths) skillFiles.add(p);
        // Every reference that did not resolve to a whole path — an expansion, a glob, or a
        // bare directory listing. Without this, one recovered path would certify a
        // partially-harvested list as complete.
        skillRefsUnresolved += unresolved;
      }
      if (/CLAUDE\.md/.test(inputStr) && ['Read', 'Grep'].includes(block.name))
        claudeMdRead = true;
      if (['WebFetch', 'WebSearch'].includes(block.name)) {
        webTotal++;
        for (const m of inputStr.matchAll(
          /https?:\/\/[^"\\\s]*bestax\.io[^"\\\s]*/g
        ))
          // The MCP server tags the links it prints with utm_source=bestax-mcp
          // (passive attribution). Strip it here so the tagged and bare forms
          // of one page count once, keeping docs_fetches comparable across
          // guidance channels instead of double-counting the MCP one. Two
          // cases, because attributed() supports fragments: mid-query the
          // param yields its delimiter to the next param; as the last param
          // its own leading ?/& goes too, whether the URL ends there or a
          // #fragment follows (the old end-anchored cleanup left '?#').
          docsUrls.add(
            m[0]
              .replace(/([?&])utm_source=bestax-mcp&/, '$1')
              .replace(/[?&]utm_source=bestax-mcp(?=#|$)/, '')
          );
      }
    }
  }
  transcript = {
    skill_file_reads: skillReads,
    skill_files: [...skillFiles].sort(),
    skill_refs_unresolved: skillRefsUnresolved,
    // true only when EVERY counted reference resolved to a path, so skill_files can be
    // read as the full inventory. Not "we recovered something" — a partially-harvested
    // list is exactly what this flag exists to expose.
    skill_files_complete: skillRefsUnresolved === 0,
    skill_invocations: skillInvocations,
    claude_md_read: claudeMdRead,
    mcp_tool_calls: mcpCalls,
    mcp_tools_used: [...mcpTools].sort(),
    mcp_resource_reads: mcpResourceReads,
    docs_fetches: docsUrls.size,
    docs_urls: [...docsUrls].sort(),
    web_calls_total: webTotal,
    num_turns: result?.num_turns ?? null,
    duration_s:
      result?.duration_ms != null
        ? Math.round(result.duration_ms / 1000)
        : null,
    cost_usd: result?.total_cost_usd ?? null,
    result_subtype: result?.subtype ?? null,
    is_error: result?.is_error ?? null,
  };
}

console.log(
  JSON.stringify(
    {
      // Only the trailing <run>/<app> segments: the app is scaffolded outside the repo by
      // design, so the absolute path is host-specific (and carries a local username) while
      // adding nothing a reader of runs/<id>/ doesn't already know.
      app_dir: join(basename(dirname(appDir)), basename(appDir)),
      // Which brief, model, caps and tooling revision produced this run. Once a runs/
      // directory holds more than one variant it is ambiguous without these, and
      // category-7 scores only compare within a brief.
      ...runMeta,
      tsc_errors,
      build_pass,
      files_changed_vs_baseline,
      app_modified: files_changed_vs_baseline > 0,
      inline_style_count,
      raw_bulma_classnames,
      bulma_component_classes,
      // The files the rule could not parse, which is what nulls the count above.
      unparsed_files,
      bestax_migrate_todos,
      handrolled_tags,
      handrolled_total,
      // The same counts at the baseline tag. A migration run reads its progress as the
      // difference; for a build run these are the scaffold's own numbers. The size of the
      // tree comes too, because every count above also falls when markup is deleted.
      baseline: {
        inline_style_count: atBaseline.inline_style_count,
        raw_bulma_classnames: atBaseline.raw_bulma_classnames,
        bulma_component_classes: atBaseline.bulma_component_classes,
        bestax_migrate_todos: atBaseline.bestax_migrate_todos,
        handrolled_total: atBaseline.handrolled_total,
        src_tsx_files: atBaseline.src_tsx_files,
        src_total_lines: atBaseline.src_total_lines,
      },
      bestax_named_imports: importSet.size,
      bestax_import_list: [...importSet].sort(),
      custom_css_added_lines,
      css_files_added,
      deps_added,
      src_tsx_files,
      src_total_lines,
      ...transcript,
    },
    null,
    2
  )
);
