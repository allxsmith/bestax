// Bulma's `.loader` spins with no reduced-motion rule, so bestax adds one.
// jsdom does not evaluate media queries, so these read the compiled CSS: the
// rule has to exist in the bundles and come after Bulma's own `.loader` rule,
// since both selectors weigh the same and the later one wins.
import * as sass from 'sass';
import path from 'path';

const compile = (file: string) =>
  sass
    .compile(path.resolve(__dirname, '../../scss', file), {
      loadPaths: [path.resolve(__dirname, '../../../../node_modules')],
      quietDeps: true,
      logger: sass.Logger.silent,
    })
    .css.replace(/\s+/g, ' ');

describe('Loader reduced-motion styles', () => {
  it.each([
    ['bestax.scss', ''],
    ['versions/bestax-prefixed.scss', 'bestax-'],
  ])(
    '%s stops the spin under prefers-reduced-motion, after Bulma’s spin rule',
    (file, prefix) => {
      const css = compile(file);
      // Bulma's rule. Our own `.loader {` sits inside the media block, so if
      // Bulma's went missing this would find ours, after `stop`, and fail.
      const spin = css.indexOf(`.${prefix}loader {`);
      const stop = css.indexOf(
        `@media (prefers-reduced-motion: reduce) { .${prefix}loader { animation: none; } }`
      );
      expect(spin).toBeGreaterThan(-1);
      expect(stop).toBeGreaterThan(spin);
    }
  );
});
