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
import { plan, type ChildFacts } from '../src/sources/bulma-classes/plan.js';
import { fileChildren, type FileTree } from './support/file-tree.js';
import {
  GLYPHS,
  iconChild,
  iconProps,
  textChild,
} from './support/icon-text.js';
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
  // Every target types it as a number, so the string is written as one.
  ['tabIndex', '0'],
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
  select: [
    ['name', 'n'],
    ['value', 'v'],
    ['disabled', true],
    ['required', true],
  ],
};

/** The only child of an element whose target renders that child itself. */
interface Inner {
  tokens: string[];
  attributes: Array<[string, string | true]>;
}

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
  attributes: Array<[string, string | true]>,
  child?: Inner,
  conditional?: string[][],
  children?: ChildFacts[]
): string | null {
  const unique = [...new Map(attributes)];
  // A root that wraps its children converts only beside one of its parts;
  // the part is taken as given, since only the root's props are checked here.
  const root = Object.hasOwn(ROOTS, tokens[0]) ? ROOTS[tokens[0]] : undefined;
  // One that renders its only child itself converts only around that child,
  // bare unless given, but for what the element's classes need beside them.
  const absorbs = root?.status === 'mapped' ? root.absorbs : undefined;
  const inner: Inner | undefined = absorbs && {
    tokens: child?.tokens ?? [],
    attributes: child?.attributes ?? [
      ...Object.entries(absorbs.pairs ?? {})
        .filter(([, token]) => tokens.includes(token))
        .map(([name]): [string, true] => [name, true]),
    ],
  };
  const result = plan({
    tag,
    tokens,
    conditional,
    attributes: new Map(unique),
    hasSpread: false,
    hasRef: false,
    hasChildren: !VOID.has(tag),
    childTargets: root?.wrapsChildren?.unless ?? [],
    ...(absorbs &&
      inner && {
        soleChild: {
          tag: absorbs.tag,
          ...(inner.tokens.length > 0 && { tokens: inner.tokens }),
          attributes: new Map(inner.attributes),
          hasSpread: false,
          isEmpty: true,
        },
      }),
    // One that needs element children holds one.
    ...(root?.status === 'mapped' &&
      root.needsElementChildren &&
      !absorbs && {
        soleChild: {
          tag: 'i',
          attributes: new Map(),
          hasSpread: false,
          isEmpty: true,
        },
      }),
    // One whose target renders the element around it sits in a bare one,
    // and one whose target renders its text holds that text.
    ...(root?.status === 'mapped' &&
      root.parent && {
        soleChildOf: {
          tag: root.parent.tag,
          attributes: new Map(),
          hasSpread: false,
          isEmpty: false,
        },
      }),
    ...(root?.status === 'mapped' &&
      root.rendersText !== undefined && { text: root.rendersText }),
    // One that builds its icons from props holds an icon and its text.
    ...(root?.status === 'mapped' &&
      root.buildsIcons && {
        childElements: children ?? [iconChild(['fas', 'fa-home']), textChild()],
      }),
    // One that renders the whole `.file` tree holds it, inside a `.field`.
    ...(root?.status === 'mapped' &&
      root.buildsFile && {
        childElements: children ?? fileChildren(),
        classesAround: ['field'],
      }),
    // One that renders its children from a count holds a few of them.
    ...(root?.status === 'mapped' &&
      root.countsChildren && {
        childElements: [1, 2, 3].map(() => ({
          tag: root.countsChildren!.tag,
          attributes: new Map(),
          hasSpread: false,
          isEmpty: true,
        })),
      }),
  });
  const conversion = result.conversion;
  if (!conversion) return null;
  const absorbed = conversion.absorbs;
  const given = [
    ...unique,
    ...(absorbed ? inner!.attributes : [])
      .filter(([name]) => !absorbed!.drop.includes(name))
      .map(([name, value]): [string, string | true] => [
        absorbed!.renames.find(([from]) => from === name)?.[1] ?? name,
        value,
      ]),
  ];
  const attrs = [
    ...conversion.props.map(([name, value]) =>
      conversion.numbers.includes(name)
        ? `${name}={${Number(value)}}`
        : jsxAttr(name, value)
    ),
    ...given
      .filter(([name]) => !conversion.drop.includes(name))
      .map(([name, value]) =>
        conversion.numbers.includes(name)
          ? `${name}={${Number(value)}}`
          : jsxAttr(name, value)
      ),
    ...(absorbed?.props ?? []).map(([name, value]) => jsxAttr(name, value)),
    // A flag a condition adds takes that condition, a boolean here.
    ...(conversion.conditional ?? []).map(([name]) => `${name}={flag}`),
    ...(conversion.className
      ? [jsxAttr('className', conversion.className)]
      : []),
  ];
  const name = `B.${conversion.target}`;
  // One that builds its icons from props is given them as one icon, with
  // its text as the children, or as `items`.
  const icons = conversion.icons;
  if (icons) {
    const inside = children ?? [iconChild(['fas', 'fa-home']), textChild()];
    const built = icons.map(icon => iconProps(icon, inside[icon.index]));
    const text = icons.length === 1 ? icons[0].text : undefined;
    attrs.push(
      icons.length === 1
        ? `iconProps={${JSON.stringify(built[0])}}`
        : `items={${JSON.stringify(
            icons.map((icon, index) => ({
              iconProps: built[index],
              ...(icon.text !== undefined && { text: icon.text }),
            }))
          )}}`
    );
    return text === undefined
      ? `<${name} ${attrs.join(' ')} />`
      : `<${name} ${attrs.join(' ')}>${text}</${name}>`;
  }
  // One that renders the whole `.file` tree is given the <input>'s
  // attributes and the parts, as the transform writes them.
  const file = conversion.file;
  if (file) {
    const [label] = children ?? fileChildren();
    const [input, cta] = label.children!;
    const parts = cta.children!;
    const jsx = (child: ChildFacts): string =>
      `<${child.tag}${child.tokens ? ` className="${child.tokens.join(' ')}"` : ''} />`;
    const content = (part: ChildFacts) =>
      part.children ? `{${jsx(part.children[0])}}` : JSON.stringify(part.text);
    for (const [attribute, value] of input.attributes) {
      if (attribute === 'type') continue;
      attrs.push(
        conversion.numbers.includes(attribute)
          ? `${attribute}={${Number(value)}}`
          : jsxAttr(attribute, value as string | true)
      );
    }
    if (file.inputClassName !== null) {
      attrs.push(jsxAttr('inputClassName', file.inputClassName));
    }
    for (const key of ['buttonLabel', 'iconLeft', 'iconRight'] as const) {
      const index = file[key];
      if (index !== undefined) attrs.push(`${key}=${content(parts[index])}`);
    }
    if (file.fileName !== undefined) {
      attrs.push(jsxAttr('fileName', file.fileName));
    }
    return `<${name} ${attrs.join(' ')} />`;
  }
  // A target that renders the children itself closes itself, as the
  // transform writes it, and so does one in place of a void child.
  return VOID.has(tag) ||
    conversion.rendersChildren ||
    (absorbs && VOID.has(absorbs.tag))
    ? `<${name} ${attrs.join(' ')} />`
    : `<${name} ${attrs.join(' ')}>x</${name}>`;
}

