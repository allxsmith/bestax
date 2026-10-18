/**
 * An HTML page and the module it becomes render the same markup, three ways:
 * the page's body as a browser builds it equals the intermediate module (the
 * page as plain JSX, before the planner) rendered, which proves the
 * converter, and that equals the migrated module rendered, which proves the
 * planner on what the converter wrote.
 *
 * All three are normalized by `support/dom-canonical.ts` with the display
 * hook the converter used, so a space it dropped beside a Bulma flex box is
 * one the page didn't render either. Scripts are taken out of the page
 * first: the converter drops them by design, and reports each.
 *
 * The pages are the HTML fixture pairs, but `events` (whose handlers are
 * dropped, by design), the kitchen sink's landing page and partial, and the
 * pages below, which hold what converts as written.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  childrenOf,
  isElement,
  parseHtml,
  type ParentNode,
} from '../src/sources/_shared/html/parse.js';
import {
  convertPage,
  pageDisplayOf,
} from '../src/sources/bulma-classes/html.js';
import { canonical, dropPreloads } from './support/dom-canonical.js';
import {
  loadModules,
  renderExports,
  withImplicitListRoles,
} from './support/render-module.js';

const packageRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const fixturesDir = path.join(
  packageRoot,
  'src',
  'sources',
  'bulma-classes',
  '__testfixtures__',
  'html'
);
const sinkDir = path.join(packageRoot, 'fixtures', 'bulma-classes-html');

function withoutScripts(parent: ParentNode): void {
  const nodes = childrenOf(parent);
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (!isElement(node)) continue;
    if (node.tagName === 'script') nodes.splice(i, 1);
    else withoutScripts(node);
  }
}

function markupOf(module: string): string {
  return renderExports(loadModules({ page: module }).page).default;
}

function canonicalOf(markup: string, document: boolean): string {
  const again = parseHtml(document ? `<!DOCTYPE html><body>${markup}` : markup);
  dropPreloads(again.root);
  return canonical(again.root, pageDisplayOf);
}

function threeWays(file: string, source: string) {
  const parsed = parseHtml(source);
  withoutScripts(parsed.root);
  const { intermediate, output } = convertPage(file, source, undefined, {});
  if (intermediate === null || output === null) {
    throw new Error(`${file} wrote nothing`);
  }
  const document = parsed.kind === 'document';
  const before = markupOf(intermediate);
  const after = markupOf(output);
  return {
    page: canonical(parsed.root, pageDisplayOf),
    intermediate: canonicalOf(before, document),
    // `Menu.List` writes the `role="list"` a `.menu-list` only implies
    // (#1108), so the migrated page is held to the intermediate one with
    // that role restated where the migrated list carries it.
    restated: canonicalOf(withImplicitListRoles(before, after), document),
    migrated: canonicalOf(after, document),
    output,
  };
}

const PAGES: Record<string, string> = {
  'a Bulma landing page': `<!DOCTYPE html>
<html>
<body>
  <nav class="navbar is-dark" role="navigation" aria-label="main navigation">
    <div class="container">
      <div class="navbar-brand">
        <a class="navbar-item" href="/"><strong>Acme</strong></a>
      </div>
      <div class="navbar-menu">
        <div class="navbar-end">
          <a class="navbar-item" href="/docs">Docs</a>
          <span class="navbar-item">
            <a class="button is-primary is-inverted" href="/start">
              <span class="icon" aria-hidden="true"><i class="fas fa-rocket"></i></span>
              <span>Start</span>
            </a>
          </span>
        </div>
      </div>
    </div>
  </nav>
  <section class="hero is-info is-fullheight-with-navbar">
    <div class="hero-body">
      <div class="container">
        <p class="title">Build it <em>today</em></p>
        <p class="subtitle">With   <strong>Bulma</strong>, and bestax.</p>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <nav class="breadcrumb" aria-label="breadcrumbs">
        <ul>
          <li><a href="/">Home</a></li>
          <li class="is-active"><a href="#" aria-current="page">Docs</a></li>
        </ul>
      </nav>
      <div class="tabs is-boxed">
        <ul>
          <li class="is-active"><a>Pictures</a></li>
          <li><a>Music</a></li>
        </ul>
      </div>
      <div class="columns is-variable is-4">
        <div class="column is-8">
          <article class="media">
            <figure class="media-left">
              <p class="image is-64x64"><img src="/avatar.png" alt=""></p>
            </figure>
            <div class="media-content">
              <div class="content">
                <p><strong>Jane</strong> <small>@jane</small><br>Shipped the new docs.</p>
              </div>
            </div>
          </article>
        </div>
        <div class="column">
          <aside class="menu">
            <p class="menu-label">General</p>
            <ul class="menu-list">
              <li><a class="is-active" href="#">Dashboard</a></li>
              <li><a href="#">Customers</a></li>
            </ul>
          </aside>
        </div>
      </div>
      <div class="field has-addons">
        <div class="control">
          <input class="input" id="search" type="text" placeholder="Find a repository">
        </div>
        <div class="control">
          <a class="button is-info">Search</a>
        </div>
      </div>
      <nav class="pagination is-centered" role="navigation" aria-label="pagination">
        <a class="pagination-previous" tabindex="0">Previous</a>
        <a class="pagination-next" tabindex="0">Next</a>
        <ul class="pagination-list">
          <li><a class="pagination-link" aria-label="Goto page 1" tabindex="0">1</a></li>
          <li><span class="pagination-ellipsis">&hellip;</span></li>
          <li><a class="pagination-link is-current" aria-label="Page 3" aria-current="page" tabindex="0">3</a></li>
        </ul>
      </nav>
    </div>
  </section>
  <div class="modal">
    <div class="modal-background"></div>
    <div class="modal-content"><p class="box">Hidden until opened</p></div>
  </div>
</body>
</html>
`,

  'whitespace beside Bulma boxes': `<div class="buttons are-small">
  <button class="button">A</button>
  <button class="button is-link">B</button>
</div>
<p class="buttons">
  <a class="button">C</a> <a class="button">D</a>
</p>
<span class="tag">one</span> <span class="tag">two</span>
<div class="level is-mobile">
  <div class="level-item">x</div>
  <div class="level-item"><span>y</span> z</div>
</div>
<p>Text <span class="is-hidden-tablet">mobile only</span> and <span class="is-flex-desktop">flex</span> after</p>
<div class="notification">
  Text <div class="is-overlay"></div> on
</div>`,
};

const fixtureCases = fs
  .readdirSync(fixturesDir)
  .filter(file => file.endsWith('.input.html') && !file.startsWith('events.'))
  .map(file => file.replace(/\.input\.html$/, ''))
  .sort();

const sinkPages = ['pages/landing.html', 'pages/partials/pricing.html'];

describe('an HTML page renders the same as the module it becomes', () => {
  test.each(fixtureCases)('fixture %s', name => {
    const file = path.join(fixturesDir, `${name}.html`);
    const source = fs.readFileSync(
      path.join(fixturesDir, `${name}.input.html`),
      'utf8'
    );
    const { page, intermediate, restated, migrated } = threeWays(file, source);
    expect(page).not.toBe('');
    expect(intermediate).toBe(page);
    expect(migrated).toBe(restated);
  });

  test.each(sinkPages)('kitchen sink %s', page => {
    const file = path.join(sinkDir, page);
    const ways = threeWays(file, fs.readFileSync(file, 'utf8'));
    expect(ways.intermediate).toBe(ways.page);
    expect(ways.migrated).toBe(ways.restated);
  });

  test.each(Object.keys(PAGES))('%s', name => {
    const file = path.join(fixturesDir, 'page.html');
    const ways = threeWays(file, PAGES[name]);
    expect(ways.intermediate).toBe(ways.page);
    expect(ways.migrated).toBe(ways.restated);
    // The planner converted something, so the second equality says more
    // than the first.
    expect(ways.output).toContain('@allxsmith/bestax-bulma');
  });
});
