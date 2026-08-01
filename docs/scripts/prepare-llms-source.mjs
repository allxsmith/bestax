/**
 * Build a flattened mirror of the docs tree for `docusaurus-plugin-llms` to read.
 *
 * Why this exists, and why the flattening moved here from after the build:
 *
 * The plugin reads **source** markdown and has no transform hook, so tab JSX used
 * to land verbatim in the generated artifacts and `flatten-llms-tabs.mjs` rewrote
 * them afterwards. That stopped working in plugin 0.5.0, which added
 *
 *     // Remove MDX/JSX component tags (PascalCase element names such as <Tabs>,
 *     // <TabItem>, <Admonition>), keeping their inner text content.
 *     cleaned = cleaned.replace(/<\/?[A-Z][A-Za-z0-9.]*\b[^>]*\/?>/g, '');
 *
 * "Keeping their inner text content" holds for wrapper components, but content
 * carried in **props** goes with the tag. Two things broke, both silently:
 *
 * - `<PackageManagerTabs command="add foo" />` is self-closing and its payload is
 *   the prop, so the whole command vanished from llms.txt.
 * - `<TabItem label="App root (global)">` kept its body but lost its label, so the
 *   `####` headings the flattener would have emitted never existed.
 *
 * Neither is detectable after the fact: `verifyArtifact` catches *leftover* JSX,
 * not silently deleted content, so the build stayed green while the machine-read
 * copy of the docs quietly lost information.
 *
 * The fix is ordering, not content. Flatten the source *first*, into a mirror, and
 * point the plugin at that (`docsDir: [{ path: '.llms-src', routeBasePath: 'docs' }]`
 * — a supported shape: `path` is the filesystem directory, `routeBasePath` is what
 * URLs are built from, so the published links are unchanged). By the time the
 * plugin runs there is no PascalCase JSX left for it to strip, and its cleanup
 * becomes a no-op instead of a lossy step.
 *
 * The mirror is generated, gitignored, and rebuilt from scratch on every run — it
 * is never a place to edit anything.
 */

import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { transform, verifyArtifact } from './flatten-llms-tabs.mjs';

/** Only these reach the plugin; it ignores everything else in the tree. */
const SOURCE_EXTENSIONS = new Set(['.md', '.mdx']);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

export async function prepare(sourceDir, targetDir) {
  // Rebuild from scratch so a renamed or deleted page can't linger in the mirror
  // and keep appearing in llms.txt after it is gone from the site.
  await rm(targetDir, { recursive: true, force: true });

  let written = 0;
  const failures = [];

  for await (const file of walk(sourceDir)) {
    if (!SOURCE_EXTENSIONS.has(path.extname(file))) continue;

    const relative = path.relative(sourceDir, file);
    const flattened = transform(await readFile(file, 'utf8'));

    // Verified here rather than post-build so a failure names the source file an
    // author can actually fix, instead of a generated artifact path.
    for (const problem of verifyArtifact(flattened)) {
      failures.push(`${relative}: ${problem}`);
    }

    const destination = path.join(targetDir, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, flattened);
    written += 1;
  }

  if (failures.length) {
    throw new Error(
      `${failures.length} source file(s) failed verification:\n  ${failures.join('\n  ')}`
    );
  }

  return written;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const sourceDir = process.argv[2] ?? 'docs';
  const targetDir = process.argv[3] ?? '.llms-src';
  prepare(sourceDir, targetDir)
    .then(written => {
      console.log(
        `prepare-llms-source: wrote ${written} file(s) to ${targetDir}`
      );
    })
    .catch(error => {
      console.error(`prepare-llms-source: ${error.message}`);
      process.exitCode = 1;
    });
}
