/**
 * Fixture-pair tests: every __testfixtures__/<case>.input.tsx must transform
 * into the committed <case>.output.tsx byte-for-byte (modulo trailing
 * whitespace). Fixtures are read as text — bloomer is never installed in this
 * repository.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import transform from '../transform.js';
import { runTransform } from '../../../runner.js';
import type { TodoEntry } from '../../../types.js';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '__testfixtures__'
);

const cases = fs
  .readdirSync(fixturesDir)
  .filter(file => file.endsWith('.input.tsx'))
  .map(file => file.replace(/\.input\.tsx$/, ''))
  .sort();

function migrate(source: string, cssMode?: 'bestax' | 'bulma' | 'keep') {
  const todos: TodoEntry[] = [];
  const { output } = runTransform(
    transform,
    'case.tsx',
    source,
    { add: entry => todos.push(entry) },
    cssMode ? { cssMode } : {}
  );
  return { output: output ?? '', todos, rules: todos.map(t => t.rule) };
}

describe('bloomer transform fixtures', () => {
  it('has at least one fixture pair', () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  test.each(cases)('%s', name => {
    const input = fs.readFileSync(
      path.join(fixturesDir, `${name}.input.tsx`),
      'utf8'
    );
    const expected = fs.readFileSync(
      path.join(fixturesDir, `${name}.output.tsx`),
      'utf8'
    );
    const todos: TodoEntry[] = [];
    const { output } = runTransform(transform, `${name}.input.tsx`, input, {
      add: entry => todos.push(entry),
    });
    expect((output ?? input).trimEnd()).toBe(expected.trimEnd());
  });

  it('returns null for files without bloomer imports', () => {
    const source =
      "import { Button } from 'other-library';\nexport const A = () => <Button />;\n";
    const { output } = runTransform(transform, 'untouched.tsx', source);
    expect(output).toBeNull();
  });
});

describe('bloomer imports', () => {
  it('flags default imports from bloomer and keeps the binding', () => {
    const { output, rules } = migrate(
      "import Bloomer from 'bloomer';\nexport const A = () => <Bloomer.Box />;\n"
    );
    expect(rules).toContain('imports');
    expect(output).toContain("import Bloomer from 'bloomer'");
  });

  it('rewrites namespace imports element by element', () => {
    const { output, rules } = migrate(
      "import * as B from 'bloomer';\nexport const A = () => <B.CardHeaderTitle>x</B.CardHeaderTitle>;\n"
    );
    expect(output).toContain('<Card.Header.Title>x</Card.Header.Title>');
    expect(output).toContain('import { Card } from "@allxsmith/bestax-bulma"');
    expect(output).not.toContain("from 'bloomer'");
    expect(rules).toEqual([]);
  });

  it('keeps a namespace import that a retained component still needs', () => {
    const { output, rules } = migrate(
      "import * as B from 'bloomer';\nexport const A = () => <B.Tile>x</B.Tile>;\n"
    );
    expect(output).toContain("import * as B from 'bloomer'");
    expect(rules).toContain('component:Tile');
  });

  it('flags deep imports into bloomer internals', () => {
    const { output, rules } = migrate(
      "import Box from 'bloomer/lib/elements/Box';\nexport const A = () => <Box />;\n"
    );
    expect(rules).toContain('imports');
    expect(output).toContain("from 'bloomer/lib/elements/Box'");
  });

  it('merges into an existing named bestax import', () => {
    const { output } = migrate(
      "import { Title } from '@allxsmith/bestax-bulma';\nimport { Box } from 'bloomer';\nexport const A = () => <Box><Title>x</Title></Box>;\n"
    );
    expect(output).toMatch(
      /import \{ Title, Box \} from ['"]@allxsmith\/bestax-bulma['"]/
    );
    expect(output).not.toContain("from 'bloomer'");
  });

  it('never merges a component into a type-only bestax import', () => {
    const { output } = migrate(
      "import type { TitleProps } from '@allxsmith/bestax-bulma';\nimport { Box } from 'bloomer';\nexport const A = (p: TitleProps) => <Box />;\n"
    );
    expect(output).toContain(
      "import type { TitleProps } from '@allxsmith/bestax-bulma';"
    );
    expect(output).toContain('import { Box } from "@allxsmith/bestax-bulma";');
  });

  it('turns an inline type specifier into the value import it needs', () => {
    const { output } = migrate(
      "import { Title, type Box } from '@allxsmith/bestax-bulma';\nimport { Box as BloomerBox } from 'bloomer';\nexport const A = (b: Box) => <><Title>x</Title><BloomerBox /></>;\n"
    );
    expect(output).toMatch(
      /import \{ Title, Box \} from ['"]@allxsmith\/bestax-bulma['"]/
    );
    expect(output).toContain('(b: Box) => <><Title>x</Title><Box /></>');
    expect(output).not.toContain('type Box');
  });

  it('leaves an unused inline type specifier alone', () => {
    const { output } = migrate(
      "import { Button, type ButtonProps } from '@allxsmith/bestax-bulma';\nimport { Box } from 'bloomer';\nexport const A = (p: ButtonProps) => <Box>{p.children}</Box>;\n"
    );
    expect(output).toMatch(/import \{ Button, type ButtonProps, Box \} from/);
  });

  it('re-exports keep their public name, or are flagged', () => {
    const { output, rules } = migrate(
      "import { CardHeader, Subtitle, Button } from 'bloomer';\nexport { CardHeader, Button };\nexport { Subtitle as Sub };\nexport { Subtitle };\n"
    );
    expect(rules).toEqual(['value-reference']);
    expect(output).toContain('export { CardHeader, Button };');
    expect(output).toContain('export { SubTitle as Sub };');
    expect(output).toContain('export { SubTitle as Subtitle };');
    expect(output).toContain("import { CardHeader } from 'bloomer'");
  });

  it('never rewrites a member name that merely matches an import', () => {
    const source =
      "import { CardHeader } from 'bloomer';\nconst reg = { CardHeader() { return 1; } };\ninterface P { CardHeader: string }\nenum E { CardHeader }\nclass C { CardHeader = 1; }\nexport const A = () => <CardHeader>{reg.CardHeader()}</CardHeader>;\nexport type { P, E, C };\n";
    const { output, rules } = migrate(source);
    expect(rules).toEqual([]);
    expect(output).toContain('const reg = { CardHeader() { return 1; } };');
    expect(output).toContain('interface P { CardHeader: string }');
    expect(output).toContain('enum E { CardHeader }');
    expect(output).toContain('class C { CardHeader = 1; }');
    expect(output).toContain('<Card.Header>{reg.CardHeader()}</Card.Header>');
  });

  it('carries the comments of a pruned import onto its replacement', () => {
    const { output } = migrate(
      "/* Copyright 2018 Acme. MIT licensed. */\n// eslint-disable-next-line import/no-unresolved\nimport { Box } from 'bloomer';\nexport const A = () => <Box />;\n"
    );
    expect(output).toMatch(
      /^\/\* Copyright 2018 Acme\. MIT licensed\. \*\/\n\/\/ eslint-disable-next-line import\/no-unresolved\nimport \{ Box \} from "@allxsmith\/bestax-bulma";/
    );
  });

  it('flags a barrel re-export and a destructured namespace', () => {
    const barrel = migrate(
      "export { Button } from 'bloomer';\nexport * from 'bloomer';\n"
    );
    expect(barrel.rules).toEqual(['imports', 'imports']);
    expect(barrel.output).toContain("export { Button } from 'bloomer';");
    const destructured = migrate(
      "import * as B from 'bloomer';\nconst { Box, Title } = B;\nexport const A = () => <Box><Title>x</Title></Box>;\n"
    );
    expect(destructured.rules).toEqual(['value-reference']);
    expect(destructured.output).toContain("import * as B from 'bloomer'");
  });

  it('does not count a type-only local as a runtime collision', () => {
    const { output, rules } = migrate(
      "import { type Box } from '@allxsmith/bestax-bulma';\nimport { Tile } from 'bloomer';\nexport type B = Box;\nexport const A = () => <Tile />;\n"
    );
    expect(rules).toEqual(['component:Tile']);
    expect(output).toContain(
      "import { type Box } from '@allxsmith/bestax-bulma';"
    );
    expect(output).toContain("import { Tile } from 'bloomer';");
  });

  it('keeps the comments of a pruned import that ends the file, or is alone', () => {
    const last = migrate(
      "import React from 'react';\n// keep me\nimport { Box } from 'bloomer';\n"
    );
    expect(last.output).toContain('// keep me');
    expect(last.output).not.toContain("from 'bloomer'");
    const only = migrate("// only me\nimport { Box } from 'bloomer';\n");
    expect(only.output).toContain('// only me');
  });

  it('aliases a bestax import whose name the file already binds', () => {
    const { output } = migrate(
      "import { CardHeaderTitle } from 'bloomer';\nconst Card = () => null;\nexport const A = () => <><Card /><CardHeaderTitle>x</CardHeaderTitle></>;\n"
    );
    expect(output).toContain('import { Card as BulmaCard }');
    expect(output).toContain(
      '<BulmaCard.Header.Title>x</BulmaCard.Header.Title>'
    );
  });

  it('keeps a component referenced as a value on the bestax import', () => {
    const { output, rules } = migrate(
      "import { Box, Title } from 'bloomer';\nconst Wrapper = Box;\nexport const A = () => <Title as={Wrapper as never}>x</Title>;\n"
    );
    expect(output).toContain('const Wrapper = Box;');
    expect(output).toMatch(/import \{ Box, Title \} from/);
    expect(rules).toEqual([]);
  });
});

