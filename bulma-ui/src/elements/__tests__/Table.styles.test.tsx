// Bulma aligns a table's header cells with `--bulma-table-cell-text-align`,
// which it sets to `left`, so on a right-to-left page the headers stayed on
// the left while the cells under them went right (#1368). The stylesheets
// that build Bulma themselves configure it to `start`, through Bulma's own
// `$table-cell-text-align`, and the extras stylesheet, which an app links
// beside a Bulma of its own, sets nothing, so that Bulma's value, default or
// configured, still decides there. jsdom leaves `var()` unresolved and weighs
// rules by order alone, so these compile the real stylesheets and resolve the
// variable on the table and the alignment of each header cell themselves, the
// way a browser would: by importance, then specificity, then source order. A
// rule this can't rank, or one in a block it doesn't walk that sets a
// property it resolves, fails the test rather than dropping out.
import fs from 'fs';
import path from 'path';
import { render } from '@testing-library/react';
import { Table } from '../Table';
import { DataTable } from '../../components/DataTable';
import { ConfigProvider } from '../../helpers/Config';
import { compileScss, compileSheet } from '../../__tests__/compile-scss';

const PKG = path.resolve(__dirname, '../../..');

// The Bulma bulma-ui depends on, found through its package.json, so an
// upgrade moves its CSS and these together.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const bulmaCss = (file = 'bulma.css') =>
  fs.readFileSync(path.join(BULMA, 'css', file), 'utf8');

const VAR = '--bulma-table-cell-text-align';
const FROM_VAR = `var(${VAR})`;

/**
 * Every stylesheet the package publishes, as the `.scss` under `src/scss` it
 * is built from, read off the package's `exports`, so a new one is held to
 * this too.
 */
function publishedStylesheets(): string[] {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(PKG, 'package.json'), 'utf8')
  ) as { exports: Record<string, { default?: string }> };
  const targets = new Set<string>();
  for (const entry of Object.values(manifest.exports)) {
    const target = entry?.default;
    if (target?.endsWith('.css')) targets.add(target);
  }
  return [...targets]
    .map(target => target.replace(/^\.\/dist\//, '').replace(/\.css$/, '.scss'))
    .sort();
}

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
 * The value of `property` on `el`, as the top-level `rules` resolve it, or
 * undefined if none sets it. A media query or the like this file doesn't
 * model fails rather than being read either way.
 */
function resolve(rules: Rule[], el: Element, property: string) {
  let won: { value: string; rank: number[] } | undefined;
  rules.forEach((rule, order) => {
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

/** A right-to-left DataTable's table and the row header cell in its body. */
function rtlDataTable(prefix = '') {
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
  const rowHeader = container.querySelector('tbody th') as Element;
  expect(rowHeader.textContent).toBe('Ada Lovelace');
  return { table: container.querySelector('table') as Element, rowHeader };
}

const SHEETS = publishedStylesheets();
const BUILDS_BULMA = (file: string) =>
  /bulma\/sass(?:\/elements|['"])/.test(
    fs.readFileSync(path.join(PKG, 'src/scss', file), 'utf8')
  );

it('finds the stylesheets the package publishes, Bulma and not', () => {
  expect(SHEETS).toEqual(
    expect.arrayContaining([
      'bestax.scss',
      'extras.scss',
      'versions/bestax-no-dark-mode.scss',
      'versions/bestax-prefixed.scss',
    ])
  );
  expect(SHEETS.filter(file => !BUILDS_BULMA(file))).toEqual(['extras.scss']);
});

describe.each(SHEETS.filter(BUILDS_BULMA))('%s', file => {
  const source = fs.readFileSync(path.join(PKG, 'src/scss', file), 'utf8');
  const prefix = /\$class-prefix:\s*["']([^"']*)["']/.exec(source)?.[1] ?? '';
  let rules: Rule[];
  beforeAll(() => {
    rules = rulesOf(compileSheet(file));
  });

  it('aligns a header cell to the start of the line, as the body cells are', () => {
    const { table, plain } = rtlTable(prefix);
    expect(resolve(rules, table, VAR)).toBe('start');
    expect(resolve(rules, plain, 'text-align')).toBe(FROM_VAR);
  });

  it('leaves a header its own alignment', () => {
    const { helper, attribute } = rtlTable(prefix);
    // `isAligned` writes Bulma's helper, which is `!important`, in a sheet
    // that ships the helpers; a `no-helpers` one leaves them to the app.
    expect(resolve(rules, helper, 'text-align')).toBe(
      file.includes('no-helpers') ? FROM_VAR : 'center'
    );
    // Bulma's rule skips a cell with `align`, which the browser honors.
    expect(resolve(rules, attribute, 'text-align')).toBeUndefined();
  });

  it('aligns a DataTable’s row header cells to the start too', () => {
    const { table, rowHeader } = rtlDataTable(prefix);
    expect(resolve(rules, table, VAR)).toBe('start');
    expect(resolve(rules, rowHeader, 'text-align')).toBe(FROM_VAR);
  });

  // It's Bulma's own declaration with another value, so it is still the one
  // class a class of the table's own, loaded after the library, outranks.
  it('still takes a value set on the table with a class of its own', () => {
    const { table } = rtlTable(prefix, 'is-centered-headers');
    const own = rulesOf(`.is-centered-headers { ${VAR}: center; }`);
    expect(resolve([...rules, ...own], table, VAR)).toBe('center');
  });
});

describe('extras.css, which an app links beside a Bulma of its own', () => {
  it('sets nothing, so that Bulma decides', () => {
    expect(compileSheet('extras.scss')).not.toContain(VAR);
  });

  it.each([
    ['before', () => compileSheet('extras.scss') + bulmaCss()],
    ['after', () => bulmaCss() + compileSheet('extras.scss')],
  ])('keeps the stock Bulma value, linked %s it', (_side, css) => {
    const { table } = rtlTable();
    expect(resolve(rulesOf(css()), table, VAR)).toBe('left');
  });

  // A Sass build that configures Bulma and adds the extras, the way the Sass
  // customization guide sets Bulma up.
  it('keeps the value an app configures Bulma with', () => {
    const css = compileScss(
      `@use 'bulma/sass' with ($table-cell-text-align: right);
       @use 'extras';`
    );
    const { table } = rtlTable();
    expect(resolve(rulesOf(css), table, VAR)).toBe('right');
  });
});
