import type { MigrationSource } from '../../types.js';
import { readBestaxPackages } from '../_shared/bestax-floor.js';
import transform from './transform.js';
import { transformStyles } from './styles.js';
import { updateDependencies } from './deps.js';

export const rbx: MigrationSource = {
  name: 'rbx',
  label: 'rbx (v2) → @allxsmith/bestax-bulma',
  // Which bestax-bulma each package gets, for `Pagination.Ellipsis`'s
  // className.
  analyzeProject: targets => ({
    bestaxPackages: readBestaxPackages(targets),
  }),
  transform,
  transformStyles,
  updateDependencies,
};
