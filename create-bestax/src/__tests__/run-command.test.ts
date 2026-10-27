import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.unstable_mockModule('node:child_process', () => ({
  spawnSync: jest.fn(),
}));

const { spawnSync } = await import('node:child_process');
const { runCommand } = await import('../run-command.js');
const spawn = spawnSync as unknown as jest.Mock;

describe('runCommand', () => {
  beforeEach(() => {
    spawn.mockReset();
  });

  it('runs the command in cwd through the shell, with the terminal handed over', () => {
    spawn.mockReturnValue({ status: 0 });

    expect(runCommand('npm install', '/work/app')).toBe(0);
    expect(spawn).toHaveBeenCalledWith('npm install', {
      cwd: '/work/app',
      stdio: 'inherit',
      shell: true,
    });
  });

  it("returns the command's exit code, and 1 when a signal ended it", () => {
    spawn.mockReturnValueOnce({ status: 2 });
    expect(runCommand('npm install', '/work/app')).toBe(2);

    spawn.mockReturnValueOnce({ status: null, signal: 'SIGINT' });
    expect(runCommand('npm run dev', '/work/app')).toBe(1);
  });

  it('throws when the command could not be started at all', () => {
    spawn.mockReturnValue({ status: null, error: new Error('spawn ENOENT') });

    expect(() => runCommand('npm install', '/work/app')).toThrow(
      'spawn ENOENT'
    );
  });
});
