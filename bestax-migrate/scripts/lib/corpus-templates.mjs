/**
 * The offline half of `validate-corpus-templates.mjs`: the upstream templates
 * and the commits they are pinned at, the scratch package a template is
 * converted in, the count of Bulma component classes in a page and in a
 * module, the gate on the rules a run emits, readers for what the CLI and
 * `tsc` print, and the report built from one run.
 *
 * Nothing here touches the network, so `e2e/corpus-templates.test.ts` runs all
 * of it with the ordinary suite. Everything but `prepareScratchPackage` is
 * pure; that one copies a checkout to where it is told.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

// ---- The corpus -------------------------------------------------------------

/**
 * The awesome-bulma-templates repos the corpus runs over, each at the commit
 * its port issue under #1118 names. This is the one home of those pins. Move a
 * pin on purpose only: a new commit changes the pages, so a report from before
 * it no longer compares with one from after. Nothing checks a pin against its
 * issue, which an offline test cannot read, so compare the two by hand when a
 * pin moves.
 */
export const TEMPLATES = Object.freeze(
  [
    {
      slug: 'login',
      repo: 'aldi/bulma-login-template',
      sha: '4f6c09947e045152ce73bc6a184d22f42f8493e9',
      issue: 1122,
    },
    {
      slug: 'event-participation',
      repo: 'aldi/bulma-event-participation-template',
      sha: '836934566b51c595b76c0c7d7ef524edf593e46d',
      issue: 1123,
    },
    {
      slug: 'coming-soon',
      repo: 'aldi/bulma-coming-soon-template',
      sha: '7a9d786fe0bc610ec174b2a0a11e994051339345',
      issue: 1124,
    },
    {
      slug: 'cv',
      repo: 'aldi/bulma-cv-template',
      sha: '29108ebb52030480ee40c8224d2f6f8a3587926d',
      issue: 1125,
    },
    {
      slug: 'rent',
      repo: 'aldi/bulma-rent-template',
      sha: '3d6bff06730d7274ab11f29f9b1c663819125dab',
      issue: 1126,
    },
    {
      slug: 'hotel',
      repo: 'aldi/bulma-hotel-template',
      sha: '2f7a1cfdcd96e97dd084aaf27a92ef98ed14bc28',
      issue: 1127,
    },
    {
      slug: 'wedding-planner',
      repo: 'restylianos/bulma-wedding-planner-template',
      sha: '1b6a8b961b651ad75e0b0b23abfce362bc28549a',
      issue: 1128,
    },
    {
      slug: 'tropico',
      repo: 'restylianos/bulma-tropico-template',
      sha: '0f019f6ed36459d63f4466783f5c101f07a48490',
      issue: 1129,
    },
  ].map(pin => Object.freeze(pin))
);

/**
 * What is wrong with the shape of a pin list, as one line per problem: a slug,
 * an `owner/name` repo, a full commit SHA and an issue number.
 */
export function pinViolations(pins) {
  const problems = [];
  const seen = new Set();
  for (const [index, pin] of pins.entries()) {
    const at = `pin ${index} (${pin.slug ?? 'no slug'})`;
    if (!/^[a-z][a-z0-9-]*$/.test(pin.slug ?? '')) {
      problems.push(`${at}: the slug must be lowercase words joined by -`);
    } else if (seen.has(pin.slug)) {
      problems.push(`${at}: the slug is already used by another pin`);
    }
    seen.add(pin.slug);
    if (!/^[\w.-]+\/[\w.-]+$/.test(pin.repo ?? '')) {
      problems.push(`${at}: the repo must be owner/name on GitHub`);
    }
    if (!/^[0-9a-f]{40}$/.test(pin.sha ?? '')) {
      problems.push(`${at}: the sha must be a full commit SHA`);
    }
    if (!Number.isInteger(pin.issue)) {
      problems.push(`${at}: the issue must be the port issue's number`);
    }
  }
  return problems;
}

/** Where a pinned repo is fetched from. */
export function repoUrl(pin) {
  return `https://github.com/${pin.repo}.git`;
}

/** Whether a file is a page the HTML input reads. */
export function isPage(file) {
  return /\.html?$/i.test(file);
}

