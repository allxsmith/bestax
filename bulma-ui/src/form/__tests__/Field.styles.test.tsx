// A horizontal `Field` wraps its children in Bulma's `.field-body`, a flex
// row from tablet up. The form components that render a Field of their own
// hand it their control and their message side by side, so the message sat
// beside the control rather than under it. `_field.scss` gives that message
// a line of its own, which jsdom never loads and can't lay out, so these
// compile the partial, with no prefix and under one, read its rules off the
// sheet, and resolve which ones match the markup each component renders.
import * as sass from 'sass';
import path from 'path';
import React from 'react';
import { render } from '@testing-library/react';
import { Checkbox } from '../Checkbox';
import { Checkboxes } from '../Checkboxes';
import { Control } from '../Control';
import { Field } from '../Field';
import { Input } from '../Input';
import { Numberinput } from '../Numberinput';
import { Radio } from '../Radio';
import { Radios } from '../Radios';
import { Rate } from '../Rate';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'form/field';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

type Rule = { selector: string; style: CSSStyleDeclaration; media: string };

/** Every style rule in the sheet, in source order, with its media query. */
function rulesOf(source: string): Rule[] {
  const sheet = document.createElement('style');
  sheet.textContent = source.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  const out: Rule[] = [];
  const walk = (list: CSSRuleList, media: string) => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSStyleRule) {
        for (const selector of rule.selectorText.split(/,(?![^(]*\))/)) {
          out.push({ selector: selector.trim(), style: rule.style, media });
        }
      } else if (rule instanceof CSSMediaRule) {
        walk(rule.cssRules, rule.media.mediaText);
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

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the Field partial with %s', (_label, prefix) => {
  const RULES = rulesOf(compile(prefix));

  /** The values `property` takes on `el` from every rule that matches it. */
  const declared = (el: Element, property: string) =>
    RULES.filter(({ selector }) => el.matches(selector))
      .map(({ style }) => style.getPropertyValue(property))
      .filter(Boolean);

  const renderIn = (ui: React.ReactElement) =>
    render(<ConfigProvider classPrefix={prefix}>{ui}</ConfigProvider>)
      .container;

  const bodyOf = (container: HTMLElement) =>
    container.querySelector(`.${prefix}field-body`) as HTMLElement;

  // Each one renders a horizontal Field of its own, with the message
  // straight in the body after the control.
  const withMessage: [string, React.ReactElement][] = [
    [
      'Checkboxes',
      <Checkboxes key="c" horizontal label="Chores" message="Pick one">
        <Checkbox value="bed">Make the bed</Checkbox>
      </Checkboxes>,
    ],
    [
      'Checkboxes as a fieldset',
      <Checkboxes
        key="cf"
        as="fieldset"
        horizontal
        label="Chores"
        message="Pick one"
      >
        <Checkbox value="bed">Make the bed</Checkbox>
      </Checkboxes>,
    ],
    [
      'Radios',
      <Radios key="r" horizontal label="Size" message="Pick a size">
        <Radio value="s">Small</Radio>
      </Radios>,
    ],
    [
      'Radios as a fieldset',
      <Radios
        key="rf"
        as="fieldset"
        horizontal
        label="Size"
        message="Pick a size"
      >
        <Radio value="s">Small</Radio>
      </Radios>,
    ],
    ['Rate', <Rate key="t" horizontal label="Rating" message="Rate it" />],
    [
      'Input',
      <Input key="i" horizontal label="Email" message="Not an email" />,
    ],
  ];

  it.each(withMessage)(
    'puts the message of a horizontal %s on a line of its own',
    (_name, ui) => {
      const container = renderIn(ui);
      const body = bodyOf(container);
      const help = body.querySelector(`:scope > .${prefix}help`);
      expect(help).not.toBeNull();
      expect(declared(body, 'flex-wrap')).toEqual(['wrap']);
      expect(declared(help as Element, 'flex-basis')).toEqual(['100%']);
    }
  );

  it.each([
    [
      'Checkboxes',
      <Checkboxes key="c" horizontal label="Chores">
        <Checkbox value="bed">Make the bed</Checkbox>
      </Checkboxes>,
    ],
    ['Rate', <Rate key="t" horizontal label="Rating" />],
    ['Input', <Input key="i" horizontal label="Email" />],
  ])('leaves a horizontal %s with no message as it is', (_name, ui) => {
    const body = bodyOf(renderIn(ui));
    expect(body.querySelector(`.${prefix}help`)).toBeNull();
    for (const el of [body, ...Array.from(body.children)]) {
      expect(declared(el, 'flex-wrap')).toEqual([]);
      expect(declared(el, 'flex-basis')).toEqual([]);
      expect(declared(el, 'margin-inline-end')).toEqual([]);
    }
  });

  it('leaves a message in an inner Field to Bulma', () => {
    // Bulma's own horizontal markup nests the control and its message in an
    // inner `.field`, where the message is under the control already.
    const body = bodyOf(
      renderIn(
        <Field horizontal label="Email">
          <Field>
            <Control>
              <Input />
            </Control>
            <p className={`${prefix}help`}>Not an email</p>
          </Field>
        </Field>
      )
    );
    const help = body.querySelector(`.${prefix}help`) as HTMLElement;
    expect(help.parentElement).not.toBe(body);
    expect(declared(body, 'flex-wrap')).toEqual([]);
    expect(declared(help, 'flex-basis')).toEqual([]);
  });

  describe("beside Bulma's own field rules", () => {
    // Bulma spaces each field in a body from the next with an end margin on
    // every field but the last, from tablet up. The partial comes first
    // here, so its rule has to win on specificity, as it does whatever order
    // an app loads the two in.
    const BOTH = rulesOf(
      sass.compileString(
        `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
         @use 'form/field';
         @use 'bulma/sass/form/tools';`,
        {
          loadPaths: [SCSS, path.dirname(BULMA)],
          quietDeps: true,
          logger: sass.Logger.silent,
        }
      ).css
    );

    /**
     * The value `property` gets on `el` at a desktop width: the most
     * specific matching rule, the later one on a tie. `:not()` and `:has()`
     * count as their argument.
     */
    const resolve = (el: Element, property: string) => {
      const specificity = (selector: string) => {
        const flat = selector.replace(/:(?:not|has)\(([^()]*)\)/g, ' $1');
        return [
          (flat.match(/\.[\w-]+|:(?!:)[\w-]+/g) ?? []).length,
          (flat.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) ?? []).length,
        ];
      };
      let won: { value: string; rank: number[] } | undefined;
      for (const { selector, style, media } of BOTH) {
        if (media && !media.includes('min-width: 769px')) continue;
        if (!el.matches(selector)) continue;
        const value = style.getPropertyValue(property);
        if (!value) continue;
        const rank = specificity(selector);
        const beats =
          !won ||
          rank[0] > won.rank[0] ||
          (rank[0] === won.rank[0] && rank[1] >= won.rank[1]);
        if (beats) won = { value, rank };
      }
      return won?.value;
    };

    it('drops the gap after a field whose message is on the next line', () => {
      // Numberinput's root is a `.field`, which kept a gap at its end for a
      // field beside it and came out narrower with a message than without.
      const body = bodyOf(
        renderIn(<Numberinput horizontal label="Count" message="Too many" />)
      );
      const [field, help] = Array.from(body.children);
      expect(field).toHaveClass(`${prefix}field`);
      expect(help).toHaveClass(`${prefix}help`);
      expect(resolve(field, 'margin-inline-end')).toBe('0px');
    });

    it('keeps the gap between two fields side by side', () => {
      const body = bodyOf(
        renderIn(
          <Field horizontal label="From">
            <Field>
              <Control>
                <Input placeholder="Name" />
              </Control>
            </Field>
            <Field>
              <Control>
                <Input placeholder="Email" />
              </Control>
            </Field>
            <p className={`${prefix}help`}>Both are needed</p>
          </Field>
        )
      );
      const [first, second] = Array.from(body.children);
      expect(resolve(first, 'margin-inline-end')).toBe('0.75rem');
      expect(resolve(second, 'margin-inline-end')).toBe('0px');
    });

    it('leaves a Numberinput with no message to Bulma', () => {
      const body = bodyOf(renderIn(<Numberinput horizontal label="Count" />));
      expect(body.children).toHaveLength(1);
      expect(declared(body.children[0], 'margin-inline-end')).toEqual([]);
    });
  });
});
