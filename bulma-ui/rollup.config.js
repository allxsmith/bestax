import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { visualizer } from 'rollup-plugin-visualizer';

export default commandLineArgs => {
  const isVisualizerEnabled = commandLineArgs.configPlugin === 'visualizer';
  return [
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
          noEmit: true,
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
      external: ['react', 'react-dom'],
    },
  ];
};
