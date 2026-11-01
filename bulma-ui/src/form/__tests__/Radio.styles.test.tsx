// A Radio draws its circle and its dot from _radio.scss, which jsdom never
// loads on its own. jsdom also evaluates no media query and computes no
// pseudo-element styles, so these compile the partial, with no prefix and
// under one, read its rules off the sheet, and resolve which one wins on the
// markup a Radio renders, the way a browser with forced colors on (or off)
// would.
import * as sass from 'sass';
import path from 'path';
import React from 'react';
import { render } from '@testing-library/react';
import { Radio, type RadioProps } from '../Radio';
import { Dropdown } from '../../components/Dropdown';
import { Table } from '../../elements/Table';
import { Tbody } from '../../elements/Tbody';
import { Td } from '../../elements/Td';
import { Th } from '../../elements/Th';
import { Tr } from '../../elements/Tr';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'form/radio';`,
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

/** Specificity as [ids, classes, types], enough for this partial's rules. */
const specificity = (selector: string): number[] => [
  (selector.match(/#[\w-]+/g) ?? []).length,
  (selector.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length,
  (selector.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) ?? []).length,
];

const outranks = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return true; // equal: the later declaration wins
};

/**
 * The value `property` gets on `el`, or on its `::before`, from the rules:
 * the most specific matching rule, the later one on a tie. Forced colors adds
 * the rules in its media block and leaves out every other media block. jsdom
 * serializes a system color lowercase, as browsers do.
 */
function resolveIn(
  rules: Rule[],
  el: Element,
  property: string,
  {
    pseudo,
    forcedColors = false,
  }: { pseudo?: '::before'; forcedColors?: boolean } = {}
): string | undefined {
  let won: { value: string; rank: number[] } | undefined;
  for (const { selector, style, media } of rules) {
    if (media && !(forcedColors && media === '(forced-colors: active)')) {
      continue;
    }
    const target = pseudo
      ? selector.endsWith(pseudo) && selector.slice(0, -pseudo.length)
      : !selector.includes('::') && selector;
    if (!target || !el.matches(target)) continue;
    const value = style.getPropertyValue(property);
    if (!value) continue;
    const rank = specificity(target);
    if (!won || outranks(rank, won.rank)) won = { value, rank };
  }
  return won?.value;
}

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the Radio partial with %s', (_label, prefix) => {
  const RULES = rulesOf(compile(prefix));
  const resolve = (
    el: Element,
    property: string,
    options?: Parameters<typeof resolveIn>[3]
  ) => resolveIn(RULES, el, property, options);

  const renderRadio = (props: RadioProps) =>
    render(
      <ConfigProvider classPrefix={prefix}>
        <Radio name="plan" onChange={() => {}} {...props} />
      </ConfigProvider>
    ).container;

  const checkOf = (props: RadioProps) =>
    renderRadio(props).querySelector(`.${prefix}check`) as HTMLElement;

  it('selects every class by the prefix the Radio renders it with', () => {
    // A class the partial writes bare matches nothing in a prefixed build,
    // which is how the circle once went undrawn there.
    const classes = RULES.flatMap(({ selector }) =>
      Array.from(selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g), m => m[1])
    );
    expect(classes).toEqual(
      expect.arrayContaining([`${prefix}check`, `${prefix}control-label`])
    );
    expect(classes.filter(name => !name.startsWith(prefix))).toEqual([]);
  });

  it('draws the circle, with its dot hidden', () => {
    const check = checkOf({});
    expect(resolve(check, 'width')).toBe('var(--bulma-radio-size)');
    expect(resolve(check, 'height')).toBe('var(--bulma-radio-size)');
    expect(resolve(check, 'border-radius')).toBe('50%');
    expect(resolve(check, 'border')).toBe(
      'var(--bulma-radio-border-width) solid var(--bulma-radio-border-color)'
    );
    expect(resolve(check, 'opacity', { pseudo: '::before' })).toBe('0');
  });

  it('rings the circle and shows the dot when checked', () => {
    const check = checkOf({ checked: true });
    expect(resolve(check, 'border-color')).toBe(
      'var(--bulma-radio-active-color)'
    );
    expect(resolve(check, 'opacity', { pseudo: '::before' })).toBe('1');
    expect(resolve(check, 'background-color', { pseudo: '::before' })).toBe(
      'var(--bulma-radio-active-color)'
    );
  });

  it('sets the label a gap from the circle, on its side in either direction', () => {
    // The row mirrors on a right-to-left page, so a physical margin-left
    // stayed on the text's far side and the text touched the circle.
    const label = renderRadio({ children: 'Monthly' }).querySelector(
      `.${prefix}control-label`
    ) as HTMLElement;
    expect(resolve(label, 'margin-inline-start')).toBe(
      'var(--bulma-radio-label-gap)'
    );
    expect(resolve(label, 'margin-left')).toBeUndefined();
    expect(resolve(label, 'margin-right')).toBeUndefined();
  });

  it('dims the circle and its label when disabled', () => {
    const container = renderRadio({ disabled: true, children: 'Yearly' });
    const check = container.querySelector(`.${prefix}check`) as HTMLElement;
    const label = container.querySelector(
      `.${prefix}control-label`
    ) as HTMLElement;
    expect(resolve(check, 'opacity')).toBe('0.5');
    expect(resolve(label, 'opacity')).toBe('0.5');
  });

  it('draws the circle and the dot in system colors in forced colors', () => {
    const forced = { forcedColors: true };
    expect(resolve(checkOf({}), 'border-color', forced)).toBe('buttontext');
    const checked = checkOf({ checked: true });
    expect(resolve(checked, 'border-color', forced)).toBe('highlight');
    expect(
      resolve(checked, 'background-color', { ...forced, pseudo: '::before' })
    ).toBe('highlight');
    expect(resolve(checkOf({ disabled: true }), 'border-color', forced)).toBe(
      'graytext'
    );
  });

  describe('a Radio on a selected table row', () => {
    // Bulma fills a selected row with `table-row-active-background-color`,
    // primary by default, the color a checked radio draws its ring and its
    // dot in too, so the radio vanished. It takes the row's text color
    // instead.
    const ROW_VARS = {
      '--bulma-radio-border-color': 'var(--bulma-table-row-active-color)',
      '--bulma-radio-active-color': 'var(--bulma-table-row-active-color)',
    };

    /**
     * The first Radio's label in `content`, which sits in a cell of a row,
     * or in a cell, marked selected (or neither).
     */
    const labelIn = (
      selected: 'row' | 'cell' | 'none',
      content: React.ReactNode,
      cell: 'td' | 'th' = 'td'
    ) => {
      const Cell = cell;
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>
          <table className={`${prefix}table`}>
            <tbody>
              <tr className={selected === 'row' ? `${prefix}is-selected` : ''}>
                <Cell
                  className={selected === 'cell' ? `${prefix}is-selected` : ''}
                >
                  {content}
                </Cell>
              </tr>
            </tbody>
          </table>
        </ConfigProvider>
      );
      return container.querySelector(`.${prefix}styled-radio`) as HTMLElement;
    };

    const radio = (props: RadioProps = {}) => (
      <Radio name="pick" aria-label="Pick Ada" onChange={() => {}} {...props} />
    );

    /** Whether a label takes the selected row's colors. */
    const takesRowColors = (label: HTMLElement) =>
      Object.entries(ROW_VARS).every(
        ([name, value]) => resolve(label, name) === value
      );

    it.each([
      ['row', 'row', 'td'],
      ['row, in its row header', 'row', 'th'],
      ['cell', 'cell', 'td'],
    ] as const)(
      'takes the colors of a selected %s',
      (_name, selected, cell) => {
        const label = labelIn(selected, radio({ checked: true }), cell);
        for (const [name, value] of Object.entries(ROW_VARS)) {
          expect(resolve(label, name)).toBe(value);
        }
      }
    );

    it('draws its ring and its dot in the row colors', () => {
      // The ring and the dot both read `radio-active-color`, which is what
      // the row hands the radio.
      const check = labelIn('row', radio({ checked: true })).querySelector(
        `.${prefix}check`
      ) as HTMLElement;
      expect(resolve(check, 'border-color')).toBe(
        'var(--bulma-radio-active-color)'
      );
      expect(resolve(check, 'background-color', { pseudo: '::before' })).toBe(
        'var(--bulma-radio-active-color)'
      );
    });

    it('outranks a color variant there', () => {
      const label = labelIn('row', radio({ checked: true, color: 'danger' }));
      expect(resolve(label, '--bulma-radio-active-color')).toBe(
        ROW_VARS['--bulma-radio-active-color']
      );
    });

    it('keeps its own colors on a row that is not selected', () => {
      const label = labelIn('none', radio({ checked: true }));
      expect(resolve(label, '--bulma-radio-active-color')).toBe(
        'var(--bulma-primary)'
      );
    });

    // Anything that puts a surface of its own between the cell and the radio
    // puts the radio on that surface's background, not the row's fill.
    it('keeps its own colors in a Dropdown menu in the row', () => {
      const label = labelIn(
        'row',
        <Dropdown label="Actions" active>
          <Dropdown.Item as="div">{radio({ checked: true })}</Dropdown.Item>
        </Dropdown>
      );
      expect(label.closest(`.${prefix}dropdown-content`)).not.toBeNull();
      expect(takesRowColors(label)).toBe(false);
      expect(resolve(label, '--bulma-radio-active-color')).toBe(
        'var(--bulma-primary)'
      );
    });

    // A cell with a color of its own paints its own background over the
    // row's fill, so a radio there keeps its usual look on that color.
    it.each(['white', 'dark', 'primary'] as const)(
      'keeps its own colors in a %s cell of the row',
      color => {
        const { container } = render(
          <ConfigProvider classPrefix={prefix}>
            <Table>
              <Tbody>
                <Tr isSelected>
                  <Th scope="row" color={color}>
                    {radio({ checked: true })}
                  </Th>
                  <Td color={color}>{radio({ checked: true })}</Td>
                  <Td>{radio({ checked: true })}</Td>
                </Tr>
              </Tbody>
            </Table>
          </ConfigProvider>
        );
        const [header, cell, plain] = Array.from(
          container.querySelectorAll<HTMLElement>(`.${prefix}styled-radio`)
        );
        expect(header.parentElement).toHaveClass(`${prefix}is-${color}`);
        for (const label of [header, cell]) {
          expect(takesRowColors(label)).toBe(false);
          expect(resolve(label, '--bulma-radio-active-color')).toBe(
            'var(--bulma-primary)'
          );
        }
        expect(takesRowColors(plain)).toBe(true);
      }
    );

    // A row with a color of its own hands that color to every cell, which
    // paints it over the selected fill, so the radios keep their usual look.
    it.each(['white', 'light', 'primary'] as const)(
      'keeps its own colors in a selected %s row',
      color => {
        const { container } = render(
          <ConfigProvider classPrefix={prefix}>
            <Table>
              <Tbody>
                <Tr color={color} isSelected>
                  <Th scope="row">{radio({ checked: true })}</Th>
                  <Td>{radio({ checked: true })}</Td>
                </Tr>
              </Tbody>
            </Table>
          </ConfigProvider>
        );
        const row = container.querySelector('tr') as HTMLElement;
        expect(row).toHaveClass(`${prefix}is-${color}`, `${prefix}is-selected`);
        for (const label of Array.from(
          container.querySelectorAll<HTMLElement>(`.${prefix}styled-radio`)
        )) {
          expect(takesRowColors(label)).toBe(false);
          expect(resolve(label, '--bulma-radio-active-color')).toBe(
            'var(--bulma-primary)'
          );
        }
      }
    );

    it('takes the row colors in a colored cell that is selected itself', () => {
      // Bulma paints a selected cell in the row's fill whatever its color.
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>
          <Table>
            <Tbody>
              <Tr>
                <Td color="white" className={`${prefix}is-selected`}>
                  {radio({ checked: true })}
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </ConfigProvider>
      );
      const label = container.querySelector(
        `.${prefix}styled-radio`
      ) as HTMLElement;
      expect(takesRowColors(label)).toBe(true);
    });

    it('keeps its own colors in a table nested in the row', () => {
      const nested = (rowSelected: boolean) => (
        <table className={`${prefix}table`}>
          <tbody>
            <tr className={rowSelected ? `${prefix}is-selected` : ''}>
              <td>{radio({ checked: true })}</td>
            </tr>
          </tbody>
        </table>
      );
      expect(takesRowColors(labelIn('row', nested(false)))).toBe(false);
      // A selected row of the nested table is a fill of its own again.
      expect(takesRowColors(labelIn('none', nested(true)))).toBe(true);
    });

    it('keeps its system colors in forced colors', () => {
      const forced = { forcedColors: true };
      const checkOn = (props: RadioProps) =>
        labelIn('row', radio(props)).querySelector(
          `.${prefix}check`
        ) as HTMLElement;
      const checked = checkOn({ checked: true });
      expect(resolve(checked, 'border-color', forced)).toBe('highlight');
      expect(
        resolve(checked, 'background-color', { ...forced, pseudo: '::before' })
      ).toBe('highlight');
      expect(resolve(checkOn({}), 'border-color', forced)).toBe('buttontext');
    });
  });
});
