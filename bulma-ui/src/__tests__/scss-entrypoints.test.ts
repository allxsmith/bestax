// Every folder of partials reaches every stylesheet the package builds.
//
// A folder's `_index.scss` registers its partials, and each entrypoint
// (`bestax.scss`, `extras.scss` and the flavors in `versions/`) pulls in each
// folder by its index, line by line. A folder an entrypoint leaves out ships
// nothing in that build, silently. The folders and the entrypoints are both
// read off the disk here, so a new one of either is held to this without
// anyone remembering to list it.
//
// The one exception is on purpose: a flavor named `no-helpers` leaves out the
// helpers folder, which is what its name promises.
import fs from 'fs';
import path from 'path';

const SCSS = path.resolve(__dirname, '../scss');

const folders = fs
  .readdirSync(SCSS, { withFileTypes: true })
  .filter(
    entry =>
      entry.isDirectory() &&
      fs.existsSync(path.join(SCSS, entry.name, '_index.scss'))
  )
  .map(entry => entry.name)
  .sort();

const entrypoints = [
  'bestax.scss',
  'extras.scss',
  ...fs
    .readdirSync(path.join(SCSS, 'versions'))
    .filter(file => file.endsWith('.scss'))
    .map(file => `versions/${file}`),
].sort();

/** Whether an entrypoint `@use`s a folder's index, from where it sits. */
const uses = (entrypoint: string, folder: string) => {
  const src = fs.readFileSync(path.join(SCSS, entrypoint), 'utf8');
  return new RegExp(`@use\\s+['"](\\.\\./)?${folder}/index['"]`).test(src);
};

describe('SCSS entrypoints', () => {
  it('finds the folders and the entrypoints it holds to each other', () => {
    expect(folders).toEqual(
      expect.arrayContaining([
        'components',
        'elements',
        'form',
        'helpers',
        'layout',
      ])
    );
    expect(entrypoints).toEqual(
      expect.arrayContaining([
        'bestax.scss',
        'extras.scss',
        'versions/bestax-prefixed.scss',
      ])
    );
  });

  describe.each(entrypoints)('%s', entrypoint => {
    const leavesOutHelpers = entrypoint.includes('no-helpers');

    it.each(folders)('pulls in %s/index', folder => {
      expect(uses(entrypoint, folder)).toBe(
        !(folder === 'helpers' && leavesOutHelpers)
      );
    });
  });
});
