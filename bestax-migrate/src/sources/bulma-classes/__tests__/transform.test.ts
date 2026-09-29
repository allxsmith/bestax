/**
 * Fixture pairs: every __testfixtures__/<case>.input.tsx must transform into
 * the committed <case>.output.tsx exactly (modulo trailing whitespace), and a
 * second run over the output must change nothing. That the two render the
 * same HTML is `e2e/bulma-classes-fixtures-render.test.ts`'s job.
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

function migrate(
  source: string,
  options: Record<string, unknown> = {},
  file = 'case.tsx'
): { output: string | null; rules: string[] } {
  const todos: TodoEntry[] = [];
  const { output } = runTransform(
    transform,
    file,
    source,
    { add: entry => todos.push(entry) },
    options
  );
  return { output, rules: todos.map(todo => todo.rule) };
}

describe('bulma-classes transform fixtures', () => {
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
    const { output } = migrate(input);
    expect((output ?? input).trimEnd()).toBe(expected.trimEnd());
    // Converted elements are components now, and a refusal's TODO is
    // already there, so a second run has nothing left to do.
    expect(migrate(expected).output).toBeNull();
  });
});

describe('scope', () => {
  it('returns null for a file with no Bulma classes', () => {
    expect(
      migrate('export const A = () => <div className="app">x</div>;\n').output
    ).toBeNull();
  });

  it('leaves custom elements and components alone', () => {
    const source =
      'export const A = () => (\n  <>\n    <my-card className="box" />\n    <Box className="box" />\n  </>\n);\n';
    expect(migrate(source).output).toBeNull();
  });

  it("keeps the app's Bulma stylesheet by default", () => {
    expect(migrate("import 'bulma/css/bulma.min.css';\n").output).toBeNull();
  });

  it('rewrites a Bulma stylesheet import under --css bestax, even with no markup', () => {
    const { output } = migrate("import 'bulma/css/bulma.min.css';\n", {
      cssMode: 'bestax',
    });
    expect(output).toContain('@allxsmith/bestax-bulma/bestax.css');
  });
});

describe('file-level gates', () => {
  const box = 'export const A = () => <div className="box">x</div>;\n';

  it('leaves a non-React JSX runtime alone, with one TODO', () => {
    const { output, rules } = migrate(`/** @jsxImportSource preact */\n${box}`);
    expect(rules).toEqual(['jsx-runtime']);
    expect(output).toContain('<div className="box">');
    expect(output).not.toContain('@allxsmith/bestax-bulma');
  });

  it('converts under a React-compatible runtime', () => {
    const { output, rules } = migrate(
      `/** @jsxImportSource @emotion/react */\n${box}`
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<Box>');
  });

  it.each([
    [
      'require',
      'const React = require(\'react\');\nconst A = () => <div className="box">x</div>;\nmodule.exports = { A };\n',
    ],
    [
      'exports.',
      'const A = () => <div className="box">x</div>;\nexports.A = A;\n',
    ],
  ])('leaves a CommonJS file (%s) alone, with one TODO', (_, source) => {
    const { output, rules } = migrate(source);
    expect(rules).toEqual(['imports']);
    expect(output).not.toContain('<Box>');
  });

  it('leaves an ES module that also calls require() to convert', () => {
    const { output } = migrate(`const data = require('./data.json');\n${box}`);
    expect(output).toContain('<Box>');
  });

  it('leaves a styled-jsx component alone, with one TODO', () => {
    const { output, rules } = migrate(
      'export const A = () => (\n  <div className="box">\n    x\n    <style jsx>{`div { color: red; }`}</style>\n  </div>\n);\n'
    );
    expect(rules).toEqual(['styled-jsx']);
    expect(output).not.toContain('<Box>');
  });

  describe('only when an element would convert', () => {
    const family =
      'export const A = () => <div className="dropdown">x</div>;\n';

    it('adds no gate TODO a re-run could not act on', () => {
      expect(
        migrate(
          'const A = () => <div className="dropdown">x</div>;\nmodule.exports = { A };\n'
        ).rules
      ).toEqual(['family:dropdown']);
      expect(
        migrate(
          family,
          {
            serverComponentRoots: [{ dir: path.resolve('/p'), except: [] }],
          },
          path.resolve('/p/app/page.tsx')
        ).rules
      ).toEqual(['family:dropdown']);
    });

    it('counts a computed className that would convert', () => {
      expect(
        migrate(
          "const x = require('x');\nconst A = ({ on }) => <div className={on ? 'box' : ''}>x</div>;\n"
        ).rules
      ).toEqual(['imports', 'dynamic-class:Box']);
    });

    it('gives a non-React file no element TODOs, which all name React components', () => {
      const preact = '/** @jsxImportSource preact */\n';
      expect(
        migrate(
          `${preact}export const A = () => <div className="box"><div className="dropdown">x</div></div>;\n`
        ).rules
      ).toEqual(['jsx-runtime']);
      expect(migrate(`${preact}${family}`)).toEqual({
        output: null,
        rules: [],
      });
    });
  });

  describe('Next.js server components', () => {
    const project = path.resolve('/project');
    const options = {
      serverComponentRoots: [
        {
          dir: project,
          except: [
            path.join(project, 'pages'),
            path.join(project, 'src', 'pages'),
          ],
        },
      ],
    };

    it.each(['app/page.tsx', 'components/card.tsx'])(
      'leaves %s alone, with one TODO, since a server page may render it',
      file => {
        const { output, rules } = migrate(
          box,
          options,
          path.join(project, file)
        );
        expect(rules).toEqual(['rsc']);
        expect(output).not.toContain('<Box>');
      }
    );

    it("converts a file that says 'use client'", () => {
      const { output } = migrate(
        `'use client';\n${box}`,
        options,
        path.join(project, 'components', 'widget.tsx')
      );
      expect(output).toContain('<Box>');
    });

    it('converts a Pages Router file, which is always client code', () => {
      const { output } = migrate(
        box,
        options,
        path.join(project, 'pages', 'index.tsx')
      );
      expect(output).toContain('<Box>');
    });

    it('converts a file outside the Next.js package', () => {
      const { output } = migrate(
        box,
        options,
        path.resolve('/elsewhere/card.tsx')
      );
      expect(output).toContain('<Box>');
    });
  });
});

describe('JSX runtimes', () => {
  const box = 'export const A = () => <div className="box">x</div>;\n';

  it("converts under Emotion's classic pragma, which is React", () => {
    const { output, rules } = migrate(
      `/** @jsx jsx */\nimport { jsx } from '@emotion/react';\n${box}`
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<Box>');
  });

  it('refuses a classic pragma whose factory is not React, naming its module', () => {
    const todos: TodoEntry[] = [];
    runTransform(
      transform,
      'case.tsx',
      `/** @jsx h */\nimport { h } from 'preact';\n${box}`,
      { add: entry => todos.push(entry) }
    );
    expect(todos.map(todo => todo.rule)).toEqual(['jsx-runtime']);
    expect(todos[0].message).toContain('renders through `preact`');
  });

  it("converts under a classic pragma whose factory is React's own", () => {
    for (const pragma of [
      "/** @jsx createElement */\nimport { createElement } from 'react';",
      "/** @jsx React.createElement */\nimport * as React from 'react';",
    ]) {
      const { output, rules } = migrate(`${pragma}\n${box}`);
      expect({ pragma, rules }).toEqual({ pragma, rules: [] });
      expect(output).toContain('<Box>');
    }
  });

  it('follows the runtime the innermost package declares', () => {
    const jsxRuntimes = [
      { dir: path.resolve('/repo'), runtime: 'preact' },
      { dir: path.resolve('/repo/apps/web'), runtime: 'react' },
    ];
    expect(
      migrate(box, { jsxRuntimes }, path.resolve('/repo/src/a.tsx')).rules
    ).toEqual(['jsx-runtime']);
    expect(
      migrate(box, { jsxRuntimes }, path.resolve('/repo/apps/web/a.tsx')).output
    ).toContain('<Box>');
  });
});

describe('what counts', () => {
  it('keeps a file directive above the import it adds', () => {
    const { output } = migrate(
      '// @ts-nocheck\nexport const A = () => <p className="has-text-centered">x</p>;\n'
    );
    expect(output?.split('\n').slice(0, 2)).toEqual([
      '// @ts-nocheck',
      'import { Paragraph } from "@allxsmith/bestax-bulma";',
    ]);
  });

  it('does not count a comment as children', () => {
    const { output, rules } = migrate(
      'export const A = () => <div className="buttons">{/* later */}</div>;\n'
    );
    expect(rules).toEqual(['children:Buttons']);
    expect(output).toContain('<div className="buttons">');
  });

  it('flags the family in a computed className before the root beside it', () => {
    const { rules } = migrate(
      "export const A = ({ on }: { on: boolean }) => <div className={on ? 'dropdown box' : 'dropdown'}>x</div>;\n"
    );
    expect(rules).toEqual(['family:dropdown']);
  });

  it('carries on past a class named like an Object member', () => {
    const { output, rules } = migrate(
      'export const A = () => <div className="box toString constructor">x</div>;\n'
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<Box className="toString constructor">');
  });

  it('refuses the only child of a component, which may clone it', () => {
    const { output, rules } = migrate(
      'import Link from "next/link";\nexport const A = () => (\n  <Link href="/x">\n    <a className="button">Go</a>\n  </Link>\n);\n'
    );
    expect(rules).toEqual(['only-child:Button']);
    expect(output).toContain('<a className="button">Go</a>');
    // Spaces beside it on one line reach React, but a wrapper may still map
    // its children and clone each one, so the refusal stands.
    expect(
      migrate(
        'import Tip from "tip";\nexport const A = () => <Tip> <a className="button">Go</a> </Tip>;\n'
      ).rules
    ).toEqual(['only-child:Button']);
  });

  it('converts the only child of a fragment', () => {
    const { output } = migrate(
      'export const A = () => (\n  <>\n    <div className="box">x</div>\n  </>\n);\n'
    );
    expect(output).toContain('<Box>x</Box>');
  });

  it('refuses an element that sets its content with dangerouslySetInnerHTML', () => {
    const { rules } = migrate(
      'export const A = ({ html }: { html: string }) => <div className="content" dangerouslySetInnerHTML={{ __html: html }} />;\n'
    );
    expect(rules).toEqual(['attr:dangerouslySetInnerHTML']);
  });
});

describe('computed classNames', () => {
  const run = (className: string) =>
    migrate(
      `import cx from 'clsx';\nexport const A = ({ on }: { on: boolean }) => ${className};\n`
    );

  it('names the component the element would become', () => {
    expect(run("<div className={cx('x', { box: on })}>x</div>").rules).toEqual([
      'dynamic-class:Box',
    ]);
  });

  it('names the wrapper for helper classes alone', () => {
    expect(
      run("<p className={on ? 'has-text-centered' : ''}>x</p>").rules
    ).toEqual(['dynamic-class:Paragraph']);
  });

  it('gives the refusal a static className would get', () => {
    expect(run("<span className={cx('box')}>x</span>").rules).toEqual([
      'tag:Box',
    ]);
  });

  it('flags a Bulma 0.9 class', () => {
    expect(
      run("<div className={cx('tile', on && 'is-ancestor')}>x</div>").rules
    ).toEqual(['legacy:tile']);
  });

  it('reads a computed member key as a lookup, not a class', () => {
    expect(run("<div className={cx(styles['box'])}>x</div>").output).toBeNull();
  });
});

describe('a component that wraps its children', () => {
  it('converts once a child converts to one of its parts', () => {
    const { output, rules } = migrate(
      'export const A = () => (\n  <div className="card">\n    <header className="card-header">\n      <div className="card-header-title">T</div>\n    </header>\n    <div className="card-content">x</div>\n  </div>\n);\n'
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<Card>');
    expect(output).toContain('<Card.Header>');
    expect(output).toContain('<Card.Header.Title>T</Card.Header.Title>');
    expect(output).toContain('<Card.Content>x</Card.Content>');
  });

  it('does not count a part inside an expression, which may not render', () => {
    const { output, rules } = migrate(
      'export const A = ({ on }: { on: boolean }) => (\n  <div className="card">\n    {on && <div className="card-content">x</div>}\n  </div>\n);\n'
    );
    expect(rules).toEqual(['children:Card']);
    expect(output).toContain('<div className="card">');
    expect(output).toContain('<Card.Content>x</Card.Content>');
  });

  it('counts whitespace on one line as children, as JSX does', () => {
    const { output, rules } = migrate(
      'export const A = () => <div className="card">  </div>;\n'
    );
    expect(rules).toEqual(['children:Card']);
    expect(output).toContain('<div className="card">  </div>');
    // `&nbsp;` is not a space or a tab, so JSX keeps it on its own line too.
    expect(
      migrate(
        'export const A = () => (\n  <div className="card">\n    &nbsp;\n  </div>\n);\n'
      ).rules
    ).toEqual(['children:Card']);
    expect(
      migrate(
        'export const A = () => (\n  <div className="card">\n  </div>\n);\n'
      ).rules
    ).toEqual([]);
  });

  it('does not count a local that shadows the bestax import as a part', () => {
    const { rules } = migrate(
      'import { Card } from "@allxsmith/bestax-bulma";\nexport const A = ({ Card }: { Card: any }) => (\n  <div className="card">\n    <Card.Content>x</Card.Content>\n  </div>\n);\n'
    );
    expect(rules).toEqual(['children:Card']);
  });

  it('flags the card before a child that stays markup', () => {
    const { rules } = migrate(
      'export const A = (p: object) => (\n  <div className="card">\n    <div className="card-content" {...p}>x</div>\n  </div>\n);\n'
    );
    expect(rules).toEqual(['children:Card', 'spread:Card.Content']);
  });

  it.each([
    [
      'a named import',
      'import { Card as C } from "@allxsmith/bestax-bulma";\n',
      'C.Content',
    ],
    [
      'a namespace',
      'import * as B from "@allxsmith/bestax-bulma";\n',
      'B.Card.Content',
    ],
  ])('counts a child that already is a part, through %s', (_, head, part) => {
    const { output, rules } = migrate(
      `${head}export const A = () => <div className="card"><${part}>x</${part}></div>;\n`
    );
    expect(rules).toEqual([]);
    expect(output).not.toContain('className="card"');
  });
});

describe('a wrapper its component renders', () => {
  const wrapped = (wrapper: string, inside: string) =>
    migrate(
      `export const A = ({ on }: { on: boolean }) => (\n  ${wrapper}\n    ${inside}\n  </div>\n);\n`
    );
  const table = '<table className="table">x</table>';

  it('folds into the component inside it', () => {
    const { output, rules } = wrapped(
      '<div className="table-container">',
      table
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<Table isResponsive>x</Table>');
    expect(output).not.toContain('table-container');
  });

  it.each([
    [
      'an attribute',
      '<div className="table-container" id="t">',
      table,
      'attr:id',
    ],
    [
      'another class',
      '<div className="table-container mt-2">',
      table,
      'attr:className',
    ],
    [
      'a computed className',
      "<div className={on ? 'table-container' : ''}>",
      table,
      'dynamic-class:Table',
    ],
    [
      'something beside the table',
      '<div className="table-container">',
      `<p>Note</p>\n    ${table}`,
      'children:Table',
    ],
    [
      'a comment beside the table',
      '<div className="table-container">',
      `{/* note */}\n    ${table}`,
      'children:Table',
    ],
    [
      'a table that stays markup',
      '<div className="table-container">',
      '<table className="table" {...{}}>x</table>',
      'children:Table',
    ],
  ])('stays markup with %s', (_, wrapper, inside, rule) => {
    const { output, rules } = wrapped(wrapper, inside);
    expect(rules).toContain(rule);
    expect(output).toContain('table-container');
  });

  it('keeps the comments on the wrapper', () => {
    const { output, rules } = migrate(
      `export const A = () => (\n  // above\n  <div /* inside */ className="table-container">\n    ${table}\n  </div>\n);\n`
    );
    expect(rules).toEqual([]);
    expect(output).toContain('// above');
    expect(output).toContain('/* inside */');
    expect(output).toContain('isResponsive>x</Table>');
  });

  it('refuses the only child of a component, which may clone it', () => {
    const { output, rules } = migrate(
      `import Tip from "tip";\nexport const A = () => (\n  <Tip>\n    <div className="table-container">\n      ${table}\n    </div>\n  </Tip>\n);\n`
    );
    expect(rules).toEqual(['only-child:Table']);
    expect(output).toContain('<div className="table-container">');
  });

  it('keeps whitespace React renders beside the table as a reason to stay', () => {
    expect(
      migrate(
        `export const A = () => <div className="table-container"> ${table} </div>;\n`
      ).rules
    ).toEqual(['children:Table']);
  });
});

