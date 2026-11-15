/**
 * A prop that bulma-ui declares under a name React's `AllHTMLAttributes`
 * declares (with the HTML, ARIA and DOM attributes it extends) takes
 * `undefined`, as React's own does (`bulma-ui/CLAUDE.md`, under TSDoc).
 * Declared as plain `string`, it takes no `undefined` once a caller turns on
 * `exactOptionalPropertyTypes`, which bulma-ui's own build leaves off, so a
 * caller can't forward an optional prop to it (#1677, #1707).
 *
 * The check asks the compiler rather than reading the declarations: with that
 * option on, it resolves every `*Props` type the library exports, a generic
 * one at its defaults (or at `INSTANTIATE` when it has none), and the props of
 * every component it exports, so a private props type can't hide one. Union
 * props go member by member. It looks at each optional prop bulma-ui declares
 * under one of those names, wherever it's declared: an interface's own, one
 * from a base, a member of an alias (`as?: T`). A prop typed `never` forbids
 * it on purpose and passes. Names React declares only for one element
 * (`DialogHTMLAttributes`' `onClose`) are outside it.
 *
 * The fixture then compiles a few of them the way a caller writes them, to
 * show the rule is the compiler's.
 */
import path from 'path';
import * as ts from 'typescript';
import { errorsOf, programWith } from './type-program';

const OPTIONS = { exactOptionalPropertyTypes: true };
/** `src/`, spelled the way TypeScript spells file names. */
const SRC = `${path.resolve(__dirname, '..').split(path.sep).join('/')}/`;

/** Type arguments for the exported props types with a parameter and no default. */
const INSTANTIATE: Record<string, string> = {
  DataTableProps: '<unknown>',
  PolymorphicProps: "<'div', {}>",
};

function walk() {
  const fixture = path.join(__dirname, 'exported-props.fixture.tsx');
  const index = path.resolve(__dirname, '../index.ts');
  // The export names first, from a program over the index alone: the props
  // types, and the components, whose props a private props type can't hide.
  const named = programWith(index, ts.sys.readFile(index)!);
  const namedChecker = named.program.getTypeChecker();
  const exports = namedChecker.getExportsOfModule(
    namedChecker.getSymbolAtLocation(named.file)!
  );
  const names = exports
    .map(s => s.name)
    .filter(name => /Props$/.test(name))
    .sort();
  const components = exports
    .filter(s => {
      const target =
        s.flags & ts.SymbolFlags.Alias ? namedChecker.getAliasedSymbol(s) : s;
      if (!/^[A-Z]/.test(s.name) || !(target.flags & ts.SymbolFlags.Value))
        return false;
      const type = namedChecker.getTypeOfSymbol(target);
      return (
        type.getCallSignatures().length > 0 ||
        type.getConstructSignatures().length > 0
      );
    })
    .map(s => s.name)
    .sort();

  const source = [
    "import type * as React from 'react';",
    `import type { ${names.join(', ')} } from '../index';`,
    `import { ${components.join(', ')} } from '../index';`,
    'export type DomAttributes = React.AllHTMLAttributes<HTMLElement>;',
    ...names.map(
      name => `export type Of${name} = ${name}${INSTANTIATE[name] ?? ''};`
    ),
    ...components.map(
      name =>
        `export type OfComponent${name} = React.ComponentProps<typeof ${name}>;`
    ),
  ].join('\n');
  const { program, file } = programWith(fixture, source, OPTIONS);
  const checker = program.getTypeChecker();
  const diagnostics = [
    ...program.getSyntacticDiagnostics(file),
    ...program.getSemanticDiagnostics(file),
  ].map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'));

  const aliases = file.statements.filter(ts.isTypeAliasDeclaration);
  const domNames = new Set(
    checker
      .getTypeAtLocation(
        aliases.find(a => a.name.text === 'DomAttributes')!.name
      )
      .getProperties()
      .map(p => p.name)
  );

  const takesUndefined = (t: ts.Type) =>
    Boolean(
      t.flags &
      (ts.TypeFlags.Undefined |
        ts.TypeFlags.Any |
        ts.TypeFlags.Unknown |
        ts.TypeFlags.Never)
    ) ||
    (t.isUnion() && t.types.some(u => u.flags & ts.TypeFlags.Undefined));

  const checked = new Set<string>();
  const narrowed = new Set<string>();
  for (const alias of aliases.filter(a => a.name.text.startsWith('Of'))) {
    const type = checker.getTypeAtLocation(alias.name);
    for (const member of type.isUnion() ? type.types : [type]) {
      for (const prop of member.getProperties()) {
        if (!(prop.flags & ts.SymbolFlags.Optional) || !domNames.has(prop.name))
          continue;
        for (const decl of prop.declarations ?? []) {
          const sf = decl.getSourceFile();
          if (!sf.fileName.startsWith(SRC) || !ts.isPropertySignature(decl))
            continue;
          const { line } = sf.getLineAndCharacterOfPosition(decl.getStart());
          const where = `${sf.fileName.slice(SRC.length)}:${line + 1} ${prop.name}`;
          checked.add(where);
          if (
            !decl.type ||
            !takesUndefined(checker.getTypeFromTypeNode(decl.type))
          )
            narrowed.add(where);
        }
      }
    }
  }
  return {
    names,
    components,
    diagnostics,
    domNames,
    checked,
    narrowed: [...narrowed].sort(),
  };
}

