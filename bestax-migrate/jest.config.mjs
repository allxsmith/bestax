export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/e2e'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/e2e/**/*.test.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__testfixtures__/',
    '/.e2e-tmp/',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__testfixtures__/**',
    '!src/index.ts', // bin entry — exercised via the e2e/CLI tests, not unit-covered
  ],
  coverageThreshold: {
    global: {
      branches: 78,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          target: 'ESNext',
          moduleResolution: 'bundler',
        },
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
};
