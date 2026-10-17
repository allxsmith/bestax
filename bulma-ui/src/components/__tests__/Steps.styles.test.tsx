// `_steps.scss` draws the lines between the markers and places the labels,
// and jsdom never loads it, so className assertions cannot see either. These
// compile the partial, with no prefix and under one, and read its rules. The
// lines are `::before` and `::after`, which jsdom computes no style for, so
// those are read off the sheet; the rest is read through getComputedStyle.
// jsdom leaves `var()` unresolved, so a value that reads a variable is
// compared as written.
import * as sass from 'sass';
import path from 'path';
import { act, render } from '@testing-library/react';
import { Steps, type StepsProps } from '../Steps';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, resolved through package.json since jest
// maps any `.css` specifier to a stub.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/steps';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

type Found = {
  /** One selector of the rule's list. */
  selector: string;
  /** The media query the rule sits in, or '' for none. */
  media: string;
  style: CSSStyleDeclaration;
};

/** Every style rule in `css`, one entry per selector, with its media query. */
function rulesOf(css: string): Found[] {
  const sheet = document.createElement('style');
  sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  const out: Found[] = [];
  const walk = (list: CSSRuleList, media: string) => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSMediaRule) {
        walk(rule.cssRules, rule.media.mediaText);
      } else if (rule instanceof CSSStyleRule) {
        for (const selector of rule.selectorText.split(/\s*,\s*/)) {
          out.push({ selector, media, style: rule.style });
        }
      }
    }
  };
  try {
    walk((sheet.sheet as CSSStyleSheet).cssRules, '');
  } finally {
    sheet.remove();
  }
  return out;
}

/** Every declaration the rules for `selector` make, merged in order. */
function declarations(found: Found[], selector: string, media = '') {
  const out: Record<string, string> = {};
  for (const { style } of found.filter(
    rule => rule.selector === selector && rule.media === media
  )) {
    for (let i = 0; i < style.length; i++) {
      out[style[i]] = style.getPropertyValue(style[i]).trim();
    }
  }
  return out;
}

let removeSheet = () => {};
afterEach(() => removeSheet());

/** Puts a stylesheet in the document until the test ends. */
function load(css: string) {
  const sheet = document.createElement('style');
  sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  removeSheet = () => sheet.remove();
}

const FORCED = '(forced-colors: active)';

type Pseudo = '' | '::before' | '::after';

/**
 * Every value the rules matching an element (or its `::before` or `::after`)
 * give `property`, with or without forced colors on, and whether each is
 * important. Nothing outside the partial styles a step, so when any of them
 * is important, the important ones are what win.
 */
function candidates(
  found: Found[],
  el: Element,
  pseudo: Pseudo,
  property: string,
  forced: boolean
) {
  return found
    .filter(({ media }) => media === '' || (forced && media === FORCED))
    .filter(({ selector }) => {
      const at = selector.search(/::(before|after)$/);
      if ((at === -1 ? '' : selector.slice(at)) !== pseudo) return false;
      try {
        return el.matches(at === -1 ? selector : selector.slice(0, at));
      } catch {
        // A selector jsdom cannot evaluate (`:focus-visible`) matches no
        // element at rest.
        return false;
      }
    })
    .map(({ style }) => ({
      value: style.getPropertyValue(property).trim(),
      important: style.getPropertyPriority(property) === 'important',
    }))
    .filter(({ value }) => value !== '');
}

/** The important values among the candidates, which win over the rest. */
const winners = (list: ReturnType<typeof candidates>) =>
  list.filter(({ important }) => important).map(({ value }) => value);

/**
 * A selector's specificity as one comparable number: classes, attributes and
 * pseudo-classes in the tens, elements in the ones. `:not()` counts as its
 * argument, the way the spec has it. Enough for this partial, which has no
 * ids.
 */
function specificity(selector: string) {
  const s = selector.replace(/:not\(([^)]*)\)/g, ' $1');
  const classes = (s.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) ?? []).length;
  const elements = (s.match(/(^|[\s>+~])[a-z][\w-]*/gi) ?? []).length;
  return classes * 10 + elements;
}

/** Rules outside any media query that match the element itself. */
const matching = (found: Found[], el: Element) =>
  found.filter(
    ({ selector, media }) =>
      media === '' && !selector.includes('::') && el.matches(selector)
  );

/**
 * The declaration that wins one side's padding on the element, by
 * specificity and then source order, which jsdom's computed style doesn't
 * weigh. Within a rule, the last declaration that sets the side counts.
 */
