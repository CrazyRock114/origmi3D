import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';

await build({
  entryPoints: ['scripts/engine-check.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: 'scripts/.engine-check.mjs',
  logLevel: 'silent',
});
const r = spawnSync('node', ['scripts/.engine-check.mjs'], { stdio: 'inherit' });
process.exit(r.status ?? 1);
