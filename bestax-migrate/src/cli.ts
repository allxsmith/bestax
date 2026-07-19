/**
 * The bestax-migrate CLI:
 *
 *   bestax-migrate <source> <paths...> [--dry] [--print] [--extensions ...]
 *                  [--css bestax|bulma|keep] [--no-deps]
 *
 * Walks the given files/directories, routes each file by type (JS/TSX →
 * jscodeshift transform, .scss/.sass → the source's stylesheet transform),
 * updates the nearest package.json (unless --no-deps), writes results back
 * (unless --dry), and prints the run report. TODO annotations are expected
 * output — the exit code is 0 whenever the run itself succeeds.
 */

import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';
import { Reporter } from './report.js';
import { runTransform } from './runner.js';
import { getSource, sourceNames } from './sources/registry.js';
import type { CssMode, MigrationSource } from './types.js';

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
]);

const STYLE_EXTENSIONS = new Set(['scss', 'sass']);
const CSS_MODES: CssMode[] = ['bestax', 'bulma', 'keep'];

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

/** Nearest package.json for each target, walking up to the filesystem root. */
export function findPackageJsons(targets: string[]): string[] {
  const found = new Set<string>();
  for (const target of targets) {
    const stat = fs.statSync(target, { throwIfNoEntry: false });
    if (!stat) continue;
    let dir = path.resolve(stat.isDirectory() ? target : path.dirname(target));
    for (;;) {
      const candidate = path.join(dir, 'package.json');
      if (fs.existsSync(candidate)) {
        found.add(candidate);
        break;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return [...found].sort();
}

export interface CliIo {
  log: (message: string) => void;
  error: (message: string) => void;
}

interface RunOptions {
  dry: boolean;
  print: boolean;
  deps: boolean;
  cssMode: CssMode;
}

function migrateFiles(
  source: MigrationSource,
  files: string[],
  reporter: Reporter,
  io: CliIo,
  options: RunOptions
): boolean {
  let bulmaReferenced = false;
  for (const file of files) {
    const sourceText = fs.readFileSync(file, 'utf8');
    const collector = reporter.startFile();
    const extension = path.extname(file).replace(/^\./, '');
    let output: string | null;
    try {
      if (STYLE_EXTENSIONS.has(extension)) {
        output = source.transformStyles
          ? source.transformStyles(file, sourceText, collector, {
              cssMode: options.cssMode,
            })
          : null;
      } else {
        output = runTransform(source.transform, file, sourceText, collector, {
          cssMode: options.cssMode,
        }).output;
      }
    } catch (error) {
      io.error(chalk.red(`✖ ${file}: ${(error as Error).message}`));
      reporter.finishFile(file, false, collector.entries);
      continue;
    }
    if (/['"](?:~?bulma\/)/.test(output ?? sourceText)) {
      bulmaReferenced = true;
    }
    if (output !== null) {
      if (options.print) io.log(output);
      if (!options.dry) fs.writeFileSync(file, output);
    }
    reporter.finishFile(file, output !== null, collector.entries);
  }
  return bulmaReferenced;
}

function migrateDependencies(
  source: MigrationSource,
  targets: string[],
  reporter: Reporter,
  io: CliIo,
  options: RunOptions,
  bulmaReferenced: boolean
): void {
  if (!options.deps || !source.updateDependencies) return;
  for (const pkgPath of findPackageJsons(targets)) {
    const collector = reporter.startFile();
    let changed = false;
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const next = source.updateDependencies(pkgPath, pkg, collector, {
        cssMode: options.cssMode,
        bulmaReferenced,
      });
      if (next !== null) {
        changed = true;
        if (!options.dry) {
          fs.writeFileSync(pkgPath, `${JSON.stringify(next, null, 2)}\n`);
        }
      }
    } catch (error) {
      io.error(chalk.red(`✖ ${pkgPath}: ${(error as Error).message}`));
    }
    reporter.finishFile(pkgPath, changed, collector.entries);
    if (changed) {
      io.log(
        chalk.yellow(
          `Updated ${pkgPath} — run your package manager's install to apply.`
        )
      );
    }
  }
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
      'js,jsx,ts,tsx,scss,sass'
    )
    .option(
      '--css <mode>',
      `stylesheet target: ${CSS_MODES.join(', ')}`,
      'bestax'
    )
    .option('--no-deps', 'skip updating package.json dependencies')
    .action((sourceName: string, targets: string[], options) => {
      const source = getSource(sourceName);
      if (!source) {
        io.error(
          `${chalk.red('Unknown source')} "${sourceName}". Available sources: ${sourceNames().join(', ')}`
        );
        program.error('', { exitCode: 1 });
        return;
      }
      if (!CSS_MODES.includes(options.css)) {
        io.error(
          `${chalk.red('Unknown --css mode')} "${options.css}". Valid modes: ${CSS_MODES.join(', ')}`
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

      const runOptions: RunOptions = {
        dry: Boolean(options.dry),
        print: Boolean(options.print),
        deps: options.deps !== false,
        cssMode: options.css as CssMode,
      };

      const reporter = new Reporter();
      const bulmaReferenced = migrateFiles(
        source,
        files,
        reporter,
        io,
        runOptions
      );
      migrateDependencies(
        source,
        targets,
        reporter,
        io,
        runOptions,
        bulmaReferenced
      );

      io.log(
        reporter.render(source.label + (runOptions.dry ? ' (dry run)' : ''))
      );
    });
  return program;
}
