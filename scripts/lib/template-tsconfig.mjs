/**
 * The compiler options a create-bestax `vite-ts` scaffold compiles `src/`
 * with, read from the template itself.
 *
 * A gate that holds code to what a scaffold compiles, such as the skill
 * examples an agent copies into the app or the docs live examples a reader
 * copies or opens in a sandbox built from this template, reads the options
 * here rather than writing them out. It then follows the template when the
 * template changes, instead of checking against options no app has.
 */
import assert from 'node:assert/strict';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const REPO = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

/** The template `npm create bestax -t vite-ts` copies. */
export const VITE_TS_TEMPLATE = join(
  REPO,
  'create-bestax',
  'templates',
  'vite-ts'
);

/** A tsconfig, parsed, failing loudly on anything unreadable. */
function parseConfig(configPath) {
  const parsed = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: diagnostic => {
        throw new Error(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
        );
      },
    }
  );
  assert.ok(parsed, `could not parse ${configPath}`);
  // Anything short of unreadable lands here and leaves the option it is
  // about out of `parsed.options`, which would weaken the gate silently.
  assert.equal(
    ts.formatDiagnostics(parsed.errors, {
      getCanonicalFileName: file => file,
      getCurrentDirectory: () => REPO,
      getNewLine: () => '\n',
    }),
    '',
    `${configPath} did not parse cleanly, so these are not the template's options`
  );
  return parsed;
}

/**
 * The compiler options of the template project whose files include `src/`,
 * the project an example copied into the app is built by. Followed through
 * project references, so it holds whether the template keeps them in its root
 * tsconfig.json or in a referenced one.
 */
export function appCompilerOptions(template = VITE_TS_TEMPLATE) {
  const src = join(template, 'src') + sep;
  const queue = [join(template, 'tsconfig.json')];
  // Each config once: a reference cycle would otherwise grow the queue forever.
  const seen = new Set(queue);
  while (queue.length > 0) {
    const parsed = parseConfig(queue.shift());
    if (parsed.fileNames.some(file => file.startsWith(src))) {
      return parsed.options;
    }
    for (const ref of parsed.projectReferences ?? []) {
      const path = ts.resolveProjectReferencePath(ref);
      if (!seen.has(path)) {
        seen.add(path);
        queue.push(path);
      }
    }
  }
  assert.fail(`no project under ${relative(REPO, template)} compiles src/`);
}
