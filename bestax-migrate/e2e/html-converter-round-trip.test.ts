/**
 * The HTML converter writes JSX that renders the DOM it read.
 *
 * Each page is parsed, emitted as JSX, and rendered with React's server
 * renderer; the rendered HTML is parsed again, and the two DOMs are
 * compared. What may differ without changing the page is normalized away
 * on both sides: attribute order, a class list's order, how a style is
 * spelled, a boolean attribute's value, comments (a JSX comment renders
 * nothing), and whitespace, which both sides lay out by the converter's own
 * rule, so a space the emitter lost or invented shows up as a difference.
 *
 * The pages hold only what converts as written. What the converter hands
 * back instead (an event handler, an `!important`) has its own unit tests.
 */

import { find, html, svg } from 'property-information';
import { emitJsx } from '../src/sources/_shared/html/emit.js';
import {
  childrenOf,
  isComment,
  isElement,
  isText,
  parseHtml,
  type Element,
  type ParentNode,
} from '../src/sources/_shared/html/parse.js';
import { readStyle } from '../src/sources/_shared/html/style.js';
import { layoutWhitespace } from '../src/sources/_shared/html/whitespace.js';
import { loadModules, renderExports } from './support/render-module.js';

const SVG = 'http://www.w3.org/2000/svg';

/** Comments out, and the texts they separated joined. */
function stripComments(parent: ParentNode): void {
  const nodes = childrenOf(parent);
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (isComment(node)) nodes.splice(i, 1);
    else if (isElement(node)) stripComments(node);
  }
  for (let i = nodes.length - 1; i > 0; i--) {
    const [before, after] = [nodes[i - 1], nodes[i]];
    if (isText(before) && isText(after)) {
      before.value += after.value;
      nodes.splice(i, 1);
    }
  }
}

function attributes(element: Element): string[] {
  const schema = element.namespaceURI === SVG ? svg : html;
  const out: string[] = [];
  for (const attr of element.attrs) {
    const name = attr.prefix ? `${attr.prefix}:${attr.name}` : attr.name;
    let value = attr.value;
    if (name === 'class') {
      value = [...new Set(value.split(/[ \t\n\f\r]+/).filter(Boolean))]
        .sort()
        .join(' ');
    } else if (name === 'style') {
      const declarations = new Map<string, string>();
      for (const { property, value: given } of readStyle(value) ?? []) {
        declarations.delete(property);
        declarations.set(property, given);
      }
      if (declarations.size === 0) continue;
      value = [...declarations]
        .map(([property, given]) => `${property}: ${given}`)
        .sort()
        .join('; ');
    } else {
      const info = find(schema, name);
      const on =
        info.boolean ||
        (info.overloadedBoolean &&
          (value === '' || value.toLowerCase() === info.attribute));
      if (on) value = '';
    }
    out.push(`${name}=${JSON.stringify(value)}`);
  }
  return out.sort();
}

/** The DOM under `root` as lines, one element or text run to a line. */
function canonical(root: ParentNode): string {
  stripComments(root);
  const layout = layoutWhitespace(root);
  const lines: string[] = [];
  const visit = (parent: ParentNode, depth: number) => {
    let text = '';
    const flush = () => {
      if (text !== '')
        lines.push(`${'  '.repeat(depth)}${JSON.stringify(text)}`);
      text = '';
    };
    for (const piece of layout.get(parent) ?? []) {
      if (piece.kind === 'word' || piece.kind === 'exact') {
        text += piece.text;
      } else if (piece.kind === 'space') {
        if (piece.kept) text += ' ';
      } else if (isElement(piece.node)) {
        flush();
        const element = piece.node;
        lines.push(
          `${'  '.repeat(depth)}<${[element.tagName, ...attributes(element)].join(' ')}>`
        );
        visit(element, depth + 1);
      }
    }
    flush();
  };
  visit(root, 0);
  return lines.join('\n');
}

function render(jsx: string): string {
  const module = `export default function Page() {\n  return (\n${jsx}\n  );\n}\n`;
  return renderExports(loadModules({ page: module }).page).default;
}

/**
 * The image preloads React's server renderer puts before the markup, one per
 * `<img>`: React's own, and no part of the page.
 */
function dropPreloads(root: ParentNode): void {
  const nodes = childrenOf(root);
  const preload = (node: (typeof nodes)[number]) =>
    isElement(node) &&
    node.tagName === 'link' &&
    node.attrs.some(attr => attr.name === 'rel' && attr.value === 'preload');
  while (nodes.length > 0 && preload(nodes[0])) nodes.shift();
}

/** Parse, emit, render, and parse what rendered: both DOMs, normalized. */
function roundTrip(source: string): { read: string; rendered: string } {
  const parsed = parseHtml(source);
  const markup = render(emitJsx(parsed.root).code);
  const again = parseHtml(
    parsed.kind === 'document' ? `<!DOCTYPE html><body>${markup}` : markup
  );
  dropPreloads(again.root);
  return { read: canonical(parsed.root), rendered: canonical(again.root) };
}

