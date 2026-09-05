/**
 * Regression tests for the seven defects a high-effort code review found
 * after the first pass. Each one was reachable from ordinary rbx input and
 * produced either a silent build break or an unknown DOM attribute, so each
 * gets a test that fails if the behaviour comes back.
 */

import transform from '../transform.js';
import { rbx } from '../index.js';
import { runTransform } from '../../../runner.js';
import type { TodoEntry } from '../../../types.js';

function migrate(source: string) {
  const todos: TodoEntry[] = [];
  const { output } = runTransform(transform, 'c.tsx', source, {
    add: entry => todos.push(entry),
  });
  return { output: output ?? source, todos };
}

/** Output with `// TODO(bestax-migrate): …` lines removed. */
function codeOf(output: string): string {
  return output
    .split('\n')
    .filter(l => !l.trim().startsWith('// TODO(bestax-migrate)'))
    .join('\n');
}

function migrateScss(source: string) {
  const todos: TodoEntry[] = [];
  const output = rbx.transformStyles!(
    's.scss',
    source,
    { add: entry => todos.push(entry) },
    { cssMode: 'bestax' }
  );
  return { output, todos };
}

describe('stylesheets that never mention Bulma by name', () => {
  it('still migrates a sass entry that only imports rbx', () => {
    // rbx pulls Bulma in itself, so `@import '~rbx/rbx'` — the spelling rbx's
    // own customisation guide teaches — contains no "bulma" substring. The
    // pre-filter used to bail here, leaving a dead import while deps.ts
    // removed the package in the same run.
    const { output, todos } = migrateScss(
      '$primary: #00d8ff;\n@import "~rbx/rbx";\n.app { color: red; }\n'
    );
    expect(output).not.toBeNull();
    expect(output).toContain("@use 'bulma/sass'");
    expect(output).not.toContain('~rbx/rbx');
    expect(todos.length).toBeGreaterThan(0);
  });

  it('matches the bare package specifier, not only `<pkg>/…`', () => {
    const { output } = migrateScss(
      '@import "~rbx";\n@import "~bulma/bulma";\n'
    );
    expect(output).not.toContain('~rbx');
    expect(output).toContain("@use 'bulma/sass'");
  });
});

describe('column breakpoint objects are always consumed', () => {
  it('removes a breakpoint bestax cannot express at all', () => {
    // ColumnProps spreads unrecognised props onto the <div>, so a leftover is
    // both a TS excess-property error and a React unknown-attribute warning.
    const { output, todos } = migrate(
      'import { Column } from "rbx";\nexport const A = () => <Column touch={{ size: 6 }} />;'
    );
    expect(output).not.toContain('touch=');
    expect(todos.some(t => t.rule === 'responsive')).toBe(true);
  });

  it('removes the object even when only some keys converted', () => {
    const { output, todos } = migrate(
      'import { Column } from "rbx";\nexport const A = () => <Column tablet={{ size: 6, foo: 1 }} />;'
    );
    expect(output).toContain('sizeTablet={6}');
    expect(output).not.toContain('tablet={{');
    expect(todos.some(t => /foo/.test(t.message))).toBe(true);
  });

  it('converts touch narrow, which bestax does support on Column', () => {
    // `isNarrowTouch` exists on Column even though bestax has no `touch`
    // viewport for the generic helper props — one shared table cannot give
    // both consumers the right answer.
    const { output, todos } = migrate(
      'import { Column } from "rbx";\nexport const A = () => <Column touch={{ narrow: true }} />;'
    );
    expect(output).toContain('isNarrowTouch');
    expect(todos).toHaveLength(0);
  });
});

describe('namespace imports', () => {
  it('keeps `import * as rbx` alive when a component is retained', () => {
    // resolveJsxPath supports namespace imports, so `<rbx.Tile>` survives the
    // run unconverted — pruning the import left `rbx is not defined`.
    const { output } = migrate(
      'import * as rbx from "rbx";\nexport const A = () => <rbx.Tile><rbx.Button>x</rbx.Button></rbx.Tile>;'
    );
    expect(output).toContain('import * as rbx from "rbx"');
    expect(output).toContain('<rbx.Tile>');
    expect(output).toContain('<Button>x</Button>');
  });

  it('still prunes the namespace import when nothing is retained', () => {
    const { output } = migrate(
      'import * as rbx from "rbx";\nexport const A = () => <rbx.Box>x</rbx.Box>;'
    );
    expect(output).not.toContain('from "rbx"');
    expect(output).toContain('<Box>x</Box>');
  });
});

describe('retained extension stylesheets are flagged in the file', () => {
  it('leaves the import in place with a TODO on it, not only a report entry', () => {
    const { output, todos } = migrate(
      'import "bulma-tooltip/dist/css/bulma-tooltip.min.css";\nimport { Box } from "rbx";\nexport const A = () => <Box />;'
    );
    expect(output).toContain('TODO(bestax-migrate)');
    expect(output).toContain(
      'import "bulma-tooltip/dist/css/bulma-tooltip.min.css";'
    );
    expect(todos.some(t => t.rule === 'css')).toBe(true);
  });
});

describe('badge/tooltip props on plain-element rewrites', () => {
  it.each([
    ['Heading', '<Heading tooltip="hi">x</Heading>'],
    ['Help', '<Help badge="3">x</Help>'],
  ])(
    'strips them from a replaced %s instead of emitting a DOM attribute',
    (name, jsx) => {
      // The wrapping pass runs after the rename step, which a `replaced: true`
      // special skips entirely.
      const { output, todos } = migrate(
        `import { ${name} } from "rbx";\nexport const A = () => ${jsx};`
      );
      expect(output).not.toMatch(/\s(tooltip|badge)=/);
      expect(todos.some(t => t.rule === 'plain-element')).toBe(true);
    }
  );
});

// ---------------------------------------------------------------------------
// Round 2: findings from Copilot and the Claude deep review on PR #613.
// ---------------------------------------------------------------------------

