/**
 * A migrated title keeps its heading level (#1069).
 *
 * Every source library rendered a title at the element its tag prop named,
 * or at its own default, whatever the size. bestax's `Title` and `SubTitle`
 * render the heading their `size` names unless `as="p"`, so a plain rename
 * of the size turned bloomer's `<Subtitle isSize={4}>` from an <h2> into an
 * <h4>, which a fixture that compares text cannot see. This renders the
 * migrated output against the built library and compares the opening tag
 * with what the source library rendered, class list included. `is-size-N`
 * (from `textSize`) reads as `is-N` there, because Bulma gives both the same
 * font size.
 *
 * Only the OUTPUT runs. The inputs import libraries this repo never
 * installs, so what each one rendered is written beside it, read off the
 * library's own component at the SHA its corpus script pins.
 */

import { SOURCES } from '../src/sources/registry.js';
import { runTransform } from '../src/runner.js';
import type { TodoEntry } from '../src/types.js';
import {
  loadModules,
  normalizeHtml,
  renderExports,
} from './support/render-module.js';

/** [source JSX, the opening tag the source library rendered for it] */
type Case = [string, string];

const LIBRARIES: Array<[source: string, imports: string, cases: Case[]]> = [
  [
    // Title defaulted to an <h1> and Subtitle to an <h2>.
    'bloomer',
    "import { Subtitle, Title } from 'bloomer';",
    [
      ['<Title>x</Title>', '<h1 class="title">'],
      ['<Title isSize={1}>x</Title>', '<h1 class="title is-1">'],
      ['<Title isSize={4}>x</Title>', '<h1 class="title is-4">'],
      ['<Title isSize={4} tag="h2">x</Title>', '<h2 class="title is-4">'],
      ['<Title isSize={4} tag="h4">x</Title>', '<h4 class="title is-4">'],
      ['<Title isSize={6} tag="p">x</Title>', '<p class="title is-6">'],
      ['<Subtitle>x</Subtitle>', '<h2 class="subtitle">'],
      ['<Subtitle isSize={2}>x</Subtitle>', '<h2 class="subtitle is-2">'],
      ['<Subtitle isSize={4}>x</Subtitle>', '<h2 class="subtitle is-4">'],
      [
        '<Subtitle isSize="5" tag="h3">x</Subtitle>',
        '<h3 class="subtitle is-5">',
      ],
    ],
  ],
  [
    // Title defaulted to an <h1>, subtitle or not.
    'rbx',
    "import { Title } from 'rbx';",
    [
      ['<Title size={1}>x</Title>', '<h1 class="title is-1">'],
      ['<Title size={4}>x</Title>', '<h1 class="title is-4">'],
      ['<Title subtitle size={6}>x</Title>', '<h1 class="subtitle is-6">'],
      ['<Title as="h3" size={3}>x</Title>', '<h3 class="title is-3">'],
      ['<Title as="h2" size={5}>x</Title>', '<h2 class="title is-5">'],
      [
        '<Title as="p" subtitle size={5}>x</Title>',
        '<p class="subtitle is-5">',
      ],
    ],
  ],
  [
    // Heading's `renderAs` defaulted to an <h1>, subtitle or not.
    'react-bulma-components',
    "import { Heading } from 'react-bulma-components';",
    [
      ['<Heading size={1}>x</Heading>', '<h1 class="title is-1">'],
      ['<Heading size={4}>x</Heading>', '<h1 class="title is-4">'],
      ['<Heading subtitle size={6}>x</Heading>', '<h1 class="subtitle is-6">'],
      [
        '<Heading renderAs="h3" size={3}>x</Heading>',
        '<h3 class="title is-3">',
      ],
      [
        '<Heading renderAs="h2" size="5">x</Heading>',
        '<h2 class="title is-5">',
      ],
      [
        '<Heading renderAs="p" subtitle size={5}>x</Heading>',
        '<p class="subtitle is-5">',
      ],
    ],
  ],
];

/** The rendered element's opening tag, with `is-size-N` read as `is-N`. */
function openingTag(html: string): string {
  return normalizeHtml(
    html.slice(0, html.indexOf('>') + 1).replace(/\bis-size-(\d)\b/g, 'is-$1')
  );
}

describe.each(LIBRARIES)('a %s title', (source, imports, cases) => {
  test.each(cases)('%s keeps its element', (input, rendered) => {
    const todos: TodoEntry[] = [];
    const { output } = runTransform(
      SOURCES[source].transform,
      'title.tsx',
      `${imports}\nexport const A = () => ${input};\n`,
      { add: entry => todos.push(entry) }
    );
    expect(todos).toEqual([]);
    const { A } = renderExports(loadModules({ title: output ?? '' }).title);
    expect(openingTag(A)).toBe(normalizeHtml(rendered));
  });
});
