// Bulma draws a delete button's circle and cross as background colors, which
// forced colors replaces, so `_delete.scss` gives every close button bestax
// renders its own colors there, in the system's button colors (#1366). jsdom
// evaluates no media query, and which color wins is a cascade across Bulma's
// sheet and the partial, in either order, so these compile the real partial,
// link it with Bulma's own CSS on either side, and resolve each property
// themselves the way a browser on a forced-colors page would: the rules at
// the top level and in a `forced-colors: active` block, ranked by importance,
// then specificity, then source order. A rule this can't rank, or one in a
// block it doesn't walk that sets a property it resolves, fails the test
// rather than dropping out.
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Delete } from '../Delete';
import { Tag } from '../Tag';
import { Notification } from '../Notification';
import { Message } from '../../components/Message';
import { Toast } from '../../components/Toast';
import { Modal } from '../../components/Modal';
import { Taginput } from '../../form/Taginput';
import { Combobox } from '../../form/Combobox';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json. The partial
// compiles against its Sass and is checked against its CSS, so an upgrade
// moves the two together.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix = '') =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'elements/delete';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

const bulmaCss = (file = 'bulma.css') =>
  fs.readFileSync(path.join(BULMA, 'css', file), 'utf8');

const FORCED = '@media (forced-colors: active)';

interface Rule {
  /** The at-rules around it, outermost first, as written. */
  context: string[];
  selector: string;
  declarations: Record<string, string>;
}

/**
 * Every style rule in a sheet of Sass's expanded output, which Bulma's CSS
 * is too. Neither puts a brace or a semicolon inside a string.
 */
function rulesOf(css: string): Rule[] {
  const rules: Rule[] = [];
  // What each open brace opened: an at-rule's head, or a style rule.
  const open: (string | Rule)[] = [];
  let buffer = '';
  for (const char of css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@charset "UTF-8";/g, '')) {
    if (char === '{') {
      const head = buffer.replace(/\s+/g, ' ').trim();
      buffer = '';
      if (head.startsWith('@')) {
        open.push(head);
      } else {
        const rule: Rule = {
          context: open.filter((o): o is string => typeof o === 'string'),
          selector: head,
          declarations: {},
        };
        rules.push(rule);
        open.push(rule);
      }
    } else if (char === '}') {
      const closed = open.pop();
      if (closed && typeof closed !== 'string') {
        for (const declaration of buffer.split(';')) {
          const at = declaration.indexOf(':');
          if (at < 0) continue;
          closed.declarations[declaration.slice(0, at).trim()] = declaration
            .slice(at + 1)
            .replace(/\s+/g, ' ')
            .trim();
        }
      }
      buffer = '';
    } else {
      buffer += char;
    }
  }
  return rules;
}

/**
 * Specificity as [ids, classes, types]. A pseudo-element counts as a type,
 * and `:not()` as its argument, which is all the rules here need; any other
 * functional pseudo-class, or an argument that is a list, is refused.
 */
function specificity(selector: string): number[] {
  for (const [, name, arg] of selector.matchAll(/:([\w-]+)\(([^)]*)\)/g)) {
    if (name !== 'not' || arg.includes(',')) {
      throw new Error(
        `${selector} sets a property this test resolves with ` +
          `:${name}(${arg}), which it does not rank. Extend \`specificity\` ` +
          'before trusting a result.'
      );
    }
  }
  const pseudoElements = (selector.match(/::[\w-]+/g) ?? []).length;
  const flat = selector
    .replace(/::[\w-]+/g, '')
    .replace(/:not\(([^)]*)\)/g, ' $1 ');
  return [
    (flat.match(/#[\w-]+/g) ?? []).length,
    (flat.match(/\.[\w-]+|\[[^\]]*\]|:[\w-]+/g) ?? []).length,
    (flat.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) ?? []).length + pseudoElements,
  ];
}

const outranks = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
};

/**
 * Whether one selector of a list matches `el`, or its `pseudo` element.
 * The pseudo-classes in `states` count as matching, since jsdom can't put an
 * element in them.
 */
function matches(
  el: Element,
  part: string,
  pseudo: string | undefined,
  states: string[]
) {
  const found = part.match(/::([\w-]+)$/);
  if ((found?.[1] ?? undefined) !== pseudo) return false;
  let base = found ? part.slice(0, found.index) : part;
  for (const state of states) base = base.split(state).join('');
  try {
    return el.matches(base || '*');
  } catch {
    return false;
  }
}

/** Each property, and the shorthands that set it too. */
const SETTERS: Record<string, string[]> = {
  'background-color': ['background-color', 'background'],
  border: ['border'],
  'border-color': ['border-color', 'border'],
  'forced-color-adjust': ['forced-color-adjust'],
  'outline-color': ['outline-color', 'outline'],
};

/**
 * The value of `property` on `el`, or its `pseudo` element, as the rules of
 * `css` resolve it on a forced-colors page, or undefined if none sets it. A
 * `border-color` set by the `border` shorthand is the shorthand's last word,
 * which is its color in every rule here.
 */
