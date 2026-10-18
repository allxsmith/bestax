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
  transformHtml,
} from '../html.js';
import { HTML_KINDS, htmlRuleId, inHtmlVocabulary } from '../html-rules.js';
import { bulmaClasses } from '../index.js';

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

  it.each([
    ['keep', "import 'bulma/css/bulma.min.css'"],
    ['bestax', "import '@allxsmith/bestax-bulma/bestax.css'"],
    ['bulma', "import '@allxsmith/bestax-bulma/extras.css'"],
  ])("says how to load Bulma's stylesheet under --css %s", (cssMode, hint) => {
    const page = `<!DOCTYPE html><html><head><link rel="stylesheet" href="css/bulma.min.css?v=1"></head><body>${box}</body></html>`;
    const { entries, output } = convert(page, { cssMode });
    expect(entries).toEqual([
      expect.objectContaining({
        rule: 'html-asset',
        message: expect.stringContaining(hint),
      }),
    ]);
    // Reported only: the module imports no stylesheet.
    expect(output).not.toMatch(/^import ['"]/m);
    // bestax's bundle builds Bulma with its own primary.
    expect(entries[0].message.includes('--bulma-primary-invert-l')).toBe(
      cssMode === 'bestax'
    );
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
    ['defaultvalue', 'rename it to `defaultValue`, or drop it'],
    ['defaultchecked', 'rename it to `defaultChecked`'],
    ['valign', 'old presentational attribute'],
    ['bgcolor', 'replace it with CSS or a class'],
    ['frobnicate', 'make it a `data-` attribute'],
  ])(
    "says what to do about %s, an attribute React's types don't list",
    (attribute, advice) => {
      const { entries } = convert(`${box}<p ${attribute}="x">t</p>\n`);
      expect(entries).toEqual([
        expect.objectContaining({
          rule: 'html-attr:unknown',
          message: expect.stringContaining(advice),
        }),
      ]);
      if (attribute !== 'valign' && attribute !== 'bgcolor') {
        expect(entries[0].message).not.toContain('CSS');
      }
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
    expect(htmlRuleId('html-asset', 'bulma')).toBe('html-asset');
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
