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
 * The program holds one file, the fixture below, and what it imports, with
 * bulma-ui's own compiler options (`src/__tests__/type-program.ts`).
 */
import path from 'path';
import * as ts from 'typescript';
import { compilerOptions, errorsOf } from '../../__tests__/type-program';

const FIXTURE = path.join(__dirname, 'icon-button-unnamed.fixture.tsx');

const SOURCE = `
import { IconButton } from '../IconButton';

export const plain = <IconButton icon="trash" />;
export const anchor = <IconButton as="a" href="/x" icon="trash" />;
`;

describe('IconButton name type', () => {
  let errors: ReturnType<typeof errorsOf>;
  beforeAll(() => {
    errors = errorsOf(FIXTURE, SOURCE);
  }, 30_000);

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
