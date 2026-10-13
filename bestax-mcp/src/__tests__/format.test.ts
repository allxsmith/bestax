/**
 * Unit tests for `attributed`, the link tagger, and `attributedLinks`, which
 * applies it to the links inside index text.
 *
 * The server is offline by design (openWorldHint: false), so the tag on its
 * outbound links is the only attribution signal it has — these pin the
 * functions' contracts. The emission paths themselves are asserted where the
 * links surface: server.test.ts for the component link line and the links in
 * index answers, version.test.ts for the drift note.
 */
import { describe, expect, it } from '@jest/globals';

import { loadComponent } from '../data.js';
import {
  attributed,
  attributedLinks,
  referenceOf,
  referencePointer,
  renderComponent,
  renderCssVarsAnswer,
  renderHelperApi,
} from '../format.js';

describe('attributed', () => {
  it('appends with ? when the URL has no query string', () => {
    expect(attributed('https://bestax.io/docs/api/elements/button')).toBe(
      'https://bestax.io/docs/api/elements/button?utm_source=bestax-mcp'
    );
  });

  it('appends with & when the URL already has one, as Storybook links do', () => {
    expect(
      attributed('https://bestax.io/storybook/?path=/story/elements-button')
    ).toBe(
      'https://bestax.io/storybook/?path=/story/elements-button&utm_source=bestax-mcp'
    );
  });

  it('is idempotent', () => {
    const once = attributed('https://bestax.io/docs');
    expect(attributed(once)).toBe(once);
  });

  it('returns an already-tagged URL unchanged', () => {
    const tagged = 'https://bestax.io/docs?utm_source=bestax-mcp';
    expect(attributed(tagged)).toBe(tagged);
  });

  it('is not fooled by the tag text inside a fragment', () => {
    // The analytics request never sees the fragment, so this URL is NOT
    // attributed yet — the already-tagged check must look at the query only.
    expect(attributed('https://bestax.io/docs#utm_source=bestax-mcp')).toBe(
      'https://bestax.io/docs?utm_source=bestax-mcp#utm_source=bestax-mcp'
    );
  });

  it('is not fooled by the tag text inside another parameter value', () => {
    const url = 'https://bestax.io/docs?ref=utm_source=bestax-mcp';
    expect(attributed(url)).toBe(`${url}&utm_source=bestax-mcp`);
  });

  it('passes non-http(s) strings through unchanged', () => {
    for (const notAUrl of ['bestax://catalog', 'mailto:a@b.c', 'Button', '']) {
      expect(attributed(notAUrl)).toBe(notAUrl);
    }
  });

  it('keeps a fragment after the query string', () => {
    expect(attributed('https://bestax.io/docs/guides/foo#bar')).toBe(
      'https://bestax.io/docs/guides/foo?utm_source=bestax-mcp#bar'
    );
  });

  it('inserts ahead of the fragment when a query string is already present', () => {
    expect(
      attributed(
        'https://bestax.io/storybook/?path=/story/elements-button#anchor'
      )
    ).toBe(
      'https://bestax.io/storybook/?path=/story/elements-button&utm_source=bestax-mcp#anchor'
    );
  });
});