const PAGES: Record<string, string> = {
  'a Bulma page': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Login</title>
</head>
<body class="has-background-light">
  <!-- Navigation -->
  <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <a class="navbar-item" href="/">
        <img src="logo.png" width="112" height="28" alt="Logo">
      </a>
      <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false"
         data-target="navMenu">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>
    <div id="navMenu" class="navbar-menu">
      <div class="navbar-end">
        <a class="navbar-item is-active">Home</a>
        <a class="navbar-item">About</a>
      </div>
    </div>
  </nav>
  <section class="hero is-fullheight">
    <div class="hero-body">
      <div class="container has-text-centered">
        <h3 class="title has-text-black">Login</h3>
        <p class="subtitle">Please login to <b>proceed</b>.</p>
        <div class="box">
          <figure class="avatar"><img src="https://placehold.it/128x128"></figure>
          <form>
            <div class="field">
              <div class="control has-icons-left">
                <input class="input is-large" type="email" placeholder="Your Email" autofocus="">
                <span class="icon is-small is-left"><i class="fas fa-envelope"></i></span>
              </div>
            </div>
            <div class="field">
              <label class="checkbox">
                <input type="checkbox">
                Remember me
              </label>
            </div>
            <button class="button is-block is-info is-large is-fullwidth">Login <i class="fa fa-sign-in" aria-hidden="true"></i></button>
          </form>
        </div>
        <p class="has-text-grey">
          <a href="../">Sign Up</a> &nbsp;·&nbsp;
          <a href="../">Forgot Password</a> &nbsp;·&nbsp;
          <a href="../">Need Help?</a>
        </p>
      </div>
    </div>
  </section>
  <footer class="footer">
    <div class="content has-text-centered">
      <p>
        <strong>Bulma</strong> by <a href="https://jgthms.com">Jeremy Thomas</a>. The source code is licensed
        <a href="http://opensource.org/licenses/mit-license.php">MIT</a>.
      </p>
    </div>
  </footer>
  <script src="main.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const burger = document.querySelector('.navbar-burger');
      if (burger && 1 < 2) burger.classList.toggle(\`is-active\`);
    });
  </script>
</body>
</html>
`,

  'SVG, with HTML inside it': `<span class="icon">
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
       viewbox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
    <title>Logo</title>
    <defs>
      <lineargradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#00d1b2"/>
        <stop offset="100%" stop-color="#3273dc" stop-opacity=".5"/>
      </lineargradient>
      <clippath id="clip"><rect width="24" height="24" rx="4"/></clippath>
    </defs>
    <g clip-path="url(#clip)" fill="url(#g)" stroke-linecap="round" stroke-linejoin="round">
      <path d="M0 0h24v24H0z" fill-rule="evenodd" stroke-width="1.5" stroke-dasharray="2 1"/>
      <use xlink:href="#g"/>
      <text x="4" y="16" font-size="10" text-anchor="start"> Hi <tspan font-weight="bold">there</tspan> </text>
    </g>
    <foreignobject x="0" y="0" width="24" height="24"><p class="is-size-7">x <b>y</b></p></foreignobject>
  </svg>
</span>
<span>Label</span>`,

  forms: `<form action="/subscribe" method="post" novalidate>
  <fieldset disabled="disabled">
    <legend>Account</legend>
    <div class="field">
      <label class="label" for="name">Name</label>
      <div class="control">
        <input class="input" id="name" name="name" type="text" value="Jane &amp; John" maxlength="40" required>
      </div>
    </div>
    <input type="hidden" name="token" value="abc">
    <input type="submit" value="Send">
    <input type="reset" value="Reset">
    <input type="image" src="go.png" alt="Go" value="v">
    <input type="number" min="0" max="10" step="0.5" value="3">
    <label class="radio"><input type="radio" name="r" value="a" checked> A</label>
    <label class="radio"><input type="radio" name="r" value="b"> B</label>
    <label class="checkbox"><input type="checkbox" checked="checked" value="yes"> Yes</label>
  </fieldset>
  <div class="select is-multiple">
    <select name="tags" multiple size="3">
      <optgroup label="Colours">
        <option value="red" selected>Red</option>
        <option value="green">Green</option>
      </optgroup>
      <option selected>  Blue  sky </option>
    </select>
  </div>
  <div class="select">
    <select name="one">
      <option>One</option>
      <option value="2" selected>Two</option>
    </select>
  </div>
  <textarea class="textarea" name="msg" rows="4" placeholder="Say &quot;hi&quot;">
First line
  &lt;second&gt; line</textarea>
  <button class="button is-primary" type="submit" formnovalidate>Send</button>
  <output for="name" name="out">0</output>
  <progress class="progress" value="15" max="100">15%</progress>
  <meter value="0.6" low="0.3" high="0.9">60%</meter>
  <input list="browsers"><datalist id="browsers"><option value="Firefox"><option value="Chrome"></datalist>
</form>`,

  'tables, with the parts the parser implies': `<div class="table-container">
  <table class="table is-striped is-fullwidth">
    <caption>Scores</caption>
    <colgroup><col span="2"><col class="is-highlighted"></colgroup>
    <thead>
      <tr><th><abbr title="Position">Pos</abbr></th><th colspan="2">Team</th></tr>
    </thead>
    <tfoot>
      <tr><th>Pos</th><th colspan="2">Team</th></tr>
    </tfoot>
    <tr>
      <td>1</td>
      <td rowspan="2" nowrap>Leicester</td>
      <td align="center" valign="top">38</td>
    </tr>
    <tr class="is-selected"><td>2</td><td>Arsenal</td></tr>
  </table>
</div>
<table><tr><td>implied</td></tr></table>`,

  'entities and the characters JSX reads': `<div class="content">
  <p>Fish &amp; chips &lt;3 &gt; &copy; 2026 &#169; &#x1F600; &mdash;&nbsp;done</p>
  <p>{{ handlebars }} and {single} and } stray</p>
  <p>Literal &amp;amp; and &amp;nbsp; and AT&T and a&b;c</p>
  <p>Soft&shy;hyphen, zero&#8203;width, joiner&zwj;s, rtl&rlm;mark, ideographic&#12288;space</p>
  <p>Quotes "double" 'single' \`back\` \\backslash $dollar \${template}</p>
  <p title="&quot;quoted&quot; &amp; &lt;angled&gt;" data-json='{"a": 1}' data-amp="a&amp;b;">x</p>
</div>`,

  'preformatted text': `<pre><code class="language-js">
function greet(name) {
  return \`Hello, \${name}!\`;  // \\n stays
}

if (a < b && c > d) { greet("x"); }
</code></pre>
<pre>   leading spaces
<b>bold</b>   <i> italic </i>
\ttab</pre>
<p>Inline <code>  two  spaces  </code> collapse.</p>
<pre>

two leading newlines</pre>
<div style="white-space: pre-line">line one
   line two</div>
<style>
  .a > .b { content: "{}"; }
</style>`,

  comments: `<!-- top -->
<div>
  <!-- before -->
  <p>a<!-- between -->b</p>
  <!--
    multi
    line with */ inside -- and dashes
  -->
  <!--[if lt IE 9]><p>old IE</p><![endif]-->
  <!--[if !IE]><!--><p>not IE</p><!--<![endif]-->
  <span>x</span><!-- after inline --> <span>y</span>
</div>`,

  'booleans and numbers': `<div hidden>hidden</div>
<details open><summary>More</summary>Body</details>
<video controls autoplay muted loop playsinline poster="p.jpg" width="320" height="240"><source src="v.mp4" type="video/mp4"><track default kind="captions" src="c.vtt"></video>
<iframe src="https://example.com" width="100%" height="300" frameborder="0" allowfullscreen loading="lazy"></iframe>
<a href="file.pdf" download>Download</a>
<a href="file.pdf" download="report.pdf">Download as</a>
<div draggable="true" contenteditable="true" spellcheck="false" tabindex="-1" translate="no" dir="rtl" lang="ar"></div>
<ol reversed start="5"><li value="7">seven</li></ol>
<img src="a.png" ismap usemap="#m" alt="">
<map name="m"><area shape="rect" coords="0,0,10,10" href="#a" alt="A"></map>
<div itemscope itemtype="https://schema.org/Person"><span itemprop="name">Jane</span></div>
<button class="button" disabled="false">Still disabled</button>
<input class="input" readonly value="x">
<div role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" aria-hidden="false" data-progress="40">40%</div>`,

  styles: `<div style="margin-top: 1rem; COLOR: Red; -webkit-transition: opacity .3s; -ms-transform: none; --gap: 2px; background: url('a;b.png') no-repeat /* c */; font-family: 'Fira  Code', monospace">x</div>
<span style="display:inline-block;width:10px">y</span>
<div style="">empty</div>`,

  whitespace: `<div class="buttons">
  <a class="button">One</a>
  <a class="button">Two</a>
</div>
<p>
  A long paragraph that
  wraps over   several
  lines, with <em>inline</em>
  elements <strong>and</strong> <a href="#">links</a>.
</p>
<p>Line one<br>
   line two<br/>line three</p>
<p><span class="icon"><i class="fas fa-home"></i></span> <span>Home</span></p>
<div style="display: flex">
  <span>a</span>
  text
  <span>b</span>
</div>
<ul>
  <li>One</li>
  <li> Two <b>bold</b> </li>
</ul>
<span>x <b> y </b> z</span>
<p><span>a</span><b>
  starts with a space</b></p>`,

  'custom, template and obsolete elements': `<my-widget class="x y" some-prop="1" disabled></my-widget>
<template id="row"><tr><td>cell</td></tr></template>
<center>Centered</center>
<font color="red" size="3">old</font>
<marquee>moving</marquee>`,

  'text at the top level': `Hello <b>world</b>, and <i>more</i>.`,
};

describe('the HTML converter round-trips through React', () => {
  test.each(Object.keys(PAGES))('%s', name => {
    const { read, rendered } = roundTrip(PAGES[name]);
    expect(read).not.toBe('');
    expect(rendered).toBe(read);
  });
});
