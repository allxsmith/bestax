/**
 * The pure half of `scripts/validate-corpus-templates.mjs`, without the
 * network: the pin list, the vocabulary a rule id is held to, the component
 * class count, the readers for what the CLI and tsc print, and the report.
 * The report is the measuring stick for a round of fixes, so what is tested
 * hardest is that it is the same bytes for the same run, and that a change in
 * one count changes only the rows that hold it.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BARE_RULES,
  TEMPLATES,
  buildReport,
  componentClassCounts,
  isPage,
  outsideVocabulary,
  parseModule,
  pinViolations,
  readCliOutput,
  readTscOutput,
  renderMarkdown,
  repoUrl,
  summaryTable,
} from '../scripts/lib/corpus-templates.mjs';
import {
  HTML_KINDS,
  inHtmlVocabulary,
} from '../src/sources/bulma-classes/html-rules.js';
import { KINDS, inVocabulary } from '../src/sources/bulma-classes/rules.js';

const vocabulary = {
  kinds: KINDS,
  inVocabulary,
  htmlKinds: HTML_KINDS,
  inHtmlVocabulary,
};

/** A slice of the ESLint plugin's table, in its order: families first. */
const CLASSES = new Map([
  ['modal', { component: 'Modal', converts: false }],
  ['navbar-burger', { component: 'Navbar.Burger', converts: false }],
  ['columns', { component: 'Columns', converts: true }],
  ['buttons', { component: 'Buttons', converts: true }],
  ['button', { component: 'Button', converts: true }],
  ['icon', { component: 'Icon', converts: true }],
  ['hero', { component: 'Hero', converts: true }],
]);

const counts = (code: string) =>
  componentClassCounts(parseModule(code), CLASSES);

describe('the pin list', () => {
  it('pins every template to a full commit, once', () => {
    expect(pinViolations(TEMPLATES)).toEqual([]);
    expect(Object.isFrozen(TEMPLATES)).toBe(true);
    expect(TEMPLATES.every(pin => Object.isFrozen(pin))).toBe(true);
  });

  it('names what is wrong with a pin', () => {
    const good = {
      slug: 'login',
      repo: 'aldi/bulma-login-template',
      sha: 'a'.repeat(40),
      issue: 1,
    };
    expect(
      pinViolations([
        good,
        { ...good },
        { ...good, slug: 'Bad Slug' },
        { ...good, slug: 'short-sha', sha: 'abc1234' },
        { ...good, slug: 'upper-sha', sha: 'A'.repeat(40) },
        { ...good, slug: 'no-owner', repo: 'bulma-login-template' },
        { ...good, slug: 'no-issue', issue: undefined },
        {},
      ])
    ).toEqual([
      'pin 1 (login): the slug is already used by another pin',
      'pin 2 (Bad Slug): the slug must be lowercase words joined by -',
      'pin 3 (short-sha): the sha must be a full commit SHA',
      'pin 4 (upper-sha): the sha must be a full commit SHA',
      'pin 5 (no-owner): the repo must be owner/name on GitHub',
      "pin 6 (no-issue): the issue must be the port issue's number",
      'pin 7 (no slug): the slug must be lowercase words joined by -',
      'pin 7 (no slug): the repo must be owner/name on GitHub',
      'pin 7 (no slug): the sha must be a full commit SHA',
      "pin 7 (no slug): the issue must be the port issue's number",
    ]);
  });

  it('fetches from GitHub, and reads .html and .htm pages', () => {
    expect(repoUrl(TEMPLATES[0])).toBe(
      `https://github.com/${TEMPLATES[0].repo}.git`
    );
    expect(['a.html', 'b/c.HTM', 'd.htm'].every(isPage)).toBe(true);
    expect(['a.html.bak', 'b.tsx', 'html'].some(isPage)).toBe(false);
  });
});