describe('an element a component renders inside itself', () => {
  const select = (wrapper: string, inside: string) =>
    migrate(
      `export const A = () => (\n  ${wrapper}\n    ${inside}\n      <option>x</option>\n    </select>\n  </div>\n);\n`
    );

  it("writes the component in the child's place, with the child's attributes", () => {
    const { output, rules } = select(
      '<div className="select is-small mt-2" key="k">',
      '<select id="s" className="is-focused" onChange={f}>'
    );
    expect(rules).toEqual([]);
    expect(output).toContain(
      '<SelectBase size="small" mt="2" key="k" id="s" isFocused onChange={f}>\n    <option>x</option>\n  </SelectBase>'
    );
    expect(output).not.toMatch(/<\/?select/);
  });

  it('pairs `multiple` with `.is-multiple`, and reads `size` beside it as a number', () => {
    const { output } = select(
      '<div className="select is-multiple">',
      '<select multiple size="4">'
    );
    expect(output).toContain('<SelectBase multiple multipleSize={4}>');
    expect(
      select(
        '<div className="select is-multiple">',
        '<select multiple size={3}>'
      ).output
    ).toContain('<SelectBase multiple multipleSize={3}>');
  });

  it.each([
    [
      'an attribute on the wrapper',
      '<div className="select" id="w">',
      '<select>',
      'attr:id',
    ],
    [
      'another class on the select',
      '<div className="select">',
      '<select className="my-select">',
      'attr:className',
    ],
    [
      'an empty class on the select, which renders `class=""`',
      '<div className="select">',
      '<select className="">',
      'attr:className',
    ],
    [
      'a computed class on the select',
      '<div className="select">',
      "<select className={on ? 'is-focused' : ''}>",
      'dynamic-class:SelectBase',
    ],
    [
      'a spread on the select',
      '<div className="select">',
      '<select {...rest}>',
      'spread:SelectBase',
    ],
    [
      '`is-multiple` without `multiple`',
      '<div className="select is-multiple">',
      '<select>',
      'attr:multiple',
    ],
    [
      '`multiple` without `is-multiple`',
      '<div className="select">',
      '<select multiple>',
      'attr:multiple',
    ],
    [
      '`size` without `multiple`',
      '<div className="select">',
      '<select size="4">',
      'attr:size',
    ],
    [
      // SelectBase writes it back only when it holds a number.
      'a `size` the codemod cannot read as a number',
      '<div className="select is-multiple">',
      '<select multiple size={rows}>',
      'attr:size',
    ],
  ])('keeps both as markup with %s', (_, wrapper, inside, rule) => {
    const { output, rules } = select(wrapper, inside);
    expect(rules).toEqual([rule]);
    expect(output).toContain('className="select');
    expect(output).toContain('<select');
  });

  it('keeps both as markup around anything beside the child', () => {
    const { rules } = migrate(
      'export const A = () => (\n  <div className="select">\n    {/* note */}\n    <select>\n      <option>x</option>\n    </select>\n  </div>\n);\n'
    );
    expect(rules).toEqual(['children:SelectBase']);
  });

  it('keeps each comment in the tags, once', () => {
    const { output, rules } = migrate(
      'export const A = () => (\n  // above\n  <div /* outer */ className="select">\n    <select /* inner */ name="n" /* last */>\n      <option>x</option>\n    </select /* close */>\n  </div /* outer close */>\n);\n'
    );
    expect(rules).toEqual([]);
    for (const comment of [
      '// above',
      '/* outer */',
      '/* inner */',
      '/* last */',
      '/* close */',
      '/* outer close */',
    ]) {
      expect({ comment, count: output.split(comment).length - 1 }).toEqual({
        comment,
        count: 1,
      });
    }
    expect(output).toContain('<SelectBase');
  });

  it("writes a breadcrumb in its list's place, with the nav's attributes", () => {
    const { output, rules } = migrate(
      'export const A = () => (\n  <nav className="breadcrumb has-dot-separator" aria-label="Trail">\n    <ul>\n      <li>\n        <a href="#">Home</a>\n      </li>\n    </ul>\n  </nav>\n);\n'
    );
    expect(rules).toEqual([]);
    expect(output).toContain(
      '<Breadcrumb separator="dot" aria-label="Trail">\n    <li>\n      <a href="#">Home</a>\n    </li>\n  </Breadcrumb>'
    );
  });

  it('keeps a breadcrumb as markup with anything on its list, or with no label', () => {
    const crumb = (nav: string, list: string) =>
      migrate(
        `export const A = () => (\n  ${nav}\n    ${list}\n      <li>x</li>\n    </ul>\n  </nav>\n);\n`
      ).rules;
    const nav = '<nav className="breadcrumb" aria-label="breadcrumbs">';
    expect(crumb(nav, '<ul id="l">')).toEqual(['attr:id']);
    expect(crumb(nav, '<ul className="mt-2">')).toEqual(['attr:className']);
    expect(crumb('<nav className="breadcrumb">', '<ul>')).toEqual([
      'defaults:Breadcrumb',
    ]);
  });
});