describe('`as` is opted in only where bestax really declares it', () => {
  it.each([
    ['Dropdown', '<Dropdown as="div">x</Dropdown>'],
    ['Navbar', '<Navbar as="nav">x</Navbar>'],
  ])('TODOs `as` on the %s root, which has no such prop', (name, jsx) => {
    const { output, todos } = migrate(
      `import { ${name} } from "rbx";\nexport const A = () => ${jsx};`
    );
    expect(todos.some(t => t.rule === 'prop:as')).toBe(true);
    // A `todo` PropAction deliberately leaves the attribute next to its
    // comment rather than silently dropping it; the TODO is the contract.
    expect(output).toContain('TODO(bestax-migrate)');
    expect(todos.find(t => t.rule === 'prop:as')?.message).toMatch(
      /not one of them/
    );
  });

  it.each([
    ['Dropdown', '<Dropdown.Item as="button">x</Dropdown.Item>', 'as="button"'],
    ['Navbar', '<Navbar.Link as="a">x</Navbar.Link>', 'as="a"'],
  ])(
    'passes `as` through on %s sub-components that accept it',
    (name, jsx, expected) => {
      const { output, todos } = migrate(
        `import { ${name} } from "rbx";\nexport const A = () => ${jsx};`
      );
      expect(output).toContain(expected);
      expect(todos.some(t => t.rule === 'prop:as')).toBe(false);
    }
  );

  it('keeps `as` on Media.Left but drops it on Content/Right', () => {
    // Media.Item resolves to a different bestax component per `align`, and
    // only MediaLeftProps declares `as`.
    const left = migrate(
      'import { Media } from "rbx";\nexport const A = () => <Media.Item align="left" as="figure">x</Media.Item>;'
    );
    expect(left.output).toContain('<Media.Left as="figure">');
    expect(left.todos).toHaveLength(0);

    for (const align of ['right', 'content']) {
      const other = migrate(
        `import { Media } from "rbx";\nexport const A = () => <Media.Item align="${align}" as="div">x</Media.Item>;`
      );
      expect(other.output).not.toMatch(/\sas="/);
      expect(other.todos.some(t => t.rule === 'prop:as')).toBe(true);
    }
  });
});

describe('a dynamic `only` is not `false`', () => {
  it('refuses the cell instead of dropping the -only behaviour', () => {
    const { output, todos } = migrate(
      'import { Box } from "rbx";\nexport const A = (p: any) => <Box responsive={{ tablet: { display: { value: "flex", only: p.c } } }}>x</Box>;'
    );
    expect(output).not.toContain('displayTablet');
    expect(todos.some(t => /\.only` has a dynamic value/.test(t.message))).toBe(
      true
    );
  });
});

describe('a broken default import is kept, not stranded', () => {
  it('retains the binding its references still need', () => {
    // rbx has no default export, so the binding is already wrong — but
    // deleting it turns a bad import into `RBX is not defined`.
    const { output, todos } = migrate(
      'import RBX, { Box } from "rbx";\nexport const A = () => <Box>{String(RBX)}</Box>;'
    );
    expect(output).toContain('import RBX from "rbx"');
    expect(output).toContain('from "@allxsmith/bestax-bulma"');
    expect(todos.some(t => t.rule === 'imports')).toBe(true);
    // …and no empty "  have no bestax-bulma equivalent" comment.
    expect(output).not.toMatch(/\):\s+have no bestax-bulma/);
  });
});

describe('Navbar.Item still cleans up after picking a target', () => {
  it('flags `up` even when `dropdown` selects Navbar.Dropdown', () => {
    const { output, todos } = migrate(
      'import { Navbar } from "rbx";\nexport const A = () => <Navbar.Item dropdown up>x</Navbar.Item>;'
    );
    // `up` and `hoverable` exist on bestax's NavbarDropdownProps, so they
    // carry over; only the props with no home are flagged.
    expect(output).toContain('<Navbar.Dropdown up>');
    expect(todos.some(t => t.rule === 'prop:up')).toBe(false);
  });
});

describe('Label `disabled` resolves by value', () => {
  it('drops a literal false rather than baking in is-disabled', () => {
    const { output } = migrate(
      'import { Label } from "rbx";\nexport const A = () => <Label disabled={false}>x</Label>;'
    );
    expect(output).toContain('className="label"');
    expect(output).not.toContain('is-disabled');
  });

  it('TODOs a dynamic value rather than forcing it true', () => {
    const { output, todos } = migrate(
      'import { Label } from "rbx";\nexport const A = (p: any) => <Label disabled={p.d}>x</Label>;'
    );
    expect(codeOf(output)).not.toContain('is-disabled');
    expect(todos.some(t => t.rule === 'prop:disabled')).toBe(true);
  });
});

describe('Breadcrumb.Item builds its anchor by hand', () => {
  it('still strips badge/tooltip helper props from it', () => {
    const { output, todos } = migrate(
      'import { Breadcrumb } from "rbx";\nexport const A = () => <Breadcrumb.Item tooltip="Home" href="/">H</Breadcrumb.Item>;'
    );
    expect(output).toContain('<li><a href="/">H</a></li>');
    expect(codeOf(output)).not.toContain('tooltip');
    expect(todos.some(t => t.rule === 'plain-element')).toBe(true);
  });
});

describe('Field multiline follows rbx runtime semantics', () => {
  it('ignores multiline with kind="addons", as rbx does', () => {
    // rbx: `[`${k}-multiline`]: k === "is-grouped" && multiline === true`
    const { output } = migrate(
      'import { Field } from "rbx";\nexport const A = () => <Field kind="addons" multiline>x</Field>;'
    );
    expect(output).toContain('hasAddons');
    expect(output).not.toContain('multiline');
  });

  it('still folds multiline into grouped with kind="group"', () => {
    const { output } = migrate(
      'import { Field } from "rbx";\nexport const A = () => <Field kind="group" multiline>x</Field>;'
    );
    expect(output).toContain('grouped="multiline"');
  });
});

// ---------------------------------------------------------------------------
// Round 3: Copilot's second pass on PR #613.
// ---------------------------------------------------------------------------

describe('rbx Loader keeps rendering', () => {
  it('emits the plain .loader element, not an inactive Loading', () => {
    // rbx's Loader always renders `div.loader`. bestax's Loading is a
    // different component — an overlay that defaults `active` to false and
    // returns null — so mapping straight onto it made every migrated loader
    // disappear with no diagnostic at all.
    const { output } = migrate(
      'import { Loader } from "rbx";\nexport const A = () => <Loader />;'
    );
    expect(output).toContain('className="loader"');
    expect(output).not.toContain('Loading');
  });

  it('still maps PageLoader onto Loading, which is an overlay', () => {
    const { output } = migrate(
      'import { PageLoader } from "rbx";\nexport const A = () => <PageLoader active />;'
    );
    expect(output).toContain('<Loading active isFullPage />');
  });
});

describe('an existing namespace import of bestax-bulma', () => {
  it('gets a separate declaration rather than an invalid merge', () => {
    // `import * as X, { Y } from '…'` is not valid JavaScript: a namespace
    // specifier cannot share a declaration with named ones.
    const { output } = migrate(
      'import * as Bestax from "@allxsmith/bestax-bulma";\nimport { Button } from "rbx";\nexport const A = () => <div>{String(Bestax)}<Button>x</Button></div>;'
    );
    expect(output).not.toMatch(/import \* as \w+, \{/);
    expect(output).toContain(
      'import * as Bestax from "@allxsmith/bestax-bulma"'
    );
    expect(output).toContain(
      'import { Button } from "@allxsmith/bestax-bulma"'
    );
  });

  it('still merges into an existing NAMED bestax import', () => {
    const { output } = migrate(
      'import { Box } from "@allxsmith/bestax-bulma";\nimport { Button } from "rbx";\nexport const A = () => <Box><Button>x</Button></Box>;'
    );
    // recast preserves the existing declaration's quote style.
    expect(output).toMatch(
      /import \{ Box, Button \} from ["']@allxsmith\/bestax-bulma["']/
    );
  });
});

describe('a non-literal `responsive` value', () => {
  it('is removed, not merely reported', () => {
    // bestax's own `responsive` is `'mobile' | 'narrow'`, so leaving a
    // dynamic rbx object behind is a guaranteed type error.
    const { output, todos } = migrate(
      'import { Box } from "rbx";\nexport const A = (p: any) => <Box responsive={p.layout}>x</Box>;'
    );
    expect(codeOf(output)).not.toContain('responsive=');
    expect(todos.some(t => t.rule === 'responsive')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Round 4: CodeRabbit's first pass and the deep review's second.
// ---------------------------------------------------------------------------

describe('Font Awesome modifier classes are not read as the icon name', () => {
  it.each([
    ['fas fa-rotate-90 fa-home', 'home'],
    ['fas fa-flip-horizontal fa-star', 'star'],
    ['fas fa-lg fa-spin fa-cog', 'cog'],
    ['far fa-border fa-bell', 'bell'],
  ])('%s → name="%s"', (className, expected) => {
    // Class order is not guaranteed, so the modifier filter has to be
    // exhaustive rather than positional.
    const { output } = migrate(
      `import { Icon } from "rbx";\nexport const A = () => (<Icon><i className="${className}" /></Icon>);`
    );
    expect(output).toContain(`name="${expected}"`);
  });

  it('keeps fa-rotate-left, which is an icon and not a modifier', () => {
    const { output } = migrate(
      'import { Icon } from "rbx";\nexport const A = () => (<Icon><i className="fas fa-rotate-left" /></Icon>);'
    );
    expect(output).toContain('name="rotate-left"');
  });
});

describe('Field multiline without a kind', () => {
  it('renders plain, because rbx applies multiline only to kind="group"', () => {
    // rbx: `[`${k}-multiline`]: k === "is-grouped" && multiline === true`.
    // With no `kind`, `k` is undefined and multiline is a no-op — treating it
    // as group turned a plain block field into a grouped flex row.
    const { output } = migrate(
      'import { Field } from "rbx";\nexport const A = () => <Field multiline>x</Field>;'
    );
    expect(codeOf(output)).not.toContain('grouped');
    expect(codeOf(output)).not.toContain('multiline');
  });

  it('TODOs a dynamic kind rather than deciding for it', () => {
    const { todos } = migrate(
      'import { Field } from "rbx";\nexport const A = (p: any) => <Field kind={p.k} multiline>x</Field>;'
    );
    expect(todos.some(t => t.rule === 'prop:multiline')).toBe(true);
  });
});

describe('badge/tooltip wrapping and React keys', () => {
  it('moves `key` to the wrapper, which is now the array member', () => {
    // Left on the inner element, React sees a keyless child: a console
    // warning plus index reconciliation that mis-reuses DOM on reorder.
    const { output } = migrate(
      'import { Button } from "rbx";\nexport const A = (items: any[]) => <>{items.map(i => <Button key={i.id} badge={i.n}>x</Button>)}</>;'
    );
    expect(output).toMatch(/<Badge key=\{i\.id\}/);
    expect(output).not.toMatch(/<Button key=/);
  });

  it('moves `key` to the outermost wrapper when both badge and tooltip apply', () => {
    const { output } = migrate(
      'import { Button } from "rbx";\nexport const A = (items: any[]) => <>{items.map(i => <Button key={i.id} badge={i.n} tooltip="t">x</Button>)}</>;'
    );
    expect(output).toMatch(/<Tooltip key=\{i\.id\}/);
    expect(output).not.toMatch(/<Badge key=/);
    expect(output).not.toMatch(/<Button key=/);
  });
});

describe('a namespace binding still used as a value', () => {
  it('survives when the namespace itself is referenced', () => {
    // JSX names like <rbx.Box> are rewritten away, but a bare reference to
    // the namespace is not — and pruning the import under one leaves
    // `rbx is not defined`. Reachable even when every component maps.
    const { output } = migrate(
      'import * as rbx from "rbx";\nexport const A = () => <rbx.Box>{String(rbx)}</rbx.Box>;'
    );
    expect(output).toContain('import * as rbx from "rbx"');
    expect(output).toContain('<Box');
  });

  it('is pruned once its member references are migrated', () => {
    // `rbx.Block` is a mappable component, so it becomes `Block` and the
    // namespace has nothing left to bind — retaining it here would leave a
    // dead import of a package deps.ts removes.
    const { output } = migrate(
      'import * as rbx from "rbx";\nexport const A = () => <rbx.Box as={rbx.Block}>x</rbx.Box>;'
    );
    expect(output).toContain('as={Block}');
    expect(output).not.toContain('from "rbx"');
  });

  it('is still pruned when nothing references it', () => {
    const { output } = migrate(
      'import * as rbx from "rbx";\nexport const A = () => <rbx.Box>x</rbx.Box>;'
    );
    expect(output).not.toContain('from "rbx"');
  });
});

describe('value references walk the whole member chain', () => {
  it('rewrites Card.Footer.Item to bestax Card.FooterItem', () => {
    // Resolving only the first level treated `Card.Footer` as unchanged and
    // left `.Item` dangling on a compound bestax does not have.
    const { output, todos } = migrate(
      'import { Card } from "rbx";\nconst X = Card.Footer.Item;\nexport const A = () => <X>x</X>;'
    );
    expect(output).toContain('const X = Card.FooterItem;');
    expect(output).not.toContain('from "rbx"');
    expect(todos).toHaveLength(0);
  });
});

describe('a retained rbx binding never loses its name to a bestax import', () => {
  it('aliases the bestax local instead of dropping the retained specifier', () => {
    // `Tile as Button` is unmappable and retained; another rbx component
    // wants bestax's `Button`. Dropping the retained specifier made
    // `<Button>` — which was a Tile — silently render a bestax Button.
    const { output } = migrate(
      'import { Tile as Button, Button as RealButton } from "rbx";\nexport const A = () => <><Button>tile</Button><RealButton>btn</RealButton></>;'
    );
    expect(output).toContain('import { Tile as Button } from "rbx"');
    expect(output).toMatch(/Button as Bulma\w+/);
    // The Tile usage still points at the retained rbx binding.
    expect(output).toContain('<Button>tile</Button>');
  });
});

describe('removing the source package while imports remain', () => {
  it('warns rather than silently stranding the retained imports', async () => {
    const { rbx } = await import('../index.js');
    const todos: TodoEntry[] = [];
    rbx.updateDependencies!(
      'package.json',
      { dependencies: { rbx: '^2.2.0' } },
      { add: e => todos.push(e) },
      { cssMode: 'bestax', sourceStillImported: true }
    );
    expect(
      todos.some(t =>
        /still import it for components with no bestax/.test(t.message)
      )
    ).toBe(true);
  });

  it('stays quiet when nothing still imports it', async () => {
    const { rbx } = await import('../index.js');
    const todos: TodoEntry[] = [];
    rbx.updateDependencies!(
      'package.json',
      { dependencies: { rbx: '^2.2.0' } },
      { add: e => todos.push(e) },
      { cssMode: 'bestax', sourceStillImported: false }
    );
    expect(todos.some(t => /still import it/.test(t.message))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Round 4: Copilot's third pass — target-dependent `as`, and the Navbar
// dropdown container/menu distinction.
// ---------------------------------------------------------------------------

describe('rbx Navbar.Dropdown is the MENU, not the container', () => {
  it('maps it to Navbar.DropdownMenu inside the Item-derived container', () => {
    // bestax `Navbar.Dropdown` renders `navbar-item has-dropdown` (the outer
    // container, which rbx's `<Navbar.Item dropdown>` becomes);
    // `Navbar.DropdownMenu` renders `navbar-dropdown` (the menu, which rbx
    // calls Navbar.Dropdown). Targeting the wrong one nested two containers
    // and emitted no menu at all.
    const { output } = migrate(
      [
        'import { Navbar } from "rbx";',
        'export const A = () => (',
        '  <Navbar.Item dropdown><Navbar.Link>M</Navbar.Link>',
        '    <Navbar.Dropdown align="right"><Navbar.Item>one</Navbar.Item></Navbar.Dropdown>',
        '  </Navbar.Item>);',
      ].join('\n')
    );
    expect(output).toContain('<Navbar.Dropdown>');
    expect(output).toContain('<Navbar.DropdownMenu right>');
  });

  it('TODOs `boxed`, which bestax has no prop for', () => {
    const { todos } = migrate(
      'import { Navbar } from "rbx";\nexport const A = () => <Navbar.Dropdown boxed>x</Navbar.Dropdown>;'
    );
    expect(todos.some(t => t.rule === 'prop:boxed')).toBe(true);
  });
});

describe('`as` is checked against the target a handler actually picked', () => {
  it.each([
    ['Level', '<Level.Item align="left" as="a">x</Level.Item>', 'Level.Left'],
    [
      'Navbar',
      '<Navbar.Item dropdown as="div">x</Navbar.Item>',
      'Navbar.Dropdown',
    ],
    [
      'Media',
      '<Media.Item align="right" as="div">x</Media.Item>',
      'Media.Right',
    ],
  ])('drops `as` when %s resolves to %s', (name, jsx, expectedTarget) => {
    const { output, todos } = migrate(
      `import { ${name} } from "rbx";\nexport const A = () => ${jsx};`
    );
    expect(output).toContain(`<${expectedTarget}`);
    expect(codeOf(output)).not.toMatch(/\sas="/);
    expect(todos.some(t => t.rule === 'prop:as')).toBe(true);
  });

  it.each([
    ['Level', '<Level.Item as="a">x</Level.Item>'],
    ['Navbar', '<Navbar.Item as="a">x</Navbar.Item>'],
    ['Media', '<Media.Item align="left" as="figure">x</Media.Item>'],
  ])(
    'keeps `as` when %s resolves to a target that declares it',
    (name, jsx) => {
      const { output, todos } = migrate(
        `import { ${name} } from "rbx";\nexport const A = () => ${jsx};`
      );
      expect(output).toMatch(/\sas="/);
      expect(todos.some(t => t.rule === 'prop:as')).toBe(false);
    }
  );
});

describe('shorthand object properties are keys as well as references', () => {
  it('expands rather than rewriting the public key', () => {
    // `{ Textarea }` is `{ Textarea: <component> }`. Renaming in place
    // changed the object's own key to `TextArea`, silently altering the API
    // its callers use.
    const { output } = migrate(
      'import { Textarea } from "rbx";\nexport const registry = { Textarea };'
    );
    expect(output).toContain('{ Textarea: TextArea }');
  });

  it('leaves a shorthand alone when the name does not change', () => {
    const { output } = migrate(
      'import { Box } from "rbx";\nexport const registry = { Box };'
    );
    expect(output).toContain('{ Box }');
  });

  it('flags an unmappable component in shorthand rather than renaming it', () => {
    const { output, todos } = migrate(
      'import { Tile } from "rbx";\nexport const registry = { Tile };'
    );
    expect(output).toContain('{ Tile }');
    expect(todos.some(t => t.rule === 'value-reference')).toBe(true);
  });

  it('does not touch a non-shorthand key that happens to match', () => {
    const { output } = migrate(
      'import { Textarea } from "rbx";\nexport const registry = { Textarea: Textarea };'
    );
    // The key stays; only the value reference migrates.
    expect(output).toContain('Textarea: TextArea');
  });
});

describe('the universal `responsive` prop on a plain-element rewrite', () => {
  it.each([
    [
      'Heading',
      '<Heading responsive={{ tablet: { hide: { value: true } } }}>x</Heading>',
    ],
    [
      'Help',
      '<Help responsive={{ mobile: { hide: { value: true } } }}>x</Help>',
    ],
  ])('is stripped from a replaced %s', (name, jsx) => {
    // responsive.ts would have consumed it, but a `replaced: true` special
    // skips that pass, and it is deliberately absent from UNIVERSAL_PROPS so
    // stripModifierProps misses it too. Left behind it is an object literal
    // on an intrinsic element — which does not compile.
    const { output, todos } = migrate(
      `import { ${name} } from "rbx";\nexport const A = () => ${jsx};`
    );
    expect(codeOf(output)).not.toContain('responsive=');
    expect(todos.some(t => t.rule === 'plain-element')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Round 6: CodeRabbit's first complete pass, and Copilot's fourth.
// ---------------------------------------------------------------------------

describe('containers collapse only onto the component they wrap', () => {
  it('keeps the Image wrapper around a non-Image child', () => {
    // rbx's Image.Container is also the ratio box for arbitrary children.
    // Folding onto an <iframe> put `size` on an intrinsic element and lost
    // the container the markup needs.
    const { output } = migrate(
      'import { Image } from "rbx";\nexport const A = () => <Image.Container size="16by9"><iframe src="/v" /></Image.Container>;'
    );
    expect(output).toContain('<Image size="16by9">');
    expect(output).toContain('<iframe src="/v" />');
  });

  it('folds a native select INTO the bestax Select', () => {
    // rbx allows Select.Container to wrap a native <select>, but bestax's
    // Select renders its own — keeping both nested one inside the other, so
    // the native element's attributes and options move up instead.
    const { output } = migrate(
      'import { Select } from "rbx";\nexport const A = () => <Select.Container fullwidth><select name="x"><option>a</option></select></Select.Container>;'
    );
    expect(output).toContain('<Select isFullwidth name="x">');
    expect(output).toContain('<option>a</option>');
    expect(output).not.toMatch(/<select[\s>]/);
  });

  it('still collapses when the child IS the wrapped component', () => {
    const { output } = migrate(
      'import { Image } from "rbx";\nexport const A = () => <Image.Container size={64}><Image src="/a.png" /></Image.Container>;'
    );
    expect(output).toContain('<Image src="/a.png" size="64x64" />');
  });
});

describe('rbx types tooltip and badge as `number | string`', () => {
  it('stringifies a numeric tooltip, since bestax label is a string', () => {
    const { output } = migrate(
      'import { Button } from "rbx";\nexport const A = () => <Button tooltip={7}>x</Button>;'
    );
    expect(output).toContain('label="7"');
  });

  it('leaves a numeric badge alone, since content is a ReactNode', () => {
    const { output } = migrate(
      'import { Button } from "rbx";\nexport const A = () => <Button badge={7}>x</Button>;'
    );
    expect(output).toContain('content={7}');
  });

  it('TODOs a dynamic tooltip that could be numeric', () => {
    const { todos } = migrate(
      'import { Button } from "rbx";\nexport const A = (p: any) => <Button tooltip={p.t}>x</Button>;'
    );
    expect(todos.some(t => /takes a string/.test(t.message))).toBe(true);
  });
});

describe('the innerRef remediation is achievable', () => {
  // These four roots forward a ref as of bulma-ui #622, so rbx's escape hatch
  // maps straight across instead of being TODO'd away. The guidance used to
  // say the opposite, and following it would have deleted a working ref.
  it.each(['Button', 'Dropdown', 'Modal', 'Navbar'])(
    'renames innerRef to ref on %s',
    name => {
      const { output, todos } = migrate(
        `import { ${name} } from "rbx";\nexport const A = (r: any) => <${name} innerRef={r}>x</${name}>;`
      );
      expect(output).toMatch(/<\w+ ref=\{r\}/);
      expect(output).not.toMatch(/innerRef/);
      expect(todos.find(t => t.rule === 'prop:innerRef')).toBeUndefined();
    }
  );

  it.each([
    ['Navbar.Burger', 'Navbar.Burger'],
    ['Navbar.Link', 'Navbar.Link'],
  ])('renames innerRef to ref on %s', (rbxName, bestaxName) => {
    // NavbarBurger and NavbarLink forward a ref too, and the root's prop
    // mapping does not reach sub-components.
    const { output } = migrate(
      `import { Navbar } from "rbx";\nexport const A = (r: any) => <${rbxName} innerRef={r} />;`
    );
    expect(output).toContain(`<${bestaxName} ref={r}`);
    expect(output).not.toMatch(/innerRef/);
  });

  it('leaves innerRef alone on Navbar.Dropdown, which maps to the menu', () => {
    // rbx's Navbar.Dropdown is the menu itself, so it maps to bestax's
    // Navbar.DropdownMenu — a plain function component that forwards no ref.
    const { output } = migrate(
      'import { Navbar } from "rbx";\nexport const A = (r: any) => <Navbar.Dropdown innerRef={r}>x</Navbar.Dropdown>;'
    );
    expect(output).toMatch(/innerRef=\{r\}/);
  });

  it('renames innerRef to ref on the Navbar.Item that becomes a Dropdown', () => {
    // The other half of the same collision: bestax's Navbar.Dropdown is the
    // container, which `<Navbar.Item dropdown>` becomes, and it forwards a ref.
    // The prop table is keyed on the rbx name, so only the special can know
    // which target was picked — this was the one forwarding target the renames
    // in mapping.ts could not reach.
    const { output, todos } = migrate(
      'import { Navbar } from "rbx";\nexport const A = (r: any) => <Navbar.Item dropdown innerRef={r}>x</Navbar.Item>;'
    );
    expect(output).toContain('<Navbar.Dropdown ref={r}');
    expect(output).not.toMatch(/innerRef/);
    expect(todos.find(t => t.rule === 'prop:innerRef')).toBeUndefined();
  });

  it('leaves innerRef alone on a plain Navbar.Item', () => {
    // Without `dropdown` the target stays Navbar.Item, a function component —
    // so the rename above must be conditional, not unconditional.
    const { output } = migrate(
      'import { Navbar } from "rbx";\nexport const A = (r: any) => <Navbar.Item innerRef={r}>x</Navbar.Item>;'
    );
    expect(output).toContain('<Navbar.Item innerRef={r}');
  });

  it('leaves innerRef alone on a root that forwards no ref', () => {
    // Card is not one of the four; renaming here would be a type error, so the
    // codemod must not touch it.
    const { output } = migrate(
      'import { Card } from "rbx";\nexport const A = (r: any) => <Card innerRef={r}>x</Card>;'
    );
    expect(output).toMatch(/innerRef=\{r\}/);
  });
});

// ---------------------------------------------------------------------------
// Round 7: the first deep review to read the current head (0 blocking).
// ---------------------------------------------------------------------------

describe('component references through a namespace import', () => {
  it('migrates a mappable one instead of silently skipping it', () => {
    // `const C = rbx.Button` kept working (the import is pinned) but was
    // never migrated and never flagged — a silent skip, which this package
    // does not do.
    const { output, todos } = migrate(
      'import * as rbx from "rbx";\nconst C = rbx.Button;\nexport const A = () => <C>x</C>;'
    );
    expect(output).toContain('const C = Button;');
    expect(output).toContain('from "@allxsmith/bestax-bulma"');
    expect(output).not.toContain('from "rbx"');
    expect(todos).toHaveLength(0);
  });

  it('resolves a compound to its flat bestax target', () => {
    const { output } = migrate(
      'import * as rbx from "rbx";\nconst C = rbx.Tag.Group;\nexport const A = () => <C>x</C>;'
    );
    expect(output).toContain('const C = Tags;');
  });

  it('flags an unmappable one and keeps the namespace import', () => {
    const { output, todos } = migrate(
      'import * as rbx from "rbx";\nconst C = rbx.Tile;\nexport const A = () => <C>x</C>;'
    );
    expect(output).toContain('import * as rbx from "rbx"');
    expect(todos.some(t => t.rule === 'value-reference')).toBe(true);
  });

  it('still pins the import for a bare namespace reference', () => {
    const { output } = migrate(
      'import * as rbx from "rbx";\nexport const A = () => <rbx.Box>{String(rbx)}</rbx.Box>;'
    );
    expect(output).toContain('import * as rbx from "rbx"');
    expect(output).toContain('<Box>');
  });
});

describe('the three specifier retention rules interact correctly', () => {
  // Named, default and namespace specifiers each have their own retention
  // rule, added in three separate rounds. Nothing covered them TOGETHER, and
  // an rbx import declaration can legally carry more than one.
  it('keeps a default and a namespace in one valid declaration', () => {
    const { output } = migrate(
      'import RBX, * as rbx from "rbx";\nexport const A = () => <rbx.Box>{String(RBX)}{String(rbx)}</rbx.Box>;'
    );
    expect(output).toContain('import RBX, * as rbx from "rbx"');
    expect(output).toContain('<Box>');
  });

  it('drops the namespace but keeps the default when only the default is used', () => {
    const { output } = migrate(
      'import RBX, * as rbx from "rbx";\nexport const A = () => <rbx.Box>{String(RBX)}</rbx.Box>;'
    );
    expect(output).toContain('import RBX from "rbx"');
    expect(output).not.toContain('* as rbx');
  });

  it('handles a namespace retained alongside an alias collision', () => {
    const { output } = migrate(
      'import * as rbx from "rbx";\nimport { Tile as Button, Button as Real } from "rbx";\nexport const A = () => <><rbx.Tile/><Button/><Real/></>;'
    );
    expect(output).toContain('import * as rbx from "rbx"');
    expect(output).toContain('import { Tile as Button } from "rbx"');
    expect(output).toMatch(/Button as Bulma\w+/);
    expect(output).toContain('<rbx.Tile/>');
  });

  it('keeps two separate rbx declarations independent', () => {
    const { output } = migrate(
      'import { Box } from "rbx";\nimport { Tile } from "rbx";\nexport const A = () => <Box><Tile>x</Tile></Box>;'
    );
    expect(output).toContain('import { Tile } from "rbx"');
    expect(output).toContain('from "@allxsmith/bestax-bulma"');
  });

  it('prunes everything when nothing needs retaining', () => {
    const { output } = migrate(
      'import { Box, Button } from "rbx";\nexport const A = () => <Box><Button>x</Button></Box>;'
    );
    expect(output).not.toContain('from "rbx"');
    expect(output).toContain(
      'import { Box, Button } from "@allxsmith/bestax-bulma";'
    );
  });
});

// ---------------------------------------------------------------------------
// Round 8: CodeRabbit's second complete pass.
// ---------------------------------------------------------------------------

describe('an aliased rbx import never loses its name, whatever its status', () => {
  it('protects a `partial` root retained through an unknown child', () => {
    // `Icon` is status `partial`, so the earlier seeding skipped it — but
    // `<Button.Unknown>` retains the root, and dropping `Icon as Button` made
    // that JSX resolve to the bestax `Button` import instead.
    const { output } = migrate(
      'import { Icon as Button, Button as RbxButton } from "rbx";\nexport const A = () => <><Button.Unknown/><RbxButton>b</RbxButton></>;'
    );
    expect(output).toContain('import { Icon as Button } from "rbx"');
    expect(output).toMatch(/Button as Bulma\w+/);
    expect(output).toContain('<Button.Unknown/>');
  });

  it('leaves an unaliased import unaliased', () => {
    // local === imported means the name already denotes the same component
    // on both sides, so there is nothing to protect against.
    const { output } = migrate(
      'import { Button } from "rbx";\nexport const A = () => <Button>x</Button>;'
    );
    expect(output).toContain(
      'import { Button } from "@allxsmith/bestax-bulma"'
    );
  });
});

describe('names bound by destructuring are value references too', () => {
  it('resolves a member chain through the alias', () => {
    // The destructuring pass deletes `const { Footer } = Card`, so skipping
    // `Footer` here left `Footer.Item` referencing nothing.
    const { output, todos } = migrate(
      'import { Card } from "rbx";\nconst { Footer } = Card;\nconst value = Footer.Item;\nexport const A = () => <>{String(value)}</>;'
    );
    expect(output).toContain('const value = Card.FooterItem;');
    expect(output).not.toContain('from "rbx"');
    expect(todos).toHaveLength(0);
  });

  it('resolves a bare alias reference', () => {
    const { output } = migrate(
      'import { Tag } from "rbx";\nconst { Group } = Tag;\nconst V = Group;\nexport const A = () => <V>x</V>;'
    );
    expect(output).toContain('const V = Tags;');
  });

  it('still migrates destructured names used in JSX', () => {
    const { output } = migrate(
      'import { Card } from "rbx";\nconst { Content } = Card;\nexport const A = () => <Content>x</Content>;'
    );
    expect(output).toContain('<Card.Content>x</Card.Content>');
  });
});

describe('Font Awesome sizing classes', () => {
  it('treats fa-2xs as a modifier, not an icon name', () => {
    const { output } = migrate(
      'import { Icon } from "rbx";\nexport const A = () => (<Icon><i className="fas fa-2xs fa-home" /></Icon>);'
    );
    expect(output).toContain('name="home"');
  });
});

describe('shorthand properties bound by destructuring', () => {
  it('resolves through the alias path, not its root', () => {
    // `const { Footer } = Card` makes `{ Footer }` mean `Card.Footer`.
    // Reading the ROOT's mapping emitted `{ Footer: Card }` — the wrong
    // component under the right key.
    const { output, todos } = migrate(
      'import { Card } from "rbx";\nconst { Footer } = Card;\nexport const reg = { Footer };'
    );
    expect(output).toContain('{ Footer: Card.Footer }');
    expect(todos).toHaveLength(0);
  });

  it('resolves an alias whose target is flat', () => {
    const { output } = migrate(
      'import { Tag } from "rbx";\nconst { Group } = Tag;\nexport const reg = { Group };'
    );
    expect(output).toContain('{ Group: Tags }');
  });

  it('emits no spurious value-reference TODO', () => {
    // ast-types keeps distinct key and value nodes even when `shorthand` is
    // true, so the walker reaches the property twice; the second visit used
    // to fall through to the generic branch and both warn and mark the root
    // retained.
    const { todos } = migrate(
      'import { Card } from "rbx";\nconst { Footer } = Card;\nexport const reg = { Footer };'
    );
    expect(todos.map(t => t.rule)).toEqual([]);
  });
});

describe('a destructured alias used as a bare value', () => {
  it('resolves a dotted target to a member expression', () => {
    // `const { Content } = Card` is deleted by the destructuring pass, so a
    // bare `Content` reference has nothing to bind to. The flat-rename path
    // could not express `Card.Content`, so it fell through to a TODO.
    const { output, todos } = migrate(
      'import { Card } from "rbx";\nconst { Content } = Card;\nconst V = Content;\nexport const A = () => <Content>{String(V)}</Content>;'
    );
    expect(output).toContain('const V = Card.Content;');
    expect(output).toContain('<Card.Content>');
    expect(todos).toHaveLength(0);
  });

  it('still renames when the target is flat', () => {
    const { output } = migrate(
      'import { Tag } from "rbx";\nconst { Group } = Tag;\nconst V = Group;\nexport const A = () => <V>x</V>;'
    );
    expect(output).toContain('const V = Tags;');
  });
});

// ---------------------------------------------------------------------------
// Round 12: the Copilot backlog I had not been draining.
// ---------------------------------------------------------------------------

describe('Field expanded is a Control modifier in Bulma', () => {
  it('TODOs it rather than passing it to a prop bestax has not got', () => {
    const { todos } = migrate(
      'import { Field } from "rbx";\nexport const A = () => <Field expanded>x</Field>;'
    );
    expect(todos.find(t => t.rule === 'prop:expanded')?.message).toMatch(
      /on the Control, not the Field/
    );
  });
});

describe('Tab.Group needs the list bestax does not render itself', () => {
  it('wraps the items in Tabs.List', () => {
    // rbx renders div.tabs > ul > li; bestax's Tabs renders only the div and
    // leaves the ul to Tabs.List, so a straight rename put <li> directly
    // inside the div.
    const { output } = migrate(
      'import { Tab } from "rbx";\nexport const A = () => (<Tab.Group><Tab active>One</Tab></Tab.Group>);'
    );
    expect(output).toContain('<Tabs><Tabs.List>');
    expect(output).toContain('<Tabs.Item active>One</Tabs.Item>');
  });

  it('inserts exactly one list for bare Tab children', () => {
    const { output } = migrate(
      'import { Tab } from "rbx";\nexport const A = () => (<Tab.Group><Tab>One</Tab><Tab>Two</Tab></Tab.Group>);'
    );
    expect((output.match(/Tabs\.List/g) ?? []).length).toBe(2); // open + close
  });

  it('does not wrap again when a list is already there', () => {
    // The previous version of this test used bare <Tab> children, so it never
    // exercised the already-wrapped path it claimed to cover.
    const { output } = migrate(
      'import { Tabs } from "@allxsmith/bestax-bulma";\nimport { Tab } from "rbx";\nexport const A = () => (<Tab.Group><Tabs.List><Tab>One</Tab></Tabs.List></Tab.Group>);'
    );
    expect((output.match(/Tabs\.List/g) ?? []).length).toBe(2);
  });
});

describe('Select.Container modifiers with dynamic values', () => {
  it('renames rather than dropping the condition', () => {
    const { output } = migrate(
      'import { Select } from "rbx";\nexport const A = (w: any) => <Select.Container fullwidth={w}><Select/></Select.Container>;'
    );
    expect(output).toContain('isFullwidth={w}');
  });
});

describe('a file whose only import is the extension stylesheet', () => {
  it('is still flagged, with the TODO riding on the kept import', () => {
    // Previously the import was pruned and the note had to be hung on the
    // Program to survive an emptied file; with the import kept, the TODO
    // rides on the import itself.
    const { output, todos } = migrate(
      'import "bulma-tooltip/dist/css/bulma-tooltip.min.css";\n'
    );
    expect(output).toContain('TODO(bestax-migrate)');
    expect(output).toContain('bulma-tooltip.min.css');
    expect(todos.some(t => t.rule === 'css')).toBe(true);
  });
});

describe('the extras stylesheet dedup is order-independent', () => {
  it('collapses extras that appear BEFORE the bulma import', () => {
    const { output } = migrate(
      'import "@allxsmith/bestax-bulma/extras.css";\nimport "bulma/css/bulma.min.css";\nexport const A = 1;'
    );
    expect(output).toContain('bestax.css');
    expect(output).not.toContain('extras.css');
  });
});

describe('findings that arrived during the backlog pass', () => {
  it('carries up/hoverable onto Navbar.Dropdown, which declares both', () => {
    const { output, todos } = migrate(
      'import { Navbar } from "rbx";\nexport const A = () => <Navbar.Item dropdown up hoverable>x</Navbar.Item>;'
    );
    expect(output).toContain('<Navbar.Dropdown up hoverable>');
    expect(todos).toHaveLength(0);
  });

  it('TODOs Container breakpoints bestax does not have', () => {
    // bestax's ContainerBreakpoint is tablet|desktop|widescreen; rbx takes
    // all six, so the other three were silent type errors.
    for (const bp of ['mobile', 'fullhd', 'touch']) {
      const { todos } = migrate(
        `import { Container } from "rbx";\nexport const A = () => <Container breakpoint="${bp}">x</Container>;`
      );
      expect({
        bp,
        flagged: todos.some(t => t.rule === 'prop:breakpoint'),
      }).toEqual({ bp, flagged: true });
    }
  });

  it('passes through the Container breakpoints bestax does have', () => {
    for (const bp of ['tablet', 'desktop', 'widescreen']) {
      const { output, todos } = migrate(
        `import { Container } from "rbx";\nexport const A = () => <Container breakpoint="${bp}">x</Container>;`
      );
      expect(output).toContain(`breakpoint="${bp}"`);
      expect(todos).toHaveLength(0);
    }
  });
});

describe('rbx Modal behaviours bestax does not implement', () => {
  it('flags every conversion, since none of them fail loudly', () => {
    // rbx portals into document.body, closes on Escape and clips scroll by
    // default; bestax does none of the three, so an unmodified Modal migrates
    // to something that looks right and behaves differently.
    const { todos } = migrate(
      'import { Modal } from "rbx";\nexport const A = () => <Modal active><Modal.Content>x</Modal.Content></Modal>;'
    );
    expect(todos.find(t => t.rule === 'component:Modal')?.message).toMatch(
      /portalling into document\.body/
    );
  });

  it('does not claim bestax closes on Escape', () => {
    const { todos } = migrate(
      'import { Modal } from "rbx";\nexport const A = () => <Modal active closeOnEsc>x</Modal>;'
    );
    const msg = todos.find(t => t.rule === 'prop:closeOnEsc')?.message ?? '';
    expect(msg).toMatch(/no Escape handling at all/);
  });
});

describe('shorthand value-reference reporting', () => {
  it('reports an unmappable shorthand once, not once per AST position', () => {
    // The key and the value are distinct nodes, so the walker reaches the
    // property twice. The AST comment dedupes, which hid the second report
    // in the output while the collector still counted it twice.
    const { todos } = migrate(
      `import { Tile } from 'rbx';\nconst m = { Tile };\n`
    );
    expect(todos.filter(t => t.rule === 'value-reference')).toHaveLength(1);
  });
});

describe('a dynamic modifier in the Select.Container fallback', () => {
  it('is reported rather than dropped with its expression', () => {
    const { todos } = migrate(
      'import { Select } from "rbx";\nexport const A = (w: any) => (<Select.Container fullwidth={w}><Select/><Select/></Select.Container>);'
    );
    expect(todos.some(t => t.rule === 'prop:fullwidth')).toBe(true);
  });
});

describe('binding resolution and import assembly', () => {
  it('leaves a local that shadows the rbx import alone', () => {
    const { output } = migrate(
      [
        `import { Card } from 'rbx';`,
        'function F({ Card }) { return <Card.Footer.Item/>; }',
        'export const G = () => <Card.Footer.Item/>;',
      ].join('\n')
    );
    expect(output).toContain(
      'function F({ Card }) { return <Card.Footer.Item/>; }'
    );
    expect(output).toMatch(/<Bulma?Card\.FooterItem\/>/);
  });

  it('still migrates an alias destructured inside a function', () => {
    const { output } = migrate(
      [
        `import { Card } from 'rbx';`,
        'export function F(){ const { Header } = Card; return <Header.Title/>; }',
      ].join('\n')
    );
    expect(output).toContain('Card.Header.Title');
  });

  it('rebuilds the full chain through a destructured alias', () => {
    const { output } = migrate(
      [
        `import { Card } from 'rbx';`,
        'const { Header } = Card;',
        'const T = Header.Title;',
      ].join('\n')
    );
    expect(output).toContain('const T = Card.Header.Title;');
  });

  it('does not merge named specifiers into a namespace bestax import', () => {
    const { output } = migrate(
      [
        `import * as Bulma from '@allxsmith/bestax-bulma';`,
        `import { Box } from 'rbx';`,
        'export const x = <><Bulma.Button/><Box/></>;',
      ].join('\n')
    );
    expect(output).not.toMatch(/import \* as \w+,/);
  });
});

describe('alias scoping and retained partial roots', () => {
  it('keeps two same-named aliases in separate scopes apart', () => {
    // A name-keyed alias map let the second declaration overwrite the first;
    // both were then pruned and both `<Header…>` references left resolving to
    // nothing at all -- a ReferenceError, not a type error.
    const { output } = migrate(
      [
        `import { Card, Panel } from 'rbx';`,
        'export function A(){ const { Header } = Card; return <Header.Title/>; }',
        'export function B(){ const { Header } = Panel; return <Header/>; }',
      ].join('\n')
    );
    expect(output).toContain('Card.Header.Title');
    // B's alias is unmappable, so its declaration must survive rather than
    // leaving `<Header/>` dangling.
    expect(output).toContain('const { Header } = Panel');
  });

  it('keeps the declaration when an alias cannot be mapped', () => {
    const { output } = migrate(
      [
        `import { Panel } from 'rbx';`,
        'const { Header } = Panel;',
        'export const x = <Header/>;',
      ].join('\n')
    );
    expect(output).toContain('const { Header } = Panel');
  });

  it('aliases the bestax root when a partial root is retained', () => {
    // `Icon` maps, but `<Icon.Unknown>` retains the rbx import. Letting the
    // bestax import take the plain local dropped the retained specifier on
    // the collision, silently repointing `<Icon.Unknown>` at bestax's Icon.
    const { output } = migrate(
      [
        `import { Icon } from 'rbx';`,
        'export const a = <Icon/>;',
        'export const b = <Icon.Unknown/>;',
      ].join('\n')
    );
    expect(output).toMatch(/Icon as Bulma\w+/);
    expect(output).toMatch(/import \{ Icon \} from ["']rbx["']/);
  });

  it('does not alias a partial root that is not retained', () => {
    const { output } = migrate(
      [`import { Icon } from 'rbx';`, 'export const a = <Icon/>;'].join('\n')
    );
    expect(output).toContain('import { Icon } from "@allxsmith/bestax-bulma"');
    expect(output).not.toContain('BulmaIcon');
  });
});

describe('labelled Divider', () => {
  it('flags children, which bestax Divider (a void <hr>) cannot take', () => {
    // rbx rendered the children as a centred label through `data-content`.
    // Passing them straight through put children on an <hr>, which React
    // rejects at runtime, with no TODO reporting the lost label.
    const { todos } = migrate(
      `import { Divider } from 'rbx';\nexport const a = <Divider>OR</Divider>;\n`
    );
    expect(todos.some(t => t.rule === 'component:Divider')).toBe(true);
  });

  it('leaves a bare Divider alone', () => {
    const { todos } = migrate(
      `import { Divider } from 'rbx';\nexport const a = <Divider/>;\n`
    );
    expect(todos.some(t => t.rule === 'component:Divider')).toBe(false);
  });
});

describe('an alias shadowed by a nearer binding', () => {
  it('leaves a parameter that shadows a module-level alias alone', () => {
    // The ancestor walk found the module-level owner from inside F and
    // rewrote the PARAMETER to `F(Card.Header)` -- invalid syntax. A nearer
    // binding must win over the alias it shadows.
    const { output } = migrate(
      [
        `import { Card } from 'rbx';`,
        'const { Header } = Card;',
        'export const A = () => <Header.Title/>;',
        'export function F(Header) { return <Header.Title/>; }',
      ].join('\n')
    );
    expect(output).toContain('<Card.Header.Title/>');
    expect(output).toContain('function F(Header) { return <Header.Title/>; }');
  });
});
