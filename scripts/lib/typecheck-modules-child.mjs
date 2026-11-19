/**
 * Type-checks in-memory modules for scripts/docs-fence-types.test.mjs, run as
 * a child process. Reads `{ options, modules }` as JSON on stdin, where
 * `modules` is a list of `[fileName, source]`, compiles them as one program,
 * and writes the program's own diagnostics and each module's as JSON on
 * stdout.
 *
 * A child rather than a call because the root suite runs under node's test
 * coverage, which instruments every function its process runs, and the
 * TypeScript checker runs about three times slower instrumented. The test
 * starts this with coverage off (without-coverage.mjs), so the checker runs
 * at full speed and nothing here is measured against the coverage floors.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const ts = createRequire(join(REPO, 'package.json'))('typescript');

const { options, modules } = JSON.parse(readFileSync(0, 'utf8'));
const sources = new Map(modules);

const host = ts.createCompilerHost(options);
const { getSourceFile, fileExists, readFile } = host;
host.fileExists = name => sources.has(name) || fileExists.call(host, name);
host.readFile = name => sources.get(name) ?? readFile.call(host, name);
host.getSourceFile = (name, version, ...rest) =>
  sources.has(name)
    ? ts.createSourceFile(name, sources.get(name), version, true)
    : getSourceFile.call(host, name, version, ...rest);
const program = ts.createProgram([...sources.keys()], options, host);

const text = d => ts.flattenDiagnosticMessageText(d.messageText, ' ');
const files = {};
for (const name of sources.keys()) {
  const sourceFile = program.getSourceFile(name);
  files[name] = [
    ...program.getSyntacticDiagnostics(sourceFile),
    ...program.getSemanticDiagnostics(sourceFile),
  ].map(d => ({
    line: sourceFile.getLineAndCharacterOfPosition(d.start ?? 0).line,
    code: d.code,
    text: text(d),
  }));
}

process.stdout.write(
  JSON.stringify({
    compiler: [
      ...program.getOptionsDiagnostics(),
      ...program.getGlobalDiagnostics(),
    ].map(text),
    files,
  })
);
