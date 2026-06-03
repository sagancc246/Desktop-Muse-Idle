export const baseMemoryPerBounce = 1;
export const cornerThreshold = 32;
export const nearCornerDistance = 48;
export const nearCornerDistancePerSensorLevel = 8;
export const nearCornerRewardRate = 0.15;
export const cornerHitGracePx = 4;
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
export const cloneWallRewardMultiplier = 0.5;
export const cloneCornerRewardMultiplier = 0.5;
export const cloneJackpotChanceMultiplier = 0.5;
export const cloneFeverGaugeMultiplier = 0.5;
export const vegaBumperDurationMs = 8_000;
export const vegaBumperCooldownMs = 25_000;
export const vegaBumperRewardMultiplier = 0.3;
export const vegaBumperCloneRewardMultiplier = 0.5;
export const vegaBumperVelocityBoost = 1.08;
export const vegaBumperPairCooldownMs = 300;
export const vegaBumperMinSeparation = 4;
export const vegaBumperMaxVelocity = 14;
export const vegaBumperRadiusMultiplier = 1.25;
export const offlineRewardCapSeconds = 8 * 60 * 60;
export const offlineRewardRate = 0.25;
export const offlineBounceFrequencyPerSecond = 0.2;
export const screenFlashAlphaCorner = 0.16;
export const screenFlashAlphaLucky = 0.24;
export const screenFlashAlphaJackpot = 0.32;
export const screenFlashFadeMs = 280;
export const cornerGlowRadius = 140;
export const cornerGlowDurationMs = 360;
export const ringStartRadius = 30;
export const ringEndRadius = 90;
export const ringDurationMs = 320;
export const cornerTextDurationMs = 900;
export const rewardTextDurationMs = 800;
export const wallpaperLowEffectParticleMultiplier = 0.45;
export const wallpaperLowEffectFlashAlphaMultiplier = 0.5;
export const wallpaperLowEffectLayerAlphaMultiplier = 0.65;
export const wallpaperModeDefaultFps = 30;

export function calculateRebootFragments(memory: number): number {
  if (memory < rebootMemoryRequirement) {
    return 0;
  }

  return Math.max(1, Math.floor(Math.sqrt(memory / rebootMemoryRequirement)));
}
