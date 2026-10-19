/**
 * The HTML input: fixture pairs (every __testfixtures__/html/<case>.input.html
 * must convert into the committed <case>.output.tsx exactly), then what a
 * fixture can't show: what writes nothing, naming and placing the module, the
 * report's lines, the display hook and the post-pass. That the module renders
 * the page is `e2e/bulma-classes-html-render.test.ts`'s job.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFragment } from 'parse5';
import type { TodoEntry } from '../../../types.js';
import type { Element } from '../../_shared/html/parse.js';
import {
  componentName,
  convertPage,
  excludedHtml,
  finishModule,
  keepingMost,
  outputPathFor,
  pageDisplayOf,
  pagesBeside,
  transformHtml,
} from '../html.js';
import { HTML_KINDS, htmlRuleId, inHtmlVocabulary } from '../html-rules.js';
import { bulmaClasses } from '../index.js';
import { analyzeProject } from '../project.js';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '__testfixtures__',
  'html'
);

const cases = fs
  .readdirSync(fixturesDir)
  .filter(file => file.endsWith('.input.html'))
  .map(file => file.replace(/\.input\.html$/, ''))
  .sort();

const dirs: string[] = [];
afterAll(() => {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
});

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bestax-bc-html-'));
  dirs.push(dir);
  return dir;
}

function convert(
  source: string,
  options: Record<string, unknown> = {},
  file = path.join(fixturesDir, 'case.html')
): { output: string | null; entries: TodoEntry[]; rules: string[] } {
  const entries: TodoEntry[] = [];
  const { output } = convertPage(
    file,
    source,
    { add: entry => entries.push(entry) },
    options
  );
  return { output, entries, rules: entries.map(entry => entry.rule) };
}

const box = '<div class="box">x</div>\n';

describe('bulma-classes HTML fixtures', () => {
  it('has the fixture pairs', () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  test.each(cases)('%s', name => {
    const input = fs.readFileSync(
      path.join(fixturesDir, `${name}.input.html`),
      'utf8'
    );
    const expected = fs.readFileSync(
      path.join(fixturesDir, `${name}.output.tsx`),
      'utf8'
    );
    const { output } = convert(
      input,
      {},
      path.join(fixturesDir, `${name}.html`)
    );
    expect(output?.trimEnd()).toBe(expected.trimEnd());
  });
});

describe('what writes nothing', () => {
  it('writes nothing for a page with no Bulma component class', () => {
    const vite =
      '<!doctype html>\n<html lang="en">\n<head><title>App</title></head>\n<body>\n  <div id="root" class="has-text-centered"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>\n';
    expect(convert(vite)).toEqual({ output: null, entries: [], rules: [] });
  });

  it('never writes over a file beside the page', () => {
    const dir = tempDir();
    const page = path.join(dir, 'about.html');
    fs.writeFileSync(path.join(dir, 'about.jsx'), 'export {};\n');
    const { output, entries } = convert(box, {}, page);
    expect(output).toBeNull();
    expect(entries).toEqual([
      expect.objectContaining({
        file: page,
        line: null,
        rule: 'html-file:exists',
      }),
    ]);
    expect(fs.readFileSync(path.join(dir, 'about.jsx'), 'utf8')).toBe(
      'export {};\n'
    );
  });

  it.each([
    ['Handlebars', '{{title}}'],
    ['Jinja', '{% block body %}'],
    ['PHP', '<?php echo $title; ?>'],
    ['PHP short echo', '<?= $title ?>'],
    ['ERB', '<%= title %>'],
  ])('refuses %s', (_, syntax) => {
    const { output, entries } = convert(`${box}<p>\n${syntax}</p>\n`);
    expect(output).toBeNull();
    expect(entries).toEqual([
      expect.objectContaining({ line: 3, rule: 'html-file:template-syntax' }),
    ]);
  });

  it('reads an XML declaration and single braces as HTML', () => {
    const { output } = convert(
      `<?xml version="1.0"?>\n${box}<p>{ a } and %</p>\n`
    );
    expect(output).toContain('<Box>');
  });
});

describe('naming and placing the module', () => {
  it.each([
    ['hero.html', 'HeroPage'],
    ['pricing-table.htm', 'PricingTablePage'],
    ['landing-page.html', 'LandingPage'],
    [path.join('login', 'index.html'), 'LoginPage'],
    [path.join('my site', 'INDEX.HTML'), 'MySitePage'],
    ['404.html', 'Page404'],
    ['café.html', 'CaféPage'],
    ['---.html', 'Page'],
  ])('names %s %s', (file, name) => {
    expect(componentName(file)).toBe(name);
  });

  it('names the index.html at the top of a sectioned site its home page, and every other after its folder', () => {
    const dir = tempDir();
    const site = path.join(dir, 'convert');
    const pages = [
      'index.html',
      'about.html',
      path.join('docs', 'index.html'),
      path.join('docs', 'api.html'),
      path.join('blog', 'index.html'),
      path.join('blog', 'first-post.html'),
    ];
    for (const page of pages) {
      fs.mkdirSync(path.dirname(path.join(site, page)), { recursive: true });
      fs.writeFileSync(path.join(site, page), box);
    }
    const named = (roots: unknown) =>
      pages
        .filter(page => path.basename(page) === 'index.html')
        .map(page => componentName(path.join(site, page), roots));
    // A walk from the site's folder, or every page named: the top is one root.
    for (const targets of [[site], pages.map(page => path.join(site, page))]) {
      expect(named(analyzeProject(targets).runRoots)).toEqual([
        'HomePage',
        'DocsPage',
        'BlogPage',
      ]);
    }
    // A run from a section starts there.
    expect(named(analyzeProject([path.join(site, 'docs')]).runRoots)).toEqual([
      'ConvertPage',
      'HomePage',
      'BlogPage',
    ]);
    // With no roots to go by, every index keeps its folder's name.
    expect(named(undefined)).toEqual(['ConvertPage', 'DocsPage', 'BlogPage']);
    // A page beside the top one that is named `HomePage` already keeps its own.
    fs.writeFileSync(path.join(site, 'home.html'), box);
    expect(named([site])[0]).toBe('ConvertPage');
    // The roots name only an index.html.
    expect(componentName(path.join(site, 'about.html'), [site])).toBe(
      'AboutPage'
    );
  });

  it('reads the pages beside a top index.html, and names its module from them', () => {
    const dir = tempDir();
    const site = path.join(dir, 'convert');
    fs.mkdirSync(path.join(site, 'fruits.html'), { recursive: true });
    fs.symlinkSync(
      path.join(dir, 'nowhere.html'),
      path.join(site, 'broken.html')
    );
    const index = path.join(site, 'index.html');
    const roots = { runRoots: [site] };
    // A folder named like a page is no page, and neither is a broken link.
    expect(pagesBeside(index)).toEqual([]);
    expect(convert(box, roots, index).output).toContain(
      'export default function ConvertPage() {'
    );
    fs.writeFileSync(path.join(site, 'services.html'), box);
    fs.writeFileSync(path.join(site, 'style.css'), '');
    expect(pagesBeside(index)).toEqual(['services.html']);
    expect(convert(box, roots, index).output).toContain(
      'export default function HomePage() {'
    );
    expect(convert(box, {}, index).output).toContain(
      'export default function ConvertPage() {'
    );
    expect(pagesBeside(path.join(dir, 'gone', 'index.html'))).toEqual([]);
  });

  it('writes beside the page, .tsx only when the package says TypeScript', () => {
    const dir = tempDir();
    const page = path.join(dir, 'pages', 'hero.html');
    expect(outputPathFor(page)).toBe(path.join(dir, 'pages', 'hero.jsx'));
    expect(
      outputPathFor(page, {
        packageLanguages: [{ dir, typescript: true }],
      })
    ).toBe(path.join(dir, 'pages', 'hero.tsx'));
    expect(outputPathFor('hero.htm')).toBe('hero.jsx');
  });

  it('exports the component as the default', () => {
    const { output } = convert(box, {}, path.join(fixturesDir, 'hero.html'));
    expect(output).toContain('export default function HeroPage() {');
    expect(
      transformHtml(path.join(fixturesDir, 'x.html'), box, undefined)
    ).toEqual({
      outputPath: path.join(fixturesDir, 'x.jsx'),
      output: [
        'import { Box } from "@allxsmith/bestax-bulma";',
        '',
        'export default function XPage() {',
        '  return <Box>x</Box>;',
        '}',
        '',
      ].join('\n'),
    });
  });
});

describe('the report', () => {
  it("names the page and its lines, the planner's included", () => {
    const page = path.join(fixturesDir, 'lines.html');
    const source = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head><title>T</title></head>',
      '<body>',
      '  <section class="section">',
      '    <span class="box" onclick="go()">x</span>',
      '  </section>',
      '</body>',
      '</html>',
    ].join('\n');
    const { entries } = convert(source, {}, page);
    expect(
      entries.map(({ file, line, rule }) => ({ file, line, rule }))
    ).toEqual([
      { file: page, line: 2, rule: 'html-document:lang' },
      { file: page, line: 3, rule: 'html-head:title' },
      { file: page, line: 6, rule: 'html-event:onclick' },
      { file: page, line: 6, rule: 'tag:Box' },
    ]);
  });

  it('reports a parse error once per code, with how many more', () => {
    const { entries, output } = convert(
      `${box}<div class="a" class="b"></div>\n<p class="c" class="d"></p>\n`
    );
    expect(entries).toEqual([
      expect.objectContaining({
        line: 2,
        rule: 'html-parse:duplicate-attribute',
        message: expect.stringContaining('1 more like it'),
      }),
    ]);
    expect(output).toContain('(case.html:2)');
  });

  it('reads the inline script patterns and leaves an unknown type alone', () => {
    const script = (body: string, type = '') =>
      `<script${type}>${body}</script>\n`;
    const { rules } = convert(
      box +
        script("$('.modal').addClass('is-active')") +
        script("bulmaCarousel.attach('#c')") +
        script('{"a": 1}', ' type="application/json"') +
        script('<b>{x}</b>', ' type="text/x-template"')
    );
    expect(rules).toEqual([
      'html-script:modal',
      'html-script:carousel',
      'html-script',
      'html-script',
    ]);
  });

  it("reads Bulma 0.x's `burger` class as the burger, and says how a saved scheme paints first", () => {
    const { entries } = convert(
      `${box}<script>document.querySelector('.burger').onclick = () => {};\nlocalStorage.getItem('theme') === 'dark' && document.documentElement.setAttribute('data-theme', 'dark');</script>\n`
    );
    expect(entries.map(entry => entry.rule)).toEqual([
      'html-script:burger',
      'html-script:theme',
    ]);
    expect(entries[1].message).toContain('`localStorage`');
    expect(entries[1].message).toContain(
      "a small inline script in the `<head>` of the app's index.html"
    );
    // A word that only ends in `burger` is not the class.
    expect(
      convert(`${box}<script>const hamburger = 1;</script>\n`).rules
    ).toEqual(['html-script']);
  });

  it('reports what the head holds, grouped by tag', () => {
    const page = [
      '<!DOCTYPE html><html><head>',
      '<meta charset="utf-8"><meta name="viewport" content="x">',
      '<link rel="icon" href="/i.png"><link rel="canonical" href="/x">',
      '<template id="t"></template>',
      `</head><body>${box}</body></html>`,
    ].join('\n');
    const { entries } = convert(page);
    expect(entries.map(({ line, rule }) => ({ line, rule }))).toEqual([
      { line: 2, rule: 'html-head:meta' },
      { line: 3, rule: 'html-head:link' },
      { line: 4, rule: 'html-head' },
    ]);
  });

  it('gives a Content Security Policy an entry of its own, apart from the other metas', () => {
    const page = [
      '<!DOCTYPE html><html><head>',
      '<meta charset="utf-8">',
      `<meta http-equiv="Content-Security-Policy" content="default-src 'self'">`,
      '<meta http-equiv="refresh" content="30">',
      `</head><body>${box}</body></html>`,
    ].join('\n');
    const { entries, output } = convert(page);
    expect(entries.map(({ line, rule }) => ({ line, rule }))).toEqual([
      { line: 2, rule: 'html-head:meta' },
      { line: 3, rule: 'html-head:csp' },
    ]);
    expect(entries[0].message).toContain('(charset, refresh)');
    expect(entries[1].message).toContain(
      "it can block what the app loads instead (a Vite dev server runs an inline script for React's fast refresh"
    );
    expect(output).toMatch(/Content Security Policy.*\(case\.html:3\)$/m);
  });

  it("puts JSON-LD for the whole site in the app's index.html, and a page's own where its head is set", () => {
    const { entries } = convert(
      `${box}<script type="application/ld+json">{"@type": "Person"}</script>\n`
    );
    expect(entries).toEqual([
      expect.objectContaining({
        rule: 'html-script:json-ld',
        message: expect.stringContaining(
          "goes in the app's index.html as it is, where a crawler that runs no JavaScript still reads it, and data that differs from page to page goes where the app sets each page's head"
        ),
      }),
    ]);
  });

  it("puts a page's scheme on <html> first, and sends a toggle to the theming skill's example", () => {
    const { entries } = convert(
      `<!DOCTYPE html><html data-theme="light"><body class="theme-dark">${box}</body></html>`
    );
    expect(entries.map(entry => entry.rule)).toEqual([
      'html-document:data-theme',
      'html-document:theme-dark',
    ]);
    for (const { message } of entries) {
      expect(message).toContain(
        "put it on the `<html>` in the app's index.html, where the first paint has it; bestax's `Theme colorMode` writes `data-theme` on `<html>` too, but from an effect, after a first frame in the visitor's OS scheme, so keep it for a scheme the visitor switches, the way the bestax-theming skill's `examples/dark-mode.tsx` does"
      );
      expect(message).not.toContain('<Theme colorMode');
    }
  });

  it("says a stray character in a tag is one, rather than a framework's directive", () => {
    const { entries, output } = convert(
      `${box}<figure class="image is-64x64" \\><img src="https://example.com/a.png" alt=""></figure>\n<div @click="go" class="box">y</div>\n`
    );
    expect(entries.map(({ line, rule }) => ({ line, rule }))).toEqual([
      { line: 2, rule: 'html-attr:stray' },
      { line: 3, rule: 'html-attr:name' },
    ]);
    expect(entries[0].message).toMatch(
      /^`\\` in the tag is a stray character, a typo/
    );
    expect(entries[0].message).not.toContain('directive');
    expect(entries[1].message).toContain('directive');
    expect(output).toContain('<Image as="figure" size="64x64"');
  });

  it("leaves out a textarea's type, which the browser ignores and React's types reject", () => {
    const { entries, output } = convert(
      `<div class="field"><div class="control"><textarea class="textarea" type="text" id="m"></textarea></div></div>\n`
    );
    expect(entries).toEqual([
      expect.objectContaining({
        line: 1,
        rule: 'html-attr:ignored',
        message: expect.stringMatching(
          /^`type` was left out: HTML gives a `<textarea>` no `type` attribute/
        ),
      }),
    ]);
    expect(output).toContain('<TextAreaBase id="m" />');
  });

  it('writes the page lines on a planner TODO that several elements share', () => {
    const { entries, output } = convert(
      `${box}<span class="icon"><i class="fas fa-home"></i></span>\n<span class="icon"><i class="fas fa-home"></i></span>\n<span class="box">z</span>\n`
    );
    expect(entries.map(({ line, rule }) => `${line}:${rule}`)).toEqual([
      '2:defaults:Icon',
      '3:defaults:Icon',
      '4:tag:Box',
    ]);
    const todos = output!.match(/^ {2}\/\/ TODO\(bestax-migrate\).*$/gm);
    expect(todos).toHaveLength(2);
    expect(todos![0]).toMatch(/`Icon`.*\(case\.html:2, 3\)$/);
    expect(todos![1]).toMatch(/`Box`.*\(case\.html:4\)$/);
  });

  it('reports what <html> and <body> carry', () => {
    const page =
      '<!DOCTYPE html><html class="theme-light has-spaced-navbar-fixed-top x" data-theme="auto" id="top"><body style="margin:0" data-x="1">' +
      box +
      '</body></html>';
    const { entries } = convert(page);
    expect(entries.map(entry => entry.rule)).toEqual([
      'html-document:theme-light',
      'html-document:has-spaced-navbar-fixed-top',
      'html-document:class',
      'html-document:data-theme',
      'html-document:id',
      'html-document:style',
      'html-document',
    ]);
    // `auto` is no scheme `Theme` writes, so it isn't offered.
    expect(entries[3].message).not.toContain('<Theme');
  });

  it('reports relative URLs, in srcset and on an object, but not absolute ones', () => {
    const { entries } = convert(
      `${box}<img src="/a.png" srcset="img/b.png 2x" alt="">\n<object data="movie.swf"></object>\n<a href="#top" data-x="y">t</a> <a href="mailto:a@b.c">m</a> <a href="//cdn/x">c</a>\n`
    );
    // Neither target is beside the page.
    expect(entries.map(({ line, rule }) => ({ line, rule }))).toEqual([
      { line: 2, rule: 'html-url:missing' },
      { line: 3, rule: 'html-url:missing' },
    ]);
  });

  it('reports every relative candidate in a srcset, each quoted as itself', () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, 'hero.png'), '');
    const { entries } = convert(
      `${box}<img src="/hero.png" srcset="hero.png 1x, hero@2x.png 2x, /hero@3x.png 3x, hero.png 4x" alt="">\n`,
      {},
      path.join(dir, 'case.html')
    );
    expect(entries.map(({ line, rule }) => ({ line, rule }))).toEqual([
      { line: 2, rule: 'html-url:relative' },
      { line: 2, rule: 'html-url:missing' },
    ]);
    expect(entries[0].message).toMatch(/^`hero\.png` in `srcset` is relative/);
    expect(entries[1].message).toMatch(
      /^`hero@2x\.png` in `srcset` points at nothing beside the page/
    );
    // A single URL is still quoted as the attribute it is.
    expect(
      convert(`${box}<img src="logo.png" alt="">\n`).entries[0].message
    ).toMatch(/^`src="logo\.png"` points at nothing/);
  });

  it('reads a relative URL beside the page: a file, another page, or nothing', () => {
    const dir = tempDir();
    fs.mkdirSync(path.join(dir, 'img'));
    fs.writeFileSync(path.join(dir, 'img', 'my logo.png'), '');
    fs.writeFileSync(path.join(dir, 'about.html'), '');
    const { entries } = convert(
      `${box}<img src="./img/my%20logo.png?v=2" alt="">\n<a href="about.html#team">About</a>\n<a href="old/news.html">News</a>\n`,
      {},
      path.join(dir, 'home.html')
    );
    expect(entries.map(({ rule, message }) => ({ rule, message }))).toEqual([
      {
        rule: 'html-url:relative',
        message: expect.stringMatching(
          /copy the file into the app's `public\/` folder and point at it from the site root \(`\/img\/my logo\.png`\)/
        ),
      },
      {
        rule: 'html-url:relative',
        message: expect.stringContaining(
          'point it at the route that page becomes'
        ),
      },
      {
        rule: 'html-url:missing',
        message: expect.stringContaining(
          'points at nothing beside the page (no `old/news.html` in its folder)'
        ),
      },
    ]);
  });

  it('writes one TODO line for each kind of relative URL there are several of, and an entry for each', () => {
    const dir = tempDir();
    for (const file of ['a.png', 'b.png']) {
      fs.writeFileSync(path.join(dir, file), '');
    }
    const { entries, output } = convert(
      `${box}<img src="a.png" alt="">\n<img src="b.png" alt="">\n<img src="a.png" alt="">\n<img src="gone.png" alt="">\n<img src="lost.png" alt="">\n<a href="x.html">x</a>\n`,
      {},
      path.join(dir, 'case.html')
    );
    expect(entries.map(entry => `${entry.line}:${entry.rule}`)).toEqual([
      '2:html-url:relative',
      '3:html-url:relative',
      '4:html-url:relative',
      '5:html-url:missing',
      '6:html-url:missing',
      '7:html-url:missing',
    ]);
    const todos = output!.match(/TODO\(bestax-migrate\): relative URLs.*$/gm);
    expect(todos).toHaveLength(2);
    expect(todos![0]).toContain('(`a.png`, `b.png`) resolve against');
    expect(todos![0]).toMatch(/\(case\.html:2, 3, 4\)$/);
    expect(todos![1]).toContain(
      '(`gone.png`, `lost.png`, `x.html`) point at nothing'
    );
    expect(todos![1]).toMatch(/\(case\.html:5, 6, 7\)$/);
  });

  it.each([
    [
      'a React prop in the wrong case',
      '<input id="q" defaultvalue="x">',
      "`defaultvalue` isn't an HTML attribute, so the page never read it, and it reads as React's `defaultValue` in the wrong case: rename it to `defaultValue`, or drop it if it isn't meant",
    ],
    [
      'a presentational attribute React types on this element',
      '<table><tr><td valign="top">x</td></tr></table>',
      '`valign` is an obsolete presentational attribute, which CSS replaced: write it as CSS or a class',
    ],
    [
      'a presentational attribute React types nowhere',
      '<table><tr><td nowrap>x</td></tr></table>',
      '`nowrap` is an obsolete presentational attribute, which CSS replaced: write it as CSS or a class',
    ],
    [
      'any other',
      '<p frobnicate="x">t</p>',
      "`frobnicate` is written as it was, which React renders under that name: drop it if nothing reads it, make it a `data-` attribute if a script of the page's does, and if React's types don't list it on this element, declare it for a TypeScript build",
    ],
  ])(
    'says what to do about %s, and nothing about whether TypeScript takes it',
    (_, html, message) => {
      const { entries } = convert(`${box}${html}\n`);
      expect(entries).toEqual([
        expect.objectContaining({
          rule: 'html-attr:unknown',
          line: 2,
          message,
        }),
      ]);
    }
  );

  it.each([
    ['U+2028', '\u2028'],
    ['U+2029', '\u2029'],
    ['CR', '\r'],
  ])(
    'ends a line of a comment outside the body at a %s, so its text stays a comment',
    (_, separator) => {
      const { output, entries } = convert(
        `<!DOCTYPE html>\n<!-- Credit${separator}globalThis.leaked = 1 -->\n<html><body>${box}</body></html>\n`
      );
      expect(entries).toEqual([]);
      expect(output).toContain('// Credit\n// globalThis.leaked = 1\n');
      expect(output).not.toMatch(/^globalThis/m);
      expect(output).not.toMatch(/[\u2028\u2029]/);
    }
  );

  it('keeps the planner TODOs above the return, and the page notes above the component', () => {
    const { output } = convert(
      `<!DOCTYPE html><html><body>\n<span class="box">x</span>\n</body></html>`
    );
    expect(output).toMatch(
      /export default function CasePage\(\) \{\n {2}\/\/ TODO\(bestax-migrate\): bestax `Box` renders/
    );
  });
});

describe('the stylesheets and scripts it loads', () => {
  const page = (head: string, body = box) =>
    `<!DOCTYPE html><html><head>\n${head}\n</head><body>\n${body}</body></html>`;
  const link = (href: string) => `<link rel="stylesheet" href="${href}">`;
  const bulma09 = link(
    'https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css'
  );
  const bulma1 = link(
    'https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css'
  );
  const imports = (output: string | null) =>
    (output ?? '').split('\n').filter(line => line.startsWith('import '));

  it.each([
    [bulma09, 'html-asset:bulma'],
    [
      link(
        'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7/css/all.min.css'
      ),
      'html-asset:font-awesome',
    ],
    [
      link('https://cdn.jsdelivr.net/npm/bulma-social@3/css/all.min.css'),
      'html-asset:bulma-extension',
    ],
    [
      '<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>',
      'html-asset:jquery',
    ],
    [
      link('https://fonts.googleapis.com/css2?family=Inter&display=swap'),
      'html-asset:webfont',
    ],
    [link('https://example.com/site.css'), 'html-asset:stylesheet'],
    ['<script src="https://example.com/app.js"></script>', 'html-asset:script'],
  ])('reports %s as %s', (tag, rule) => {
    expect(convert(page(tag)).rules).toEqual([rule]);
  });

  it("reports Bulma's stylesheet under --css keep, and imports nothing", () => {
    const { entries, output } = convert(page(bulma09));
    expect(entries).toEqual([
      expect.objectContaining({
        line: 2,
        rule: 'html-asset:bulma',
        message: expect.stringContaining(
          "(`import 'bulma/css/bulma.min.css'`, with `bulma@0.9.4` installed)"
        ),
      }),
    ]);
    expect(imports(output)).toEqual([
      'import { Box } from "@allxsmith/bestax-bulma";',
    ]);
  });

  it("imports bestax's bundle in place of Bulma's link under --css bestax, and notes only what is left", () => {
    const v1 = convert(page(bulma1), { cssMode: 'bestax' });
    expect(v1.entries).toEqual([]);
    expect(imports(v1.output)).toEqual([
      'import "@allxsmith/bestax-bulma/bestax.css";',
      'import { Box } from "@allxsmith/bestax-bulma";',
    ]);
    // A primary color class changes with bestax's primary.
    const primary = convert(
      page(bulma1, `<div class="box has-text-primary">x</div>\n`),
      { cssMode: 'bestax' }
    );
    expect(primary.rules).toEqual(['html-asset:bulma']);
    expect(primary.entries[0].message).toContain('--bulma-primary-invert-l');
    // A page made for Bulma 0.9 has the move to 1 left.
    const older = convert(page(bulma09), { cssMode: 'bestax' });
    expect(older.entries).toEqual([
      expect.objectContaining({
        rule: 'html-asset:bulma',
        message: expect.stringContaining('the page was made for Bulma 0.9.4'),
      }),
    ]);
    expect(imports(older.output)[0]).toBe(
      'import "@allxsmith/bestax-bulma/bestax.css";'
    );
  });

  it("imports Bulma and bestax's extras under --css bulma", () => {
    const { entries, output } = convert(page(bulma1), { cssMode: 'bulma' });
    expect(entries).toEqual([]);
    expect(imports(output)).toEqual([
      'import "bulma/css/bulma.min.css";',
      'import "@allxsmith/bestax-bulma/extras.css";',
      'import { Box } from "@allxsmith/bestax-bulma";',
    ]);
  });

  it('writes one import, and one note, for a page that links Bulma twice', () => {
    const { entries, output } = convert(
      page(`${bulma09}\n${link('css/bulma.css')}`),
      { cssMode: 'bestax' }
    );
    expect(imports(output)).toHaveLength(2);
    expect(entries).toEqual([
      expect.objectContaining({ line: 2, rule: 'html-asset:bulma' }),
    ]);
    expect(output).toMatch(/\(case\.html:2, 3\)$/m);
  });

  it("keeps a page's credit above the import", () => {
    const { output } = convert(
      `<!-- Template by Example -->\n${page(bulma1)}`,
      { cssMode: 'bestax' }
    );
    expect(output!.split('\n').slice(0, 3)).toEqual([
      '// Template by Example',
      '',
      'import "@allxsmith/bestax-bulma/bestax.css";',
    ]);
  });

  it("imports nothing for one of Bulma's other builds", () => {
    const { entries, output } = convert(
      page(
        link(
          'https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/versions/bulma-no-dark-mode.min.css'
        )
      ),
      { cssMode: 'bestax' }
    );
    expect(entries).toEqual([
      expect.objectContaining({
        rule: 'html-asset:bulma',
        message: expect.stringContaining("Bulma's `no-dark-mode` build"),
      }),
    ]);
    expect(imports(output)).toHaveLength(1);
  });

  it("notes an extension's stylesheet and script once, with both lines", () => {
    const { entries, output } = convert(
      page(
        link(
          'https://cdn.jsdelivr.net/npm/bulma-carousel@4.0.4/dist/css/bulma-carousel.min.css'
        ),
        `${box}<script src="https://cdn.jsdelivr.net/npm/bulma-carousel@4.0.4/dist/js/bulma-carousel.min.js"></script>\n`
      )
    );
    expect(entries).toEqual([
      expect.objectContaining({
        line: 2,
        rule: 'html-asset:bulma-extension',
        message: expect.stringContaining('`Carousel`'),
      }),
    ]);
    expect(output).toMatch(/markup and script, .*\(case\.html:2, 5\)$/m);
  });

  it('reads a script beside the page for the burger, a carousel and a theme toggle, but not a modal', () => {
    const dir = tempDir();
    fs.mkdirSync(path.join(dir, 'js'));
    fs.writeFileSync(
      path.join(dir, 'js', 'scripts.js'),
      "bulmaCarousel.attach('#slider');\ndocument.querySelector('.navbar-burger');\n"
    );
    fs.writeFileSync(
      path.join(dir, 'js', 'modal.js'),
      "document.querySelector('.modal').classList.add('is-active');\n"
    );
    const { entries } = convert(
      page(
        '<script defer src="js/scripts.js"></script>\n<script src="js/modal.js"></script>\n<script src="js/gone.js"></script>'
      ),
      {},
      path.join(dir, 'home.html')
    );
    expect(entries.map(({ line, rule }) => `${line}:${rule}`)).toEqual([
      '2:html-script:burger',
      '2:html-script:carousel',
      '3:html-asset:script',
      '4:html-asset:script',
    ]);
    expect(entries[0].message).toMatch(
      /^the page's script `js\/scripts\.js` toggles the navbar burger/
    );
    expect(entries[0].message).toContain(
      'its code is still in `js/scripts.js`'
    );
    expect(entries[2].message).toContain(
      "the page's own script `js/modal.js` is beside it"
    );
    expect(entries[3].message).toContain("isn't beside the page");
  });

  it('leaves a script beside the page alone when it is too large to be its own, or unreadable', () => {
    const dir = tempDir();
    fs.writeFileSync(
      path.join(dir, 'vendor.js'),
      `/* navbar-burger */${' '.repeat(300 * 1024)}`
    );
    const locked = path.join(dir, 'locked.js');
    fs.writeFileSync(locked, '/* navbar-burger */');
    fs.chmodSync(locked, 0o000);
    let unreadable = false;
    try {
      fs.readFileSync(locked);
    } catch {
      unreadable = true;
    }
    const { entries } = convert(
      page(
        '<script src="vendor.js"></script>\n<script src="locked.js"></script>'
      ),
      {},
      path.join(dir, 'home.html')
    );
    fs.chmodSync(locked, 0o644);
    expect(entries[0]).toEqual(
      expect.objectContaining({
        rule: 'html-asset:script',
        message: expect.stringContaining('is beside it'),
      })
    );
    // Root reads any file, so the locked one is only unreadable without it.
    expect(entries[1].rule).toBe(
      unreadable ? 'html-asset:script' : 'html-script:burger'
    );
  });

  it('reads whether a stylesheet of the page is beside it', () => {
    const dir = tempDir();
    fs.mkdirSync(path.join(dir, 'css'));
    fs.writeFileSync(path.join(dir, 'css', 'styles.css'), '');
    const { entries } = convert(
      page(`${link('css/styles.css?v=3')}\n${link('css/gone.css')}`),
      {},
      path.join(dir, 'home.html')
    );
    expect(entries.map(entry => entry.message)).toEqual([
      expect.stringContaining('imports it as `./css/styles.css`'),
      expect.stringContaining('no `css/gone.css` in its folder'),
    ]);
  });

  it("claims nothing about what a page under a <base href> loaded from a path that isn't beside it", () => {
    const { entries } = convert(
      page(
        `<base href="/">\n${link('css/site.css')}\n<script src="js/site.js"></script>`
      )
    );
    expect(entries.map(entry => entry.rule)).toEqual([
      'html-head:base',
      'html-asset:stylesheet',
      'html-asset:script',
    ]);
    for (const { message } of entries.slice(1)) {
      expect(message).toContain("isn't beside the page");
      expect(message).not.toMatch(/never/);
    }
  });

  it("reads a script of a type a browser loads no src for as the page's text, not its code", () => {
    const dir = tempDir();
    fs.writeFileSync(
      path.join(dir, 'nav.html'),
      '<a class="navbar-burger"></a>\n'
    );
    const { entries } = convert(
      page(
        '<script type="text/template" src="nav.html"></script>\n<script type="application/ld+json" src="org.json"></script>'
      ),
      {},
      path.join(dir, 'home.html')
    );
    expect(entries.map(({ line, rule }) => `${line}:${rule}`)).toEqual([
      '2:html-script',
      '3:html-script:json-ld',
    ]);
    expect(entries[0].message).toContain('it is in `nav.html`');
    expect(entries[1].message).toContain('the JSON is in `org.json`');
  });

  it("reads nothing a `../` takes out of the page's folder", () => {
    const dir = tempDir();
    fs.mkdirSync(path.join(dir, 'site'));
    fs.writeFileSync(
      path.join(dir, 'outside.js'),
      "document.querySelector('.navbar-burger');\n"
    );
    fs.writeFileSync(path.join(dir, 'shared.css'), '');
    const { entries } = convert(
      page(
        `${link('../shared.css')}\n<script src="../outside.js"></script>\n<script src="js/../../outside.js"></script>`
      ),
      {},
      path.join(dir, 'site', 'home.html')
    );
    expect(entries.map(entry => entry.rule)).toEqual([
      'html-asset:stylesheet',
      'html-asset:script',
      'html-asset:script',
    ]);
    expect(entries[0].message).toContain(
      'load it once for the app, from its entry'
    );
    expect(entries[0].message).not.toContain('beside');
    for (const { message } of entries.slice(1)) {
      expect(message).toContain('load it in the app if the app still needs it');
    }
  });

  it("reports a path it can't search without failing the page", () => {
    const dir = tempDir();
    const locked = path.join(dir, 'locked');
    fs.mkdirSync(locked);
    fs.writeFileSync(path.join(locked, 'a.css'), '');
    fs.chmodSync(locked, 0o000);
    let searchable = true;
    try {
      fs.statSync(path.join(locked, 'a.css'));
    } catch {
      searchable = false;
    }
    try {
      const { entries, output } = convert(
        page(link('locked/a.css')),
        {},
        path.join(dir, 'home.html')
      );
      expect(output).not.toBeNull();
      expect(entries[0].rule).toBe('html-asset:stylesheet');
      // Root searches any folder, so the folder is only locked without it.
      expect(entries[0].message).toContain(
        searchable ? 'is beside it' : 'load it once for the app, from its entry'
      );
    } finally {
      fs.chmodSync(locked, 0o755);
    }
  });

  it('imports no stylesheet in a Next.js app, and says where it goes', () => {
    const dir = tempDir();
    const { entries, output } = convert(
      page(bulma1),
      {
        cssMode: 'bestax',
        packageLanguages: [{ dir, typescript: true, nextjs: true }],
      },
      path.join(dir, 'home.html')
    );
    expect(imports(output)).toEqual([
      'import { Box } from "@allxsmith/bestax-bulma";',
    ]);
    expect(entries).toEqual([
      expect.objectContaining({
        rule: 'html-asset:bulma',
        message: expect.stringContaining('`pages/_app`'),
      }),
    ]);
  });

  it('imports no stylesheet for a link with a media query, which an import applies past', () => {
    const print = convert(
      page(
        '<link rel="stylesheet" media="print" href="https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css">'
      ),
      { cssMode: 'bestax' }
    );
    expect(imports(print.output)).toHaveLength(1);
    expect(print.entries).toEqual([
      expect.objectContaining({
        rule: 'html-asset:bulma',
        message: expect.stringContaining('for `media="print"` only'),
      }),
    ]);
    // Every medium is no query at all.
    const all = convert(
      page(
        '<link rel="stylesheet" media="all" href="https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css">'
      ),
      { cssMode: 'bestax' }
    );
    expect(imports(all.output)[0]).toBe(
      'import "@allxsmith/bestax-bulma/bestax.css";'
    );
  });
});

describe('the file-level gates, read from where the module goes', () => {
  it('leaves the JSX alone for a package whose JSX is not React', () => {
    const dir = tempDir();
    const { output, rules } = convert(
      box,
      { jsxRuntimes: [{ dir, runtime: 'preact' }] },
      path.join(dir, 'card.html')
    );
    expect(rules).toEqual(['jsx-runtime']);
    expect(output).toContain('<div className="box">x</div>');
  });

  it('leaves a possible Next.js server component alone', () => {
    const dir = tempDir();
    const { rules } = convert(
      box,
      { serverComponentRoots: [{ dir, except: [] }] },
      path.join(dir, 'app', 'card.html')
    );
    expect(rules).toEqual(['rsc']);
  });
});

describe('the source', () => {
  it('reads .html and .htm pages', () => {
    expect(bulmaClasses.htmlExtensions).toEqual(['html', 'htm']);
    expect(bulmaClasses.transformHtml).toBe(transformHtml);
  });

  it('says a page a walk left out carries Bulma classes, and stays quiet otherwise', () => {
    expect(excludedHtml('a.html', `<p>x</p>\n${box}`)).toEqual(
      expect.objectContaining({
        file: 'a.html',
        line: 2,
        rule: 'html-file:not-included',
      })
    );
    expect(excludedHtml('b.html', '<div id="root"></div>')).toBeNull();
  });

  it.each(['html', 'htm'])(
    'names the extension a walk needs for a .%s page, since -e matches one exactly',
    extension => {
      expect(excludedHtml(`a.${extension}`, box)?.message).toBe(
        `this page has Bulma classes the bulma-classes source converts, but a folder walk takes a page only when \`--extensions\` lists its extension, and it doesn't list \`${extension}\`: name the page, or add \`${extension}\` to \`--extensions\` (\`-e ${extension}\` for the pages alone)`
      );
    }
  );
});