function resolve(
  css: string,
  el: Element,
  property: string,
  { pseudo, states = [] }: { pseudo?: string; states?: string[] } = {}
): string | undefined {
  const setters = SETTERS[property];
  let won: { value: string; rank: number[] } | undefined;
  rulesOf(css).forEach((rule, order) => {
    const declared = Object.keys(rule.declarations).filter(name =>
      setters.includes(name)
    );
    if (declared.length === 0) return;
    const selectors = rule.selector
      .split(/,(?![^(]*\))/)
      .map(part => part.trim())
      .filter(part => matches(el, part, pseudo, states));
    if (selectors.length === 0) return;
    const applies =
      rule.context.length === 0 ||
      (rule.context.length === 1 && rule.context[0] === FORCED);
    if (!applies) {
      // `@media`, `@supports`, `@layer` and the like change when or in what
      // order their rules apply, which this file doesn't model, so a value
      // set in one fails rather than being read as if it never applied.
      if (rule.context.some(at => at.startsWith('@keyframes'))) return;
      throw new Error(
        `${rule.context.join(' ')} sets ${property} on ${rule.selector}, in a ` +
          'block this test does not walk. Extend `resolve` before trusting ' +
          'a result.'
      );
    }
    const specific = selectors
      .map(specificity)
      .reduce((best, next) => (outranks(next, best) ? next : best));
    declared.forEach(name => {
      const raw = rule.declarations[name];
      const important = /!important$/.test(raw) ? 1 : 0;
      const whole = raw.replace(/\s*!important$/, '');
      const value =
        property === 'border-color' && name === 'border'
          ? (whole.split(' ').pop() as string)
          : whole;
      const rank = [important, ...specific, order];
      if (!won || !outranks(won.rank, rank)) won = { value, rank };
    });
  });
  return won?.value;
}

/** What a close button looks like on a forced-colors page, from `css`. */
function look(css: string, el: Element) {
  return {
    adjust: resolve(css, el, 'forced-color-adjust'),
    background: resolve(css, el, 'background-color'),
    border: resolve(css, el, 'border'),
    edge: resolve(css, el, 'border-color'),
    cross: [
      resolve(css, el, 'background-color', { pseudo: 'before' }),
      resolve(css, el, 'background-color', { pseudo: 'after' }),
    ],
    focus: resolve(css, el, 'outline-color', { states: [':focus-visible'] }),
  };
}

/** A circle in ButtonFace, edged and crossed in ButtonText. */
const CIRCLE = {
  adjust: 'none',
  background: 'ButtonFace',
  border: '1px solid ButtonText',
  edge: 'ButtonText',
  cross: ['ButtonText', 'ButtonText'],
  focus: 'Highlight',
};

/** A disabled one: the same circle, edged and crossed in GrayText. */
const CIRCLE_DISABLED = {
  ...CIRCLE,
  edge: 'GrayText',
  cross: ['GrayText', 'GrayText'],
};

/** The floating close keeps Bulma's no circle, and is crossed in ButtonText. */
const CROSS = {
  adjust: 'none',
  background: 'none',
  border: 'none',
  edge: 'none',
  cross: ['ButtonText', 'ButtonText'],
  focus: 'Highlight',
};

/** A disabled floating close: still no circle, crossed in GrayText. */
const CROSS_DISABLED = { ...CROSS, cross: ['GrayText', 'GrayText'] };

/**
 * Every close button bestax renders: each case renders one, and names the
 * class its button has, so a case whose button moves to another class fails
 * rather than resolving a different element.
 */
const CLOSES: [string, string, () => ReactElement, typeof CIRCLE][] = [
  ['Delete', 'delete', () => <Delete />, CIRCLE],
  ['a small Delete', 'delete', () => <Delete size="small" />, CIRCLE],
  ['Tag isDelete', 'is-delete', () => <Tag isDelete />, CIRCLE],
  [
    'Notification hasDelete',
    'delete',
    () => <Notification hasDelete>Saved</Notification>,
    CIRCLE,
  ],
  [
    'a Message with onClose',
    'delete',
    () => (
      <Message title="Saved" onClose={() => {}}>
        Body
      </Message>
    ),
    CIRCLE,
  ],
  [
    'a closable Toast',
    'delete',
    () => <Toast inline indefinite closable message="Saved" />,
    CIRCLE,
  ],
  [
    'a Taginput tag',
    'delete',
    () => <Taginput label="Tags" defaultValue={['alpha']} />,
    CIRCLE,
  ],
  [
    'a Combobox tag',
    'delete',
    () => (
      <Combobox
        label="Produce"
        multiple
        defaultValue={['Apple']}
        data={[{ value: 'Apple' }, { value: 'Pear' }]}
      />
    ),
    CIRCLE,
  ],
  [
    'a Modal card',
    'delete',
    () => (
      <Modal active type="card" modalCardTitle="Title" onClose={() => {}}>
        Body
      </Modal>
    ),
    CIRCLE,
  ],
  [
    'a Modal’s floating close',
    'modal-close',
    () => (
      <Modal active onClose={() => {}}>
        Body
      </Modal>
    ),
    CROSS,
  ],
];

