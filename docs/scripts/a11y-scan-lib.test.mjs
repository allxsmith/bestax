import { describe, expect, it } from 'vitest';
import exemptions from './a11y-exemptions.mjs';
import {
  appliesIn,
  coverFor,
  describeFailures,
  formatTarget,
  invalidExemptions,
  judge,
  pageMatches,
  pagesFromSitemap,
  parseArgs,
  settleAnimations,
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
    expect(() => parseArgs(['--theme=light', '--themes=dark'])).toThrow(
      /Unknown argument: --themes=dark/
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
  const search = {
    rule: 'label-content-name-mismatch',
    pages: ['/*'],
    targets: ['.DocSearch'],
    issue: 2,
  };

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

  it('finds every exemption and page pattern that covers an element', () => {
    const v = { rule: 'color-contrast', page: '/blog/x', target: 'a' };
    expect(coverFor([contrast, links], v, 'dark')).toEqual([
      { exemption: contrast, pattern: '/blog/*' },
    ]);
    expect(coverFor([contrast, links], v, 'light')).toEqual([]);
    expect(
      coverFor(
        [contrast, links],
        { rule: 'label', page: '/', target: 'a' },
        'light'
      )
    ).toEqual([]);
    // Two that overlap both cover it.
    const narrower = { ...contrast, pages: ['/blog/x'], issue: 3 };
    expect(coverFor([contrast, narrower], v, 'dark')).toEqual([
      { exemption: contrast, pattern: '/blog/*' },
      { exemption: narrower, pattern: '/blog/x' },
    ]);
  });

  it('covers only the elements an exemption lists, when it lists any', () => {
    const v = target => ({
      rule: 'label-content-name-mismatch',
      page: '/docs/x',
      target,
    });
    expect(coverFor([search], v('.DocSearch'), 'light')).toHaveLength(1);
    expect(coverFor([search], v('button.other'), 'light')).toEqual([]);
  });

  it('fails what nothing covers, element by element', () => {
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
    const { failing } = judge([mixed, uncovered], [search], 'dark');
    expect(failing).toEqual([
      { ...mixed, targets: ['button.other'] },
      uncovered,
    ]);
  });

  it('finds each page pattern that covered nothing, in the color modes it applies in', () => {
    const covered = {
      rule: 'color-contrast',
      page: '/docs/intro',
      targets: ['a'],
    };
    const { stale } = judge([covered], [contrast, links], 'dark');
    // `/docs/intro` covered something; `/blog/*` and `links` didn't.
    expect(stale).toEqual([
      { exemption: contrast, pattern: '/blog/*' },
      { exemption: links, pattern: '/' },
    ]);
    // In light mode `contrast` doesn't apply, so it isn't stale there.
    expect(judge([], [contrast, links], 'light').stale).toEqual([
      { exemption: links, pattern: '/' },
    ]);
  });

  it('judges nothing stale when pages failed to load', () => {
    expect(judge([], [contrast, links], 'dark', true).stale).toEqual([]);
  });
});

describe('formatTarget', () => {
  it('joins shadow roots with >>> and frames with >>', () => {
    expect(formatTarget(['.DocSearch'])).toBe('.DocSearch');
    expect(formatTarget([['.live-preview', 'button.button']])).toBe(
      '.live-preview >>> button.button'
    );
    expect(formatTarget(['iframe', ['#host', 'input']])).toBe(
      'iframe >> #host >>> input'
    );
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

describe('settleAnimations', () => {
  /**
   * A stand-in for a Web Animations API animation, with `end()` and
   * `cancel()` to move it on the way the browser would.
   */
  function animation({
    endTime = 100,
    playState = 'running',
    property = 'opacity',
  } = {}) {
    let resolve;
    let reject;
    const anim = {
      playState,
      effect: {
        getComputedTiming: () => ({ endTime }),
        getKeyframes: () => [{ offset: 0, [property]: '0' }],
      },
      finished: new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      }),
      end() {
        anim.playState = 'finished';
        resolve();
      },
      cancel() {
        anim.playState = 'idle';
        reject(new Error('AbortError'));
      },
    };
    anim.finished.catch(() => {});
    return anim;
  }
  /** A document (or shadow root) holding `animations` and `hosts`. */
  function rootWith(animations, hosts = []) {
    return {
      // As a browser does, a cancelled animation drops out of the list.
      getAnimations: () => animations.filter(a => a.playState !== 'idle'),
      querySelectorAll: () => hosts,
    };
  }
  const tick = ms => new Promise(resolve => setTimeout(resolve, ms));
  /** Starts settling, and tracks whether it has finished. */
  function settle(timeoutMs, doc) {
    const state = { done: false };
    state.result = settleAnimations(timeoutMs, doc).then(result => {
      state.done = true;
      return result;
    });
    return state;
  }

  it('waits for a running animation that will end, and not for one that loops', async () => {
    const fade = animation();
    const settling = settle(
      10_000,
      rootWith([fade, animation({ endTime: Infinity })])
    );
    await tick(20);
    expect(settling.done).toBe(false);
    fade.end();
    expect(await settling.result).toEqual({ timedOut: false });
  });

  it('leaves alone one that is paused, already finished, or moves an element without fading it', async () => {
    expect(
      await settleAnimations(
        10_000,
        rootWith([
          animation({ playState: 'paused' }),
          animation({ playState: 'finished' }),
          animation({ property: 'transform' }),
        ])
      )
    ).toEqual({ timedOut: false });
  });

  it('waits again for an animation that starts as another ends', async () => {
    const first = animation();
    const second = animation();
    const animations = [first];
    const settling = settle(10_000, rootWith(animations));
    animations.push(second);
    first.end();
    await tick(20);
    expect(settling.done).toBe(false);
    second.end();
    expect(await settling.result).toEqual({ timedOut: false });
  });

  it('waits for one inside a shadow root', async () => {
    const fade = animation();
    const settling = settle(
      10_000,
      rootWith([], [{ shadowRoot: rootWith([fade]) }, { shadowRoot: null }])
    );
    await tick(20);
    expect(settling.done).toBe(false);
    fade.end();
    expect(await settling.result).toEqual({ timedOut: false });
  });

  it('treats a cancelled animation as ended', async () => {
    const fade = animation();
    const settling = settle(10_000, rootWith([fade]));
    fade.cancel();
    expect(await settling.result).toEqual({ timedOut: false });
  });

  it('says it timed out when a running animation outlasts the timeout', async () => {
    const start = Date.now();
    expect(await settleAnimations(30, rootWith([animation()]))).toEqual({
      timedOut: true,
    });
    expect(Date.now() - start).toBeGreaterThanOrEqual(25);
  });

  it('works from its source alone, as page.evaluate sends it', async () => {
    const isolated = new Function(`return ${settleAnimations}`)();
    const fade = animation();
    const settling = isolated(10_000, rootWith([fade]));
    fade.end();
    expect(await settling).toEqual({ timedOut: false });
  });
});
