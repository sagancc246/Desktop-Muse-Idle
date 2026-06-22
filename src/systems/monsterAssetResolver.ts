import { getMonsterAssetById, type MonsterId } from '../data/monsters';

export interface ResolvedMonsterSpriteAsset {
  assetPath: string;
  fallbackAssetPath: string;
  monsterId: MonsterId;
  usedFallback: boolean;
}

export type MonsterAssetExists = (assetPath: string) => boolean;

export function resolveMonsterSpriteAsset(
  monsterId: MonsterId,
  assetExists: MonsterAssetExists = () => true,
): ResolvedMonsterSpriteAsset {
  const monster = getMonsterAssetById(monsterId);
  const primaryExists = assetExists(monster.spriteAsset);

  return {
    assetPath: primaryExists ? monster.spriteAsset : monster.fallbackSpriteAsset,
    fallbackAssetPath: monster.fallbackSpriteAsset,
    monsterId: monster.id,
    usedFallback: !primaryExists,
  };
}