describe('the rule vocabulary', () => {
  it('takes what ruleId and htmlRuleId build', () => {
    expect(
      outsideVocabulary(
        [
          'html-asset',
          'html-head:title',
          'html-parse:duplicate-attribute',
          'html-event:onclick',
          'family:modal',
          'tag:Title',
          'defaults:Icon',
          'context',
          ...BARE_RULES,
        ],
        vocabulary
      )
    ).toEqual([]);
  });

  it('names each id outside it once, sorted', () => {
    expect(
      outsideVocabulary(
        [
          'html-head:script',
          'family:not-a-bulma-class',
          'bogus',
          'html-url:https://example.com',
          'bogus',
          'tag:Title:extra',
        ],
        vocabulary
      )
    ).toEqual([
      'bogus',
      'family:not-a-bulma-class',
      'html-head:script',
      'html-url:https://example.com',
      'tag:Title:extra',
    ]);
  });

  it("holds the transform's file-level gates as bare rules", () => {
    const transform = fs.readFileSync(
      path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        '..',
        'src',
        'sources',
        'bulma-classes',
        'transform.ts'
      ),
      'utf8'
    );
    const gates = [
      ...transform.matchAll(
        /(?:addTodo\(\s*ctx,\s*[^,]+,|\bblock\()\s*'([^']+)'/g
      ),
    ].map(match => match[1]);
    expect(gates.length).toBeGreaterThan(0);
    expect(gates.filter(gate => !BARE_RULES.includes(gate))).toEqual([]);
  });
});

describe('the component class count', () => {
  it('counts an element once, for the class the ESLint rule reports', () => {
    expect(
      counts(`
        const page = (
          <div>
            <a className="button is-primary">Go</a>
            <div className="buttons"><button className="button">A</button></div>
            <a className="navbar-burger button" role="button" />
            <div className="columns is-modal">x</div>
            <span className={"icon"} />
            <span className={\`icon is-small\`} />
          </div>
        );
      `)
    ).toEqual({
      button: 2,
      buttons: 1,
      columns: 1,
      icon: 2,
      'navbar-burger': 1,
    });
  });

  it('reads plain HTML only, the way the rule does', () => {
    expect(
      counts(`
        const page = (
          <>
            <Button className="button">bestax</Button>
            <my-card className="button">custom</my-card>
            <svg className="icon"><g className="button" /></svg>
            <math><mi className="icon" /></math>
            <a className={cx("button")}>runtime</a>
            <a className={\`button \${size}\`}>runtime</a>
            <a className="is-primary has-text-centered">helpers</a>
            <a>{"button"}</a>
          </>
        );
      `)
    ).toEqual({});
  });

  it('finds elements anywhere in the module, in key order', () => {
    const result = counts(`
      export default function Page() {
        const items = ["a"].map(item => <span className="icon" key={item} />);
        return <div className="modal">{items}<a className="button" /></div>;
      }
    `);
    expect(result).toEqual({ button: 1, icon: 1, modal: 1 });
    expect(Object.keys(result)).toEqual(['button', 'icon', 'modal']);
  });

  it('refuses a module that does not parse', () => {
    expect(() => parseModule('<div>')).toThrow();
  });
});

describe('reading what the CLI and tsc print', () => {
  it("reads the CLI's headline and its crash lines", () => {
    const escape = String.fromCharCode(27);
    expect(
      readCliOutput(
        [
          'Wrote index.tsx from index.html.',
          '',
          `${escape}[1mbestax-migrate — Bulma classes${escape}[22m`,
          `2 file(s) scanned, ${escape}[32m1${escape}[39m transformed, 5 TODO(s) left`,
        ].join('\n'),
        `${escape}[31m✖ pages/a.html: Unexpected token${escape}[39m\nnoise\n`
      )
    ).toEqual({
      summary: { scanned: 2, transformed: 1, todos: 5 },
      crashes: [{ file: 'pages/a.html', message: 'Unexpected token' }],
    });
    expect(readCliOutput('', undefined)).toEqual({
      summary: null,
      crashes: [],
    });
  });

  it("reads tsc's diagnostics, the first line of each", () => {
    expect(
      readTscOutput(
        [
          "index.tsx(12,5): error TS2322: Type 'string' is not assignable to type 'number'.",
          "  Types of property 'size' are incompatible.",
          "error TS5083: Cannot read file 'tsconfig.base.json'.",
          'Found 2 errors.',
        ].join('\n')
      )
    ).toEqual([
      {
        file: 'index.tsx',
        line: 12,
        column: 5,
        code: 'TS2322',
        message: "Type 'string' is not assignable to type 'number'.",
      },
      {
        file: null,
        line: null,
        column: null,
        code: 'TS5083',
        message: "Cannot read file 'tsconfig.base.json'.",
      },
    ]);
    expect(readTscOutput(undefined)).toEqual([]);
  });
});

// ---- the report -------------------------------------------------------------

