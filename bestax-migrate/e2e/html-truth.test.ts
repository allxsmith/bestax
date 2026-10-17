/**
 * The HTML converter's JSX renders the DOM its page's body parsed to.
 *
 * Each page is parsed, converted, and the JSX rendered through the built
 * library's React. The render must equal the body's DOM, compared as the
 * bulma-classes truth test compares renders (see `support/html-dom.ts` for
 * the two spelling differences it also allows). The body's DOM here is the
 * one the converter collapsed, so the second check is that collapsing
 * changed nothing a browser shows: the page and its collapsed tree lay out
 * the same, with the boxes a script may hide shown and hidden.
 *
 * The converter's JSX is plain JSX, so the bulma-classes transform runs on
 * it unchanged; the last block runs it, and the migrated page renders the
 * same as the converted one.
 */

import { htmlToJsx, rootInside } from '../src/sources/_shared/html/convert.js';
import { displayOf } from '../src/sources/_shared/html/display.js';
import { parseHtml } from '../src/sources/_shared/html/parse.js';
import transform from '../src/sources/bulma-classes/transform.js';
import { runTransform } from '../src/runner.js';
import { canonicalDom, laidOut, parseBody } from './support/html-dom.js';
import { loadModules, renderExports } from './support/render-module.js';

/** The JSX as a page module, the way the CLI will write one. */
function pageModule(jsx: string): string {
  return `export default function Page() {\n  return (\n${jsx}\n  );\n}\n`;
}

/**
 * A page module's markup. React 19's server renderer writes a
 * `<link rel="preload">` ahead of the markup for each image it could
 * preload; that is a hint for the server's response, not part of the DOM
 * the JSX renders, so it goes.
 */
function render(module: string): string {
  return renderExports(loadModules({ page: module }).page).default.replace(
    /^(?:<link rel="preload"[^>]*\/>)+/,
    ''
  );
}

