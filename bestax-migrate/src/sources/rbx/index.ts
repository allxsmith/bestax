import type { MigrationSource } from '../../types.js';
import transform from './transform.js';
import { transformStyles } from './styles.js';
import { updateDependencies } from './deps.js';

export const rbx: MigrationSource = {
  name: 'rbx',
  label: 'rbx (v2) → @allxsmith/bestax-bulma',
  transform,
  transformStyles,
  updateDependencies,
};
