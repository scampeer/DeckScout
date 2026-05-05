import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

const plugins = [resolve({ preferBuiltins: true }), commonjs(), typescript()];

export default [
  {
    input: 'src/plugin.ts',
    output: {
      dir: 'deckscout.sdPlugin/plugin',
      entryFileNames: 'index.js',
      format: 'cjs',
      exports: 'auto',
      sourcemap: true
    },
    plugins
  },
  {
    input: 'src/elgato/plugin.ts',
    output: {
      dir: 'deckscout-elgato.sdPlugin/bin',
      entryFileNames: 'plugin.js',
      format: 'esm',
      sourcemap: true
    },
    plugins
  }
];
