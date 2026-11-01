/**
 * What the compiler says about an IconButton with no name.
 *
 * `__typetests__/icon-button.tsx` proves which calls are errors, but an
 * `@ts-expect-error` can't see the message. The name's union puts
 * `IconButtonLabel` last because TypeScript names the union's last member in
 * the error, so a button with neither name reports `aria-label` missing rather
 * than `aria-labelledby`. Reordering the union would still compile and would
 * still reject the call, so only the message shows the difference.
 *
 * The program holds one file, the fixture below, and what it imports. Its
 * compiler options are bulma-ui's own, read from its `tsconfig.json` and the
 * one it extends, with no file listing done, so they can't drift from what
 * `pnpm typecheck` uses. Two are added: `types: []`, so no `@types` package
 * loads beyond the ones the imports reach, and `noEmit`. It's built once the
 * suite runs, not when the file is collected.
 */
import path from 'path';
import * as ts from 'typescript';

const TSCONFIG = path.resolve(__dirname, '../../../tsconfig.json');
const FIXTURE = path.join(__dirname, 'icon-button-unnamed.fixture.tsx');

const SOURCE = `
import { IconButton } from '../IconButton';

export const plain = <IconButton icon="trash" />;
export const anchor = <IconButton as="a" href="/x" icon="trash" />;
`;

/**
 * bulma-ui's compiler options. `readDirectory` answers nothing, so the
 * `include` globs list no files: only the options, `extends` followed, are
 * read.
 */
function compilerOptions(): ts.CompilerOptions {
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
  return { ...options, types: [], noEmit: true };
}

/** Every error the fixture gets: its line and its message, flattened. */
function errorsOf(source: string) {
  const options = compilerOptions();
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (file, language, ...rest) =>
    path.resolve(file) === FIXTURE
      ? ts.createSourceFile(file, source, language, true, ts.ScriptKind.TSX)
      : getSourceFile(file, language, ...rest);
  const fileExists = host.fileExists.bind(host);
  host.fileExists = file => path.resolve(file) === FIXTURE || fileExists(file);
  const program = ts.createProgram([FIXTURE], options, host);
  const fixture = program.getSourceFile(FIXTURE)!;
  return [
    ...program.getSyntacticDiagnostics(fixture),
    ...program.getSemanticDiagnostics(fixture),
  ].map(d => ({
    line:
      d.file && d.start !== undefined
        ? d.file.getLineAndCharacterOfPosition(d.start).line
        : -1,
    text: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
  }));
}

describe('IconButton name type', () => {
  let errors: ReturnType<typeof errorsOf>;
  beforeAll(() => {
    errors = errorsOf(SOURCE);
  });

  it('reads the build options, JSX and strictness included', () => {
    const options = compilerOptions();
    expect(options.jsx).toBe(ts.JsxEmit.ReactJSX);
    expect(options.strict).toBe(true);
    expect(options.types).toEqual([]);
  });

  it.each([
    ['a button', 3],
    ['an anchor', 4],
  ])('reports aria-label missing on %s with no name', (_, line) => {
    const onLine = errors.filter(e => e.line === line);
    expect(onLine).toHaveLength(1);
    // tsc's top line, with each overload's reason nested under it.
    expect(onLine[0].text.split('\n')[0]).toBe(
      'No overload matches this call.'
    );
    expect(onLine[0].text).toContain(
      "Property ''aria-label'' is missing in type"
    );
    expect(onLine[0].text).toContain("required in type 'IconButtonLabel'");
    expect(onLine[0].text).not.toContain("''aria-labelledby'' is missing");
  });

  it('reports nothing else', () => {
    expect(errors.map(e => e.line).sort()).toEqual([3, 4]);
  });
});
