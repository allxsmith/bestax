// Bulma writes a panel's heading in `text-invert` on the text color unless
// the panel has a color of its own, and its dark scheme lightens the text
// color without darkening `text-invert`, so a plain panel's heading was white
// on light gray there (#1550). `_panel.scss` gives the panel the scheme
// background's lightness as its `text-invert`.
//
// jsdom resolves no `var()`, so these read the custom properties Bulma's
// themes, Bulma's panel module and the partial declare, resolve the colors
// from them the way a browser does (`contrast.ts`), and measure the contrast
// on each scheme. bestax's builds change Bulma's primary and no scheme token,
// so Bulma's themes are the ones every flavor ships, apart from the primary's
// own lightnesses, which the active block's checks also read with bestax's.
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { render } from '@testing-library/react';
import { Panel, type PanelProps } from '../Panel';
import { ConfigProvider } from '../../helpers/Config';
import { bulmaCss, cascade, rulesOf } from '../../__tests__/css-cascade';
import {
  contrast,
  schemesOf,
  substitute,
  varsOn,
  type Vars,
} from '../../__tests__/contrast';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (source: string) =>
  sass.compileString(source, {
    loadPaths: [SCSS, path.dirname(BULMA)],
    quietDeps: true,
    logger: sass.Logger.silent,
  }).css;

/** The partial compiled with `prefix`, once each. */
const partials = new Map<string, string>();
const partial = (prefix = '') => {
  if (!partials.has(prefix)) {
    partials.set(
      prefix,
      compile(
        `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
         @use 'components/panel';`
      )
    );
  }
  return partials.get(prefix)!;
};

/** The top-level style rules of `css`. */
const topRules = (css: string) => rulesOf(css).rules;

/** Whether one of a rule's selectors is `selector`. */
const hasSelector = (rule: CSSStyleRule, selector: string) =>
  rule.selectorText.split(/,(?![^(]*\))/).some(s => s.trim() === selector);

const SCHEMES: Record<string, Vars> = schemesOf(
  topRules(compile(`@use 'bulma/sass/themes';`))
);

const PANEL = compile(`@use 'bulma/sass/components/panel';`);
const PANEL_RULES = topRules(PANEL);
const PARTIAL = varsOn(topRules(partial()), '.panel');

/** The heading's colors, as Bulma's `.panel-heading` writes them. */
const HEADING = {
  color:
    'hsl(var(--bulma-panel-h), var(--bulma-panel-s), var(--bulma-panel-heading-color-l))',
  background:
    'hsl(var(--bulma-panel-h), var(--bulma-panel-s), var(--bulma-panel-heading-background-l))',
};

/**
 * The heading's contrast on `scheme`, for a panel with no color or with
 * `color`. What the panel declares itself beats what it inherits from the
 * root, and a colored panel's own rule outranks `.panel`.
 */
function headingContrast(
  scheme: string,
  { color, withPartial }: { color?: string; withPartial: boolean }
): number {
  const vars = {
    ...SCHEMES[scheme],
    ...(withPartial ? PARTIAL : {}),
    ...varsOn(PANEL_RULES, '.panel'),
    ...(color ? varsOn(PANEL_RULES, `.panel.is-${color}`) : {}),
  };
  return contrast(
    substitute(HEADING.color, vars),
    substitute(HEADING.background, vars)
  );
}

// Panel's `color` union.
const COLORS = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
  'black',
  'dark',
  'light',
  'white',
];

