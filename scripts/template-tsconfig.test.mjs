/**
 * Guards on scripts/lib/template-tsconfig.mjs, which reads the compiler
 * options the gates over the skill examples and the docs live examples hold
 * code to. A gate is only as strict as the options it reads, so reading them
 * has to fail on a template it cannot follow, never quietly settle for less.
 */
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, sep } from 'node:path';
import { describe, it } from 'vitest';
import {
  VITE_TS_TEMPLATE,
  appCompilerOptions,
} from './lib/template-tsconfig.mjs';

/** Run `check` against a throwaway template holding `files`. */
function withTemplate(files, check) {
  const dir = mkdtempSync(join(tmpdir(), 'template-tsconfig-'));
  try {
    for (const [name, body] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, name)), { recursive: true });
      writeFileSync(
        join(dir, name),
        typeof body === 'string' ? body : JSON.stringify(body)
      );
    }
    check(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('reading the template TypeScript config', () => {
  // The template's configs carry comments, as create-vite's do, so this is
  // also the check that they are read as tsconfig and not as plain JSON.
  it('reads the options from the vite-ts template itself', () => {
    const options = appCompilerOptions();
    assert.ok(
      options.configFilePath.startsWith(VITE_TS_TEMPLATE + sep),
      `read ${options.configFilePath}, outside the template`
    );
  });

  it('fails on a template with no tsconfig.json to start from', () => {
    withTemplate({ 'src/main.ts': 'export {};\n' }, dir =>
      assert.throws(() => appCompilerOptions(dir), /Cannot read file/)
    );
  });

  // An option TypeScript does not recognise is left out of the parsed
  // options, so a misspelled `noUnusedLocals` would let #951 back in.
  it('fails on an option it does not recognise rather than dropping it', () => {
    withTemplate(
      {
        'tsconfig.json': {
          compilerOptions: { noUnusedLocal: true },
          include: ['src'],
        },
        'src/main.ts': 'export {};\n',
      },
      dir =>
        assert.throws(
          () => appCompilerOptions(dir),
          /did not parse cleanly[\s\S]*noUnusedLocal/
        )
    );
  });

  it('fails on a reference cycle rather than following it forever', () => {
    withTemplate(
      {
        'tsconfig.json': { files: [], references: [{ path: './a.json' }] },
        'a.json': { files: [], references: [{ path: './b.json' }] },
        'b.json': { files: [], references: [{ path: './a.json' }] },
      },
      dir =>
        assert.throws(
          () => appCompilerOptions(dir),
          /no project under .* compiles src\//
        )
    );
  });
});
