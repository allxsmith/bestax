/**
 * What recast reprints must still say what the source said. Three of its
 * printer's habits changed code no transform meant to touch, in every source:
 * JSX text in a parenthesized `return ( … )` lost the space at its edges and
 * had its entities decoded, a directive gained a second semicolon once an
 * import was added, and a class holding a quote or a backslash was written
 * into a JSX string, which has no escapes. The fixes live in
 * `_shared/jsx-utils.ts`; these hold each library source to them.
 */

import { runTransform } from '../../../runner.js';
import { SOURCES } from '../../registry.js';

interface Case {
  source: string;
  /** Imports `Box` and whatever `changed` and `retained` render. */
  imports: string;
  /** An element the transform rewrites, so the tree around it is reprinted. */
  changed: string;
  /** A component with no bestax equivalent, whose import stays. */
  retained: string;
}

const CASES: Case[] = [
  {
    source: 'react-bulma-components',
    imports: "import { Box, Button, Element } from 'react-bulma-components';",
    changed: '<Button loading>Go</Button>',
    retained: '<Element>x</Element>',
  },
  {
    source: 'rbx',
    imports: "import { Box, Button, Generic } from 'rbx';",
    changed: '<Button state="loading">Go</Button>',
    retained: '<Generic>x</Generic>',
  },
  {
    source: 'bloomer',
    imports: "import { Box, Button, Tile } from 'bloomer';",
    changed: '<Button isColor="primary">Go</Button>',
    retained: '<Tile>x</Tile>',
  },
];

const migrate = (source: string, input: string): string =>
  runTransform(SOURCES[source].transform, 'a.tsx', input).output ?? input;

describe.each(CASES)('$source', ({ source, imports, changed, retained }) => {
  it('keeps JSX text as written inside return ( … )', () => {
    const text = '      Hello <b>world</b> ends &amp; more &lt;tag&gt;\n';
    const output = migrate(
      source,
      `${imports}\nexport function A() {\n  return (\n    <Box>\n${text}      ${changed}\n    </Box>\n  );\n}\n`
    );
    expect(output).toContain(text);
  });

  it("prints 'use client' once, in its own quotes, when an import is added", () => {
    const output = migrate(
      source,
      `'use client';\n${imports}\nexport const A = () => <Box>${retained}${changed}</Box>;\n`
    );
    expect(output.split('\n')[0]).toBe("'use client';");
    expect(output).not.toContain(';;');
  });
});

describe('a class holding a quote or a backslash', () => {
  const classes = String.raw`x before:content-["y"] c\d`;

  it.each([
    [
      'react-bulma-components',
      `import { Form } from 'react-bulma-components';\nexport const A = () => <Form.Help color="danger" className='${classes}'>x</Form.Help>;\n`,
    ],
    [
      'rbx',
      `import { Help } from 'rbx';\nexport const A = () => <Help color="danger" className='${classes}'>x</Help>;\n`,
    ],
  ])('%s writes the merged className as a valid string', (source, input) => {
    expect(migrate(source, input)).toContain(
      String.raw`className={"help is-danger x before:content-[\"y\"] c\\d"}`
    );
  });

  it('bloomer writes a class a prop adds as a valid string', () => {
    const output = migrate(
      'bloomer',
      `import { Subtitle } from 'bloomer';\nexport const A = () => <Subtitle className='${classes}' isSpaced>x</Subtitle>;\n`
    );
    expect(output).toContain(
      String.raw`className={"x before:content-[\"y\"] c\\d is-spaced"}`
    );
  });
});
