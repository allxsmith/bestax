/**
 * package.json updater. The behaviour worth pinning down is the four Bulma
 * extensions: they are reported for the user to remove, never deleted, because
 * an app that added `bulma-tooltip` on its own may still be using it outside
 * rbx components.
 */

import { updateDependencies } from '../deps.js';
import type { TodoEntry } from '../../../types.js';

function run(pkg: Record<string, unknown>, bulmaReferenced = false) {
  const todos: TodoEntry[] = [];
  const next = updateDependencies(
    'package.json',
    pkg,
    { add: e => todos.push(e) },
    { cssMode: 'bestax', bulmaReferenced }
  ) as Record<string, Record<string, string>> | null;
  return { next, messages: todos.map(t => t.message) };
}

describe('rbx deps', () => {
  it('removes rbx and bumps Bulma, but only REPORTS the extensions', () => {
    // rbx declares the four extensions as its own dependencies, so an app
    // gets them through the lockfile. Their presence in the app's manifest
    // means the author declared them deliberately — possibly to import their
    // Sass directly — so deleting them would be a best-guess rewrite.
    const { next, messages } = run({
      dependencies: {
        rbx: '^2.2.0',
        bulma: '0.7.5',
        'bulma-badge': '^3.0.1',
        'bulma-divider': '^0.2.0',
        'bulma-pageloader': '^2.1.0',
        'bulma-tooltip': '^2.0.2',
      },
    });
    expect(next!.dependencies.rbx).toBeUndefined();
    expect(next!.dependencies['@allxsmith/bestax-bulma']).toBe('^5');
    expect(next!.dependencies.bulma).toBe('^1.0.4');
    // Reported, still present.
    expect(next!.dependencies['bulma-badge']).toBe('^3.0.1');
    expect(
      messages.some(m => /are Bulma extensions rbx depended on/.test(m))
    ).toBe(true);
    expect(messages.some(m => /removed rbx and bumped bulma/.test(m))).toBe(
      true
    );
  });

  it('says nothing about the extensions when rbx was never there', () => {
    const { next, messages } = run({
      dependencies: { 'bulma-tooltip': '^2.0.2', bulma: '^1.0.4' },
    });
    expect(next?.dependencies['bulma-tooltip']).toBe('^2.0.2');
    expect(
      messages.some(m => /are Bulma extensions rbx depended on/.test(m))
    ).toBe(false);
  });

  it('adds bulma only when sources reference it directly', () => {
    const withRef = run({ dependencies: { rbx: '^2.2.0' } }, true);
    expect(withRef.next!.dependencies.bulma).toBe('^1.0.4');
    const without = run({ dependencies: { rbx: '^2.2.0' } }, false);
    expect(without.next!.dependencies.bulma).toBeUndefined();
  });

  it('reports the React 16 peer gap rbx pinned', () => {
    const { messages } = run({
      dependencies: { rbx: '^2.2.0', react: '^16.8.6' },
    });
    expect(
      messages.some(m => /predates bestax-bulma's peer range/.test(m))
    ).toBe(true);
  });

  it('reports a Font Awesome 5 pin', () => {
    const { messages } = run({
      dependencies: {
        rbx: '^2.2.0',
        '@fortawesome/fontawesome-free': '^5.9.0',
      },
    });
    expect(messages.some(m => /legacy-peer-deps/.test(m))).toBe(true);
  });

  it('swaps node-sass for dart sass', () => {
    const { next } = run({
      dependencies: { rbx: '^2.2.0' },
      devDependencies: { 'node-sass': '^4.12.0' },
    });
    expect(next!.devDependencies['node-sass']).toBeUndefined();
    expect(next!.devDependencies.sass).toBe('^1.79.0');
  });

  it('returns null when there is genuinely nothing to change', () => {
    // bestax-bulma already present and no rbx to remove.
    const { next } = run({
      dependencies: { '@allxsmith/bestax-bulma': '^5', react: '^19.0.0' },
    });
    expect(next).toBeNull();
  });

  it('adds bestax-bulma even to a manifest with no rbx left', () => {
    const { next } = run({ dependencies: { react: '^19.0.0' } });
    expect(next!.dependencies['@allxsmith/bestax-bulma']).toBe('^5');
  });

  it('does not re-add bestax-bulma when it is already a devDependency', () => {
    const { next } = run({
      dependencies: { rbx: '^2.2.0' },
      devDependencies: { '@allxsmith/bestax-bulma': '^5' },
    });
    expect(next!.dependencies['@allxsmith/bestax-bulma']).toBeUndefined();
  });
});

describe('the headline describes what actually happened to bulma', () => {
  // The report is the tool's primary deliverable, and this line claimed a
  // manifest pin the user would not find. In the COMMON rbx-app shape bulma
  // is neither bumped nor added -- it arrives transitively via bestax-bulma.
  const headline = (messages: string[]) =>
    messages.find(m => /^removed rbx( and| —)/.test(m)) ?? '';

  it('claims no bump when bulma is neither declared nor referenced', () => {
    const { next, messages } = run({ dependencies: { rbx: '^2.2.0' } });
    expect(next?.dependencies.bulma).toBeUndefined();
    expect(headline(messages)).toContain('arrives transitively');
    expect(headline(messages)).not.toContain('bumped');
  });

  it('says bumped only when a pre-1.0 range was actually raised', () => {
    const { next, messages } = run({
      dependencies: { rbx: '^2.2.0', bulma: '^0.9.4' },
    });
    expect(next?.dependencies.bulma).toBe('^1.0.4');
    expect(headline(messages)).toContain('bumped bulma');
  });

  it('says added when bulma was absent but sources import it', () => {
    const { next, messages } = run({ dependencies: { rbx: '^2.2.0' } }, true);
    expect(next?.dependencies.bulma).toBe('^1.0.4');
    expect(headline(messages)).toContain('added bulma');
    expect(headline(messages)).not.toContain('bumped');
  });

  it('does not claim a bump when the declared range is already v1', () => {
    const { next, messages } = run({
      dependencies: { rbx: '^2.2.0', bulma: '^1.0.2' },
    });
    // Left alone: the app already chose a v1 range.
    expect(next?.dependencies.bulma).toBe('^1.0.2');
    expect(headline(messages)).not.toContain('bumped');
    expect(headline(messages)).toContain('left your declared bulma range');
  });
});

describe('pre-1.0 bulma range detection', () => {
  // The first version matched a leading `0` and nothing else, so a range
  // written as comparators (`>=0.7 <1`) stayed on 0.x and was then reported
  // as already v1. Conservative on purpose: anything it cannot prove is
  // exclusively pre-v1 is left alone.
  it.each([
    '^0.9.4',
    '~0.7.5',
    '0.7.x',
    '>=0.7 <1',
    '>=0.7.0 <1.0.0',
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
    'v1.0.0-rc.1',
    '<v1.0.0',
    '>=1.0.0-rc.1 <1.0.0',
  ])('bumps %s', range => {
    const { next } = run({ dependencies: { rbx: '^2.2.0', bulma: range } });
    expect(next?.dependencies.bulma).toBe('^1.0.4');
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
  ])('leaves %s alone because it is not a range this parser reads', range => {
    // Not "admits a v1": these are left untouched because the parser cannot
    // read them, which the rbx report words differently from an actual v1.
    const { next } = run({ dependencies: { rbx: '^2.2.0', bulma: range } });
    expect(next?.dependencies.bulma).toBe(range);
  });

  it.each([
    '^1.0.2',
    '>=0.9 <2',
    '^0.9 || ^1.0',
    '*',
    '>=0.9',
    '<=1.0.0',
    '^1.0.0-rc.1',
  ])('leaves %s alone because it admits a v1', range => {
    const { next } = run({ dependencies: { rbx: '^2.2.0', bulma: range } });
    expect(next?.dependencies.bulma).toBe(range);
  });
});

describe('range edge cases the deep review found', () => {
  it.each(['>= 0.7.0 < 1.0.0', '>= 0.7 <1', '< 1'])(
    'bumps a spaced-comparator range %s',
    range => {
      // npm allows whitespace between operator and version; tokenising on
      // whitespace first made `>=` a token of its own and the range fell
      // through as unrecognised -- then was reported as already v1.
      const { next } = run({ dependencies: { rbx: '^2.2.0', bulma: range } });
      expect(next?.dependencies.bulma).toBe('^1.0.4');
    }
  );

  it.each(['latest', 'github:jgthms/bulma', 'file:../bulma'])(
    'does not call the non-semver specifier %s "already v1"',
    spec => {
      const { next, messages } = run({
        dependencies: { rbx: '^2.2.0', bulma: spec },
      });
      expect(next?.dependencies.bulma).toBe(spec);
      // `( and| —)` skips the earlier `removed rbx from dependencies` note.
      const headline =
        messages.find(m => /^removed rbx( and| —)/.test(m)) ?? '';
      expect(headline).not.toContain('already v1');
      expect(headline).toContain('not a version range this tool can read');
    }
  );
});
