/**
 * The HTML converter writes JSX that renders the DOM it read.
 *
 * Each page is parsed, emitted as JSX, and rendered with React's server
 * renderer; the rendered HTML is parsed again, and the two DOMs are
 * compared, normalized on both sides by `support/dom-canonical.ts`, which
 * says what may differ without changing the page.
 *
 * The pages hold only what converts as written. What the converter hands
 * back instead (an event handler, an `!important`) has its own unit tests.
 */

import { emitJsx } from '../src/sources/_shared/html/emit.js';
import { parseHtml } from '../src/sources/_shared/html/parse.js';
import { canonical, dropPreloads } from './support/dom-canonical.js';
import { loadModules, renderExports } from './support/render-module.js';

function render(jsx: string): string {
  const module = `export default function Page() {\n  return (\n${jsx}\n  );\n}\n`;
  return renderExports(loadModules({ page: module }).page).default;
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

  // A dropped conditional comment leaves a space that renders right before
  // a line break, which JSX would trim.
  'spaces beside a dropped conditional comment': `<p><b>a <!--[if lt IE 9]>x<![endif]-->
</b>c</p>
<p><b>a <!--[if IE]>x<![endif]-->
<i>c</i></b></p>
<p><i>a</i> <!--[if IE]>x<![endif]-->
<i>b</i></p>`,

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
<div style="">empty</div>
<p>a <span style="display: none; *zoom: 1">hidden</span> b <span style="_height: ; color: red">c</span></p>`,

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
  starts with a space</b></p>
<div style="display: table"><span>inline</span> <span>content</span>
  <div style="display: table-row">
    <div style="display: table-cell">a cell</div>
    <div style="display: table-cell">another</div>
  </div>
</div>`,

  'custom, template and obsolete elements': `<my-widget class="x y" some-prop="1" disabled></my-widget>
<template id="row"><tr><td>cell</td></tr></template>
<center>Centered</center>
<font color="red" size="3">old</font>
<marquee>moving</marquee>
<button is="fancy-button" class="button" disabled tabindex="0">Fancy</button>
<textarea is="x-area" rows="2">Kept
text</textarea>
<select is="x-select"><option is="x-option">a</option><option selected>b</option></select>`,

  'text at the top level': `Hello <b>world</b>, and <i>more</i>.`,
};

describe('the HTML converter round-trips through React', () => {
  test.each(Object.keys(PAGES))('%s', name => {
    const { read, rendered } = roundTrip(PAGES[name]);
    expect(read).not.toBe('');
    expect(rendered).toBe(read);
  });
});
