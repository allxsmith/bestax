/**
 * @jest-environment node
 */
// The suites that compile a whole published stylesheet import `sass-embedded`,
// which runs Dart Sass natively and compiles a full sheet faster than `sass`,
// the same compiler built to JavaScript. The suites that compile one partial
// keep `sass`, which starts faster. The build compiles with `sass`, so this
// holds the two to one version, and those suites to the CSS that ships.
import * as sass from 'sass';
import * as embedded from 'sass-embedded';

/** The version a package's `info` gives after `name`. */
const version = (info: string, name: string) =>
  new RegExp(`^${name}\\t(\\S+)`, 'm').exec(info)?.[1];

it('compiles with the Sass version the build uses', () => {
  expect(version(sass.info, 'dart-sass')).toMatch(/^\d+\.\d+\.\d+/);
  expect(version(embedded.info, 'sass-embedded')).toBe(
    version(sass.info, 'dart-sass')
  );
});
