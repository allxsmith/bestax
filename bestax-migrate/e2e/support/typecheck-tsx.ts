/**
 * Typecheck a snippet against the real `@allxsmith/bestax-bulma` types, the
 * way `kitchen-sink.test.ts` typechecks a migrated app — bulma-ui must be
 * built first, which turbo orders.
 *
 * The scratch directory is per process and per caller, never a fixed path:
 * `pnpm all` runs `test` and `test:coverage` in one turbo invocation, so two
 * jest processes reach this file at the same time and a shared path lets them
 * delete each other's work mid-run.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);

export interface TypecheckResult {
  status: number;
  diagnostics: string;
}

/**
 * Write each `.tsx` and run `tsc --noEmit` over all of them together. Files
 * are separate modules rather than one concatenated source so each snippet
 * keeps its own imports and its own top-level names.
 */
export function typecheckTsxFiles(
  files: Record<string, string>,
  label: string
): TypecheckResult {
  const tmpRoot = path.join(packageRoot, '.e2e-tmp');
  fs.mkdirSync(tmpRoot, { recursive: true });
  const dir = fs.mkdtempSync(path.join(tmpRoot, `${label}-`));
  try {
    fs.mkdirSync(path.join(dir, 'src'));
    for (const [name, source] of Object.entries(files)) {
      fs.writeFileSync(path.join(dir, 'src', `${name}.tsx`), source);
    }
    fs.writeFileSync(
      path.join(dir, 'tsconfig.json'),
      JSON.stringify(
        {
          compilerOptions: {
            strict: true,
            noEmit: true,
            jsx: 'react-jsx',
            module: 'ESNext',
            target: 'ES2022',
            moduleResolution: 'bundler',
            lib: ['ES2022', 'DOM', 'DOM.Iterable'],
            skipLibCheck: true,
          },
          include: ['src/**/*'],
        },
        null,
        2
      )
    );
    const result = spawnSync('pnpm', ['exec', 'tsc', '-p', dir], {
      cwd: packageRoot,
      encoding: 'utf8',
    });
    return {
      status: result.status ?? 1,
      diagnostics: `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim(),
    };
  } finally {
    if (!process.env.BESTAX_E2E_KEEP) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}

/** One snippet, under the fixed name `check`. */
export function typecheckTsx(source: string, label: string): TypecheckResult {
  return typecheckTsxFiles({ check: source }, label);
}
