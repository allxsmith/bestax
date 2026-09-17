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
import { createRequire } from 'node:module';
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

/**
 * Read at runtime rather than inlined, so semantic-release's version bump is
 * picked up without a codegen step.
 *
 * `meta.version` is not decoration: ESLint hashes the serialized config into
 * the `--cache` fingerprint, and a plugin's id in that config carries its
 * version only when this field is present. Without it a consumer running
 * `eslint --cache` who upgrades to a release that adds a rule, tightens one,
 * or picks up a regenerated deprecation table gets the same hash, so every
 * unchanged file is served from cache and the new behaviour never runs.
 */
const { name, version } = createRequire(import.meta.url)('../package.json') as {
  name: string;
  version: string;
};

const plugin: ESLint.Plugin & {
  configs: Record<string, Linter.Config>;
} = {
  meta: { name, version },
  rules,
  configs: {} as Record<string, Linter.Config>,
};

/**
 * `recommended` registers the plugin under `@allxsmith/bestax` so the rule
 * names in it resolve. That prefix is what the rule ids are written as
 * everywhere, so it is fixed rather than derived.
 *
 * `files` is not optional here. A flat config object without it inherits
 * ESLint's default file set, which is `**\/*.{js,mjs,cjs}` — so `.jsx` and
 * `.tsx` matched nothing, and since every rule in this package visits only
 * `JSXOpeningElement`, spreading this preset on its own lint nothing at all
 * while reporting no error to say so.
 *
 * `.tsx` is in the glob and `.ts`/`.mts`/`.cts` are not, which is a real
 * distinction rather than an oversight:
 *
 *   - `.tsx` is where a TypeScript project's JSX lives, so the rules have to
 *     reach it. Leaving it out was considered and is worse: with the extension
 *     absent from this glob, a consumer who configures a TypeScript parser
 *     still gets no rules on any `.tsx` file, silently, because a flat config
 *     object only applies to what its own `files` matches. Silence for the
 *     library's main audience beats nothing else here.
 *   - `.ts`/`.mts`/`.cts` cannot hold JSX at all (TypeScript requires `.tsx`
 *     for that), so matching them would add parse risk for zero reports.
 *
 * The cost of including `.tsx` is that a TypeScript parser is a REQUIREMENT,
 * not a nicety: spread on its own against a `.tsx` file carrying type syntax,
 * this preset produces `Parsing error: The keyword 'interface' is reserved`
 * rather than a lint report. That is why the docs lead with the parser form.
 *
 * `ecmaFeatures.jsx` makes `.jsx` parse under the default parser. No `parser`
 * is set here on purpose: flat config merges `languageOptions`, so whatever an
 * adjacent config object sets survives this block.
 */
plugin.configs.recommended = {
  files: ['**/*.{js,mjs,cjs,jsx,tsx}'],
  plugins: { '@allxsmith/bestax': plugin },
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  rules: RECOMMENDED_RULES,
};

export const configs: Record<string, Linter.Config> = plugin.configs;
export default plugin;
