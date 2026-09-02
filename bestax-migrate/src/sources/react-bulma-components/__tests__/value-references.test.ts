/**
 * Value-reference regressions found by review of the rbx source: three
 * defects the rbx transform had already been fixed for, which this source
 * still carried. Each produced a silent break — a chain bestax does not
 * expose, a stranded import, or a renamed object key — with no TODO to warn
 * the user, and none of the 17 fixture pairs reached the code path.
 */

import transform from '../transform.js';
import { runTransform } from '../../../runner.js';
import type { TodoEntry } from '../../../types.js';

function migrate(source: string) {
  const todos: TodoEntry[] = [];
  const { output } = runTransform(transform, 'c.tsx', source, {
    add: entry => todos.push(entry),
  });
  return { output: output ?? source, todos };
}

describe('member-expression value references', () => {
  it('resolves the whole chain, not just its first valid prefix', () => {
    // `Card.Footer` resolves on its own, so stopping there left the tail
    // `.Item` pointing at a compound bestax has no such thing as.
    const { output } = migrate(
      `import { Card } from 'react-bulma-components';\nconst C = Card.Footer.Item;\n`
    );
    expect(output).toContain('const C = Card.FooterItem;');
    expect(output).not.toContain('Card.Footer.Item');
  });

  it('rewrites a flat target across the whole chain', () => {
    const { output } = migrate(
      `import { Icon } from 'react-bulma-components';\nconst C = Icon.Text;\n`
    );
    expect(output).toContain('const C = IconText;');
  });

  it('maps a namespace member instead of stranding the import', () => {
    // `const C = RBC.Box` used to be treated as an opaque namespace value:
    // the reference stayed, the import was retained, and dependency migration
    // then removed the package out from under it.
    const { output } = migrate(
      `import * as RBC from 'react-bulma-components';\nconst C = RBC.Box;\n`
    );
    expect(output).toContain('from "@allxsmith/bestax-bulma"');
    expect(output).toContain('const C = Box;');
    expect(output).not.toContain('RBC.Box');
    expect(output).not.toContain("'react-bulma-components'");
  });

  it('still pins the import for a bare namespace reference', () => {
    const { output } = migrate(
      `import * as RBC from 'react-bulma-components';\nconsole.log(RBC);\n`
    );
    expect(output).toContain("'react-bulma-components'");
  });

  it('flags an unmappable namespace member rather than rewriting it', () => {
    const { todos } = migrate(
      `import * as RBC from 'react-bulma-components';\nconst C = RBC.NotAThing;\n`
    );
    expect(todos.some(t => t.rule === 'value-reference')).toBe(true);
  });
});

describe('object shorthand properties', () => {
  it('expands rather than renaming the object key', () => {
    // `{ Textarea }` became `{ TextArea }`, silently changing the object's
    // public shape: every `m.Textarea` caller started reading undefined.
    const { output } = migrate(
      `import { Form } from 'react-bulma-components';\nconst { Textarea } = Form;\nconst m = { Textarea };\n`
    );
    expect(output).toContain('{ Textarea: TextArea }');
  });

  it('expands a shorthand whose alias maps to a renamed component', () => {
    const { output } = migrate(
      `import { Button } from 'react-bulma-components';\nconst { Group } = Button;\nconst m = { Group };\n`
    );
    expect(output).toContain('{ Group: Buttons }');
  });

  it('resolves the shorthand through its alias path, not the root', () => {
    // Reading the root's mapping here emitted `{ Footer: Card }` — the wrong
    // component under the right key.
    const { output } = migrate(
      `import { Card } from 'react-bulma-components';\nconst { Footer } = Card;\nconst m = { Footer };\n`
    );
    expect(output).toContain('{ Footer: Card.Footer }');
  });

  it('leaves a shorthand alone when the name needs no rewrite', () => {
    const { output } = migrate(
      `import { Box } from 'react-bulma-components';\nconst m = { Box };\n`
    );
    expect(output).toContain('{ Box }');
  });

  it('emits exactly one TODO for an unmappable shorthand', () => {
    // The key and value are distinct nodes, so the walker reaches the
    // property twice; without the handled-set the second visit emitted a
    // spurious second TODO and retained a root that needed no retaining.
    const { todos } = migrate(
      `import { Tile } from 'react-bulma-components';\nconst m = { Tile };\n`
    );
    expect(todos.filter(t => t.rule === 'value-reference')).toHaveLength(1);
  });

  it('does not touch a non-shorthand key that merely shares the name', () => {
    const { output } = migrate(
      `import { Box } from 'react-bulma-components';\nconst m = { Box: 1 };\n`
    );
    expect(output).toContain('{ Box: 1 }');
  });
});

