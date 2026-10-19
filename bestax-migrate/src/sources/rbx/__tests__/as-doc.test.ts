/**
 * The `as` table in the shipped prop-map is guidance an agent follows, and
 * `as` is the prop most likely to be wrong: rbx puts it on every component,
 * bestax declares it on a subset, and three handlers resolve their target
 * from a prop value so the answer depends on that value.
 *
 * Every earlier `as` defect on this PR was "the code and the doc disagreed"
 * or "the code was right for one handler and wrong for its siblings". So
 * this asserts the BEHAVIOUR each documented row promises, rather than
 * comparing two lists that can drift together.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import transform from '../transform.js';
import { AS_OK, MAPPING } from '../mapping.js';
import type { ComponentMapping } from '../../../types.js';
import { runTransform } from '../../../runner.js';
import type { TodoEntry } from '../../../types.js';

const PROP_MAP = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../../skills/bestax-migrate/references/rbx/prop-map.md'
);

function migrate(source: string) {
  const todos: TodoEntry[] = [];
  const { output } = runTransform(transform, 'c.tsx', source, {
    add: e => todos.push(e),
  });
  return { output: output ?? source, todos };
}

/**
 * [rbx import, JSX, `as` survives?, the bestax name the prop-map must list]
 * The fourth field is the bestax component the doc is expected to name — not
 * the rbx tag, and not just its leaf, because leaves like `Item` collide.
 */
const CASES: Array<[string, string, boolean, string?]> = [
  // Documented as accepting `as`.
  ['Button', '<Button as="a">x</Button>', true, 'Button'],
  ['Title', '<Title as="h2">x</Title>', true, 'Title'],
  ['Title', '<Title subtitle as="h3">x</Title>', true, 'SubTitle'],
  ['Image', '<Image as="div" src="/a.png" />', true, 'Image'],
  ['Footer', '<Footer as="div">x</Footer>', true, 'Footer'],
  ['Media', '<Media as="div">x</Media>', true, 'Media'],
  [
    'Media',
    '<Media.Item align="left" as="figure">x</Media.Item>',
    true,
    'Media.Left',
  ],
  ['Level', '<Level.Item as="a">x</Level.Item>', true, 'Level.Item'],
  ['Control', '<Control as="div">x</Control>', true, 'Control'],
  ['Menu', '<Menu.List.Item as="a">x</Menu.List.Item>', true, 'Menu.Item'],
  [
    'Dropdown',
    '<Dropdown.Item as="button">x</Dropdown.Item>',
    true,
    'Dropdown.Item',
  ],
  ['Navbar', '<Navbar.Item as="a">x</Navbar.Item>', true, 'Navbar.Item'],
  ['Navbar', '<Navbar.Link as="a">x</Navbar.Link>', true, 'Navbar.Link'],
  ['Container', '<Container as="main">x</Container>', true, 'Container'],
  ['Hero', '<Hero as="main">x</Hero>', true, 'Hero'],
  ['Hero', '<Hero.Head as="header">x</Hero.Head>', true, 'Hero.Head'],
  ['Hero', '<Hero.Foot as="footer">x</Hero.Foot>', true, 'Hero.Foot'],
  ['Panel', '<Panel as="section">x</Panel>', true, 'Panel'],
  ['Panel', '<Panel.Block as="label">x</Panel.Block>', true, 'Panel.Block'],

  // Documented as NOT accepting it — including the target-dependent cases.
  ['Dropdown', '<Dropdown as="div">x</Dropdown>', false],
  ['Navbar', '<Navbar as="nav">x</Navbar>', false],
  ['Media', '<Media.Item align="right" as="div">x</Media.Item>', false],
  ['Media', '<Media.Item align="content" as="div">x</Media.Item>', false],
  ['Level', '<Level.Item align="left" as="a">x</Level.Item>', false],
  ['Level', '<Level.Item align="right" as="a">x</Level.Item>', false],
  ['Navbar', '<Navbar.Item dropdown as="div">x</Navbar.Item>', false],
  ['Box', '<Box as="section">x</Box>', false],
  ['Tag', '<Tag as="span">x</Tag>', false],
];

describe('the documented `as` behaviour is the actual behaviour', () => {
  test.each(CASES)('%s %s → survives=%s', (imp, jsx, shouldSurvive) => {
    const { output, todos } = migrate(
      `import { ${imp} } from "rbx";\nexport const A = () => ${jsx};`
    );
    const code = output
      .split('\n')
      .filter(l => !l.trim().startsWith('// TODO(bestax-migrate)'))
      .join('\n');
    if (shouldSurvive) {
      expect(code).toMatch(/\sas="/);
      expect(todos.some(t => t.rule === 'prop:as')).toBe(false);
    } else {
      expect(todos.some(t => t.rule === 'prop:as')).toBe(true);
    }
  });

  it('has a surviving case for every rbx component the mapping lets `as` through', () => {
    // Without this, dropping an `AS_OK` is silent: the universal TODO fires,
    // the attribute stays as its marker, and an `as` inside the target's
    // union still compiles, so only the TODO's false claim changes.
    // `Media.Item` is the one whose special lets `as` through rather than an
    // `AS_OK`: it resolves its target from `align`, and only `Media.Left`
    // keeps it.
    const passing: string[] = ['Media.Item'];
    const walk = (entries: Record<string, ComponentMapping>, at: string[]) => {
      for (const [name, entry] of Object.entries(entries)) {
        const path = [...at, name];
        if (entry.props?.as === AS_OK) passing.push(path.join('.'));
        if (entry.subs) walk(entry.subs, path);
      }
    };
    walk(MAPPING, []);
    const covered = CASES.filter(([, , survives]) => survives).map(
      ([, jsx]) => /^<([\w.]+)/.exec(jsx)![1]
    );
    expect([...new Set(covered)].sort()).toEqual(passing.sort());
  });

  it('the prop-map names every component whose `as` survives', () => {
    // A component that accepts `as` but is missing from the table sends an
    // agent to "restructure the element" for a prop that would have worked.
    const doc = fs.readFileSync(PROP_MAP, 'utf8');
    // The header is prettier-padded, so match it loosely — an indexOf miss
    // here would silently pass everything.
    const start = doc.search(/^\|\s*bestax component\s*\|/m);
    expect(start).toBeGreaterThan(-1);
    const documented = doc.slice(start);
    for (const [, jsx, shouldSurvive, bestaxName] of CASES) {
      if (!shouldSurvive) continue;
      // Match the full bestax name inside a code span: leaves like `Item`
      // collide across Dropdown/Menu/Level/Navbar, so a substring check on
      // the leaf alone would pass even with the whole row deleted.
      const needle = `\`${bestaxName}\``;
      expect({ jsx, needle, inDoc: documented.includes(needle) }).toEqual({
        jsx,
        needle,
        inDoc: true,
      });
    }
  });
});
