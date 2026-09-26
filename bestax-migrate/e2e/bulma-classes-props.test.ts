/**
 * Every conversion the bulma-classes planner makes also typechecks against
 * bestax-bulma's real types. The render tests prove the HTML is the same,
 * but a component can render an attribute its props type rejects (Delete
 * passes `type` through at runtime and does not declare it), and only tsc
 * sees that.
 *
 * For each mapped root, the planner is asked about the root with each of
 * its modifiers, each helper class, and each common attribute on each tag it
 * reaches; every conversion it returns is written out as the JSX the
 * transform would print, and the lot must compile.
 */

import {
  HELPER_TOKENS,
  ROOTS,
  WRAPPERS,
  type RootEntry,
} from '../src/sources/bulma-classes/class-map.js';
import { plan } from '../src/sources/bulma-classes/plan.js';
import { typecheckTsxFiles } from './support/typecheck-tsx.js';

const VOID = new Set(['input', 'hr', 'img', 'br']);

/** Attributes an element of this tag plausibly carries, as JSX source. */
const COMMON: Array<[string, string | true]> = [
  ['id', 'x'],
  ['title', 'x'],
  ['role', 'note'],
  ['aria-label', 'x'],
  ['data-test', 'x'],
  ['lang', 'en'],
];
const BY_TAG: Record<string, Array<[string, string | true]>> = {
  a: [
    ['href', '/x'],
    ['target', '_blank'],
    ['rel', 'noreferrer'],
    ['download', true],
  ],
  button: [
    ['type', 'button'],
    ['type', 'submit'],
    ['disabled', true],
    ['name', 'n'],
    ['value', 'v'],
  ],
  input: [
    ['type', 'button'],
    ['value', 'v'],
    ['disabled', true],
  ],
  progress: [
    ['value', '40'],
    ['max', '100'],
  ],
};

function tagsFor(entry: RootEntry): string[] {
  if (entry.as === 'any') return [entry.tag!, 'a', 'span', 'input'];
  return [...new Set([entry.tag!, ...(entry.as ?? [])])];
}

function jsxAttr(name: string, value: string | true): string {
  return value === true ? name : `${name}=${JSON.stringify(value)}`;
}

/** The JSX the transform would print for this element, or null. */
function converted(
  tag: string,
  tokens: string[],
  attributes: Array<[string, string | true]>
): string | null {
  const unique = [...new Map(attributes)];
  // A root that wraps its children converts only beside one of its parts;
  // the part is taken as given, since only the root's props are checked here.
  const root = Object.hasOwn(ROOTS, tokens[0]) ? ROOTS[tokens[0]] : undefined;
  const result = plan({
    tag,
    tokens,
    attributes: new Map(unique),
    hasSpread: false,
    hasRef: false,
    hasChildren: !VOID.has(tag),
    childTargets: root?.wrapsChildren?.unless ?? [],
  });
  const conversion = result.conversion;
  if (!conversion) return null;
  const attrs = [
    ...conversion.props.map(([name, value]) => jsxAttr(name, value)),
    ...unique
      .filter(([name]) => !conversion.drop.includes(name))
      .map(([name, value]) =>
        conversion.numbers.includes(name)
          ? `${name}={${Number(value)}}`
          : jsxAttr(name, value)
      ),
    ...(conversion.className
      ? [jsxAttr('className', conversion.className)]
      : []),
  ].join(' ');
  const name = `B.${conversion.target}`;
  return VOID.has(tag)
    ? `<${name} ${attrs} />`
    : `<${name} ${attrs}>x</${name}>`;
}

describe('every bulma-classes conversion typechecks', () => {
  it('compiles against @allxsmith/bestax-bulma', () => {
    const files: Record<string, string> = {};
    const header = "import * as B from '@allxsmith/bestax-bulma';\n";
    const roots = Object.entries(ROOTS).filter(
      ([, entry]) => entry.status === 'mapped'
    );
    for (const [root, entry] of roots) {
      const defaults = Object.entries(entry.defaults ?? {});
      const lines: string[] = [];
      const add = (jsx: string | null) => {
        if (jsx) lines.push(`  ${jsx},`);
      };
      for (const tag of tagsFor(entry)) {
        add(converted(tag, [root], defaults));
        for (const attribute of [...COMMON, ...(BY_TAG[tag] ?? [])]) {
          add(converted(tag, [root], [...defaults, attribute]));
        }
      }
      for (const modifier of Object.keys(entry.modifiers ?? {})) {
        for (const tag of tagsFor(entry)) {
          add(converted(tag, [root, modifier], defaults));
        }
      }
      for (const helper of HELPER_TOKENS.keys()) {
        add(converted(entry.tag!, [root, helper], defaults));
      }
      expect({ root, conversions: lines.length > 0 }).toEqual({
        root,
        conversions: true,
      });
      files[root] = `${header}export const all = [\n${lines.join('\n')}\n];\n`;
    }
    for (const tag of Object.keys(WRAPPERS)) {
      const lines = [...HELPER_TOKENS.keys()]
        .map(helper => converted(tag, [helper], []))
        .filter(Boolean)
        .map(jsx => `  ${jsx},`);
      files[`wrapper-${tag}`] =
        `${header}export const all = [\n${lines.join('\n')}\n];\n`;
    }
    const { status, diagnostics } = typecheckTsxFiles(
      files,
      'bulma-classes-props'
    );
    expect({ status, diagnostics }).toEqual({ status: 0, diagnostics: '' });
  });
});
