/**
 * The migrated kitchen sinks render, not just typecheck: every exported
 * component of every migrated file (bar leftovers.tsx, which keeps its source
 * import on purpose) is rendered to static HTML against the built
 * bestax-bulma, through the library's own React.
 *
 * Only the migrated OUTPUT runs here. The inputs import libraries this repo
 * never installs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCES } from '../src/sources/registry.js';
import { runTransform } from '../src/runner.js';
import type { TodoEntry } from '../src/types.js';
import {
  loadModules,
  normalizeHtml,
  renderExports,
  withImplicitListRoles,
  withV1Classes,
} from './support/render-module.js';

const fixturesRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'fixtures'
);

const KITCHEN_SINKS: Array<[source: string, fixture: string]> = [
  ['react-bulma-components', 'kitchen-sink'],
  ['rbx', 'rbx-kitchen-sink'],
  ['bloomer', 'bloomer-kitchen-sink'],
];

describe.each(KITCHEN_SINKS)(
  'the migrated %s kitchen sink',
  (source, fixture) => {
    const srcDir = path.join(fixturesRoot, fixture, 'src');
    const migrated: Record<string, string> = {};
    for (const file of fs.readdirSync(srcDir)) {
      if (!/\.tsx?$/.test(file) || file === 'leftovers.tsx') continue;
      const input = fs.readFileSync(path.join(srcDir, file), 'utf8');
      const { output } = runTransform(SOURCES[source].transform, file, input);
      migrated[file.replace(/\.tsx?$/, '')] = output ?? input;
    }

    it('renders every exported component', () => {
      // A renamed fixture directory would otherwise leave nothing to check.
      expect(Object.keys(migrated).length).toBeGreaterThan(0);
      const modules = loadModules(migrated);
      const rendered = Object.fromEntries(
        Object.entries(modules).map(([name, exports]) => [
          name,
          renderExports(exports),
        ])
      );
      for (const [name, byExport] of Object.entries(rendered)) {
        expect({ name, exports: Object.keys(byExport).length }).not.toEqual({
          name,
          exports: 0,
        });
        // Each file renders real Bulma markup, not an empty shell.
        expect({ name, html: Object.values(byExport).join('') }).toEqual({
          name,
          html: expect.stringMatching(/ class="[^"]*\b(?:is|has)-/),
        });
      }
    });

    // The library sources emit plain Bulma markup on purpose where bestax has
    // no component (`div.loader`, `p.help`). Running bulma-classes over their
    // output afterwards must leave all of it alone, without a TODO: each is
    // a deliberate choice the earlier pass already reported on.
    it('is left alone by bulma-classes afterwards', () => {
      const plainMarkup = Object.values(migrated).join('\n');
      expect(plainMarkup).toMatch(/<[a-z][a-z0-9]*\b[^>]*\bclassName="/);
      for (const [name, source] of Object.entries(migrated)) {
        const todos: TodoEntry[] = [];
        const { output } = runTransform(
          SOURCES['bulma-classes'].transform,
          `${name}.tsx`,
          source,
          { add: entry => todos.push(entry) }
        );
        expect({ name, output, todos }).toEqual({
          name,
          output: null,
          todos: [],
        });
      }
    });
  }
);

// bestax's Fieldset starts its own Field scope, which rbx's bare fieldset
// never did, so an input placed straight in one inside a Field would render a
// `.field` and a `.control` of its own. There the codemod keeps the plain
// <fieldset> rbx rendered, and the input renders what it does beside it.
describe("rbx's Fieldset inside a Field or a Control", () => {
  const migrate = (jsx: string): string =>
    runTransform(
      SOURCES.rbx.transform,
      'a.tsx',
      `import { Control, Field, Fieldset, Input } from 'rbx';\nexport const A = () => ${jsx};\n`
    ).output!;
  const render = (source: string): string =>
    normalizeHtml(renderExports(loadModules({ a: source }).a).A);

  it.each([
    [
      '<Field><Fieldset disabled><Input /></Fieldset></Field>',
      '<Field><Input /></Field>',
    ],
    [
      '<Control><Fieldset disabled><Input /></Fieldset></Control>',
      '<Control><Input /></Control>',
    ],
  ])('adds the fieldset and nothing else to %s', (nested, bare) => {
    const html = render(migrate(nested));
    expect(html).toContain('<fieldset disabled="">');
    expect(html.replace(/<\/?fieldset[^>]*>/g, '')).toBe(render(migrate(bare)));
  });
});

describe('renderExports', () => {
  it('renders memo and forwardRef components as well as functions', () => {
    const modules = loadModules({
      wrapped: [
        "import { forwardRef, memo } from 'react';",
        'export const Plain = () => <p>plain</p>;',
        'export const Memo = memo(() => <p>memo</p>);',
        'export const Ref = forwardRef<HTMLParagraphElement>((_, ref) => <p ref={ref}>ref</p>);',
        "export const notAComponent = 'text';",
      ].join('\n'),
    });
    expect(renderExports(modules.wrapped)).toEqual({
      Plain: '<p>plain</p>',
      Memo: '<p>memo</p>',
      Ref: '<p>ref</p>',
    });
  });
});

describe('normalizeHtml', () => {
  it('ignores attribute order, class order and text separators', () => {
    expect(
      normalizeHtml(
        '<a href="/x" class="button is-primary">Go<!-- -->!</a><br/>'
      )
    ).toBe(
      normalizeHtml('<a class="is-primary button" href="/x">Go!</a><br/>')
    );
  });

  it('keeps every other difference', () => {
    const base = '<button class="button" type="button">Go</button>';
    for (const other of [
      '<a class="button" type="button">Go</a>',
      '<button class="button is-small" type="button">Go</button>',
      '<button class="button">Go</button>',
      '<button class="button" type="submit">Go</button>',
      '<button class="button" type="button">Go!</button>',
    ]) {
      expect(normalizeHtml(other)).not.toBe(normalizeHtml(base));
    }
  });

  it('keeps role="list", even on a list', () => {
    expect(normalizeHtml('<ul role="list"><li>x</li></ul>')).not.toBe(
      normalizeHtml('<ul><li>x</li></ul>')
    );
  });
});

describe('withImplicitListRoles', () => {
  // Menu.List writes role="list" for Safari (#1108). It's a list's own role.
  const same = (raw: string, converted: string) =>
    withImplicitListRoles(raw, normalizeHtml(converted)) ===
    normalizeHtml(converted);

  it('lets a role="list" the conversion writes stand for a raw list with none', () => {
    for (const tag of ['ul', 'ol']) {
      expect(
        same(
          `<${tag} class="menu-list"><li>x</li></${tag}>`,
          `<${tag} role="list" class="menu-list"><li>x</li></${tag}>`
        )
      ).toBe(true);
    }
    // Nested lists too, each paired with the list in the same place.
    expect(
      same(
        '<ul class="menu-list"><li><a>x</a><ul><li>y</li></ul></li></ul>',
        '<ul role="list" class="menu-list"><li><a>x</a><ul role="list"><li>y</li></ul></li></ul>'
      )
    ).toBe(true);
    expect(
      same(
        '<ul><li>x</li></ul><ul><li>y</li></ul>',
        '<ul><li>x</li></ul><ul role="list"><li>y</li></ul>'
      )
    ).toBe(true);
  });

  it('still tells a conversion that drops or changes a role', () => {
    for (const [raw, converted] of [
      // Drops the raw list's own role="list".
      ['<ul role="list"><li>x</li></ul>', '<ul><li>x</li></ul>'],
      ['<ol role="list"><li>x</li></ol>', '<ol><li>x</li></ol>'],
      // Writes role="list" over the raw list's own role.
      ['<ul role="menu"><li>x</li></ul>', '<ul role="list"><li>x</li></ul>'],
      ['<ul role="none"><li>x</li></ul>', '<ul role="list"><li>x</li></ul>'],
      // Writes a role that isn't `list`, or `list` on a tag that isn't a list.
      ['<ul><li>x</li></ul>', '<ul role="menu"><li>x</li></ul>'],
      ['<ul><li>x</li></ul>', '<ul role="List"><li>x</li></ul>'],
      ['<div>x</div>', '<div role="list">x</div>'],
      ['<ul><li>x</li></ul>', '<ul><li role="list">x</li></ul>'],
    ]) {
      expect({ raw, converted, same: same(raw, converted) }).toEqual({
        raw,
        converted,
        same: false,
      });
    }
  });
});

describe('withV1Classes', () => {
  // `is-marginless` styles nothing under v1, and converts as `m="0"`.
  const same = (raw: string, converted: string) =>
    withV1Classes(raw, normalizeHtml(converted)) === normalizeHtml(converted);

  it('lets the v1 class a conversion writes stand for the 0.9 one it replaced', () => {
    expect(
      same('<p class="is-marginless intro">x</p>', '<p class="intro m-0">x</p>')
    ).toBe(true);
    expect(
      same(
        '<div class="box is-paddingless"><p class="is-marginless">x</p></div>',
        '<div class="box p-0"><p class="m-0">x</p></div>'
      )
    ).toBe(true);
  });

  it('still tells a conversion that drops, keeps or misplaces the class', () => {
    for (const [raw, converted] of [
      // Drops it.
      ['<p class="is-marginless">x</p>', '<p>x</p>'],
      // Writes some other class.
      ['<p class="is-marginless">x</p>', '<p class="m-1">x</p>'],
      ['<p class="is-marginless">x</p>', '<p class="p-0">x</p>'],
      // Writes the v1 class beside the old one, which then renders twice over.
      ['<p class="is-marginless">x</p>', '<p class="is-marginless m-0">x</p>'],
      // Writes it on another element.
      [
        '<div><p class="is-marginless">x</p></div>',
        '<div class="m-0"><p>x</p></div>',
      ],
      // A class v1 still has is never restated.
      ['<p class="marginless">x</p>', '<p class="m-0">x</p>'],
    ]) {
      expect({ raw, converted, same: same(raw, converted) }).toEqual({
        raw,
        converted,
        same: false,
      });
    }
  });
});
