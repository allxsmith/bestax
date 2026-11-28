/**
 * What a kept library import, and the manifest step's report about one, say
 * about why the import stays (#2349). The reason is often not that bestax
 * lacks the component, so neither names one: the import points at the other
 * TODOs in the file, and the report asks for every remaining import of the
 * library to be migrated.
 */

import rbcTransform from '../../react-bulma-components/transform.js';
import rbxTransform from '../../rbx/transform.js';
import bloomerTransform from '../../bloomer/transform.js';
import { reactBulmaComponents } from '../../react-bulma-components/index.js';
import { rbx } from '../../rbx/index.js';
import { bloomer } from '../../bloomer/index.js';
import { runTransform } from '../../../runner.js';
import type { MigrationSource, TodoEntry, Transform } from '../../../types.js';

const note = (names: string, verb: 'is' | 'are') =>
  `// TODO(bestax-migrate): ${names} ${verb} still imported for what the other TODOs in this file flag; resolve those, then remove this import`;

function migrate(
  transform: Transform,
  source: string,
  options: Record<string, unknown> = {}
): string {
  return (
    runTransform(
      transform,
      '/app/src/case.tsx',
      source,
      { add: () => {} },
      options
    ).output ?? source
  );
}

describe('the note on a kept library import', () => {
  it('names no reason where bestax has the component', () => {
    // A member the table doesn't know keeps a root bestax has.
    for (const [transform, library] of [
      [rbxTransform, 'rbx'],
      [rbcTransform, 'react-bulma-components'],
    ] as const) {
      const output = migrate(
        transform,
        `import { Icon } from '${library}';\nexport const A = () => <><Icon /><Icon.Unknown /></>;\n`
      );
      expect(output).toContain(
        `${note('Icon', 'is')}\nimport { Icon } from '${library}';`
      );
      expect(output).not.toContain('no bestax-bulma equivalent');
    }
    // bloomer's PageEllipsis stays for its `className` until a release the
    // project may not get.
    const output = migrate(
      bloomerTransform,
      'import { Pagination, PageList, PageEllipsis } from \'bloomer\';\nexport const A = () => <Pagination><PageList><PageEllipsis className="x" /></PageList></Pagination>;\n',
      { bestaxPackages: [{ dir: '/app', floor: '5.70.0', written: true }] }
    );
    expect(output).toContain(note('PageEllipsis', 'is'));
    expect(output).not.toContain('no bestax-bulma equivalent');
  });

  it('lists the names that import keeps, and only those', () => {
    const output = migrate(
      rbcTransform,
      "import { Element, Tile } from 'react-bulma-components';\nexport const A = () => <Tile><Element /></Tile>;\n"
    );
    expect(output).toContain(note('Element, Tile', 'are'));
    // Two imports each name their own; a default binding names none.
    const split = migrate(
      rbxTransform,
      "import RBX from 'rbx';\nimport { Tile } from 'rbx';\nimport { List } from 'rbx';\nexport const A = () => <Tile><List />{String(RBX)}</Tile>;\n"
    );
    expect(split).toContain(
      `${note('Tile', 'is')}\nimport { Tile } from 'rbx';`
    );
    expect(split).toContain(
      `${note('List', 'is')}\nimport { List } from 'rbx';`
    );
    expect(split).not.toMatch(/still imported for[^\n]*\nimport RBX/);
    // A namespace import leaves out what a named import of the library names.
    const both = migrate(
      rbxTransform,
      "import * as R from 'rbx';\nimport { Tile } from 'rbx';\nexport const keys = Object.keys(R);\nexport const A = () => <><Tile /><R.List /></>;\n"
    );
    expect(both).toContain(`${note('List', 'is')}\nimport * as R from 'rbx';`);
    expect(both).toContain(
      `${note('Tile', 'is')}\nimport { Tile } from 'rbx';`
    );
  });

  it('leaves a TODO the codemod did not write', () => {
    const own =
      '// TODO(bestax-migrate): keep until the v2 page ships, then remove this import';
    const output = migrate(
      rbxTransform,
      `${own}\nimport { Tile } from 'rbx';\nexport const A = () => <Tile />;\n`
    );
    expect(output).toContain(own);
    expect(output).toContain(note('Tile', 'is'));
  });

  it('is left off an import kept for no name, rather than listing none', () => {
    // react-bulma-components wrote `TODO(bestax-migrate):  have no …` here.
    const output = migrate(
      rbcTransform,
      "import * as RBC from 'react-bulma-components';\nexport const parts = Object.keys(RBC);\nexport const A = () => <RBC.Box>x</RBC.Box>;\n"
    );
    expect(output).toContain("import * as RBC from 'react-bulma-components';");
    expect(output).not.toMatch(
      /TODO\(bestax-migrate\):[^\n]*\nimport \* as RBC/
    );
  });

  it('replaces the note an earlier run wrote, and goes with the import', () => {
    for (const earlier of [
      '// TODO(bestax-migrate): Tile has no bestax-bulma equivalent yet — migrate and remove this import\n',
      // react-bulma-components wrote this with no names at all.
      '// TODO(bestax-migrate):  have no bestax-bulma equivalent yet — migrate and remove this import\n',
    ]) {
      const kept = migrate(
        rbxTransform,
        `${earlier}import { Tile } from 'rbx';\nexport const A = () => <Tile />;\n`
      );
      expect(kept.match(/TODO\(bestax-migrate\):[^\n]*import\n/g)).toHaveLength(
        1
      );
      expect(kept).toContain(note('Tile', 'is'));
    }
    // A re-run leaves a kept import's comments as the first run wrote them.
    const once = migrate(
      rbxTransform,
      "import { Tile, Box } from 'rbx'; // keep\nexport const A = () => <Box><Tile /></Box>;\n"
    );
    expect(migrate(rbxTransform, once)).toBe(once);
    // Once nothing is kept the note is about nothing, so the import takes it.
    const converted = migrate(
      rbxTransform,
      `${note('Box', 'is')}\nimport { Box } from 'rbx';\nexport const A = () => <Box />;\n`
    );
    expect(converted).not.toContain('still imported for');
    expect(converted).not.toContain("'rbx'");
  });
});

describe('the report when the library goes while files still import it', () => {
  it('says the files still import it, in every library source', () => {
    for (const [source, name] of [
      [reactBulmaComponents, 'react-bulma-components'],
      [rbx, 'rbx'],
      [bloomer, 'bloomer'],
    ] as [MigrationSource, string][]) {
      const todos: TodoEntry[] = [];
      source.updateDependencies!(
        'package.json',
        { dependencies: { [name]: '1.0.0' } },
        { add: e => todos.push(e) },
        { cssMode: 'bestax', sourceStillImported: true }
      );
      const messages = todos.map(t => t.message).join('\n');
      expect(messages).toContain(
        `${name} was removed from package.json, but some files still import it, and installing would leave those imports unresolved: migrate every remaining import of ${name} (the ones the codemod kept are marked \`TODO(bestax-migrate)\`) before installing, or re-add ${name} until you have`
      );
      expect(messages).not.toContain('no bestax equivalent');
    }
  });
});