/**
 * What must be built before a run, one line per build missing, under the repo
 * root `root`: this package's `dist/`, which converts the pages, and
 * bestax-bulma's types, which tsc reads for every module's import of it.
 * Without the second, each module gets a TS2307 from the setup rather than
 * from the codemod, and tsc diagnostics are listed rather than failed on, so
 * the run would pass with its tsc column inflated. The script runs outside
 * turbo, so nothing builds the library for it.
 */
export function missingBuilds(root) {
  const missing = [];
  if (!fs.existsSync(path.join(root, 'bestax-migrate', 'dist', 'index.js'))) {
    missing.push(
      'bestax-migrate/dist is not built: run `pnpm --filter bestax-migrate build`'
    );
  }
  const library = path.join(root, 'bulma-ui');
  const { types } = JSON.parse(
    fs.readFileSync(path.join(library, 'package.json'), 'utf8')
  );
  if (typeof types !== 'string' || !fs.existsSync(path.join(library, types))) {
    missing.push(
      `bulma-ui/${types ?? 'dist'} is not built, and every module imports @allxsmith/bestax-bulma: ` +
        'run `pnpm --filter @allxsmith/bestax-bulma build`'
    );
  }
  return missing;
}

// ---- The scratch package ----------------------------------------------------

/**
 * Files that make a folder its own project. The innermost manifest decides
 * whether a page becomes `.tsx` or `.jsx`, so one nested in a template would
 * outrank the scratch package's for the pages under it, and a `.jsx` module is
 * one the type-check cannot read.
 */
const PROJECT_FILES = new Set([
  'package.json',
  'tsconfig.json',
  'jsconfig.json',
]);

/** Where an upstream project file is kept: `package.json` → `package.upstream.json`. */
export function upstreamName(file) {
  return file.replace(/\.json$/, '.upstream.json');
}

/**
 * Copy a checkout into `to` as a TypeScript package named `name`: everything
 * but `.git`, so a relative URL resolves beside its page the way it did
 * upstream, with each upstream project file renamed by `upstreamName`, so the
 * scratch package's own manifest is the only one and every page becomes
 * `.tsx`. Returns the renamed files, relative to `to`, sorted.
 */
export function prepareScratchPackage(from, to, name) {
  fs.cpSync(from, to, {
    recursive: true,
    filter: source => path.basename(source) !== '.git',
  });
  const renamed = [];
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (PROJECT_FILES.has(entry.name)) {
        fs.renameSync(full, upstreamName(full));
        renamed.push(path.relative(to, full).split(path.sep).join('/'));
      }
    }
  };
  visit(to);
  fs.writeFileSync(
    path.join(to, 'package.json'),
    `${JSON.stringify(
      { name, private: true, devDependencies: { typescript: '*' } },
      null,
      2
    )}\n`
  );
  fs.writeFileSync(path.join(to, AMBIENT_TYPES), AMBIENT_DECLARATIONS);
  return renamed.sort(byCodePoint);
}

/**
 * The scratch package's ambient types, which `scratchTsconfig` lists. A
 * create-bestax app has its stylesheet imports typed by `vite/client` (the
 * vite-ts template's `types`), and TypeScript rejects an untyped side-effect
 * import. Vite is not a dependency here, so this is Vite's own declaration for
 * `.css`, as written in its `client.d.ts`. It is written after the copy, so it
 * replaces an upstream file of the same name.
 */
export const AMBIENT_TYPES = 'global.d.ts';
const AMBIENT_DECLARATIONS = "declare module '*.css' {}\n";

/**
 * The scratch package's `tsconfig.json` over `modules` (paths relative to the
 * package), the way the HTML kitchen sink type-checks its output, plus the
 * ambient types.
 */
export function scratchTsconfig(modules) {
  return {
    compilerOptions: {
      strict: true,
      noEmit: true,
      jsx: 'react-jsx',
      module: 'ESNext',
      target: 'ES2022',
      moduleResolution: 'bundler',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      skipLibCheck: true,
    },
    files: [...modules, AMBIENT_TYPES],
  };
}

// ---- Rule ids ---------------------------------------------------------------

