/**
 * @vitest-environment node
 */
// compile-scss.ts compiles whole published stylesheets with `sass-embedded`,
// and it says why. The build compiles with `sass`, so this holds the two to
// one version, and those suites to the CSS that ships.
import * as js from 'sass';
import { sass } from './compile-scss';

/** The version a package's `info` gives after `name`. */
const version = (info: string, name: string) =>
  new RegExp(`^${name}\\t(\\S+)`, 'm').exec(info)?.[1];

it('compiles with the Sass version the build uses', () => {
  expect(version(js.info, 'dart-sass')).toMatch(/^\d+\.\d+\.\d+/);
  expect(version(sass.info, 'sass-embedded')).toBe(
    version(js.info, 'dart-sass')
  );
});
