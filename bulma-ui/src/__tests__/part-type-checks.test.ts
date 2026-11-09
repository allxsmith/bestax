/**
 * A parent tells its parts apart with `isElementOf` (helpers/elementType.ts),
 * never by comparing `child.type` with a component. A part written in a React
 * Server Component reaches the client with a lazy type, so the comparison is
 * false there and the parent lays the part out wrong (#1500).
 *
 * This fails on a `.type` compared with a capitalized name in the library's
 * source. `Fragment` is left out: a Server Component sends a Fragment's
 * children rather than the Fragment, so nothing lazy ever stands in for one.
 * Tests and stories are left out too.
 */
import { readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import * as ts from 'typescript';

const SRC = join(__dirname, '..');

/** The helper itself, which reads `type` to resolve it. */
const EXEMPT = ['helpers/elementType.ts'];

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

const EQUALITY = new Set([
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
]);

/** `x.type` or `x?.type`. */
const readsType = (node: ts.Expression) =>
  ts.isPropertyAccessExpression(node) && node.name.text === 'type';

/** The name a side ends in, when it is `Name` or `a.Name`. */
const nameOf = (node: ts.Expression): string | null => {
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  return null;
};

const isComponentName = (node: ts.Expression) => {
  const name = nameOf(node);
  return name !== null && /^[A-Z]/.test(name) && name !== 'Fragment';
};

/** Each `.type` compared with a component, as `line: code`. */
function rawPartChecks(text: string, fileName = 'file.tsx'): string[] {
  const source = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isBinaryExpression(node) &&
      EQUALITY.has(node.operatorToken.kind) &&
      ((readsType(node.left) && isComponentName(node.right)) ||
        (readsType(node.right) && isComponentName(node.left)))
    ) {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart());
      found.push(`${line + 1}: ${node.getText()}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe('part checks (#1500)', () => {
  it('flags a .type compared with a component, either way round', () => {
    const found = rawPartChecks(
      [
        'a = child.type === CardHeader;',
        'b = Icon !== only?.type;',
        'c = el.type == Parts.Body;',
      ].join('\n')
    );
    expect(found).toEqual([
      '1: child.type === CardHeader',
      '2: Icon !== only?.type',
      '3: el.type == Parts.Body',
    ]);
  });

  it('leaves strings, Fragments and other comparisons alone', () => {
    const found = rawPartChecks(
      [
        "a = event.type === 'pointerup';",
        "b = typeof trigger.type === 'string';",
        'c = child.type === React.Fragment;',
        'd = children.type !== Fragment;',
        'e = input.type === type;',
        'f = isElementOf(child, CardHeader);',
      ].join('\n')
    );
    expect(found).toEqual([]);
  });

  it("don't appear in the library's source", () => {
    const problems = sourceFiles(SRC).flatMap(file => {
      const path = relative(SRC, file).split('\\').join('/');
      if (EXEMPT.includes(path)) return [];
      return rawPartChecks(readFileSync(file, 'utf8'), file).map(
        found =>
          `${path}:${found}. Compare parts through isElementOf ` +
          '(helpers/elementType.ts), which also recognizes a part written ' +
          'in a Server Component.'
      );
    });
    expect(problems).toEqual([]);
  });
});
