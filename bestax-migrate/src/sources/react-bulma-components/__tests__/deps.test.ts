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
    expect(dev.sass).toBe('^1.79.0');
  });

  it('does not add sass twice when already declared', () => {
    const { next } = run({
      devDependencies: { 'node-sass': '^7.0.0', sass: '^1.60.0' },
    });
    const dev = next!.devDependencies as Record<string, string>;
    expect(dev.sass).toBe('^1.60.0');
    expect(dev['node-sass']).toBeUndefined();
  });

  it('warns when react predates the bestax peer range', () => {
    const { todos } = run({
      dependencies: { 'react-bulma-components': '4.1.0', react: '^17.0.2' },
    });
    const peer = todos.filter(t => t.rule === 'peer-deps');
    expect(peer).toHaveLength(1);
    expect(peer[0].message).toContain('react ^17.0.2');
    const modern = run({
      dependencies: { 'react-bulma-components': '4.1.0', react: '^18.3.1' },
    });
    expect(modern.todos.some(t => t.rule === 'peer-deps')).toBe(false);
  });

  it('warns when font awesome predates the optional peer range', () => {
    const { todos } = run({
      dependencies: {
        'react-bulma-components': '4.1.0',
        '@fortawesome/fontawesome-free': '5',
      },
    });
    const peer = todos.filter(t => t.rule === 'peer-deps');
    expect(peer).toHaveLength(1);
    expect(peer[0].message).toContain('--legacy-peer-deps');
    const modern = run({
      dependencies: {
        'react-bulma-components': '4.1.0',
        '@fortawesome/fontawesome-free': '^6.7.2',
      },
    });
    expect(modern.todos.some(t => t.rule === 'peer-deps')).toBe(false);
  });

  it('returns null when nothing needs to change', () => {
    const { next } = run({
      dependencies: { '@allxsmith/bestax-bulma': '^5.6.2', bulma: '^1.0.4' },
    });
    expect(next).toBeNull();
  });
});

describe('retained-import warning', () => {
  // The transform retains Element/Tile imports so a partly migrated app still
  // runs, while this updater removes the package -- so the install the report
  // asks for strands exactly those imports. rbx has warned about this since it
  // shipped; this source retains imports the same way and did not.
  it('warns when files still import the source after removal', () => {
    const todos: TodoEntry[] = [];
    updateDependencies(
      'package.json',
      { name: 'a', dependencies: { 'react-bulma-components': '^4.1.0' } },
      { add: e => todos.push(e) },
      { cssMode: 'bestax', bulmaReferenced: false, sourceStillImported: true }
    );
    expect(todos.map(t => t.message).join('\n')).toMatch(/still import it/);
  });

  it('stays quiet when nothing still imports it', () => {
    const todos: TodoEntry[] = [];
    updateDependencies(
      'package.json',
      { name: 'a', dependencies: { 'react-bulma-components': '^4.1.0' } },
      { add: e => todos.push(e) },
      { cssMode: 'bestax', bulmaReferenced: false, sourceStillImported: false }
    );
    expect(todos.map(t => t.message).join('\n')).not.toMatch(/still import it/);
  });
});

describe('pre-1.0 bulma range detection', () => {
  // The regex this pass used matched a leading `0` and nothing else, so a
  // range written as comparators (`>=0.9.0 <1`) was neither bumped nor
  // reported. The parser is now shared with the rbx source, which had already
  // been fixed; this pins the port.
  it.each([
    '^0.9.4',
    '~0.7.5',
    '0.7.x',
    '>=0.7 <1',
    '>= 0.7.0 < 1.0.0',
    '<1',
    '0.7.0 - 0.9.4',
    '^0.9 || ^0.8',
    '<1.0.0-0',
    '>=0.9.0 <1.0.0-0',
    '<=1.0.0-0',
    '1.0.0-rc.1',
    '<1.0.0-rc.1',
    '0.9.0 - 1.0.0-0',
    '<1.0.0+build.1',
    '0.9.0-alpha.1',
    '0.9.0+build.7',
    'v1.0.0-rc.1',
    '<v1.0.0',
    '>=1.0.0-rc.1 <1.0.0',
    '<1 <2',
    '<1 <=2',
    '>=0.7 <1 <3',
  ])('bumps %s', range => {
    const { next } = run({
      dependencies: { 'react-bulma-components': '^4.1.0', bulma: range },
    });
    expect((next?.dependencies as Record<string, string>).bulma).toBe('^1.0.4');
  });

  it.each([
    '0.next',
    '1.0-beta',
    '0.7.x-foo',
    '^^0.9.4',
    'vv0.9.4',
    'not-a-range - 0.9.4',
    '00.9.4',
    '0.07.0',
    '==0.9.4',
    '<^0.9',
    '0.x.1',
    '0.9.0-alpha..1',
    '0.9.0-01',
    '0.9.0+foo..bar',
  ])('leaves %s alone because it is not a range this parser reads', range => {
    // Not "admits a v1": these are left untouched because the parser cannot
    // read them, which the rbx report words differently from an actual v1.
    const { next } = run({
      dependencies: { 'react-bulma-components': '^4.1.0', bulma: range },
    });
    expect((next?.dependencies as Record<string, string>).bulma).toBe(range);
  });

  it.each([
    '^1.0.2',
    '>=0.9 <2',
    '^0.9 || ^1.0',
    '*',
    '>=0.9',
    '<=1.0.0',
    '^1.0.0-rc.1',
    '<2',
    '<=2',
  ])('leaves %s alone because it admits a v1', range => {
    const { next } = run({
      dependencies: { 'react-bulma-components': '^4.1.0', bulma: range },
    });
    expect((next?.dependencies as Record<string, string>).bulma).toBe(range);
  });
});