function element(html: string): Element {
  return parseFragment(html).childNodes[0] as Element;
}

describe('the display hook', () => {
  it.each([
    [['block'], 'block'],
    [['block', 'flex'], 'block'],
    [['flex', 'grid'], 'flex'],
    [['block', 'none'], 'none'],
    [['inline-flex', 'none'], 'inline-flex'],
    [['flex', 'inline-block'], 'inline-block'],
    [['inline-flex', 'block'], 'inline-block'],
    [['inline', 'flex'], 'inline'],
    [['none'], 'none'],
  ])('keeps every run any of %j keeps: %s', (displays, kept) => {
    expect(keepingMost(new Set(displays))).toBe(kept);
  });

  it.each([
    ['<a class="button">x</a>', 'inline-flex'],
    ['<div class="buttons"></div>', 'flex'],
    // The tag's own on mobile, flex from tablet up.
    ['<div class="columns"></div>', 'block'],
    ['<li class="is-hidden-mobile"></li>', 'none'],
    ['<a class="navbar-burger"></a>', 'inline-flex'],
    // Out of the flow, so beside nothing, whatever its display.
    ['<div class="modal is-active"></div>', 'none'],
    ['<span class="is-sr-only"></span>', 'inline'],
    ['<p>x</p>', 'block'],
    ['<span>x</span>', 'inline'],
    ['<div class="box" style="display: inline"></div>', 'inline'],
    ['<div class="box" style="display: wobbly"></div>', 'block'],
    // A display helper is `!important`, which an inline style doesn't beat.
    ['<span class="is-flex" style="display: inline"></span>', 'inline'],
    ['<div class="is-flex" style="display: grid"></div>', 'flex'],
  ])('%s is %s', (html, display) => {
    expect(pageDisplayOf(element(html))).toBe(display);
  });

  it("gives an SVG root an inline box, or what Bulma's classes give it", () => {
    const svgIn = (html: string) =>
      (parseFragment(html).childNodes[0] as Element).childNodes[0] as Element;
    expect(pageDisplayOf(svgIn('<p><svg></svg></p>'))).toBe('inline');
    expect(pageDisplayOf(svgIn('<p><svg class="icon"></svg></p>'))).toBe(
      'inline-flex'
    );
  });
});