describe('attributedLinks', () => {
  const DOCS = 'https://bestax.io/docs/api/components/avatar';
  const TAGGED = `${DOCS}?utm_source=bestax-mcp`;

  it('tags a link into bestax.io', () => {
    expect(attributedLinks(`See [Avatar](${DOCS}).`)).toBe(
      `See [Avatar](${TAGGED}).`
    );
  });

  it('keeps a fragment after the query', () => {
    expect(attributedLinks(`[notes](${DOCS}#accessibility)`)).toBe(
      `[notes](${TAGGED}#accessibility)`
    );
  });

  it('joins an existing query with &, as on a Storybook link', () => {
    const story =
      'https://bestax.io/storybook/?path=/story/helpers-portal--default';
    expect(attributedLinks(`[story](${story})`)).toBe(
      `[story](${story}&utm_source=bestax-mcp)`
    );
  });

  it('tags a target in angle brackets, inside them', () => {
    expect(attributedLinks(`[Avatar](<${DOCS}>)`)).toBe(
      `[Avatar](<${TAGGED}>)`
    );
  });

  it('tags a target followed by a title, and keeps the title', () => {
    expect(attributedLinks(`[Avatar](${DOCS} "The page")`)).toBe(
      `[Avatar](${TAGGED} "The page")`
    );
    expect(attributedLinks(`[Avatar](<${DOCS}> 'The page')`)).toBe(
      `[Avatar](<${TAGGED}> 'The page')`
    );
  });

  // A target that ends at the host, closed by each thing that may follow it there,
  // so the check that skips text with no site link in it skips none of these.
  it.each([
    ['[x](https://bestax.io)', '[x](https://bestax.io?utm_source=bestax-mcp)'],
    [
      '[x](https://bestax.io/)',
      '[x](https://bestax.io/?utm_source=bestax-mcp)',
    ],
    [
      '[x](https://bestax.io?a=1)',
      '[x](https://bestax.io?a=1&utm_source=bestax-mcp)',
    ],
    [
      '[x](https://bestax.io#top)',
      '[x](https://bestax.io?utm_source=bestax-mcp#top)',
    ],
    [
      '[x](https://bestax.io "Home")',
      '[x](https://bestax.io?utm_source=bestax-mcp "Home")',
    ],
    [
      '[x](<https://bestax.io>)',
      '[x](<https://bestax.io?utm_source=bestax-mcp>)',
    ],
  ])('tags %s, a target that ends at the host', (markdown, tagged) => {
    expect(attributedLinks(markdown)).toBe(tagged);
  });

  it('tags a link whose text is a code span', () => {
    expect(attributedLinks(`[\`Avatar\`](${DOCS})`)).toBe(
      `[\`Avatar\`](${TAGGED})`
    );
  });

  it('tags every link in the text, across lines', () => {
    expect(
      attributedLinks(`- [one](${DOCS})\n- [two](${DOCS}#props) and more`)
    ).toBe(`- [one](${TAGGED})\n- [two](${TAGGED}#props) and more`);
  });

  it('is idempotent, and leaves an already-tagged link as it is', () => {
    const once = attributedLinks(`[a](${DOCS}#x) and [b](<${DOCS}>)`);
    expect(attributedLinks(once)).toBe(once);
    expect(attributedLinks(`[a](${TAGGED})`)).toBe(`[a](${TAGGED})`);
  });

  it.each([
    ['another host', '[Bulma](https://bulma.io/documentation/)'],
    ['a host that only starts like it', '[x](https://bestax.io.example.com/a)'],
    ['plain http', '[x](http://bestax.io/docs)'],
    ['a relative page', '[Avatar](./avatar.md)'],
    ['a fragment on the same page', '[props](#props)'],
    ['a site-absolute path', '[docs](/docs/api)'],
    ['a bare URL', `Read ${DOCS} first.`],
    ['an autolink', `Read <${DOCS}> first.`],
    ['an image', `![logo](https://bestax.io/img/logo.svg)`],
    ['brackets that open no link', `see ](${DOCS}) here`],
    ['an escaped bracket', `\\[Avatar](${DOCS})`],
    ['a destination with a space in it', `[Avatar](${DOCS} not a title)`],
    ['a link inside a code span', `Write \`[Avatar](${DOCS})\` there.`],
    [
      'a code span of two backticks, holding one',
      `\`\` \`[Avatar](${DOCS})\` \`\``,
    ],
  ])('leaves %s alone', (_, markdown) => {
    expect(attributedLinks(markdown)).toBe(markdown);
  });

  it('tags the link around an image, not the image', () => {
    const img = '![logo](https://bestax.io/img/logo.svg)';
    expect(attributedLinks(`[${img}](${DOCS})`)).toBe(`[${img}](${TAGGED})`);
  });

  it('reads three backticks with more after them as a code span, not a fence', () => {
    // A fence would leave the next line alone too.
    const md = `\`\`\`[inside](${DOCS})\`\`\`\n[after](${DOCS})`;
    expect(attributedLinks(md)).toBe(
      md.replace(`[after](${DOCS})`, `[after](${TAGGED})`)
    );
  });

  it('reads a lone backtick as text, not the start of a code span', () => {
    expect(attributedLinks(`one \` tick, then [Avatar](${DOCS})`)).toBe(
      `one \` tick, then [Avatar](${TAGGED})`
    );
  });

  it('leaves fenced code alone, and tags the prose around it', () => {
    const fenced = (fence: string, indent = '') =>
      [
        `[before](${DOCS})`,
        '',
        `${indent}${fence}md`,
        `${indent}[inside](${DOCS})`,
        `${indent}${fence}`,
        '',
        `[after](${DOCS})`,
      ].join('\n');
    for (const [fence, indent] of [
      ['```', ''],
      ['~~~', ''],
      ['```', '   '],
    ]) {
      expect(attributedLinks(fenced(fence, indent))).toBe(
        [
          `[before](${TAGGED})`,
          '',
          `${indent}${fence}md`,
          `${indent}[inside](${DOCS})`,
          `${indent}${fence}`,
          '',
          `[after](${TAGGED})`,
        ].join('\n')
      );
    }
  });

  it('leaves a fence in a list item alone', () => {
    const md = [
      `1. Read [the page](${DOCS}):`,
      '',
      '   ```tsx',
      `   // [inside](${DOCS})`,
      '   ```',
      '',
      `2. Then [this](${DOCS}#props).`,
    ].join('\n');
    expect(attributedLinks(md)).toBe(
      [
        `1. Read [the page](${TAGGED}):`,
        '',
        '   ```tsx',
        `   // [inside](${DOCS})`,
        '   ```',
        '',
        `2. Then [this](${TAGGED}#props).`,
      ].join('\n')
    );
  });

  it('closes a fence only on a run of its own character, at least as long', () => {
    const md = [
      '````md',
      '```',
      `[inside](${DOCS})`,
      '~~~',
      `[inside](${DOCS})`,
      '````',
      `[after](${DOCS})`,
    ].join('\n');
    expect(attributedLinks(md)).toBe(
      md.replace(`[after](${DOCS})`, `[after](${TAGGED})`)
    );
  });

  it('leaves everything after a fence that never closes', () => {
    const md = `[before](${DOCS})\n\n\`\`\`\n[inside](${DOCS})\n\n[still](${DOCS})`;
    expect(attributedLinks(md)).toBe(
      md.replace(`[before](${DOCS})`, `[before](${TAGGED})`)
    );
  });

  it('returns text with no bestax.io link unchanged', () => {
    const md = 'No links here, and `code` with [a](./b.md).';
    expect(attributedLinks(md)).toBe(md);
  });
});

