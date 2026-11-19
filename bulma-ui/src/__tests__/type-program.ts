// What the compiler says about a fixture: a TypeScript program over one file
// that exists only in memory, with what it imports. Its compiler options are
// bulma-ui's own, read from `tsconfig.json` and the one it extends, with no
// file listing done, so they can't drift from what `pnpm typecheck` uses. Two
// are added, `types: []`, so no `@types` package loads beyond the ones the
// imports reach, and `noEmit`, and a test can add more. Building a program
// takes seconds, so build it in a `beforeAll` with a timeout of its own: a
// hook keeps Vitest's 10s default rather than the config's `testTimeout`, and
// a loaded machine can take longer than that.
import path from 'path';
import * as ts from 'typescript';

const TSCONFIG = path.resolve(__dirname, '../../tsconfig.json');

/**
 * bulma-ui's compiler options, and `extra` over them. `readDirectory`
 * answers nothing, so the `include` globs list no files: only the options,
 * `extends` followed, are read.
 */
export function compilerOptions(
  extra: ts.CompilerOptions = {}
): ts.CompilerOptions {
  const { config, error } = ts.readConfigFile(TSCONFIG, ts.sys.readFile);
  if (error)
    throw new Error(ts.flattenDiagnosticMessageText(error.messageText, '\n'));
  const host: ts.ParseConfigHost = {
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: () => [],
  };
  const { options } = ts.parseJsonConfigFileContent(
    config,
    host,
    path.dirname(TSCONFIG)
  );
  return { ...options, types: [], noEmit: true, ...extra };
}

/**
 * The program over `source` as the file at `fixture`, read as TSX, with
 * `extra` over the compiler options, and that file in it.
 */
export function programWith(
  fixture: string,
  source: string,
  extra: ts.CompilerOptions = {}
) {
  const target = path.resolve(fixture);
  const options = compilerOptions(extra);
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (file, language, ...rest) =>
    path.resolve(file) === target
      ? ts.createSourceFile(file, source, language, true, ts.ScriptKind.TSX)
      : getSourceFile(file, language, ...rest);
  const fileExists = host.fileExists.bind(host);
  host.fileExists = file => path.resolve(file) === target || fileExists(file);
  const program = ts.createProgram([target], options, host);
  return { program, file: program.getSourceFile(target)! };
}

/**
 * Every error `source` gets as the file at `fixture`, read as TSX, with
 * `extra` over the compiler options: its line, from 0, and its message,
 * flattened.
 */
export function errorsOf(
  fixture: string,
  source: string,
  extra: ts.CompilerOptions = {}
) {
  const { program, file } = programWith(fixture, source, extra);
  return [
    ...program.getSyntacticDiagnostics(file),
    ...program.getSemanticDiagnostics(file),
  ].map(d => ({
    line:
      d.file && d.start !== undefined
        ? d.file.getLineAndCharacterOfPosition(d.start).line
        : -1,
    text: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
  }));
}
