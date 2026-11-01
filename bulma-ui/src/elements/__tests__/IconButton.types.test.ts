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
 * The program holds one file, the fixture below, and what it imports. It
 * takes the compiler options that decide how JSX and the props types check,
 * from the repo's `tsconfig.json`, and loads no `@types` package beyond the
 * ones those imports reach, so it costs a fraction of a full typecheck, and
 * only when the suite runs.
 */
import path from 'path';
import * as ts from 'typescript';

const FIXTURE = path.join(__dirname, 'icon-button-unnamed.fixture.tsx');

const SOURCE = `
import { IconButton } from '../IconButton';

export const plain = <IconButton icon="trash" />;
export const anchor = <IconButton as="a" href="/x" icon="trash" />;
`;

const OPTIONS: ts.CompilerOptions = {
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  esModuleInterop: true,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2020,
  lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'],
  types: [],
  skipLibCheck: true,
  noEmit: true,
};

/** Every error the fixture gets: its line and its message, flattened. */
function errorsOf(source: string) {
  const host = ts.createCompilerHost(OPTIONS);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (file, language, ...rest) =>
    path.resolve(file) === FIXTURE
      ? ts.createSourceFile(file, source, language, true, ts.ScriptKind.TSX)
      : getSourceFile(file, language, ...rest);
  const fileExists = host.fileExists.bind(host);
  host.fileExists = file => path.resolve(file) === FIXTURE || fileExists(file);
  const program = ts.createProgram([FIXTURE], OPTIONS, host);
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

  it.each([
    ['a button', 3],
    ['an anchor', 4],
  ])('reports aria-label missing on %s with no name', (_, line) => {
    const onLine = errors.filter(e => e.line === line);
    expect(onLine).toHaveLength(1);
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