/**
 * A failure for each rule a page's TODOs carry that the bestax-migrate skill's
 * references don't document, once per page and rule. An agent finishing a
 * migration looks a rule up there, and a new rule's recipe lands there in the
 * same change, so an undocumented one is a dead end. `undocumented` is the
 * kitchen sinks' `undocumentedRules` (`e2e/support/skill-rules.ts`), passed in
 * so this stays pure.
 */
export function undocumentedRuleFailures(template, pages, undocumented) {
  const missing = new Set(undocumented(pages.flatMap(page => page.todos)));
  return pages.flatMap(page =>
    sortedUnique(page.todos.filter(rule => missing.has(rule))).map(rule => ({
      template,
      page: page.page,
      kind: 'undocumented-rule',
      message: `${rule} is not in skills/bestax-migrate's references`,
    }))
  );
}

// ---- Component classes ------------------------------------------------------

/** Parse a module the CLI wrote; throws when it no longer parses. */
export function parseModule(code) {
  return parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });
}

/** A lowercase HTML tag: not a component, not a custom element. */
const INTRINSIC = /^[a-z][a-z0-9]*$/;

/** Subtrees whose tags are not HTML. */
const FOREIGN = new Set(['svg', 'math']);

/** AST keys that hold positions or comments, never elements. */
const SKIPPED_KEYS = new Set([
  'loc',
  'start',
  'end',
  'extra',
  'range',
  'comments',
  'tokens',
  'leadingComments',
  'trailingComments',
  'innerComments',
]);

function tagOf(opening) {
  const name = opening?.name;
  return name?.type === 'JSXIdentifier' && INTRINSIC.test(name.name)
    ? name.name
    : null;
}

/** The class tokens of a `className` written as a string, else null. */
function classTokens(opening) {
  const attr = opening.attributes.find(
    a => a.type === 'JSXAttribute' && a.name.name === 'className'
  );
  let value = attr?.value;
  if (value?.type === 'JSXExpressionContainer') value = value.expression;
  let text = null;
  if (value?.type === 'StringLiteral') text = value.value;
  if (value?.type === 'TemplateLiteral' && value.expressions.length === 0) {
    text = value.quasis[0].value.cooked;
  }
  return text === null ? null : text.split(/\s+/).filter(Boolean);
}

/**
 * The class `no-bulma-component-class` reports an element by: the first
 * family class it carries, else the converted class whose component fits its
 * tag best (its own tag, then one `as` reaches), the first in the table's
 * order among equals. `classes` is the ESLint plugin's
 * `BULMA_COMPONENT_CLASSES`.
 */
function componentClassOf(tokens, tag, classes) {
  const family = tokens.find(token => classes.get(token)?.converts === false);
  if (family !== undefined) return family;
  const fit = entry =>
    entry.tag === tag
      ? 2
      : entry.tags === 'any' || entry.tags?.includes(tag)
        ? 1
        : 0;
  let best;
  for (const candidate of classes) {
    if (!tokens.includes(candidate[0])) continue;
    if (best === undefined || fit(candidate[1]) > fit(best[1])) {
      best = candidate;
    }
  }
  return best?.[0];
}

function bump(counts, cls) {
  if (cls !== undefined) counts.set(cls, (counts.get(cls) ?? 0) + 1);
}

/**
 * How many plain elements in a module carry each Bulma component class, keyed
 * by class in code-point order, one per element, for the class
 * `componentClassOf` picks. Like that rule it reads lowercase tags outside
 * `<svg>` and `<math>` only. It reads a `className` written as a string, which
 * is every one the HTML converter writes; one built at runtime is not counted.
 */
export function componentClassCounts(ast, classes) {
  const counts = new Map();
  const visit = (node, foreign) => {
    if (node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const child of node) visit(child, foreign);
      return;
    }
    if (typeof node.type !== 'string') return;
    let inside = foreign;
    if (node.type === 'JSXElement') {
      const tag = tagOf(node.openingElement);
      if (tag !== null && FOREIGN.has(tag)) inside = true;
      const tokens =
        tag === null || inside ? null : classTokens(node.openingElement);
      if (tokens !== null) bump(counts, componentClassOf(tokens, tag, classes));
    }
    for (const [key, child] of Object.entries(node)) {
      if (!SKIPPED_KEYS.has(key)) visit(child, inside);
    }
  };
  visit(ast.program ?? ast, false);
  return sortedRecord(counts);
}

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

