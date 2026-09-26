/**
 * Report a plain element styled with a Bulma class bestax has a component
 * for: `<button className="button is-primary">` is bestax `Button`.
 *
 * The first rule here that reads intrinsic elements rather than the
 * library's own, which is why it does not start from the bestax import: a
 * lowercase tag is plain HTML whatever the file imports. A custom element
 * (`<my-card>`) and anything inside `<svg>` or `<math>` are not HTML, and a
 * capitalised tag is a component, so all three are left alone.
 *
 * OPT-IN, like `no-color-as-surface`: the markup works, and this rule is a
 * preference for the component over the class. It is for an app that has
 * moved onto bestax (by hand or with `bestax-migrate bulma-classes`) and
 * wants to keep raw Bulma markup from coming back.
 *
 * Report only: no fix, no suggestion. Whether an element converts depends on
 * its tag, attributes and children, and the codemod is the one place that
 * judges that; a second converter here would drift from it.
 *
 * Which classes: those bestax-migrate's table names a component for, read
 * into `BULMA_COMPONENT_CLASSES`. Helper classes are not reported (valid on
 * any tag, and a `<div>` has no bestax wrapper to move them to), nor classes
 * bestax renders only inside a component (`.label`, `.help`), nor the parts
 * of a family, since the family's own class is reported where it sits. An
 * element carrying several is reported once, for the class the codemod
 * would decide by.
 *
 * A spread does not silence it: the report is about the class the author
 * wrote, which is there whether or not a spread later replaces it.
 */
import type { Rule } from 'eslint';
import { BULMA_COMPONENT_CLASSES } from '../generated/metadata.js';
import {
  attributesOf,
  classJoinerAt,
  classNameTokens,
  namedAttr,
} from '../lib/elements.js';

/** A lowercase HTML tag: not a component, not a custom element. */
const INTRINSIC = /^[a-z][a-z0-9]*$/;

/** Subtrees whose tags are not HTML. */
const FOREIGN = new Set(['svg', 'math']);

/* eslint-disable @typescript-eslint/no-explicit-any */
function tagOf(opening: any): string | null {
  const name = opening?.name;
  return name?.type === 'JSXIdentifier' && INTRINSIC.test(name.name)
    ? name.name
    : null;
}

/** Whether an ancestor element is `<svg>` or `<math>`. */
function insideForeign(ancestors: readonly any[]): boolean {
  return ancestors.some(
    ancestor =>
      ancestor?.type === 'JSXElement' &&
      FOREIGN.has(tagOf(ancestor.openingElement) ?? '')
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'prefer the bestax component over a plain element styled with its Bulma class',
      url: 'https://bestax.io/docs/guides/getting-started/eslint-plugin#no-bulma-component-class',
    },
    schema: [],
    messages: {
      converts:
        "`<{{tag}}>` is styled with Bulma's `.{{cls}}`, which bestax renders as `{{component}}`. `bestax-migrate bulma-classes` converts elements like this one where the markup allows.",
      family:
        "`<{{tag}}>` is styled with Bulma's `.{{cls}}`, and bestax has `{{component}}` for it. `bestax-migrate bulma-classes` leaves this markup for you to convert by hand.",
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node: unknown) {
        const tag = tagOf(node);
        if (tag === null || FOREIGN.has(tag)) return;
        // The cheap check first: most elements carry no className at all.
        const attr = namedAttr(attributesOf(node), 'className');
        if (!attr) return;
        if (insideForeign(context.sourceCode.getAncestors(node as never))) {
          return;
        }

        const tokens = [...classNameTokens(attr, classJoinerAt(context, node))];
        // The class the codemod decides by: the first family class in the
        // order the element carries them, else the converted root it ranks
        // first, which is the table's own order.
        const family = tokens.find(
          token => BULMA_COMPONENT_CLASSES.get(token)?.converts === false
        );
        const cls =
          family ??
          [...BULMA_COMPONENT_CLASSES.keys()].find(key => tokens.includes(key));
        if (cls === undefined) return;
        const entry = BULMA_COMPONENT_CLASSES.get(cls)!;
        context.report({
          node: attr,
          messageId: entry.converts ? 'converts' : 'family',
          data: { tag, cls, component: entry.component },
        });
      },
    };
  },
};

export default rule;
