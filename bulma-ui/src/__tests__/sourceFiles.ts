import { readdirSync } from 'fs';
import { join } from 'path';

const SKIPPED_DIRS = new Set(['__tests__', '__typetests__', '__mocks__']);

/**
 * The library's own source files under `dir`, for suites that read the
 * source: every `.ts` and `.tsx` file, without the tests, the stories and the
 * test-only folders.
 */
export function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name)) out.push(...sourceFiles(full));
    } else if (
      /\.tsx?$/.test(entry.name) &&
      !/\.(test|spec|stories)\.tsx?$/.test(entry.name)
    ) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Every story file under `dir`, by the extensions `.storybook/main.ts` loads
 * stories from.
 */
export function storyFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...storyFiles(full));
    else if (/\.stories\.(js|jsx|mjs|ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}