describe('bloomer value references', () => {
  it('rewrites a namespace member used as a value', () => {
    const { output, rules } = migrate(
      "import * as B from 'bloomer';\nconst Wrapped = B.CardHeaderTitle;\nexport const A = () => <Wrapped />;\n"
    );
    expect(rules).toEqual([]);
    expect(output).toContain('const Wrapped = Card.Header.Title;');
    expect(output).toContain('import { Card } from "@allxsmith/bestax-bulma"');
    expect(output).not.toContain("from 'bloomer'");
  });

  it('keeps a namespace binding that is used bare, and says so', () => {
    const { output, rules } = migrate(
      "import * as B from 'bloomer';\nexport const keys = Object.keys(B);\nexport const A = () => <B.Box />;\n"
    );
    expect(rules).toEqual(['value-reference']);
    expect(output).toContain("import * as B from 'bloomer'");
    expect(output).toContain('<Box />');
  });

  it('expands a shorthand property so the public key survives', () => {
    const { output } = migrate(
      "import { Subtitle } from 'bloomer';\nexport const parts = { Subtitle };\n"
    );
    expect(output).toContain('{ Subtitle: SubTitle }');
    expect(output).toMatch(/import \{ SubTitle \} from/);
  });

  it('renames a flat component used as a value onto its dotted target', () => {
    const { output } = migrate(
      "import { HeroFooter, Tabs } from 'bloomer';\nexport const parts = [HeroFooter, Tabs];\n"
    );
    expect(output).toContain('[Hero.Foot, Tabs]');
    expect(output).toMatch(/import \{ Hero, Tabs \} from/);
  });

  it('flags a member chain hung off a flat component and retains the import', () => {
    const { output, rules } = migrate(
      "import { Box } from 'bloomer';\nexport const x = Box.displayName;\nexport const A = () => <Box />;\n"
    );
    expect(rules).toEqual(['value-reference']);
    expect(output).toContain('import { Box as BulmaBox }');
    expect(output).toContain('<BulmaBox />');
    expect(output).toContain("import { Box } from 'bloomer'");
  });

  it('renames a value reference of a component whose special keeps its target', () => {
    const { output, rules } = migrate(
      'import { Icon } from \'bloomer\';\nconst Old = Icon;\nexport const A = () => <Icon className="fas fa-home" />;\n'
    );
    expect(rules).toEqual([]);
    expect(output).toContain('const Old = Icon;');
    expect(output).toMatch(/import \{ Icon \} from "@allxsmith\/bestax-bulma"/);
    expect(output).not.toContain("from 'bloomer'");
  });

  it('reserves the local of a target-less special used as a value', () => {
    const { output, rules } = migrate(
      "import { PageControl, Pagination } from 'bloomer';\nconst Prev = PageControl;\nexport const A = () => <Pagination><PageControl>p</PageControl></Pagination>;\n"
    );
    expect(rules).toEqual(['value-reference']);
    expect(output).toContain("import { PageControl } from 'bloomer'");
    expect(output).toContain('<Pagination.Previous>p</Pagination.Previous>');
  });

  it('flags a retained component used as a value', () => {
    const { output, rules } = migrate(
      "import { Tile } from 'bloomer';\nexport const T = Tile;\n"
    );
    expect(rules).toEqual(['value-reference']);
    expect(output).toContain("import { Tile } from 'bloomer'");
  });

  it('leaves a local that shadows the import alone, and aliases the rest', () => {
    const { output } = migrate(
      "import React from 'react';\nimport { Box } from 'bloomer';\nexport const A = ({ Box }: { Box: React.FC }) => <Box />;\nexport const B = () => <Box />;\nexport const W = Box;\n"
    );
    // The parameter's JSX and the import's JSX resolve to different bindings.
    expect(output).toContain('({ Box }: { Box: React.FC }) => <Box />');
    expect(output).toContain('export const B = () => <BulmaBox />');
    expect(output).toContain('export const W = BulmaBox;');
    expect(output).toContain('import { Box as BulmaBox }');
  });

  it('ignores identifiers in property positions', () => {
    const { output, rules } = migrate(
      "import { Box } from 'bloomer';\nexport const o = { Box: 1, y: (p: { Box: number }) => p.Box };\nexport const A = () => <Box />;\n"
    );
    expect(rules).toEqual([]);
    expect(output).toContain('{ Box: 1, y: (p: { Box: number }) => p.Box }');
  });

  it('expands a shorthand property onto a dotted target', () => {
    const { output } = migrate(
      "import { HeroFooter } from 'bloomer';\nexport const parts = { HeroFooter };\n"
    );
    expect(output).toContain('{ HeroFooter: Hero.Foot }');
  });

  it('flags a shorthand property of a retained component once', () => {
    const { output, rules } = migrate(
      "import { Tile } from 'bloomer';\nexport const parts = { Tile };\n"
    );
    expect(rules).toEqual(['value-reference']);
    expect(output).toContain("import { Tile } from 'bloomer'");
  });

  it('flags a deeper member chain hung off a namespace', () => {
    const { output, rules } = migrate(
      "import * as B from 'bloomer';\nexport const n = B.Box.displayName.length;\n"
    );
    expect(rules).toEqual(['value-reference']);
    expect(output).toContain("import * as B from 'bloomer'");
  });

  it('flags an unknown namespace member', () => {
    const { rules } = migrate(
      "import * as B from 'bloomer';\nexport const A = () => <B.Nope />;\n"
    );
    expect(rules).toEqual(['unknown-component']);
  });

  it('aliases an unmappable import whose local name bestax wants', () => {
    const { output, rules } = migrate(
      "import { Tile as Button, Button as Btn } from 'bloomer';\nexport const A = () => <><Button /><Btn /></>;\n"
    );
    expect(rules).toEqual(['component:Tile']);
    expect(output).toContain('import { Button as BulmaButton }');
    expect(output).toContain('<BulmaButton />');
    expect(output).toContain("import { Tile as Button } from 'bloomer'");
  });
});