describe('a component that renders its children from a count', () => {
  const lines = (children: string) =>
    migrate(
      `export const A = () => (\n  <div className="skeleton-lines">\n${children}\n  </div>\n);\n`
    );

  it('writes the count, and the children go', () => {
    const { output, rules } = lines(
      '    <div></div>\n    <div />\n    <div></div>'
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<Skeleton variant="lines" lines={3} />');
  });

  it.each([
    ['text', '    <div>x</div>'],
    ['a class on one', '    <div className="is-wide"></div>'],
    ['an attribute on one', '    <div id="d"></div>'],
    ['a comment inside one', '    <div>{/* note */}</div>'],
    ['a comment beside them', '    {/* note */}\n    <div></div>'],
    ['a component', '    <Line />'],
  ])('keeps the element as markup around %s', (_, children) => {
    const { output, rules } = lines(children);
    expect(rules).toEqual(['children:Skeleton']);
    expect(output).toContain('className="skeleton-lines"');
  });

  it('keeps an element with `children` as an attribute as markup', () => {
    // Its children are content the JSX inside it doesn't show, so it can't be
    // counted: `lines={0}` would drop them.
    const { output, rules } = migrate(
      'export const A = ({ rows }: { rows: JSX.Element[] }) => <div className="skeleton-lines" children={rows} />;\n'
    );
    expect(rules).toEqual(['attr:children']);
    expect(output).toContain('className="skeleton-lines"');
  });

  it('keeps each comment in the tags that go, once', () => {
    const { output } = migrate(
      'export const A = () => (\n  <div className="skeleton-lines">\n    <div /* first */></div>\n    <div></div /* second */>\n  </div /* end */>\n);\n'
    );
    for (const comment of ['/* first */', '/* second */', '/* end */']) {
      expect({ comment, count: output.split(comment).length - 1 }).toEqual({
        comment,
        count: 1,
      });
    }
    expect(output).toMatch(/<Skeleton[^>]*lines=\{2\} \/>/);
  });

  it('converts a skeleton block with its content, and keeps helper classes', () => {
    const { output, rules } = migrate(
      'export const A = () => <div className="skeleton-block mt-2">Loading</div>;\n'
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<Skeleton className="mt-2">Loading</Skeleton>');
  });
});

describe('a className a joiner builds', () => {
  const joined = (element: string, imports = "import clsx from 'clsx';\n") =>
    migrate(
      `${imports}export const A = ({ busy, open }: { busy: boolean; open: boolean }) => ${element};\n`
    );

  it.each([
    ['`a && class`', "clsx('button', busy && 'is-loading')"],
    ['an object key', "clsx('button', { 'is-loading': busy })"],
    ['`a ? class : ""`', "clsx('button', busy ? 'is-loading' : '')"],
    ['`a ? class : null`', "clsx('button', busy ? 'is-loading' : null)"],
  ])('turns a flag added by %s into its prop', (_, call) => {
    const { output, rules } = joined(
      `<button className={${call}}>Save</button>`
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<Button isLoading={busy}>Save</Button>');
  });

  it('negates the condition of `a ? "" : class`, keeping its precedence', () => {
    const { output } = joined(
      "<div className={clsx('notification', busy || open ? '' : 'is-light')}>x</div>"
    );
    expect(output).toContain('<Notification isLight={!(busy || open)}>');
  });

  it('keeps what no prop renders in the call, and drops what one does', () => {
    const { output } = joined(
      "<button className={clsx('button is-small my-btn', busy && 'is-loading', open && 'my-open')}>Go</button>"
    );
    expect(output).toMatch(
      /<Button\s+size="small"\s+isLoading=\{busy\}\s+className=\{clsx\("my-btn", open && 'my-open'\)\}>/
    );
  });

  it('writes a plain className when nothing conditional is left, and none when nothing is', () => {
    expect(
      joined(
        "<button className={clsx('button my-btn', busy && 'is-loading')}>Go</button>"
      ).output
    ).toContain('<Button isLoading={busy} className="my-btn">');
    expect(
      joined(
        "<button className={clsx('button', busy && 'is-loading')}>Go</button>"
      ).output
    ).not.toContain('className');
  });

  it('reads `classnames` and a renamed `clsx`', () => {
    expect(
      joined(
        "<button className={cx('button', { 'is-loading': busy })}>Go</button>",
        "import cx from 'classnames';\n"
      ).output
    ).toContain('<Button isLoading={busy}>');
    expect(
      joined(
        "<button className={join('button', busy && 'is-loading')}>Go</button>",
        "import { clsx as join } from 'clsx';\n"
      ).output
    ).toContain('<Button isLoading={busy}>');
  });

  it.each([
    [
      'a joiner that looks classes up',
      "import cx from 'classnames/bind';\n",
      "cx('button', busy && 'is-loading')",
    ],
    [
      'a function the file defines',
      'const clsx = (...a: unknown[]) => a.join(" ");\n',
      "clsx('button', busy && 'is-loading')",
    ],
    [
      'an argument it cannot read',
      "import clsx from 'clsx';\n",
      "clsx('button', busy ? 'is-loading' : 'is-static')",
    ],
    [
      'a variable argument',
      "import clsx from 'clsx';\ndeclare const extra: string;\n",
      "clsx('button', extra)",
    ],
    [
      'the component class under a condition',
      "import clsx from 'clsx';\n",
      'clsx({ button: busy })',
    ],
  ])('keeps %s as a dynamic-class TODO', (_, imports, call) => {
    const { output, rules } = joined(
      `<button className={${call}}>Go</button>`,
      imports
    );
    expect(rules).toEqual(['dynamic-class:Button']);
    expect(output).toContain('<button');
  });

  it('says what stopped it when it can read the call but not convert it', () => {
    const root = joined('<div className={clsx({ box: open })}>x</div>');
    expect(root.rules).toEqual(['dynamic-class:Box']);
    expect(root.output).toContain('adds `.box` only under a condition');
    const fold = joined(
      '<div className={clsx(\'table-container\')}><table className="table" /></div>'
    );
    expect(fold.rules).toEqual(['dynamic-class:Table']);
    expect(fold.output).toContain("can't write every class it adds");
  });

  it('moves a condition ahead of one left in the call only when neither has side effects', () => {
    // Written as a prop, a condition is evaluated before the call.
    const free = joined(
      "<button className={clsx('button', { 'my-open': open, 'is-loading': busy })}>Go</button>"
    );
    expect(free.output).toMatch(/isLoading=\{busy\}/);
    const called = joined(
      "<button className={clsx('button', track() && 'my-open', busy && 'is-loading')}>Go</button>",
      "import clsx from 'clsx';\ndeclare const track: () => boolean;\n"
    );
    expect(called.output).not.toContain('isLoading');
    expect(called.output).toContain("busy && 'is-loading'");
    const moved = joined(
      "<button className={clsx('button', open && 'my-open', count() && 'is-loading')}>Go</button>",
      "import clsx from 'clsx';\ndeclare const count: () => number;\n"
    );
    expect(moved.output).not.toContain('isLoading');
    // Ahead of everything left in the call, a call moves as it is.
    const first = joined(
      "<button className={clsx('button', count() && 'is-loading', open && 'my-open')}>Go</button>",
      "import clsx from 'clsx';\ndeclare const count: () => number;\n"
    );
    expect(first.output).toMatch(/isLoading=\{count\(\)\}/);
  });

  it('treats a class a condition adds like a fixed one for families, legacy and plain roots', () => {
    const family = joined(
      "<div className={clsx('box', open && 'dropdown')}>x</div>"
    );
    expect(family.rules).toEqual(['family:dropdown']);
    expect(family.output).toContain("<div className={clsx('box'");
    const legacy = joined(
      "<div className={clsx('columns', open && 'tile')}>x</div>"
    );
    expect(legacy.rules).toEqual(['legacy:tile']);
    expect(legacy.output).toContain(
      "<Columns className={clsx(open && 'tile')}>"
    );
    const plain = joined("<p className={clsx('mt-2', open && 'help')}>x</p>");
    expect(plain.rules).toEqual([]);
    // Nothing to write: the file is left as it is.
    expect(plain.output).toBeNull();
  });

  it('keeps a flag that renders only for `true` in the call', () => {
    const { output } = joined(
      "<div className={clsx('field', busy && 'is-grouped')}><div className=\"control\">x</div></div>"
    );
    expect(output).toContain("<Field className={clsx(busy && 'is-grouped')}>");
  });

  it('refuses a horizontal field a condition may make, around children it would wrap', () => {
    const { rules } = joined(
      "<div className={clsx('field', busy && 'is-horizontal')}><div className=\"control\">x</div></div>"
    );
    expect(rules).toContain('children:Field');
  });

  it('drops a joiner import only its own rewrites stopped using', () => {
    const { output } = joined(
      "<button className={clsx('button', busy && 'is-loading')}>Go</button>",
      "// the header\nimport clsx from 'clsx';\nimport cx from 'classnames';\n"
    );
    expect(output).not.toContain("from 'clsx'");
    // Unused before the run, so the file's own business.
    expect(output).toContain("import cx from 'classnames';");
    expect(output).toContain('// the header');
  });

  it('keeps a joiner import something else still calls', () => {
    const { output } = joined(
      "<>{clsx('x')}<button className={clsx('button', busy && 'is-loading')}>Go</button></>"
    );
    expect(output).toContain("import clsx from 'clsx';");
  });

  it('keeps each comment in the parts that go, once', () => {
    const { output } = joined(
      "<button className={clsx(/* base */ 'button', /* when */ busy && 'is-loading')}>Go</button>"
    );
    for (const comment of ['base', 'when']) {
      expect({ comment, count: output.split(comment).length - 1 }).toEqual({
        comment,
        count: 1,
      });
    }
    expect(output).toMatch(/<Button[^>]*isLoading=\{busy\}/);
  });
});

describe('modal parts inside a bestax Modal', () => {
  it('keeps a part inside an existing Modal as markup', () => {
    const { output, rules } = migrate(
      'import { Modal } from "@allxsmith/bestax-bulma";\nexport const A = ({ open }: { open: boolean }) => (\n  <Modal active={open}>\n    <div className="modal-content">x</div>\n  </Modal>\n);\n'
    );
    expect(rules).toEqual(['context:Modal.Content']);
    expect(output).toContain('<div className="modal-content">x</div>');
  });
});

describe('menu list nesting', () => {
  const nested = (outer: string, head = '') =>
    migrate(
      `${head}export const A = ({ items, on }: { items: string[]; on: boolean }) => (\n  ${outer.replace('INNER', '<ul className="menu-list"><li><a>In</a></li></ul>')}\n);\n`
    );

  it('keeps a list inside another as markup, however it sits there', () => {
    // Directly, through a callback, and under a computed className.
    for (const outer of [
      '<ul className="menu-list"><li>INNER</li></ul>',
      '<ul className="menu-list">{items.map(item => <li key={item}>INNER</li>)}</ul>',
      "<ul className={on ? 'menu-list' : 'box'}><li>INNER</li></ul>",
    ]) {
      const { output, rules } = nested(outer);
      expect(rules).toContain('context:Menu.List');
      // Its items convert all the same: an item renders the same anywhere.
      expect(output).toContain(
        '<ul className="menu-list"><Menu.Item>In</Menu.Item></ul>'
      );
    }
    const inside = nested(
      '<Menu.List><li>INNER</li></Menu.List>',
      'import { Menu } from "@allxsmith/bestax-bulma";\n'
    );
    // The item around it holds no link, so it stays markup too.
    expect(inside.rules).toEqual(['children:Menu.Item', 'context:Menu.List']);
    // Around an existing Menu.List, which would lose its class instead.
    const around = migrate(
      'import { Menu } from "@allxsmith/bestax-bulma";\nexport const A = () => (\n  <ul className="menu-list"><li><a>Out</a><Menu.List><li><a>In</a></li></Menu.List></li></ul>\n);\n'
    );
    // Its item holds a link beside a component, so it stays markup as well.
    expect(around.rules).toEqual(['context:Menu.List', 'children:Menu.Item']);
    expect(around.output).toContain('<ul className="menu-list">');
  });

  it('knows a Menu.List imported under its flat export, either way round', () => {
    const head =
      'import { MenuList as List } from "@allxsmith/bestax-bulma";\n';
    expect(nested('<List><li>INNER</li></List>', head).rules).toEqual([
      'children:Menu.Item',
      'context:Menu.List',
    ]);
    const around = migrate(
      `${head}export const A = () => (\n  <ul className="menu-list"><li><a>Out</a><List><li><a>In</a></li></List></li></ul>\n);\n`
    );
    expect(around.rules).toEqual(['context:Menu.List', 'children:Menu.Item']);
  });

  it('finds an item only where it renders, not handed to a function', () => {
    const { output } = migrate(
      'export const A = ({ wrap, items }: { wrap: (node: unknown) => unknown; items: string[] }) => (\n  <ul className="menu-list">{wrap(<li><a>In</a></li>)}{items.map(item => <li key={item}><a>{item}</a></li>)}</ul>\n);\n'
    );
    expect(output).toContain('{wrap(<li><a>In</a></li>)}');
    expect(output).toContain('<Menu.Item key={item}>{item}</Menu.Item>');
  });

  it('converts the outer list, which renders its class at the top level', () => {
    const { output } = nested('<ul className="menu-list"><li>INNER</li></ul>');
    expect(output).toContain('<Menu.List>');
  });
});

describe('an element that takes the place of the one around it', () => {
  it("stays markup when that one is a component's only child", () => {
    const { output, rules } = migrate(
      'const Tooltip = (props: { children: unknown }) => props.children;\nexport const A = () => (\n  <ul className="pagination-list"><Tooltip><li><a className="pagination-link" tabIndex={0}>1</a></li></Tooltip></ul>\n);\n'
    );
    expect(rules).toContain('only-child:Pagination.Link');
    expect(output).toContain(
      '<li><a className="pagination-link" tabIndex={0}>1</a></li>'
    );
  });
});

describe('form context', () => {
  it('keeps a field or control around a bestax form control as markup', () => {
    const { output, rules } = migrate(
      'import { Input } from "@allxsmith/bestax-bulma";\nexport const A = () => (\n  <div className="field">\n    <div className="control">\n      <Input />\n    </div>\n  </div>\n);\n'
    );
    expect(rules).toEqual(['context:Field', 'context:Control']);
    expect(output).toContain('<div className="field">');
    expect(output).toContain('<div className="control">');
  });

  it('keeps an input with no id inside a bestax Field as markup', () => {
    const inside = (input: string) =>
      migrate(
        `import { Field } from "@allxsmith/bestax-bulma";\nexport const A = () => (\n  <Field label="Email">\n    ${input}\n  </Field>\n);\n`
      );
    expect(inside('<input className="input" />').rules).toEqual([
      'context:InputBase',
    ]);
    expect(inside('<input id="email" className="input" />').output).toContain(
      '<InputBase id="email" />'
    );
  });

  it('keeps an input with no id inside any other component as markup', () => {
    // Context follows the render tree: `Labelled` renders a labelled Field.
    const wrapped = (input: string, wrapper = 'Labelled') =>
      migrate(
        `import { Field } from "@allxsmith/bestax-bulma";\nconst Labelled = ({ children }: { children: React.ReactNode }) => <Field label="Email">{children}</Field>;\nexport const A = () => (\n  <${wrapper}>\n    ${input}\n    <p className="help">Required</p>\n  </${wrapper}>\n);\n`
      );
    expect(wrapped('<input className="input" type="email" />').rules).toEqual([
      'context:InputBase',
    ]);
    expect(
      wrapped('<input id="email" className="input" type="email" />').output
    ).toContain('<InputBase id="email" type="email" />');
    expect(
      wrapped('<input className="input" type="email" />', 'React.Fragment')
        .rules
    ).toEqual([]);
  });

  it('converts a horizontal field once its label and body do', () => {
    const { output, rules } = migrate(
      'export const A = () => (\n  <div className="field is-horizontal">\n    <div className="field-label">\n      <label className="label">Name</label>\n    </div>\n    <div className="field-body">x</div>\n  </div>\n);\n'
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<Field horizontal>');
    expect(
      migrate(
        'export const A = () => <div className="field is-horizontal">x</div>;\n'
      ).rules
    ).toEqual(['children:Field']);
  });
});

describe('printing', () => {
  it('keeps JSX text exactly as written inside return ( … )', () => {
    const body =
      '      Hello <b>world</b> ends &amp; more &lt;tag&gt;\n      {" "}spaced\n';
    const { output } = migrate(
      `export function A() {\n  return (\n    <p className="has-text-centered">\n${body}    </p>\n  );\n}\n`
    );
    expect(output).toContain(
      `    <Paragraph textAlign="centered">\n${body}    </Paragraph>\n`
    );
  });

  it('writes a leftover class with a quote or backslash as a valid string', () => {
    const { output } = migrate(
      "export const A = () => <div className='box a\"b c\\d'>x</div>;\n"
    );
    expect(output).toContain('<Box className={"a\\"b c\\\\d"}>');
  });

  it("prints 'use client' once, in its own quotes", () => {
    const { output } = migrate(
      '\'use client\';\n\nexport const A = () => <div className="box">x</div>;\n'
    );
    expect(output?.split('\n').slice(0, 2)).toEqual([
      "'use client';",
      'import { Box } from "@allxsmith/bestax-bulma";',
    ]);
  });

  it.each([
    [
      "a function expression's own name",
      'export const A = function Box() {\n  return <div className="box">x</div>;\n};\n',
      'Box',
    ],
    [
      'a browser global',
      'export const A = () => {\n  Notification.requestPermission();\n  return <div className="notification">x</div>;\n};\n',
      'Notification',
    ],
  ])('aliases the import around %s', (_, source, name) => {
    const { output } = migrate(source);
    expect(output).toContain(
      `import { ${name} as Bulma${name} } from "@allxsmith/bestax-bulma";`
    );
    expect(output).toContain(`<Bulma${name}>x</Bulma${name}>`);
  });

  it('leaves a TODO on its statement, not on the import it adds', () => {
    const { output } = migrate(
      'export const A = () => <div className="dropdown">x</div>;\nexport const B = () => <div className="box">y</div>;\n'
    );
    const lines = output?.split('\n') ?? [];
    expect(lines[0]).toBe('import { Box } from "@allxsmith/bestax-bulma";');
    expect(lines[1]).toMatch(/^\/\/ TODO\(bestax-migrate\): `\.dropdown`/);
    expect(lines[2]).toContain('className="dropdown"');
  });

  it('keeps a next-line directive on the line it governs', () => {
    const { output } = migrate(
      '// eslint-disable-next-line react/display-name\nexport const A = () => <div className="box">x</div>;\n'
    );
    expect(output?.split('\n').slice(0, 3)).toEqual([
      'import { Box } from "@allxsmith/bestax-bulma";',
      '// eslint-disable-next-line react/display-name',
      'export const A = () => <Box>x</Box>;',
    ]);
  });

  describe('a comment on the className', () => {
    const element = (attrs: string) =>
      `export const A = () => (\n  <div\n${attrs}  >\n    Hi\n  </div>\n);\n`;

    it('goes to the first attribute that takes its place', () => {
      expect(
        migrate(element('    // note\n    className="box has-text-centered"\n'))
          .output
      ).toContain('<Box\n    // note\n    textAlign="centered"');
    });

    it('goes to the next attribute when none takes its place', () => {
      expect(
        migrate(element('    // note\n    className="box"\n    id="a"\n'))
          .output
      ).toContain('<Box\n    // note\n    id="a"');
    });

    it('stays in the tag when the tag has no attributes left', () => {
      expect(
        migrate(element('    /* note */ className="box"\n')).output
      ).toMatch(/<Box\s*\/\* note \*\/>/);
      // A line comment after `<` would read as a closing tag, so it
      // becomes a block comment.
      const { output } = migrate(
        element(
          '    // eslint-disable-next-line some/rule\n    className="box"\n'
        )
      );
      expect(output).toContain('<Box/* eslint-disable-next-line some/rule */>');
      expect(output).not.toContain('<//');
    });
  });
});

describe('an element whose component builds its icons from props', () => {
  const iconText = (icon: string, text = '<span>Home</span>') =>
    `export const A = (label: string) => (\n  <span className="icon-text">\n    ${icon}\n    ${text}\n  </span>\n);\n`;
  const home =
    '<span className="icon" aria-label="Home"><i className="fas fa-home"></i></span>';

  it('imports the component alone, since its icons go into it', () => {
    const { output, rules } = migrate(iconText(home));
    expect(output).toContain(
      'import { IconText } from "@allxsmith/bestax-bulma";'
    );
    expect(output).not.toContain('<Icon ');
    expect(rules).toEqual([]);
  });

  it("writes each of an icon's attributes as `Icon` is given it", () => {
    const { output } = migrate(
      iconText(
        '<span className="icon" aria-label={label} title="Go &amp; see" tabIndex="0" style={{ color: "red" }} hidden><i className="fas fa-home"></i></span>'
      )
    );
    expect(output).toMatch(/ariaLabel: label,/);
    expect(output).toMatch(/title: "Go & see",/);
    expect(output).toMatch(/tabIndex: 0,/);
    expect(output).toMatch(/style: \{\s*color: "red"\s*\},/);
    expect(output).toMatch(/hidden: true\s*\}/);
  });

  it('writes a text JSX would read differently as the string it renders', () => {
    expect(migrate(iconText(home, '<span> Home</span>')).output).toContain(
      '>{" Home"}</IconText>'
    );
    expect(migrate(iconText(home, '<span>a &lt; b</span>')).output).toContain(
      '>{"a < b"}</IconText>'
    );
  });

  it('moves the comments in its children to the name that stays', () => {
    const { output } = migrate(
      iconText(
        '<span className="icon" aria-label="Home" /* the house */><i className="fas fa-home"></i></span>'
      )
    );
    expect(output).toMatch(/<IconText \/\* the house \*\/ iconProps=/);
  });

  it('keeps the TODO an icon it takes carried, with the class', () => {
    const { output, rules } = migrate(
      iconText(
        '<span className="icon tile" aria-label="Home"><i className="fas fa-home"></i></span>'
      )
    );
    expect(rules).toEqual(['legacy:tile']);
    expect(output).toMatch(/className: "tile",/);
  });

  it('keeps its icons as markup when a computed className leaves it to a person', () => {
    const source = iconText(home).replace(
      'className="icon-text"',
      'className={`icon-text ${label}`}'
    );
    const { output, rules } = migrate(source);
    expect(rules).toEqual(['dynamic-class:IconText']);
    expect(output).toContain(home);
    // A re-run finds the markup it found, and says the same.
    expect(migrate(output!).output).toBeNull();
  });
});