interface PageInput {
  page: string;
  module: string | null;
  todos: string[];
  marked: Record<string, number>;
  left: Record<string, number>;
  tsc: Array<{
    line: number | null;
    column: number | null;
    code: string;
    message: string;
  }>;
}

// Two pins whose pin order is not their code-point order.
const pinned = (slug: string) => TEMPLATES.find(pin => pin.slug === slug)!;
const login = pinned('login');
const cv = pinned('cv');

function page(overrides: Partial<PageInput> = {}): PageInput {
  return {
    page: 'index.html',
    module: 'index.tsx',
    todos: ['html-asset', 'tag:Hero', 'html-asset'],
    marked: { button: 3, hero: 1 },
    left: { hero: 1 },
    tsc: [],
    ...overrides,
  };
}

function run(loginPages: PageInput[] = [page()]) {
  return {
    css: 'bestax',
    templates: [
      // Out of pin order on purpose.
      {
        slug: cv.slug,
        repo: cv.repo,
        sha: cv.sha,
        pages: [
          page({ page: 'b.html', module: 'b.tsx', todos: ['family:modal'] }),
          page({
            page: 'a.html',
            module: null,
            todos: [],
            marked: {},
            left: {},
          }),
        ],
      },
      { slug: login.slug, repo: login.repo, sha: login.sha, pages: loginPages },
    ],
    failures: [
      {
        template: cv.slug,
        page: 'b.html',
        kind: 'unparseable',
        message: 'b.tsx: Unexpected token',
      },
      { template: login.slug, kind: 'cli', message: 'the CLI disagreed' },
    ],
  };
}

describe('the report', () => {
  it('orders templates by pin, pages by path, and keys by code point', () => {
    const report = buildReport(run());
    expect(report.templates.map(t => t.slug)).toEqual([login.slug, cv.slug]);
    expect(report.templates[1].pages.map(p => p.page)).toEqual([
      'a.html',
      'b.html',
    ]);
    expect(report.templates[0].pages[0]).toEqual({
      page: 'index.html',
      module: 'index.tsx',
      todos: 3,
      rules: { 'html-asset': 2, 'tag:Hero': 1 },
      components: {
        marked: 4,
        converted: 3,
        left: 1,
        markedByClass: { button: 3, hero: 1 },
        leftByClass: { hero: 1 },
      },
      tsc: { errors: 0, codes: {}, diagnostics: [] },
    });
    expect(report.failures).toEqual([
      {
        template: login.slug,
        page: null,
        kind: 'cli',
        message: 'the CLI disagreed',
      },
      {
        template: cv.slug,
        page: 'b.html',
        kind: 'unparseable',
        message: 'b.tsx: Unexpected token',
      },
    ]);
  });

  it('totals pages into templates and templates into the corpus', () => {
    const report = buildReport(run());
    expect(report.templates[1].total).toEqual({
      pages: 2,
      modules: 1,
      todos: 1,
      rules: { 'family:modal': 1 },
      components: {
        marked: 4,
        converted: 3,
        left: 1,
        markedByClass: { button: 3, hero: 1 },
        leftByClass: { hero: 1 },
      },
      tsc: { errors: 0, codes: {} },
    });
    expect(report.total).toMatchObject({
      pages: 3,
      modules: 2,
      todos: 4,
      rules: { 'family:modal': 1, 'html-asset': 2, 'tag:Hero': 1 },
      components: { marked: 8, converted: 6, left: 2 },
    });
  });

  it('sorts tsc diagnostics by position and tallies their codes', () => {
    const report = buildReport(
      run([
        page({
          tsc: [
            { line: 9, column: 1, code: 'TS2322', message: 'b' },
            { line: 2, column: 7, code: 'TS2741', message: 'a' },
            { line: 2, column: 3, code: 'TS2322', message: 'c' },
          ],
        }),
      ])
    );
    const { tsc } = report.templates[0].pages[0];
    expect(tsc.errors).toBe(3);
    expect(tsc.codes).toEqual({ TS2322: 2, TS2741: 1 });
    expect(tsc.diagnostics.map(d => d.message)).toEqual(['c', 'a', 'b']);
    expect(report.total.tsc).toEqual({
      errors: 3,
      codes: { TS2322: 2, TS2741: 1 },
    });
  });

  it('is the same bytes whatever order the run measured in', () => {
    const forward = run();
    const backward = {
      ...forward,
      templates: [...forward.templates].reverse().map(t => ({
        ...t,
        pages: [...t.pages].reverse(),
      })),
      failures: [...forward.failures].reverse(),
    };
    const json = (input: typeof forward) =>
      JSON.stringify(buildReport(input), null, 2);
    expect(json(backward)).toBe(json(forward));
    expect(renderMarkdown(buildReport(backward), CLASSES)).toBe(
      renderMarkdown(buildReport(forward), CLASSES)
    );
  });
});

