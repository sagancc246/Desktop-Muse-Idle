export type MonsterId = 'memory_slime';

export interface MonsterAssetDefinition {
  id: MonsterId;
  name: string;
  spriteAsset: string;
  fallbackSpriteAsset: string;
}

export const monsterAssets: MonsterAssetDefinition[] = [
  {
    id: 'memory_slime',
    name: 'Memory Slime',
    spriteAsset: './assets/monsters/memory_slime.png',
    fallbackSpriteAsset: './assets/monsters/memory_slime_fallback.svg',
  },
];

export function getMonsterAssetById(monsterId: MonsterId): MonsterAssetDefinition {
  return monsterAssets.find((monster) => monster.id === monsterId) ?? monsterAssets[0];
}