describe('Panel heading contrast', () => {
  it("is Bulma's own heading formula", () => {
    expect(PANEL_RULES.some(rule => hasSelector(rule, '.panel-heading'))).toBe(
      true
    );
    const flat = PANEL.replace(/\s+/g, ' ');
    expect(flat).toContain(`background-color: ${HEADING.background};`);
    expect(flat).toContain(`color: ${HEADING.color};`);
  });

  it("measures Bulma's plain heading under 4.5:1 on the dark scheme, so the check can fail", () => {
    expect(headingContrast('dark', { withPartial: false })).toBeLessThan(4.5);
  });

  it.each(Object.keys(SCHEMES))(
    'holds 4.5:1 on a panel with no color on the %s scheme',
    scheme => {
      expect(
        headingContrast(scheme, { withPartial: true })
      ).toBeGreaterThanOrEqual(4.5);
    }
  );

  it.each(COLORS)(
    'leaves a %s panel as Bulma draws it on both schemes',
    color => {
      expect(varsOn(PANEL_RULES, `.panel.is-${color}`)).toHaveProperty(
        '--bulma-panel-heading-color-l'
      );
      for (const scheme of Object.keys(SCHEMES)) {
        expect(headingContrast(scheme, { color, withPartial: true })).toBe(
          headingContrast(scheme, { color, withPartial: false })
        );
      }
    }
  );
});

describe('Panel partial', () => {
  it("points the panel's text-invert at the scheme background", () => {
    expect(PARTIAL).toEqual({
      '--bulma-text-invert-l': 'var(--bulma-scheme-main-l)',
    });
  });

  it('applies whichever order it and Bulma load in', () => {
    // Bulma declares text-invert on the root and the themes, never on the
    // panel, so the partial's is the only declaration on the panel itself.
    const rules = topRules(
      fs.readFileSync(path.join(BULMA, 'css', 'bulma.css'), 'utf8')
    );
    const declares = (rule: CSSStyleRule) =>
      rule.style.getPropertyValue('--bulma-text-invert-l') !== '';
    const onPanel = rules.filter(
      rule => /\.panel\b/.test(rule.selectorText) && declares(rule)
    );
    expect(onPanel).toEqual([]);
    expect(rules.some(declares)).toBe(true);
  });

  it('keys on the prefixed class in the prefixed build', () => {
    expect(varsOn(topRules(partial('bestax-')), '.bestax-panel')).toEqual(
      PARTIAL
    );
  });

  it.each([
    ['', 'panel'],
    ['bestax-', 'bestax-panel'],
  ])(
    'matches the class Panel renders with prefix "%s"',
    (prefix, className) => {
      const { container } = render(
        <ConfigProvider classPrefix={prefix || undefined}>
          <Panel>
            <Panel.Heading>Heading</Panel.Heading>
          </Panel>
        </ConfigProvider>
      );
      expect(container.firstElementChild).toHaveClass(className);
    }
  );
});

