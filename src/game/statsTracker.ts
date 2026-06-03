import { stages } from '../data/stages';
import type { GameStats } from '../types/game';

export const createInitialStats = (): GameStats => ({
  highestStageReached: 1,
  rebootCount: 0,
  totalCornerHits: 0,
  totalFeverActivations: 0,
  totalJackpots: 0,
  totalMemoryEarned: 0,
  totalNearCorners: 0,
  totalPlayTimeMs: 0,
  totalWallHits: 0,
  unlockedBackgroundCount: 0,
});

export function getStageNumber(stageId: string): number {
  const stageIndex = stages.findIndex((stage) => stage.id === stageId);
  return stageIndex >= 0 ? stageIndex + 1 : 1;
}

export function normalizeStats(value: unknown, fallback?: Partial<GameStats>): GameStats {
  const defaults = { ...createInitialStats(), ...fallback };

  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const source = value as Partial<Record<keyof GameStats, unknown>>;
  const readNumber = (key: keyof GameStats) => {
    const rawValue = source[key];
    return typeof rawValue === 'number' && Number.isFinite(rawValue) && rawValue >= 0
      ? rawValue
      : defaults[key];
  };

  return {
    highestStageReached: Math.max(1, Math.floor(readNumber('highestStageReached'))),
    rebootCount: Math.floor(readNumber('rebootCount')),
    totalCornerHits: Math.floor(readNumber('totalCornerHits')),
    totalFeverActivations: Math.floor(readNumber('totalFeverActivations')),
    totalJackpots: Math.floor(readNumber('totalJackpots')),
    totalMemoryEarned: readNumber('totalMemoryEarned'),
    totalNearCorners: Math.floor(readNumber('totalNearCorners')),
    totalPlayTimeMs: Math.floor(readNumber('totalPlayTimeMs')),
    totalWallHits: Math.floor(readNumber('totalWallHits')),
    unlockedBackgroundCount: Math.floor(readNumber('unlockedBackgroundCount')),
  };
}
