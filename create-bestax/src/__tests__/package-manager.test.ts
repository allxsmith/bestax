import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { detectPackageManager } from '../package-manager.js';

describe('detectPackageManager', () => {
  // Jest itself runs under a package manager, so npm_config_user_agent is
  // live in this process. Clear it so every case is deterministic —
  // an explicit `undefined` argument falls through to the env default.
  const originalUserAgent = process.env.npm_config_user_agent;

  beforeEach(() => {
    delete process.env.npm_config_user_agent;
  });

  afterEach(() => {
    if (originalUserAgent === undefined) {
      delete process.env.npm_config_user_agent;
    } else {
      process.env.npm_config_user_agent = originalUserAgent;
    }
  });

  describe('with an explicit user agent argument', () => {
    it('detects pnpm', () => {
      expect(
        detectPackageManager('pnpm/9.12.0 npm/? node/v22.0.0 darwin arm64')
      ).toBe('pnpm');
    });

    it('detects yarn', () => {
      expect(
        detectPackageManager('yarn/4.5.0 npm/? node/v22.0.0 darwin arm64')
      ).toBe('yarn');
    });

    it('detects bun', () => {
      expect(
        detectPackageManager('bun/1.1.30 npm/? node/v22.0.0 darwin arm64')
      ).toBe('bun');
    });

    it('detects npm', () => {
      expect(detectPackageManager('npm/10.9.0 node/v22.0.0 darwin arm64')).toBe(
        'npm'
      );
    });

    it('falls back to npm when the user agent is undefined', () => {
      expect(detectPackageManager(undefined)).toBe('npm');
    });

    it('falls back to npm when the user agent is empty', () => {
      expect(detectPackageManager('')).toBe('npm');
    });

    it('falls back to npm for an unknown package manager', () => {
      expect(detectPackageManager('deno/2.0')).toBe('npm');
    });
  });

  describe('with the default process.env source', () => {
    it('reads npm_config_user_agent when no argument is given', () => {
      process.env.npm_config_user_agent =
        'pnpm/9.12.0 npm/? node/v22.0.0 darwin arm64';
      expect(detectPackageManager()).toBe('pnpm');
    });
  });
});
