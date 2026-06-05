import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const result = await build({
  absWorkingDir: repoRoot,
  bundle: true,
  entryPoints: [resolve(repoRoot, 'scripts/verifyMasters.ts')],
  format: 'esm',
  platform: 'node',
  write: false,
});
const source = result.outputFiles[0].text;
const url = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

await import(url);
