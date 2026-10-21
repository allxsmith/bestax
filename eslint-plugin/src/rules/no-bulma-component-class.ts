/**
 * Report a plain element styled with a Bulma class bestax has a component
 * for: `<button className="button is-primary">` is bestax `Button`. And
 * report that class in the `className` of a bestax component that renders
 * another one: `<Columns className="box">` keeps a raw `.box` that bestax
 * renders as `Box`.
 *
 * Plain elements are read whatever the file imports: a lowercase tag is
 * plain HTML. A custom element (`<my-card>`) and anything inside `<svg>` or
 * `<math>` are not HTML, so both are left alone. A capitalised tag is read
 * only when it resolves, through the import and through scope, to a bestax
 * component the class table names, which are the ones the codemod writes and
 * whose own classes the table knows. A class that is that component's own
 * (`<Box className="box">`) is not reported. Any other component is left
 * alone, since the table can't say which classes it renders itself.
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
 * would decide by: a family first, else, on a plain element, the one whose
 * component fits its tag best (its own tag, then one `as` reaches), the
 * first in the table's order among equals. On a bestax component, whose tag
 * can come from `as`, the table's order decides.
 *
 * A spread does not silence it: the report is about the class the author
 * wrote, which is there whether or not a spread later replaces it.
 */
import type { Rule } from 'eslint';
import {
  BULMA_COMPONENT_CLASSES,
  type BulmaComponentClass,
} from '../generated/metadata.js';
import {
  attributesOf,
  classJoinerAt,
  classNameTokens,
  elementOf,
  namedAttr,
  withImports,
} from '../lib/elements.js';

/** A lowercase HTML tag: not a component, not a custom element. */
const INTRINSIC = /^[a-z][a-z0-9]*$/;

/** Subtrees whose tags are not HTML. */
const FOREIGN = new Set(['svg', 'math']);

/** The components the table names, whose own classes it knows. */
const COMPONENTS: ReadonlySet<string> = new Set(
  [...BULMA_COMPONENT_CLASSES.values()].map(entry => entry.component)
);

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

/**
 * How well the class's component fits this tag: 2 for its own tag, 1 for one
 * it renders through `as`, 0 for neither.
 */
function fit(entry: BulmaComponentClass, tag: string | null): number {
  if (tag === null) return 0;
  if (entry.tag === tag) return 2;
  return entry.tags === 'any' || entry.tags?.includes(tag) ? 1 : 0;
}

/**
 * The class the codemod decides by, among the ones in `tokens` that `keep`
 * allows: the first family class in the order the element carries them, else
 * the one whose component fits `tag` best, the first in the table's order
 * among equals.
 */
function decidingClass(
  tokens: readonly string[],
  tag: string | null,
  keep: (entry: BulmaComponentClass) => boolean = () => true
): string | undefined {
  const family = tokens.find(token => {
    const entry = BULMA_COMPONENT_CLASSES.get(token);
    return entry?.converts === false && keep(entry);
  });
  if (family !== undefined) return family;
  const carried = [...BULMA_COMPONENT_CLASSES].filter(
    ([key, entry]) => tokens.includes(key) && keep(entry)
  );
  const best = carried.reduce<(typeof carried)[number] | undefined>(
    (found, candidate) =>
      found === undefined || fit(candidate[1], tag) > fit(found[1], tag)
        ? candidate
        : found,
    undefined
  );
  return best?.[0];
}

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
      alsoConverts:
        "`<{{element}}>` also carries Bulma's `.{{cls}}`, which bestax renders as `{{component}}`, and an element renders one component. {{advice}}.",
      alsoFamily:
        "`<{{element}}>` also carries Bulma's `.{{cls}}`, and bestax has `{{component}}` for it, which renders markup of its own. Convert that markup to `{{component}}` by hand, and drop the class.",
    },
  },
  create(context) {
    const { imports, visitor } = withImports();
    return {
      ...visitor,
      JSXOpeningElement(node: unknown) {
        const tag = tagOf(node);
        // The cheap check first: most elements carry no className at all.
        const attr = namedAttr(attributesOf(node), 'className');
        if (!attr) return;
        // Nothing inside <svg> or <math> is HTML, a component's element
        // included.
        if (tag !== null && FOREIGN.has(tag)) return;
        if (insideForeign(context.sourceCode.getAncestors(node as never))) {
          return;
        }
        if (tag === null) {
          const name = elementOf(context, node, imports);
          if (name === null || !COMPONENTS.has(name)) return;
          const tokens = [
            ...classNameTokens(attr, classJoinerAt(context, node)),
          ];
          const cls = decidingClass(
            tokens,
            // No tag to fit: a component's can come from `as`, so the
            // table's order decides here.
            null,
            entry => entry.component !== name
          );
          if (cls === undefined) return;
          const entry = BULMA_COMPONENT_CLASSES.get(cls)!;
          const advice = entry.onAnother
            ? entry.onAnother.charAt(0).toUpperCase() + entry.onAnother.slice(1)
            : `Give \`${entry.component}\` an element of its own around or inside this one and drop the class, then check the layout`;
          context.report({
            node: attr,
            messageId: entry.converts ? 'alsoConverts' : 'alsoFamily',
            data: { element: name, cls, component: entry.component, advice },
          });
          return;
        }

        const tokens = [...classNameTokens(attr, classJoinerAt(context, node))];
        const cls = decidingClass(tokens, tag);
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