/**
 * Disabled ones, which forced colors draws in GrayText, as Windows' contrast
 * themes draw every disabled control.
 */
const DISABLED: [string, string, () => ReactElement, typeof CIRCLE][] = [
  ['a disabled Delete', 'delete', () => <Delete disabled />, CIRCLE_DISABLED],
  [
    // Tag takes no `disabled` of its own, so a fieldset is how one gets it.
    'a Tag isDelete in a disabled fieldset',
    'is-delete',
    () => (
      <fieldset disabled>
        <Tag isDelete />
      </fieldset>
    ),
    CIRCLE_DISABLED,
  ],
  [
    'a disabled floating Modal.Close',
    'modal-close',
    () => <Modal.Close variant="floating" disabled />,
    CROSS_DISABLED,
  ],
  [
    'a Delete in a disabled fieldset',
    'delete',
    () => (
      <fieldset disabled>
        <Delete />
      </fieldset>
    ),
    CIRCLE_DISABLED,
  ],
  [
    'a Taginput tag in a disabled fieldset',
    'delete',
    () => (
      <fieldset disabled>
        <Taginput label="Tags" defaultValue={['alpha']} />
      </fieldset>
    ),
    CIRCLE_DISABLED,
  ],
];

/** The close button `ui` renders, with the class it should have. */
function closeOf(ui: () => ReactElement, className: string, prefix = '') {
  const { baseElement } = render(
    <ConfigProvider classPrefix={prefix}>{ui()}</ConfigProvider>
  );
  const buttons = baseElement.querySelectorAll(`button.${prefix}${className}`);
  expect(buttons).toHaveLength(1);
  return buttons[0];
}

describe('every close button on a forced-colors page', () => {
  // Bulma's CSS can land on either side of the extras: `bestax-no-dark-mode`
  // emits them first, and an app can link `extras.css` before its own Bulma.
  describe.each([
    ['the partial after Bulma', '', () => bulmaCss() + compile()],
    ['the partial before Bulma', '', () => compile() + bulmaCss()],
    [
      'a prefixed build, the partial after Bulma',
      'bulma-',
      () => bulmaCss('versions/bulma-prefixed.css') + compile('bulma-'),
    ],
    [
      'a prefixed build, the partial before Bulma',
      'bulma-',
      () => compile('bulma-') + bulmaCss('versions/bulma-prefixed.css'),
    ],
  ])('with %s', (_order, prefix, css) => {
    it.each(CLOSES)('draws %s', (_name, className, ui, expected) => {
      expect(look(css(), closeOf(ui, className, prefix))).toEqual(expected);
    });

    it.each(DISABLED)(
      'draws %s in GrayText',
      (_name, className, ui, expected) => {
        expect(look(css(), closeOf(ui, className, prefix))).toEqual(expected);
      }
    );

    // Bulma's class for the state, which `Delete` writes with `disabled`,
    // on a button that isn't otherwise disabled.
    it('draws one with only the is-disabled class in GrayText', () => {
      const { container } = render(
        <button
          type="button"
          aria-label="Close"
          className={`${prefix}delete ${prefix}is-disabled`}
        />
      );
      const el = container.querySelector('button') as Element;
      expect(el.matches(':disabled')).toBe(false);
      expect(look(css(), el)).toEqual(CIRCLE_DISABLED);
    });
  });

  it('has none of it with Bulma alone, which is the bug', () => {
    const el = closeOf(() => <Delete />, 'delete');
    expect(look(bulmaCss(), el)).toMatchObject({
      adjust: undefined,
      cross: ['var(--bulma-delete-color)', 'var(--bulma-delete-color)'],
    });
  });
});

describe('the Delete partial', () => {
  it.each([
    ['no prefix', ''],
    ['a class prefix', 'bestax-'],
  ])(
    'changes nothing outside forced colors, with %s, and names only prefixed classes',
    (_label, prefix) => {
      const rules = rulesOf(compile(prefix));
      expect(rules.length).toBeGreaterThan(0);
      for (const rule of rules) {
        expect([rule.selector, rule.context]).toEqual([
          rule.selector,
          [FORCED],
        ]);
        for (const name of rule.selector.match(/\.[a-z][\w-]*/g) ?? []) {
          expect(name.startsWith(`.${prefix}`)).toBe(true);
        }
      }
    }
  );

  it('is in the elements index, so bestax.css and extras.css carry it', () => {
    const index = fs.readFileSync(
      path.join(SCSS, 'elements/_index.scss'),
      'utf8'
    );
    expect(index).toMatch(/^@use 'delete';$/m);
  });
});
