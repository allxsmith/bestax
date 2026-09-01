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
