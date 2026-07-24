import { build } from 'esbuild';
import { mkdir, rm } from 'node:fs/promises';

const outdir = 'public/assets/cinematic';
await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

await build({
  entryPoints: { 'e5-cinematic': 'src/cinematic/runtime.ts' },
  outdir,
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  sourcemap: false,
  minify: true,
  treeShaking: true,
  entryNames: '[name]',
  chunkNames: 'chunks/[name]-[hash]',
  assetNames: 'assets/[name]-[hash]',
  legalComments: 'eof',
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'info',
});
