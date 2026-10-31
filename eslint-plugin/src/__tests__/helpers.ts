/**
 * Shared RuleTester wiring.
 *
 * ESLint's own RuleTester is enough here: every rule in this package is
 * syntactic, so none needs type information and none needs the typed-lint
 * parser services. @typescript-eslint/parser is used only to parse TSX.
 *
 * RuleTester reports through a global `describe` and `it` when it finds
 * them, and otherwise runs every case as it is declared, outside any test.
 * The suites import Vitest's rather than rely on globals, so it is handed
 * them here.
 */
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import { describe, it } from 'vitest';

RuleTester.describe = describe;
RuleTester.it = it;

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
