// `_datatable.scss` draws the toolbar, the sort button and its indicator,
// which jsdom never loads and whose pseudo-element and forced-colors rules it
// never computes. These compile the partial, with no prefix and under one,
// read its rules off the sheet, and resolve which one wins on the markup a
// DataTable renders, the way a browser with forced colors on (or off) would.
import * as sass from 'sass';
import path from 'path';
import { fireEvent, render, screen } from '@testing-library/react';
import { DataTable, type DataTableColumn } from '../DataTable';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/datatable';`,
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
 * The value `property` gets on `el`, or on its `::after`, from the rules:
 * the most specific matching rule, the later one on a tie. Forced colors adds
 * the rules in its media block and leaves out every other media block.
 */
function resolveIn(
  rules: Rule[],
  el: Element,
  property: string,
  { after = false, forcedColors = false } = {}
): string | undefined {
  let won: { value: string; rank: number[] } | undefined;
  for (const { selector, style, media } of rules) {
    if (media && !(forcedColors && media === '(forced-colors: active)')) {
      continue;
    }
    const target = after
      ? selector.endsWith('::after') && selector.slice(0, -'::after'.length)
      : !selector.includes('::') && !selector.includes(':hover') && selector;
    if (!target || !el.matches(target)) continue;
    const value = style.getPropertyValue(property);
    if (!value) continue;
    const rank = specificity(target);
    if (!won || outranks(rank, won.rank)) won = { value, rank };
  }
  return won?.value;
}

interface Row {
  id: string;
  name: string;
}

const columns: DataTableColumn<Row>[] = [
  { id: 'name', header: 'Name', sortable: true },
  { id: 'id', header: 'Id' },
];

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the DataTable partial with %s', (_label, prefix) => {
  const RULES = rulesOf(compile(prefix));
  const resolve = (
    el: Element,
    property: string,
    options?: Parameters<typeof resolveIn>[3]
  ) => resolveIn(RULES, el, property, options);

  const renderTable = () =>
    render(
      <ConfigProvider classPrefix={prefix}>
        <DataTable
          caption="Rows"
          columns={columns}
          data={[{ id: '1', name: 'One' }]}
          hasSearch
          toolbar={() => <button type="button">Export</button>}
        />
      </ConfigProvider>
    ).container;

  it('selects every class by the prefix DataTable renders it with', () => {
    const classes = RULES.flatMap(({ selector }) =>
      Array.from(selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g), m => m[1])
    );
    expect(classes).toEqual(
      expect.arrayContaining([
        `${prefix}data-table`,
        `${prefix}data-table-sort`,
        `${prefix}data-table-toolbar`,
        `${prefix}data-table-actions`,
      ])
    );
    expect(classes.filter(name => !name.startsWith(prefix))).toEqual([]);
  });

  it('registers its variables where they are read', () => {
    const container = renderTable();
    const root = container.querySelector(`.${prefix}data-table`)!;
    const button = screen.getByRole('button', { name: 'Name' });
    expect(resolve(root, '--bulma-data-table-gap')).toBe('0.75rem');
    expect(resolve(button, '--bulma-data-table-sort-gap')).toBe('0.375em');
    expect(resolve(button, '--bulma-data-table-sort-indicator-size')).toBe(
      '0.75em'
    );
    expect(resolve(button, '--bulma-data-table-sort-unsorted-opacity')).toBe(
      '0.35'
    );
  });

  it('lays the toolbar out in a row, the actions at the end', () => {
    const container = renderTable();
    const toolbar = container.querySelector(`.${prefix}data-table-toolbar`)!;
    const actions = container.querySelector(`.${prefix}data-table-actions`)!;
    expect(resolve(toolbar, 'display')).toBe('flex');
    expect(resolve(toolbar, 'gap')).toBe('var(--bulma-data-table-gap)');
    expect(resolve(actions, 'margin-inline-start')).toBe('auto');
    expect(resolve(toolbar.firstElementChild!, 'margin-block-end')).toBe('0px');
  });

  it('puts the caption at the start of the line', () => {
    const caption = renderTable().querySelector('caption')!;
    expect(resolve(caption, 'text-align')).toBe('start');
  });

  it('draws the button as the header text, with an indicator after it', () => {
    renderTable();
    const button = screen.getByRole('button', { name: 'Name' });
    expect(resolve(button, 'display')).toBe('inline-flex');
    expect(resolve(button, 'font-weight')).toBe('inherit');
    expect(resolve(button, 'color')).toBe('inherit');
    // jsdom writes a color keyword in lowercase, as browsers do.
    expect(resolve(button, 'background-color', { after: true })).toBe(
      'currentcolor'
    );
    expect(resolve(button, 'width', { after: true })).toBe(
      'var(--bulma-data-table-sort-indicator-size)'
    );
  });

  it('switches the indicator with aria-sort', () => {
    renderTable();
    const button = screen.getByRole('button', { name: 'Name' });
    const mask = () => resolve(button, 'mask-image', { after: true });
    const opacity = () => resolve(button, 'opacity', { after: true });
    const unsorted = mask();
    expect(opacity()).toBe('var(--bulma-data-table-sort-unsorted-opacity)');
    fireEvent.click(button);
    const ascending = mask();
    expect(opacity()).toBe('1');
    expect(resolve(button, '-webkit-mask-image', { after: true })).toBe(
      ascending
    );
    fireEvent.click(button);
    const descending = mask();
    expect(new Set([unsorted, ascending, descending]).size).toBe(3);
    for (const shape of [unsorted, ascending, descending]) {
      expect(shape).toMatch(/^url\("data:image\/svg\+xml,/);
    }
  });

  it('paints the indicator in a system color in forced colors', () => {
    renderTable();
    const button = screen.getByRole('button', { name: 'Name' });
    expect(
      resolve(button, 'background-color', { after: true, forcedColors: true })
    ).toBe('buttontext');
    // At full strength, sorted or not: the shapes tell the states apart.
    expect(
      resolve(button, 'opacity', { after: true, forcedColors: true })
    ).toBe('1');
  });
});
