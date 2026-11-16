/**
 * The code a reader copies: the jsx and tsx fences in the docs and the
 * skills, the `.tsx` examples in the skills, and bulma-ui's stories. The tests
 * that hold an example to the markup a component needs from its caller
 * (`docs-menu-item-links.test.mjs`, `docs-breadcrumb-current.test.mjs`) read
 * it through here, so they agree on what a fence is.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fenceSpans, splitLines } from './api-page.mjs';

/** The repository's root. */
export const REPO = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

/**
 * The bestax-migrate references, left out of the examples: their fences pair
 * another library's markup with what the codemod writes for it, and the
 * codemod keeps the source's markup on purpose, so they show what it does
 * rather than what to copy.
 */
const LEFT_OUT = 'skills/bestax-migrate/references/';

/** Repo-relative paths under `dir` whose name passes `keep`. */
export function filesUnder(dir, keep) {
  return readdirSync(join(REPO, dir), { recursive: true })
    .map(name => join(dir, name).split(sep).join('/'))
    .filter(rel => !rel.includes('/node_modules/') && keep(rel));
}

/**
 * Every file holding examples: the markdown under `docs/docs`, the markdown
 * and `.tsx` under `skills` but the bestax-migrate references, and bulma-ui's
 * stories.
 */
export function exampleFiles() {
  return [
    ...filesUnder('docs/docs', rel => /\.mdx?$/.test(rel)),
    ...filesUnder(
      'skills',
      rel => /\.(mdx?|tsx)$/.test(rel) && !rel.startsWith(LEFT_OUT)
    ),
    ...filesUnder('bulma-ui/src', rel => rel.endsWith('.stories.tsx')),
  ];
}

/**
 * The jsx and tsx in one file, each with the line its code starts on: a
 * `.tsx` file whole, and in any other file each jsx or tsx fence.
 */
export function sourcesOf(rel) {
  const src = readFileSync(join(REPO, rel), 'utf8');
  if (rel.endsWith('.tsx')) return [{ code: src, line: 1 }];
  const { lines } = splitLines(src);
  return fenceSpans(lines)
    .filter(({ open }) =>
      /^ {0,3}(`{3,}|~{3,})\s*(jsx|tsx)\b/.test(lines[open])
    )
    .map(({ open, close }) => ({
      code: lines.slice(open + 1, close).join('\n'),
      line: open + 2,
    }));
}
