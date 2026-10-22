/**
 * @jest-environment node
 */
// The stylesheet sizes the items from the count it picks for the viewport,
// and the script steps, clamps and hides items by the count it picks from
// `matchMedia`. The two have to pick the same count at every width, or the
// script makes items inert that are on screen. This compiles the partial and
// reads which `--bulma-carousel-items-to-show*` variable the stylesheet's
// `--bulma-carousel-items-in-view` takes at each width, including the
// fractional widths between Bulma's `mobile` query (up to 768px) and its
// `tablet` one (from 769px), which match neither and which a browser can
// report under zoom or a fractional device pixel ratio.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const css = sass.compileString(`@use 'components/carousel';`, {
  loadPaths: [SCSS, path.dirname(BULMA)],
  quietDeps: true,
  logger: sass.Logger.silent,
}).css;

/**
 * Every declaration of `--bulma-carousel-items-in-view` on `.carousel`, in
 * source order, with the media query it sits under (`null` for none).
 */
function inViewDeclarations(): { media: string | null; value: string }[] {
  const found: { media: string | null; value: string }[] = [];
  const stack: string[] = [];
  let buffer = '';
  for (const char of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (char === '{') {
      stack.push(buffer.trim());
      buffer = '';
    } else if (char === '}') {
      stack.pop();
      buffer = '';
    } else if (char === ';') {
      const match = /^--bulma-carousel-items-in-view:\s*(.+)$/.exec(
        buffer.trim()
      );
      if (match && stack[stack.length - 1] === '.carousel') {
        const media = [...stack].reverse().find(p => p.startsWith('@media'));
        found.push({
          media: media ? media.slice('@media'.length).trim() : null,
          value: match[1].trim(),
        });
      }
      buffer = '';
    } else {
      buffer += char;
    }
  }
  return found;
}

/** Whether a media query list matches `type` media `width` pixels wide. */
const matches = (query: string, type: 'screen' | 'print', width: number) =>
  query.split(',').some(part => {
    const [medium, ...features] = part.trim().split(/\s+and\s+/);
    if (medium !== type) return false;
    return features.every(feature => {
      const [, side, px] = /\((min|max)-width:\s*([\d.]+)px\)/.exec(feature)!;
      return side === 'min' ? width >= Number(px) : width <= Number(px);
    });
  });

/** The variable the stylesheet's count reads for `type` media `width` wide. */
const stylesheetPick = (type: 'screen' | 'print', width: number) =>
  inViewDeclarations()
    .filter(({ media }) => media === null || matches(media, type, width))
    .pop()?.value;

/**
 * The viewport the script picks, as `VIEWPORT_QUERIES` in Carousel.tsx
 * reads it: the widest of Bulma's min-width breakpoints the window reaches,
 * and mobile below them all.
 */
const scriptPick = (width: number) =>
  width >= 1408
    ? 'fullhd'
    : width >= 1216
      ? 'widescreen'
      : width >= 1024
        ? 'desktop'
        : width >= 769
          ? 'tablet'
          : 'mobile';

describe('Carousel stylesheet', () => {
  it('declares the count in view on the root and per viewport', () => {
    expect(inViewDeclarations().length).toBeGreaterThan(1);
  });

  it.each([
    320, 767.5, 768, 768.25, 768.5, 768.99, 769, 900, 1023.5, 1024, 1215.5,
    1216, 1407.5, 1408, 1920,
  ])('reads the same viewport as the script at %ppx', width => {
    expect(stylesheetPick('screen', width)).toBe(
      `var(--bulma-carousel-items-to-show-${scriptPick(width)})`
    );
  });

  it('reads the tablet count in print, as the script does', () => {
    // The script's tablet query carries Bulma's `, print`, as the mixin does.
    expect(stylesheetPick('print', 0)).toBe(
      'var(--bulma-carousel-items-to-show-tablet)'
    );
  });
});
