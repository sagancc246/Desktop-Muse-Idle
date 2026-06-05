import type { Background } from '../types/game';

export const backgrounds: Background[] = [
  {
    id: 'bg_default_room',
    name: 'Default Room',
    description: 'A calm desk lit by the night sky.',
    imagePath: './assets/backgrounds/bg_default_room.svg',
    thumbnailAsset: './assets/backgrounds/bg_default_room.svg',
    unlockCondition: { type: 'initial' },
  },
  {
    id: 'bg_cozy_room',
    name: 'Cozy Room',
    description: 'A warm hideaway for long idle sessions.',
    imagePath: './assets/backgrounds/bg_cozy_room.webp',
    thumbnailAsset: './assets/backgrounds/bg_cozy_room.webp',
    unlockCondition: { type: 'stage_clear', targetId: 'stage-1' },
  },
  {
    id: 'bg_neon_room',
    name: 'Neon Room',
    description: 'A vivid terminal glow for the final loop.',
    imagePath: './assets/backgrounds/bg_neon_room.webp',
    thumbnailAsset: './assets/backgrounds/bg_neon_room.webp',
    unlockCondition: { type: 'stage_clear', targetId: 'stage-3' },
  },
  {
    id: 'bg_night_room',
    name: 'Night Room',
    description: 'A quiet room for late-night idle sessions.',
    imagePath: './assets/backgrounds/bg_night_room.webp',
    thumbnailAsset: './assets/backgrounds/bg_night_room.webp',
    unlockCondition: { type: 'stage_clear', targetId: 'stage-4' },
  },
  {
    id: 'bg_star_room',
    name: 'Star Room',
    description: 'A bright observatory surrounded by distant stars.',
    imagePath: './assets/backgrounds/bg_star_room.webp',
    thumbnailAsset: './assets/backgrounds/bg_star_room.webp',
    unlockCondition: { type: 'stage_clear', targetId: 'stage-8' },
  },
  {
    id: 'bg_pinball_neon',
    name: 'Pinball Neon',
    description: 'A neon pinball table with animated CSS glow layers.',
    imagePath: './assets/backgrounds/bg_pinball_neon.webp',
    thumbnailAsset: './assets/backgrounds/bg_pinball_neon.webp',
    unlockCondition: { type: 'stage_clear', targetId: 'stage-7' },
  },
];

export function getBackgroundById(backgroundId: string | null): Background | undefined {
  return backgrounds.find((background) => background.id === backgroundId);
}

export const initialUnlockedBackgroundIds = backgrounds
  .filter((background) => background.unlockCondition.type === 'initial')
  .map((background) => background.id);

export const initialBackgroundId = initialUnlockedBackgroundIds[0] ?? null;
