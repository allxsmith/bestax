// The fill is a gradient in `_slider.scss`. jsdom drops `:dir()`, so these
// read the compiled sheet rather than a computed background.
import * as sass from 'sass';
import path from 'path';

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
    expect(css).toContain('.slider-tick:dir(rtl)');
    expect(css).toContain('transform: translateX(50%)');
  });
});
