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
    // Use a selector that works with unprefixed, 'bulma-', and 'bestax-' class names
    const cards = page.locator('.card, .bulma-card, .bestax-card').filter({
      has: page.locator(
        '.card-content, .bulma-card-content, .bestax-card-content'
      ),
    });
    await expect(cards).toHaveCount(3);

    // Verify card titles
    await expect(
      page
        .locator(
          '.card-header-title, .bulma-card-header-title, .bestax-card-header-title'
        )
        .nth(0)
    ).toContainText('Quick Start');
    await expect(
      page
        .locator(
          '.card-header-title, .bulma-card-header-title, .bestax-card-header-title'
        )
        .nth(1)
    ).toContainText('Documentation');
    await expect(
      page
        .locator(
          '.card-header-title, .bulma-card-header-title, .bestax-card-header-title'
        )
        .nth(2)
    ).toContainText('Examples');

    // Visual regression check for cards section
    const cardsSection = page
      .locator('.columns, .bulma-columns, .bestax-columns')
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
      .locator('.box, .bulma-box, .bestax-box')
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
      .locator('.box, .bulma-box, .bestax-box')
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
      .locator('.box, .bulma-box, .bestax-box')
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
      .locator('.box, .bulma-box, .bestax-box')
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
      .locator('.box, .bulma-box, .bestax-box')
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
    await expect(page.locator('h1').first()).toContainText(
      'Bestax + Vite + React'
    );

    // Visual regression check
    await expect(page).toHaveScreenshot('08-tablet-view.png', {
      fullPage: true,
    });
  });

  test('mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verify content is still visible
    await expect(page.locator('h1').first()).toContainText(
      'Bestax + Vite + React'
    );

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
      page.locator('.card, .bulma-card, .bestax-card').first()
    ).toBeVisible();

    // Full page screenshot for comprehensive visual check
    await expect(page).toHaveScreenshot('10-full-page.png', {
      fullPage: true,
    });
  });
});

/**
 * Behavior the screenshots can't pin down: each of these held in one flavor
 * or at one width and broke in another, so they are asserted directly and run
 * in every scenario.
 */
test.describe('Scaffolded App - Layout and Accessibility', () => {
  test('does not scroll sideways at phone width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('centers the title and evens the card heights in every flavor', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.locator('h1').first()).toHaveCSS('text-align', 'center');

    const heights = await page
      .locator('.card, .bestax-card')
      .evaluateAll(cards =>
        cards.map(card => Math.round(card.getBoundingClientRect().height))
      );
    expect(heights).toHaveLength(3);
    expect(new Set(heights).size).toBe(1);
  });

  test('spaces each card icon from its title', async ({ page }) => {
    await page.goto('/');
    const titles = page.locator(
      ':is(.card-header-title, .bestax-card-header-title):has(:is(.icon, .bestax-icon))'
    );
    test.skip((await titles.count()) === 0, 'scaffolded without icons');

    // From the icon's right edge to where the first glyph of the title text
    // is drawn, wherever in the title the text node sits.
    const gaps = await titles.evaluateAll(items =>
      items.map(item => {
        const icon = item.querySelector('.icon, .bestax-icon')!;
        const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
        let text: Node | null = walker.nextNode();
        while (text && (icon.contains(text) || !text.textContent?.trim())) {
          text = walker.nextNode();
        }
        const range = document.createRange();
        range.selectNodeContents(text!);
        return (
          range.getClientRects()[0].left - icon.getBoundingClientRect().right
        );
      })
    );
    for (const gap of gaps) expect(gap).toBeGreaterThan(0);
  });

  test('closes the success notification from its delete button', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .locator('button')
      .filter({ hasText: 'Toggle Notification' })
      .click();

    const notification = page.locator(
      '[class*="notification"][class*="is-success"]'
    );
    await expect(notification).toBeVisible();
    await notification
      .getByRole('button', { name: 'Close notification' })
      .click();
    await expect(notification).toHaveCount(0);
  });

  test('has one main landmark, no banners, and no skipped heading levels', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByRole('main')).toHaveCount(1);
    // A card header outside every landmark is exposed as a page banner.
    await expect(page.getByRole('banner')).toHaveCount(0);

    const levels = await page
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll(headings => headings.map(h => Number(h.tagName.slice(1))));
    expect(levels[0]).toBe(1);
    levels.slice(1).forEach((level, i) => {
      expect(level - levels[i]).toBeLessThanOrEqual(1);
    });
  });

  test('marks the link in running text by more than its color', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'bestax.io' })).toHaveCSS(
      'text-decoration-line',
      'underline'
    );
  });
});
