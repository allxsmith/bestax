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
 *   - code in markdown and MDX, which no `tsc` program includes; every real
 *     bug this rule has found so far was in a docs fence
 *   - editors and CI stages that lint before, or instead of, typechecking
 *
 * It is deliberately not a substitute for typechecking, and the overlap on
 * `.tsx` is expected rather than a defect.
 */
import type { Rule } from 'eslint';
import { HELPER_VALUES } from '../lib/values.js';
import {
  attributesOf,
  literalValue,
  elementOf,
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
        if (elementOf(context, opening, imports) === null) return;
        for (const attr of attributesOf(opening)) {
          const prop: string = attr.name.name;
          const valid = HELPER_VALUES.get(prop);
          if (!valid) continue;
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
