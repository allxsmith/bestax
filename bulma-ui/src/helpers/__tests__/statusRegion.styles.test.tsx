// The region hides itself with an inline style, so it works without any
// stylesheet. The library already hides Badge's placeholder with the
// `extras-sr-only` mixin, so this compiles that mixin and checks the two agree
// on every declaration the mixin makes, which is how a change to one shows up
// as a difference from the other.
import * as sass from 'sass';
import path from 'path';
import { render, screen } from '@testing-library/react';
import { StatusRegion } from '../statusRegion';

const mixinCss = sass.compileString(
  "@use 'mixins' as *;\n.sr-only-probe { @include extras-sr-only; }",
  {
    loadPaths: [path.resolve(__dirname, '../../scss')],
    quietDeps: true,
    logger: sass.Logger.silent,
  }
).css;

let styleEl: HTMLStyleElement;

beforeAll(() => {
  styleEl = document.createElement('style');
  styleEl.textContent = mixinCss;
  document.head.appendChild(styleEl);
});

afterAll(() => {
  styleEl.remove();
});

it('hides the region with the declarations of the extras-sr-only mixin', () => {
  const rule = Array.from(styleEl.sheet!.cssRules).find(
    candidate => (candidate as CSSStyleRule).selectorText === '.sr-only-probe'
  ) as CSSStyleRule;
  const properties = Array.from(
    { length: rule.style.length },
    (_, index) => rule.style[index]
  );
  render(
    <>
      <div className="sr-only-probe" data-testid="probe" />
      <StatusRegion items={[]} describe={() => null} />
    </>
  );
  const probe = getComputedStyle(screen.getByTestId('probe'));
  const region = getComputedStyle(screen.getByRole('status'));

  // The margin is the declaration that keeps the region from adding
  // scrollable overflow, so it has to be among those compared.
  expect(properties).toContain('margin');
  expect(
    properties.map(property => [property, region.getPropertyValue(property)])
  ).toEqual(
    properties.map(property => [property, probe.getPropertyValue(property)])
  );
});
