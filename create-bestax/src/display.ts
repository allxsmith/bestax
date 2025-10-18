import chalk from 'chalk';
import figures from 'figures';
import { MESSAGES } from './constants.js';

export function displayHeader(): void {
  console.log();
  console.log(chalk.cyan('━'.repeat(50)));
  console.log(chalk.cyan(chalk.bold('  🐝 Create Bestax App')));
  console.log(chalk.cyan('━'.repeat(50)));
  console.log();
}

export function displaySuccess(targetDir: string): void {
  console.log();
  console.log(chalk.green(MESSAGES.PROJECT_CREATED));
  console.log();
  console.log(chalk.bold(MESSAGES.NEXT_STEPS));
  console.log();
  console.log(chalk.cyan(`  cd ${targetDir}`));
  console.log(chalk.cyan('  npm install'));
  console.log(chalk.cyan('  npm run dev'));
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