/**
 * The same count over a page's content as parse5 builds it (the `root` the
 * HTML input's `parseHtml` returns), so a page that writes no module, a
 * refused one included, is still counted. It reads what the converter writes
 * as JSX: the children of the body or the fragment, a `<template>`'s content,
 * no `<script>` (the converter drops them), and nothing in another namespace,
 * which is `<svg>` and `<math>` and everything inside them.
 */
export function pageClassCounts(root, classes) {
  const counts = new Map();
  const visit = node => {
    const children =
      node.nodeName === 'template' ? node.content.childNodes : node.childNodes;
    for (const child of children ?? []) {
      if (!('tagName' in child) || child.namespaceURI !== HTML_NAMESPACE) {
        continue;
      }
      if (child.tagName === 'script') continue;
      if (INTRINSIC.test(child.tagName)) {
        const attr = child.attrs.find(a => a.name === 'class' && !a.prefix);
        const tokens = (attr?.value ?? '').split(/\s+/).filter(Boolean);
        bump(counts, componentClassOf(tokens, child.tagName, classes));
      }
      visit(child);
    }
  };
  visit(root);
  return sortedRecord(counts);
}

// ---- What the CLI and tsc print ---------------------------------------------

/** Colour codes, in case a terminal forced them on. */
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

/**
 * The CLI report's headline (`3 file(s) scanned, 2 transformed, 5 TODO(s)
 * left`) and the files its `✖` lines name, from what the CLI printed.
 */
export function readCliOutput(stdout, stderr) {
  const clean = text => (text ?? '').replace(ANSI, '');
  const headline = clean(stdout).match(
    /^(\d+) file\(s\) scanned, (\d+) transformed, (\d+) TODO\(s\) left$/m
  );
  const crashes = clean(stderr)
    .split('\n')
    .map(line => line.match(/^✖ (.+?): (.*)$/))
    .filter(Boolean)
    .map(([, file, message]) => ({ file, message }));
  return {
    summary: headline
      ? {
          scanned: Number(headline[1]),
          transformed: Number(headline[2]),
          todos: Number(headline[3]),
        }
      : null,
    crashes,
  };
}

/**
 * `tsc --pretty false` diagnostics, each `{ file, line, column, code,
 * message }` with the first line of its message. `file` is as tsc printed it,
 * or null for a diagnostic about the configuration; the caller makes it
 * relative to something stable.
 */
export function readTscOutput(output) {
  const diagnostics = [];
  for (const line of (output ?? '').split('\n')) {
    const located = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/);
    if (located) {
      const [, file, row, column, code, message] = located;
      diagnostics.push({
        file,
        line: Number(row),
        column: Number(column),
        code,
        message,
      });
      continue;
    }
    const global = line.match(/^error (TS\d+): (.*)$/);
    if (global) {
      diagnostics.push({
        file: null,
        line: null,
        column: null,
        code: global[1],
        message: global[2],
      });
    }
  }
  return diagnostics;
}

// ---- The report -------------------------------------------------------------

const byCodePoint = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function sortedUnique(values) {
  return [...new Set(values)].sort(byCodePoint);
}

/** A Map or record of counts as a record in code-point key order. */
function sortedRecord(counts) {
  const entries =
    counts instanceof Map ? [...counts] : Object.entries(counts ?? {});
  return Object.fromEntries(
    entries
      .filter(([, count]) => count !== 0)
      .sort(([a], [b]) => byCodePoint(a, b))
  );
}

function addCounts(into, counts) {
  for (const [key, count] of Object.entries(counts)) {
    into.set(key, (into.get(key) ?? 0) + count);
  }
}

function tally(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return sortedRecord(counts);
}

const sum = record => Object.values(record).reduce((a, b) => a + b, 0);

/**
 * What became of a page: `converted` (a module was written), `refused` (an
 * `html-file` refusal, such as a module already beside it or server-template
 * syntax), `empty` (no class the HTML input converts) or `crashed`.
 */
export const PAGE_STATUSES = Object.freeze([
  'converted',
  'refused',
  'empty',
  'crashed',
]);

