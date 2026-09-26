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
    const family = 'export const A = () => <nav className="navbar">x</nav>;\n';

    it('adds no gate TODO a re-run could not act on', () => {
      expect(
        migrate(
          'const A = () => <nav className="navbar">x</nav>;\nmodule.exports = { A };\n'
        ).rules
      ).toEqual(['family:navbar']);
      expect(
        migrate(
          family,
          {
            serverComponentRoots: [{ dir: path.resolve('/p'), except: [] }],
          },
          path.resolve('/p/app/page.tsx')
        ).rules
      ).toEqual(['family:navbar']);
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
          `${preact}export const A = () => <div className="box"><nav className="navbar">x</nav></div>;\n`
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
      "export const A = ({ on }: { on: boolean }) => <div className={on ? 'navbar box' : 'navbar'}>x</div>;\n"
    );
    expect(rules).toEqual(['family:navbar']);
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
      'export const A = () => <nav className="navbar">x</nav>;\nexport const B = () => <div className="box">y</div>;\n'
    );
    const lines = output?.split('\n') ?? [];
    expect(lines[0]).toBe('import { Box } from "@allxsmith/bestax-bulma";');
    expect(lines[1]).toMatch(/^\/\/ TODO\(bestax-migrate\): `\.navbar`/);
    expect(lines[2]).toContain('className="navbar"');
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
