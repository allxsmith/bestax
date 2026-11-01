/**
 * Tests the prose parsing in gen-eslint-meta.mjs, which nothing else reaches.
 *
 * `replacementFrom` turns the library's own deprecation note into the ESLint
 * autofix, so a note it reads wrongly becomes a wrong edit to someone's
 * source. It sits outside the ESLint plugin's own suite and its output file is
 * excluded from coverage, which is exactly why it needs a sibling test here.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  build,
  bulmaComponentClasses,
  classTableViolations,
  unknownComponents,
  collect,
  flexContainerViolations,
  guardViolations,
  render,
  rendersFlexContainer,
  replacementFrom,
} from './gen-eslint-meta.mjs';

describe('replacementFrom', () => {
  it('reads the single-replacement form the renames use', () => {
    assert.equal(
      replacementFrom(
        'Use `isFullwidth` instead — `isFullwidth` wins if both are set.'
      ),
      'isFullwidth'
    );
    assert.equal(replacementFrom('Use `name` instead.'), 'name');
    assert.equal(
      replacementFrom(
        'Use `gapMobile` instead — `gapMobile` wins if both are set.'
      ),
      'gapMobile'
    );
  });

  it('declines a dotted name, which no prop can be called', () => {
    // This was pinned the other way round, as if a compound path were a valid
    // replacement. It is the one shape that can never be a legal JSX
    // attribute name, so writing it produces a file that does not parse:
    // `--fix` on `<Tabs tab='a' />` emitted `<Tabs Tabs.Tab='a' />`.
    // The library really does carry such a note, on Tabs.Item, and it escaped
    // only because "with an" sits between the backtick and "instead".
    assert.equal(replacementFrom('Use `Tabs.Tab` instead.'), null);
    assert.equal(
      replacementFrom('Use `Tabs.Tab` with an `index` prop instead.'),
      null
    );
  });

  it('declines a note naming more than one replacement', () => {
    // Icon.libraryFeatures. There is no single prop to rewrite to, so no fix
    // can be offered — but the rule must still call it a deprecation rather
    // than a prop that was retired for never having worked.
    assert.equal(
      replacementFrom('Use `variant` and `features` instead.'),
      null
    );
  });

  it('declines a note that does not open with the rename form', () => {
    assert.equal(
      replacementFrom(
        'No `.tabs.is-<color>` CSS exists; the prop renders unstyled and will be removed in the next major version.'
      ),
      null
    );
    assert.equal(
      replacementFrom(
        "Bulma's `.tags` wraps by default — this prop has never had a visual effect."
      ),
      null
    );
    // Prose that merely mentions a prop later must not be mistaken for it.
    assert.equal(
      replacementFrom('Deprecated; prefer `isFullwidth` going forward.'),
      null
    );
  });

  it('is total over the inputs a missing or malformed note can take', () => {
    assert.equal(replacementFrom(undefined), null);
    assert.equal(replacementFrom(null), null);
    assert.equal(replacementFrom(''), null);
    assert.equal(replacementFrom('Use `` instead.'), null);
  });
});

describe('guardViolations', () => {
  // Synthetic input on purpose. `collect()` reads the real library, so on the
  // happy path every one of these guards is unreachable — which is how each
  // could have been deleted with the generator, its staleness gate, `pnpm all`
  // and this suite all staying green.
  const ok = () => ({
    deprecated: new Map([
      ['Button', new Map([['isFullWidth', { replacement: 'isFullwidth' }]])],
    ]),
    textAlias: new Set(['Box', 'Card', 'Content']),
    knownProps: new Map([
      ['Button', new Set(['isFullWidth', 'isFullwidth'])],
      ['Box', new Set(['color', 'textColor', 'bgColor'])],
      ['Card', new Set(['color', 'textColor', 'bgColor'])],
      ['Content', new Set(['color', 'textColor', 'bgColor'])],
    ]),
  });

  it('passes a well-formed table', () => {
    assert.deepEqual(guardViolations(ok()), []);
  });

  it('refuses an empty deprecation table', () => {
    const c = ok();
    c.deprecated = new Map();
    const v = guardViolations(c);
    assert.equal(v.length, 1);
    assert.match(v[0], /no deprecated props found/);
  });

  it('refuses an empty text-alias set, and names the anchors too', () => {
    const c = ok();
    c.textAlias = new Set();
    const v = guardViolations(c);
    // Both the emptiness guard and the anchor guard fire, which is why they
    // are collected rather than thrown one at a time.
    assert.equal(v.length, 2);
    assert.match(v.join('\n'), /no text-alias color props found/);
    assert.match(v.join('\n'), /Box, Card, Content no longer match/);
  });

  it('refuses a replacement the element does not declare', () => {
    const c = ok();
    c.knownProps.set('Button', new Set(['isFullWidth']));
    const v = guardViolations(c);
    assert.equal(v.length, 1);
    assert.match(v[0], /Button\.isFullWidth says its replacement/);
    assert.match(v[0], /would corrupt a consumer's source/);
  });

  it('allows a deprecation with no replacement', () => {
    const c = ok();
    c.deprecated = new Map([
      ['Tags', new Map([['isMultiline', { replacement: null }]])],
    ]);
    c.knownProps.set('Tags', new Set(['isMultiline']));
    assert.deepEqual(guardViolations(c), []);
  });

  it('refuses a text-alias element that does not declare textColor', () => {
    const c = ok();
    c.knownProps.set('Card', new Set(['color', 'bgColor']));
    const v = guardViolations(c);
    assert.equal(v.length, 1);
    assert.match(v[0], /Card is in the text-alias set/);
    assert.match(v[0], /does not declare `textColor`/);
  });

  it('refuses a text-alias element that does not declare bgColor', () => {
    // The `ambiguous` message names `bgColor` as the surface branch with no
    // condition attached, so an element that omits it — as the Navbar parts
    // in #757 do — would be told to write a prop it does not accept.
    const c = ok();
    c.knownProps.set('Card', new Set(['color', 'textColor']));
    const v = guardViolations(c);
    assert.equal(v.length, 1);
    assert.match(v[0], /Card is in the text-alias set/);
    assert.match(v[0], /does not declare `bgColor`/);
  });

  it('refuses a dropped anchor, and says matches for one', () => {
    const c = ok();
    c.textAlias = new Set(['Box', 'Card']);
    const v = guardViolations(c);
    assert.equal(v.length, 1);
    assert.match(v[0], /Content no longer matches/);
  });

  it('reports every violation at once rather than the first', () => {
    const c = ok();
    c.knownProps.set('Button', new Set(['isFullWidth']));
    c.knownProps.set('Box', new Set(['color', 'bgColor']));
    assert.equal(guardViolations(c).length, 2);
  });
});

describe('render', () => {
  const table = () => ({
    deprecated: new Map([
      [
        'Tabs',
        new Map([
          [
            'fullwidth',
            { replacement: 'isFullwidth', note: 'Use `isFullwidth` instead.' },
          ],
          [
            'color',
            { replacement: null, note: 'No `.tabs.is-<color>` CSS exists.' },
          ],
        ]),
      ],
      [
        'Button',
        new Map([
          [
            'isFullWidth',
            { replacement: 'isFullwidth', note: 'Use `isFullwidth` instead.' },
          ],
        ]),
      ],
    ]),
    textAlias: new Set(['Content', 'Box']),
  });

  // The staleness gate is the only other thing that reads render(), and it
  // reports a diff rather than saying what broke. These pin the properties the
  // rules depend on, which a diff does not distinguish from a reordering.
  it('sorts elements and props by code point, not by insertion', () => {
    const out = render(table());
    assert.ok(out.indexOf('"Button"') < out.indexOf('"Tabs"'));
    assert.ok(out.indexOf('"color"') < out.indexOf('"fullwidth"'));
    assert.ok(out.indexOf('"Box"') < out.indexOf('"Content"'));
  });

  it('writes a missing replacement as null rather than as a string', () => {
    const out = render(table());
    // `no-deprecated-props` keys its "offer no fix" branch off exactly this,
    // and `"null"` would read as a prop name to rewrite to.
    assert.match(out, /"color": \{ replacement: null,/);
    assert.match(out, /"fullwidth": \{ replacement: "isFullwidth",/);
  });

  it('quotes every key, so a compound part survives as one key', () => {
    const out = render({
      deprecated: new Map([
        [
          'Navbar.Brand',
          new Map([
            ['icon', { replacement: 'name', note: 'Use `name` instead.' }],
          ]),
        ],
      ]),
      textAlias: new Set(['Box']),
    });
    assert.match(out, /"Navbar\.Brand": \{/);
  });

  it('is deterministic for the same input', () => {
    assert.equal(render(table()), render(table()));
  });
});

describe('collect', () => {
  /**
   * A library of exactly the components named, shaped the way props-extract
   * reports them. `tablesFor` is called per name so a case can give each
   * component its own rows.
   */
  const library = (names, tablesFor) => ({
    exportedModules: () => new Map(names.map(n => [n, {}])),
    extractComponent: name => ({ tables: tablesFor(name) }),
  });

  /**
   * The text-alias rows every anchor has to carry: the marked `color` itself
   * plus both props `no-color-as-surface`'s message names back at the author.
   */
  const aliasRows = path => [
    { name: 'color', description: `Text color alias for ${path}.` },
    { name: 'textColor', description: 'Text colour.' },
    { name: 'bgColor', description: 'Background colour.' },
  ];

  // The guards exist to stop a bad table being written. On the real library
  // every one of them is dead code, so the line that turns a violation into a
  // failure was reached by nothing — deleting it left every gate green. The
  // extractor is a parameter so these two cases can reach it.
  it('refuses a table whose replacement is not a prop of the element', () => {
    assert.throws(
      () =>
        collect(
          library(['Box', 'Card', 'Content'], path => [
            {
              path,
              rows: [
                // The note names a replacement the element never declares,
                // which is the edit that would corrupt a consumer's source.
                ...(path === 'Box'
                  ? [
                      {
                        name: 'isFullWidth',
                        deprecated: true,
                        deprecationNote: 'Use `isFullwidth` instead.',
                      },
                    ]
                  : []),
                ...aliasRows(path),
              ],
            },
          ])
        ),
      /is not a prop Box declares/
    );
  });

  it('reports every violation in one error rather than the first', () => {
    // No deprecations and no text alias, so both emptiness guards fire.
    try {
      collect(library(['Box'], path => [{ path, rows: [{ name: 'color' }] }]));
      assert.fail('collect should have refused this table');
    } catch (error) {
      assert.match(error.message, /no deprecated props found/);
      assert.match(error.message, /no text-alias color props found/);
    }
  });

  it('returns the tables when every guard holds', () => {
    // Every anchor has to be a text alias, so the happy path needs all three.
    const { deprecated, textAlias } = collect(
      library(['Box', 'Card', 'Content'], path => [
        {
          path,
          rows: [
            ...(path === 'Box'
              ? [
                  {
                    name: 'isFullWidth',
                    deprecated: true,
                    deprecationNote: 'Use `isFullwidth` instead.',
                  },
                  { name: 'isFullwidth', description: 'Full width.' },
                ]
              : []),
            ...aliasRows(path),
          ],
        },
      ])
    );
    assert.equal(
      deprecated.get('Box').get('isFullWidth').replacement,
      'isFullwidth'
    );
    assert.ok(textAlias.has('Box'));
  });

  it('reads the flex containers off each component module’s source', () => {
    const sources = {
      'Box.tsx': 'return <div className={classes} />;',
      'Card.tsx': '// <StackLayout> would make it one\nreturn <div />;',
      'Content.tsx': 'return <StackLayout ref={ref} {...props} />;',
    };
    const { flexContainers } = collect({
      exportedModules: () =>
        new Map(['Box', 'Card', 'Content'].map(n => [n, {}])),
      // The happy path's tables, each with the module it was read from.
      extractComponent: name => ({
        sourceFile: `${name}.tsx`,
        tables: [
          {
            path: name,
            rows: [
              ...(name === 'Box'
                ? [
                    {
                      name: 'isFullWidth',
                      deprecated: true,
                      deprecationNote: 'Use `isFullwidth` instead.',
                    },
                    { name: 'isFullwidth', description: 'Full width.' },
                  ]
                : []),
              ...aliasRows(name),
            ],
          },
        ],
      }),
      readSource: file => sources[file],
    });
    // A comment naming the construct is not the construct.
    assert.deepEqual([...flexContainers], ['Content']);
  });
});

