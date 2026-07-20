/**
 * Shared types for the bestax-migrate codemod platform.
 *
 * Each source library (e.g. react-bulma-components) contributes a declarative
 * mapping table plus a jscodeshift transform that consumes it. Everything the
 * transform cannot convert safely is annotated with a `TODO(bestax-migrate)`
 * comment and collected into the run report.
 */

import type { API, FileInfo } from 'jscodeshift';

/**
 * How completely a source-library component converts to bestax-bulma.
 *
 * - `mapped`  — converts fully; no follow-up expected.
 * - `partial` — converts, but some props or structures are left as TODOs.
 * - `todo`    — no bestax equivalent; usage is annotated and left in place.
 */
export type MappingStatus = 'mapped' | 'partial' | 'todo';

/** A declarative action to apply to a single JSX prop. */
export interface PropAction {
  /** Rename the attribute, keeping its value. */
  rename?: string;
  /** Remap literal string values (applied after `numberToString`). */
  valueMap?: Record<string, string>;
  /**
   * Changes `valueMap` semantics: matched literal values become bare boolean
   * prop(s) named by the mapped value (space-separated for several), and the
   * original attribute is removed. Unmatched literal values are left as-is
   * unless listed in `valueTodo`; non-literal values get a TODO.
   */
  valueToProp?: boolean;
  /** Convert a numeric literal value to its string form ({4} → "4"). */
  numberToString?: boolean;
  /**
   * Replace a boolean (valueless) attribute with `name="value"`, or with a
   * bare boolean `name` when `value` is omitted.
   */
  booleanToProp?: { name: string; value?: string };
  /** Remove the attribute entirely. */
  drop?: boolean;
  /** Leave the attribute as-is and attach a TODO with this hint. */
  todo?: string;
  /**
   * TODO hints keyed by specific literal values; other values convert
   * normally. Takes precedence over `valueMap` for the listed values.
   */
  valueTodo?: Record<string, string>;
}

/** Mapping for one source-library component (or compound sub-component). */
export interface ComponentMapping {
  status: MappingStatus;
  /**
   * Target bestax-bulma JSX name, dotted for compounds (`Card.FooterItem`).
   * The first segment is the import added to `@allxsmith/bestax-bulma`.
   * Omitted when `status` is `todo` or a `special` handler chooses the target.
   */
  target?: string;
  /** Hint attached to the TODO comment when `status` is `todo`. */
  todo?: string;
  /** Key of a structural handler in the transform (align-based targets etc.). */
  special?: string;
  /** Per-prop actions, applied before the universal modifier-prop pass. */
  props?: Record<string, PropAction>;
  /** Compound sub-components keyed by their source-library name. */
  subs?: Record<string, ComponentMapping>;
}

/** One annotation left in the code, mirrored into the run report. */
export interface TodoEntry {
  file: string;
  line: number | null;
  rule: string;
  message: string;
}

/** Per-file outcome of a transform run. */
export interface FileResult {
  file: string;
  changed: boolean;
  todos: TodoEntry[];
}

/** Collects TODO entries for the file currently being transformed. */
export interface TodoCollector {
  add(entry: TodoEntry): void;
}

/**
 * Which stylesheet target CSS/SCSS rewrites aim at:
 * - `bestax` (default): the recommended `@allxsmith/bestax-bulma/bestax.css`
 *   combined bundle (Bulma v1 + extras; bulma comes as a transitive dep).
 * - `bulma`: plain `bulma/css/bulma.min.css` plus a separate extras import.
 * - `keep`: leave existing bulma stylesheet imports untouched.
 */
export type CssMode = 'bestax' | 'bulma' | 'keep';

/** Options threaded through to transforms by the CLI and the tests. */
export interface TransformOptions {
  collector?: TodoCollector;
  cssMode?: CssMode;
  [key: string]: unknown;
}

/** Options for the package.json dependency updater. */
export interface DepsOptions {
  cssMode?: CssMode;
  /** True when migrated sources still reference `bulma/…` specifiers. */
  bulmaReferenced?: boolean;
}

/** The standard jscodeshift transform contract. */
export type Transform = (
  fileInfo: FileInfo,
  api: API,
  options: TransformOptions
) => string | undefined;

/** Text-level transform for stylesheet files (.scss/.sass). */
export type StylesTransform = (
  filePath: string,
  source: string,
  collector: TodoCollector | undefined,
  options: TransformOptions
) => string | null;

/** package.json updater; returns the changed manifest or null. */
export type DependenciesUpdate = (
  filePath: string,
  pkg: Record<string, unknown>,
  collector: TodoCollector | undefined,
  options: DepsOptions
) => Record<string, unknown> | null;

/** A migration source registered with the CLI. */
export interface MigrationSource {
  /** CLI name, e.g. `react-bulma-components`. */
  name: string;
  /** Human-readable label for the report header. */
  label: string;
  transform: Transform;
  transformStyles?: StylesTransform;
  updateDependencies?: DependenciesUpdate;
}
