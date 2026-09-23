import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  // ESM only — no CJS / IIFE / UMD outputs.
  format: ['esm'],
  target: 'es2022',
  platform: 'neutral',
  outDir: 'dist',
  dts: {
    sourcemap: false,
  },
  treeshake: true,
  minify: true,
  clean: true,
  sourcemap: false,
  fixedExtension: false,
  // Package is `"type": "module"`; dist/index.js is pure ESM (`export {…}`).
  // `sideEffects: false` lets consumers tree-shake unused named exports.
});
