// The fill is a gradient in `_slider.scss`, and jsdom drops a background
// whose gradient reads a variable, so the fill is read from the compiled
// sheet. Transforms and custom properties do come through jsdom's cascade,
// `:dir()` included, so the marks and the value bubble are read from
// computed style.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { Slider } from '../Slider';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const css = sass.compileString(`@use 'form/slider';`, {
  loadPaths: [SCSS, NODE_MODULES],
  quietDeps: true,
  logger: sass.Logger.silent,
}).css;

describe('Slider fill direction', () => {
  it('paints toward the right left to right, and toward the left right to left', () => {
    expect(css).toMatch(/linear-gradient\(\s*to right,/);
    expect(css).toContain('.slider-input:dir(rtl)');
    expect(css).toContain('.slider.is-range .slider-track:dir(rtl)');
    expect(css).toMatch(/linear-gradient\(\s*to left,/);
    // The vertical track grows upward. Its own direction is part of the
    // control, not the page's, so the page's direction doesn't repaint it.
    expect(css).toMatch(/linear-gradient\(\s*to top,/);
  });
});

describe('Slider in the cascade', () => {
  let sheet: HTMLStyleElement;
  beforeAll(() => {
    sheet = document.createElement('style');
    sheet.textContent = css;
    document.head.appendChild(sheet);
  });
  afterAll(() => sheet.remove());

  // A mark sits at its value's distance from the inline start, the native
  // thumb's side, and is centred on that point by its transform.
  it.each([
    ['ltr', 'translateX(-50%)'],
    ['rtl', 'translateX(50%)'],
  ])('places and centres a mark on a %s page', (dir, centring) => {
    const { container } = render(
      <div dir={dir}>
        <Slider marks={[{ value: 0, label: '0' }, { value: 100 }]} />
      </div>
    );
    const [min, max] = Array.from(
      container.querySelectorAll<HTMLElement>('.slider-tick')
    );
    // From the inline start, so 0 is at the right edge right to left, where
    // the thumb sits at the minimum. A `left` would hold it on the left.
    expect([min.style.insetInlineStart, max.style.insetInlineStart]).toEqual([
      '0%',
      '100%',
    ]);
    expect(min.style.left).toBe('');
    expect(getComputedStyle(min).transform).toBe(centring);
  });

  // The bubble sits at the thumb's distance from the inline start, so right
  // to left its right edge is there and centring it shifts it right.
  it.each([
    ['ltr', '-50%'],
    ['rtl', '50%'],
  ])('centres a bubble on a %s page by a shift of %s', (dir, shift) => {
    const { container } = render(
      <div dir={dir}>
        <Slider defaultValue={25} showOutput />
      </div>
    );
    const output = container.querySelector('.slider-output') as HTMLElement;
    expect(
      getComputedStyle(output).getPropertyValue('--slider-output-shift')
    ).toBe(shift);
  });

  it("sets the shift on each bubble, so a nested slider doesn't take its page's", () => {
    const { container } = render(
      <div dir="rtl">
        <div dir="ltr">
          <Slider defaultValue={25} showOutput />
        </div>
      </div>
    );
    const output = container.querySelector('.slider-output') as HTMLElement;
    expect(
      getComputedStyle(output).getPropertyValue('--slider-output-shift')
    ).toBe('-50%');
  });
});
