/**
 * The bestax-bulma release the migrated code is written for, and the copy an
 * app has installed (#2314), read from packages written to a temp directory.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { builtFor, installedVersion } from '../bestax-release.js';
import { addBestax, BESTAX_FLOOR, openManifest } from '../deps-common.js';
import type { TodoEntry } from '../../../types.js';

const NAME = '@allxsmith/bestax-bulma';
const dirs: string[] = [];
afterAll(() => {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
});

function project(files: Record<string, unknown>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bestax-release-'));
  dirs.push(dir);
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(
      path.join(dir, file),
      typeof content === 'string' ? content : JSON.stringify(content)
    );
  }
  return dir;
}

const installed = (version: unknown) => ({
  [`node_modules/${NAME}/package.json`]: { name: NAME, version },
});

describe('builtFor', () => {
  it('reads the lowest release a published manifest depends on', () => {
    const root = project({
      'package.json': { dependencies: { [NAME]: '^5.90.1' } },
    });
    expect(builtFor(root)).toBe('5.90.1');
  });

  it('resolves the workspace protocol from the linked library, as pnpm publish does', () => {
    for (const spec of ['workspace:^', 'workspace:~', 'workspace:*']) {
      const root = project({
        'package.json': { dependencies: { [NAME]: spec } },
        ...installed('5.91.0'),
      });
      expect(builtFor(root)).toBe('5.91.0');
    }
    const ranged = project({
      'package.json': { dependencies: { [NAME]: 'workspace:^5.2.0' } },
    });
    expect(builtFor(ranged)).toBe('5.2.0');
  });

  it('refuses a manifest that names no lowest release', () => {
    expect(() => builtFor(project({ 'package.json': {} }))).toThrow(
      /declares no @allxsmith\/bestax-bulma dependency/
    );
    expect(() =>
      builtFor(
        project({ 'package.json': { dependencies: { [NAME]: 'latest' } } })
      )
    ).toThrow(/names no lowest release/);
  });

  it("is this checkout's bestax-bulma, which the floor is", () => {
    const bulmaUi = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../../../../bulma-ui/package.json'
    );
    const { version } = JSON.parse(fs.readFileSync(bulmaUi, 'utf8'));
    expect(builtFor()).toBe(version);
    expect(BESTAX_FLOOR).toBe(version);
  });
});

describe('installedVersion', () => {
  it('reads the copy in the nearest node_modules at or above the package', () => {
    const dir = project({
      ...installed('5.70.0'),
      'apps/web/package.json': {},
      'apps/admin/package.json': {},
      'apps/admin/node_modules/@allxsmith/bestax-bulma/package.json': {
        version: '5.80.0',
      },
    });
    expect(installedVersion(dir)).toBe('5.70.0');
    expect(installedVersion(path.join(dir, 'apps/web'))).toBe('5.70.0');
    expect(installedVersion(path.join(dir, 'apps/admin'))).toBe('5.80.0');
  });

  it('is undefined with no copy installed, or one whose version it cannot read', () => {
    expect(installedVersion(project({ 'package.json': {} }))).toBeUndefined();
    expect(installedVersion(project(installed(5)))).toBeUndefined();
    expect(installedVersion(project(installed('next')))).toBeUndefined();
    expect(
      installedVersion(
        project({ [`node_modules/${NAME}/package.json`]: '{ not json' })
      )
    ).toBeUndefined();
  });
});

describe('addBestax and the installed copy (#2314)', () => {
  function report(files: Record<string, unknown>, pkg: object) {
    const dir = project(files);
    const todos: TodoEntry[] = [];
    const manifest = openManifest(
      path.join(dir, 'package.json'),
      structuredClone(pkg) as Record<string, unknown>,
      { add: entry => todos.push(entry) }
    );
    addBestax(manifest);
    return { todos, changed: manifest.result() !== null };
  }
  const declared = { dependencies: { [NAME]: `^${BESTAX_FLOOR}` } };

  it('reports an older copy the package loads, whose range is new enough', () => {
    const { todos, changed } = report(installed('5.0.0'), declared);
    expect(changed).toBe(false);
    expect(todos).toEqual([
      expect.objectContaining({
        rule: 'deps',
        message: expect.stringContaining(
          `this package loads ${NAME} 5.0.0, older than the ${BESTAX_FLOOR}`
        ),
      }),
    ]);
  });

  it('says nothing of a copy at the release or later, or of none at all', () => {
    expect(report(installed(BESTAX_FLOOR), declared).todos).toEqual([]);
    expect(report(installed('99.0.0'), declared).todos).toEqual([]);
    expect(report({}, declared).todos).toEqual([]);
  });

  it('reports a declared range that starts lower once, without the installed copy', () => {
    const { todos } = report(installed('5.0.0'), {
      dependencies: { [NAME]: '^5.0.0' },
    });
    expect(todos.map(t => t.message)).toEqual([
      expect.stringContaining('^5.0.0 admits releases older than'),
    ]);
  });

  it('adds the range where none is declared, and reads no installed copy', () => {
    const { todos, changed } = report(installed('5.0.0'), {});
    expect(changed).toBe(true);
    expect(todos.map(t => t.message)).toEqual([
      `added ${NAME} ^${BESTAX_FLOOR} to dependencies`,
    ]);
  });
});
