/**
 * Guards the plugin's public surface against the two ways it can be wrong
 * without any rule being wrong.
 *
 * A rule id in `recommended` that names no real rule is an ESLint startup
 * crash in the consumer's project, not a lint error — and a new rule that
 * nobody adds to `recommended` ships switched off for everyone using the
 * preset. Both are caught here by comparing the two lists against each other.
 */
import { describe, expect, it } from '@jest/globals';
import plugin, { configs, rules } from '../index.js';
import { OPT_IN_RULES, RECOMMENDED_RULES } from '../configs/recommended.js';

const PREFIX = '@allxsmith/bestax';

describe('plugin surface', () => {
  it('names itself with the prefix its rule ids are written under', () => {
    expect(plugin.meta?.name).toBe('@allxsmith/eslint-plugin-bestax');
    expect(configs.recommended.plugins).toEqual({ [PREFIX]: plugin });
  });

  it('accounts for every rule it ships, as recommended or as opt-in', () => {
    const shipped = Object.keys(rules).sort();
    const accounted = [
      ...Object.keys(RECOMMENDED_RULES).map(id => id.replace(`${PREFIX}/`, '')),
      ...OPT_IN_RULES,
    ].sort();
    // A rule in neither list ships switched off with nobody having decided
    // that; a name in either list that is not a real rule crashes ESLint at
    // startup in the consumer's project.
    expect(accounted).toEqual(shipped);
  });

  it('keeps the two lists disjoint', () => {
    const recommended = Object.keys(RECOMMENDED_RULES).map(id =>
      id.replace(`${PREFIX}/`, '')
    );
    for (const name of OPT_IN_RULES) {
      expect(recommended).not.toContain(name);
    }
  });

  it('writes every recommended rule id under the plugin prefix', () => {
    for (const id of Object.keys(RECOMMENDED_RULES)) {
      expect(id.startsWith(`${PREFIX}/`)).toBe(true);
    }
  });

  it('reports every rule as an error, since none is a preference', () => {
    for (const level of Object.values(RECOMMENDED_RULES)) {
      expect(level).toBe('error');
    }
  });

  it('documents each rule with a description and a docs url', () => {
    for (const [name, rule] of Object.entries(rules)) {
      expect(typeof rule.meta?.docs?.description).toBe('string');
      expect(rule.meta?.docs?.url).toContain(`#${name}`);
      expect(rule.meta?.schema).toEqual([]);
    }
  });
});