const PAGES: Record<string, string> = {
  'a document with every kind of attribute': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Everything</title>
  </head>
  <body>
    <!-- A comment, which becomes a JSX one -->
    <header id="top" data-section="intro" aria-label="Intro">
      <h1>Fish &amp; Chips &lt;3 &copy; 2026</h1>
      <p>Some {braces}, a &gt;, an &nbsp;nbsp, and a <a href="/x?a=1&amp;b=2" title='say "hi"'>link</a>.</p>
    </header>
    <main>
      <p style="margin-top: 2px; -webkit-transition: none; -ms-transform: none; --brand: #f00;">Styled</p>
      <p hidden>Hidden by an attribute</p>
      <img src="a.png" alt="" width="100" height="50">
      <button type="button" disabled tabindex="0">Go</button>
      <details open><summary>More</summary><p>Inside</p></details>
      <iframe src="/frame" allowfullscreen frameborder="0" loading="lazy"></iframe>
      <video src="v.mp4" muted controls autoplay playsinline></video>
      <a download href="f.txt">plain download</a> <a download="name.txt" href="f.txt">named download</a>
      <p contenteditable="true" spellcheck="false" draggable="true" translate="no">Editable</p>
    </main>
  </body>
</html>`,

  'a form with its starting state': `<!DOCTYPE html>
<html><body>
  <form action="/send" method="post" novalidate>
    <label for="email">Email</label>
    <input id="email" type="email" name="email" value="a@b.c" required maxlength="40" autocomplete="email">
    <input type="checkbox" name="agree" value="yes" checked>
    <input type="radio" name="pick" value="1"> <input type="radio" name="pick" value="2" checked>
    <input type="submit" value="Send">
    <input type="hidden" name="token" value="abc">
    <select name="one"><option>First</option><option selected>Second</option></select>
    <select name="many" multiple size="3">
      <option value="a" selected>A</option>
      <optgroup label="More"><option value="b">B</option><option value="c" selected>C</option></optgroup>
    </select>
    <textarea name="note" rows="3" cols="20">
  Two spaces,   three
and a line</textarea>
  </form>
</body></html>`,

  'tables, lists and preformatted text': `<!DOCTYPE html>
<html><body>
  <table class="table">
    <thead><tr><th colspan="2">Head</th></tr></thead>
    <tr>
      <td>One</td>
      <td rowspan="1"> Two </td>
    </tr>
  </table>
  <ul>
    <li>One</li>
    <li><a href="#">Two</a> and <em>three</em></li>
  </ul>
  <dl><dt>Term</dt> <dd>Definition</dd></dl>
  <pre>  indented
	tabbed   spaced
</pre>
  <p style="white-space: pre-wrap">  kept   as   written  </p>
</body></html>`,

  'svg, inside a page': `<!DOCTYPE html>
<html><body>
  <p>An icon: <svg viewBox="0 0 24 24" width="24" height="24" xmlns:xlink="http://www.w3.org/1999/xlink" class="icon">
    <title>Home</title>
    <defs><linearGradient id="g"><stop offset="0" stop-color="#fff"></stop></linearGradient></defs>
    <g fill="none" stroke-width="2" stroke-linecap="round">
      <path d="M3 12l9-9 9 9"></path>
      <use xlink:href="#g"></use>
    </g>
    <text x="0" y="20">A <tspan font-weight="bold">bold</tspan> word</text>
  </svg> in a line.</p>
</body></html>`,

  'inline text across boxes': `<!DOCTYPE html>
<html><body>
  <div>
    Text before
    <span> a span </span>
    <b>bold</b><i>italic</i>
    <div>a block</div>
    text after a block
    <span hidden>sometimes</span> beside a hidden span
    <span style="float: right">floated</span> beside a float
    <span style="display: block">a span made a block</span>
    <div style="display: inline">a div made inline</div> beside it
  </div>
  <div>Text beside <div hidden>a hidden block</div> runs on when it is hidden</div>
  <div style="display: flex">
    <span>one</span>
    loose text
    <span>two</span>
    and <span style="display: none">a hidden item</span> more
  </div>
  <p>Wide&#x3000;space and a line&#x2028;separator, &#160;and a nbsp at an edge&#160;</p>
  <p>A paragraph long enough that its text has to wrap across several lines of the JSX, which joins them back with one space each, so it renders exactly as written here.</p>
  <template><p>  Kept   as   written  </p></template>
  <dialog><p>A closed dialog</p></dialog>
  <my-widget some-attr="x" class="w" for="y">Custom</my-widget>
</body></html>`,

  'a partial': `
  Text at the start, <a href="/">a link</a>, and
  <strong>more</strong>
  <section><h2>A section</h2></section>
  <link rel="stylesheet" href="partial.css">
  <style>.x > .y { color: red }</style>
  trailing text
`,

  'a Bulma page': `<!DOCTYPE html>
<html><head><link rel="stylesheet" href="bulma.min.css"></head>
<body>
  <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <a class="navbar-item" href="/">Brand</a>
    </div>
    <div class="navbar-menu">
      <div class="navbar-start">
        <a class="navbar-item">Home</a>
        <a class="navbar-item">Docs</a>
      </div>
    </div>
  </nav>
  <section class="hero is-primary">
    <div class="hero-body">
      <div class="container">
        <h1 class="title">Hello</h1>
        <h2 class="subtitle">A <strong>Bulma</strong> page</h2>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="columns">
      <div class="column">
        <div class="box">A box</div>
      </div>
      <div class="column">
        <div class="notification is-warning">A notification</div>
      </div>
    </div>
    <div class="buttons">
      <button class="button is-primary">Save</button>
      <a class="button is-light" href="/cancel">Cancel</a>
    </div>
    <div class="field">
      <label class="label">Name</label>
      <div class="control">
        <input class="input" type="text" placeholder="Your name">
      </div>
    </div>
    <div class="tags">
      <span class="tag is-info">One</span>
      <span class="tag">Two</span>
    </div>
    <progress class="progress is-primary" value="40" max="100">40%</progress>
  </section>
  <footer class="footer">
    <div class="content has-text-centered">
      <p><strong>Bulma</strong> by Jeremy Thomas.</p>
    </div>
  </footer>
</body></html>`,
};

// Silence React's development warnings: they are about the page's choices.
const error = console.error;
beforeAll(() => {
  console.error = () => {};
});
afterAll(() => {
  console.error = error;
});

describe.each(Object.entries(PAGES))('%s', (_name, source) => {
  const result = htmlToJsx(source, { indent: '    ' });
  const module = pageModule(result.jsx ?? '    null');

  it('leaves nothing out', () => {
    expect(result.notes).toEqual([]);
  });

  it("renders the body's DOM", () => {
    expect(canonicalDom(parseBody(render(module)))).toBe(
      canonicalDom(htmlToJsx(source).body)
    );
  });

  it.each(['shown', 'hidden'] as const)(
    'lays out the same once collapsed, with the hideable boxes %s',
    state => {
      const page = parseHtml(source);
      const collapsed = htmlToJsx(source).body;
      const inside = rootInside(page.kind);
      const display = (element: Parameters<typeof displayOf>[0]) =>
        displayOf(element);
      expect(laidOut(collapsed, inside, display, state)).toBe(
        laidOut(page.body, inside, display, state)
      );
    }
  );
});

describe('the bulma-classes transform on converted JSX', () => {
  const module = pageModule(
    htmlToJsx(PAGES['a Bulma page'], { indent: '    ' }).jsx!
  );
  const migrated = runTransform(transform, 'page.tsx', module).output;

  it('runs on it as it is, and converts its Bulma classes', () => {
    expect(migrated).not.toBeNull();
    expect(migrated).toMatch(/from ["']@allxsmith\/bestax-bulma["']/);
    expect(migrated).toContain('<Button');
  });

  it('renders the same as the converted page', () => {
    expect(canonicalDom(parseBody(render(migrated!)))).toBe(
      canonicalDom(parseBody(render(module)))
    );
  });
});