describe('bloomer stylesheet imports', () => {
  const app = (css: string) =>
    `import { Box } from 'bloomer';\nimport '${css}';\nexport const A = () => <Box />;\n`;

  it('adopts the combined bestax bundle by default', () => {
    const { output } = migrate(app('bulma/css/bulma.min.css'));
    expect(output).toContain('import "@allxsmith/bestax-bulma/bestax.css"');
    expect(output).not.toContain('bulma/css/bulma.min.css');
  });

  it('prunes a Bulma import when the bestax bundle is already imported', () => {
    const { output } = migrate(
      "import { Box } from 'bloomer';\nimport '@allxsmith/bestax-bulma/bestax.css';\nimport 'bulma/css/bulma.css';\nexport const A = () => <Box />;\n"
    );
    expect(output).not.toContain('bulma/css/bulma.css');
    expect(output.match(/bestax\.css/g)).toHaveLength(1);
  });

  it('drops a separate extras import once the bundle covers it', () => {
    const { output } = migrate(
      "import { Box } from 'bloomer';\nimport '@allxsmith/bestax-bulma/extras.css';\nimport 'bulma/css/bulma.css';\nexport const A = () => <Box />;\n"
    );
    expect(output).toContain('import "@allxsmith/bestax-bulma/bestax.css"');
    expect(output).not.toContain('extras.css');
  });

  it('keeps plain Bulma and adds the extras under --css bulma', () => {
    const { output } = migrate(app('bulma/css/bulma.css'), 'bulma');
    expect(output).toContain("import 'bulma/css/bulma.css'");
    expect(output).toContain('import "@allxsmith/bestax-bulma/extras.css"');
  });

  it('touches nothing under --css keep', () => {
    const { output } = migrate(app('bulma/css/bulma.css'), 'keep');
    expect(output).toContain("import 'bulma/css/bulma.css'");
    expect(output).not.toContain('extras.css');
  });
});