describe('finishModule', () => {
  it('writes a number attribute on a plain element as a number', () => {
    expect(
      finishModule(
        'const a = <div tabIndex="-1" aria-level="2" data-n="3" title="4"><td colSpan="2" width="50%" /></div>;\n'
      )
    ).toBe(
      'const a = <div tabIndex={-1} aria-level={2} data-n="3" title="4"><td colSpan={2} width="50%" /></div>;\n'
    );
  });

  it("leaves a component's, a custom element's and an odd spelling alone", () => {
    const code =
      'const a = <><Column size="4" /><my-el tabIndex="1" /><td colSpan="02" /><td colSpan={2} /></>;\n';
    expect(finishModule(code)).toBe(code);
  });

  it('reads an SVG attribute from the SVG table, and HTML again inside a foreignObject', () => {
    expect(
      finishModule(
        'const a = <svg width="2" tabIndex="0"><foreignObject width="3"><p tabIndex="0" /></foreignObject><text x="1" /></svg>;\n'
      )
    ).toBe(
      'const a = <svg width="2" tabIndex={0}><foreignObject width="3"><p tabIndex={0} /></foreignObject><text x="1" /></svg>;\n'
    );
  });

  it('sets the imports off from the code, once', () => {
    expect(finishModule('import a from "a";\nexport {};\n')).toBe(
      'import a from "a";\n\nexport {};\n'
    );
    expect(finishModule('import a from "a";\n\nexport {};\n')).toBe(
      'import a from "a";\n\nexport {};\n'
    );
  });
});