describe('the report as Markdown', () => {
  const markdown = renderMarkdown(buildReport(run()), CLASSES);
  const lines = markdown.split('\n');

  it('has the summary, the rules, the classes left, the pages and the failures', () => {
    for (const heading of [
      '## Pins',
      '## Summary',
      '## TODOs by rule',
      '## Classes left as markup',
      '## Pages',
      '### TODOs by page and rule',
      '### Classes left as markup by page',
      '## tsc diagnostics',
      '## Failures',
    ]) {
      expect(lines).toContain(heading);
    }
    expect(lines).toContain(
      `| ${login.slug.padEnd('Template'.length)} | ${login.repo} | ${login.sha} |`
    );
    expect(lines.find(line => line.startsWith('| hero '))).toBe(
      `| hero${' '.repeat(16)} | Hero${' '.repeat(16)} | converts |     1 |     1 |     2 |`
    );
    expect(lines).toContain(`- ${login.slug}: cli: the CLI disagreed`);
    expect(lines).toContain(
      `- ${cv.slug}/b.html: unparseable: b.tsx: Unexpected token`
    );
    expect(
      markdown.endsWith(
        'None.\n\n## Failures\n\n- login: cli: the CLI disagreed\n- cv/b.html: unparseable: b.tsx: Unexpected token\n'
      )
    ).toBe(true);
  });

  it('prints the summary table it opens with', () => {
    const summary = summaryTable(buildReport(run()));
    expect(summary).toEqual([
      '| Template | Pages | Modules | TODOs | Classes | Converted | Left  | tsc errors |',
      '| -------- | ----: | ------: | ----: | ------: | --------: | ----: | ---------: |',
      '| login    |     1 |       1 |     3 |       4 |         3 |     1 |          0 |',
      '| cv       |     2 |       1 |     1 |       4 |         3 |     1 |          0 |',
      '| Total    |     3 |       2 |     4 |       8 |         6 |     2 |          0 |',
    ]);
    expect(markdown).toContain(summary.join('\n'));
  });

  it('changes only the rows holding a count when it grows a digit', () => {
    const many = (n: number) =>
      renderMarkdown(
        buildReport(
          run([page({ todos: Array.from({ length: n }, () => 'html-asset') })])
        ),
        CLASSES
      ).split('\n');
    const before = many(9);
    const after = many(10);
    expect(after).toHaveLength(before.length);
    const changed = after.filter((line, index) => line !== before[index]);
    expect(changed).toEqual([
      '| login    |     1 |       1 |    10 |       4 |         3 |     1 |          0 |',
      '| Total    |     3 |       2 |    11 |       8 |         6 |     2 |          0 |',
      `| html-asset${' '.repeat(30)} |    10 |     0 |    10 |`,
      `| login/index.html | index.tsx  |    10 |       4 |         3 |     1 |          0 |`,
      `| login/index.html | html-asset${' '.repeat(30)} |    10 |`,
    ]);
  });

  it('lists tsc diagnostics, and says None where there is nothing', () => {
    const report = buildReport(
      run([
        page({
          tsc: [{ line: 3, column: 9, code: 'TS2322', message: 'Nope.' }],
        }),
      ])
    );
    expect(renderMarkdown(report, CLASSES)).toContain(
      '```text\nlogin/index.tsx:3:9 TS2322 Nope.\n```'
    );
    const empty = renderMarkdown(
      buildReport({ templates: [], failures: [] }),
      CLASSES
    );
    expect(empty.match(/^None\.$/gm)).toHaveLength(6);
    expect(empty).toContain('`--css bestax`');
  });

  it('marks a class the table does not know', () => {
    const report = buildReport(
      run([page({ marked: { tile: 2 }, left: { tile: 2 } })])
    );
    expect(
      renderMarkdown(report, CLASSES)
        .split('\n')
        .find(line => line.startsWith('| tile '))
    ).toBe(
      `| tile${' '.repeat(16)} | ?${' '.repeat(19)} | ?        |     2 |     0 |     2 |`
    );
  });
});
