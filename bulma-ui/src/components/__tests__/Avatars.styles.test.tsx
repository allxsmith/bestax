// The overlap direction bug (issue #265) is invisible to jsdom's className
// assertions — jsdom doesn't lay out CSS, and a physical margin-left looks
// identical to a logical margin-inline-start until a dir="rtl" ancestor flips
// the inline axis. Compile the real SCSS partial and assert the rules use
// logical properties (same approach as Badge.styles.test.tsx).
import * as sass from 'sass';
import path from 'path';

let compiledCss: string;

beforeAll(() => {
  const result = sass.compile(
    path.resolve(__dirname, '../../scss/components/_avatars.scss'),
    {
      loadPaths: [path.resolve(__dirname, '../../../../node_modules')],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  );
  compiledCss = result.css.replace(/\s+/g, ' ');
});

describe('Avatars overlap styles', () => {
  it('overlaps via margin-inline-start so RTL stacks still overlap', () => {
    const overlapRule = compiledCss.match(
      /\.avatars \.avatar:not\(:first-child\)\s*\{([^}]*)\}/
    );
    expect(overlapRule).not.toBeNull();
    expect(overlapRule?.[1]).toContain('margin-inline-start: calc(');
    expect(overlapRule?.[1]).not.toContain('margin-left');
  });

  it('resets the spaced layout via the same logical property', () => {
    const spacedRule = compiledCss.match(
      /\.avatars\.is-spaced \.avatar:not\(:first-child\)\s*\{([^}]*)\}/
    );
    expect(spacedRule).not.toBeNull();
    expect(spacedRule?.[1]).toContain('margin-inline-start: 0');
    expect(spacedRule?.[1]).not.toContain('margin-left');
  });

  it('emits no physical inline-direction margins anywhere in the partial', () => {
    expect(compiledCss).not.toContain('margin-left');
    expect(compiledCss).not.toContain('margin-right');
  });
});
