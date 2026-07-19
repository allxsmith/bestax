import { updateDependencies } from '../deps.js';
import type { TodoEntry } from '../../../types.js';

function run(
  pkg: Record<string, unknown>,
  options: {
    cssMode?: 'bestax' | 'bulma' | 'keep';
    bulmaReferenced?: boolean;
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

describe('updateDependencies', () => {
  it('swaps react-bulma-components for bestax-bulma', () => {
    const { next, todos } = run({
      dependencies: { 'react-bulma-components': '^4.1.0', react: '^18.0.0' },
    });
    const deps = next!.dependencies as Record<string, string>;
    expect(deps['react-bulma-components']).toBeUndefined();
    expect(deps['@allxsmith/bestax-bulma']).toBe('^5');
    expect(deps.react).toBe('^18.0.0');
    expect(todos.every(t => t.rule === 'deps')).toBe(true);
  });

  it('bumps a pre-1 bulma range and leaves v1 ranges alone', () => {
    const bumped = run({ dependencies: { bulma: '^0.9.4' } });
    expect((bumped.next!.dependencies as Record<string, string>).bulma).toBe(
      '^1.0.4'
    );
    const untouched = run({
      dependencies: { 'react-bulma-components': '4.1.0', bulma: '^1.0.0' },
    });
    expect((untouched.next!.dependencies as Record<string, string>).bulma).toBe(
      '^1.0.0'
    );
  });

  it('adds bulma only when sources still reference it directly', () => {
    const withRef = run(
      { dependencies: { 'react-bulma-components': '4.1.0' } },
      { bulmaReferenced: true }
    );
    expect((withRef.next!.dependencies as Record<string, string>).bulma).toBe(
      '^1.0.4'
    );
    const withoutRef = run({
      dependencies: { 'react-bulma-components': '4.1.0' },
    });
    expect(
      (withoutRef.next!.dependencies as Record<string, string>).bulma
    ).toBeUndefined();
  });

  it('replaces node-sass with sass in the same section', () => {
    const { next } = run({
      dependencies: { 'react-bulma-components': '4.1.0' },
      devDependencies: { 'node-sass': '^7.0.0' },
    });
    const dev = next!.devDependencies as Record<string, string>;
    expect(dev['node-sass']).toBeUndefined();
    expect(dev.sass).toBe('^1.71.0');
  });

  it('does not add sass twice when already declared', () => {
    const { next } = run({
      devDependencies: { 'node-sass': '^7.0.0', sass: '^1.60.0' },
    });
    const dev = next!.devDependencies as Record<string, string>;
    expect(dev.sass).toBe('^1.60.0');
    expect(dev['node-sass']).toBeUndefined();
  });

  it('returns null when nothing needs to change', () => {
    const { next } = run({
      dependencies: { '@allxsmith/bestax-bulma': '^5.6.2', bulma: '^1.0.4' },
    });
    expect(next).toBeNull();
  });
});
