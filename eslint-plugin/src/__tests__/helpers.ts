/**
 * Shared RuleTester wiring.
 *
 * ESLint's own RuleTester is enough here: every rule in this package is
 * syntactic, so none needs type information and none needs the typed-lint
 * parser services. @typescript-eslint/parser is used only to parse TSX.
 */
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';

export const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

/** Every fixture needs the import for the element to resolve as ours. */
export const imported = (names: string, jsx: string): string =>
  `import { ${names} } from '@allxsmith/bestax-bulma';\nconst x = ${jsx};\n`;
