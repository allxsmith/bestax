import js from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import storybookPlugin from 'eslint-plugin-storybook';
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
      '**/__testfixtures__/**', // Codemod fixtures are expected-output text, not lintable source
      'bestax-migrate/fixtures/**', // Source-only migration input app (react-bulma-components imports)
      'bestax-migrate/.e2e-tmp/**', // Scratch output of the kitchen-sink e2e test
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

  // React Hooks — adopt the full react-hooks v7 ruleset (rules-of-hooks,
  // exhaustive-deps, and the React Compiler rules: refs, immutability, purity,
  // set-state-in-effect, etc.).
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
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
    rules: {
      ...reactHooksPlugin.configs['recommended-latest'].rules,
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

  // React correctness rules via @eslint-react (the flat-config-native,
  // TS-first replacement for eslint-plugin-react, which has no eslint 10 support).
  {
    files: ['**/*.{ts,tsx}'],
    ...eslintReact.configs['recommended-typescript'],
  },
  // @eslint-react rule adjustments.
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // React 18 + 19 compatibility: these rules enforce React-19-only APIs,
      // but bestax-bulma supports React 16.8–19 (see peerDependencies). Keeping
      // them on would push the code to React-19-only patterns and break React 18.
      '@eslint-react/no-forward-ref': 'off', // forwardRef is required before React 19
      '@eslint-react/no-use-context': 'off', // use(Context) is React 19+
      '@eslint-react/no-context-provider': 'off', // <Context> as provider is React 19+
      // Owned by eslint-plugin-react-hooks (recommended-latest) above — turn off
      // @eslint-react's equivalents so the same issues aren't double-reported.
      '@eslint-react/exhaustive-deps': 'off',
      '@eslint-react/set-state-in-effect': 'off',
      '@eslint-react/purity': 'off',
      '@eslint-react/static-components': 'off',
      // Stylistic, not correctness, and high-noise on tests/demos (passing
      // `children` as a prop and index keys in static demo lists are both valid).
      '@eslint-react/jsx-no-children-prop': 'off',
      '@eslint-react/no-array-index-key': 'off',
      // Advisory rules that fight this library's intentional composition model.
      // The React.Children / cloneElement APIs are how the Bulma wrapper
      // components inject classes into children, and are valid across React
      // 16.8–19; the use-state lazy-init nudge is a micro-optimization only.
      '@eslint-react/no-children-to-array': 'off',
      '@eslint-react/no-children-map': 'off',
      '@eslint-react/no-children-for-each': 'off',
      '@eslint-react/no-children-count': 'off',
      '@eslint-react/no-clone-element': 'off',
      '@eslint-react/use-state': 'off',
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

  // Storybook CSF hygiene for story files (story-exports, await-interactions,
  // no-renderer-packages, no-redundant-story-name, etc.). Also scoped to
  // .storybook/main.* — inert today since lint only covers src.
  ...storybookPlugin.configs['flat/recommended'],
];
