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
 * It is reported in one case only, the one that is certain: a literal
 * `display` that is one of the library's own non-flex displays (`block`,
 * `grid` and the rest of `validDisplays`), with no `viewport` prop and no
 * viewport `display*` prop beside it. `useVisibilityClasses` then renders
 * Bulma's `is-<display>`, which is `!important`, at every width. Everything
 * else stays silent, because the library may render no display class at all:
 * it ignores `display` once any viewport `display*` is set, `viewport` limits
 * `display` to one width, and a value outside the tuple (`{true}`, `""`, and
 * `none`, which hides the element instead) emits no display class. The miss
 * that costs is an element whose every viewport `display*` is a block, which
 * would take modelling that hook to see. The set is generated from the
 * library, `FLEX_CONTAINER_ELEMENTS`, rather than listed here.
 *
 * Silence beats a guess: an element carrying a spread, or a `display*` whose
 * value the rule cannot read, is left alone.
 */
import type { Rule } from 'eslint';
import { validDisplays } from '@allxsmith/bestax-bulma/constants';
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
/** The displays the library renders a class for that aren't flex ones. */
const NON_FLEX_DISPLAYS = new Set<string>(
  validDisplays.filter(d => !FLEX_DISPLAYS.includes(d))
);

/**
 * Whether a flex container by its own CSS is certainly not one: a literal
 * `display` from `NON_FLEX_DISPLAYS`, with no `viewport` and no viewport
 * `display*`, the only shape in which the library renders it at every width.
 */
function displayTurnsOff(attrs: { name: { name: string } }[]): boolean {
  if (attrs.some(a => a.name.name === 'viewport')) return false;
  const displays = attrs.filter(a => DISPLAY.has(a.name.name));
  if (displays.some(a => a.name.name !== 'display')) return false;
  const value = displays.length === 1 ? literalValue(displays[0]) : undefined;
  return typeof value === 'string' && NON_FLEX_DISPLAYS.has(value);
}

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

        // A flex container by its own CSS: reported only where `display`
        // certainly turns it off at every width.
        if (FLEX_CONTAINERS.has(element)) {
          if (!displayTurnsOff(attrs)) return;
          for (const attr of containerProps) {
            context.report({
              node: attr,
              messageId: 'notFlex',
              data: { prop: attr.name.name, element },
            });
          }
          return;
        }

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
