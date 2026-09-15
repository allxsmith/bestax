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
import { Linter } from 'eslint';
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

  // The regression this file exists for. Every rule visits only
  // JSXOpeningElement, and a flat config object with no `files` inherits
  // ESLint's default `**/*.{js,mjs,cjs}` set — so the preset shipped linting
  // nothing at all, silently, and the end-to-end check that should have caught
  // it passed its own hand-written `files` instead of the preset's.
  it.each(['a.jsx', 'a.tsx', 'a.js'])(
    'the recommended preset alone actually lints %s',
    file => {
      const linter = new Linter();
      const messages = linter.verify(
        'const x = <Box textAlign="center" />;',
        [
          { files: ['**/*.{js,mjs,cjs,jsx,tsx}'], languageOptions: {} },
          configs.recommended,
        ],
        file
      );
      // No library import, so no rule reports. What is being asserted is that
      // the file was linted at all: an unmatched file yields the "no matching
      // configuration" warning instead.
      expect(
        messages.filter(m => /no matching configuration/i.test(m.message))
      ).toEqual([]);
    }
  );

  it('parses JSX under the default parser, with no parser of its own', () => {
    // `.jsx` must not need the consumer to supply ecmaFeatures themselves.
    expect(configs.recommended.languageOptions?.parserOptions).toEqual({
      ecmaFeatures: { jsx: true },
    });
    // Declaring a parser here would override whatever the consumer set for
    // TypeScript, so the preset must not carry one.
    expect(configs.recommended.languageOptions?.parser).toBeUndefined();
  });

  it('documents each rule with a description and a docs url', () => {
    for (const [name, rule] of Object.entries(rules)) {
      expect(typeof rule.meta?.docs?.description).toBe('string');
      expect(rule.meta?.docs?.url).toContain(`#${name}`);
      expect(rule.meta?.schema).toEqual([]);
    }
  });
});
