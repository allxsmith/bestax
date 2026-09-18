export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    // Generated from the library's own TSDoc by scripts/gen-eslint-meta.mjs.
    // Its correctness is gated by gen:eslint-meta:check, not by tests here.
    '!src/generated/**',
  ],
  coverageThreshold: {
    global: { branches: 78, functions: 95, lines: 95, statements: 95 },
  },
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
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
