/**
 * ESLint rules for `@allxsmith/bestax-bulma`.
 *
 * Flat config only (ESLint 9+): import the plugin and spread its recommended
 * config, or register it under a name of your choosing and turn on the rules
 * you want.
 *
 *   import bestax from '@allxsmith/eslint-plugin-bestax';
 *   export default [bestax.configs.recommended];
 */
import type { ESLint, Linter } from 'eslint';
import noColorAsSurface from './rules/no-color-as-surface.js';
import noDeprecatedProps from './rules/no-deprecated-props.js';
import noInertFlexProps from './rules/no-inert-flex-props.js';
import validHelperValue from './rules/valid-helper-value.js';
import { RECOMMENDED_RULES } from './configs/recommended.js';

export const rules = {
  'valid-helper-value': validHelperValue,
  'no-deprecated-props': noDeprecatedProps,
  'no-color-as-surface': noColorAsSurface,
  'no-inert-flex-props': noInertFlexProps,
} satisfies ESLint.Plugin['rules'];

const plugin: ESLint.Plugin & {
  configs: Record<string, Linter.Config>;
} = {
  meta: { name: '@allxsmith/eslint-plugin-bestax' },
  rules,
  configs: {} as Record<string, Linter.Config>,
};

/**
 * `recommended` registers the plugin under `@allxsmith/bestax` so the rule
 * names in it resolve. That prefix is what the rule ids are written as
 * everywhere, so it is fixed rather than derived.
 */
plugin.configs.recommended = {
  plugins: { '@allxsmith/bestax': plugin },
  rules: RECOMMENDED_RULES,
};

export const configs: Record<string, Linter.Config> = plugin.configs;
export default plugin;
