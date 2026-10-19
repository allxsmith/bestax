/**
 * End-to-end gate for the bulma-classes source's HTML input: copy the
 * hand-written site into .e2e-tmp/, convert every page the way the CLI does
 * (project facts read once, each module written beside its page), and check
 * what the JSX kitchen sink checks: TODOs only where intended, every rule
 * documented in the skill, the output typechecks against the built
 * bestax-bulma, and a second run changes nothing. The pages stay as they
 * were. That each module renders its page is
 * `bulma-classes-html-render.test.ts`'s job.
 *
 * `pages/leftovers.html` holds every pattern a component can't carry, and is
 * the one module left out of the typecheck: a custom element, an obsolete
 * one and a React prop spelled in HTML's lowercase (`defaultvalue`) are kept
 * as written, and TypeScript rejects each of them.
 *
 * Run under the default `--css keep` and under `--css bestax`, which writes
 * bestax's stylesheet import in place of each page's Bulma `<link>` and
 * notes it only for what is left to do.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bulmaClasses } from '../src/sources/bulma-classes/index.js';
import type { CssMode, TodoEntry } from '../src/types.js';
import { undocumentedRules } from './support/skill-rules.js';

const packageRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const fixtureDir = path.join(packageRoot, 'fixtures', 'bulma-classes-html');

// Per process, never a shared path (see kitchen-sink.test.ts).
const tmpRoot = path.join(packageRoot, '.e2e-tmp');
fs.mkdirSync(tmpRoot, { recursive: true });

const PAGES = [
  'pages/landing.html',
  'pages/partials/pricing.html',
  'pages/leftovers.html',
];

interface ConvertedSite {
  dir: string;
  modules: Map<string, string>;
  todos: Map<string, TodoEntry[]>;
}

function convertSite(dir: string, cssMode: CssMode): ConvertedSite {
  const project = bulmaClasses.analyzeProject!([dir]);
  const modules = new Map<string, string>();
  const todos = new Map<string, TodoEntry[]>();
  for (const page of PAGES) {
    const file = path.join(dir, page);
    const entries: TodoEntry[] = [];
    const { outputPath, output } = bulmaClasses.transformHtml!(
      file,
      fs.readFileSync(file, 'utf8'),
      { add: entry => entries.push(entry) },
      { ...project, cssMode }
    );
    if (output !== null) {
      fs.writeFileSync(outputPath, output);
      modules.set(page, path.relative(dir, outputPath));
    }
    todos.set(page, entries);
  }
  return { dir, modules, todos };
}

function copySite(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(tmpRoot, prefix));
  fs.cpSync(fixtureDir, dir, { recursive: true });
  fs.renameSync(
    path.join(dir, 'package.input.json'),
    path.join(dir, 'package.json')
  );
  return dir;
}

function typecheck(dir: string, files: string[]) {
  // A stylesheet import resolves through the app's bundler, whose types
  // declare it (Vite's `vite/client`), as the JSX kitchen sink's do.
  fs.writeFileSync(path.join(dir, 'global.d.ts'), "declare module '*.css';\n");
  fs.writeFileSync(
    path.join(dir, 'tsconfig.json'),
    JSON.stringify({
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
      files: ['global.d.ts', ...files],
    })
  );
  const result = spawnSync('pnpm', ['exec', 'tsc', '-p', dir], {
    cwd: packageRoot,
    encoding: 'utf8',
  });
  return {
    status: result.status ?? 1,
    diagnostics: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
  };
}

const rulesOf = (entries: TodoEntry[] = []) =>
  entries.map(entry => entry.rule).sort();

/**
 * What the page's head, `<html>` and `<body>` hold, in every mode: its
 * Bulma is reported under `keep`, and under `bestax` for its primary color.
 */
const LANDING_RULES = [
  'html-asset:bulma',
  'html-document:lang',
  'html-head:meta',
  'html-head:title',
];

const LEFTOVER_RULES = [
  'family:modal',
  'family:navbar-burger',
  'html-asset:bulma',
  'html-asset:bulma-extension',
  'html-asset:font-awesome',
  'html-asset:jquery',
  'html-asset:stylesheet',
  'html-asset:webfont',
  'html-attr:important',
  'html-attr:name',
  'html-attr:style',
  'html-attr:unknown',
  'html-attr:unknown',
  'html-document:class',
  'html-document:data-theme',
  'html-document:has-navbar-fixed-top',
  'html-document:lang',
  'html-element:conditional-comment',
  'html-element:custom',
  'html-element:name',
  'html-element:obsolete',
  'html-element:template',
  'html-element:unknown',
  'html-event:onclick',
  'html-event:onload',
  'html-head',
  'html-head:base',
  'html-head:link',
  'html-head:meta',
  'html-head:style',
  'html-head:title',
  'html-parse:duplicate-attribute',
  'html-script',
  'html-script',
  'html-script:burger',
  'html-script:burger',
  'html-script:carousel',
  'html-script:dismiss',
  'html-script:json-ld',
  'html-script:modal',
  'html-script:theme',
  'html-url:javascript',
  'html-url:missing',
  'html-url:relative',
  'legacy:is-paddingless',
  'modifier:image',
  'tag:SubTitle',
  'tag:Title',
];

