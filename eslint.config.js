import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

function cleanGlobals(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => key.trim() === key) // no leading/trailing whitespace
  );
}

export default [
  // Ignore patterns
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      'node_modules/**',
      '**/templates/**', // Exclude templates from linting (they're validated separately)
      'test-apps/**', // Exclude test applications from linting
      'create-bestax/test-results/**', // Exclude test results
    ],
  },

  // Base JavaScript recommended rules
  js.configs.recommended,

  // Prettier integration
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  prettierConfig,

  // React and React Hooks
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      globals: {
        ...cleanGlobals(globals.browser),
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: 'module',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      // react-hooks v7 ships the React Compiler ruleset in its recommended
      // presets; we keep the two classic rules to preserve prior behavior.
      // Adopting the full compiler ruleset is a separate, reviewed effort.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off', // Disable the rule
      'react/jsx-uses-react': 'off', // Disable related rule (optional, for completeness)
    },
  },

  // TypeScript (for all subprojects)
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        sourceType: 'module',
        project: ['./tsconfig.eslint.json'],
      },
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Jest environment for test files
  {
    files: [
      '**/__tests__/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
    ],
    languageOptions: {
      globals: {
        ...cleanGlobals(globals.jest),
      },
    },
  },

  // Node environment
  {
    languageOptions: {
      globals: {
        ...cleanGlobals(globals.node),
      },
    },
  },

  // Import resolver settings
  {
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
  },
];
