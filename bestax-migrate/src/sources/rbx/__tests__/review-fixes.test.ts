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

describe('dropped extension stylesheets are visible in the file', () => {
  it('leaves a TODO comment, not only a report entry', () => {
    // The comment cannot ride on the pruned import, nor on a sibling import
    // that the rewrite replaces — it has to be flushed after the import block
    // settles.
    const { output, todos } = migrate(
      'import "bulma-tooltip/dist/css/bulma-tooltip.min.css";\nimport { Box } from "rbx";\nexport const A = () => <Box />;'
    );
    expect(output).toContain('TODO(bestax-migrate)');
    expect(output).toContain('bulma-tooltip');
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
    expect(output).toContain('<Navbar.Dropdown>');
    expect(codeOf(output)).not.toMatch(/\bup\b/);
    expect(todos.some(t => t.rule === 'prop:up')).toBe(true);
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
