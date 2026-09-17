/**
 * Report flex container props that emit nothing for want of a flex display.
 *
 * `useFlexboxClasses` gates `flexDirection`, `flexWrap`, `justifyContent`,
 * `alignContent` and `alignItems` on a flex `display`: it computes whether any
 * of the ten `display*` props is `flex` or `inline-flex`, and if none is,
 * those five emit no class at all. So `<Box justifyContent="center">` looks
 * like it centres its children and does nothing whatsoever.
 *
 * `alignSelf`, `flexGrow` and `flexShrink` always emit — they describe the
 * element as a flex CHILD, whose container is elsewhere — so they are not
 * reported.
 *
 * Silence beats a guess: an element carrying a spread, or a `display*` whose
 * value the rule cannot read, is left alone.
 */
import type { Rule } from 'eslint';
import {
  DISPLAY_PROPS,
  FLEX_CONTAINER_PROPS,
  FLEX_DISPLAYS,
} from '../lib/values.js';
import {
  isTrueValue,
  winningAttributes,
  hasSpread,
  literalValue,
  elementOf,
  withImports,
} from '../lib/elements.js';

const CONTAINER = new Set(FLEX_CONTAINER_PROPS);
const DISPLAY = new Set(DISPLAY_PROPS);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow flex container props on an element with no flex display',
      url: 'https://bestax.io/docs/guides/getting-started/eslint-plugin#no-inert-flex-props',
    },
    schema: [],
    messages: {
      inert:
        '`{{prop}}` emits no class here: it applies only when a `display` prop is `flex` or `inline-flex`. Add `display="flex"`, or drop `{{prop}}`.',
    },
  },
  create(context) {
    const { imports, visitor } = withImports();
    return {
      ...visitor,
      JSXOpeningElement(node: unknown) {
        const opening = node as { name: unknown; attributes: unknown[] };
        if (elementOf(context, opening, imports) === null) return;
        if (hasSpread(opening)) return;

        const attrs = winningAttributes(opening);
        const containerProps = attrs.filter((a: { name: { name: string } }) =>
          CONTAINER.has(a.name.name)
        );
        if (!containerProps.length) return;

        const displays = attrs.filter((a: { name: { name: string } }) =>
          DISPLAY.has(a.name.name)
        );
        // An unreadable display value could be a flex one; say nothing. A
        // value of `true` is not unreadable though — bare or explicit, it is
        // knowably not `flex`, so it must not buy the element silence.
        if (
          displays.some(
            (a: unknown) => literalValue(a) === null && !isTrueValue(a)
          )
        ) {
          return;
        }
        if (
          displays.some((a: unknown) =>
            FLEX_DISPLAYS.includes(literalValue(a) as string)
          )
        ) {
          return;
        }

        for (const attr of containerProps) {
          context.report({
            node: attr,
            messageId: 'inert',
            data: { prop: attr.name.name },
          });
        }
      },
    };
  },
};

export default rule;
