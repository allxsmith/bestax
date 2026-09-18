/**
 * Prefer the explicit `textColor` / `bgColor` props over the `color` alias.
 *
 * On the content elements `color` renders `has-text-<color>` — the same class
 * as `textColor` — and there is no `.box.is-<color>` CSS for it to mean
 * anything else. The library's own TSDoc says to prefer `textColor` for
 * exactly that reason: read on its own, `<Box color="primary">` looks like a
 * filled box and is not one.
 *
 * This rule is OPT-IN, not part of `recommended`, because unlike the other
 * rules here it reports code that works. `color` is a documented alias, and an
 * author who writes it may well want coloured text. What the rule buys is
 * explicitness at the call site.
 *
 * Two things it must not do, both found by linting the library's own docs:
 *
 *   - Fire when the element also sets a background. `<Box bgColor="light"
 *     color="primary">` is a deliberate, correct pairing — surface from one
 *     prop, text from the other — and telling that author "color is not a
 *     background" is nonsense.
 *
 *     `backgroundColor` counts as a background here too, and is checked,
 *     because it reaches `useColorClasses` at runtime on every element: the
 *     components spread `...props` into `useBulmaClasses` last. But most of
 *     the text-alias elements `Omit` it from their PROPS, so that spelling is
 *     a type error on them even though it renders. `bgColor` is the one to
 *     write, and the one this comment names.
 *   - Fire on elements with a real `is-<color>` modifier. Those are absent from
 *     the generated set, so `<Button color="primary">` never reports.
 *
 * It is also silent on an element carrying a spread (which may hold the very
 * background prop that would silence it) and on a `color` whose value it
 * cannot read as a literal.
 */
import type { Rule } from 'eslint';
import { TEXT_ALIAS_COLOR_ELEMENTS } from '../generated/metadata.js';
import {
  validColorShades,
  validColors,
} from '@allxsmith/bestax-bulma/constants';
import {
  attributesOf,
  doubledNames,
  elementOf,
  hasSpread,
  isKnownNonNullish,
  isUnreadableValue,
  literalValue,
  namedAttr,
  withImports,
} from '../lib/elements.js';

const TEXT_ALIAS = new Set(TEXT_ALIAS_COLOR_ELEMENTS);

/** Setting either of these shows the author knows where the surface comes from. */
const BACKGROUND_PROPS = ['bgColor', 'backgroundColor'];

/**
 * Values for which the message's claim is true. `useColorClasses` emits
 * nothing outside this set, so on anything else the rule would assert a class
 * that never renders — and its fix would move a dead value to a different dead
 * prop. A wrong value is `valid-helper-value`'s to report, not this rule's.
 */
const RENDERABLE = new Set<string>([...validColors, 'inherit', 'current']);

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'prefer the explicit textColor prop over the ambiguous color alias',
      url: 'https://bestax.io/docs/guides/getting-started/eslint-plugin#no-color-as-surface',
    },
    schema: [],
    messages: {
      ambiguous:
        '`color` on `{{element}}` is a text-colour alias — it renders `{{rendered}}`, and no `is-<color>` CSS exists for it. Write `textColor="{{value}}"` to say so, or `bgColor="{{value}}"` if you wanted a coloured surface.',
      redundant:
        '`color` on `{{element}}` is ignored here: `textColor` is already set and takes precedence. Remove `color`.',
    },
  },
  create(context) {
    const { imports, visitor } = withImports();
    return {
      ...visitor,
      JSXOpeningElement(node: unknown) {
        const opening = node as { name: unknown; attributes: unknown[] };
        const element = elementOf(context, opening, imports);
        if (element === null || !TEXT_ALIAS.has(element)) return;
        // A spread may carry the background prop that silences this rule, or
        // the textColor that makes `color` redundant. Either way the element's
        // real prop set is unknowable, so say nothing.
        if (hasSpread(opening)) return;

        const attrs = attributesOf(opening);
        const named = (n: string) => namedAttr(attrs, n);

        const color = named('color');
        if (!color) return;

        const textColor = named('textColor');
        if (textColor) {
          // `color: textColor ?? color` ignores `color` only when `textColor`
          // is non-nullish, which is stronger than readable: a readable `null`
          // leaves the `??` resolving to `color`, so the element really does
          // render it and "remove `color`" would delete what renders. A
          // readable `true` or number does win, so those still report.
          //
          // This rule RETURNS in that case rather than reporting `ambiguous`.
          // The ambiguous message would be true — `color` is the value being
          // used as a text alias — but its fix rewrites `color` to `textColor`,
          // which on an element already carrying one emits a duplicate
          // attribute. Silence on an opt-in rule beats that.
          if (!isKnownNonNullish(textColor)) return;
          context.report({
            node: color,
            messageId: 'redundant',
            data: { element },
          });
          return;
        }
        // A background is set explicitly, so `color` is unambiguously the
        // text half of a deliberate pairing. Nothing to say.
        if (BACKGROUND_PROPS.some(named)) return;

        // Only a readable literal is judged, like every other rule here. A
        // computed value could be anything, and the message would have to say
        // so in place of the value, which is not advice anyone can act on.
        const value = literalValue(color);
        if (value === null || !RENDERABLE.has(value)) return;

        // `colorShade` decides which class the library emits, and it applies
        // the same membership test as every other value: `addColorClass`
        // shades only `if (shade && validColorShades.includes(shade))`, and
        // falls back to the unshaded class otherwise. So a shade outside the
        // tuple means the unshaded class, and a shade this rule cannot read
        // means it cannot state the class at all.
        let shadeSuffix = '';
        const shadeAttr = named('colorShade');
        if (shadeAttr) {
          if (isUnreadableValue(shadeAttr)) return;
          // A readable shade that is not in the tuple leaves the class
          // unshaded, which `addColorClass` does for `true` and a number too.
          const shade = literalValue(shadeAttr);
          if (shade !== null && validColorShades.includes(shade as never)) {
            shadeSuffix = `-${shade}`;
          }
        }
        context.report({
          node: color.name,
          messageId: 'ambiguous',
          data: {
            element,
            value,
            rendered: `has-text-${value}${shadeSuffix}`,
          },
          // A doubled `color` is read last-wins, so the value above is the one
          // that renders and the report is right. The FIX is not: renaming the
          // winner leaves the loser behind as a dead `color`, which still
          // resolves correctly through `textColor ?? color` and still wants
          // deleting by hand. Same withholding `no-deprecated-props` does, for
          // the same reason.
          fix: doubledNames(opening).has('color')
            ? null
            : fixer => fixer.replaceText(color.name, 'textColor'),
        });
      },
    };
  },
};

export default rule;
