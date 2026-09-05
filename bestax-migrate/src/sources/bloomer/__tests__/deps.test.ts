import { updateDependencies } from '../deps.js';
import type { TodoEntry } from '../../../types.js';

function run(
  pkg: Record<string, unknown>,
  options: {
    cssMode?: 'bestax' | 'bulma' | 'keep';
    bulmaReferenced?: boolean;
    sourceStillImported?: boolean;
  } = {}
): { next: Record<string, unknown> | null; todos: TodoEntry[] } {
  const todos: TodoEntry[] = [];
  const next = updateDependencies(
    'package.json',
    structuredClone(pkg),
    { add: entry => todos.push(entry) },
    options
  );
  return { next, todos };
}

const deps = (
  r: { next: Record<string, unknown> | null },
  section = 'dependencies'
) => (r.next?.[section] ?? {}) as Record<string, string>;

describe('bloomer updateDependencies', () => {
  it("swaps bloomer for bestax-bulma and bumps the app's own 0.6 bulma", () => {
    const r = run({
      dependencies: { bloomer: '^0.6.5', bulma: '^0.6.2', react: '^18.0.0' },
    });
    expect(deps(r).bloomer).toBeUndefined();
    expect(deps(r)['@allxsmith/bestax-bulma']).toBe('^5');
    expect(deps(r).bulma).toBe('^1.0.4');
    expect(r.todos.map(t => t.rule)).toEqual(['deps', 'deps', 'deps']);
    expect(r.todos.map(t => t.message)).toEqual([
      'removed bloomer from dependencies',
      'added @allxsmith/bestax-bulma ^5 to dependencies',
      'bumped bulma to ^1.0.4 in dependencies (was pre-1.0)',
    ]);
  });

  it('leaves a v1 bulma range alone and adds bulma only when sources import it', () => {
    const untouched = run({
      dependencies: { bloomer: '0.6.5', bulma: '^1.0.0' },
    });
    expect(deps(untouched).bulma).toBe('^1.0.0');
    const withRef = run(
      { dependencies: { bloomer: '0.6.5' } },
      { bulmaReferenced: true }
    );
    expect(deps(withRef).bulma).toBe('^1.0.4');
    const withoutRef = run({ dependencies: { bloomer: '0.6.5' } });
    expect(deps(withoutRef).bulma).toBeUndefined();
  });

  it('removes bloomer from devDependencies too', () => {
    const r = run({ devDependencies: { bloomer: '^0.6.5' } });
    expect(deps(r, 'devDependencies').bloomer).toBeUndefined();
    expect(deps(r)['@allxsmith/bestax-bulma']).toBe('^5');
  });

  it('warns when files still import bloomer for unmappable components', () => {
    const r = run(
      { dependencies: { bloomer: '^0.6.5' } },
      { sourceStillImported: true }
    );
    expect(r.todos.some(t => /still import it/.test(t.message))).toBe(true);
    const quiet = run({ dependencies: { bloomer: '^0.6.5' } });
    expect(quiet.todos.some(t => /still import it/.test(t.message))).toBe(
      false
    );
  });

  it('reports the React 16 and Font Awesome 4/5 peer gaps without touching them', () => {
    const r = run({
      dependencies: {
        bloomer: '^0.6.5',
        react: '^16.2.0',
        '@fortawesome/fontawesome-free': '^5.0.0',
      },
    });
    expect(deps(r).react).toBe('^16.2.0');
    const peers = r.todos
      .filter(t => t.rule === 'peer-deps')
      .map(t => t.message);
    expect(peers).toHaveLength(2);
    expect(peers[0]).toMatch(/^react \^16\.2\.0 predates/);
    expect(peers[1]).toMatch(
      /^@fortawesome\/fontawesome-free \^5\.0\.0 predates/
    );
  });

  it('replaces node-sass with dart-sass in the same section', () => {
    const r = run({
      dependencies: { bloomer: '^0.6.5' },
      devDependencies: { 'node-sass': '^4.9.0' },
    });
    expect(deps(r, 'devDependencies')['node-sass']).toBeUndefined();
    expect(deps(r, 'devDependencies').sass).toBe('^1.79.0');
    const already = run({
      dependencies: { bloomer: '^0.6.5' },
      devDependencies: { 'node-sass': '^4.9.0', sass: '^1.80.0' },
    });
    expect(deps(already, 'devDependencies').sass).toBe('^1.80.0');
  });

  it("leaves bloomer's own runtime dependencies to the app", () => {
    const r = run({
      dependencies: {
        bloomer: '^0.6.5',
        'create-react-class': '15.6.3',
        'prop-types': '^15.6.2',
      },
    });
    expect(deps(r)['create-react-class']).toBe('15.6.3');
    expect(deps(r)['prop-types']).toBe('^15.6.2');
  });

  it('returns null when there is nothing to change', () => {
    const r = run({
      dependencies: { react: '^18.0.0', '@allxsmith/bestax-bulma': '^5' },
    });
    expect(r.next).toBeNull();
    expect(r.todos).toEqual([]);
  });
});
