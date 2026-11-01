/**
 * What the compiler says about an IconButton with no name.
 *
 * `__typetests__/icon-button.tsx` proves which calls are errors, but an
 * `@ts-expect-error` can't see the message. The name's union puts
 * `IconButtonLabel` last because TypeScript names the union's last member in
 * the error, so a button with neither name reports `aria-label` missing rather
 * than `aria-labelledby`. Reordering the union would still compile and would
 * still reject the call, so only the message shows the difference. This
 * checks a small program against the project's own compiler options.
 */
import path from 'path';
import * as ts from 'typescript';

const ROOT = path.resolve(__dirname, '../../..');
const FIXTURE = path.join(__dirname, 'icon-button-unnamed.fixture.tsx');

const SOURCE = `
import { IconButton } from '../IconButton';

export const plain = <IconButton icon="trash" />;
export const anchor = <IconButton as="a" href="/x" icon="trash" />;
`;

/** The messages of every error the fixture gets, flattened, one per line. */
function errorsOf(source: string) {
  const config = ts.readConfigFile(
    path.join(ROOT, 'tsconfig.json'),
    ts.sys.readFile
  );
  const { options } = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    ROOT
  );
  const host = ts.createCompilerHost({ ...options, noEmit: true });
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (file, language, ...rest) =>
    path.resolve(file) === FIXTURE
      ? ts.createSourceFile(file, source, language, true, ts.ScriptKind.TSX)
      : getSourceFile(file, language, ...rest);
  const fileExists = host.fileExists.bind(host);
  host.fileExists = file => path.resolve(file) === FIXTURE || fileExists(file);
  const program = ts.createProgram([FIXTURE], options, host);
  return ts
    .getPreEmitDiagnostics(program, program.getSourceFile(FIXTURE))
    .map(d => ({
      line:
        d.file && d.start !== undefined
          ? d.file.getLineAndCharacterOfPosition(d.start).line
          : -1,
      text: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
    }));
}

describe('IconButton name type', () => {
  const errors = errorsOf(SOURCE);

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
