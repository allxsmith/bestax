/**
 * A labeled Field keeps its label's generated `for` only while some content
 * reports holding the Field's id (#1004), so whatever reads that id has to
 * report it. `useFieldLabelTarget` and `useAutoLabelId` do. A module that
 * read `useFieldLabelId` on its own would compile, put the id on its input,
 * report nothing, and lose its label once the Field settles.
 *
 * READERS declares the modules allowed to read it, and this test holds that
 * list to the source both ways: a new reader fails, and so does a listed one
 * that stopped reading it. Tests and stories are left out, since a test may
 * read the id to check what took it.
 */
import { readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import * as ts from 'typescript';

const SRC = join(__dirname, '..', '..');

/** The modules that read `useFieldLabelId`, each reporting what it took. */
const READERS = ['form/FormContext.tsx', 'form/useAutoLabelId.ts'];

const SKIPPED_DIRS = new Set(['__tests__', '__typetests__', '__mocks__']);

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name)) out.push(...sourceFiles(full));
    } else if (
      /\.tsx?$/.test(entry.name) &&
      !/\.(test|spec|stories)\.tsx?$/.test(entry.name)
    ) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Whether the module names `useFieldLabelId` in its code, as an identifier
 * or a string key. Parsed rather than searched, so a comment that mentions
 * it does not count.
 */
function readsFieldLabelId(file: string): boolean {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    false,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  let found = false;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (
      (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) &&
      node.text === 'useFieldLabelId'
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe("readers of a Field's label id (#1004)", () => {
  it('only reach it through a hook that reports holding it', () => {
    const readers = sourceFiles(SRC)
      .filter(readsFieldLabelId)
      .map(file => relative(SRC, file).split('\\').join('/'))
      .sort();
    const problems = [
      ...readers
        .filter(file => !READERS.includes(file))
        .map(
          file =>
            `${file} reads useFieldLabelId. Take the Field's id through ` +
            'useFieldLabelTarget or useAutoLabelId instead, which report it ' +
            'to the Field, or its label drops the for that names this control.'
        ),
      ...READERS.filter(file => !readers.includes(file)).map(
        file => `${file} no longer reads useFieldLabelId. Drop it from READERS.`
      ),
    ];
    expect(problems).toEqual([]);
  });
});
