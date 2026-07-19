import type { MigrationSource } from '../../types.js';
import transform from './transform.js';
import { transformStyles } from './styles.js';
import { updateDependencies } from './deps.js';

export const reactBulmaComponents: MigrationSource = {
  name: 'react-bulma-components',
  label: 'react-bulma-components (v4) → @allxsmith/bestax-bulma',
  transform,
  transformStyles,
  updateDependencies,
};
