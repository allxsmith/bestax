/**
 * Unit tests for `attributed`, the link tagger.
 *
 * The server is offline by design (openWorldHint: false), so the tag on its
 * outbound links is the only attribution signal it has — these pin the
 * function's contract. The emission paths themselves are asserted where the
 * links surface: server.test.ts for the component link line, version.test.ts
 * for the drift note.
 */
import { describe, expect, it } from '@jest/globals';

import { loadComponent } from '../data.js';
import { attributed, renderComponent } from '../format.js';

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
});
