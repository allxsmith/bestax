/**
 * Run reporting: collects per-file results and prints the end-of-run summary.
 * TODO annotations are expected output, not failures — the CLI exits 0 when
 * files were transformed and TODOs remain. A file that failed to migrate is a
 * failure, and the CLI exits 1 for it.
 */

import chalk from 'chalk';
import type { FileResult, TodoCollector, TodoEntry } from './types.js';

export class Reporter {
  private results: FileResult[] = [];

  /** Returns a collector for one file's run; call `finishFile` when done. */
  startFile(): TodoCollector & { entries: TodoEntry[] } {
    const entries: TodoEntry[] = [];
    return {
      entries,
      add(entry: TodoEntry) {
        entries.push(entry);
      },
    };
  }

  finishFile(file: string, changed: boolean, todos: TodoEntry[]): void {
    this.results.push({ file, changed, todos });
  }

  /** A file that failed to migrate, and why. */
  failFile(file: string, error: string, todos: TodoEntry[]): void {
    this.results.push({ file, changed: false, todos, error });
  }

  get files(): FileResult[] {
    return this.results;
  }

  get changedCount(): number {
    return this.results.filter(r => r.changed).length;
  }

  get failures(): FileResult[] {
    return this.results.filter(r => r.error !== undefined);
  }

  get todos(): TodoEntry[] {
    return this.results.flatMap(r => r.todos);
  }

  /** TODO counts grouped by rule, highest first. */
  todosByRule(): Array<{ rule: string; entries: TodoEntry[] }> {
    const byRule = new Map<string, TodoEntry[]>();
    for (const todo of this.todos) {
      const list = byRule.get(todo.rule) ?? [];
      list.push(todo);
      byRule.set(todo.rule, list);
    }
    return [...byRule.entries()]
      .map(([rule, entries]) => ({ rule, entries }))
      .sort((a, b) => b.entries.length - a.entries.length);
  }

  render(label: string): string {
    const lines: string[] = [];
    lines.push('');
    lines.push(chalk.bold(`bestax-migrate — ${label}`));
    const failures = this.failures;
    lines.push(
      `${this.results.length} file(s) scanned, ` +
        `${chalk.green(String(this.changedCount))} transformed, ` +
        (failures.length > 0
          ? `${chalk.red(String(failures.length))} failed, `
          : '') +
        `${chalk.yellow(String(this.todos.length))} TODO(s) left`
    );
    if (failures.length > 0) {
      lines.push('');
      lines.push(chalk.red(`  failed (${failures.length})`));
      for (const { file, error } of failures) {
        lines.push(`    ${file} — ${error}`);
      }
    }
    for (const { rule, entries } of this.todosByRule()) {
      lines.push('');
      lines.push(chalk.yellow(`  ${rule} (${entries.length})`));
      for (const entry of entries) {
        const location =
          entry.line === null ? entry.file : `${entry.file}:${entry.line}`;
        lines.push(`    ${location} — ${entry.message}`);
      }
    }
    if (this.todos.length > 0) {
      lines.push('');
      lines.push(
        `Search for ${chalk.bold('TODO(bestax-migrate)')} comments to finish the migration by hand,`
      );
      lines.push(
        'or let the bestax-migrate skill walk them: https://bestax.io/docs/skills/intro'
      );
    }
    if (failures.length > 0) {
      lines.push('');
      lines.push(
        chalk.red(
          `${failures.length} file(s) failed and were left as they were: fix each one and run the codemod on it again.`
        )
      );
    }
    lines.push('');
    return lines.join('\n');
  }
}