describe('the prose page size the pointers quote', () => {
  // The size is what `include: ["reference"]` returns, and that page is served with
  // its links tagged, so the size counts the tags.
  it('is the length of the page as served', async () => {
    const record = await loadComponent('useBulmaClasses');
    const served = referenceOf(record);
    expect(served).not.toBe(record.doc);
    expect(served).toBe(attributedLinks(record.doc ?? ''));
    const size = `(${served.length.toLocaleString('en-US')} characters)`;
    expect(renderHelperApi(record)).toContain(size);
    expect(referencePointer(record)).toContain(size);
    expect(renderComponent(record, ['reference'])).toContain(served);
  });
});

describe('renderComponent on code', () => {
  // No example in the index holds a markdown link into bestax.io today, so one is made
  // here: whatever an example holds is part of the program, and is served as written.
  it('serves an example as written, a link-shaped string included', async () => {
    const record = await loadComponent('Button');
    const code =
      "const md = '[Button](https://bestax.io/docs/api/elements/button)';";
    const out = renderComponent(
      { ...record, examples: [{ title: 'A link in code', code }] },
      ['examples']
    );
    expect(out).toContain('```tsx\n' + code + '\n```');
  });
});

describe('renderComponent link line', () => {
  it('tags both the docs and Storybook links', async () => {
    const record = await loadComponent('Button');
    const out = renderComponent(record, ['props']);
    // Against the committed index: the docs URL carries no query string, the
    // Storybook URL carries `?path=...` — so this exercises both separators.
    expect(out).toContain(`Docs: ${record.docsUrl}?utm_source=bestax-mcp`);
    expect(out).toContain(
      `Storybook: ${record.storybook}&utm_source=bestax-mcp`
    );
  });
});

