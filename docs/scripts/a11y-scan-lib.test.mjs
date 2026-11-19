import { describe, expect, it } from 'vitest';
import exemptions from './a11y-exemptions.mjs';
import {
  appliesIn,
  describeFailures,
  exemptionFor,
  invalidExemptions,
  judge,
  pageMatches,
  pagesFromSitemap,
  parseArgs,
} from './a11y-scan-lib.mjs';

describe('parseArgs', () => {
  it('takes one color mode and an optional report file', () => {
    expect(parseArgs(['--theme=dark'])).toEqual({
      theme: 'dark',
      report: undefined,
    });
    expect(parseArgs(['--theme=light', '--report=out.json'])).toEqual({
      theme: 'light',
      report: 'out.json',
    });
  });

  it('refuses a missing, repeated or unknown color mode', () => {
    expect(() => parseArgs([])).toThrow(/once/);
    expect(() => parseArgs(['--theme=light', '--theme=dark'])).toThrow(/once/);
    expect(() => parseArgs(['--theme', 'dark'])).toThrow(/once/);
    expect(() => parseArgs(['--theme=sepia'])).toThrow(/once/);
  });

  it('refuses a repeated or empty report, and anything else', () => {
    expect(() =>
      parseArgs(['--theme=light', '--report=a', '--report=b'])
    ).toThrow(/at most once/);
    expect(() => parseArgs(['--theme=light', '--report='])).toThrow(
      /needs a file/
    );
    expect(() => parseArgs(['--theme=light', '--all'])).toThrow(
      /Unknown argument: --all/
    );
  });
});

describe('pagesFromSitemap', () => {
  it('lists each page path once, in order, without the origin', () => {
    const xml = `<?xml version="1.0"?><urlset>
      <url><loc>https://bestax.io/docs/intro</loc></url>
      <url><loc> https://bestax.io/ </loc></url>
      <url><loc>https://bestax.io/docs/intro</loc></url>
      <url><loc>https://bestax.io/blog/tags/react</loc></url>
    </urlset>`;
    expect(pagesFromSitemap(xml)).toEqual([
      '/docs/intro',
      '/',
      '/blog/tags/react',
    ]);
  });

  it('fails on a sitemap with no pages', () => {
    expect(() => pagesFromSitemap('<urlset></urlset>')).toThrow(/no pages/);
  });
});

describe('matching exemptions', () => {
  const contrast = {
    rule: 'color-contrast',
    pages: ['/blog/*', '/docs/intro'],
    themes: ['dark'],
    issue: 1,
  };
  const links = { rule: 'link-in-text-block', pages: ['/'], reason: 'why' };

  it('matches a path, or a prefix ending in *', () => {
    expect(pageMatches('/docs/intro', '/docs/intro')).toBe(true);
    expect(pageMatches('/docs/intro', '/docs/intro/more')).toBe(false);
    expect(pageMatches('/blog/*', '/blog/2026/post')).toBe(true);
    expect(pageMatches('/blog/*', '/docs/blog')).toBe(false);
  });

  it('applies in the color modes it names, or in both', () => {
    expect(appliesIn(contrast, 'dark')).toBe(true);
    expect(appliesIn(contrast, 'light')).toBe(false);
    expect(appliesIn(links, 'light')).toBe(true);
  });

  it('finds the exemption for an element breaking a rule on a page in a color mode', () => {
    const list = [contrast, links];
    const v = { rule: 'color-contrast', page: '/blog/x', target: 'a' };
    expect(exemptionFor(list, v, 'dark')).toBe(contrast);
    expect(exemptionFor(list, v, 'light')).toBeUndefined();
    expect(
      exemptionFor(
        list,
        { rule: 'link-in-text-block', page: '/', target: 'a' },
        'light'
      )
    ).toBe(links);
    expect(
      exemptionFor(list, { rule: 'label', page: '/', target: 'a' }, 'light')
    ).toBeUndefined();
  });

  it('covers only the elements an exemption lists, when it lists any', () => {
    const search = {
      rule: 'label-content-name-mismatch',
      pages: ['/*'],
      targets: ['.DocSearch'],
      issue: 2,
    };
    const v = target => ({
      rule: 'label-content-name-mismatch',
      page: '/docs/x',
      target,
    });
    expect(exemptionFor([search], v('.DocSearch'), 'light')).toBe(search);
    expect(exemptionFor([search], v('button.other'), 'light')).toBeUndefined();
  });

  it('fails what nothing covers, element by element, and the exemptions that covered nothing', () => {
    const search = {
      rule: 'label-content-name-mismatch',
      pages: ['/*'],
      targets: ['.DocSearch'],
      issue: 2,
    };
    const list = [contrast, links, search];
    const covered = {
      rule: 'color-contrast',
      page: '/docs/intro',
      targets: ['a'],
    };
    const mixed = {
      rule: 'label-content-name-mismatch',
      page: '/docs/intro',
      targets: ['.DocSearch', 'button.other'],
    };
    const uncovered = {
      rule: 'label',
      page: '/docs/intro',
      targets: ['input'],
    };
    const { failing, stale } = judge([covered, mixed, uncovered], list, 'dark');
    expect(failing).toEqual([
      { ...mixed, targets: ['button.other'] },
      uncovered,
    ]);
    // `links` applies in dark mode too and covered nothing.
    expect(stale).toEqual([links]);
    // In light mode `contrast` doesn't apply, so it isn't stale there.
    expect(judge([], list, 'light').stale).toEqual([links, search]);
  });
});

describe('invalidExemptions', () => {
  it('needs a rule, pages, known color modes and an issue or a reason', () => {
    expect(
      invalidExemptions([
        { rule: 'label', pages: ['/'], issue: 12 },
        { rule: 'label', pages: ['/'], reason: 'axe is wrong here' },
      ])
    ).toEqual([]);
    expect(
      invalidExemptions([
        { pages: ['/'], issue: 1 },
        { rule: 'label', pages: [], issue: 1 },
        { rule: 'label', pages: ['/'], themes: ['sepia'], issue: 1 },
        { rule: 'label', pages: ['/'], issue: 0, reason: ' ' },
        { rule: 'label', pages: ['/'], targets: [], issue: 1 },
      ])
    ).toEqual([
      'Exemption 1 (no rule) names no rule.',
      'Exemption 2 (label) names no pages.',
      'Exemption 3 (label) names a color mode other than light or dark.',
      'Exemption 4 (label) needs an issue number or a reason.',
      'Exemption 5 (label) lists no targets.',
    ]);
  });

  it('passes the real exemptions file', () => {
    expect(invalidExemptions(exemptions)).toEqual([]);
  });
});

describe('describeFailures', () => {
  it('groups by rule and shortens long target lists', () => {
    const lines = describeFailures([
      { page: '/b', rule: 'label', help: 'Inputs need names', targets: ['#a'] },
      {
        page: '/a',
        rule: 'image-alt',
        help: 'Images need alt',
        targets: ['img.1', 'img.2', 'img.3', 'img.4', 'img.5'],
      },
    ]);
    expect(lines).toEqual([
      'image-alt: Images need alt (1 pages)',
      '  /a',
      '    img.1',
      '    img.2',
      '    img.3',
      '    and 2 more',
      'label: Inputs need names (1 pages)',
      '  /b',
      '    #a',
    ]);
  });
});