describe('bulma-classes HTML kitchen-sink e2e', () => {
  let site: ConvertedSite;

  beforeAll(() => {
    site = convertSite(copySite('bulma-classes-html-'), 'keep');
  });

  afterAll(() => {
    if (!process.env.BESTAX_E2E_KEEP) {
      fs.rmSync(site.dir, { recursive: true, force: true });
    }
  });

  it('writes a .tsx beside every page, in a TypeScript package', () => {
    expect(Object.fromEntries(site.modules)).toEqual({
      'pages/landing.html': path.join('pages', 'landing.tsx'),
      'pages/partials/pricing.html': path.join(
        'pages',
        'partials',
        'pricing.tsx'
      ),
      'pages/leftovers.html': path.join('pages', 'leftovers.tsx'),
    });
  });

  it('leaves every page as it was', () => {
    for (const page of PAGES) {
      expect({
        page,
        same:
          fs.readFileSync(path.join(site.dir, page), 'utf8') ===
          fs.readFileSync(path.join(fixtureDir, page), 'utf8'),
      }).toEqual({ page, same: true });
    }
  });

  it("reports only the landing page's document, and nothing for the partial", () => {
    expect(rulesOf(site.todos.get('pages/landing.html'))).toEqual(
      LANDING_RULES
    );
    expect(rulesOf(site.todos.get('pages/partials/pricing.html'))).toEqual([]);
  });

  it('annotates every intentionally unsupported pattern in leftovers.html', () => {
    expect(rulesOf(site.todos.get('pages/leftovers.html'))).toEqual(
      LEFTOVER_RULES
    );
    const module = fs.readFileSync(
      path.join(site.dir, 'pages', 'leftovers.tsx'),
      'utf8'
    );
    expect(module).toContain('export default function LeftoversPage() {');
    // Its own credit stays at the top, above the import.
    expect(module.startsWith('// Template by Example, MIT licence\n')).toBe(
      true
    );
  });

  it('names the page and its line in every report entry', () => {
    for (const [page, entries] of site.todos) {
      for (const entry of entries) {
        expect({ rule: entry.rule, file: entry.file }).toEqual({
          rule: entry.rule,
          file: path.join(site.dir, page),
        });
      }
    }
    const lines = (site.todos.get('pages/leftovers.html') ?? [])
      .filter(entry => entry.rule === 'html-event:onclick')
      .map(entry => entry.line);
    expect(lines).toEqual([43]);
  });

  it('documents every TODO rule it emits in the skill reference', () => {
    const emitted = [...site.todos.values()].flat().map(todo => todo.rule);
    expect(emitted.length).toBeGreaterThan(0);
    expect(undocumentedRules(emitted)).toEqual([]);
  });

  it('typechecks the converted pages against @allxsmith/bestax-bulma', () => {
    expect(
      typecheck(site.dir, ['pages/landing.tsx', 'pages/partials/pricing.tsx'])
    ).toEqual({ status: 0, diagnostics: '' });
  });

  it('changes nothing on a second run', () => {
    const before = PAGES.map(page =>
      fs.readFileSync(path.join(site.dir, site.modules.get(page)!), 'utf8')
    );
    const again = convertSite(site.dir, 'keep');
    expect(again.modules.size).toBe(0);
    for (const page of PAGES) {
      expect({ page, rules: rulesOf(again.todos.get(page)) }).toEqual({
        page,
        rules: ['html-file:exists'],
      });
    }
    expect(
      PAGES.map(page =>
        fs.readFileSync(path.join(site.dir, site.modules.get(page)!), 'utf8')
      )
    ).toEqual(before);
  });
});

describe('bulma-classes HTML kitchen-sink e2e, --css bestax', () => {
  let site: ConvertedSite;

  beforeAll(() => {
    site = convertSite(copySite('bulma-classes-html-bestax-'), 'bestax');
  });

  afterAll(() => {
    if (!process.env.BESTAX_E2E_KEEP) {
      fs.rmSync(site.dir, { recursive: true, force: true });
    }
  });

  it("imports bestax's bundle in place of the page's Bulma link, and notes its primary", () => {
    const landing = site.todos.get('pages/landing.html') ?? [];
    expect(rulesOf(landing)).toEqual(LANDING_RULES);
    const message = landing.find(
      entry => entry.rule === 'html-asset:bulma'
    )?.message;
    expect(message).toContain(
      "the module imports bestax's bundle in its place"
    );
    // A page made for stock Bulma's primary changes color under bestax's.
    expect(message).toContain('--bulma-primary-invert-l');
    const module = fs.readFileSync(
      path.join(site.dir, 'pages', 'landing.tsx'),
      'utf8'
    );
    expect(module.split('\n')[0]).toBe(
      'import "@allxsmith/bestax-bulma/bestax.css";'
    );
    // The partial loads no Bulma, so its module imports no stylesheet.
    expect(
      fs.readFileSync(
        path.join(site.dir, 'pages', 'partials', 'pricing.tsx'),
        'utf8'
      )
    ).not.toMatch(/^import ['"]/m);
  });

  it('converts the same, and typechecks', () => {
    expect(rulesOf(site.todos.get('pages/leftovers.html'))).toEqual(
      LEFTOVER_RULES
    );
    expect(
      typecheck(site.dir, ['pages/landing.tsx', 'pages/partials/pricing.tsx'])
    ).toEqual({ status: 0, diagnostics: '' });
  });
});
