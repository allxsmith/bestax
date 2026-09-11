/**
 * Guards on `extractComponent`'s two rendering modes.
 *
 * The extractor grew up serving one consumer — the markdown API pages — so it
 * bakes presentation into its output: backticked type members, page-relative
 * links for the shared value unions, and a `**Deprecated.**` prefix folded into
 * the description. `markdown: false` exists for the MCP index, which is JSON
 * and can carry those as fields instead.
 *
 * The failure mode worth guarding is silent: markdown mode drifting. Nothing in
 * a diff review distinguishes "the flag threaded correctly" from "the flag
 * changed the default path too" — `pnpm gen:api-docs:check` catches it in CI,
 * but only after a full 87-page regeneration. These assertions pin the contract
 * directly, both directions.
 *
 * `.mjs` and `node --test` rather than jest: these are root-level scripts with
 * no package of their own, matching how docs/scripts is covered.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractComponent,
  transparentPropWrapper,
  unsupportedPropWrapper,
  unnameablePropsError,
  unwrapPropsTypeName,
} from './lib/props-extract.mjs';

// One Program construction dominates this file's runtime (~3 s), and
// extractComponent caches it — so extract each fixture once, up front.
const row = (component, name, opts) =>
  extractComponent(component, opts).tables[0].rows.find(r => r.name === name);

test('markdown mode is the default and still renders code spans', () => {
  const color = row('Button', 'color');
  assert.match(color.type, /^`'primary'`/);
  assert.ok(color.type.includes('` | `'), 'members joined by raw pipes');
  // Explicitly passing the default must be indistinguishable from omitting it.
  assert.equal(row('Button', 'color', { markdown: true }).type, color.type);
});

test('structured mode drops code spans from types', () => {
  const color = row('Button', 'color', { markdown: false });
  assert.ok(!color.type.includes('`'), `unescaped type, got ${color.type}`);
  assert.equal(color.type.split(' | ')[0], "'primary'");
});

test('a TYPE_DISPLAY union becomes a label plus a structured valuesRef', () => {
  // `(typeof validColors)[number]` is 19 members — unreadable inlined, so both
  // modes substitute. Markdown can link to the page; JSON cannot.
  const md = row('Columns', 'textColor');
  const structured = row('Columns', 'textColor', { markdown: false });

  assert.ok(md.type.includes('](../helpers/valid-values.md)'));
  assert.equal(md.valuesRef, undefined, 'markdown rows carry no extra fields');

  assert.ok(!structured.type.includes(']('), 'no markdown link survives');
  assert.ok(structured.type.startsWith('Bulma color'));
  assert.equal(structured.valuesRef, 'helpers/valid-values');
});

test('@deprecated moves from the description into its own fields', () => {
  const md = row('Tabs', 'color');
  const structured = row('Tabs', 'color', { markdown: false });

  assert.ok(md.description.startsWith('**Deprecated.** '));

  assert.equal(structured.deprecated, true);
  assert.ok(!structured.description.includes('**Deprecated.**'));
  assert.ok(structured.deprecationNote.length > 0);
  // The description keeps only what the prop actually does.
  assert.ok(md.description.endsWith(structured.description));
});

test('a prop with no @deprecated tag reports it as absent, not missing', () => {
  const isLight = row('Button', 'isLight', { markdown: false });
  assert.equal(isLight.deprecated, false);
  assert.equal(isLight.deprecationNote, null);
  assert.equal(isLight.valuesRef, null);
});

test('the catch-all row loses its code spans in structured mode', () => {
  const md = extractComponent('Button').tables[0].catchAll;
  const structured = extractComponent('Button', { markdown: false }).tables[0]
    .catchAll;

  assert.equal(
    md.text,
    'Remaining props of the element or component selected by `as` (default `<button>`) and Bulma helper props'
  );
  assert.equal(
    structured.text,
    'Remaining props of the element or component selected by as (default <button>) and Bulma helper props'
  );
  assert.equal(structured.helpers, md.helpers);
});

// --- the polymorphic `as` contract (#641) --------------------------------
//
// The eight polymorphic components are declared
// `const X = forwardRef(…) as PolymorphicComponent<…>`, and their props are a
// type ALIAS intersecting an `*OwnProps` interface with
// `ComponentPropsWithoutRef<T>` — an interface cannot extend a generic Omit.
// Every assertion below guards a way that shape degrades SILENTLY: the
// generator reads source syntax, so a case it does not recognise yields a
// thinner table rather than an error, and the `gen:*:check` gates would commit
// the thinner table as "regenerated".

const POLYMORPHIC = [
  ['Button', 'Button'],
  ['LinkButton', 'LinkButton'],
  ['Link', 'Link'],
  ['Avatar', 'Avatar'],
  ['Reveal', 'Reveal'],
  ['Navbar', 'Navbar.Item'],
  ['Navbar', 'Navbar.Link'],
  ['Menu', 'Menu.Item'],
];

const table = (component, path) =>
  extractComponent(component).tables.find(t => t.path === path);

test('a polymorphic component still resolves its props type', () => {
  // The cast defeats every existing path in `propsInterfaceName`. A miss is
  // near-silent: `gen-api-docs` skips a `listOnly` SUB outright, so Navbar.Item
  // would simply vanish from navbar.md, and the MCP index would commit an
  // empty `props` array.
  for (const [component, path] of POLYMORPHIC) {
    const t = table(component, path);
    assert.ok(t, `${path} has no table`);
    assert.ok(!t.listOnly, `${path} rendered as listOnly`);
    assert.ok(t.rows.length > 3, `${path} has only ${t.rows.length} rows`);
    assert.ok(t.catchAll, `${path} lost its catch-all row`);
  }
});

test('`as` renders its constraint, not the bare type parameter', () => {
  // `as?: T` prints as `T` from source text — an identifier the page never
  // defines, since a type PARAMETER is not an alias and so never reaches the
  // `**Types:**` footnote either.
  for (const [component, path] of POLYMORPHIC) {
    const as = table(component, path).rows.find(r => r.name === 'as');
    assert.equal(as.type, '`React.ElementType`', `${path} as`);
  }
  for (const [component] of POLYMORPHIC) {
    for (const t of extractComponent(component, { markdown: false }).tables) {
      // `extraProps` too, not just `rows`: every polymorphic `ref` is emitted
      // through an `@extraProp`, so scanning only `rows` let
      // `PolymorphicRef<T>` reach the page with `T` declared nowhere on it —
      // the exact bare-type-parameter problem this asserts against.
      for (const r of [...(t.rows ?? []), ...(t.extraProps ?? [])]) {
        assert.ok(
          !/^[A-Z]$/.test(r.type),
          `${t.path}.${r.name} rendered a bare type parameter: ${r.type}`
        );
        // Nor one nested inside a generic — `PolymorphicRef<T>` names `T`,
        // which no API page declares, so a reader meets an identifier with
        // nowhere to look it up.
        assert.ok(
          !/\b[A-Z]\b(?![\w<])/.test(r.type.replace(/[A-Z]\w+/g, '')),
          `${t.path}.${r.name} names an undeclared type parameter: ${r.type}`
        );
      }
    }
  }
});

test('destructuring defaults survive the polymorphic cast', () => {
  // `componentFunction` sees the `as` expression, not the forwardRef call, so
  // without unwrapping it every Default cell on all eight pages empties.
  assert.equal(
    table('Button', 'Button').rows.find(r => r.name === 'as').default,
    "'button'"
  );
  assert.equal(
    table('Reveal', 'Reveal').rows.find(r => r.name === 'animation').default,
    "'fade-up'"
  );
  assert.equal(
    table('Menu', 'Menu.Item').rows.find(r => r.name === 'as').default,
    "'a'"
  );
});

test('the catch-all names the polymorphic element and its default', () => {
  assert.equal(
    table('Menu', 'Menu.Item').catchAll.text,
    'Remaining props of the element or component selected by `as` (default `<a>`) and Bulma helper props'
  );
});

test('every polymorphic component names a concrete default element', () => {
  // A type parameter defaulting to the CONSTRAINT rather than to a tag —
  // `<T extends React.ElementType = React.ElementType>` — makes
  // `ComponentPropsWithoutRef<T>` spread across every element at once, which
  // accepts anything and reintroduces the false positive #641 removed. Avatar
  // is the one that tempts it, because its runtime default is conditional on
  // `href`. The catch-all sentence is the visible symptom: no element named.
  for (const [component, path] of POLYMORPHIC) {
    assert.match(
      table(component, path).catchAll.text,
      /\(default `<[a-z]+>`\)/,
      `${path} names no default element`
    );
  }
  assert.equal(
    table('Avatar', 'Avatar').catchAll.text,
    'Remaining props of the element or component selected by `as` (default `<figure>`) and Bulma helper props'
  );
});

test('every polymorphic component still documents className and ref', () => {
  // The synthesized className/children/ref rows are gated on `inheritsDom`,
  // which a polymorphic base does NOT satisfy — it is not a `dom` entry. These
  // pages keep those rows only because each `*OwnProps` declares `className`
  // itself and each props type carries an `@extraProp` for `ref`. Drop either
  // and the row disappears with no error, so assert the outcome rather than
  // the mechanism.
  for (const [component, path] of POLYMORPHIC) {
    const t = table(component, path);
    assert.ok(
      t.rows.some(r => r.name === 'className'),
      `${path} lost className`
    );
    if (path === 'Reveal') continue; // forwards no ref, by design
    assert.ok(
      t.extraProps.some(r => r.name === 'ref'),
      `${path} lost its ref row`
    );
  }
});

test('the OwnProps split does not reclassify own props as inherited', () => {
  // The members live on `*OwnProps`, so they arrive through the expand queue —
  // the same path inherited props take. Flagging them `inherited` would flip
  // every row of all eight components in the committed MCP index.
  assert.ok(
    table('Button', 'Button').rows.every(r => !r.inherited),
    "Button's own props reported as inherited"
  );
  assert.ok(
    table('LinkButton', 'LinkButton').rows.some(r => r.inherited),
    'LinkButton no longer reports the props it inherits from Button'
  );
});

test('a component whose props type cannot be named fails loudly', () => {
  // The decision, not just its absence. `extractComponent` reads the real
  // `bulma-ui/src` tree, so the throwing branch cannot be reached from a
  // fixture — which is how this test previously asserted only that the guard
  // does NOT fire, under a name promising the opposite.
  const fn = { parameters: [{}] };
  const msg = unnameablePropsError('Widget', null, fn);
  assert.ok(msg, 'an unnameable first-parameter type must be rejected');
  assert.match(msg, /^Widget: cannot determine a props type\./);
  assert.match(
    msg,
    /Annotate the render function's first parameter/,
    'the message must say what to do about it'
  );

  // A transparent wrapper must not evade it. Each of these resolves to no
  // local declaration, so returning the wrapper's own name would read as
  // resolved, skip the guard, and render an empty table.
  for (const wrapper of ['Readonly', 'NonNullable']) {
    assert.equal(
      transparentPropWrapper(wrapper),
      true,
      `${wrapper} must be unwrapped, not returned as a props type name`
    );
  }
  // Nested wrappers peel all the way down. Stopping at one layer returns the
  // inner wrapper's name, which is truthy and evades the guard.
  const ref = (name, arg) => ({
    typeName: { getText: () => name },
    typeArguments: arg ? [arg] : undefined,
  });
  const fakeTs = { isTypeReferenceNode: n => Boolean(n && n.typeName) };
  assert.equal(
    unwrapPropsTypeName(
      fakeTs,
      ref('Readonly', ref('NonNullable', ref('XProps')))
    ),
    'XProps'
  );
  assert.equal(unwrapPropsTypeName(fakeTs, ref('XProps')), 'XProps');
  // A wrapper that changes the table is refused, not unwrapped: `Partial` and
  // `Required` invert optionality (so the inner interface's own `required`
  // flags would be wrong), and `PropsWithChildren` adds `children` that
  // unwrapping would drop. All resolve to nothing so the guard reports them.
  for (const modifier of ['Partial', 'Required', 'React.PropsWithChildren']) {
    assert.equal(unsupportedPropWrapper(modifier), true, modifier);
    assert.equal(transparentPropWrapper(modifier), false, modifier);
    assert.equal(
      unwrapPropsTypeName(fakeTs, ref(modifier, ref('XProps'))),
      null,
      `${modifier}<XProps> must not resolve to XProps`
    );
  }
  // Including nested under a genuinely transparent one.
  assert.equal(
    unwrapPropsTypeName(fakeTs, ref('Readonly', ref('Partial', ref('XProps')))),
    null
  );
  // No nameable inner type — the case the guard must reject.
  assert.equal(unwrapPropsTypeName(fakeTs, ref('Readonly', null)), null);
  assert.equal(
    unwrapPropsTypeName(fakeTs, ref('Readonly', { kind: 'inline' })),
    null
  );

  // A DOM attribute type is NOT one: `NavbarDivider`'s props are
  // `React.HTMLAttributes<HTMLHRElement>`, which legitimately has no local
  // declaration and takes the `listOnly` path rather than throwing.
  assert.equal(transparentPropWrapper('React.HTMLAttributes'), false);
  assert.equal(transparentPropWrapper('React.LiHTMLAttributes'), false);

  // And the shapes that must NOT trip it.
  assert.equal(
    unnameablePropsError('Widget', 'WidgetProps', fn),
    null,
    'a resolved name is not a failure'
  );
  assert.equal(
    unnameablePropsError('Widget', null, { parameters: [] }),
    null,
    'a component that takes no props is not a failure'
  );
  assert.equal(unnameablePropsError('Widget', null, null), null);

  // The two legitimate no-table cases still render as `listOnly` end to end:
  // a sub whose props are an inline DOM type resolves a NAME with no local
  // declaration, and `DropdownDivider` declares no parameters.
  assert.equal(table('Navbar', 'Navbar.Divider').listOnly, true);
  assert.equal(table('Dropdown', 'Dropdown.Divider').listOnly, true);
});

test('defaults, inheritance and compound sub-paths are mode-independent', () => {
  // The flag is presentation-only: it must not change which props are found,
  // which table they land in, or what their defaults resolve to.
  for (const name of ['Button', 'Navbar', 'Table']) {
    const md = extractComponent(name);
    const structured = extractComponent(name, { markdown: false });

    assert.deepEqual(
      structured.tables.map(t => t.path),
      md.tables.map(t => t.path),
      `${name} sub-paths differ`
    );
    for (const [i, table] of md.tables.entries()) {
      assert.deepEqual(
        structured.tables[i].rows.map(r => [r.name, r.default, r.inherited]),
        table.rows.map(r => [r.name, r.default, r.inherited]),
        `${name} ${table.path} rows differ`
      );
    }
    assert.equal(structured.rootClass, md.rootClass);
  }
});

test('structured mode leaks no markdown into any documented component', () => {
  // The whole point of the mode. A single escaped cell anywhere reaches an
  // agent as literal backticks in a type it is about to write into source.
  for (const name of ['Avatar', 'Slider', 'Columns', 'Grid', 'DateInput']) {
    for (const table of extractComponent(name, { markdown: false }).tables) {
      for (const r of [...table.rows, ...table.extraProps]) {
        assert.ok(
          !r.type.includes('`') && !r.type.includes(']('),
          `${name}.${r.name} type is escaped: ${r.type}`
        );
      }
    }
  }
});