/** A few of them as a caller writes them, one line per props type. */
const CASES: Array<[string, string]> = [
  [
    'DropdownProps',
    "{ label: 'Open', children: null, className: text, id: text }",
  ],
  ['ButtonProps', '{ className: text, color: color }'],
  ['MenuItemProps', "{ children: 'Home', title: text, tabIndex: undefined }"],
  ['DialogProps', "{ isOpen: true, message: 'm', title: text }"],
  ['InputProps', '{ size: undefined, disabled: undefined }'],
  ['StackProps', '{ className: text }'],
  ['SliderProps', '{ value: undefined, onChange: undefined }'],
  ['RadiosProps', "{ name: text, className: text, children: 'x' }"],
  ['TreeSelectProps', "{ data: [], id: text, 'aria-describedby': text }"],
  ['NavbarBurgerProps', "{ 'aria-expanded': expanded, onClick: undefined }"],
];
/** And `as` on a polymorphic component, whose signature JSX goes through. */
const JSX_CASES: Array<[string, string]> = [
  ['Button', '<Button as={undefined}>Save</Button>'],
  ['Link', '<Link as={tag} href="/x">Docs</Link>'],
];

const SOURCE = [
  `import type { ${CASES.map(([type]) => type).join(', ')} } from '../index';`,
  "import { Button, Link } from '../index';",
  'declare const text: string | undefined;',
  "declare const color: 'primary' | undefined;",
  'declare const expanded: boolean | undefined;',
  "declare const tag: 'a' | undefined;",
  'export const narrow: { id?: string } = { id: text };',
  ...CASES.map(
    ([type, props]) => `export const of${type}: ${type} = ${props};`
  ),
  ...JSX_CASES.map(([name, jsx]) => `export const jsx${name} = ${jsx};`),
].join('\n');

/** The line, from 0, that a snippet is on in SOURCE. */
const lineOf = (snippet: string) =>
  SOURCE.split('\n').findIndex(line => line.includes(snippet));

describe('props under an attribute name React declares, with exactOptionalPropertyTypes on', () => {
  let found: ReturnType<typeof walk>;
  beforeAll(() => {
    found = walk();
  }, 60_000);

  it('resolves every exported props type and component, and finds what to check', () => {
    // A generic with no default and nothing in INSTANTIATE, or a component
    // whose props don't resolve, gives an error type with no props, so it
    // would pass unchecked.
    expect(found.diagnostics).toEqual([]);
    expect(found.names).toEqual(
      expect.arrayContaining(['ButtonProps', 'InputProps', 'TreeSelectProps'])
    );
    // Control's props type is private, and so are Delete's and Content's.
    expect(found.components).toEqual(
      expect.arrayContaining(['Control', 'Delete', 'Content', 'Dropdown'])
    );
    expect([...found.domNames]).toEqual(
      expect.arrayContaining(['className', 'aria-label', 'color', 'as'])
    );
    const checked = [...found.checked].join('\n');
    expect(checked).toMatch(/Button\.tsx:\d+ className/);
    expect(checked).toMatch(/Slider\.tsx:\d+ value/);
    expect(checked).toMatch(/polymorphic\.ts:\d+ as/);
    expect(checked).toMatch(/Control\.tsx:\d+ as/);
  });

  it('leaves none that refuses undefined', () => {
    expect(found.narrowed).toEqual([]);
  });

  describe('as a caller writes them', () => {
    const fixture = path.join(__dirname, 'inherited-prop-types.fixture.tsx');
    let errors: ReturnType<typeof errorsOf>;
    beforeAll(() => {
      errors = errorsOf(fixture, SOURCE, OPTIONS);
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

    it.each(JSX_CASES)('<%s> takes an `as` that may be undefined', name => {
      expect(
        errors.filter(e => e.line === lineOf(`const jsx${name} =`))
      ).toEqual([]);
    });

    it('reports nothing else', () => {
      expect(errors.map(e => e.line)).toEqual([lineOf('const narrow')]);
    });
  });
});
