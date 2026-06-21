import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
async function runBundledScript(entryPoint) {
  const result = await build({
    absWorkingDir: repoRoot,
    bundle: true,
    entryPoints: [resolve(repoRoot, entryPoint)],
    format: 'esm',
    platform: 'node',
    write: false,
  });
  const source = result.outputFiles[0].text;
  const url = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

  await import(url);
}

await runBundledScript('scripts/verifyMasters.ts');
await runBundledScript('scripts/verify-masters.ts');
