/**
 * A props interface that redeclares a prop it inherits, to give it TSDoc,
 * keeps the inherited type (`bulma-ui/CLAUDE.md`, under TSDoc). React's DOM
 * types spell those props `string | undefined`, and a redeclared `string`
 * takes no `undefined` once a caller turns on `exactOptionalPropertyTypes`,
 * which bulma-ui's own build leaves off. So this compiles the props of each
 * component that redeclares `id` or an `aria-*` prop with that option on,
 * giving each one a value that may be `undefined`, the way a caller forwards
 * an optional prop.
 *
 * It checks the props types rather than JSX: compiled from source with the
 * option on, a compound built by `withSubComponents` loses its call
 * signature, which the declarations a caller gets don't (they spell the
 * type out).
 */
import path from 'path';
import { errorsOf } from './type-program';

const FIXTURE = path.join(__dirname, 'inherited-prop-types.fixture.tsx');

/** One line per props type, so an error names the one that narrows. */
const CASES: Array<[string, string]> = [
  ['AutocompleteProps', '{ data: [], id: text }'],
  [
    'ComboboxProps',
    "{ data: [], id: text, 'aria-label': text, 'aria-labelledby': text }",
  ],
  ['DateRangeInputBaseProps', '{ id: text }'],
  ['DateRangeInputProps', '{ id: text }'],
  ['PinInputProps', '{ id: text }'],
  ['TaginputProps', '{ id: text }'],
  [
    'TreeSelectProps',
    "{ data: [], id: text, 'aria-label': text, 'aria-labelledby': text, 'aria-describedby': text }",
  ],
  ['DropdownProps', "{ label: 'Open', children: null, id: text }"],
  ['MenuItemProps', "{ children: 'Home', id: text }"],
  ['NavbarBurgerProps', "{ 'aria-label': text, 'aria-expanded': expanded }"],
];

const SOURCE = [
  `import type { ${CASES.map(([type]) => type).join(', ')} } from '../index';`,
  'declare const text: string | undefined;',
  'declare const expanded: boolean | undefined;',
  'export const narrow: { id?: string } = { id: text };',
  ...CASES.map(
    ([type, props]) => `export const of${type}: ${type} = ${props};`
  ),
].join('\n');

/** The line, from 0, that a snippet is on in SOURCE. */
const lineOf = (snippet: string) =>
  SOURCE.split('\n').findIndex(line => line.includes(snippet));

describe('redeclared id and aria-* props under exactOptionalPropertyTypes', () => {
  let errors: ReturnType<typeof errorsOf>;
  beforeAll(() => {
    errors = errorsOf(FIXTURE, SOURCE, { exactOptionalPropertyTypes: true });
  }, 30_000);

  it('turns the option on: a plain `string` prop refuses `undefined`', () => {
    const onLine = errors.filter(e => e.line === lineOf('const narrow'));
    expect(onLine).toHaveLength(1);
    expect(onLine[0].text).toContain('exactOptionalPropertyTypes');
  });

  it.each(CASES)('%s takes a value that may be undefined', type => {
    expect(errors.filter(e => e.line === lineOf(`const of${type}:`))).toEqual(
      []
    );
  });

  it('reports nothing else', () => {
    expect(errors.map(e => e.line)).toEqual([lineOf('const narrow')]);
  });
});