function padding(found: Found[], el: Element, side: 'top' | 'bottom') {
  let best: { rank: number[]; value: string } | null = null;
  for (const rule of matching(found, el)) {
    const names = Array.from(rule.style).filter(
      name => name === 'padding' || name === `padding-${side}`
    );
    if (!names.length) continue;
    const rank = [specificity(rule.selector), found.indexOf(rule)];
    if (
      !best ||
      rank[0] > best.rank[0] ||
      (rank[0] === best.rank[0] && rank[1] > best.rank[1])
    ) {
      best = {
        rank,
        value: rule.style.getPropertyValue(names[names.length - 1]).trim(),
      };
    }
  }
  return best?.value;
}

const COLORS = [
  undefined,
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;

const ITEMS = [
  { label: 'Ordered' },
  { label: 'Packed' },
  { label: 'Shipped' },
  { label: 'Delivered' },
];

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the Steps partial with %s', (_label, prefix) => {
  const p = (name: string) => `.${prefix}${name}`;

  const renderSteps = (props: Partial<StepsProps> = {}) =>
    render(
      <ConfigProvider classPrefix={prefix}>
        <Steps value={2} color="primary" items={ITEMS} {...props} />
      </ConfigProvider>
    );

  describe('in a right-to-left page', () => {
    // Physical sides stay put when the direction flips, so any of these puts
    // a line or a label on the wrong side of its marker there.
    const PHYSICAL =
      /^(left|right|(margin|padding|border)-(left|right)(-[a-z]+)?)$/;

    it('places nothing by a physical side', () => {
      const physical = rulesOf(compile(prefix)).flatMap(({ selector, style }) =>
        Array.from({ length: style.length }, (_, i) => style[i])
          .filter(
            name =>
              PHYSICAL.test(name) ||
              (name === 'text-align' &&
                /^(left|right)$/.test(style.getPropertyValue(name).trim()))
          )
          .map(name => `${selector} { ${name} }`)
      );
      expect(physical).toEqual([]);
    });

    it('runs each horizontal line from its marker toward the next step', () => {
      const found = rulesOf(compile(prefix));
      const line = declarations(
        found,
        `${p('steps')} ${p('steps-list')}:not(${p('is-vertical')}) ${p('steps-segment')}:not(:last-child)::before`
      );
      expect(line['inset-inline-start']).toBe(
        'calc(50% + var(--bulma-steps-marker-size) / 2)'
      );
      expect(line['inset-inline-end']).toBe(
        'calc(-50% + var(--bulma-steps-marker-size) / 2)'
      );
      // Each size moves the line to its own marker's edge.
      for (const size of ['small', 'medium', 'large']) {
        const sized = declarations(
          found,
          `${p('steps')}${p(`is-${size}`)} ${p('steps-list')}:not(${p('is-vertical')}) ${p('steps-segment')}:not(:last-child)::before`
        );
        expect(sized['inset-inline-start']).toBe(
          `calc(50% + var(--bulma-steps-marker-size-${size}) / 2)`
        );
        expect(sized['inset-inline-end']).toBe(
          `calc(-50% + var(--bulma-steps-marker-size-${size}) / 2)`
        );
      }
    });

    it('runs each vertical line under its marker, on the marker’s side', () => {
      const found = rulesOf(compile(prefix));
      const list = `${p('steps-list')}${p('is-vertical')}`;
      expect(
        declarations(
          found,
          `${p('steps')} ${list} ${p('steps-segment')}:not(:last-child)::after`
        )['inset-inline-start']
      ).toBe(
        'calc(var(--bulma-steps-marker-size) / 2 - var(--bulma-steps-divider-height) / 2)'
      );
      // labelPosition="left" puts the marker, and so the line, at the end.
      const atEnd = declarations(
        found,
        `${p('steps')}${p('has-label-left')}${p('is-vertical')} ${list} ${p('steps-segment')}:not(:last-child)::after`
      );
      expect(atEnd['inset-inline-start']).toBe('auto');
      expect(atEnd['inset-inline-end']).toBe(
        'calc(var(--bulma-steps-marker-size) / 2 - var(--bulma-steps-divider-height) / 2)'
      );
    });

    it('keeps a vertical label’s gap on the side of its marker', () => {
      load(compile(prefix));
      const { container } = renderSteps({
        vertical: true,
        labelPosition: 'right',
      });
      const content = getComputedStyle(
        container.querySelector(p('steps-content'))!
      );
      expect(content.marginInlineStart).toBe(
        'var(--bulma-steps-vertical-content-margin-left)'
      );
      expect(content.textAlign).toBe('start');
      expect(
        getComputedStyle(container.querySelector(p('steps-segment'))!).textAlign
      ).toBe('start');
    });

    it('keeps a vertical label at the start, with its gap, for labelPosition="left"', () => {
      load(compile(prefix));
      const { container } = renderSteps({
        vertical: true,
        labelPosition: 'left',
      });
      const content = getComputedStyle(
        container.querySelector(p('steps-content'))!
      );
      expect(content.marginInlineEnd).toBe(
        'var(--bulma-steps-vertical-content-margin-left)'
      );
      expect(content.textAlign).toBe('end');
    });

    it('puts a horizontal label after its marker for "right" and before it for "left"', () => {
      const found = rulesOf(compile(prefix));
      const after = declarations(
        found,
        `${p('steps')}${p('has-label-right')}:not(${p('is-vertical')}) ${p('steps-content')}`
      );
      expect(after['inset-inline-start']).toBe(
        'calc(50% + var(--bulma-steps-marker-size) / 2 + 0.25rem)'
      );
      expect(after['text-align']).toBe('start');
      const before = declarations(
        found,
        `${p('steps')}${p('has-label-left')}:not(${p('is-vertical')}) ${p('steps-content')}`
      );
      expect(before['inset-inline-end']).toBe(
        'calc(50% + var(--bulma-steps-marker-size) / 2 + 0.25rem)'
      );
      expect(before['text-align']).toBe('end');
    });
  });

  describe('a clickable step', () => {
    const clickable = ITEMS.map(item => ({ ...item, clickable: true }));

    it.each([
      ['horizontally', {}, 'top', 'calc(var(--bulma-steps-marker-size) / 2)'],
      [
        'at a size',
        { size: 'small' },
        'top',
        'calc(var(--bulma-steps-marker-size-small) / 2)',
      ],
      [
        'with labels to the side',
        { labelPosition: 'right' },
        'top',
        'calc(var(--bulma-steps-marker-size) / 2)',
      ],
      [
        'vertically',
        { vertical: true },
        'bottom',
        '0 0 var(--bulma-steps-vertical-padding) 0',
      ],
      [
        'vertically, with labels to the left',
        { vertical: true, labelPosition: 'left' },
        'bottom',
        '0 0 var(--bulma-steps-vertical-padding) 0',
      ],
    ] as const)(
      'covers its whole step %s, since the space by the marker is the button’s padding',
      (_name, props, side, value) => {
        const found = rulesOf(compile(prefix));
        const { container } = renderSteps({ items: clickable, ...props });
        for (const li of Array.from(
          container.querySelectorAll(p('steps-segment'))
        )) {
          // Nothing pads the list item, so no band of it sits outside the
          // button, where a click would miss and the cursor would change.
          expect(
            matching(found, li)
              .filter(({ style }) =>
                Array.from(style).some(name => name.startsWith('padding'))
              )
              .map(({ selector }) => selector)
          ).toEqual([]);
          // And the button's padding beats the reset that clears it.
          expect(padding(found, li.querySelector('button')!, side)).toBe(value);
        }
      }
    );

    it('fills its step with a button that drops the browser’s button look', () => {
      // Read off the sheet: jsdom's computed style leaves out `border`.
      expect(
        declarations(rulesOf(compile(prefix)), `button${p('steps-link')}`)
      ).toEqual({
        appearance: 'none',
        background: 'none',
        border: 'none',
        padding: '0',
        margin: '0',
        font: 'inherit',
        color: 'inherit',
        cursor: 'pointer',
        width: '100%',
      });
      load(compile(prefix));
      const { container } = renderSteps({ items: clickable });
      // Laid out by the same rules as a plain step's <div>.
      const button = getComputedStyle(container.querySelector('button')!);
      expect(button.display).toBe('flex');
      expect(button.flexDirection).toBe('column');
    });

    it('draws the focus ring around the focused button, not its marker', () => {
      load(compile(prefix));
      const { container } = renderSteps({ items: clickable });
      const button = container.querySelectorAll('button')[1];
      act(() => button.focus());
      // jsdom keeps the shorthand whole, since its color reads variables.
      const ring = getComputedStyle(button);
      expect(ring.outline).toMatch(/^2px solid hsl\(var\(--bulma-link-h/);
      expect(ring.outlineOffset).toBe('2px');
      expect(
        getComputedStyle(button.querySelector(p('steps-marker'))!).outline
      ).toBe('');
      // Only the focused one.
      expect(
        getComputedStyle(container.querySelectorAll('button')[0]).outline
      ).toBe('');
    });

    it('lays its title out as a block, the way a plain step’s paragraph is', () => {
      load(compile(prefix));
      const { container } = renderSteps({ items: clickable });
      const title = container.querySelector(p('steps-title'))!;
      expect(title.tagName).toBe('SPAN');
      expect(getComputedStyle(title).display).toBe('block');
    });
  });

  // Forced colors paints every background the page's own color and every
  // border one color, so a line or a fill drawn as a background vanishes and
  // the markers all look alike. A system color is left as it is.
  describe('in forced colors', () => {
    const layouts = COLORS.flatMap(color =>
      [false, true].map(vertical => ({ color, vertical }))
    );

    /** Value 2 of four: two completed, the current one, one upcoming. */
    const stepsOf = (color: StepsProps['color'], vertical: boolean) => {
      const { container, unmount } = renderSteps({ color, vertical });
      const segments = Array.from(
        container.querySelectorAll(p('steps-segment'))
      );
      const marker = (li: Element) => li.querySelector(p('steps-marker'))!;
      return {
        unmount,
        lines: segments.slice(0, -1),
        line: (vertical ? '::after' : '::before') as Pseudo,
        completed: segments.slice(0, 2).map(marker),
        current: marker(segments[2]),
        upcoming: marker(segments[3]),
      };
    };

    it('draws every line in CanvasText, whatever the color', () => {
      const found = rulesOf(compile(prefix));
      for (const { color, vertical } of layouts) {
        const { lines, line, unmount } = stepsOf(color, vertical);
        for (const li of lines) {
          const normal = candidates(found, li, line, 'background-color', false);
          // It is a line to begin with, and keeps its color normally.
          expect(normal.length).toBeGreaterThan(0);
          expect(normal.map(({ value }) => value)).not.toContain('CanvasText');
          expect(winners(normal)).toEqual([]);
          const forced = candidates(found, li, line, 'background-color', true);
          expect(winners(forced).length).toBeGreaterThan(0);
          expect(new Set(winners(forced))).toEqual(new Set(['CanvasText']));
        }
        unmount();
      }
    });

    it('fills a completed marker in CanvasText, with its mark in Canvas', () => {
      const found = rulesOf(compile(prefix));
      for (const { color, vertical } of layouts) {
        const { completed, current, upcoming, unmount } = stepsOf(
          color,
          vertical
        );
        for (const marker of completed) {
          // Without the browser's text backplate, which would hide the mark.
          expect(
            candidates(found, marker, '', 'forced-color-adjust', true).map(
              ({ value }) => value
            )
          ).toEqual(['none']);
          for (const [property, system] of [
            ['background-color', 'CanvasText'],
            ['border-color', 'CanvasText'],
            ['color', 'Canvas'],
          ]) {
            const normal = candidates(found, marker, '', property, false);
            expect(winners(normal)).toEqual([]);
            const forced = candidates(found, marker, '', property, true);
            expect(winners(forced).length).toBeGreaterThan(0);
            expect(new Set(winners(forced))).toEqual(new Set([system]));
          }
        }
        // The others stay rings, filled with the page's color.
        for (const marker of [current, upcoming]) {
          expect(
            candidates(found, marker, '', 'background-color', true).map(
              ({ value }) => value
            )
          ).not.toContain('CanvasText');
        }
        unmount();
      }
    });

    it('rings the current marker, and only it, with an outline', () => {
      const found = rulesOf(compile(prefix));
      for (const { color, vertical } of layouts) {
        const { completed, current, upcoming, unmount } = stepsOf(
          color,
          vertical
        );
        const outlines = (marker: Element, forced: boolean) =>
          candidates(found, marker, '', 'outline', forced).map(
            ({ value }) => value
          );
        expect(outlines(current, false)).toEqual([]);
        expect(outlines(current, true)).toEqual([
          'var(--bulma-steps-divider-height) solid CanvasText',
        ]);
        for (const marker of [...completed, upcoming]) {
          expect(outlines(marker, true)).toEqual([]);
        }
        unmount();
      }
    });
  });
});
