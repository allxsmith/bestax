/**
 * Tests the prose parsing in gen-eslint-meta.mjs, which nothing else reaches.
 *
 * `replacementFrom` turns the library's own deprecation note into the ESLint
 * autofix, so a note it reads wrongly becomes a wrong edit to someone's
 * source. It sits outside jest's `roots` and its output file is excluded from
 * coverage, which is exactly why it needs a sibling test here.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  build,
  bulmaComponentClasses,
  classTableViolations,
  unknownComponents,
  collect,
  guardViolations,
  render,
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
      ['Box', new Set(['color', 'textColor'])],
      ['Card', new Set(['color', 'textColor'])],
      ['Content', new Set(['color', 'textColor'])],
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
    c.knownProps.set('Card', new Set(['color']));
    const v = guardViolations(c);
    assert.equal(v.length, 1);
    assert.match(v[0], /Card is in the text-alias set/);
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
    c.knownProps.set('Box', new Set(['color']));
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

  /** A text-alias `color` row pair, which every anchor has to carry. */
  const aliasRows = path => [
    { name: 'color', description: `Text color alias for ${path}.` },
    { name: 'textColor', description: 'Text colour.' },
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
    ['Box', 'Button', 'Card', 'Column', 'Hero', 'Navbar'].map(n => [n, {}])
  );
  const anchors = {
    button: { status: 'mapped', target: 'Button' },
    'hero-body': { status: 'mapped', target: 'Hero.Body' },
    card: { status: 'todo', target: 'Card', why: 'by hand' },
    navbar: { status: 'todo', target: 'Navbar', why: 'by hand' },
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
      ]
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