describe('renderComponent CSS variable pointer', () => {
  // Issue #501: get_css_variables reached 1/10 MCP-only builders in an eval arm where
  // every run themed the site by hand. The routing fix is a pointer at `include`, not a
  // separate tool call the builder has to already know to make.
  it('names the count and points at include when cssVars is not requested', async () => {
    const record = await loadComponent('Button');
    const out = renderComponent(record, ['props']);
    expect(out).not.toContain('## CSS Variables');
    expect(out).toContain(
      `\`Button\` has ${record.cssVars.length} CSS variables for theming`
    );
    expect(out).toContain('include: ["cssVars"]');
  });

  it('says nothing when cssVars is already included', async () => {
    const record = await loadComponent('Button');
    const out = renderComponent(record, ['props', 'cssVars']);
    expect(out).toContain('## CSS Variables');
    expect(out).not.toContain('for theming — pass');
  });

  it('says nothing for a component with no CSS variables', async () => {
    const record = await loadComponent('Block');
    expect(record.cssVars).toHaveLength(0);
    const out = renderComponent(record, ['props']);
    expect(out).not.toContain('CSS variable');
  });

  // `include` can't serve the other component's variables on this call, so that
  // part of the hint names get_css_variables, as that tool's own answer does.
  const linkButtonPointer =
    "LinkButton renders Button's element, so Button's variables style it too, " +
    'for the colors and modifiers it accepts. They are in ' +
    '`get_css_variables({ component: "Button" })`.';

  it("adds the other component's call to the count for one that renders its element", async () => {
    const record = await loadComponent('LinkButton');
    expect(record.cssVarsFrom).toBe('Button');
    const out = renderComponent(record, ['props']);
    expect(out).toContain(
      `\`LinkButton\` has ${record.cssVars.length} CSS variables for theming ` +
        '— pass `include: ["cssVars"]` to see them. It renders ' +
        "Button's element, so Button's variables style it too, for the colors " +
        'and modifiers it accepts. They are in ' +
        '`get_css_variables({ component: "Button" })`.'
    );
    // A component that renders its own element gets the count alone.
    expect(
      renderComponent(await loadComponent('Button'), ['props'])
    ).not.toContain('element, so');
  });

  it('puts the call under its own rows when cssVars is included', async () => {
    const out = renderComponent(await loadComponent('LinkButton'), [
      'props',
      'cssVars',
    ]);
    expect(out).toContain('## CSS Variables');
    expect(out).toContain(linkButtonPointer);
    expect(out.indexOf(linkButtonPointer)).toBeGreaterThan(
      out.lastIndexOf('--bulma-link-button-')
    );
  });
});

describe('renderCssVarsAnswer without a query', () => {
  it('never says "matching", even given no rows for a component that has some', async () => {
    // The server passes all of a component's rows when there is no query, but the
    // function is exported, so a caller passing an empty list mustn't get a sentence
    // naming a query nobody made.
    const record = await loadComponent('LinkButton');
    expect(record.cssVars.length).toBeGreaterThan(0);
    const out = renderCssVarsAnswer(record, []);
    expect(out).not.toContain('matching');
    expect(out).not.toContain('undefined');
  });
});

describe('a component with no class of its own', () => {
  // A component that renders another's element and adds no class lists no variables,
  // so both tools answer with the pointer and nothing else. ToggleButton's record with
  // its rows taken out stands in for one; the server tests hold the records the index
  // ships.
  const bare = async () => ({
    ...(await loadComponent('ToggleButton')),
    cssVars: [],
  });

  it('says it has none of its own and names the call for the ones that style it', async () => {
    const record = await bare();
    expect(record.cssVarsFrom).toBe('Button');
    expect(renderCssVarsAnswer(record, [])).toBe(
      'ToggleButton registers no CSS variables of its own. It renders ' +
        "Button's element, so Button's variables style it, for the colors and " +
        'modifiers it accepts. They are in ' +
        '`get_css_variables({ component: "Button" })`.'
    );
  });

  it('says "of its own" with a query too, and carries the query to the call', async () => {
    // "None matching" would undersell a component that has none at all.
    expect(renderCssVarsAnswer(await bare(), [], 'say "hi"')).toBe(
      'ToggleButton registers no CSS variables of its own. It renders ' +
        "Button's element, so Button's variables style it, for the colors and " +
        'modifiers it accepts. They are in ' +
        '`get_css_variables({ component: "Button", query: "say \\"hi\\"" })`.'
    );
  });

  it('gives get_component the same pointer in place of the count', async () => {
    // Without it the answer says nothing about CSS variables at all, since the count
    // is of the component's own rows.
    const record = await bare();
    const pointer = renderCssVarsAnswer(record, []);
    for (const include of [['props'], ['props', 'cssVars']]) {
      const out = renderComponent(record, include);
      expect(out).toContain(pointer);
      expect(out).not.toContain('for theming');
      expect(out).not.toContain('## CSS Variables');
    }
  });
});