describe('binding resolution', () => {
  it('leaves a local that shadows the import alone', () => {
    // Resolving by identifier text rewrote a shadowing parameter as though it
    // were the library's component, repointing the code at a different
    // object -- and renamed the destructured parameter alongside it.
    const { output } = migrate(
      [
        `import { Card } from 'react-bulma-components';`,
        'function F({ Card }) { return <Card.Footer.Item/>; }',
        'export const G = () => <Card.Footer.Item/>;',
      ].join('\n')
    );
    expect(output).toContain(
      'function F({ Card }) { return <Card.Footer.Item/>; }'
    );
    // The module-level reference still migrates.
    expect(output).toMatch(/<Bulma?Card\.FooterItem\/>/);
  });

  it('leaves a shadowing local const alone', () => {
    const { output } = migrate(
      [
        `import { Box } from 'react-bulma-components';`,
        'function F() { const Box = 1; return Box; }',
        'export const G = () => <Box/>;',
      ].join('\n')
    );
    expect(output).toContain('const Box = 1;');
  });

  it('still migrates an alias destructured inside a function', () => {
    // The alias pass walks declarators at any depth, so the scope guard must
    // compare against the scope the alias was collected in, not the module.
    const { output } = migrate(
      [
        `import { Card } from 'react-bulma-components';`,
        'export function F(){ const { Header } = Card; return <Header.Title/>; }',
      ].join('\n')
    );
    expect(output).toContain('Card.Header.Title');
  });

  it('rebuilds the full chain through a destructured alias', () => {
    // The equal-target branch renamed `Header` to `Card`, so `Header.Title`
    // collapsed to `Card.Title` -- a segment silently dropped.
    const { output } = migrate(
      [
        `import { Card } from 'react-bulma-components';`,
        'const { Header } = Card;',
        'const T = Header.Title;',
      ].join('\n')
    );
    expect(output).toContain('const T = Card.Header.Title;');
  });
});

describe('bestax import assembly', () => {
  it('does not merge named specifiers into a namespace import', () => {
    // `import * as Bulma, { Box } from ...` is not valid JavaScript, so the
    // whole file stopped parsing after a migration that reported success.
    const { output } = migrate(
      [
        `import * as Bulma from '@allxsmith/bestax-bulma';`,
        `import * as RBC from 'react-bulma-components';`,
        'const C = RBC.Box;',
        'export const x = <Bulma.Button/>;',
      ].join('\n')
    );
    expect(output).not.toMatch(/import \* as \w+,/);
    expect(output).toContain('const C = Box;');
  });

  it('still merges into an existing all-named bestax import', () => {
    const { output } = migrate(
      [
        `import { Button } from '@allxsmith/bestax-bulma';`,
        `import { Box } from 'react-bulma-components';`,
        'export const x = <><Button/><Box/></>;',
      ].join('\n')
    );
    expect(output.match(/from ["']@allxsmith\/bestax-bulma["']/g)).toHaveLength(
      1
    );
  });
});

describe('alias scoping and retained partial roots', () => {
  it('keeps two same-named aliases in separate scopes apart', () => {
    const { output } = migrate(
      [
        `import { Card, Panel } from 'react-bulma-components';`,
        'export function A(){ const { Header } = Card; return <Header.Title/>; }',
        'export function B(){ const { Header } = Panel; return <Header/>; }',
      ].join('\n')
    );
    expect(output).toContain('Card.Header.Title');
    expect(output).toContain('Panel.Heading');
  });

  it('aliases the bestax root when a partial root is retained', () => {
    const { output } = migrate(
      [
        `import { Icon } from 'react-bulma-components';`,
        'export const a = <Icon/>;',
        'export const b = <Icon.Unknown/>;',
      ].join('\n')
    );
    expect(output).toMatch(/Icon as Bulma\w+/);
    expect(output).toMatch(
      /import \{ Icon \} from ["']react-bulma-components["']/
    );
  });
});

describe('an alias shadowed by a nearer binding', () => {
  it('leaves a parameter that shadows a module-level alias alone', () => {
    const { output } = migrate(
      [
        `import { Card } from 'react-bulma-components';`,
        'const { Header } = Card;',
        'export const A = () => <Header.Title/>;',
        'export function F(Header) { return <Header.Title/>; }',
      ].join('\n')
    );
    expect(output).toContain('<Card.Header.Title/>');
    expect(output).toContain('function F(Header) { return <Header.Title/>; }');
  });
});
