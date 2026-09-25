import os from 'node:os';
import path from 'node:path';
import { updateDependencies } from '../deps.js';
import type { TodoEntry } from '../../../types.js';

// A directory with no tsconfig, so only the manifest decides the runtime.
const manifestPath = path.join(
  os.tmpdir(),
  'bestax-no-such-app',
  'package.json'
);

function run(
  pkg: Record<string, unknown>,
  options: { cssMode?: 'bestax' | 'bulma' | 'keep' } = {}
): { next: Record<string, unknown> | null; todos: TodoEntry[] } {
  const todos: TodoEntry[] = [];
  const next = updateDependencies(
    manifestPath,
    structuredClone(pkg),
    { add: entry => todos.push(entry) },
    options
  );
  return { next, todos };
}

const section = (
  r: { next: Record<string, unknown> | null },
  name = 'dependencies'
) => (r.next?.[name] ?? {}) as Record<string, string>;

const bulma09 = {
  dependencies: { bulma: '^0.9.4', react: '^18.2.0' },
  devDependencies: { 'node-sass': '^9.0.0' },
};

describe('bulma-classes updateDependencies', () => {
  it("adds bestax-bulma and leaves the app's styling stack alone by default", () => {
    const r = run(bulma09);
    expect(section(r)).toEqual({
      bulma: '^0.9.4',
      react: '^18.2.0',
      '@allxsmith/bestax-bulma': '^5',
    });
    expect(section(r, 'devDependencies')).toEqual({ 'node-sass': '^9.0.0' });
    expect(r.todos.map(t => t.message)).toEqual([
      'added @allxsmith/bestax-bulma ^5 to dependencies',
      expect.stringContaining('left bulma ^0.9.4 in dependencies as it is'),
    ]);
  });

  it('moves the app to Bulma v1 when --css asks for it', () => {
    const r = run(bulma09, { cssMode: 'bestax' });
    expect(section(r).bulma).toBe('^1.0.4');
    expect(section(r, 'devDependencies')['node-sass']).toBeUndefined();
    expect(section(r, 'devDependencies').sass).toBeDefined();
  });

  it('adds nothing to a package whose JSX renders through another runtime', () => {
    const app = { dependencies: { preact: '^10.0.0', bulma: '^1.0.2' } };
    // A shared UI package declares its runtime as a peer.
    const shared = {
      dependencies: { bulma: '^1.0.2' },
      peerDependencies: { preact: '^10.0.0' },
    };
    for (const manifest of [app, shared]) {
      const r = run(manifest);
      expect(r.next).toBeNull();
      expect(r.todos.map(t => t.message)).toEqual([
        expect.stringContaining('renders through `preact`'),
      ]);
    }
  });

  it('points a PurgeCSS app at the library its classes now come from', () => {
    const r = run({
      dependencies: { react: '^18.2.0', bulma: '^1.0.2' },
      devDependencies: { '@fullhuman/postcss-purgecss': '^6.0.0' },
    });
    expect(r.todos.map(t => t.message)).toContainEqual(
      expect.stringContaining(
        './node_modules/@allxsmith/bestax-bulma/dist/**/*.js'
      )
    );
  });

  describe('an app that already declares bestax-bulma', () => {
    it.each(['^4.2.0', '~3.1.0', '4.0.0', '^3 || ^4'])(
      'reports %s as older than the migrated code needs',
      range => {
        const r = run({
          dependencies: { react: '^18.2.0', '@allxsmith/bestax-bulma': range },
        });
        // Reported, not raised: the manifest is left as it is.
        expect(r.next).toBeNull();
        expect(r.todos.map(t => t.rule)).toContain('peer-deps');
        expect(r.todos.map(t => t.message)).toContainEqual(
          expect.stringContaining(`${range} is older than the ^5`)
        );
      }
    );

    it.each(['^5.1.0', '^4 || ^5', 'latest', 'workspace:*'])(
      'says nothing about %s',
      range => {
        const r = run({
          dependencies: { react: '^18.2.0', '@allxsmith/bestax-bulma': range },
        });
        expect(r.todos.map(t => t.message).join('\n')).not.toContain(
          'is older than'
        );
      }
    );
  });
});
