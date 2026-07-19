/**
 * The bestax-migrate CLI:
 *
 *   bestax-migrate <source> <paths...> [--dry] [--print] [--extensions ...]
 *
 * Walks the given files/directories, runs the selected source transform on
 * every matching file in-process, writes results back (unless --dry), and
 * prints the run report. TODO annotations are expected output — the exit code
 * is 0 whenever the run itself succeeds.
 */

import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';
import { Reporter } from './report.js';
import { runTransform } from './runner.js';
import { getSource, sourceNames } from './sources/registry.js';

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
]);

export function collectFiles(
  targets: string[],
  extensions: string[]
): string[] {
  const files: string[] = [];
  const visit = (target: string) => {
    const stat = fs.statSync(target, { throwIfNoEntry: false });
    if (!stat) {
      throw new Error(`no such file or directory: ${target}`);
    }
    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(path.basename(target))) return;
      for (const entry of fs.readdirSync(target).sort()) {
        visit(path.join(target, entry));
      }
    } else if (extensions.includes(path.extname(target).replace(/^\./, ''))) {
      files.push(target);
    }
  };
  for (const target of targets) visit(target);
  return files;
}

export interface CliIo {
  log: (message: string) => void;
  error: (message: string) => void;
}

export function createCLI(
  io: CliIo = { log: console.log, error: console.error }
): Command {
  const program = new Command();
  program
    .name('bestax-migrate')
    .description(
      'Codemods that migrate existing apps to @allxsmith/bestax-bulma'
    )
    .argument(
      '<source>',
      `library to migrate from (${sourceNames().join(', ')})`
    )
    .argument('<paths...>', 'files or directories to transform')
    .option(
      '-d, --dry',
      'dry run — report what would change without writing',
      false
    )
    .option('-p, --print', 'print transformed sources to stdout', false)
    .option(
      '-e, --extensions <list>',
      'comma-separated file extensions to include',
      'js,jsx,ts,tsx'
    )
    .action((sourceName: string, targets: string[], options) => {
      const source = getSource(sourceName);
      if (!source) {
        io.error(
          `${chalk.red('Unknown source')} "${sourceName}". Available sources: ${sourceNames().join(', ')}`
        );
        program.error('', { exitCode: 1 });
        return;
      }

      const extensions = String(options.extensions)
        .split(',')
        .map(ext => ext.trim())
        .filter(Boolean);

      let files: string[];
      try {
        files = collectFiles(targets, extensions);
      } catch (error) {
        io.error(chalk.red((error as Error).message));
        program.error('', { exitCode: 1 });
        return;
      }

      const reporter = new Reporter();
      for (const file of files) {
        const sourceText = fs.readFileSync(file, 'utf8');
        const collector = reporter.startFile();
        let output: string | null;
        try {
          output = runTransform(
            source.transform,
            file,
            sourceText,
            collector
          ).output;
        } catch (error) {
          io.error(chalk.red(`✖ ${file}: ${(error as Error).message}`));
          reporter.finishFile(file, false, collector.entries);
          continue;
        }
        if (output !== null) {
          if (options.print) io.log(output);
          if (!options.dry) fs.writeFileSync(file, output);
        }
        reporter.finishFile(file, output !== null, collector.entries);
      }

      io.log(reporter.render(source.label + (options.dry ? ' (dry run)' : '')));
    });
  return program;
}