describe('the flex container set', () => {
  it('reads the construct, not a comment about it', () => {
    assert.equal(rendersFlexContainer('<StackLayout ref={ref} />'), true);
    assert.equal(
      rendersFlexContainer('useBulmaClasses(props, { flexContainer: true });'),
      true
    );
    assert.equal(
      rendersFlexContainer('/* { flexContainer: true } */\n<div />'),
      false
    );
    assert.equal(rendersFlexContainer('{ flexContainer: false }'), false);
  });

  it('refuses a set that lost an anchor, naming it', () => {
    assert.deepEqual(
      flexContainerViolations(new Set(['Center', 'Flex', 'Group', 'Stack'])),
      []
    );
    const one = flexContainerViolations(new Set(['Center', 'Flex', 'Group']));
    assert.equal(one.length, 1);
    assert.match(one[0], /^Stack no longer reads as a flex container/);
    assert.match(one[0], /on it, which render/);
    const two = flexContainerViolations(new Set(['Center', 'Flex']));
    assert.match(two[0], /^Group, Stack no longer read as/);
    assert.match(two[0], /on them, which render/);
  });

  it('renders the set sorted, and an empty one by default', () => {
    const base = { deprecated: new Map(), textAlias: new Set(['Box']) };
    assert.match(
      render({ ...base, flexContainers: new Set(['Stack', 'Flex']) }),
      /FLEX_CONTAINER_ELEMENTS: readonly string\[\] = \[\n {2}"Flex",\n {2}"Stack",\n\];/
    );
    assert.match(
      render(base),
      /FLEX_CONTAINER_ELEMENTS: readonly string\[\] = \[\n\n\];/
    );
  });
});