function pageReport(page) {
  const marked = sortedRecord(page.marked);
  // A page that wrote no module converted nothing, and one whose module could
  // not be read (`left` null) is not known to have converted anything: either
  // way every class counts as still markup, never as converted.
  const left =
    page.module === null || page.left == null
      ? marked
      : sortedRecord(page.left);
  const checked = page.module !== null && page.typechecked === true;
  const diagnostics = [...(page.tsc ?? [])].sort(
    (a, b) =>
      (a.line ?? 0) - (b.line ?? 0) ||
      (a.column ?? 0) - (b.column ?? 0) ||
      byCodePoint(a.code, b.code) ||
      byCodePoint(a.message, b.message)
  );
  return {
    page: page.page,
    module: page.module ?? null,
    status: page.status ?? (page.module === null ? 'empty' : 'converted'),
    todos: page.todos.length,
    rules: tally(page.todos),
    components: {
      marked: sum(marked),
      converted: sum(marked) - sum(left),
      left: sum(left),
      markedByClass: marked,
      leftByClass: left,
    },
    tsc: {
      checked,
      errors: diagnostics.length,
      codes: tally(diagnostics.map(d => d.code)),
      diagnostics: diagnostics.map(({ line, column, code, message }) => ({
        line,
        column,
        code,
        message,
      })),
    },
  };
}

/** Totals over pages, or over templates' totals. */
function totals(parts) {
  const rules = new Map();
  const marked = new Map();
  const left = new Map();
  const codes = new Map();
  let pages = 0;
  let modules = 0;
  let refused = 0;
  let todos = 0;
  let errors = 0;
  let unchecked = 0;
  for (const part of parts) {
    // A part is one page's report, or a template's totals.
    const one = part.pages === undefined;
    pages += one ? 1 : part.pages;
    modules += one ? Number(part.module !== null) : part.modules;
    refused += one ? Number(part.status === 'refused') : part.refused;
    todos += part.todos;
    errors += part.tsc.errors;
    unchecked += one
      ? Number(part.module !== null && !part.tsc.checked)
      : part.tsc.unchecked;
    addCounts(rules, part.rules);
    addCounts(marked, part.components.markedByClass);
    addCounts(left, part.components.leftByClass);
    addCounts(codes, part.tsc.codes);
  }
  const markedByClass = sortedRecord(marked);
  const leftByClass = sortedRecord(left);
  return {
    pages,
    modules,
    refused,
    todos,
    rules: sortedRecord(rules),
    components: {
      marked: sum(markedByClass),
      converted: sum(markedByClass) - sum(leftByClass),
      left: sum(leftByClass),
      markedByClass,
      leftByClass,
    },
    tsc: { errors, unchecked, codes: sortedRecord(codes) },
  };
}

/**
 * The report of one run, the same bytes for the same run: templates in pin
 * order, pages by path, every keyed count in code-point key order, and nothing
 * that changes between two runs of the same code (no times, no absolute
 * paths). `run.templates` is what the script measured per template:
 * `{ slug, repo, sha, pages: [{ page, module, status, todos: [rule ids],
 * marked, left, typechecked, tsc }] }`, where `marked` is the page's count and
 * `left` the module's (null when the module could not be read), `status` is
 * one of `PAGE_STATUSES`, and `typechecked` says tsc read the module.
 * `run.failures` is
 * `[{ template, page, kind, message }]`.
 */
export function buildReport(run) {
  const order = new Map(TEMPLATES.map((pin, index) => [pin.slug, index]));
  const rank = slug => order.get(slug) ?? order.size;
  const templates = [...run.templates]
    .sort((a, b) => rank(a.slug) - rank(b.slug) || byCodePoint(a.slug, b.slug))
    .map(template => {
      const pages = [...template.pages]
        .sort((a, b) => byCodePoint(a.page, b.page))
        .map(pageReport);
      return {
        slug: template.slug,
        repo: template.repo,
        sha: template.sha,
        total: totals(pages),
        pages,
      };
    });
  const failures = [...(run.failures ?? [])]
    .map(({ template, page, kind, message }) => ({
      template,
      page: page ?? null,
      kind,
      message,
    }))
    .sort(
      (a, b) =>
        rank(a.template) - rank(b.template) ||
        byCodePoint(a.page ?? '', b.page ?? '') ||
        byCodePoint(a.kind, b.kind) ||
        byCodePoint(a.message, b.message)
    );
  return {
    corpus: 'awesome-bulma-templates',
    source: 'bulma-classes',
    css: run.css ?? 'bestax',
    total: totals(templates.map(template => template.total)),
    templates,
    failures,
  };
}

