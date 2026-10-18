/**
 * The offline half of `scripts/validate-corpus-templates.mjs`, without the
 * network: the pin list, the scratch package, the gate on the rules a run
 * emits, the component class counts, the readers for what the CLI and tsc
 * print, and the report. The report is the measuring stick for a round of
 * fixes, so what is tested hardest is that it is the same bytes for the same
 * run, that a change in one count changes only the rows that hold it, and
 * that a page or module the run could not measure says so instead of reading
 * as zero.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BULMA_COMPONENT_CLASSES } from '../../eslint-plugin/src/generated/metadata.js';
import {
  AMBIENT_TYPES,
  TEMPLATES,
  buildReport,
  componentClassCounts,
  isPage,
  missingBuilds,
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
  upstreamName,
} from '../scripts/lib/corpus-templates.mjs';
import { parseHtml } from '../src/sources/_shared/html/parse.js';
import {
  convertPage,
  outputPathFor,
} from '../src/sources/bulma-classes/html.js';
import { analyzeProject } from '../src/sources/bulma-classes/project.js';
import { undocumentedRules } from './support/skill-rules.js';

const packageRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const tscBin = createRequire(import.meta.url).resolve('typescript/bin/tsc');

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
const pageCounts = (html: string) =>
  pageClassCounts(parseHtml(html).root, CLASSES);

describe('the pin list', () => {
  it('pins every template to a full commit, once', () => {
    expect(pinViolations(TEMPLATES)).toEqual([]);
    expect(Object.isFrozen(TEMPLATES)).toBe(true);
    expect(TEMPLATES.every(pin => Object.isFrozen(pin))).toBe(true);
  });

  it('names what is wrong with the shape of a pin', () => {
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

describe('before a run', () => {
  let root: string;

  beforeAll(() => {
    const tmpRoot = path.join(packageRoot, '.e2e-tmp');
    fs.mkdirSync(tmpRoot, { recursive: true });
    root = fs.mkdtempSync(path.join(tmpRoot, 'corpus-builds-'));
    fs.mkdirSync(path.join(root, 'bulma-ui'));
    fs.writeFileSync(
      path.join(root, 'bulma-ui', 'package.json'),
      '{"types":"dist/types/index.d.ts"}'
    );
  });

  afterAll(() => {
    if (!process.env.BESTAX_E2E_KEEP) {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  const build = (rel: string) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), '');
  };

  it('wants this package and the library built, the library by its types entry', () => {
    expect(missingBuilds(root)).toEqual([
      'bestax-migrate/dist is not built: run `pnpm --filter bestax-migrate build`',
      'bulma-ui/dist/types/index.d.ts is not built, and every module imports @allxsmith/bestax-bulma: run `pnpm --filter @allxsmith/bestax-bulma build`',
    ]);
    build('bestax-migrate/dist/index.js');
    expect(missingBuilds(root)).toHaveLength(1);
    build('bulma-ui/dist/types/index.d.ts');
    expect(missingBuilds(root)).toEqual([]);
  });
});

describe('the scratch package', () => {
  const tmpRoot = path.join(packageRoot, '.e2e-tmp');
  let dir: string;

  beforeAll(() => {
    fs.mkdirSync(tmpRoot, { recursive: true });
    // Per process, never a shared path (see kitchen-sink.test.ts).
    dir = fs.mkdtempSync(path.join(tmpRoot, 'corpus-templates-'));
    const from = path.join(dir, 'upstream');
    const write = (rel: string, text: string) => {
      fs.mkdirSync(path.dirname(path.join(from, rel)), { recursive: true });
      fs.writeFileSync(path.join(from, rel), text);
    };
    write('.git/HEAD', 'ref: refs/heads/main\n');
    write('index.html', '<a class="button">Go</a>');
    write('package.json', '{"name":"upstream"}');
    write('tsconfig.json', '{"compilerOptions":{"jsxImportSource":"preact"}}');
    // A nested manifest with no TypeScript and no tsconfig beside it, which
    // would outrank the scratch package's for the page under it.
    write('docs/package.json', '{"name":"docs"}');
    write('docs/page.html', '<a class="button">Go</a>');
  });

  afterAll(() => {
    if (!process.env.BESTAX_E2E_KEEP) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  const extensions = (pkg: string) => {
    const pages = ['index.html', 'docs/page.html'].map(page =>
      path.join(pkg, page)
    );
    const project = analyzeProject(pages);
    return pages.map(page => path.extname(outputPathFor(page, project)));
  };

  it('would write .jsx, on another runtime, with the upstream files left', () => {
    const control = path.join(dir, 'control');
    fs.cpSync(path.join(dir, 'upstream'), control, { recursive: true });
    fs.writeFileSync(
      path.join(control, 'package.json'),
      '{"devDependencies":{"typescript":"*"}}'
    );
    expect(extensions(control)).toEqual(['.tsx', '.jsx']);
    expect(
      analyzeProject([path.join(control, 'index.html')]).jsxRuntimes
    ).toEqual([{ dir: control, runtime: 'preact' }]);
  });

  it('keeps upstream project files out of the way, so every page is .tsx', () => {
    const pkg = path.join(dir, 'scratch');
    expect(
      prepareScratchPackage(path.join(dir, 'upstream'), pkg, 'corpus-test')
    ).toEqual(['docs/package.json', 'package.json', 'tsconfig.json']);
    expect(extensions(pkg)).toEqual(['.tsx', '.tsx']);
    expect(fs.existsSync(path.join(pkg, '.git'))).toBe(false);
    expect(
      [
        'docs/package.json',
        'docs/package.upstream.json',
        'tsconfig.json',
        'tsconfig.upstream.json',
      ].map(rel => fs.existsSync(path.join(pkg, rel)))
    ).toEqual([false, true, false, true]);
    // The upstream tsconfig would have put the pages on another JSX runtime.
    expect(analyzeProject([path.join(pkg, 'index.html')]).jsxRuntimes).toEqual(
      []
    );
    expect(
      JSON.parse(fs.readFileSync(path.join(pkg, 'package.json'), 'utf8'))
    ).toEqual({
      name: 'corpus-test',
      private: true,
      devDependencies: { typescript: '*' },
    });
    expect(
      fs.readFileSync(path.join(pkg, 'package.upstream.json'), 'utf8')
    ).toBe('{"name":"upstream"}');
  });

  it('names an upstream file beside where it was', () => {
    expect(upstreamName('docs/tsconfig.json')).toBe(
      'docs/tsconfig.upstream.json'
    );
  });

  it('type-checks a stylesheet import the way a Vite app does', () => {
    const pkg = path.join(dir, 'typed');
    prepareScratchPackage(path.join(dir, 'upstream'), pkg, 'corpus-typed');
    const module = (name: string, lines: string[]) =>
      fs.writeFileSync(path.join(pkg, name), `${lines.join('\n')}\n`);
    // What `--css bestax` writes, and a page's own stylesheet beside it.
    module('index.tsx', [
      'import "@allxsmith/bestax-bulma/bestax.css";',
      'import "./css/styles.css";',
      '',
      'export default function IndexPage() {',
      '  return <div className="box" />;',
      '}',
    ]);
    const tsc = (config: object) => {
      fs.writeFileSync(path.join(pkg, 'tsconfig.json'), JSON.stringify(config));
      const result = spawnSync(
        process.execPath,
        [tscBin, '-p', pkg, '--pretty', 'false'],
        { cwd: pkg, encoding: 'utf8' }
      );
      return readTscOutput(`${result.stdout}${result.stderr}`).map(
        ({ file, code }) => `${file} ${code}`
      );
    };

    expect(fs.readFileSync(path.join(pkg, AMBIENT_TYPES), 'utf8')).toBe(
      "declare module '*.css' {}\n"
    );
    expect(tsc(scratchTsconfig(['index.tsx']))).toEqual([]);
    // Without the ambient types TypeScript refuses both imports, which is
    // what every module would get from the scratch setup alone.
    expect(tsc({ ...scratchTsconfig([]), files: ['index.tsx'] })).toEqual([
      'index.tsx TS2882',
      'index.tsx TS2882',
    ]);
  });
});

describe('the rule gate', () => {
  const failures = (pages: Array<{ page: string; todos: string[] }>) =>
    undocumentedRuleFailures('login', pages, undocumentedRules);

  it("passes the rules the skill's references document", () => {
    expect(
      failures([
        {
          page: 'index.html',
          todos: [
            'html-asset',
            'html-head:title',
            'html-parse:duplicate-attribute',
            'family:modal',
            'tag:Title',
            'defaults:Icon',
          ],
        },
      ])
    ).toEqual([]);
  });

  it('fails a rule they do not, once per page that carries it', () => {
    expect(
      failures([
        {
          page: 'a.html',
          todos: ['html-asset', 'nope:thing', 'nope:thing', 'bogus'],
        },
        { page: 'b.html', todos: ['nope:thing'] },
        { page: 'c.html', todos: ['family:modal'] },
      ])
    ).toEqual([
      {
        template: 'login',
        page: 'a.html',
        kind: 'undocumented-rule',
        message: "bogus is not in skills/bestax-migrate's references",
      },
      {
        template: 'login',
        page: 'a.html',
        kind: 'undocumented-rule',
        message: "nope:thing is not in skills/bestax-migrate's references",
      },
      {
        template: 'login',
        page: 'b.html',
        kind: 'undocumented-rule',
        message: "nope:thing is not in skills/bestax-migrate's references",
      },
    ]);
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

  it("counts a page's content from its DOM the same way", () => {
    expect(
      pageCounts(`<!doctype html>
        <html class="modal"><body class="modal">
          <a class="button is-primary">Go</a>
          <div class="buttons"><button class="button">A</button></div>
          <a class="navbar-burger button" role="button"></a>
          <div class="columns is-modal">x</div>
          <template><span class="icon"></span></template>
        </body></html>`)
    ).toEqual({
      button: 2,
      buttons: 1,
      columns: 1,
      icon: 1,
      'navbar-burger': 1,
    });
  });

  it('reads only what the converter writes as plain HTML', () => {
    expect(
      pageCounts(`<div>
        <my-card class="button"><span class="icon"></span></my-card>
        <svg class="icon"><g class="button"></g>
          <foreignObject><div class="button"></div></foreignObject></svg>
        <math><mi class="icon"></mi></math>
        <script class="button">go()</script>
        <a class="is-primary">helpers</a>
      </div>`)
    ).toEqual({ icon: 1 });
  });

  it('agrees with the module count on the HTML kitchen sink', () => {
    const pages = path.join(
      packageRoot,
      'fixtures',
      'bulma-classes-html',
      'pages'
    );
    for (const page of [
      'landing.html',
      'partials/pricing.html',
      'leftovers.html',
    ]) {
      const source = fs.readFileSync(path.join(pages, page), 'utf8');
      // Converted where no module is beside it, so nothing refuses it.
      const { intermediate } = convertPage(
        path.join(packageRoot, '.e2e-tmp', 'no-such-dir', page),
        source,
        undefined,
        { cssMode: 'keep' }
      );
      expect({
        page,
        counts: pageClassCounts(
          parseHtml(source).root,
          BULMA_COMPONENT_CLASSES
        ),
      }).toEqual({
        page,
        counts: componentClassCounts(
          parseModule(intermediate!),
          BULMA_COMPONENT_CLASSES
        ),
      });
    }
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
  status: string;
  todos: string[];
  marked: Record<string, number>;
  left: Record<string, number> | null;
  typechecked: boolean;
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
    status: 'converted',
    todos: ['html-asset', 'tag:Hero', 'html-asset'],
    marked: { button: 3, hero: 1 },
    left: { hero: 1 },
    typechecked: true,
    tsc: [],
    ...overrides,
  };
}

/** A page that wrote no module because the HTML input declined it. */
const refused = page({
  module: null,
  status: 'refused',
  todos: ['html-file:template-syntax'],
  left: {},
  typechecked: false,
});

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
            status: 'empty',
            todos: [],
            marked: {},
            left: {},
            typechecked: false,
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
      status: 'converted',
      todos: 3,
      rules: { 'html-asset': 2, 'tag:Hero': 1 },
      components: {
        marked: 4,
        converted: 3,
        left: 1,
        markedByClass: { button: 3, hero: 1 },
        leftByClass: { hero: 1 },
      },
      tsc: { checked: true, errors: 0, codes: {}, diagnostics: [] },
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
      refused: 0,
      todos: 1,
      rules: { 'family:modal': 1 },
      components: {
        marked: 4,
        converted: 3,
        left: 1,
        markedByClass: { button: 3, hero: 1 },
        leftByClass: { hero: 1 },
      },
      tsc: { errors: 0, unchecked: 0, codes: {} },
    });
    expect(report.total).toMatchObject({
      pages: 3,
      modules: 2,
      refused: 0,
      todos: 4,
      rules: { 'family:modal': 1, 'html-asset': 2, 'tag:Hero': 1 },
      components: { marked: 8, converted: 6, left: 2 },
    });
  });

  it("counts a refused page's classes, all of them left", () => {
    const report = buildReport(run([refused]));
    expect(report.templates[0].pages[0]).toMatchObject({
      module: null,
      status: 'refused',
      components: {
        marked: 4,
        converted: 0,
        left: 4,
        leftByClass: { button: 3, hero: 1 },
      },
      tsc: { checked: false, errors: 0 },
    });
    expect(report.templates[0].total).toMatchObject({
      pages: 1,
      modules: 0,
      refused: 1,
      components: { marked: 4, converted: 0, left: 4 },
      tsc: { unchecked: 0 },
    });
    expect(report.total).toMatchObject({
      refused: 1,
      components: { marked: 8, converted: 3, left: 5 },
    });
  });

  it('counts nothing as converted in a module the run could not read', () => {
    const report = buildReport(run([page({ left: null, typechecked: false })]));
    expect(report.templates[0].pages[0]).toMatchObject({
      module: 'index.tsx',
      components: {
        marked: 4,
        converted: 0,
        left: 4,
        leftByClass: { button: 3, hero: 1 },
      },
      tsc: { checked: false },
    });
    expect(report.templates[0].total.tsc.unchecked).toBe(1);
  });

  it('keeps a module tsc did not read apart from one with no errors', () => {
    const report = buildReport(run([page({ typechecked: false })]));
    expect(report.templates[0].pages[0].tsc).toEqual({
      checked: false,
      errors: 0,
      codes: {},
      diagnostics: [],
    });
    expect(report.templates[0].total.tsc.unchecked).toBe(1);
    expect(report.total.tsc.unchecked).toBe(1);
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
      unchecked: 0,
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
  /** The first row for `label` under `heading`, with login's pages. */
  const rowUnder = (heading: string, pages: PageInput[], label: string) => {
    const all = renderMarkdown(buildReport(run(pages)), CLASSES).split('\n');
    return all
      .slice(all.indexOf(heading))
      .find(line => line.startsWith(`| ${label} `));
  };

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
      '| Template | Pages | Modules | Refused | TODOs | Classes | Converted | Left  | tsc errors |',
      '| -------- | ----: | ------: | ------: | ----: | ------: | --------: | ----: | ---------: |',
      '| login    |     1 |       1 |       0 |     3 |       4 |         3 |     1 |          0 |',
      '| cv       |     2 |       1 |       0 |     1 |       4 |         3 |     1 |          0 |',
      '| Total    |     3 |       2 |       0 |     4 |       8 |         6 |     2 |          0 |',
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
      '| login    |     1 |       1 |       0 |    10 |       4 |         3 |     1 |          0 |',
      '| Total    |     3 |       2 |       0 |    11 |       8 |         6 |     2 |          0 |',
      `| html-asset${' '.repeat(30)} |    10 |     0 |    10 |`,
      '| login/index.html | index.tsx  | converted |    10 |       4 |         3 |     1 |          0 |',
      `| login/index.html | html-asset${' '.repeat(30)} |    10 |`,
    ]);
  });

  it('shows a refused page as refused, and an unread module as -', () => {
    expect(rowUnder('## Pages', [refused], 'login/index.html')).toBe(
      `| login/index.html | ${' '.repeat('index.html'.length)} | refused   |     1 |       4 |         0 |     4 |          - |`
    );
    expect(
      rowUnder('## Pages', [page({ typechecked: false })], 'login/index.html')
    ).toBe(
      '| login/index.html | index.tsx  | converted |     3 |       4 |         3 |     1 |          - |'
    );
    expect(rowUnder('## Summary', [refused], 'login')).toBe(
      '| login    |     1 |       0 |       1 |     1 |       4 |         0 |     4 |          0 |'
    );
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
