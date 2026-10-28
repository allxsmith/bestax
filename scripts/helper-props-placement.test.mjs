/**
 * Hold what the MCP index says about where a component's helper props go to
 * what the component renders.
 *
 * A props table ends with a catch-all row, "All standard <input> attributes
 * and Bulma helper props", which reads as if both go to the one element. For
 * most components they do. For some, the helper props and `className` go on a
 * wrapper and the other attributes on the control inside it: `Checkbox` puts
 * them on its outer `<label>`, `Select` on its `.select` `<div>` (#1273).
 * Those say so with `@helperProps` on their props type, which the API pages
 * render beside the catch-all row and the index carries as a part's
 * `helperPropsNote`.
 *
 * This renders every part whose catch-all takes helper props, from the built
 * package, with a helper prop and a data attribute, and finds the element each
 * lands on. Where the two land apart, the part must have a note that names the
 * element the helper props are on, any class it names on that element, and the
 * element the attributes are on. Where they land together, it must have none,
 * so a note cannot outlive the markup it describes.
 *
 * It renders on the server, which runs no effects, so a part that renders
 * nothing until it opens is given what opens it in RENDER_WITH, and one that
 * cannot be opened that way is in UNRENDERED, with why. A part this cannot
 * measure and that neither names fails, so a new component is measured rather
 * than skipped. It needs the build, and asserts it rather than skipping, since
 * `node --test` exits 0 on a skip.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const PKG_DIR = join(REPO, 'bulma-ui');
const RECORDS = join(REPO, 'bestax-mcp', 'data', 'components');

/** The attribute that marks where the other attributes land. */
const PROBE = 'data-bestax-probe';
/** A helper prop, and the class it renders. */
const HELPER = { prop: 'mt', value: '3', className: 'mt-3' };

/** What a part needs before it renders the element its helper props go on. */
const RENDER_WITH = {
  Badge: ({ createElement }) => ({ children: createElement('span') }),
  'Command.Dialog': () => ({ defaultOpen: true, actions: [] }),
  Dialog: () => ({ isOpen: true }),
  HoverCard: ({ createElement }) => ({ trigger: createElement('button') }),
  Loading: () => ({ active: true }),
  Popover: ({ createElement }) => ({ trigger: createElement('button') }),
  Sidebar: () => ({ inline: true }),
  Toast: () => ({ inline: true }),
};

/** Parts a server render cannot open, with why. */
const UNRENDERED = new Map([
  [
    'ContextMenu',
    'its menu, which takes the helper props, opens on a right-click',
  ],
]);

/** Every opening tag in some markup, with its attributes and classes. */
function openingTags(html) {
  return [...html.matchAll(/<([a-z][a-z0-9-]*)((?:\s[^>]*)?)>/g)].map(m => ({
    tag: m[1],
    attrs: m[2],
    classes: (m[2].match(/\sclass="([^"]*)"/)?.[1] ?? '').split(/\s+/),
  }));
}

/** Every part of every record whose catch-all row takes the helper props. */
function helperParts() {
  return readdirSync(RECORDS)
    .filter(f => f.endsWith('.json'))
    .sort()
    .flatMap(f => JSON.parse(readFileSync(join(RECORDS, f), 'utf8')).parts)
    .filter(part => part.catchAll?.includes('Bulma helper props'));
}

/**
 * The package and the React it renders with, both resolved from bulma-ui, so
 * the render runs on the React the package itself imports.
 */
function loadLibrary() {
  assert.ok(
    existsSync(join(PKG_DIR, 'dist')),
    'bulma-ui/dist is absent, so the components cannot be rendered. Run ' +
      '`pnpm --filter @allxsmith/bestax-bulma build` first, or the whole ' +
      'gate with `pnpm all`.'
  );
  const require = createRequire(join(PKG_DIR, 'package.json'));
  return {
    React: require('react'),
    server: require('react-dom/server'),
    lib: require('@allxsmith/bestax-bulma'),
  };
}

/** Where a part's helper props and its other attributes land, as tags. */
function placement({ React, server, lib }, path) {
  const component = path.split('.').reduce((o, key) => o?.[key], lib);
  assert.ok(component, `${path} is in the MCP index but not exported`);
  const html = server.renderToStaticMarkup(
    React.createElement(component, {
      [HELPER.prop]: HELPER.value,
      [PROBE]: '',
      ...RENDER_WITH[path]?.(React),
    })
  );
  const tags = openingTags(html);
  return {
    helper: tags.find(t => t.classes.includes(HELPER.className)),
    attrs: tags.find(t => t.attrs.includes(PROBE)),
  };
}

describe('where helper props go', () => {
  const parts = helperParts();

  it('reads parts from the index', () => {
    assert.ok(parts.length > 0, `no part in ${RECORDS} takes helper props`);
  });

  it('names a part only when it says where its helper props go', () => {
    const paths = new Set(parts.map(p => p.path));
    for (const name of [...Object.keys(RENDER_WITH), ...UNRENDERED.keys()]) {
      assert.ok(
        paths.has(name),
        `${name} is named here, but no part of that name takes helper props`
      );
    }
  });

  for (const part of parts) {
    if (UNRENDERED.has(part.path)) continue;
    it(`${part.path} says where its helper props go if not with the rest`, () => {
      const { helper, attrs } = placement(loadLibrary(), part.path);
      assert.ok(
        helper && attrs,
        `${part.path} rendered no element with ${HELPER.prop}'s class and ` +
          `the ${PROBE} attribute. Give it what it needs in RENDER_WITH, or ` +
          `name it in UNRENDERED with why.`
      );
      const note = part.helperPropsNote;
      if (helper === attrs) {
        assert.equal(
          note,
          undefined,
          `${part.path} puts its helper props with its other attributes, ` +
            `on its <${helper.tag}>, so @helperProps on its props type says ` +
            `something it does not do: remove it.`
        );
        return;
      }
      assert.ok(
        note,
        `${part.path} puts its helper props on its <${helper.tag}> and its ` +
          `other attributes on its <${attrs.tag}>. Say so with @helperProps on ` +
          `its props type, then run pnpm gen.`
      );
      assert.equal(
        note.match(/`<(\w+)>`/)?.[1],
        helper.tag,
        `${part.path}'s note names another element first: ${note}`
      );
      for (const [, name] of note.matchAll(/`\.([\w-]+)`/g)) {
        assert.ok(
          helper.classes.includes(name),
          `${part.path}'s note names .${name}, which its <${helper.tag}> ` +
            `does not have: ${note}`
        );
      }
      assert.ok(
        note.includes(`\`<${attrs.tag}>\``),
        `${part.path}'s note does not name the <${attrs.tag}> its other ` +
          `attributes go on: ${note}`
      );
    });
  }
});
