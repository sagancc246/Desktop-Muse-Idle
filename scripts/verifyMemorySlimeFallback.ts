import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { monsterAssets } from '../src/data/monsters';
import { resolveMonsterSpriteAsset } from '../src/systems/monsterAssetResolver';

const repoRoot = process.cwd();

function assetPathExists(assetPath: string): boolean {
  const normalized = assetPath.replace(/^\.?\//, '');
  const relativePath = normalized.startsWith('assets/') ? `public/${normalized}` : normalized;
  return existsSync(resolve(repoRoot, relativePath));
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const memorySlime = monsterAssets.find((monster) => monster.id === 'memory_slime');
assert(memorySlime, 'memory_slime monster asset master is missing');

const normal = resolveMonsterSpriteAsset('memory_slime', assetPathExists);
assert(normal.assetPath === memorySlime.spriteAsset, 'memory_slime primary sprite should resolve when present');
assert(normal.usedFallback === false, 'memory_slime should not use fallback when primary sprite exists');

const missingPrimary = resolveMonsterSpriteAsset(
  'memory_slime',
  (assetPath) => assetPath !== memorySlime.spriteAsset && assetPathExists(assetPath),
);
assert(
  missingPrimary.assetPath === memorySlime.fallbackSpriteAsset,
  'uses fallback asset when Memory Slime sprite is missing',
);
assert(missingPrimary.usedFallback === true, 'missing Memory Slime primary sprite should mark usedFallback');
assert(
  Boolean(missingPrimary.assetPath),
  'Memory Slime fallback resolver must not return undefined/null/empty asset path',
);
assert(
  assetPathExists(missingPrimary.assetPath),
  `Memory Slime fallback asset must exist: ${missingPrimary.assetPath}`,
);

console.log('Memory Slime fallback verification passed');