describe('the HTML rule ids', () => {
  /** The worker's rule-name pattern (`telemetry-worker/src/validate.ts`). */
  const RULE_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

  it('carries only a token from its kind', () => {
    expect(htmlRuleId('html-head', 'title')).toBe('html-head:title');
    expect(htmlRuleId('html-head', 'my-title')).toBe('html-head');
    expect(htmlRuleId('html-asset', 'bulma')).toBe('html-asset:bulma');
    expect(htmlRuleId('html-asset', 'bulma-carousel')).toBe('html-asset');
    expect(htmlRuleId('html-event', 'onclick')).toBe('html-event:onclick');
    expect(htmlRuleId('html-event', 'onfrobnicate')).toBe('html-event');
    expect(htmlRuleId('html-document')).toBe('html-document');
    expect(() => htmlRuleId('html-nope', 'x')).toThrow(/not an HTML rule/);
  });

  it('drops a token that would make the id longer than the worker takes', () => {
    const code =
      'missing-whitespace-between-doctype-public-and-system-identifiers';
    expect(inHtmlVocabulary('html-parse', code)).toBe(true);
    expect(htmlRuleId('html-parse', code)).toBe('html-parse');
  });

  it('writes ids the telemetry worker accepts', () => {
    const rules = new Set<string>();
    for (const name of cases) {
      const source = fs.readFileSync(
        path.join(fixturesDir, `${name}.input.html`),
        'utf8'
      );
      for (const rule of convert(source).rules) rules.add(rule);
    }
    expect(rules.size).toBeGreaterThan(0);
    for (const rule of rules) {
      expect({ rule, ok: RULE_RE.test(rule) }).toEqual({ rule, ok: true });
      const [kind, token] = rule.split(':');
      if (!kind.startsWith('html-')) continue;
      expect(HTML_KINDS.has(kind)).toBe(true);
      if (token !== undefined) {
        expect({ rule, known: inHtmlVocabulary(kind, token) }).toEqual({
          rule,
          known: true,
        });
      }
    }
  });
});
