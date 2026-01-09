import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import { join, dirname } from 'path';
import { createRequire } from 'module';
import type { RollupLog } from 'rollup'; // Import RollupLog type

const require = createRequire(import.meta.url);

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  addons: [
    getAbsolutePath('@storybook/addon-onboarding'),
    getAbsolutePath('@storybook/addon-docs'),
  ],

  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },

  viteFinal: async config => {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@allxsmith/bestax': '/src/index.ts',
        },
      },
      build: {
        rollupOptions: {
          onwarn(warning: RollupLog, warn: (warning: RollupLog) => void) {
            if (
              warning.message.includes('Use of eval') &&
              warning.message.includes('storybook') &&
              warning.message.includes('runtime.js')
            ) {
              return; // Suppress the eval warning from Storybook's runtime.js
            }
            warn(warning); // Pass through other warnings
          },
        },
      },
    });
  },
};
export default config;
