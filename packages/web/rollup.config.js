import esbuild from 'rollup-plugin-esbuild';
import litCss from 'rollup-plugin-lit-css';
import postcss from 'rollup-plugin-postcss';
import url from '@rollup/plugin-url';
import postcssUrl from 'postcss-url';
import copy from 'rollup-plugin-copy';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

import minifyHtml from 'rollup-plugin-minify-html-literals';
import { terser } from 'rollup-plugin-terser';

import path from 'path';

function createConfig(packageName, tsconfig = './tsconfig.json') {
  const output = {
    exports: 'named',
    name: packageName,
    sourcemap: true,
  };

  const production = !process.env.ROLLUP_WATCH;

  const esbuildPlugin = esbuild({
    minify: false,
    tsconfig,
    platform: 'browser',
    treeShaking: true,
    loaders: {
      '.json': 'json',
    },
  });

  const litCssPlugin = litCss({
    include: ['**/*.css'],
    uglify: true,
  });

  const copyPlugin = copy({
    targets: [
      // Need to copy the files over for usage
      { src: 'src/assets/fonts', dest: 'dist/assets' },
      // { src: 'src/sandbox', dest: 'dist' },
    ],
  });

  const postcssPlugin = postcss({
    minimize: true,
    modules: false,
    autoModules: true,
    extensions: ['.css', '.less'],
    use: {
      sass: null,
      stylus: null,
    },
    extract: path.resolve('dist/index.css'),
    plugins: [
      postcssUrl({
        url: 'inline', // enable inline assets using base64 encoding
        maxSize: 10, // maximum file size to inline (in kilobytes)
        fallback: 'copy', // fallback method to use if max size is exceeded
      }),
    ],
  });

  const urlPlugin = url();

  const terserPlugin =
    production &&
    terser({
      compress: {
        drop_console: production,
        drop_debugger: production,
      },
      output: { comments: false },
    });

  return [
    {
      input: './src/index.ts',
      plugins: [nodeResolve(), commonjs(), litCssPlugin, minifyHtml, esbuildPlugin, postcssPlugin, urlPlugin, copyPlugin],
      output: [{ file: './dist/index.js', format: 'cjs', ...output }],
    },
  ];
};

export default createConfig('web');

