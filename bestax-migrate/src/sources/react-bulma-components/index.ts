import type { MigrationSource } from '../../types.js';
import transform from './transform.js';

export const reactBulmaComponents: MigrationSource = {
  name: 'react-bulma-components',
  label: 'react-bulma-components (v4) → @allxsmith/bestax-bulma',
  transform,
};
