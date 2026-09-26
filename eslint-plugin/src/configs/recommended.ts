/**
 * The recommended set, and the rules deliberately left out of it.
 *
 * Everything in `recommended` reports code that does not do what it says — a
 * value that never renders, a prop the library has retired, a flex prop that
 * emits nothing. None of those is a preference, so none is a warning.
 *
 * `no-color-as-surface` is opt-in instead: `color` is a documented alias that
 * works, so the rule buys explicitness rather than correctness. Linting the
 * library's own documentation with it on reported dozens of correct examples,
 * which is the evidence it does not belong in a default-on set.
 *
 * `no-bulma-component-class` is opt-in for the same reason: Bulma's classes
 * on plain markup work, and preferring the component is a choice an app makes
 * (typically after `bestax-migrate bulma-classes`), not a bug in its code.
 */
import type { Linter } from 'eslint';

export const RECOMMENDED_RULES: Linter.RulesRecord = {
  '@allxsmith/bestax/valid-helper-value': 'error',
  '@allxsmith/bestax/no-deprecated-props': 'error',
  '@allxsmith/bestax/no-inert-flex-props': 'error',
};

/**
 * Rules the plugin ships with but leaves off by default. Declared rather than
 * inferred, so a new rule that nobody wires into a config fails the surface
 * test instead of shipping switched off by accident.
 */
export const OPT_IN_RULES: readonly string[] = [
  'no-color-as-surface',
  'no-bulma-component-class',
];
