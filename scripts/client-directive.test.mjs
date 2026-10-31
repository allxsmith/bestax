/**
 * Hold bulma-ui's build to where each module says it runs.
 *
 * React Server Components (the Next.js App Router) render a module on the
 * server unless it starts with `'use client'`. Every bestax component reads
 * the class prefix from ConfigProvider's context, so on the server it fails,
 * and before the build marked its modules, importing the library into a
 * Server Component failed outright on `createContext`. rollup.config.js
 * (`runsOnClient`) now starts each ES module that imports React at runtime
 * with the directive, and leaves the rest, the pure helpers and constants,
 * as server modules a Server Component can call.
 *
 * This reads the emitted files rather than the config, so it checks what
 * ships: every module that imports React starts with the directive, no other
 * module carries it, and neither the entry, which only re-exports, nor the
 * CommonJS build, which `require()` loads and Server Components don't, has
 * one. A module that gained a React import without the directive would break
 * every Server Component that renders it, and one that kept the directive
 * after losing its React import would turn its exports into client
 * references a Server Component can no longer call.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';
import ts from 'typescript';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(REPO, 'bulma-ui', 'dist');
const REACT_RUNTIME = new Set(['react', 'react-dom', 'react/jsx-runtime']);

/**
 * Asserted rather than skipped, like the other suites that read the build:
 * Vitest exits 0 on a skip.
 */
const requireBuilt = () =>
  assert.ok(
    existsSync(join(DIST, 'esm')),
    'bulma-ui/dist/esm is absent, so this suite has nothing to read. Run ' +
      '`pnpm --filter @allxsmith/bestax-bulma build` first, or the whole ' +
      'gate with `pnpm all`.'
  );

const parse = file =>
  ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS
  );

/** Whether a module's first statement is the `'use client'` directive. */
const startsUseClient = source => {
  const first = source.statements[0];
  return (
    first !== undefined &&
    ts.isExpressionStatement(first) &&
    ts.isStringLiteral(first.expression) &&
    first.expression.text === 'use client'
  );
};

/** Whether a module imports, or re-exports from, React at runtime. */
const importsReact = source =>
  source.statements.some(
    statement =>
      (ts.isImportDeclaration(statement) ||
        ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier !== undefined &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      REACT_RUNTIME.has(statement.moduleSpecifier.text)
  );

const modulesUnder = dir =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
    .map(entry => join(entry.parentPath, entry.name));

describe("bulma-ui's 'use client' directives", () => {
  it('start every ES module that imports React, and no other', () => {
    requireBuilt();
    const wrong = [];
    let client = 0;
    for (const file of modulesUnder(join(DIST, 'esm'))) {
      const source = parse(file);
      const needs = importsReact(source);
      if (needs) client += 1;
      if (needs !== startsUseClient(source)) {
        wrong.push(
          `${relative(REPO, file)}: ${needs ? 'imports React without' : 'has'} the directive`
        );
      }
    }
    assert.deepEqual(wrong, []);
    // A build that stopped emitting React imports, or this suite reading the
    // wrong folder, would pass the check above with nothing in it.
    assert.ok(client > 100, `only ${client} modules import React`);
  });

  it('leave the entry, the constants and the CommonJS build unmarked', () => {
    requireBuilt();
    for (const file of ['index.esm.js', 'constants.esm.js']) {
      assert.equal(
        startsUseClient(parse(join(DIST, file))),
        false,
        `${file} only re-exports or holds constants, so it stays a server module`
      );
    }
    for (const file of ['index.cjs', 'constants.cjs']) {
      assert.doesNotMatch(
        readFileSync(join(DIST, file), 'utf8'),
        /^\s*['"]use client['"]/m,
        `${file} is loaded by require(), which React Server Components don't use`
      );
    }
  });

  it('read a directive only where one is, as the first statement', () => {
    const source = text =>
      ts.createSourceFile('x.js', text, ts.ScriptTarget.Latest, true);
    assert.equal(
      startsUseClient(source("/* banner */\n'use client';\nimport 'react';")),
      true
    );
    assert.equal(
      startsUseClient(source("import 'react';\n'use client';")),
      false
    );
    assert.equal(startsUseClient(source('')), false);
    assert.equal(
      importsReact(source("export { useState } from 'react';")),
      true
    );
    assert.equal(importsReact(source("import x from './x.js';")), false);
  });
});
