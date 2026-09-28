import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

await build({
  entryPoints: [path.join(ROOT, 'tests/exhaustive.node.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: path.join(ROOT, 'tests/.exhaustive.node.mjs'),
  logLevel: 'silent',
});

const r = spawnSync('node', [path.join(ROOT, 'tests/.exhaustive.node.mjs')], { stdio: 'inherit' });
process.exit(r.status ?? 1);
