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
