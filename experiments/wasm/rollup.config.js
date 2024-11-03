import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default [
  {
    input: 'hbs-wasm.js',
    output: [
      {
        file: 'dist/hbs-wasm.esm.js',
        format: 'es',
        sourcemap: true
      }
    ],
    plugins: [
      resolve({
        browser: false,
        preferBuiltins: false
      }),
      commonjs(),
      terser()
    ],
    external: ['handlebars', 'stringify-object']
  }
];