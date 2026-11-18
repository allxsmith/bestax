/**
 * Hold every `Panel` in the examples that has a `Panel.Heading` to a name
 * (#1984, #2119).
 *
 * `Panel.Heading` is Bulma's `<p class="panel-heading">`, which names nothing,
 * and a `Panel` is a `nav` landmark by default, so a page with two panels has
 * two landmarks a screen reader can't tell apart. The Panel page gives the
 * fix, `aria-labelledby` on the panel pointing at the heading's `id`, and
 * this holds the examples that show a panel with a heading to it. This reads
 * the jsx and tsx fences in the docs and the skills, and the stories; the
 * blog's dated posts and the templates are outside it. A panel passes with
 * an `aria-label` that holds a value, or an `aria-labelledby` that holds one
 * while its heading writes an `id`, which, where both are strings, is among
 * the ids the panel lists, or with a spread on either, since this can't see
 * into it. An expression is taken at its word. One rendered `as="div"` is left out, since a
 * `div` takes no name. A heading inside a nested `Panel` is that panel's,
 * and a `Panel` is read by its name, the way the examples write it.
 *
 * Each source is parsed with TypeScript as a `.tsx` file and nothing is
 * compiled, so a fence that is only a fragment still reads.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import {
  REPO,
  attributeValue,
  attributesOf,
  exampleFiles,
  isNothing,
  sourcesOf,
} from './lib/example-sources.mjs';

const ts = createRequire(join(REPO, 'package.json'))('typescript');

const isPanel = (node, sf) =>
  ts.isJsxElement(node) && node.openingElement.tagName.getText(sf) === 'Panel';

/** The first `Panel.Heading` a `Panel` holds of its own, at any depth. */
function headingOf(panel, sf) {
  let found;
  const walk = node => {
    if (found || isPanel(node, sf)) return;
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      node.tagName.getText(sf) === 'Panel.Heading'
    ) {
      found = node;
      return;
    }
    ts.forEachChild(node, walk);
  };
  ts.forEachChild(panel, walk);
  return found;
}

/**
 * An attribute's value: `{ text }` for a string, `{ expr: true }` for an
 * expression this can't read, or `undefined` for bare, blank, `{null}` or
 * `{undefined}`.
 */
function valueOf(prop) {
  const { bare, text, expr } = attributeValue(prop);
  if (bare) return undefined;
  if (text !== undefined) return text.trim() ? { text } : undefined;
  return isNothing(expr) ? undefined : { expr: true };
}

/**
 * Every `Panel` with a heading in one piece of code, each with its line within
 * the code and whether it has a name.
 */
function readCode(code) {
  const sf = ts.createSourceFile(
    'example.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const panels = [];
  const visit = node => {
    if (isPanel(node, sf)) {
      const { byName, spread } = attributesOf(node.openingElement.attributes);
      const as = byName.has('as')
        ? attributeValue(byName.get('as')).text
        : undefined;
      const heading = as === 'div' ? undefined : headingOf(node, sf);
      if (heading) {
        const value = name =>
          byName.has(name) ? valueOf(byName.get(name)) : undefined;
        const ofHeading = attributesOf(heading.attributes);
        const id = ofHeading.byName.has('id')
          ? valueOf(ofHeading.byName.get('id'))
          : undefined;
        const labelledBy = value('aria-labelledby');
        // A label names the panel by itself. A labelledby needs the heading to
        // write the id it points at, and where both are strings, its id among
        // the list's ids; an expression is taken at its word.
        const pointsAtHeading =
          labelledBy !== undefined &&
          (ofHeading.spread ||
            (id !== undefined &&
              (id.text === undefined ||
                labelledBy.text === undefined ||
                labelledBy.text.split(/\s+/).includes(id.text))));
        panels.push({
          offset: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line,
          named: spread || value('aria-label') !== undefined || pointsAtHeading,
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return panels;
}

describe('panels with a heading in the examples', () => {
  const panels = exampleFiles().flatMap(rel =>
    sourcesOf(rel).flatMap(({ code, line }) =>
      readCode(code).map(({ offset, named }) => ({
        at: `${rel}:${line + offset}`,
        named,
      }))
    )
  );

  it('holds each way of writing a panel to whether it is named', () => {
    const panel = (attrs, inner = '<Panel.Heading>A</Panel.Heading>') =>
      `<Panel ${attrs}>${inner}</Panel>`;
    const verdicts = [
      [panel(''), [false]],
      [
        panel('aria-labelledby="a"', '<Panel.Heading id="a">A</Panel.Heading>'),
        [true],
      ],
      [
        panel(
          'aria-labelledby={id}',
          '<Panel.Heading id={id}>A</Panel.Heading>'
        ),
        [true],
      ],
      [
        panel('aria-labelledby="a"', '<Panel.Heading id="b">A</Panel.Heading>'),
        [false],
      ],
      [panel('aria-labelledby="a"'), [false]],
      [
        panel('aria-labelledby="a"', '<Panel.Heading id="">A</Panel.Heading>'),
        [false],
      ],
      [
        panel(
          'aria-labelledby="t s"',
          '<Panel.Heading id="t">A</Panel.Heading>'
        ),
        [true],
      ],
      [
        panel(
          'aria-labelledby="a"',
          '<Panel.Heading id={ID}>A</Panel.Heading>'
        ),
        [true],
      ],
      [
        panel(
          'aria-labelledby="a"',
          '<Panel.Heading {...props}>A</Panel.Heading>'
        ),
        [true],
      ],
      [panel('aria-label=" "'), [false]],
      [panel('aria-labelledby={undefined}'), [false]],
      [panel('aria-label="A"'), [true]],
      [panel('aria-label=""'), [false]],
      [panel('aria-label={null}'), [false]],
      [panel('aria-label'), [false]],
      [panel('{...props}'), [true]],
      [
        panel('', '<Collapse trigger={<Panel.Heading>A</Panel.Heading>} />'),
        [false],
      ],
      [panel('as="div"'), []],
      [panel('', '<Panel.Block href="#a">A</Panel.Block>'), []],
      // The heading is the inner panel's alone, so the outer one isn't read.
      [panel('aria-label="A"', panel('')), [false]],
    ];
    // Every shape the rule gets wrong, so a failure names all of them.
    const wrong = verdicts
      .filter(
        ([code, named]) =>
          JSON.stringify(readCode(code).map(p => p.named)) !==
          JSON.stringify(named)
      )
      .map(([code]) => code);
    assert.deepEqual(wrong, []);
  });

  it('reads the Panel page and stories', () => {
    // So a moved page or a parse that finds nothing can't pass by reading no
    // panel at all.
    for (const rel of [
      'docs/docs/api/components/panel.md',
      'bulma-ui/src/components/Panel.stories.tsx',
    ]) {
      assert.ok(
        panels.some(panel => panel.at.startsWith(`${rel}:`)),
        `found no Panel with a heading in ${rel}`
      );
    }
  });

  it('names every panel after its heading', () => {
    const unnamed = panels.filter(panel => !panel.named).map(p => p.at);
    assert.deepEqual(
      unnamed,
      [],
      'These panels have a heading but no name, so a screen reader lists an ' +
        'unnamed landmark. Give the heading an `id` and the `Panel` ' +
        '`aria-labelledby` with it:\n  ' +
        unnamed.join('\n  ')
    );
  });
});
