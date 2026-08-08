/**
 * Index loading, name resolution and the guards around skill file reads.
 */
import { describe, expect, it } from '@jest/globals';

import {
  assertSchema,
  loadCatalog,
  loadComponent,
  loadSkillFile,
  loadSkills,
  resolveName,
  resetCaches,
  SUPPORTED_SCHEMA_VERSION,
  type Catalog,
} from '../data.js';

describe('assertSchema', () => {
  it('accepts the version this server was built against', () => {
    const catalog = { schemaVersion: SUPPORTED_SCHEMA_VERSION } as Catalog;
    expect(assertSchema(catalog)).toBe(catalog);
  });

  it('refuses an index it does not understand, rather than half-reading it', () => {
    expect(() => assertSchema({ schemaVersion: 99 } as Catalog)).toThrow(
      /schema version 99/
    );
  });
});

describe('loaders', () => {
  it('loads and memoises the catalog', async () => {
    resetCaches();
    const first = await loadCatalog();
    expect(first.generatedFrom.package).toBe('@allxsmith/bestax-bulma');
    expect(await loadCatalog()).toBe(first);
  });

  it('memoises component records', async () => {
    const first = await loadComponent('Button');
    expect(await loadComponent('Button')).toBe(first);
  });

  it('loads the skills manifest', async () => {
    const skills = await loadSkills();
    expect(skills.length).toBeGreaterThanOrEqual(7);
    expect(skills.every(s => s.description)).toBe(true);
  });

  it('drops every cache on reset', async () => {
    const before = await loadCatalog();
    resetCaches();
    expect(await loadCatalog()).not.toBe(before);
  });
});

describe('resolveName', () => {
  it.each([
    ['Button', 'Button'],
    ['button', 'Button'],
    ['BUTTON', 'Button'],
    ['<Button>', 'Button'],
    ['<Button/>', 'Button'],
    ['  Navbar  ', 'Navbar'],
    // A dot-path resolves to its root; the part is selected downstream.
    ['Navbar.Brand', 'Navbar'],
    ['navbar.brand', 'Navbar'],
  ])('resolves %s to %s', async (input, expected) => {
    expect(await resolveName(input)).toBe(expected);
  });

  it('returns null for something that is not a component', async () => {
    expect(await resolveName('NotAThing')).toBeNull();
  });
});

describe('loadSkillFile', () => {
  it('reads a skill body', async () => {
    expect(await loadSkillFile('bestax-theming')).toContain('---');
  });

  it('reads a named reference', async () => {
    const body = await loadSkillFile(
      'bestax-theming',
      'references/css-variables.md'
    );
    expect(body).toContain('--bulma-');
  });

  it('refuses to escape the skills directory', async () => {
    // `relative` reaches here from tool arguments. The manifest is the only
    // thing allowed to name a file, but the guard does not rely on that.
    await expect(
      loadSkillFile('bestax-theming', '../../../package.json')
    ).rejects.toThrow(/refusing/);
    await expect(
      loadSkillFile('bestax-theming', '/etc/passwd')
    ).rejects.toThrow(/refusing/);
  });

  it('explains an unbuilt checkout rather than surfacing ENOENT', async () => {
    await expect(
      loadSkillFile('bestax-theming', 'references/not-a-file.md')
    ).rejects.toThrow(/sync|build/i);
  });
});
