// Bulma shows a focused input or textarea with a border in the focus color and
// a ring drawn as a box-shadow, and turns the outline off. Forced colors drops
// the shadow, and a read-only field has no text caret, so `_input-textarea.scss`
// draws Bulma's focus outline on a focused read-only one there (#2087). These
// resolve its rules beside Bulma's own input and textarea rules, in either
// order, the way a browser would. jsdom puts no element in a focus state, so
// each sheet is read with `:focus-visible` and `:focus` as attributes of the
// same rank, which a focused field carries, or with `is-focused`.
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { InputBase } from '../InputBase';
import { TextAreaBase } from '../TextAreaBase';
import { TreeSelect } from '../TreeSelect';
import { Cascader } from '../Cascader';
import { DateInput } from '../DateInput';
import { TimeInput } from '../TimeInput';
import { DateTimeInput } from '../DateTimeInput';
import { Numberinput } from '../Numberinput';
import { ColorInput } from '../ColorInput';
import { PasswordInput } from '../PasswordInput';
import { Taginput } from '../Taginput';
import { ConfigProvider } from '../../helpers/Config';
import {
  cascade,
  compilePartial,
  compileSource,
} from '../../__tests__/css-cascade';

const DATA = [
  { value: 'docs', label: 'Documents', children: [{ value: 'a', label: 'A' }] },
];

/** `css` as it applies to a field with keyboard focus. */
const focused = (css: string) =>
  css
    .replace(/:focus-visible/g, '[data-focus-visible]')
    .replace(/:focus-within/g, '[data-focus]')
    .replace(/:focus(?![\w-])/g, '[data-focus]');

/** Puts `el` in the state `focused()` reads, and returns it. */
const focus = <T extends Element>(el: T) => {
  el.setAttribute('data-focus-visible', '');
  el.setAttribute('data-focus', '');
  return el;
};

const OUTLINE = {
  'outline-style': 'var(--bulma-focus-style)',
  'outline-width': 'var(--bulma-focus-width)',
  'outline-offset': 'var(--bulma-focus-offset)',
  'outline-color':
    'hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l))',
};

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the input-textarea partial with %s', (_label, prefix) => {
  const partial = compilePartial('form/input-textarea', prefix);
  const bulma = compileSource(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'bulma/sass/form/input-textarea';`
  );

  const fieldOf = (element: ReactElement, selector = 'input, textarea') =>
    render(
      <ConfigProvider classPrefix={prefix}>{element}</ConfigProvider>
    ).container.querySelector(selector) as HTMLElement;

  /** What wins for each of the outline's longhands, against the shorthand. */
  const outlineOf = (el: Element, css: string, forcedColors: boolean) =>
    Object.fromEntries(
      Object.keys(OUTLINE).map(property => [
        property,
        cascade(
          el,
          css,
          // Bulma turns the outline off with the shorthand, so each longhand
          // competes with it.
          ['outline', property],
          (style, p) => style.getPropertyValue(p) || undefined,
          { forcedColors }
        ),
      ])
    );

  const READ_ONLY: [string, () => HTMLElement][] = [
    [
      'a read-only input',
      () => focus(fieldOf(<InputBase readOnly aria-label="Name" />)),
    ],
    [
      'a read-only textarea',
      () => focus(fieldOf(<TextAreaBase readOnly aria-label="Notes" />)),
    ],
    [
      'an input with is-focused',
      () => fieldOf(<InputBase readOnly isFocused aria-label="Name" />),
    ],
    [
      "TreeSelect's field",
      () =>
        focus(
          fieldOf(
            <TreeSelect label="Folder" data={DATA} />,
            `.${prefix}tree-select .${prefix}input`
          )
        ),
    ],
    [
      "Cascader's field",
      () =>
        focus(
          fieldOf(
            <Cascader label="Folder" data={DATA} />,
            `.${prefix}cascader .${prefix}input`
          )
        ),
    ],
    ...(
      [
        ['a DateInput', () => <DateInput label="Day" editable={false} />],
        ['a TimeInput', () => <TimeInput label="Time" editable={false} />],
        [
          'a DateTimeInput',
          () => <DateTimeInput label="When" editable={false} />,
        ],
        ['a Numberinput', () => <Numberinput label="Count" editable={false} />],
      ] as [string, () => ReactElement][]
    ).map(([name, element]): [string, () => HTMLElement] => [
      `${name} that can't be typed in`,
      () => focus(fieldOf(element(), `input.${prefix}input`)),
    ]),
    [
      'a read-only ColorInput',
      () =>
        focus(
          fieldOf(<ColorInput label="Color" readOnly />, `input.${prefix}input`)
        ),
    ],
    [
      'a read-only PasswordInput',
      () =>
        focus(
          fieldOf(
            <PasswordInput label="Password" readOnly />,
            `input.${prefix}input`
          )
        ),
    ],
  ];

  describe.each([
    ['Bulma first', () => focused(bulma + partial)],
    ['the partial first', () => focused(partial + bulma)],
  ])('with %s', (_order, sheet) => {
    it.each(READ_ONLY)(
      "gives %s Bulma's focus outline in forced colors",
      (_field, field) => {
        const el = field();
        expect(el).toHaveAttribute('readonly');
        expect(outlineOf(el, sheet(), true)).toEqual(OUTLINE);
      }
    );

    it('leaves a field that can be typed in to its caret', () => {
      const el = focus(fieldOf(<InputBase aria-label="Name" />));
      expect(outlineOf(el, sheet(), true)['outline-style']).toBe('none');
    });
  });

  it("leaves Taginput's text box to the box around it at its limit, whichever partial loads first", () => {
    const taginput = compilePartial('form/taginput', prefix);
    const box = focus(
      fieldOf(
        <Taginput label="Tags" defaultValue={['a']} maxTags={1} />,
        `.${prefix}taginput input.${prefix}input`
      )
    );
    expect(box).toHaveAttribute('readonly');
    for (const css of [
      bulma + taginput + partial,
      bulma + partial + taginput,
    ]) {
      expect(outlineOf(box, focused(css), true)['outline-style']).toBe('none');
    }
  });

  it('leaves a read-only field as Bulma draws it outside forced colors, and at rest', () => {
    const css = focused(bulma + partial);
    const atRest = fieldOf(<InputBase readOnly aria-label="Name" />);
    expect(outlineOf(atRest, css, true)['outline-style']).toBeUndefined();
    const el = focus(fieldOf(<InputBase readOnly aria-label="Name" />));
    expect(outlineOf(el, css, false)['outline-style']).toBe('none');
  });

  it('selects :focus-visible and the is-focused state', () => {
    for (const field of ['input', 'textarea']) {
      expect(partial).toContain(`.${prefix}${field}[readonly]:focus-visible`);
      expect(partial).toContain(
        `.${prefix}${field}[readonly].${prefix}is-focused`
      );
    }
  });
});
