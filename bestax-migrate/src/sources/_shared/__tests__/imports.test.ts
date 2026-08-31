/**
 * The import-aliasing escalation. `reserve` falls back to `Bulma<Name>` when
 * the plain name is taken, then to `Bulma<Name>2`, `3`, … when that is taken
 * too — the least-exercised branch in the shared helpers, and one the rbx
 * work made MORE reachable: seeding `bound` with the locals of unmappable
 * source imports (so a retained binding never loses its name) puts more
 * names in the set that `reserve` has to route around.
 */

import transform from '../../rbx/transform.js';
import { runTransform } from '../../../runner.js';

function migrate(source: string): string {
  const { output } = runTransform(transform, 'c.tsx', source, {
    add: () => {},
  });
  return output ?? source;
}

describe('bestax import aliasing escalates past collisions', () => {
  it('uses the plain name when it is free', () => {
    const out = migrate(
      'import { Button } from "rbx";\nexport const A = () => <Button>x</Button>;'
    );
    expect(out).toContain('import { Button } from "@allxsmith/bestax-bulma"');
  });

  it('falls back to Bulma<Name> when the plain name is bound', () => {
    const out = migrate(
      [
        'import { Button as RbxBtn } from "rbx";',
        'const Button = 1;',
        'export const A = () => <RbxBtn>{Button}</RbxBtn>;',
      ].join('\n')
    );
    expect(out).toMatch(/Button as BulmaButton\b/);
  });

  it('escalates to Bulma<Name>2 when Bulma<Name> is bound too', () => {
    const out = migrate(
      [
        'import { Button as RbxBtn } from "rbx";',
        'const Button = 1; const BulmaButton = 2;',
        'export const A = () => <RbxBtn>{Button}{BulmaButton}</RbxBtn>;',
      ].join('\n')
    );
    expect(out).toContain('Button as BulmaButton2');
    expect(out).toContain('<BulmaButton2>');
  });

  it('keeps escalating past Bulma<Name>2', () => {
    const out = migrate(
      [
        'import { Button as RbxBtn } from "rbx";',
        'const Button = 1; const BulmaButton = 2; const BulmaButton2 = 3;',
        'export const A = () => <RbxBtn>{Button}{BulmaButton}{BulmaButton2}</RbxBtn>;',
      ].join('\n')
    );
    expect(out).toContain('Button as BulmaButton3');
  });
});

describe('collectBoundNames sees every binding form', () => {
  // Each destructuring shape binds names that a bestax import must not
  // silently shadow. Exercised through the transform, since that is the only
  // way these reach `reserve`.
  it.each([
    ['object pattern', 'const { Button } = props;'],
    ['nested object pattern', 'const { a: { Button } } = props;'],
    ['array pattern', 'const [Button] = list;'],
    ['rest element', 'const [first, ...Button] = list;'],
    ['default value', 'const { Button = 1 } = props;'],
    ['function param', 'function f(Button) { return Button; }'],
    ['arrow param', 'const g = (Button) => Button;'],
    ['class declaration', 'class Button {}'],
    [
      'function expression param',
      'const h = function (Button) { return Button; };',
    ],
  ])('aliases around a %s binding', (_label, binding) => {
    const out = migrate(
      [
        'import { Button as RbxBtn } from "rbx";',
        'const props: any = {}; const list: any[] = [];',
        binding,
        'export const A = () => <RbxBtn>x</RbxBtn>;',
      ].join('\n')
    );
    // The local `Button` is taken, so the bestax import must be aliased.
    expect(out).toMatch(/Button as Bulma\w+/);
    expect(out).not.toMatch(/import \{ Button \} from "@allxsmith/);
  });

  it('does not alias when the imported name is free', () => {
    const out = migrate(
      [
        'import { Button as RbxBtn } from "rbx";',
        'const other = 1;',
        'export const A = () => <RbxBtn>{other}</RbxBtn>;',
      ].join('\n')
    );
    expect(out).toContain('import { Button } from "@allxsmith/bestax-bulma"');
  });
});
