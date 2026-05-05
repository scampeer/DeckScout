import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/plugin.ts',
  output: {
    dir: 'deckscout.sdPlugin/plugin',
    entryFileNames: 'index.js',
    format: 'cjs',
    exports: 'auto',
    sourcemap: true
  },
  plugins: [resolve({ preferBuiltins: true }), commonjs(), typescript()]
};
