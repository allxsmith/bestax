/**
 * The pure half of `validate-corpus-templates.mjs`: the upstream templates and
 * the commits they are pinned at, the vocabulary a rule id is held to, the
 * count of Bulma component classes in a module, readers for what the CLI and
 * `tsc` print, and the report built from one run.
 *
 * Nothing here reads the network or the disk, so `e2e/corpus-templates.test.ts`
 * runs all of it with the ordinary suite.
 */

import { parse } from '@babel/parser';

// ---- The corpus -------------------------------------------------------------

/**
 * The awesome-bulma-templates repos the corpus runs over, each at the commit
 * its port issue under #1118 names. This is the one home of those pins. Move a
 * pin on purpose only: a new commit changes the pages, so a report from before
 * it no longer compares with one from after.
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

/** What is wrong with a pin list, as one line per problem. */
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

// ---- Rule ids ---------------------------------------------------------------

/**
 * The ids a bulma-classes run emits without a `kind:token` shape: the
 * transform's file-level gates (`rules.test.ts` holds that list to the
 * transform), the stylesheet-import pass's, the manifest pass's, and the CLI's
 * own report of a file it cannot parse.
 */
export const BARE_RULES = Object.freeze([
  'css',
  'deps',
  'imports',
  'jsx-runtime',
  'peer-deps',
  'rsc',
  'styled-jsx',
  'unsupported-file',
]);

/**
 * The rule ids that are outside the vocabulary, sorted and once each. An id is
 * in it when it is a bare rule, or a planner or HTML kind with no token or a
 * token that kind's vocabulary holds: what `ruleId` and `htmlRuleId` can
 * build. `vocabulary` is those modules' exports, passed in so this stays pure.
 */
export function outsideVocabulary(rules, vocabulary) {
  const { kinds, inVocabulary, htmlKinds, inHtmlVocabulary } = vocabulary;
  const inside = rule => {
    if (BARE_RULES.includes(rule)) return true;
    const colon = rule.indexOf(':');
    const kind = colon === -1 ? rule : rule.slice(0, colon);
    const token = colon === -1 ? undefined : rule.slice(colon + 1);
    if (htmlKinds.has(kind)) {
      return token === undefined || inHtmlVocabulary(kind, token);
    }
    if (kinds.has(kind)) return token === undefined || inVocabulary(token);
    return false;
  };
  return sortedUnique([...rules].filter(rule => !inside(rule)));
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
 * How many plain elements carry each Bulma component class, keyed by class in
 * code-point order. `classes` is the ESLint plugin's `BULMA_COMPONENT_CLASSES`,
 * and an element counts once, for the class `no-bulma-component-class`
 * reports it by: the first family class it carries, else the converted class
 * the table ranks first. Like that rule it reads lowercase tags outside
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
      if (tokens !== null) {
        const family = tokens.find(
          token => classes.get(token)?.converts === false
        );
        const cls =
          family ?? [...classes.keys()].find(key => tokens.includes(key));
        if (cls !== undefined) counts.set(cls, (counts.get(cls) ?? 0) + 1);
      }
    }
    for (const [key, child] of Object.entries(node)) {
      if (!SKIPPED_KEYS.has(key)) visit(child, inside);
    }
  };
  visit(ast.program ?? ast, false);
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

function pageReport(page) {
  const marked = sortedRecord(page.marked);
  const left = sortedRecord(page.left);
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

/** Totals over pages (or over templates' totals, which have the same shape). */
function totals(parts) {
  const rules = new Map();
  const marked = new Map();
  const left = new Map();
  const codes = new Map();
  let pages = 0;
  let modules = 0;
  let todos = 0;
  let errors = 0;
  for (const part of parts) {
    pages += part.pages ?? 1;
    modules += part.modules ?? (part.module === null ? 0 : 1);
    todos += part.todos;
    errors += part.tsc.errors;
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
    todos,
    rules: sortedRecord(rules),
    components: {
      marked: sum(markedByClass),
      converted: sum(markedByClass) - sum(leftByClass),
      left: sum(leftByClass),
      markedByClass,
      leftByClass,
    },
    tsc: { errors, codes: sortedRecord(codes) },
  };
}

/**
 * The report of one run, the same bytes for the same run: templates in pin
 * order, pages by path, every keyed count in code-point key order, and nothing
 * that changes between two runs of the same code (no times, no absolute
 * paths). `run.templates` is what the script measured per template:
 * `{ slug, repo, sha, pages: [{ page, module, todos: [rule ids], marked,
 * left, tsc }] }`, and `run.failures` is `[{ template, page, kind, message }]`.
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
  'TODOs',
  'Classes',
  'Converted',
  'Left',
  'tsc errors',
];

function summaryCells(total) {
  return [
    total.pages,
    total.modules,
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
      "one per element, the way the ESLint plugin's `no-bulma-component-class` counts them; " +
      '"Left" is how many of those are still plain elements in the module.',
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
        ...SUMMARY_HEADINGS.slice(2).map(number),
      ],
      pages.map(p => [
        p.label,
        p.module ?? '',
        p.todos,
        p.components.marked,
        p.components.converted,
        p.components.left,
        p.tsc.errors,
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
