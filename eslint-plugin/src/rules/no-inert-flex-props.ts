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
 * An element that is a flex container by its own CSS (`Stack`, `Group`,
 * `Center`, `Flex`) emits the five with no `display` prop, so it needs none.
 * It stops being one only when `display` itself, the prop for every width,
 * is something else: `display="block"` adds Bulma's `is-block`, which is
 * `!important`. A viewport's `display*` alone leaves it a flex container at
 * the other widths, so that buys silence. The set is generated from the
 * library, `FLEX_CONTAINER_ELEMENTS`, rather than listed here.
 *
 * Silence beats a guess: an element carrying a spread, or a `display*` whose
 * value the rule cannot read, is left alone.
 */
import type { Rule } from 'eslint';
import { FLEX_CONTAINER_ELEMENTS } from '../generated/metadata.js';
import {
  DISPLAY_PROPS,
  FLEX_CONTAINER_PROPS,
  FLEX_DISPLAYS,
} from '../lib/values.js';
import {
  isUnreadableValue,
  winningAttributes,
  hasSpread,
  literalValue,
  elementOf,
  withImports,
} from '../lib/elements.js';

const CONTAINER = new Set(FLEX_CONTAINER_PROPS);
const DISPLAY = new Set(DISPLAY_PROPS);
const FLEX_CONTAINERS = new Set(FLEX_CONTAINER_ELEMENTS);

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
      notFlex:
        '`{{prop}}` does nothing here: `{{element}}` is a flex container by its own styles, but its `display` prop makes it something else. Drop `display`, or drop `{{prop}}`.',
    },
  },
  create(context) {
    const { imports, visitor } = withImports();
    return {
      ...visitor,
      JSXOpeningElement(node: unknown) {
        const opening = node as { name: unknown; attributes: unknown[] };
        const element = elementOf(context, opening, imports);
        if (element === null) return;
        if (hasSpread(opening)) return;

        const attrs = winningAttributes(opening);
        const containerProps = attrs.filter((a: { name: { name: string } }) =>
          CONTAINER.has(a.name.name)
        );
        if (!containerProps.length) return;

        const displays = attrs.filter((a: { name: { name: string } }) =>
          DISPLAY.has(a.name.name)
        );
        // A display the rule cannot read could be a flex one; say nothing.
        // Anything it CAN read and that is not a flex string — `true`, a
        // number, `{false}` — is knowably not flex, so it must not buy the
        // element silence. `isUnreadableValue` is the line between those.
        if (displays.some(isUnreadableValue)) return;
        if (
          displays.some((a: unknown) =>
            FLEX_DISPLAYS.includes(literalValue(a) as string)
          )
        ) {
          return;
        }

        // A flex container by its own CSS is one unless `display`, the prop
        // for every width, says otherwise.
        const isFlexContainer = FLEX_CONTAINERS.has(element);
        if (
          isFlexContainer &&
          !displays.some(
            (a: { name: { name: string } }) => a.name.name === 'display'
          )
        ) {
          return;
        }

        for (const attr of containerProps) {
          context.report({
            node: attr,
            messageId: isFlexContainer ? 'notFlex' : 'inert',
            data: { prop: attr.name.name, element },
          });
        }
      },
    };
  },
};

export default rule;
