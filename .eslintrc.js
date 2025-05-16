module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'prettier'],
  env: { browser: true, node: true, jest: true },
  settings: { react: { version: 'detect' } },
  rules: {
    'react/prop-types': 'off',
    'prettier/prettier': 'error'
  }
};