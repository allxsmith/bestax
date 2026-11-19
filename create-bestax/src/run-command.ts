import { spawnSync } from 'node:child_process';

/**
 * Runs command in cwd with the terminal handed over, and returns its exit
 * code, 1 when it ended on a signal. Only --immediate's `<pm> install` and
 * `<pm> run dev` come through here, built from the four package managers
 * detectPackageManager names, so the shell sees no user input. The shell is
 * what lets Windows run npm.cmd and its siblings.
 */
export function runCommand(command: string, cwd: string): number {
  const result = spawnSync(command, { cwd, stdio: 'inherit', shell: true });
  if (result.error) throw result.error;
  return result.status ?? 1;
}
