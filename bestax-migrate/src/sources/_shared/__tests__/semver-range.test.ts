import { describe, expect, it } from 'vitest';
import { compareVersions, rangeFloor } from '../semver-range.js';

describe('rangeFloor', () => {
  it('reads the lowest version a caret, tilde, exact or >= range admits', () => {
    expect(rangeFloor('^5.78.4')).toBe('5.78.4');
    expect(rangeFloor('~5.78.4')).toBe('5.78.4');
    expect(rangeFloor('5.78.4')).toBe('5.78.4');
    expect(rangeFloor('=5.78.4')).toBe('5.78.4');
    expect(rangeFloor('v5.78.4')).toBe('5.78.4');
    expect(rangeFloor('>=5.78.4')).toBe('5.78.4');
    expect(rangeFloor('>= 5.79.0')).toBe('5.79.0');
  });

  it('fills a partial version or an x-range with zeros', () => {
    expect(rangeFloor('^5')).toBe('5.0.0');
    expect(rangeFloor('^5.78')).toBe('5.78.0');
    expect(rangeFloor('5.x')).toBe('5.0.0');
    expect(rangeFloor('5.78.x')).toBe('5.78.0');
    expect(rangeFloor('*')).toBe('0.0.0');
    expect(rangeFloor('')).toBe('0.0.0');
  });

  it('takes the highest lower bound in a set, and the lowest across ||', () => {
    expect(rangeFloor('>=5.78.4 <6')).toBe('5.78.4');
    expect(rangeFloor('<6')).toBe('0.0.0');
    expect(rangeFloor('^5.70.0 || ^5.80.0')).toBe('5.70.0');
    expect(rangeFloor('5.78.4 - 5.90.0')).toBe('5.78.4');
  });

  it('keeps a prerelease, which sorts below its release', () => {
    expect(rangeFloor('^5.78.4-beta.1')).toBe('5.78.4-beta.1');
  });

  it("reads nothing it can't prove: a > bound, a tag, a protocol, a stray word", () => {
    expect(rangeFloor('>5.78.3')).toBeNull();
    expect(rangeFloor('latest')).toBeNull();
    expect(rangeFloor('workspace:^')).toBeNull();
    expect(rangeFloor('npm:@allxsmith/bestax-bulma@^5')).toBeNull();
    expect(rangeFloor('github:allxsmith/bestax')).toBeNull();
    expect(rangeFloor('^5.78.4 || next')).toBeNull();
    expect(rangeFloor('5.78.4 - next')).toBeNull();
  });
});

describe('compareVersions', () => {
  it('orders by major, minor and patch, as numbers', () => {
    expect(compareVersions('5.78.4', '5.78.4')).toBe(0);
    expect(compareVersions('5.78.10', '5.78.4')).toBe(1);
    expect(compareVersions('5.9.0', '5.78.4')).toBe(-1);
    expect(compareVersions('6.0.0', '5.78.4')).toBe(1);
  });

  it('puts a prerelease below its release and above the one before', () => {
    expect(compareVersions('5.78.4-0', '5.78.4')).toBe(-1);
    expect(compareVersions('5.78.4', '5.78.4-0')).toBe(1);
    expect(compareVersions('5.79.0-rc.1', '5.78.4')).toBe(1);
    expect(compareVersions('5.78.4-alpha', '5.78.4-beta')).toBe(-1);
  });
});
