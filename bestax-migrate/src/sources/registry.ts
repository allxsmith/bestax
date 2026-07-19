/**
 * The multi-source seam: every library bestax-migrate can migrate from
 * registers here, and the CLI resolves its first argument against this map.
 */

import type { MigrationSource } from '../types.js';
import { reactBulmaComponents } from './react-bulma-components/index.js';

export const SOURCES: Record<string, MigrationSource> = {
  [reactBulmaComponents.name]: reactBulmaComponents,
};

export function getSource(name: string): MigrationSource | undefined {
  return SOURCES[name];
}

export function sourceNames(): string[] {
  return Object.keys(SOURCES);
}
