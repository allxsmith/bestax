import { afterEach, beforeEach, inject } from 'vitest';
import { commands } from 'vitest/browser';

// Smoke-pass checks for the stories (#283), beside the render and the `play`
// function that the Storybook plugin runs for each one: a story fails if the
// browser logged an error while it ran. With STORYBOOK_THEME=dark, every
// story renders with `data-theme="dark"` on the root, under a dark OS
// preference (the config sets that one).

declare module 'vitest/browser' {
  interface BrowserCommands {
    takeConsoleErrors: () => Promise<string[]>;
  }
}

declare module 'vitest' {
  export interface ProvidedContext {
    storybookTheme: 'light' | 'dark';
  }
}

const dark = inject('storybookTheme') === 'dark';

/** How long a story's images get to load or fail before its errors are read. */
const IMAGE_WAIT_MS = 5_000;

/**
 * Resolves once every image the story put on the page has loaded or failed,
 * or once IMAGE_WAIT_MS has passed. A broken image logs its error when the
 * load fails, which can be after the story has rendered and played. A lazy
 * image off screen never loads, so it is not waited for.
 */
function imagesSettled() {
  const pending = [...document.images]
    .filter(img => !img.complete && img.loading !== 'lazy')
    .map(
      img =>
        new Promise(resolve => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        })
    );
  return Promise.race([
    Promise.all(pending),
    new Promise(resolve => setTimeout(resolve, IMAGE_WAIT_MS)),
  ]);
}

beforeEach(async () => {
  if (dark) document.documentElement.setAttribute('data-theme', 'dark');
  // Whatever an earlier story logged is that story's, not this one's.
  await commands.takeConsoleErrors();
});

afterEach(async ({ task }) => {
  await imagesSettled();
  const errors = await commands.takeConsoleErrors();
  if (errors.length > 0) {
    throw new Error(
      `Story ${task.name} logged console errors${dark ? ' (dark theme)' : ''}:\n` +
        errors.map(e => `  - ${e}`).join('\n')
    );
  }
});
