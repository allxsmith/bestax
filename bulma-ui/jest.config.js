export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    '\\.(svg|png|jpe?g|gif|webp)$': '<rootDir>/src/__mocks__/fileMock.js',
    // ESM-only; only used inside story `play` functions, never in tests.
    '^storybook/test$': '<rootDir>/src/__mocks__/storybookTest.js',
    '^@allxsmith/bestax$': '<rootDir>/src/index.ts',
  },
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.{test,spec}.{ts,tsx}',
    '!src/**/__tests__/**',
    // Type-level assertions (#641). They are checked by `tsc --noEmit`, never
    // run — and the JSX in them would otherwise instrument as uncovered lines.
    '!src/**/__typetests__/**',
    '!src/**/*.stories.{ts,tsx}',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      branches: 99,
      functions: 99,
      lines: 99,
      statements: 99,
    },
  },
};
