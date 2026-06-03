import { offlineRewardCapSeconds, offlineRewardRate } from '../data/balance';
import { calculateOfflineRewardMultiplier } from './rewardCalculator';
import type { OfflineRewardSummary } from '../types/game';

interface OfflineRewardParams {
  lastSavedAt: number | undefined;
  memoryPerSecond: number;
  now: number;
  unlockedSkillNodes: Record<string, number>;
}

export function calculateOfflineReward({
  lastSavedAt,
  memoryPerSecond,
  now,
  unlockedSkillNodes,
}: OfflineRewardParams): OfflineRewardSummary | null {
  if (
    lastSavedAt === undefined ||
    !Number.isFinite(lastSavedAt) ||
    lastSavedAt <= 0 ||
    !Number.isFinite(memoryPerSecond) ||
    memoryPerSecond <= 0
  ) {
    return null;
  }

  const fullElapsedSeconds = Math.max(0, (now - lastSavedAt) / 1_000);
  const elapsedSeconds = Math.min(fullElapsedSeconds, offlineRewardCapSeconds);
  const multiplier = calculateOfflineRewardMultiplier(unlockedSkillNodes);
  const memoryEarned = Math.floor(memoryPerSecond * elapsedSeconds * offlineRewardRate * multiplier);

  if (memoryEarned <= 0) {
    return null;
  }

  return {
    elapsedSeconds,
    memoryEarned,
    multiplier,
    wasCapped: fullElapsedSeconds > offlineRewardCapSeconds,
  };
}
