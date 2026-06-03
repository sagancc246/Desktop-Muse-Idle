import type { Background } from '../types/game';

export const backgrounds: Background[] = [
  {
    id: 'bg_default_room',
    name: 'Default Room',
    description: 'A calm desk lit by the night sky.',
    imagePath: './assets/backgrounds/bg_default_room.svg',
    unlockStageId: 'stage-1',
  },
  {
    id: 'bg_cozy_room',
    name: 'Cozy Room',
    description: 'A warm hideaway for long idle sessions.',
    imagePath: './assets/backgrounds/bg_cozy_room.webp',
    unlockStageId: 'stage-2',
  },
  {
    id: 'bg_neon_room',
    name: 'Neon Room',
    description: 'A vivid terminal glow for the final loop.',
    imagePath: './assets/backgrounds/bg_neon_room.webp',
    unlockStageId: 'stage-3',
  },
  {
    id: 'bg_pinball_neon',
    name: 'Pinball Neon',
    description: 'A neon pinball table with animated CSS glow layers.',
    imagePath: './assets/backgrounds/bg_pinball_neon.webp',
    unlockStageId: 'stage-4',
  },
];

export function getBackgroundById(backgroundId: string | null): Background | undefined {
  return backgrounds.find((background) => background.id === backgroundId);
}
