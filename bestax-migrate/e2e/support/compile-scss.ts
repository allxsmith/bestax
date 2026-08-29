/**
 * Compiles migrated SCSS with real Dart Sass, so the kitchen-sink and
 * styles-compile e2e suites assert output Dart Sass actually accepts, not
 * just output that matches a substring (the quote-in-comment case fixed in
 * PR #557 passed a substring check while failing a real compile).
 *
 * This package never declares `sass` (or `bulma`) as its own dependency:
 * bulma-ui already carries both, vetted, and the isolated linker means a
 * second declaration here would just be the same versions again. Instead
 * the compile runs as a `node -e` child process with its cwd set to
 * bulma-ui's package root — Node resolves `require()` in an eval script
 * relative to cwd, so `require('sass')` and the `bulma/sass` load path both
 * resolve against bulma-ui's own node_modules, exactly as if this script
 * lived there. `@allxsmith/bestax-bulma/…` specifiers are resolved by hand
 * against bulma-ui's own `src/`: its package.json `exports` map that
 * subpath onto `src/scss/*` for npm consumers, but Dart Sass's plain
 * load-path lookup has no notion of the `exports` field, so it needs a
 * `FileImporter` that mirrors the same rewrite.
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
const bulmaUiRoot = path.join(packageRoot, '..', 'bulma-ui');
const tmpRoot = path.join(packageRoot, '.e2e-tmp');

const COMPILE_SCRIPT = `
const sass = require('sass');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const pkgRoot = process.cwd();
const source = fs.readFileSync(process.env.BESTAX_MIGRATE_COMPILE_SCSS, 'utf8');
const bestaxBulmaImporter = {
  findFileUrl(url) {
    const prefix = '@allxsmith/bestax-bulma/';
    if (!url.startsWith(prefix)) return null;
    let subpath = url.slice(prefix.length);
    if (subpath === 'scss') subpath = 'scss/extras';
    return pathToFileURL(path.join(pkgRoot, 'src', subpath) + '.scss');
  },
};
try {
  sass.compileString(source, {
    loadPaths: [path.join(pkgRoot, 'node_modules')],
    importers: [bestaxBulmaImporter],
    logger: sass.Logger.silent,
  });
} catch (err) {
  process.stderr.write(String((err && err.message) || err));
  process.exitCode = 1;
}
`;

export interface CompileResult {
  status: number | null;
  diagnostics: string;
}

/** Compiles `scss` with Dart Sass; `diagnostics` is empty on success. */
export function compileMigratedScss(scss: string): CompileResult {
  fs.mkdirSync(tmpRoot, { recursive: true });
  const scssPath = fs.mkdtempSync(path.join(tmpRoot, 'compile-scss-'));
  const scssFile = path.join(scssPath, 'input.scss');
  try {
    fs.writeFileSync(scssFile, scss);
    const result = spawnSync(process.execPath, ['-e', COMPILE_SCRIPT], {
      cwd: bulmaUiRoot,
      encoding: 'utf8',
      env: { ...process.env, BESTAX_MIGRATE_COMPILE_SCSS: scssFile },
    });
    // A launch failure (bad cwd, ENOENT, resource limit) surfaces through
    // `result.error`/`result.signal`, not stderr — without these a spawn that
    // never ran would fail the assertion with an empty, unactionable message.
    const diagnostics = [
      result.error ? `spawn failed: ${result.error.message}` : '',
      result.signal ? `terminated by signal ${result.signal}` : '',
      result.stderr ?? '',
    ]
      .filter(Boolean)
      .join('\n')
      .trim();
    return { status: result.status, diagnostics };
  } finally {
    fs.rmSync(scssPath, { recursive: true, force: true });
  }
}
