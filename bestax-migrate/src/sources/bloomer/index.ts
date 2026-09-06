import type { MigrationSource } from '../../types.js';
import transform from './transform.js';
import { transformStyles } from './styles.js';
import { updateDependencies } from './deps.js';

export const bloomer: MigrationSource = {
  name: 'bloomer',
  label: 'bloomer (0.6) → @allxsmith/bestax-bulma',
  transform,
  transformStyles,
  updateDependencies,
};
