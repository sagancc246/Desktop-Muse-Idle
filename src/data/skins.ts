import { getMuseById } from './muses';
import type { MuseSkin, SkinUnlockMethod } from '../types/game';

export const museSkins: MuseSkin[] = [
  {
    id: 'lumi_default',
    museId: 'lumi',
    name: 'Lumi Default',
    description: 'Lumi in her soft orchid starter look.',
    rarity: 'common',
    iconAsset: 'lumi-orchid',
    thumbnailAsset: '/assets/muses/lumi/lumi_default.png',
    defaultUnlocked: true,
    unlockMethod: 'default',
    unlockCondition: { type: 'initial' },
  },
  {
    id: 'astra_default',
    museId: 'astra',
    name: 'Astra Default',
    description: 'Astra with her clear cyan field palette.',
    rarity: 'common',
    iconAsset: 'astra-cyan',
    thumbnailAsset: '/assets/muses/astra/astra_default.png',
    defaultUnlocked: true,
    unlockMethod: 'default',
    unlockCondition: { type: 'initial' },
  },
  {
    id: 'noir_default',
    museId: 'noir',
    name: 'Noir Default',
    description: 'Noir in her rose-tinted night palette.',
    rarity: 'common',
    iconAsset: 'noir-rose',
    thumbnailAsset: '/assets/muses/noir/noir_default.png',
    defaultUnlocked: true,
    unlockMethod: 'default',
    unlockCondition: { type: 'initial' },
  },
  {
    id: 'vega_default',
    museId: 'vega',
    name: 'Vega Default',
    description: 'Vega with a warm gold bumper-ready palette.',
    rarity: 'common',
    iconAsset: 'vega-gold',
    thumbnailAsset: '/assets/muses/vega/vega_default.png',
    defaultUnlocked: true,
    unlockMethod: 'default',
    unlockCondition: { type: 'initial' },
  },
  {
    id: 'lumi_pastel',
    museId: 'lumi',
    name: 'Lumi Pastel',
    description: 'A lighter pastel outfit planned for stage rewards.',
    rarity: 'rare',
    iconAsset: 'lumi-pastel',
    thumbnailAsset: '/assets/muses/lumi/lumi_pastel.png',
    defaultUnlocked: false,
    unlockMethod: 'stage',
    unlockCondition: { type: 'stage_clear', targetId: 'stage-2' },
  },
  {
    id: 'astra_cyber',
    museId: 'astra',
    name: 'Astra Cyber',
    description: 'A sharper neon-blue style earned from Stage 7.',
    rarity: 'rare',
    iconAsset: 'astra-cyber',
    thumbnailAsset: '/assets/muses/astra/astra_cyber.png',
    defaultUnlocked: false,
    unlockMethod: 'stage',
    unlockCondition: { type: 'stage_clear', targetId: 'stage-7' },
  },
  {
    id: 'noir_gothic',
    museId: 'noir',
    name: 'Noir Gothic',
    description: 'A deep gothic palette reserved for capsules.',
    rarity: 'rare',
    iconAsset: 'noir-gothic',
    thumbnailAsset: '/assets/muses/noir/noir_gothic.png',
    defaultUnlocked: false,
    unlockMethod: 'capsule',
    unlockCondition: { type: 'capsule', targetId: 'noir_gothic' },
  },
  {
    id: 'vega_bumper',
    museId: 'vega',
    name: 'Vega Bumper',
    description: 'A bold bumper-focused look for Vega.',
    rarity: 'rare',
    iconAsset: 'vega-bumper',
    thumbnailAsset: '/assets/muses/vega/vega_bumper.png',
    defaultUnlocked: false,
    unlockMethod: 'capsule',
    unlockCondition: { type: 'capsule', targetId: 'vega_bumper' },
  },
];

export const initialUnlockedSkinIds = museSkins
  .filter((skin) => skin.defaultUnlocked)
  .map((skin) => skin.id);

export function getSkinById(skinId: string): MuseSkin | undefined {
  return museSkins.find((skin) => skin.id === skinId);
}

export function getSkinsByMuseId(museId: string): MuseSkin[] {
  return museSkins.filter((skin) => skin.museId === museId);
}

export function getDefaultSkinForMuse(museId: string): MuseSkin | undefined {
  const defaultSkinId = getMuseById(museId)?.defaultSkinId;
  return museSkins.find((skin) => skin.id === defaultSkinId && skin.museId === museId);
}

export function createInitialEquippedSkinByMuseId(): Record<string, string> {
  return Object.fromEntries(
    museSkins
      .filter((skin) => skin.defaultUnlocked)
      .map((skin) => [skin.museId, skin.id]),
  );
}

export function getEquippedSkinForMuse(
  museId: string,
  equippedSkinByMuseId: Record<string, string>,
): MuseSkin | undefined {
  const equippedSkin = getSkinById(equippedSkinByMuseId[museId]);

  if (equippedSkin?.museId === museId) {
    return equippedSkin;
  }

  return getDefaultSkinForMuse(museId);
}

export function getSkinUnlockMethodLabel(method: SkinUnlockMethod): string {
  switch (method) {
    case 'default':
      return 'Default Skin';
    case 'stage':
      return 'Stage reward';
    case 'capsule':
      return 'Muse Capsule';
    case 'shard':
      return 'Skin Shard exchange';
    case 'dlc':
      return 'DLC skin pack';
    default:
      return 'Unlock later';
  }
}
