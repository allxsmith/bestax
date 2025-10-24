import { test, expect } from '@playwright/test';

/**
 * E2E and Visual Regression Tests for create-bestax scaffolded applications.
 *
 * These tests verify:
 * - Logo section renders correctly with Bestax, Vite, and React logos
 * - Card components display properly
 * - Interactive elements (buttons, notifications) work as expected
 * - Counter functionality operates correctly
 * - Responsive layouts work across different viewports
 *
 * Each test includes both functional assertions and screenshot comparisons
 * for visual regression detection.
 */

test.describe('Scaffolded App - Logo Section', () => {
  test('logo section renders with correct branding', async ({ page }) => {
    await page.goto('/');

    // Verify logo section title
    const logoTitle = page.locator('h1').first();
    await expect(logoTitle).toContainText('Bestax + Vite + React');

    // Verify all three logos are present
    const bestaxLogo = page.locator('img[alt="Bestax"]');
    const viteLogo = page.locator('img[alt="Vite"]');
    const reactLogo = page.locator('img[alt="React"]');

    await expect(bestaxLogo).toBeVisible();
    await expect(viteLogo).toBeVisible();
    await expect(reactLogo).toBeVisible();

    // Visual regression check
    await expect(page).toHaveScreenshot('01-logo-section.png', {
      fullPage: false,
      clip: { x: 0, y: 0, width: 1920, height: 400 },
    });
  });
});

test.describe('Scaffolded App - Info Cards', () => {
  test('three info cards display correctly', async ({ page }) => {
    await page.goto('/');

    // Verify all three cards are present (works for both prefixed and unprefixed)
    const cards = page.locator('[class$="card"]:not([class*="card-"])');
    await expect(cards).toHaveCount(3);

    // Verify card titles
    await expect(
      page.locator('[class$="card-header-title"]').nth(0)
    ).toContainText('Quick Start');
    await expect(
      page.locator('[class$="card-header-title"]').nth(1)
    ).toContainText('Documentation');
    await expect(
      page.locator('[class$="card-header-title"]').nth(2)
    ).toContainText('Examples');

    // Visual regression check for cards section
    const cardsSection = page
      .locator('[class$="columns"]')
      .filter({ hasText: 'Quick Start' })
      .first();
    await expect(cardsSection).toHaveScreenshot('02-info-cards.png');
  });
});

test.describe('Scaffolded App - Notification Toggle', () => {
  test('toggle notification button shows notification', async ({ page }) => {
    await page.goto('/');

    // Initially notification should not be visible (works for both prefixed and unprefixed)
    const notification = page.locator(
      '[class*="notification"][class*="is-success"]'
    );
    await expect(notification).toHaveCount(0);

    // Click toggle button
    const toggleButton = page
      .locator('button')
      .filter({ hasText: 'Toggle Notification' });
    await toggleButton.click();

    // Notification should now be visible
    await expect(notification).toBeVisible();
    await expect(notification).toContainText('Success!');

    // Visual regression check with notification visible
    const interactiveSection = page
      .locator('[class$="box"]')
      .filter({ hasText: 'Interactive Example' });
    await expect(interactiveSection).toHaveScreenshot(
      '03-notification-visible.png'
    );
  });

  test('toggle notification button hides notification', async ({ page }) => {
    await page.goto('/');

    // Show notification
    const toggleButton = page
      .locator('button')
      .filter({ hasText: 'Toggle Notification' });
    await toggleButton.click();

    const notification = page.locator(
      '[class*="notification"][class*="is-success"]'
    );
    await expect(notification).toBeVisible();

    // Click toggle button again to hide
    await toggleButton.click();

    // Notification should be hidden
    await expect(notification).toHaveCount(0);

    // Visual regression check with notification hidden
    const interactiveSection = page
      .locator('[class$="box"]')
      .filter({ hasText: 'Interactive Example' });
    await expect(interactiveSection).toHaveScreenshot(
      '04-notification-hidden.png'
    );
  });
});

test.describe('Scaffolded App - Counter', () => {
  test('counter increments on button click', async ({ page }) => {
    await page.goto('/');

    const counterButton = page.locator('button').filter({ hasText: 'Count:' });

    // Initial state
    await expect(counterButton).toContainText('Count: 0');

    // Click 3 times
    await counterButton.click();
    await expect(counterButton).toContainText('Count: 1');

    await counterButton.click();
    await expect(counterButton).toContainText('Count: 2');

    await counterButton.click();
    await expect(counterButton).toContainText('Count: 3');

    // Visual regression check (works for both prefixed and unprefixed)
    const interactiveSection = page
      .locator('[class$="box"]')
      .filter({ hasText: 'Interactive Example' });
    await expect(interactiveSection).toHaveScreenshot(
      '05-counter-incremented.png'
    );
  });

  test('reset button clears counter and becomes disabled at zero', async ({
    page,
  }) => {
    await page.goto('/');

    const counterButton = page.locator('button').filter({ hasText: 'Count:' });
    const resetButton = page.locator('button').filter({ hasText: 'Reset' });

    // Initially reset button should be disabled
    await expect(resetButton).toBeDisabled();

    // Increment counter
    await counterButton.click();
    await expect(counterButton).toContainText('Count: 1');

    // Reset button should now be enabled
    await expect(resetButton).not.toBeDisabled();

    // Click reset
    await resetButton.click();

    // Counter should be back to 0 and reset button disabled
    await expect(counterButton).toContainText('Count: 0');
    await expect(resetButton).toBeDisabled();

    // Visual regression check
    const interactiveSection = page
      .locator('[class$="box"]')
      .filter({ hasText: 'Interactive Example' });
    await expect(interactiveSection).toHaveScreenshot('06-counter-reset.png');
  });

  test('counter over 10 shows info notification', async ({ page }) => {
    await page.goto('/');

    const counterButton = page.locator('button').filter({ hasText: 'Count:' });

    // Click 11 times to trigger milestone notification
    for (let i = 0; i < 11; i++) {
      await counterButton.click();
    }

    await expect(counterButton).toContainText('Count: 11');

    // Info notification should appear (works for both prefixed and unprefixed)
    const infoNotification = page.locator(
      '[class*="notification"][class*="is-info"]'
    );
    await expect(infoNotification).toBeVisible();
    await expect(infoNotification).toContainText(
      "You've clicked the button 11 times!"
    );

    // Visual regression check
    const interactiveSection = page
      .locator('[class$="box"]')
      .filter({ hasText: 'Interactive Example' });
    await expect(interactiveSection).toHaveScreenshot(
      '07-counter-milestone.png'
    );
  });
});

test.describe('Scaffolded App - Responsive Design', () => {
  test('tablet viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Verify content is still visible
    await expect(page.locator('h1').first()).toContainText('Bestax + Vite + React');

    // Visual regression check
    await expect(page).toHaveScreenshot('08-tablet-view.png', {
      fullPage: true,
    });
  });

  test('mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verify content is still visible
    await expect(page.locator('h1').first()).toContainText('Bestax + Vite + React');

    // Visual regression check
    await expect(page).toHaveScreenshot('09-mobile-view.png', {
      fullPage: true,
    });
  });
});

test.describe('Scaffolded App - Full Page', () => {
  test('complete page renders correctly', async ({ page }) => {
    await page.goto('/');

    // Wait for all content to be loaded (works for both prefixed and unprefixed)
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(
      page.locator('[class$="card"]:not([class*="card-"])').first()
    ).toBeVisible();

    // Full page screenshot for comprehensive visual check
    await expect(page).toHaveScreenshot('10-full-page.png', {
      fullPage: true,
    });
  });
});
