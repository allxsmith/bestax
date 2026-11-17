/**
 * Hold every standalone `Badge` in the examples to being a status, not a
 * control (#2086).
 *
 * A standalone badge is its own pill: a `role="status"` span with a count, or
 * a dot hidden from assistive tech. Neither is in the tab order or takes a
 * key, so a click handler on one reaches only a pointer, and a screen reader
 * hears a status where there's a control. A count someone clicks belongs on a
 * control beside the badge, such as a `Button`. This reads the jsx and tsx
 * fences in the docs and the skills, and the stories, and fails a standalone
 * `Badge` written with a click or press handler, capture phase included. A
 * `Badge` with children puts its handlers on a wrapper around them, where a
 * control's own click reaches them, so it isn't held. A handler
 * hidden in a spread passes, since this can't see into it, and a `Badge` is
 * read by its name, the way the examples write it.
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
  attributesOf,
  exampleFiles,
  sourcesOf,
} from './lib/example-sources.mjs';

const ts = createRequire(join(REPO, 'package.json'))('typescript');

/** The handlers that make an element something to click or press. */
const PRESS =
  /^on(Click|DoubleClick|AuxClick|ContextMenu|Mouse(Down|Up)|Pointer(Down|Up)|Touch(Start|End)|Key(Down|Up|Press))(Capture)?$/;

/** Whether a JSX element has children other than whitespace. */
const hasChildren = node =>
  ts.isJsxElement(node) &&
  node.children.some(child => !(ts.isJsxText(child) && !child.text.trim()));

/**
 * Every standalone `Badge` in one piece of code, each with its line within
 * the code and whether it's written with a click or press handler.
 */
function readCode(code) {
  const sf = ts.createSourceFile(
    'example.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const badges = [];
  const visit = node => {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      node.tagName.getText(sf) === 'Badge' &&
      !(ts.isJsxOpeningElement(node) && hasChildren(node.parent))
    ) {
      const { byName } = attributesOf(node.attributes);
      badges.push({
        offset: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line,
        pressable: [...byName.keys()].some(name => PRESS.test(name)),
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return badges;
}

describe('badges in the examples', () => {
  const badges = exampleFiles().flatMap(rel =>
    sourcesOf(rel).flatMap(({ code, line }) =>
      readCode(code).map(({ offset, pressable }) => ({
        at: `${rel}:${line + offset}`,
        pressable,
      }))
    )
  );

  it('holds each way of writing a standalone badge to whether it is pressed', () => {
    const verdicts = [
      ['<Badge onClick={add} />', true],
      ['<Badge content={1} onKeyDown={key} />', true],
      ['<Badge content={1} onPointerDown={press}></Badge>', true],
      ['<Badge content={1} />', false],
      ['<Badge content={1} {...props} onClick={add} />', true],
      ['<Badge content={1} onClickCapture={add} />', true],
      ['<Badge content={1} onTouchStart={press} />', true],
      ['<Badge content={1} {...props} />', false],
      ['<Badge content={1} onAnimationEnd={done} />', false],
      ['<Button onClick={add}><Badge content={1} /></Button>', false],
      [
        '<Badge content={1} onClick={track}><Button>Cart</Button></Badge>',
        undefined,
      ],
    ];
    // Every shape the rule gets wrong, so a failure names all of them.
    const wrong = verdicts
      .filter(([code, pressable]) => readCode(code)[0]?.pressable !== pressable)
      .map(([code]) => code);
    assert.deepEqual(wrong, []);
  });

  it('reads the Badge page and stories', () => {
    // So a moved page or a parse that finds nothing can't pass by reading no
    // badge at all.
    for (const rel of [
      'docs/docs/api/components/badge.md',
      'bulma-ui/src/components/Badge.stories.tsx',
    ]) {
      assert.ok(
        badges.some(badge => badge.at.startsWith(`${rel}:`)),
        `found no Badge in ${rel}`
      );
    }
  });

  it('gives no standalone badge a click or press handler', () => {
    const pressed = badges.filter(badge => badge.pressable).map(b => b.at);
    assert.deepEqual(
      pressed,
      [],
      'These badges take a click or press handler, which only a pointer can ' +
        'use. Put it on a control beside the badge, such as a `Button` ' +
        'whose name says what the count counts:\n  ' +
        pressed.join('\n  ')
    );
  });
});
