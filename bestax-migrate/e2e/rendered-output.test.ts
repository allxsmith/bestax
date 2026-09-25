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
import {
  loadModules,
  normalizeHtml,
  renderExports,
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
  }
);

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
});
