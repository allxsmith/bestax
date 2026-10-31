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

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
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
 * How many tsc runs a batch is split across. tsc checks on one thread, so the
 * runs side by side finish in about their share of the time. Each run loads
 * the library's types again, so a few take nearly all of the gain.
 */
const RUNS = Math.min(4, os.availableParallelism());

function scratchDir(label: string): string {
  const tmpRoot = path.join(packageRoot, '.e2e-tmp');
  fs.mkdirSync(tmpRoot, { recursive: true });
  return fs.mkdtempSync(path.join(tmpRoot, `${label}-`));
}

/** Each source as `src/<name>.tsx`, beside a strict `tsconfig.json`. */
function writeProject(dir: string, files: Record<string, string>): void {
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
}

function removeDir(dir: string): void {
  if (!process.env.BESTAX_E2E_KEEP) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const resultOf = (
  status: number | null,
  stdout: string,
  stderr: string
): TypecheckResult => ({
  status: status ?? 1,
  diagnostics: `${stdout}\n${stderr}`.trim(),
});

/** How both paths below start tsc over one project. */
const tscCommand = (dir: string) =>
  ['pnpm', ['exec', 'tsc', '-p', dir], { cwd: packageRoot }] as const;

/** tsc over one project, without blocking, so runs can go side by side. */
function tsc(dir: string): Promise<TypecheckResult> {
  return new Promise((resolve, reject) => {
    const [command, args, options] = tscCommand(dir);
    const child = spawn(command, args, options);
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', chunk => (stdout += chunk));
    child.stderr.setEncoding('utf8').on('data', chunk => (stderr += chunk));
    child.on('error', reject);
    child.on('close', status => resolve(resultOf(status, stdout, stderr)));
  });
}

/**
 * Write each `.tsx` and run `tsc --noEmit` over them. Files are separate
 * modules rather than one concatenated source so each snippet keeps its own
 * imports and its own top-level names. They are split by size across up to
 * `RUNS` tsc runs at once, so none of them may import another.
 */
export async function typecheckTsxFiles(
  files: Record<string, string>,
  label: string
): Promise<TypecheckResult> {
  // A batch with nothing in it would check nothing and pass.
  if (Object.keys(files).length === 0) {
    throw new Error(`typecheckTsxFiles(${label}): no files to check`);
  }
  // Largest first, each to the share with the least source so far.
  const shares = Array.from({ length: RUNS }, () => ({
    size: 0,
    files: {} as Record<string, string>,
  }));
  const bySize = Object.entries(files).sort(
    ([, a], [, b]) => b.length - a.length
  );
  for (const [name, source] of bySize) {
    const share = shares.reduce((least, s) =>
      s.size < least.size ? s : least
    );
    share.files[name] = source;
    share.size += source.length;
  }
  const dirs: string[] = [];
  try {
    for (const share of shares) {
      if (Object.keys(share.files).length === 0) continue;
      const dir = scratchDir(`${label}-${dirs.length}`);
      dirs.push(dir);
      writeProject(dir, share.files);
    }
    // Every run settles before `finally` removes the projects they read.
    const settled = await Promise.allSettled(dirs.map(tsc));
    const results = settled.map(run => {
      if (run.status === 'rejected') throw run.reason;
      return run.value;
    });
    return {
      status: results.find(result => result.status !== 0)?.status ?? 0,
      diagnostics: results
        .map(result => result.diagnostics)
        .filter(Boolean)
        .join('\n'),
    };
  } finally {
    dirs.forEach(removeDir);
  }
}

/** One snippet, under the fixed name `check`. */
export function typecheckTsx(source: string, label: string): TypecheckResult {
  const dir = scratchDir(label);
  try {
    writeProject(dir, { check: source });
    const [command, args, options] = tscCommand(dir);
    const result = spawnSync(command, args, { ...options, encoding: 'utf8' });
    return resultOf(result.status, result.stdout ?? '', result.stderr ?? '');
  } finally {
    removeDir(dir);
  }
}
