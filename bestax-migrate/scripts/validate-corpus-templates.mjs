/**
 * Dev-time corpus validation for the bulma-classes source's HTML input: run
 * the CLI over the awesome-bulma-templates pages and measure what it leaves.
 *
 * Each template repo is fetched as TEXT at the commit pinned in
 * `lib/corpus-templates.mjs` into the gitignored `.e2e-tmp/`; its pages are
 * never executed and never committed. The checkout is copied whole into a
 * scratch TypeScript package (whole, so a relative URL resolves beside its
 * page the way it did upstream; any upstream `package.json` or `tsconfig.json`
 * is renamed, so every page becomes `.tsx`), and the CLI converts every
 * `.html`/`.htm` in it with `--css bestax`. Deliberately NOT wired into CI,
 * since it needs the network; run it before and after a change to the HTML
 * input or the class table and compare the reports:
 *
 *   pnpm --filter bestax-migrate validate:corpus:templates
 *
 * Exit 1 on a crash, on a module that no longer parses, on a module tsc could
 * not read, on a rule the bestax-migrate skill's references don't document
 * (the kitchen sinks' check), or on a CLI run that disagrees with
 * `convertPage` about what it wrote. The modules' `tsc` diagnostics are
 * listed, never failed on. Lands in `.e2e-tmp/corpus-templates/`:
 * `report.json` and `report.md` (the same report, deterministic, so two runs
 * diff line by line), `review/<template>/` with each page's `.before.html` and
 * `.after.tsx`, and `packages/<template>/`, the scratch package as the CLI
 * left it.
 *
 * Telemetry: the CLI runs under DO_NOT_TRACK, which sends nothing and writes
 * no decision. `--no-telemetry` would also send nothing, but it saves "off"
 * into the shared bestax config, which is not this script's to change.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  TEMPLATES,
  buildReport,
  componentClassCounts,
  isPage,
  pageClassCounts,
  parseModule,
  pinViolations,
  prepareScratchPackage,
  readCliOutput,
  readTscOutput,
  renderMarkdown,
  repoUrl,
  scratchTsconfig,
  summaryTable,
  undocumentedRuleFailures,
} from './lib/corpus-templates.mjs';

const CSS_MODE = 'bestax';

const packageRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const repoRoot = path.join(packageRoot, '..');
const checkoutRoot = path.join(packageRoot, '.e2e-tmp', 'corpus', 'templates');
const outDir = path.join(packageRoot, '.e2e-tmp', 'corpus-templates');
const dist = path.join(packageRoot, 'dist');

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(dist, 'index.js'))) {
  fail('dist/ not built — run `pnpm --filter bestax-migrate build` first');
}
const problems = pinViolations(TEMPLATES);
if (problems.length > 0) fail(`bad pin list:\n  ${problems.join('\n  ')}`);

const load = rel => import(pathToFileURL(path.join(dist, rel)).href);
const { bulmaClasses } = await load('sources/bulma-classes/index.js');
const { convertPage } = await load('sources/bulma-classes/html.js');
const { parseHtml } = await load('sources/_shared/html/parse.js');
// Two TypeScript files, read as they are: Node strips their types, which
// needs Node 22.18 or later. The ESLint rule's own table, committed and kept
// fresh by gen:eslint-meta:check, and the kitchen sinks' skill check.
const typeStripped = rel =>
  import(pathToFileURL(path.join(repoRoot, rel)).href);
const { BULMA_COMPONENT_CLASSES } = await typeStripped(
  'eslint-plugin/src/generated/metadata.ts'
);
const { undocumentedRules } = await typeStripped(
  'bestax-migrate/e2e/support/skill-rules.ts'
);
const tscBin = createRequire(path.join(packageRoot, 'package.json')).resolve(
  'typescript/bin/tsc'
);

// ---- fetch each template (text only) at its pinned commit -------------------
function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) {
    fail(`git ${args.join(' ')} in ${cwd}: ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
}

function checkout(pin) {
  const dir = path.join(checkoutRoot, pin.slug);
  const head = fs.existsSync(path.join(dir, '.git'))
    ? spawnSync('git', ['rev-parse', 'HEAD'], {
        cwd: dir,
        encoding: 'utf8',
      }).stdout?.trim()
    : null;
  if (head === pin.sha) return dir;
  console.log(`Fetching ${pin.repo} @ ${pin.sha.slice(0, 12)} (text only)…`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  git(dir, ['init', '-q']);
  git(dir, ['remote', 'add', 'origin', repoUrl(pin)]);
  git(dir, ['fetch', '-q', '--depth', '1', 'origin', pin.sha]);
  git(dir, ['checkout', '-q', 'FETCH_HEAD']);
  return dir;
}

function walk(dir, base = dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap(entry => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full, base);
      return [path.relative(base, full).split(path.sep).join('/')];
    })
    .sort();
}

const posix = file => file.split(path.sep).join('/');

// ---- one template -----------------------------------------------------------
function measure(pin, failures) {
  const pkg = path.join(outDir, 'packages', pin.slug);
  const review = path.join(outDir, 'review', pin.slug);
  const renamed = prepareScratchPackage(
    checkout(pin),
    pkg,
    `corpus-${pin.slug}`
  );
  for (const file of renamed) {
    console.log(`  ${pin.slug}: kept upstream ${file} out of the way`);
  }
  const pages = walk(pkg).filter(isPage);
  const failure = (page, kind, message) =>
    failures.push({ template: pin.slug, page, kind, message });
  if (pages.length === 0) failure(null, 'corpus', 'no .html or .htm pages');

  // What the CLI should write, from the function it calls, before it runs:
  // the module before the planner is only here, and the report entries are
  // structured here rather than read back from the CLI's prose.
  const project = bulmaClasses.analyzeProject(
    pages.map(page => path.join(pkg, page))
  );
  const expected = new Map();
  for (const page of pages) {
    const file = path.join(pkg, page);
    const source = fs.readFileSync(file, 'utf8');
    const entries = [];
    const result = {
      page,
      module: null,
      status: 'crashed',
      todos: [],
      // The page's own classes, read from its DOM, so a page that wrote no
      // module is counted all the same.
      marked: pageClassCounts(parseHtml(source).root, BULMA_COMPONENT_CLASSES),
      left: {},
      typechecked: false,
      tsc: [],
    };
    try {
      const converted = convertPage(
        file,
        source,
        { add: entry => entries.push(entry) },
        { ...project, cssMode: CSS_MODE }
      );
      result.todos = entries.map(entry => entry.rule);
      result.status =
        converted.output !== null
          ? 'converted'
          : result.todos.some(rule => rule.startsWith('html-file'))
            ? 'refused'
            : 'empty';
      expected.set(page, { ...converted, entries, result });
    } catch (error) {
      failure(page, 'crash', error.message);
      result.todos = entries.map(entry => entry.rule);
      expected.set(page, { output: null, entries, result });
    }
  }

  const cli = spawnSync(
    process.execPath,
    [
      path.join(dist, 'index.js'),
      'bulma-classes',
      ...pages,
      '--css',
      CSS_MODE,
      '--no-deps',
    ],
    {
      cwd: pkg,
      encoding: 'utf8',
      env: { ...process.env, DO_NOT_TRACK: '1', FORCE_COLOR: '0' },
    }
  );
  if (cli.status !== 0) {
    const why = cli.error?.message ?? cli.stderr.trim().split('\n')[0];
    failure(null, 'crash', `the CLI exited ${cli.status}: ${why}`);
  }
  const printed = readCliOutput(cli.stdout, cli.stderr);
  for (const crash of printed.crashes) {
    failure(crash.file, 'crash', `in the CLI: ${crash.message}`);
  }
  const wanted = [...expected.values()];
  const expectedSummary = {
    scanned: pages.length,
    transformed: wanted.filter(page => page.output !== null).length,
    todos: wanted.reduce((count, page) => count + page.entries.length, 0),
  };
  if (JSON.stringify(printed.summary) !== JSON.stringify(expectedSummary)) {
    failure(
      null,
      'cli',
      `the CLI reported ${JSON.stringify(printed.summary)}, and convertPage ` +
        JSON.stringify(expectedSummary)
    );
  }

  const modules = [];
  for (const page of pages) {
    const want = expected.get(page);
    const { result } = want;
    const target = path.join(review, page);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(
      path.join(pkg, page),
      target.replace(/\.html?$/i, '.before.html')
    );
    if (want.output === null) continue;
    const moduleRel = posix(path.relative(pkg, want.outputPath));
    result.module = moduleRel;
    if (!fs.existsSync(want.outputPath)) {
      failure(page, 'cli', `the CLI wrote no ${moduleRel}`);
      continue;
    }
    const written = fs.readFileSync(want.outputPath, 'utf8');
    if (written !== want.output) {
      failure(page, 'cli', `${moduleRel} differs from convertPage's module`);
    }
    fs.writeFileSync(
      target.replace(/\.html?$/i, `.after${path.extname(moduleRel)}`),
      written
    );
    try {
      result.left = componentClassCounts(
        parseModule(written),
        BULMA_COMPONENT_CLASSES
      );
    } catch (error) {
      failure(page, 'unparseable', `${moduleRel}: ${error.message}`);
      continue;
    }
    // "Converted" is the page's count less the module's, so the converter
    // must have written every element the page has.
    try {
      const asJsx = componentClassCounts(
        parseModule(want.intermediate),
        BULMA_COMPONENT_CLASSES
      );
      if (JSON.stringify(asJsx) !== JSON.stringify(result.marked)) {
        failure(
          page,
          'count',
          `the page as JSX carries ${JSON.stringify(asJsx)}, and the page ${JSON.stringify(result.marked)}`
        );
      }
    } catch (error) {
      failure(page, 'unparseable', `the page as JSX: ${error.message}`);
    }
    if (moduleRel.endsWith('.tsx')) modules.push(result);
    else {
      failure(
        page,
        'tsc',
        `${moduleRel} is not TypeScript, so tsc did not read it`
      );
    }
  }

  const measured = wanted.map(({ result }) => result);
  failures.push(
    ...undocumentedRuleFailures(pin.slug, measured, undocumentedRules)
  );
  if (modules.length > 0) typecheck(pkg, modules, failure);
  return { slug: pin.slug, repo: pin.repo, sha: pin.sha, pages: measured };
}

/** `tsc --noEmit` over the modules, the way the HTML kitchen sink checks them. */
function typecheck(pkg, modules, failure) {
  fs.writeFileSync(
    path.join(pkg, 'tsconfig.json'),
    `${JSON.stringify(
      scratchTsconfig(modules.map(page => page.module)),
      null,
      2
    )}\n`
  );
  const result = spawnSync(
    process.execPath,
    [tscBin, '-p', pkg, '--pretty', 'false'],
    { cwd: pkg, encoding: 'utf8' }
  );
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const diagnostics = readTscOutput(output);
  // A diagnostic outside the modules, or a tsc that failed without one, means
  // the check itself did not run as meant: that is the harness's failure.
  if (result.status !== 0 && diagnostics.length === 0) {
    const why = result.error?.message ?? output.trim().split('\n')[0];
    failure(null, 'tsc', `tsc exited ${result.status}: ${why}`);
    return;
  }
  const byModule = new Map(modules.map(page => [page.module, page]));
  for (const page of modules) page.typechecked = true;
  for (const diagnostic of diagnostics) {
    const rel =
      diagnostic.file === null
        ? null
        : posix(path.relative(pkg, path.resolve(pkg, diagnostic.file)));
    const page = byModule.get(rel);
    if (page) page.tsc.push(diagnostic);
    else {
      failure(
        null,
        'tsc',
        `${rel ?? 'tsconfig'}: ${diagnostic.code} ${diagnostic.message}`
      );
    }
  }
}

// ---- run --------------------------------------------------------------------
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const failures = [];
const templates = TEMPLATES.map(pin => measure(pin, failures));
const report = buildReport({ templates, failures, css: CSS_MODE });
fs.writeFileSync(
  path.join(outDir, 'report.json'),
  `${JSON.stringify(report, null, 2)}\n`
);
fs.writeFileSync(
  path.join(outDir, 'report.md'),
  renderMarkdown(report, BULMA_COMPONENT_CLASSES)
);

console.log(
  `\nbestax-migrate corpus validation — bulma-classes over the templates (--css ${CSS_MODE})\n`
);
console.log(summaryTable(report).join('\n'));
console.log(`\n  report: ${path.relative(packageRoot, outDir)}/report.md`);
console.log(`          ${path.relative(packageRoot, outDir)}/report.json`);
console.log(`  review: ${path.relative(packageRoot, outDir)}/review/`);
if (report.failures.length > 0) {
  for (const { template, page, kind, message } of report.failures) {
    console.error(
      `  ✖ ${page ? `${template}/${page}` : template}: ${kind}: ${message}`
    );
  }
  fail(`corpus validation found ${report.failures.length} defect(s)`);
}
console.log('\n✓ corpus validation passed');
