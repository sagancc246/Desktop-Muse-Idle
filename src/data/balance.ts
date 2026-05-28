export const baseMemoryPerBounce = 1;
export const cornerThreshold = 32;
export const baseCornerReward = 100;
export const rebootMemoryRequirement = 100_000;
export const museTapDurationMs = 3_000;
export const museTapCooldownMs = 8_000;
export const museTapCornerRewardMultiplier = 1.5;
export const museTapCornerRewardMultiplierHigh = 1.75;
export const museTapSpeedMultiplierLow = 1.1;
export const museTapSpeedMultiplierMedium = 1.25;
export const museTapSpeedMultiplierHigh = 1.4;
export const museTapDirectionChangeDegreeLow = 8;
export const museTapDirectionChangeDegreeMedium = 15;
export const museTapDirectionChangeDegreeHigh = 20;
export const museTapEffectDurationMs = 800;
export const visualSpeedMultiplierMax = 3;
export const visualSpeedMultiplierMaxLow = 1.6;
export const visualSpeedMultiplierMaxMedium = 2.2;
export const visualSpeedMultiplierMaxHigh = 3;
export const cloneSpawnMinDistance = 80;
export const cloneSpawnWallPadding = 48;
export const cloneSpawnMaxAttempts = 20;
export const offlineRewardCapSeconds = 8 * 60 * 60;
export const offlineRewardRate = 0.25;
export const offlineBounceFrequencyPerSecond = 0.2;

export function calculateRebootFragments(memory: number): number {
  if (memory < rebootMemoryRequirement) {
    return 0;
  }

  return Math.max(1, Math.floor(Math.sqrt(memory / rebootMemoryRequirement)));
}
