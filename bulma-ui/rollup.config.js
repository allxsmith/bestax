import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { visualizer } from 'rollup-plugin-visualizer';
import scss from 'rollup-plugin-scss';

const variationBuild = (name) => ({
  input: `src/scss/versions/${name}.scss`,
  output: { file: `dist/versions/${name}.js`, format: 'es' },
  plugins: [
    scss({
      fileName: `${name}.css`,
      outputStyle: 'compressed',
      includePaths: ['src/scss', '../node_modules'],
      sourceMap: true,
    }),
  ],
  onwarn(warning, warn) {
    if (warning.code === 'EMPTY_BUNDLE') return;
    warn(warning);
  },
});

export default commandLineArgs => {
  const isVisualizerEnabled = commandLineArgs.configPlugin === 'visualizer';
  return [
    // Main JS bundle
    {
      input: 'src/index.ts',
      output: [
        {
          dir: 'dist',
          format: 'cjs',
          sourcemap: true,
          entryFileNames: 'index.cjs.js',
        },
        {
          dir: 'dist',
          format: 'esm',
          sourcemap: true,
          entryFileNames: 'index.esm.js',
        },
      ],
      plugins: [
        resolve(),
        commonjs(),
        typescript({
          tsconfig: './tsconfig.json',
          declaration: true,
          declarationDir: 'dist/types',
          rootDir: 'src',
          removeComments: true,
          exclude: ['**/__tests__/**/*', '**/*.test.tsx'],
        }),
        isVisualizerEnabled &&
          visualizer({
            filename: 'dist/stats.html',
            title: 'Bundle Stats - @allxsmith/bestax',
            sourcemap: true,
            gzipSize: true,
          }),
      ].filter(Boolean),
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    // SCSS extras bundle
    {
      input: 'src/scss/extras.scss',
      output: {
        file: 'dist/extras.js',
        format: 'es',
      },
      plugins: [
        scss({
          fileName: 'extras.css',
          outputStyle: 'compressed',
          includePaths: ['src/scss', '../node_modules'],
          sourceMap: true,
        }),
      ],
      onwarn(warning, warn) {
        // Suppress empty bundle warning for SCSS-only build
        if (warning.code === 'EMPTY_BUNDLE') return;
        warn(warning);
      },
    },
    // Combined Bulma + extras bundle
    {
      input: 'src/scss/bestax.scss',
      output: {
        file: 'dist/bestax.js',
        format: 'es',
      },
      plugins: [
        scss({
          fileName: 'bestax.css',
          outputStyle: 'compressed',
          includePaths: ['src/scss', '../node_modules'],
          sourceMap: true,
        }),
      ],
      onwarn(warning, warn) {
        if (warning.code === 'EMPTY_BUNDLE') return;
        warn(warning);
      },
    },
    // CSS variation builds
    variationBuild('bestax-prefixed'),
    variationBuild('bestax-bulma-prefixed'),
    variationBuild('bestax-no-helpers'),
    variationBuild('bestax-no-helpers-prefixed'),
    variationBuild('bestax-no-dark-mode'),
  ];
};