// ---- The report as Markdown -------------------------------------------------

/**
 * Column widths are fixed (or set by the pinned slugs and pages), never
 * measured from a run's numbers, so a count that grows a digit changes its own
 * row and no other: two reports diff line by line.
 */
const RULE_WIDTH = 40;
const CLASS_WIDTH = 20;
const COMPONENT_WIDTH = 20;
const NUMBER_WIDTH = 5;

const escapeCell = text => String(text).replaceAll('|', '\\|');

function row(cells) {
  return `| ${cells
    .map(({ text, width, right }) => {
      const value = escapeCell(text);
      return right ? value.padStart(width) : value.padEnd(width);
    })
    .join(' | ')} |`;
}

function table(columns, rows) {
  const header = row(columns.map(c => ({ ...c, right: false })));
  const rule = `| ${columns
    .map(c => (c.right ? `${'-'.repeat(c.width - 1)}:` : '-'.repeat(c.width)))
    .join(' | ')} |`;
  return [
    header,
    rule,
    ...rows.map(cells =>
      row(cells.map((text, index) => ({ ...columns[index], text })))
    ),
  ];
}

const text = (label, width) => ({
  text: label,
  width: Math.max(width, label.length),
});
const number = label => ({
  text: label,
  width: Math.max(label.length, NUMBER_WIDTH),
  right: true,
});

const SUMMARY_HEADINGS = [
  'Pages',
  'Modules',
  'Refused',
  'TODOs',
  'Classes',
  'Converted',
  'Left',
  'tsc errors',
];

/** The headings a page's row shares with the summary: TODOs onwards. */
const PAGE_HEADINGS = SUMMARY_HEADINGS.slice(SUMMARY_HEADINGS.indexOf('TODOs'));

const STATUS_WIDTH = Math.max(...PAGE_STATUSES.map(status => status.length));

function summaryCells(total) {
  return [
    total.pages,
    total.modules,
    total.refused,
    total.todos,
    total.components.marked,
    total.components.converted,
    total.components.left,
    total.tsc.errors,
  ];
}

/** The summary table on its own, which the script also prints. */
export function summaryTable(report) {
  const width = Math.max(
    'Template'.length,
    ...report.templates.map(t => t.slug.length)
  );
  return table(
    [text('Template', width), ...SUMMARY_HEADINGS.map(number)],
    [
      ...report.templates.map(t => [t.slug, ...summaryCells(t.total)]),
      ['Total', ...summaryCells(report.total)],
    ]
  );
}

/** A table of one keyed count, a row per key and a column per template. */
function byTemplateTable(report, heading, width, pick, extra = []) {
  const keys = sortedUnique(
    report.templates.flatMap(t => Object.keys(pick(t.total)))
  );
  if (keys.length === 0) return ['None.'];
  return table(
    [
      text(heading, width),
      ...extra.map(e => text(e.heading, e.width)),
      ...report.templates.map(t => number(t.slug)),
      number('Total'),
    ],
    keys.map(key => [
      key,
      ...extra.map(e => e.cell(key)),
      ...report.templates.map(t => pick(t.total)[key] ?? 0),
      pick(report.total)[key] ?? 0,
    ])
  );
}

/**
 * The report as Markdown: the summary, TODOs by rule and the classes left as
 * markup across templates, then the same per page, the tsc diagnostics and
 * the failures. `classes` is the ESLint plugin's table, for the component a
 * class names and whether the codemod converts it.
 */