// Bulma reads a panel's active block and active tab colors from
// `--bulma-link-active`, which it never defines, so their text inherits the
// panel's color, and Panel's `color` puts the color's text helper on the
// panel. A light panel's active block was near white on white (#1639).
// `_panel.scss` gives the block and tab of a panel with both classes a
// fallback for Bulma's two variables: the color's on-scheme lightness. Panel
// adds no background to a block, so the text sits on the page's, or on
// Bulma's hover background when the pointer is over the block.
describe('Panel active block contrast', () => {
  // Black's on-scheme lightness is black on the dark scheme too, so the
  // partial leaves a black panel as it was.
  const READABLE = COLORS.filter(color => color !== 'black');

  /** What Bulma, and the partial for a colored Panel, give the block and tab. */
  const BULMA_ACTIVE = {
    block: 'var(--bulma-panel-block-active-color)',
    tab: 'var(--bulma-panel-tab-active-color)',
  };
  const partialFor = (color: string) => {
    const onScheme = `hsl(var(--bulma-${color}-h), var(--bulma-${color}-s), var(--bulma-${color}-on-scheme-l))`;
    return {
      block: `var(--bulma-panel-block-active-color, ${onScheme})`,
      tab: `var(--bulma-panel-tab-active-color, ${onScheme})`,
    };
  };

  /** A value without its spaces, which jsdom doesn't always keep. */
  const flat = (value: { block?: string; tab?: string }) =>
    Object.fromEntries(
      Object.entries(value).map(([key, v]) => [key, v?.replace(/\s+/g, '')])
    );

  /** A Panel's active block and active tab, under `prefix`. */
  const activeOf = (color: string, prefix = '') => {
    const panel = (
      <Panel color={color as PanelProps['color']}>
        <Panel.Tabs>
          <a className={`${prefix}is-active`}>All</a>
        </Panel.Tabs>
        <Panel.Block active>Active</Panel.Block>
      </Panel>
    );
    const { container } = render(
      prefix ? (
        <ConfigProvider classPrefix={prefix}>{panel}</ConfigProvider>
      ) : (
        panel
      )
    );
    const panelEl = container.firstElementChild as HTMLElement;
    expect(panelEl).toHaveClass(
      `${prefix}is-${color}`,
      `${prefix}has-text-${color}`
    );
    return {
      block: panelEl.querySelector(
        `.${prefix}panel-block.${prefix}is-active`
      ) as HTMLElement,
      tab: panelEl.querySelector(
        `.${prefix}panel-tabs a.${prefix}is-active`
      ) as HTMLElement,
    };
  };

  /** The color the rules of `css` give the active block and tab. */
  const colorsOf = (active: { block: Element; tab: Element }, css: string) => {
    const colorOf = (el: Element) =>
      cascade(
        el,
        css,
        ['color'],
        (style, property) =>
          style.getPropertyValue(property).trim() || undefined
      );
    return { block: colorOf(active.block), tab: colorOf(active.tab) };
  };

  // Bulma's CSS can land on either side of the extras, so the sheets are
  // joined in both orders, once each.
  const sheets = new Map<string, string>();
  const sheet = (name: string, build: () => string) => {
    if (!sheets.has(name)) sheets.set(name, build());
    return sheets.get(name)!;
  };
  const orders: [string, () => string][] = [
    ['after', () => sheet('after', () => bulmaCss() + partial())],
    ['before', () => sheet('before', () => partial() + bulmaCss())],
  ];

  it("rests on a variable Bulma's CSS never declares", () => {
    const bulma = fs.readFileSync(path.join(BULMA, 'css', 'bulma.css'), 'utf8');
    const onPanel = varsOn(PANEL_RULES, '.panel');
    expect(onPanel['--bulma-panel-block-active-color']).toBe(
      'var(--bulma-link-active)'
    );
    expect(onPanel['--bulma-panel-tab-active-color']).toBe(
      'var(--bulma-link-active)'
    );
    expect(bulma).not.toMatch(/--bulma-link-active\s*:/);
  });

  describe.each(orders)('with the partial %s Bulma', (_order, css) => {
    it.each(READABLE)(
      "gives a %s Panel's active block and tab the color's fallback",
      color => {
        expect(flat(colorsOf(activeOf(color), css()))).toEqual(
          flat(partialFor(color))
        );
      }
    );

    it('leaves a black Panel as Bulma draws it', () => {
      expect(flat(colorsOf(activeOf('black'), css()))).toEqual(
        flat(BULMA_ACTIVE)
      );
    });

    it("leaves Bulma's own markup, with the modifier alone, as Bulma draws it", () => {
      const nav = document.createElement('nav');
      nav.className = 'panel is-light';
      nav.innerHTML =
        '<p class="panel-tabs"><a class="is-active">All</a></p>' +
        '<a class="panel-block is-active">Active</a>';
      document.body.appendChild(nav);
      try {
        const active = {
          block: nav.querySelector('.panel-block') as Element,
          tab: nav.querySelector('.panel-tabs a') as Element,
        };
        expect(flat(colorsOf(active, css()))).toEqual(flat(BULMA_ACTIVE));
      } finally {
        nav.remove();
      }
    });
  });

  it.each(READABLE)(
    'keys a %s Panel on the prefixed classes in the prefixed build',
    color => {
      const css = sheet(
        'prefixed',
        () => bulmaCss('versions/bulma-prefixed.css') + partial('bulma-')
      );
      expect(flat(colorsOf(activeOf(color, 'bulma-'), css))).toEqual(
        flat(partialFor(color))
      );
    }
  );

  /** The page's background, and Bulma's hover background, on `scheme`. */
  const surfaces = (schemes: Record<string, Vars>, scheme: string) => [
    substitute(
      'hsl(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-main-l))',
      schemes[scheme]
    ),
    substitute(
      'hsl(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-background-l))',
      schemes[scheme]
    ),
  ];

  /** The color the partial and Bulma give a Panel's active block, once each. */
  const blocks = new Map<string, string>();
  const blockColor = (color: string) => {
    if (!blocks.has(color)) {
      const css = sheet('after', () => bulmaCss() + partial());
      const value = colorsOf(activeOf(color), css).block;
      if (!value) throw new Error(`no color for a ${color} active block`);
      blocks.set(color, value);
    }
    return blocks.get(color)!;
  };

  /**
   * The active block's text on `scheme`, as Bulma's themes and panel module
   * resolve the color the sheet gives it, with `root` declared above the
   * panel and `panel` declared on it.
   */
  const activeText = (
    schemes: Record<string, Vars>,
    scheme: string,
    color: string,
    { root = {}, panel = {} }: { root?: Vars; panel?: Vars } = {}
  ) =>
    substitute(blockColor(color), {
      ...schemes[scheme],
      ...root,
      ...varsOn(PANEL_RULES, '.panel'),
      ...varsOn(PANEL_RULES, `.panel.is-${color}`),
      ...panel,
    });

  /** The color's text helper, which the block inherits without the partial. */
  const inherited = (scheme: string, color: string) =>
    substitute(
      `hsl(var(--bulma-${color}-h), var(--bulma-${color}-s), var(--bulma-${color}-l))`,
      SCHEMES[scheme]
    );

  it("measures a light panel's inherited active text under 4.5:1 on the light scheme, so the check can fail", () => {
    expect(
      contrast(inherited('light', 'light'), surfaces(SCHEMES, 'light')[0])
    ).toBeLessThan(4.5);
  });

  it.each(
    READABLE.flatMap(color =>
      Object.keys(SCHEMES).map(scheme => [color, scheme])
    )
  )(
    'holds 4.5:1 for a %s Panel on the %s scheme, at rest and hovered',
    (color, scheme) => {
      const text = activeText(SCHEMES, scheme, color);
      for (const surface of surfaces(SCHEMES, scheme)) {
        expect(contrast(text, surface)).toBeGreaterThanOrEqual(4.5);
      }
    }
  );

  // bestax's builds configure Bulma's primary, whose on-scheme lightness
  // differs from Bulma's own. bestax.scss is read for the color.
  describe("with bestax's primary", () => {
    let schemes: Record<string, Vars>;
    beforeAll(() => {
      const source = fs.readFileSync(path.join(SCSS, 'bestax.scss'), 'utf8');
      const primary = /\$primary:\s*(#[0-9a-f]{3,8})/i.exec(source)?.[1];
      if (!primary) throw new Error('bestax.scss sets no $primary');
      schemes = schemesOf(
        topRules(
          compile(
            `@use 'bulma/sass/utilities/derived-variables' with ($primary: ${primary});
             @use 'bulma/sass/themes';`
          )
        )
      );
    });

    it.each(Object.keys(SCHEMES))(
      'holds 4.5:1 for a primary Panel on the %s scheme',
      scheme => {
        const text = activeText(schemes, scheme, 'primary');
        for (const surface of surfaces(schemes, scheme)) {
          expect(contrast(text, surface)).toBeGreaterThanOrEqual(4.5);
        }
      }
    );
  });

  it('lets a value of your own on the panel, or a --bulma-link-active above it, win', () => {
    const own = 'hsl(0, 100%, 25%)';
    expect(
      activeText(SCHEMES, 'light', 'light', {
        panel: { '--bulma-panel-block-active-color': own },
      })
    ).toBe(own);
    expect(
      activeText(SCHEMES, 'light', 'light', {
        root: { '--bulma-link-active': own },
      })
    ).toBe(own);
  });
});
