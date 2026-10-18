import chalk from 'chalk';
import figures from 'figures';
import { MESSAGES } from './constants.js';
import { detectPackageManager } from './package-manager.js';

export function displayHeader(): void {
  console.log();
  console.log(chalk.cyan('━'.repeat(50)));
  console.log(chalk.cyan(chalk.bold('  🐝 Create Bestax App')));
  console.log(chalk.cyan('━'.repeat(50)));
  console.log();
}

// Characters no shell reads specially, so a path made only of them pastes as
// it is. Windows adds its backslash separator.
const SHELL_SAFE = /^[\w@%+=:,./-]+$/;
const WINDOWS_SHELL_SAFE = /^[\w@%+=:,./\\-]+$/;

/**
 * value written so that pasting it into a shell gives back exactly value. The
 * project name is held to safe characters, but a parent folder in a path can
 * hold anything (#1154). POSIX shells get single quotes, which keep spaces, $
 * and backticks literal, with each single quote inside written '\''. Windows
 * gets double quotes, the quoting cmd and PowerShell share, since cmd has no
 * single quotes.
 */
export function quoteShellArgument(
  value: string,
  platform: typeof process.platform = process.platform
): string {
  if (platform === 'win32') {
    return WINDOWS_SHELL_SAFE.test(value) ? value : `"${value}"`;
  }
  return SHELL_SAFE.test(value) ? value : `'${value.replace(/'/g, "'\\''")}'`;
}

export function displaySuccess(targetDir: string): void {
  console.log();
  console.log(chalk.green(MESSAGES.PROJECT_CREATED));
  console.log();
  console.log(chalk.bold(MESSAGES.NEXT_STEPS));
  console.log();
  // Mirror the package manager that invoked the CLI — `<pm> install` and
  // `<pm> run dev` are valid for all four supported PMs.
  const pm = detectPackageManager();
  console.log(chalk.cyan(`  cd ${quoteShellArgument(targetDir)}`));
  console.log(chalk.cyan(`  ${pm} install`));
  console.log(chalk.cyan(`  ${pm} run dev`));
  console.log();
  console.log(
    chalk.gray('  Your app includes a beautiful logo-centric homepage')
  );
  console.log(chalk.gray('  showcasing Bestax, Vite, and React branding.'));
  console.log();
  console.log(chalk.dim(MESSAGES.HAPPY_CODING));
  console.log();
  console.log(
    chalk.yellow(
      `${figures.star} If you enjoy using bestax-bulma, please star us on GitHub!`
    )
  );
  console.log(chalk.dim('   https://github.com/allxsmith/bestax'));
  console.log();
  console.log(
    chalk.dim(
      '   Ideas or problems? Open an issue: https://github.com/allxsmith/bestax/issues'
    )
  );
  console.log();
}

export function displayError(message: string): void {
  console.error(chalk.red(`${figures.cross} ${message}`));
}

export function displayInfo(message: string): void {
  console.log(chalk.yellow(message));
}

export function displayCancelled(): void {
  console.log(chalk.red(MESSAGES.OPERATION_CANCELLED));
}