export function renderMarkdown(report, classes) {
  const pageWidth = Math.max(
    'Page'.length,
    ...report.templates.flatMap(t =>
      t.pages.map(p => `${t.slug}/${p.page}`.length)
    )
  );
  // From the pages rather than the modules, which come and go between runs:
  // a module's name is never longer than its page's.
  const moduleWidth = Math.max(
    'Module'.length,
    ...report.templates.flatMap(t => t.pages.map(p => p.page.length))
  );
  const pages = report.templates.flatMap(t =>
    t.pages.map(p => ({ ...p, label: `${t.slug}/${p.page}` }))
  );
  const component = cls => classes.get(cls)?.component ?? '?';
  const converts = cls => {
    const entry = classes.get(cls);
    if (entry === undefined) return '?';
    return entry.converts ? 'converts' : 'by hand';
  };

  const lines = [
    '# Templates corpus',
    '',
    `bestax-migrate \`${report.source}\` over the ${report.corpus} pages, with \`--css ${report.css}\`. ` +
      '"Classes" counts the plain elements in a page styled with a Bulma class bestax has a component for, ' +
      "one per element, the way the ESLint plugin's `no-bulma-component-class` counts them, " +
      'whether or not the page wrote a module; "Left" is how many of those are still plain elements in the module, ' +
      'which is all of them for a page that wrote none. A refused page is one the HTML input declined (an `html-file` TODO says why). ' +
      'A module tsc did not read shows `-` for its tsc errors, and fails the run.',
    '',
    '## Pins',
    '',
    ...table(
      [
        text('Template', Math.max(...report.templates.map(t => t.slug.length))),
        text(
          'Repository',
          Math.max(...report.templates.map(t => t.repo.length))
        ),
        text('Commit', 40),
      ],
      report.templates.map(t => [t.slug, t.repo, t.sha])
    ),
    '',
    '## Summary',
    '',
    ...summaryTable(report),
    '',
    '## TODOs by rule',
    '',
    ...byTemplateTable(report, 'Rule', RULE_WIDTH, total => total.rules),
    '',
    '## Classes left as markup',
    '',
    ...byTemplateTable(
      report,
      'Class',
      CLASS_WIDTH,
      total => total.components.leftByClass,
      [
        { heading: 'Component', width: COMPONENT_WIDTH, cell: component },
        { heading: 'Codemod', width: 'converts'.length, cell: converts },
      ]
    ),
    '',
    '## Pages',
    '',
    ...table(
      [
        text('Page', pageWidth),
        text('Module', moduleWidth),
        text('Status', STATUS_WIDTH),
        ...PAGE_HEADINGS.map(number),
      ],
      pages.map(p => [
        p.label,
        p.module ?? '',
        p.status,
        p.todos,
        p.components.marked,
        p.components.converted,
        p.components.left,
        p.tsc.checked ? p.tsc.errors : '-',
      ])
    ),
    '',
    '### TODOs by page and rule',
    '',
    ...(pages.some(p => p.todos > 0)
      ? table(
          [text('Page', pageWidth), text('Rule', RULE_WIDTH), number('TODOs')],
          pages.flatMap(p =>
            Object.entries(p.rules).map(([rule, count]) => [
              p.label,
              rule,
              count,
            ])
          )
        )
      : ['None.']),
    '',
    '### Classes left as markup by page',
    '',
    ...(pages.some(p => p.components.left > 0)
      ? table(
          [
            text('Page', pageWidth),
            text('Class', CLASS_WIDTH),
            text('Component', COMPONENT_WIDTH),
            number('Left'),
          ],
          pages.flatMap(p =>
            Object.entries(p.components.leftByClass).map(([cls, count]) => [
              p.label,
              cls,
              component(cls),
              count,
            ])
          )
        )
      : ['None.']),
    '',
    '## tsc diagnostics',
    '',
    'Listed, never failed on: a module is a start for a hand port, not a finished one.',
    '',
  ];
  const diagnostics = report.templates.flatMap(t =>
    t.pages.flatMap(p =>
      p.tsc.diagnostics.map(
        d =>
          `${t.slug}/${p.module ?? p.page}:${d.line ?? '-'}:${d.column ?? '-'} ${d.code} ${d.message}`
      )
    )
  );
  if (diagnostics.length === 0) lines.push('None.');
  else lines.push('```text', ...diagnostics, '```');
  lines.push('', '## Failures', '');
  if (report.failures.length === 0) lines.push('None.');
  else {
    for (const failure of report.failures) {
      const where = failure.page
        ? `${failure.template}/${failure.page}`
        : failure.template;
      lines.push(`- ${where}: ${failure.kind}: ${failure.message}`);
    }
  }
  return `${lines.join('\n')}\n`;
}
