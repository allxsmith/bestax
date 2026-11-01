// Bulma aligns a table's header cells with `--bulma-table-cell-text-align`,
// which it sets to `left`, so on a right-to-left page the headers stayed on
// the left while the cells under them went right (#1368). `_table.scss` sets
// the variable to `start`. jsdom leaves `var()` unresolved and weighs rules
// by order alone, so these compile the real partial, link it with Bulma's
// own CSS, and resolve the variable on the table and the alignment of each
// header cell themselves, the way a browser would: by importance, then
// specificity, then source order. A rule this can't rank, or one in a block
// it doesn't walk that sets a property it resolves, fails the test rather
// than dropping out.
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { render } from '@testing-library/react';
import { Table } from '../Table';
import { DataTable } from '../../components/DataTable';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json. The partial
// compiles against its Sass and is checked against its CSS, so an upgrade
// moves the two together.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix = '') =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'elements/table';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

const bulmaCss = (file = 'bulma.css') =>
  fs.readFileSync(path.join(BULMA, 'css', file), 'utf8');

const VAR = '--bulma-table-cell-text-align';

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
 * Specificity as [ids, classes, types]. `:not()` counts as its argument,
 * which is all the rules here need; any other functional pseudo-class, or an
 * argument that is a list, is refused.
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
  const flat = selector.replace(/:not\(([^)]*)\)/g, ' $1 ');
  return [
    (flat.match(/#[\w-]+/g) ?? []).length,
    (flat.match(/\.[\w-]+|\[[^\]]*\]|:[\w-]+/g) ?? []).length,
    (flat.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) ?? []).length,
  ];
}

const outranks = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
};

/** Whether one selector of a list matches `el`; a pseudo-element never does. */
const matches = (el: Element, part: string) => {
  if (part.includes('::')) return false;
  try {
    return el.matches(part);
  } catch {
    return false;
  }
};

/**
 * The value of `property` on `el`, as the top-level rules of `css` resolve
 * it, or undefined if none sets it. A media query or the like this file
 * doesn't model fails rather than being read either way.
 */
function resolve(css: string, el: Element, property: string) {
  let won: { value: string; rank: number[] } | undefined;
  rulesOf(css).forEach((rule, order) => {
    const raw = rule.declarations[property];
    if (raw === undefined) return;
    const selectors = rule.selector
      .split(/,(?![^(]*\))/)
      .map(part => part.trim())
      .filter(part => matches(el, part));
    if (selectors.length === 0) return;
    if (rule.context.length > 0) {
      throw new Error(
        `${rule.context.join(' ')} sets ${property} on ${rule.selector}, in a ` +
          'block this test does not walk. Extend `resolve` before trusting ' +
          'a result.'
      );
    }
    const specific = selectors
      .map(specificity)
      .reduce((best, next) => (outranks(next, best) ? next : best));
    const important = /!important$/.test(raw) ? 1 : 0;
    const value = raw.replace(/\s*!important$/, '');
    const rank = [important, ...specific, order];
    if (!won || !outranks(won.rank, rank)) won = { value, rank };
  });
  return won?.value;
}

const FROM_VAR = `var(${VAR})`;

/** A right-to-left table, with a plain header, a helper-aligned one and an `align` one. */
function rtlTable(prefix = '', className?: string) {
  const { container } = render(
    <ConfigProvider classPrefix={prefix}>
      <div dir="rtl">
        <Table className={className}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th isAligned="centered">Score</Table.Th>
              <Table.Th align="left">Notes</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td>Ada Lovelace</Table.Td>
              <Table.Td>98</Table.Td>
              <Table.Td>First program</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </div>
    </ConfigProvider>
  );
  const table = container.querySelector('table') as Element;
  const [plain, helper, attribute] = Array.from(
    container.querySelectorAll('th')
  );
  return { table, plain, helper, attribute };
}

describe('a table’s header cells', () => {
  describe.each([
    ['no prefix', '', () => bulmaCss() + compile()],
    [
      'a prefixed build',
      'bulma-',
      () => bulmaCss('versions/bulma-prefixed.css') + compile('bulma-'),
    ],
  ])('with %s, the partial after Bulma', (_label, prefix, css) => {
    it('align to the start of the line, as the body cells do', () => {
      const { table, plain } = rtlTable(prefix);
      expect(resolve(css(), table, VAR)).toBe('start');
      expect(resolve(css(), plain, 'text-align')).toBe(FROM_VAR);
    });

    it('keep an alignment of their own', () => {
      const { helper, attribute } = rtlTable(prefix);
      // `isAligned` writes Bulma's helper, which is `!important`.
      expect(resolve(css(), helper, 'text-align')).toBe('center');
      // Bulma's rule skips a cell with `align`, which the browser honors.
      expect(resolve(css(), attribute, 'text-align')).toBeUndefined();
    });

    it('align a DataTable’s row header cells to the start too', () => {
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>
          <div dir="rtl">
            <DataTable
              caption="Users"
              columns={[
                { id: 'name', header: 'Name', isRowHeader: true },
                { id: 'role', header: 'Role' },
              ]}
              data={[{ id: 'u1', name: 'Ada Lovelace', role: 'Admin' }]}
            />
          </div>
        </ConfigProvider>
      );
      const table = container.querySelector('table') as Element;
      const rowHeader = container.querySelector('tbody th') as Element;
      expect(rowHeader.textContent).toBe('Ada Lovelace');
      expect(resolve(css(), table, VAR)).toBe('start');
      expect(resolve(css(), rowHeader, 'text-align')).toBe(FROM_VAR);
    });
  });

  it('stay left with Bulma alone, which is the bug', () => {
    const { table } = rtlTable();
    expect(resolve(bulmaCss(), table, VAR)).toBe('left');
  });

  it('still take a value set on the table with a class of its own', () => {
    const { table } = rtlTable('', 'is-centered-headers');
    const own = `.is-centered-headers { ${VAR}: center; }`;
    expect(resolve(bulmaCss() + compile() + own, table, VAR)).toBe('center');
  });
});

describe('the Table partial', () => {
  it.each([
    ['no prefix', ''],
    ['a class prefix', 'bestax-'],
  ])(
    'only sets the variable, on the class Bulma does, with %s',
    (_label, prefix) => {
      expect(rulesOf(compile(prefix))).toEqual([
        {
          context: [],
          selector: `.${prefix}table`,
          declarations: { [VAR]: 'start' },
        },
      ]);
    }
  );

  it('is in the elements index, so bestax.css and extras.css carry it', () => {
    const index = fs.readFileSync(
      path.join(SCSS, 'elements/_index.scss'),
      'utf8'
    );
    expect(index).toMatch(/^@use 'table';$/m);
  });
});
