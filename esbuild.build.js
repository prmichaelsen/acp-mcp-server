import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  format: 'esm',
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  packages: 'external',
  banner: {
    js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
  },
});

console.log('✅ Build complete');
