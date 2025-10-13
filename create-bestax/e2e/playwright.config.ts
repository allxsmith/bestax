import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for create-bestax visual regression testing.
 *
 * This config is optimized for:
 * - Visual regression testing with screenshot comparison
 * - E2E testing of scaffolded app interactions
 * - Running in GitHub Actions CI environment
 */
export default defineConfig({
  testDir: './tests',

  // Timeout settings
  timeout: 30000, // 30 seconds per test
  expect: {
    timeout: 5000, // 5 seconds for assertions
    toHaveScreenshot: {
      // Visual regression settings to avoid false positives
      maxDiffPixels: 100, // Allow up to 100 pixels to differ
      threshold: 0.2, // 20% tolerance for anti-aliasing and font rendering differences
    },
  },

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // Fail if test.only is used in CI
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: process.env.CI ? 1 : undefined, // Limit workers in CI to avoid resource issues

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env.CI ? [['github' as const]] : []),
  ],

  // Output directory for test artifacts
  outputDir: 'test-results',

  // Shared settings for all projects
  use: {
    // Base URL - tests should use relative paths
    baseURL: 'http://localhost:4173',

    // Collect trace on first retry for debugging
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',

    // Screenshot settings
    screenshot: 'only-on-failure',

    // Video settings
    video: 'retain-on-failure',

    // Action timeout
    actionTimeout: 10000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  // Note: Web server must be started manually before running tests
  // In CI, the workflow handles starting the Vite preview server
  // Locally, run: npm run preview (in the scaffolded app directory)
});
