/**
 * Report helper-prop values the library will silently drop.
 *
 * `useBulmaClasses` validates by membership and emits nothing for a value it
 * does not recognise: no throw, no warning, no fallback. So `textColor="blue"`
 * renders nothing and says nothing at runtime.
 *
 * Who this actually helps, stated plainly because it is narrower than it
 * looks: the helper props are typed as literal unions, so `tsc` already
 * rejects a wrong literal in a `.tsx` file, and rather well (it answers
 * `textAlign="center"` with TS2820 and its own "Did you mean 'centered'?").
 * This rule earns its place where that check is not running:
 *
 *   - JavaScript and JSX projects, which have no such check at all
 *   - editors and CI stages that lint before, or instead of, typechecking
 *   - values `tsc` cannot see as literals, and numbers: `m={2}` typechecks
 *     against a string union in neither direction anyone expects, and the
 *     library's `includes` check never matches it
 *
 * Code in markdown is where this rule has found its real bugs in this repo,
 * but reaching it needs an ESLint markdown processor and a per-fence way to
 * resolve elements, since most fences carry no import. The preset does not
 * match `.md`/`.mdx` and this rule claims nothing about them.
 *
 * It is deliberately not a substitute for typechecking, and the overlap on
 * `.tsx` is expected rather than a defect.
 *
 * The table is keyed by prop rather than by element, with one exception the
 * rule has to know about: a name in it can mean something else entirely on a
 * particular element, and then judging it reports working code.
 * `NOT_A_HELPER_PROP` is that list, and `Theme`'s `radius` is why it exists.
 */
import type { Rule } from 'eslint';
import {
  HELPER_VALUES,
  NOT_A_HELPER_PROP,
  REMOVES_ONLY,
} from '../lib/values.js';
import {
  isTrueValue,
  literalValue,
  numericValue,
  elementOf,
  valuesThatRender,
  withImports,
} from '../lib/elements.js';

/**
 * Closest valid values by a cheap edit-distance, for the message.
 *
 * Short values are not suggested for: every entry of a numeric scale is one
 * edit from `"8"`, so `textSize="8"` would be answered with "did you mean 1
 * or 2 or 3", where the full list of valid values is what actually helps.
 */
function suggest(value: string, valid: readonly string[]): string[] {
  if (value.length < 3) return [];
  const distance = (a: string, b: string): number => {
    const d: number[][] = Array.from({ length: a.length + 1 }, () =>
      new Array<number>(b.length + 1).fill(0)
    );
    for (let i = 0; i <= a.length; i++) d[i][0] = i;
    for (let j = 0; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        d[i][j] = Math.min(
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return d[a.length][b.length];
  };
  return valid
    .map(v => [v, distance(value.toLowerCase(), v.toLowerCase())] as const)
    .filter(([, d]) => d <= Math.max(2, Math.ceil(value.length / 3)))
    .sort((x, y) => x[1] - y[1])
    .slice(0, 3)
    .map(([v]) => v);
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow helper-prop values the library silently drops instead of rendering',
      url: 'https://bestax.io/docs/guides/getting-started/eslint-plugin#valid-helper-value',
    },
    schema: [],
    messages: {
      invalid:
        '`{{prop}}="{{value}}"` is not a value {{prop}} accepts, so the class is never emitted and nothing renders. Valid values: {{valid}}.',
      invalidWithSuggestion:
        '`{{prop}}="{{value}}"` is not a value {{prop}} accepts, so the class is never emitted and nothing renders. Did you mean {{suggestions}}?',
      numeric:
        '`{{prop}}={{{value}}}` is a number, and {{prop}} is matched against strings, so the class is never emitted and nothing renders. Write `{{prop}}="{{value}}"`.',
      numericInvalid:
        '`{{prop}}={{{value}}}` is a number, and {{prop}} is matched against strings. `"{{value}}"` is not a value it accepts either. Valid values: {{valid}}.',
      shorthand:
        '`{{prop}}` is `true` here, and {{prop}} is matched against strings, so the class is never emitted and nothing renders. Give it a value: {{valid}}.',
      shorthandRemoves:
        '`{{prop}}` is `true` here, and {{prop}} is matched against strings, so nothing renders. It is also not a switch: its only value {{valid}} REMOVES the {{thing}}. Omit `{{prop}}` to keep the {{thing}}, or write `{{prop}}="{{only}}"` to remove it.',
    },
  },
  create(context) {
    const { imports, visitor } = withImports();
    return {
      ...visitor,
      JSXOpeningElement(node: unknown) {
        const opening = node as {
          name: unknown;
          attributes: unknown[];
        };
        const element = elementOf(context, opening, imports);
        if (element === null) return;
        // A name in the table can mean something else on a particular
        // element, in which case the table says nothing about it. `Theme`'s
        // `radius` is the case; see NOT_A_HELPER_PROP.
        const shadowed = NOT_A_HELPER_PROP.get(element);
        for (const attr of valuesThatRender(opening)) {
          const prop: string = attr.name.name;
          if (shadowed?.has(prop)) continue;
          const valid = HELPER_VALUES.get(prop);
          if (!valid) continue;
          // `true`, bare or explicit, matches no tuple of strings. Same
          // argument as the numeric case, one type further out.
          if (isTrueValue(attr)) {
            // `radius` and `shadow` are the props a shorthand is most natural
            // on and most wrong on, because their one value removes rather
            // than adds. The length check is what keeps "its only value" true
            // rather than trusting the table to stay a single value.
            const thing = REMOVES_ONLY.get(prop);
            const removes = thing !== undefined && valid.length === 1;
            context.report({
              node: attr,
              messageId: removes ? 'shorthandRemoves' : 'shorthand',
              data: {
                prop,
                thing: thing ?? '',
                only: valid[0] ?? '',
                valid: valid.map(v => `\`${v}\``).join(', '),
              },
            });
            continue;
          }
          // A number never matches a tuple of strings, so it renders nothing
          // however plausible it looks. Worth its own message: the fix is the
          // quotes, not the value.
          const numeric = numericValue(attr);
          if (numeric !== null) {
            context.report({
              node: attr,
              messageId: valid.includes(String(numeric))
                ? 'numeric'
                : 'numericInvalid',
              data: {
                prop,
                value: String(numeric),
                valid: valid.map(v => `\`${v}\``).join(', '),
              },
            });
            continue;
          }
          const value = literalValue(attr);
          if (value === null || valid.includes(value)) continue;
          const suggestions = suggest(value, valid);
          context.report({
            node: attr,
            messageId: suggestions.length ? 'invalidWithSuggestion' : 'invalid',
            data: {
              prop,
              value,
              valid: valid.map(v => `\`${v}\``).join(', '),
              suggestions: suggestions.map(v => `\`${v}\``).join(' or '),
            },
          });
        }
      },
    };
  },
};

export default rule;
