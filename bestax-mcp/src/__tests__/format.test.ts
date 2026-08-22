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

  it('passes non-http(s) strings through unchanged', () => {
    for (const notAUrl of ['bestax://catalog', 'mailto:a@b.c', 'Button', '']) {
      expect(attributed(notAUrl)).toBe(notAUrl);
    }
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