describe('every bulma-classes conversion typechecks', () => {
  it('compiles against @allxsmith/bestax-bulma', () => {
    const files: Record<string, string> = {};
    const header =
      "import * as B from '@allxsmith/bestax-bulma';\ndeclare const flag: boolean;\n";
    const roots = Object.entries(ROOTS).filter(
      ([, entry]) => entry.status === 'mapped'
    );
    for (const [root, entry] of roots) {
      const defaults = Object.entries(entry.defaults ?? {});
      // On a tag the target writes an attribute on, the value it writes.
      const onTag = (tag: string): Array<[string, string]> => [
        ...defaults,
        ...Object.entries(entry.writesAttr ?? {})
          .filter(([, rule]) => rule.on.includes(tag))
          .map(([name, rule]): [string, string] => [name, rule.fallback]),
      ];
      const lines: string[] = [];
      const add = (jsx: string | null) => {
        if (jsx) lines.push(`  ${jsx},`);
      };
      for (const tag of tagsFor(entry)) {
        add(converted(tag, [root], onTag(tag)));
        for (const attribute of [...COMMON, ...(BY_TAG[tag] ?? [])]) {
          add(converted(tag, [root], [...onTag(tag), attribute]));
        }
      }
      for (const [modifier, spec] of Object.entries(entry.modifiers ?? {})) {
        // Beside the attribute its prop also renders, when it needs one.
        const needs: Array<[string, string]> = spec.needsAttr
          ? [[spec.needsAttr.name, spec.needsAttr.value]]
          : [];
        for (const tag of tagsFor(entry)) {
          add(converted(tag, [root, modifier], [...onTag(tag), ...needs]));
          add(
            converted(tag, [root], [...onTag(tag), ...needs], undefined, [
              [modifier],
            ])
          );
        }
      }
      for (const helper of HELPER_TOKENS.keys()) {
        add(converted(entry.tag!, [root, helper], defaults));
      }
      // The child it renders itself: its classes, and what it gives the
      // component (each attribute, and each pair with its rename).
      const spec = entry.absorbs;
      for (const token of Object.keys(spec?.modifiers ?? {})) {
        add(
          converted(entry.tag!, [root], defaults, {
            tokens: [token],
            attributes: [],
          })
        );
      }
      if (spec?.childProps) {
        add(
          converted(entry.tag!, [root], defaults, {
            tokens: [],
            attributes: spec.childProps.map((name): [string, string] => [
              name,
              'x',
            ]),
          })
        );
      }
      if (spec?.attributesOn === 'child') {
        for (const attribute of [...COMMON, ...(BY_TAG[spec.tag] ?? [])]) {
          add(
            converted(entry.tag!, [root], defaults, {
              tokens: [],
              attributes: [attribute],
            })
          );
        }
        for (const [name, token] of Object.entries(spec.pairs ?? {})) {
          add(
            converted(entry.tag!, [root, token], defaults, {
              tokens: [],
              attributes: [[name, true]],
            })
          );
          for (const [renamed, { beside }] of Object.entries(
            spec.renames ?? {}
          )) {
            if (beside !== name) continue;
            add(
              converted(entry.tag!, [root, token], defaults, {
                tokens: [],
                attributes: [
                  [name, true],
                  [renamed, '4'],
                ],
              })
            );
          }
        }
      }
      // The icons it builds from props: each glyph's props, what a `.icon`'s
      // own classes and attributes become, and more than one, as `items`.
      if (entry.buildsIcons) {
        const icons: ChildFacts[] = [
          ...GLYPHS.map(glyph => iconChild(glyph)),
          ...['is-small', 'is-medium', 'is-large', 'has-text-info', 'mt-2'].map(
            token => iconChild(['fas', 'fa-home'], [token])
          ),
          ...COMMON.map(attribute =>
            iconChild(['fas', 'fa-home'], [], {
              'aria-hidden': 'true',
              ...Object.fromEntries([attribute]),
            })
          ),
        ];
        for (const icon of icons) {
          add(converted(entry.tag!, [root], [], undefined, undefined, [icon]));
          add(
            converted(entry.tag!, [root], [], undefined, undefined, [
              icon,
              textChild(),
            ])
          );
        }
        add(
          converted(entry.tag!, [root], [], undefined, undefined, [
            icons[0],
            textChild('a'),
            icons[1],
            icons[2],
            textChild('b'),
          ])
        );
      }
      // The tree it renders from props: the <input>'s attributes it takes as
      // its own, its extra classes, the icons, the default text, a name and
      // an empty name slot, its name pinned empty.
      if (entry.buildsFile) {
        const trees: FileTree[] = [
          { label: 'Choose a file\u2026' },
          { iconLeft: ['fas', 'fa-upload'], iconRight: ['fas', 'fa-check'] },
          { inputTokens: ['my-input'] },
          ...[
            ...COMMON,
            ['name', 'resume'],
            ['accept', 'image/*'],
            ['multiple', true],
            ['required', true],
            ['disabled', true],
          ].map(([attribute, value]): FileTree => ({
            input: { [attribute as string]: value as string | true },
          })),
        ];
        for (const tree of trees) {
          add(
            converted(
              entry.tag!,
              [root],
              [],
              undefined,
              undefined,
              fileChildren(tree)
            )
          );
        }
        add(
          converted(
            entry.tag!,
            [root, 'has-name'],
            [],
            undefined,
            undefined,
            fileChildren({ name: 'cv.pdf' })
          )
        );
        add(
          converted(
            entry.tag!,
            [root, 'has-name', 'is-empty'],
            [],
            undefined,
            undefined,
            fileChildren({})
          )
        );
      }
      expect({ root, conversions: lines.length > 0 }).toEqual({
        root,
        conversions: true,
      });
      files[root] = `${header}export const all = [\n${lines.join('\n')}\n];\n`;
    }
    // A fold's props land on the component inside it.
    for (const [root, entry] of Object.entries(ROOTS)) {
      if (entry.status !== 'fold') continue;
      const lines = [
        [root],
        ...Object.keys(entry.modifiers ?? {}).map(token => [root, token]),
      ].map(tokens => {
        const fold = plan({
          tag: entry.tag!,
          tokens,
          attributes: new Map(),
          hasSpread: false,
          hasRef: false,
          hasChildren: true,
          soleChildTarget: entry.target,
        }).fold!;
        const attrs = fold.props
          .map(([name, value]) =>
            fold.numbers.includes(name)
              ? `${name}={${Number(value)}}`
              : jsxAttr(name, value)
          )
          .join(' ');
        return `  <B.${fold.target} ${attrs}>x</B.${fold.target}>,`;
      });
      files[`fold-${root}`] =
        `${header}export const all = [\n${lines.join('\n')}\n];\n`;
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
