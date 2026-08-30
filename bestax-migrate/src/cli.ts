/**
 * The bestax-migrate CLI:
 *
 *   bestax-migrate <source> <paths...> [--dry] [--print] [--extensions ...]
 *                  [--css bestax|bulma|keep] [--no-deps]
 *                  [--telemetry|--no-telemetry]
 *
 * Walks the given files/directories, routes each file by type (JS/TSX →
 * jscodeshift transform, .scss/.sass → the source's stylesheet transform),
 * updates the nearest package.json (unless --no-deps), writes results back
 * (unless --dry), and prints the run report. TODO annotations are expected
 * output — the exit code is 0 whenever the run itself succeeds.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import type { Readable, Writable } from 'node:stream';
import chalk from 'chalk';
import { Command } from 'commander';
import { Reporter } from './report.js';
import { runTransform } from './runner.js';
import { getSource, sourceNames } from './sources/registry.js';
import { reportMigrateRun, type MigrateRunStats } from './telemetry.js';
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

/**
 * Component formats the codemod cannot parse (no jscodeshift grammar) but
 * that can still import the source library — flagged, never rewritten.
 */
const UNSUPPORTED_EXTENSIONS = ['astro', 'vue', 'svelte', 'mdx'];

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
): { bulmaReferenced: boolean; sourceStillImported: boolean } {
  let bulmaReferenced = false;
  let sourceStillImported = false;
  // Match the source package at a specifier boundary, in every form a
  // retained reference can take: a root or DEEP JavaScript import
  // (`from 'rbx'`, `from 'rbx/base/theme'` — deep ones are kept with a TODO)
  // and the Sass forms the stylesheet transform preserves in indented `.sass`
  // files (`@import '~rbx/rbx'`). Matching only `from '<pkg>'` meant a file
  // whose ONLY remaining reference was a deep or Sass import let the manifest
  // pass drop the package with no warning.
  const escaped = source.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sourceImportRe = new RegExp(
    `(?:from|@import)\\s*['"](?:~|(?:\\.\\.?/)+node_modules/)?${escaped}(?:/[^'"]*)?['"]`
  );
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
              deps: options.deps,
            })
          : null;
      } else {
        output = runTransform(source.transform, file, sourceText, collector, {
          cssMode: options.cssMode,
        }).output;
      }
    } catch (error) {
      io.error(chalk.red(`✖ ${file}: ${(error as Error).message}`));
      // Read the signals off the ORIGINAL text before bailing. A parse
      // failure in the only file importing the source library would
      // otherwise let the manifest pass remove the package with no warning —
      // the file still imports it, we just couldn't rewrite it.
      if (/['"](?:~?bulma\/)/.test(sourceText)) bulmaReferenced = true;
      if (sourceImportRe.test(sourceText)) sourceStillImported = true;
      reporter.finishFile(file, false, collector.entries);
      continue;
    }
    if (/['"](?:~?bulma\/)/.test(output ?? sourceText)) {
      bulmaReferenced = true;
    }
    if (sourceImportRe.test(output ?? sourceText)) {
      sourceStillImported = true;
    }
    if (output !== null) {
      if (options.print) io.log(output);
      if (!options.dry) fs.writeFileSync(file, output);
    }
    reporter.finishFile(file, output !== null, collector.entries);
  }
  return { bulmaReferenced, sourceStillImported };
}

/**
 * Surface files in unparseable formats (.astro, .vue, …) that import the
 * source library, so a migration never silently skips them.
 */
function reportUnsupportedFiles(
  source: MigrationSource,
  targets: string[],
  reporter: Reporter,
  extensions: string[]
): void {
  const unsupported = UNSUPPORTED_EXTENSIONS.filter(
    ext => !extensions.includes(ext)
  );
  if (unsupported.length === 0) return;
  for (const file of collectFiles(targets, unsupported)) {
    const text = fs.readFileSync(file, 'utf8');
    if (!text.includes(source.name)) continue;
    const collector = reporter.startFile();
    const line =
      text.split('\n').findIndex(l => l.includes(source.name)) + 1 || null;
    collector.add({
      file,
      line,
      rule: 'unsupported-file',
      message: `imports ${source.name}, but ${path.extname(
        file
      )} files cannot be parsed by the codemod — migrate this file by hand`,
    });
    reporter.finishFile(file, false, collector.entries);
  }
}

function migrateDependencies(
  source: MigrationSource,
  targets: string[],
  reporter: Reporter,
  io: CliIo,
  options: RunOptions,
  deps: { bulmaReferenced: boolean; sourceStillImported: boolean }
): void {
  if (!options.deps || !source.updateDependencies) return;
  for (const pkgPath of findPackageJsons(targets)) {
    const collector = reporter.startFile();
    let changed = false;
    try {
      const raw = fs.readFileSync(pkgPath, 'utf8');
      const pkg = JSON.parse(raw);
      const next = source.updateDependencies(pkgPath, pkg, collector, {
        cssMode: options.cssMode,
        bulmaReferenced: deps.bulmaReferenced,
        sourceStillImported: deps.sourceStillImported,
      });
      if (next !== null) {
        changed = true;
        if (!options.dry) {
          // Keep the manifest's own indentation (tabs, 4-space, …) so the
          // diff stays limited to the dependency changes.
          const indent = raw.match(/^([ \t]+)"/m)?.[1] ?? '  ';
          fs.writeFileSync(pkgPath, `${JSON.stringify(next, null, indent)}\n`);
        }
      }
    } catch (error) {
      io.error(chalk.red(`✖ ${pkgPath}: ${(error as Error).message}`));
    }
    reporter.finishFile(pkgPath, changed, collector.entries);
    if (changed) {
      io.log(
        chalk.yellow(
          options.dry
            ? `Would update ${pkgPath}.`
            : `Updated ${pkgPath} — run your package manager's install to apply.`
        )
      );
    }
  }
}

const TELEMETRY_NOTICE =
  'Help improve bestax-migrate — share anonymous usage stats?\n' +
  "Sends only the run's shape (source library, CSS mode, dry/deps flags,\n" +
  'changed-file count, rule names and counts) plus CLI version, Node major,\n' +
  'and OS name. Never file paths, file contents, or code.\n' +
  '  Details & opt-out: https://bestax.io/docs/guides/telemetry\n' +
  '  Feedback welcome:  https://github.com/allxsmith/bestax/issues';
const TELEMETRY_ACK_ON = 'Thanks! Opt out anytime with --no-telemetry.';
const TELEMETRY_ACK_OFF = "No problem — we won't ask again.";
const TELEMETRY_ACK_UNSAVED =
  "Couldn't save your choice (config dir not writable) — you may be asked again.";

/**
 * One-question consent prompt (readline — this package carries no interactive
 * prompt dependency). Returns null when the question is cancelled (Ctrl-C /
 * Ctrl-D): a cancel is not an answer and nothing is persisted. The streams are
 * injectable so tests can drive the question without a TTY.
 */
export async function promptTelemetryConsent(
  io: CliIo,
  input: Readable = process.stdin,
  output: Writable = process.stdout,
  // Injectable for tests: SIGINT is only emitted by real TTY input, so a test
  // captures the interface through this factory and emits it directly.
  makeInterface: typeof createInterface = createInterface
): Promise<boolean | null> {
  io.log('');
  io.log(chalk.gray(TELEMETRY_NOTICE));
  const rl = makeInterface({ input, output });
  const cancelled = new AbortController();
  // Ctrl-C emits SIGINT on the interface and Ctrl-D closes it; both must
  // reject the pending question instead of leaving it hanging forever.
  rl.once('SIGINT', () => {
    // Honor the interrupt instead of swallowing it into a zero exit: the run
    // itself already succeeded, so no abrupt kill — but the ^C must be
    // visible to callers. 130 = 128 + SIGINT, the shell convention.
    process.exitCode = 130;
    rl.close();
  });
  rl.once('close', () => cancelled.abort());
  try {
    const answer = await rl.question('Share anonymous usage stats? (y/N) ', {
      signal: cancelled.signal,
    });
    return /^y(es)?$/i.test(answer.trim());
  } catch {
    return null;
  } finally {
    rl.close();
  }
}

/**
 * Consent + beacon after a successful run. Only success events are reported,
 * the beacon is awaited (so no error path can kill an in-flight request), and
 * nothing in here may throw or alter the exit code. The prompt is skipped
 * without a TTY on both ends, under an explicit flag, or with DO_NOT_TRACK
 * set (the non-interactive path must never hang).
 */
export async function handleTelemetry(
  stats: MigrateRunStats,
  flag: boolean | undefined,
  io: CliIo,
  promptConsent: (io: CliIo) => Promise<boolean | null> = promptTelemetryConsent
): Promise<void> {
  try {
    await reportMigrateRun(stats, flag, {
      interactive:
        process.stdin.isTTY === true && process.stdout.isTTY === true,
      promptConsent: () => promptConsent(io),
      onDecided: (enabled, persisted) => {
        // Worded on whether the write actually stuck: promising "we won't
        // ask again" after a swallowed write failure would be false.
        if (!persisted) {
          io.log(chalk.dim(TELEMETRY_ACK_UNSAVED));
        } else if (enabled) {
          io.log(chalk.dim(TELEMETRY_ACK_ON));
        } else {
          io.log(chalk.dim(TELEMETRY_ACK_OFF));
        }
      },
    });
  } catch {
    // Telemetry must never affect the migration's outcome.
  }
}

/** Post-run "star us" nudge — TTY only, so piped output stays parseable. */
function displayStarNudge(io: CliIo): void {
  if (process.stdout.isTTY !== true) return;
  io.log('');
  io.log(
    chalk.yellow('★ If you enjoy using bestax-bulma, please star us on GitHub!')
  );
  io.log(chalk.dim('   https://github.com/allxsmith/bestax'));
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
    .option(
      '--telemetry',
      'enable anonymous usage telemetry (https://bestax.io/docs/guides/telemetry)'
    )
    .option('--no-telemetry', 'disable anonymous usage telemetry')
    .action(async (sourceName: string, targets: string[], options) => {
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
      const depSignals = migrateFiles(source, files, reporter, io, runOptions);
      reportUnsupportedFiles(source, targets, reporter, extensions);
      migrateDependencies(
        source,
        targets,
        reporter,
        io,
        runOptions,
        depSignals
      );

      io.log(
        reporter.render(source.label + (runOptions.dry ? ' (dry run)' : ''))
      );

      displayStarNudge(io);

      // Success path only: rule names and counts, never file/line/message.
      const stats: MigrateRunStats = {
        source: source.name,
        cssMode: runOptions.cssMode,
        dry: runOptions.dry,
        deps: runOptions.deps,
        changedCount: reporter.changedCount,
        todosByRule: reporter
          .todosByRule()
          .map(({ rule, entries }) => ({ rule, count: entries.length })),
      };
      await handleTelemetry(
        stats,
        options.telemetry as boolean | undefined,
        io
      );
    });
  return program;
}
