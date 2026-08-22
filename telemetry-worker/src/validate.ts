/**
 * Reject-by-default payload validation. Every key, everywhere, must be on an
 * allowlist and every value must match its allowlisted shape — anything else
 * rejects the whole payload. Rejection reasons are internal (tests/debug
 * only); the handler always answers a bare 400.
 */

import {
  BULMA_FLAVORS,
  CHANGED_BUCKETS,
  CSS_MODES,
  EVENT_FOR_TOOL,
  ICON_LIBRARIES,
  MAX_CHANGED_COUNT,
  MAX_TODO_RULES,
  MIGRATE_SOURCES,
  PACKAGE_MANAGERS,
  PLATFORMS,
  TEMPLATES,
  TOOLS,
} from './schema.ts';
import type { TelemetryPayload, Tool } from './schema.ts';

export type ValidationResult =
  { ok: true; payload: TelemetryPayload } | { ok: false; reason: string };

const VERSION_RE = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
const MAX_VERSION_LENGTH = 32;
const RULE_RE = /^[a-z0-9][a-z0-9._-]{0,63}$/;

const TOP_KEYS = [
  'v',
  'tool',
  'event',
  'toolVersion',
  'nodeMajor',
  'platform',
  'props',
] as const;
const CREATE_PROP_KEYS = [
  'template',
  'bulmaFlavor',
  'iconLibrary',
  'skills',
  'packageManager',
] as const;
const MIGRATE_PROP_KEYS = [
  'source',
  'cssMode',
  'dry',
  'deps',
  'changedBucket',
  'changedCount',
] as const;
const TODO_ENTRY_KEYS = ['rule', 'count'] as const;

const reject = (reason: string): ValidationResult => ({ ok: false, reason });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  obj: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = []
): boolean {
  const keys = Object.keys(obj);
  return (
    keys.every(key => required.includes(key) || optional.includes(key)) &&
    required.every(key => keys.includes(key))
  );
}

function inSet(set: ReadonlySet<string>, value: unknown): boolean {
  return typeof value === 'string' && set.has(value);
}

export function validate(body: unknown): ValidationResult {
  if (!isRecord(body)) return reject('body is not a JSON object');

  if (typeof body.tool !== 'string' || !TOOLS.includes(body.tool as Tool)) {
    return reject('unknown tool');
  }
  const tool = body.tool as Tool;

  const optionalTopKeys = tool === 'bestax-migrate' ? ['todosByRule'] : [];
  if (!hasExactKeys(body, TOP_KEYS, optionalTopKeys)) {
    return reject('unexpected or missing top-level keys');
  }

  if (body.v !== 1) return reject('unsupported schema version');
  if (body.event !== EVENT_FOR_TOOL[tool]) {
    return reject('event does not match tool');
  }
  if (
    typeof body.toolVersion !== 'string' ||
    body.toolVersion.length > MAX_VERSION_LENGTH ||
    !VERSION_RE.test(body.toolVersion)
  ) {
    return reject('invalid toolVersion');
  }
  if (
    typeof body.nodeMajor !== 'number' ||
    !Number.isInteger(body.nodeMajor) ||
    body.nodeMajor < 10 ||
    body.nodeMajor > 99
  ) {
    return reject('invalid nodeMajor');
  }
  if (!inSet(PLATFORMS, body.platform)) return reject('unknown platform');
  if (!isRecord(body.props)) return reject('props is not an object');
  const props = body.props;

  if (tool === 'create-bestax') {
    if (!hasExactKeys(props, CREATE_PROP_KEYS)) {
      return reject('unexpected or missing props keys');
    }
    if (!inSet(TEMPLATES, props.template)) return reject('unknown template');
    if (!inSet(BULMA_FLAVORS, props.bulmaFlavor)) {
      return reject('unknown bulmaFlavor');
    }
    if (!inSet(ICON_LIBRARIES, props.iconLibrary)) {
      return reject('unknown iconLibrary');
    }
    if (typeof props.skills !== 'boolean') return reject('invalid skills');
    if (!inSet(PACKAGE_MANAGERS, props.packageManager)) {
      return reject('unknown packageManager');
    }
  } else {
    if (!hasExactKeys(props, MIGRATE_PROP_KEYS)) {
      return reject('unexpected or missing props keys');
    }
    if (!inSet(MIGRATE_SOURCES, props.source)) return reject('unknown source');
    if (!inSet(CSS_MODES, props.cssMode)) return reject('unknown cssMode');
    if (typeof props.dry !== 'boolean') return reject('invalid dry');
    if (typeof props.deps !== 'boolean') return reject('invalid deps');
    if (!inSet(CHANGED_BUCKETS, props.changedBucket)) {
      return reject('unknown changedBucket');
    }
    if (
      typeof props.changedCount !== 'number' ||
      !Number.isInteger(props.changedCount) ||
      props.changedCount < 0 ||
      props.changedCount > MAX_CHANGED_COUNT
    ) {
      return reject('invalid changedCount');
    }

    if (body.todosByRule !== undefined) {
      const todos = body.todosByRule;
      if (!Array.isArray(todos) || todos.length > MAX_TODO_RULES) {
        return reject('invalid todosByRule');
      }
      for (const entry of todos) {
        if (!isRecord(entry) || !hasExactKeys(entry, TODO_ENTRY_KEYS)) {
          return reject('invalid todosByRule entry');
        }
        if (typeof entry.rule !== 'string' || !RULE_RE.test(entry.rule)) {
          return reject('invalid todo rule');
        }
        if (
          typeof entry.count !== 'number' ||
          !Number.isInteger(entry.count) ||
          entry.count < 0 ||
          entry.count > MAX_CHANGED_COUNT
        ) {
          return reject('invalid todo count');
        }
      }
    }
  }

  // Every field above has been checked against the allowlists, so the cast is
  // the runtime-verified equivalent of the static type.
  return { ok: true, payload: body as unknown as TelemetryPayload };
}
