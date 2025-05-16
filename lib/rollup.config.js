import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import visualizer from 'rollup-plugin-visualizer';

export default (commandLineArgs) => {
  const isVisualizerEnabled = commandLineArgs.configPlugin === 'visualizer';

  return [
    {
      input: 'src/index.ts',
      output: [
        {
          file: 'dist/cjs/index.js',
          format: 'cjs',
          sourcemap: true
        },
        {
          file: 'dist/esm/index.js',
          format: 'esm',
          sourcemap: true
        }
      ],
      plugins: [
        resolve(),
        commonjs(),
        typescript({ tsconfig: './tsconfig.json' }),
        isVisualizerEnabled &&
          visualizer({
            filename: 'dist/stats.html',
            title: 'Bundle Stats - @allxsmith/bestack',
            sourcemap: true,
            gzipSize: true
          })
      ].filter(Boolean),
      external: ['react', 'react-dom']
    }
  ];
};