# create-bestax E2E and Visual Regression Testing

This directory contains end-to-end (E2E) and visual regression tests for create-bestax scaffolded applications using Playwright.

## Overview

The test suite validates:

- ✅ All template variations (vite, vite-ts)
- ✅ All Bulma CSS flavors (complete, prefixed, no-helpers, etc.)
- ✅ Icon library integrations (Font Awesome, MDI, etc.)
- ✅ Interactive component behavior (buttons, notifications, counters)
- ✅ Visual consistency across changes (screenshot comparison)
- ✅ Responsive layouts (desktop, tablet, mobile)

## Test Matrix

**17 test scenarios** running in parallel:

- 10 core tests: All template × Bulma flavor combinations (no icons)
- 5 icon tests: vite + complete + all icon libraries
- 2 TypeScript tests: vite-ts + fontawesome combinations

## Running Tests Locally

### Prerequisites

```bash
# From repository root
npm install

# Install create-bestax dependencies
cd create-bestax
npm install

# Install Playwright browsers
npx playwright install --with-deps chromium
```

### Quick Start

```bash
# Run all tests (from create-bestax directory)
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests with visible browser
npm run test:e2e:headed

# Update baseline screenshots
npm run test:e2e:update
```

### Testing a Specific Configuration

To test a specific template/Bulma/icon combination:

```bash
# 1. Scaffold the app manually
cd ../test-apps  # or any temp directory
node ../create-bestax/dist/index.js test-app -t vite-ts -b prefixed -i fontawesome -y

# 2. Install and build the app
cd test-app
npm install
npm run build

# 3. Start preview server in background
npm run preview &

# 4. Run Playwright tests (from create-bestax/e2e)
cd ../../create-bestax
npm run test:e2e

# 5. Stop the server
kill %1
```

## Project Structure

```
e2e/
├── playwright.config.ts    # Playwright configuration
├── tests/
│   └── app.spec.ts         # E2E and screenshot tests
├── utils/
│   ├── scaffold.ts         # Helper to scaffold test apps
│   └── server.ts           # Vite server management
├── test-results/           # Test output (gitignored)
├── playwright-report/      # HTML reports (gitignored)
└── README.md               # This file
```

## Test Coverage

Each scaffolded app is tested with:

1. **Hero Section** - Verifies branding and layout
2. **Info Cards** - Checks 3-card layout and content
3. **Notification Show** - Tests notification appears when toggled
4. **Notification Hide** - Tests notification disappears when toggled again
5. **Counter Increment** - Verifies counter increases
6. **Counter Reset** - Tests reset button and disabled state
7. **Counter Milestone** - Tests info notification at count > 10
8. **Tablet View** - Responsive layout at 768×1024
9. **Mobile View** - Responsive layout at 375×667
10. **Full Page** - Complete page screenshot

## Visual Regression Testing

### How It Works

1. **Baseline Screenshots**: First run creates baseline screenshots
2. **Comparison**: Subsequent runs compare against baselines
3. **Diff Reports**: Failures generate visual diffs showing changes
4. **Tolerance**: 20% threshold and 100px max diff to avoid false positives

### Updating Baselines

When intentional visual changes are made:

```bash
# Update all baseline screenshots
npm run test:e2e:update

# Commit the updated screenshots
git add e2e/tests/**/*.png
git commit -m "chore(e2e): update baseline screenshots"
```

### Reviewing Failures

When tests fail:

```bash
# View HTML report
npm run test:e2e:report
```

The report shows:

- Expected vs Actual screenshots
- Visual diff highlighting changes
- Test traces for debugging

## CI/CD Integration

### GitHub Actions Workflow

The visual regression workflow (`.github/workflows/visual-regression.yml`) runs:

- **Daily at 2 AM UTC** (scheduled)
- **On PRs** touching create-bestax files
- **Manual trigger** with option to update baselines

### Initializing Baseline Screenshots in CI

**Important:** The first time the workflow runs, or when running on a new branch, you need to generate the baseline screenshots for the Linux environment (GitHub Actions uses Ubuntu).

To initialize or update baselines in CI:

```bash
# Trigger the workflow manually with snapshot update flag
gh workflow run visual-regression.yml --ref <branch-name> -f update_snapshots=true

# Example for a feature branch:
gh workflow run visual-regression.yml --ref feat/94-visual-regression-testing -f update_snapshots=true

# Example for main branch:
gh workflow run visual-regression.yml --ref main -f update_snapshots=true
```

The workflow will:

1. Run all 17 test scenarios
2. Generate baseline screenshots for Linux/Chromium
3. Commit the screenshots back to the branch
4. Push the updated baselines

**Note:** Baseline screenshots are platform-specific. The `-chromium-linux.png` files generated in CI will differ from `-chromium-darwin.png` files generated on macOS.

### Matrix Strategy

All 17 scenarios run in parallel:

- Ubuntu-latest runners
- Chromium browser only (for consistency)
- ~5-7 minutes total workflow time

### Download Metrics

The CI workflow intentionally:

- Uses `npm install` (not `npm ci`) for scaffolded apps
- Disables npm cache for fresh downloads
- Generates ~17 downloads per day of @allxsmith/bestax-bulma
- Results in ~500+ monthly downloads from CI alone

### Artifacts

On test failure, the workflow uploads:

- Test results (traces, videos)
- Playwright HTML report
- Visual diffs (expected, actual, diff images)

## Troubleshooting

### Tests Failing Locally But Passing in CI

- Ensure you're using Chromium (not Chrome): `npx playwright install chromium`
- Check viewport size matches config (1920×1080)
- Verify no OS-level zoom or scaling

### Server Won't Start

```bash
# Check if port 4173 is already in use
lsof -i :4173

# Kill existing process
kill -9 $(lsof -t -i:4173)
```

### Screenshot Diffs Are Too Sensitive

Adjust thresholds in `playwright.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,  // Increase to allow more differences
    threshold: 0.2,      // Increase for more tolerance (0-1)
  },
}
```

### Scaffolding Fails

```bash
# Ensure CLI is built
npm run build

# Check CLI output
node dist/index.js --help
```

## Best Practices

1. **Always build CLI first**: `npm run build` before testing
2. **Use UI mode for debugging**: `npm run test:e2e:ui`
3. **Update baselines intentionally**: Only when visual changes are expected
4. **Review diffs carefully**: Don't blindly update baselines
5. **Test locally before CI**: Ensure tests pass locally first

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Visual Regression Best Practices](https://playwright.dev/docs/test-snapshots)
- [create-bestax README](../README.md)
- [bestax.io Documentation](https://bestax.io)