describe('the Bulma component class table', () => {
  /** A class-map module of just these roots, in this order. */
  const classMap =
    (roots, precedence = []) =>
    async () => ({
      ROOTS: roots,
      PRECEDENCE: precedence,
    });
  const exported = new Map(
    ['Box', 'Button', 'Card', 'Column', 'Dropdown', 'Hero', 'Navbar'].map(n => [
      n,
      {},
    ])
  );
  const anchors = {
    button: { status: 'mapped', target: 'Button' },
    'hero-body': { status: 'mapped', target: 'Hero.Body' },
    card: { status: 'todo', target: 'Card', why: 'by hand' },
    dropdown: { status: 'todo', target: 'Dropdown', why: 'by hand' },
  };

  it('lists families first, then converted roots by precedence, and no parts or plain roots', async () => {
    const { entries } = await bulmaComponentClasses(
      classMap(
        {
          box: { status: 'mapped', target: 'Box' },
          column: { status: 'mapped', target: 'Column' },
          card: { status: 'todo', target: 'Card', why: 'by hand' },
          'card-header': { status: 'todo', part: true },
          label: { status: 'plain', why: 'inside controls' },
          'table-container': { status: 'fold', target: 'Table' },
        },
        ['column', 'box']
      )
    );
    assert.deepEqual(
      entries.map(([cls, { converts }]) => [cls, converts]),
      [
        ['card', false],
        ['column', true],
        ['box', true],
        ['table-container', true],
      ]
    );
  });

  it('gives each converted root its own tag and its tags, and its advice when it has some', async () => {
    const { entries } = await bulmaComponentClasses(
      classMap({
        image: {
          status: 'mapped',
          target: 'Image',
          tag: 'div',
          as: ['div', 'figure'],
        },
        button: {
          status: 'mapped',
          target: 'Button',
          tag: 'button',
          as: 'any',
        },
        container: {
          status: 'mapped',
          target: 'Container',
          tag: 'div',
          onAnother: 'center it',
        },
        dropdown: { status: 'todo', target: 'Dropdown', why: 'by hand' },
      })
    );
    assert.deepEqual(Object.fromEntries(entries), {
      dropdown: { component: 'Dropdown', converts: false },
      image: {
        component: 'Image',
        converts: true,
        tag: 'div',
        tags: ['div', 'figure'],
      },
      button: {
        component: 'Button',
        converts: true,
        tag: 'button',
        tags: 'any',
      },
      container: {
        component: 'Container',
        converts: true,
        tag: 'div',
        tags: ['div'],
        onAnother: 'center it',
      },
    });
    const text = render({
      deprecated: new Map(),
      textAlias: new Set(),
      classes: entries,
    });
    assert.match(
      text,
      /\["container", \{ component: "Container", converts: true, tag: "div", tags: \["div"\], onAnother: "center it" \}\],/
    );
    assert.match(
      text,
      /\["dropdown", \{ component: "Dropdown", converts: false \}\],/
    );
  });

  it('gives a root the classes beside it that decide its tag, and no others', async () => {
    const size = value => ({ writes: [{ prop: 'size', value }] });
    const { entries } = await bulmaComponentClasses(
      classMap({
        image: {
          status: 'mapped',
          target: 'Image',
          tag: 'div',
          as: ['div', 'figure'],
          modifiers: {
            'is-64x64': size('64x64'),
            'is-16by9': { ...size('16by9'), rendersTag: 'figure' },
            'is-rounded': { writes: [{ prop: 'isRounded' }] },
          },
        },
        title: {
          status: 'mapped',
          target: 'Title',
          tag: 'h1',
          as: ['h1', 'h3', 'p'],
          sizeDrivesTag: true,
          modifiers: {
            'is-3': { ...size('3'), tagIn: ['h3', 'p'] },
            'is-spaced': { writes: [{ prop: 'isSpaced' }] },
          },
        },
        button: {
          status: 'mapped',
          target: 'Button',
          tag: 'button',
          modifiers: { 'is-large': size('large') },
        },
      })
    );
    const classes = Object.fromEntries(entries);
    assert.deepEqual(classes.image.retags, {
      'is-64x64': { tag: null },
      'is-16by9': { tag: 'figure' },
    });
    assert.deepEqual(classes.title.retags, {
      'is-3': { tag: 'h3', on: ['h3', 'p'] },
    });
    // A size that picks no tag is no retag.
    assert.equal('retags' in classes.button, false);
    assert.match(
      render({ deprecated: new Map(), textAlias: new Set(), classes: entries }),
      /retags: \{"is-64x64":\{"tag":null\},"is-16by9":\{"tag":"figure"\}\}/
    );
  });

  it('says where it failed when the table will not import', async () => {
    await assert.rejects(
      bulmaComponentClasses(async () => {
        throw new Error('boom');
      }),
      /class-map\.ts: boom\. It is loaded with node's type stripping/
    );
  });

  it('passes a table that names real exports and keeps its anchors', async () => {
    const classes = await bulmaComponentClasses(classMap(anchors));
    assert.deepEqual(classTableViolations(classes, exported), []);
  });

  it('refuses an empty table', () => {
    assert.match(
      classTableViolations({ entries: [] }, exported).join('\n'),
      /no Bulma component classes found/
    );
  });

  it('refuses a family with no component, and one the library does not export', async () => {
    const classes = await bulmaComponentClasses(
      classMap({
        ...anchors,
        modal: { status: 'todo', why: 'by hand' },
        box: { status: 'mapped', target: 'Boxx' },
      })
    );
    const violations = classTableViolations(classes, exported).join('\n');
    assert.match(violations, /`\.modal` names no bestax component/);
    assert.match(
      violations,
      /`\.box` names `Boxx`, which the library does not export/
    );
  });

  it('refuses a lost anchor', async () => {
    const { card, ...rest } = anchors;
    assert.ok(card);
    const classes = await bulmaComponentClasses(classMap(rest));
    assert.match(
      classTableViolations(classes, exported).join('\n'),
      /`\.card` no longer names `Card`/
    );
  });

  it('holds each component to an element the library documents, down to the part', () => {
    const classes = {
      entries: [
        ['hero-body', { component: 'Hero.Body', converts: true }],
        ['hero-foot', { component: 'Hero.Fot', converts: true }],
      ],
    };
    const violations = unknownComponents(
      classes,
      new Set(['Hero', 'Hero.Body'])
    );
    assert.equal(violations.length, 1);
    assert.match(violations[0], /`\.hero-foot` names `Hero\.Fot`/);
  });

  it('refuses to build from a bad table, before reading the library', async () => {
    await assert.rejects(
      build({ loadClassMap: classMap({}) }),
      /no Bulma component classes found/
    );
  });

  it('renders the table in its own order, with every entry quoted', () => {
    const out = render({
      deprecated: new Map(),
      textAlias: new Set(),
      classes: [
        ['card', { component: 'Card', converts: false }],
        ['box', { component: 'Box', converts: true }],
      ],
    });
    assert.ok(out.indexOf('["card"') < out.indexOf('["box"'));
    assert.match(out, /\["box", \{ component: "Box", converts: true \}\]/);
  });
});
