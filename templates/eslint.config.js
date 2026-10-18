/**
 * Lint for the ported templates' `src/` (templates/CLAUDE.md), run by the root
 * `pnpm lint`.
 *
 * ESLint reads the config nearest each file, so this one, not the root's,
 * covers everything under templates/. It is the root config plus the bestax
 * plugin's `recommended` rules and `no-bulma-component-class` at error: a
 * template is the bestax version of a Bulma page, so a raw Bulma component
 * class left in one is a port that stopped short. The same lookup is why a
 * template folder carries no eslint.config.js of its own, which
 * scripts/templates.test.mjs checks.
 *
 * The plugin comes from its build, the way `scripts/eslint-plugin-docs.test.mjs`
 * loads it, so linting a template needs that build first. ESLint loads this
 * file whenever the lint walks templates/, even with no template in it.
 */
import { existsSync } from 'node:fs';
import root from '../eslint.config.js';

const PLUGIN = new URL('../eslint-plugin/dist/index.js', import.meta.url);
if (!existsSync(PLUGIN)) {
  throw new Error(
    'eslint-plugin/dist is absent, so the templates cannot be linted with ' +
      'the bestax rules. Build first ' +
      '(`pnpm exec turbo run build --filter=@allxsmith/eslint-plugin-bestax`), ' +
      'or run `pnpm all`.'
  );
}
const { default: bestax } = await import(PLUGIN.href);

const SOURCES = ['*/src/**/*.{ts,tsx}'];

export default [
  ...root,
  // A template's own config files are not linted, only what it ships in src/.
  { ignores: ['*/*', '!*/src'] },
  { ...bestax.configs.recommended, files: SOURCES },
  {
    files: SOURCES,
    languageOptions: {
      // The root config's typed-lint program does not hold these files, and
      // no rule that reaches them reads types.
      parserOptions: { project: null },
    },
    rules: { '@allxsmith/bestax/no-bulma-component-class': 'error' },
  },
];
