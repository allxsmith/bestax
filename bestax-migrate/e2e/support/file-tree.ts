/**
 * The `.file` tree a target that `buildsFile` renders from props, as the
 * planner reads it, and the props the transform gives that target from it,
 * for the tests that render or typecheck what it builds.
 */

import type {
  BuiltFile,
  ChildFacts,
} from '../../src/sources/bulma-classes/plan.js';
import { createElement } from './render-module.js';

export interface FileTree {
  /** The <input>'s attributes beside `type="file"`. */
  input?: Record<string, string | true>;
  /** Its classes beside `file-input`. */
  inputTokens?: string[];
  /** The button text. */
  label?: string;
  /** The classes of the <i> in each icon, before and after the text. */
  iconLeft?: string[];
  iconRight?: string[];
  /** The `.file-name`'s text. */
  name?: string;
}

const facts = (
  tag: string,
  tokens: string[],
  extra: Partial<ChildFacts> = {}
): ChildFacts => ({
  tag,
  tokens,
  attributes: new Map(),
  hasSpread: false,
  isEmpty: false,
  ...extra,
});

/** The `.file`'s children, its one `.file-label` <label>, as facts. */
export function fileChildren(tree: FileTree = {}): ChildFacts[] {
  const icon = (glyph: string[]) =>
    facts('span', ['file-icon'], {
      staticContent: true,
      children: [facts('i', glyph, { isEmpty: true })],
      soleChild: facts('i', glyph, { isEmpty: true }),
    });
  const text = tree.label ?? 'Upload';
  const cta = facts('span', ['file-cta'], {
    children: [
      ...(tree.iconLeft ? [icon(tree.iconLeft)] : []),
      facts('span', ['file-label'], { staticContent: true, text }),
      ...(tree.iconRight ? [icon(tree.iconRight)] : []),
    ],
  });
  const input = facts('input', ['file-input', ...(tree.inputTokens ?? [])], {
    attributes: new Map(Object.entries({ type: 'file', ...tree.input })),
    isEmpty: true,
  });
  const name =
    tree.name === undefined
      ? []
      : [
          facts('span', ['file-name'], {
            staticContent: true,
            text: tree.name,
          }),
        ];
  return [facts('label', ['file-label'], { children: [input, cta, ...name] })];
}

/** An element as written, from its facts, down its tree. */
export function rawFrom(child: ChildFacts): unknown {
  return createElement(
    child.tag,
    {
      ...(child.tokens ? { className: child.tokens.join(' ') } : {}),
      ...Object.fromEntries(child.attributes),
    },
    child.children
      ? child.children.map(rawFrom)
      : child.soleChild
        ? rawFrom(child.soleChild)
        : child.text
  );
}

/**
 * The props the transform gives the target from the tree: the <input>'s
 * attributes but its class and type, then the parts it built.
 */
export function fileProps(
  built: BuiltFile,
  children: readonly ChildFacts[],
  numbers: readonly string[]
): Record<string, unknown> {
  const [label] = children;
  const [input, cta] = label.children!;
  const parts = cta.children!;
  const content = (part: ChildFacts) =>
    part.children
      ? part.children.length === 1
        ? rawFrom(part.children[0])
        : part.children.map(rawFrom)
      : part.text;
  return {
    ...Object.fromEntries(
      [...input.attributes]
        .filter(([name]) => name !== 'type')
        .map(([name, value]) => [
          name,
          numbers.includes(name) ? Number(value) : value,
        ])
    ),
    ...(built.inputClassName !== null && {
      inputClassName: built.inputClassName,
    }),
    ...(built.buttonLabel !== undefined && {
      buttonLabel: content(parts[built.buttonLabel]),
    }),
    ...(built.iconLeft !== undefined && {
      iconLeft: content(parts[built.iconLeft]),
    }),
    ...(built.iconRight !== undefined && {
      iconRight: content(parts[built.iconRight]),
    }),
    ...(built.fileName !== undefined && { fileName: built.fileName }),
  };
}
