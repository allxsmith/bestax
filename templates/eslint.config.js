/**
 * How the root `pnpm lint` lints the template projects' `src/`.
 *
 * ESLint reads the config nearest each file, so every file under templates/
 * gets this one rather than the root's. It is the root config with two
 * changes:
 *
 * - The bestax ESLint plugin, with its recommended rules and
 *   `no-bulma-component-class` at error, so a template cannot ship a raw
 *   Bulma component class where bestax has the component.
 * - No type information. The root config reads it from tsconfig.eslint.json,
 *   which covers the packages and not these folders, and none of the rules
 *   here needs it.
 *
 * The plugin is loaded from its build, as scripts/eslint-plugin-docs.test.mjs
 * loads it, which is why it lives here and not in the root config: there
 * every package's lint would need the plugin built first. Here only a lint of
 * templates/ does, and the root `lint` script passes no file under it until
 * there is a template.
 *
 * A template keeps none of the scaffold's ESLint setup. Its own
 * eslint.config.js would be nearer its files than this one and replace it,
 * and scripts/lib/templates.mjs fails a template that has one.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import root from '../eslint.config.js';

const PLUGIN = new URL('../eslint-plugin/dist/index.js', import.meta.url);

if (!existsSync(fileURLToPath(PLUGIN))) {
  throw new Error(
    'templates/eslint.config.js lints with the bestax ESLint plugin, and ' +
      'eslint-plugin/dist is absent. Build first: `pnpm exec turbo run build ' +
      '--filter=@allxsmith/eslint-plugin-bestax`, or `pnpm all`.'
  );
}
const { default: bestax } = await import(PLUGIN.href);

export default [
  ...root,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parserOptions: { project: null } },
  },
  {
    files: ['*/src/**/*.{js,jsx,ts,tsx}'],
    plugins: { '@allxsmith/bestax': bestax },
    rules: {
      ...bestax.configs.recommended.rules,
      '@allxsmith/bestax/no-bulma-component-class': 'error',
    },
  },
];
