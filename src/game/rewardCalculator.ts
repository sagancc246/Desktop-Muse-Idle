import {
  backgroundTapWallRewardRate,
  baseCornerReward,
  baseMemoryPerBounce,
  museTapCornerRewardMultiplier,
  museTapCornerRewardMultiplierHigh,
  nearCornerDistance,
  nearCornerRewardRate,
  museTapSpeedMultiplierHigh,
  museTapSpeedMultiplierLow,
  museTapSpeedMultiplierMedium,
  museTapSpeedMultiplierCap,
  offlineBounceFrequencyPerSecond,
  vegaBumperCloneRewardMultiplier,
  vegaBumperRewardMultiplier,
  visualSpeedMultiplierMaxHigh,
  visualSpeedMultiplierMaxLow,
  visualSpeedMultiplierMaxMedium,
} from '../data/balance';
import { getMuseById } from '../data/muses';
import {
  calculateSkillTreeAdditiveBonus,
  calculateSkillTreeMultiplier,
} from '../data/skillTree';
import { resolveCharacterSkillEffects } from './characterSkillEffects';
import type { CharacterSkillLevels, UpgradeCollection } from '../types/game';
import type { MotionIntensity } from '../types/game';

function calculateSkillTreeInternalYieldMultiplier(
  unlockedSkillNodes: Record<string, number>,
): number {
  return calculateSkillTreeMultiplier(unlockedSkillNodes, 'internal_speed_bonus');
}

export function getVisualSpeedCap(motionIntensity: MotionIntensity): number {
  if (motionIntensity === 'low') {
    return visualSpeedMultiplierMaxLow;
  }

  if (motionIntensity === 'high') {
    return visualSpeedMultiplierMaxHigh;
  }

  return visualSpeedMultiplierMaxMedium;
}

export function getMuseTapSpeedMultiplier(
  motionIntensity: MotionIntensity,
  tapBoostStack = 1,
): number {
  const stack = Math.max(0, Math.floor(tapBoostStack));
  if (stack <= 0) {
    return 1;
  }

  if (motionIntensity === 'low') {
    return Math.min(museTapSpeedMultiplierCap, Math.pow(museTapSpeedMultiplierLow, stack));
  }

  if (motionIntensity === 'high') {
    return Math.min(museTapSpeedMultiplierCap, Math.pow(museTapSpeedMultiplierHigh, stack));
  }

  return Math.min(museTapSpeedMultiplierCap, Math.pow(museTapSpeedMultiplierMedium, stack));
}

export function getSpeedTuneInternalYieldMultiplier(
  upgrades: UpgradeCollection,
  motionIntensity: MotionIntensity,
): number {
  const rawSpeedMultiplier = calculateSpeedMultiplier(upgrades);
  const visualSpeedMultiplier = Math.min(rawSpeedMultiplier, getVisualSpeedCap(motionIntensity));

  return rawSpeedMultiplier / visualSpeedMultiplier;
}

export function calculateInternalYieldMultiplier(
  upgrades: UpgradeCollection,
  unlockedSkillNodes: Record<string, number>,
  motionIntensity: MotionIntensity,
): number {
  return (
    calculateSkillTreeInternalYieldMultiplier(unlockedSkillNodes) *
    getSpeedTuneInternalYieldMultiplier(upgrades, motionIntensity)
  );
}

export function calculateBounceReward(
  upgrades: UpgradeCollection,
  unlockedSkillNodes: Record<string, number>,
  motionIntensity: MotionIntensity,
  characterSkillLevels?: CharacterSkillLevels,
): number {
  const upgrade = upgrades.bounce_boost;
  return Math.floor(
    baseMemoryPerBounce *
      Math.pow(upgrade.effectValue, upgrade.level) *
      calculateSkillTreeMultiplier(unlockedSkillNodes, 'bounce_reward') *
      resolveCharacterSkillEffects(characterSkillLevels).bounceRewardMultiplier *
      calculateInternalYieldMultiplier(upgrades, unlockedSkillNodes, motionIntensity),
  );
}

export function calculateCornerReward(
  upgrades: UpgradeCollection,
  unlockedSkillNodes: Record<string, number>,
  motionIntensity: MotionIntensity,
  characterSkillLevels?: CharacterSkillLevels,
): number {
  const upgrade = upgrades.corner_sensor;
  return Math.floor(
    baseCornerReward *
      Math.pow(upgrade.effectValue, upgrade.level) *
      calculateSkillTreeMultiplier(unlockedSkillNodes, 'corner_reward') *
      resolveCharacterSkillEffects(characterSkillLevels).cornerRewardMultiplier *
      calculateInternalYieldMultiplier(upgrades, unlockedSkillNodes, motionIntensity),
  );
}

export function calculateSpeedMultiplier(upgrades: UpgradeCollection): number {
  const upgrade = upgrades.speed_tune;
  return Math.pow(upgrade.effectValue, upgrade.level);
}

export function calculateVisualSpeedMultiplier(
  upgrades: UpgradeCollection,
  temporarySkillMultiplier: number,
  tapBoostStack: number,
  motionIntensity: MotionIntensity,
  characterSkillLevels?: CharacterSkillLevels,
): number {
  const tapMultiplier = getMuseTapSpeedMultiplier(motionIntensity, tapBoostStack);
  const characterMultiplier = resolveCharacterSkillEffects(
    characterSkillLevels,
  ).visualSpeedMultiplier;
  const baseCap = getVisualSpeedCap(motionIntensity);
  const cappedBaseMultiplier = Math.min(
    baseCap,
    calculateSpeedMultiplier(upgrades) * temporarySkillMultiplier * characterMultiplier,
  );

  return Math.min(
    baseCap * museTapSpeedMultiplierCap,
    cappedBaseMultiplier * tapMultiplier,
  );
}

export function calculateBackgroundTapReward(
  upgrades: UpgradeCollection,
  unlockedSkillNodes: Record<string, number>,
  motionIntensity: MotionIntensity,
  characterSkillLevels?: CharacterSkillLevels,
): number {
  const wallReward = calculateBounceReward(
    upgrades,
    unlockedSkillNodes,
    motionIntensity,
    characterSkillLevels,
  );

  return Math.max(1, Math.floor(wallReward * backgroundTapWallRewardRate));
}

export function calculateMuseTapCornerRewardMultiplier(
  isTapBoostActive: boolean,
  motionIntensity: MotionIntensity,
): number {
  if (!isTapBoostActive) {
    return 1;
  }

  return motionIntensity === 'high'
    ? museTapCornerRewardMultiplierHigh
    : museTapCornerRewardMultiplier;
}

export function calculateCornerThresholdBonus(unlockedSkillNodes: Record<string, number>): number {
  return calculateSkillTreeAdditiveBonus(unlockedSkillNodes, 'corner_threshold');
}

export function calculateNearCornerDistance(
  unlockedSkillNodes: Record<string, number>,
  characterSkillLevels?: CharacterSkillLevels,
): number {
  return (
    nearCornerDistance +
    calculateSkillTreeAdditiveBonus(unlockedSkillNodes, 'corner_threshold') +
    resolveCharacterSkillEffects(characterSkillLevels).nearCornerDistanceBonus
  );
}

export function calculateNearCornerReward(
  bounceReward: number,
  unlockedSkillNodes: Record<string, number>,
): number {
  const multiplier = calculateSkillTreeMultiplier(unlockedSkillNodes, 'near_corner_reward');

  if (multiplier <= 1) {
    return 0;
  }

  return Math.max(1, Math.floor(bounceReward * nearCornerRewardRate * multiplier));
}

export function calculateVegaBumperReward(bounceReward: number, isClone: boolean): number {
  return Math.max(
    1,
    Math.floor(
      bounceReward *
        vegaBumperRewardMultiplier *
        (isClone ? vegaBumperCloneRewardMultiplier : 1),
    ),
  );
}

export function calculateOfflineRewardMultiplier(
  unlockedSkillNodes: Record<string, number>,
  characterSkillLevels?: CharacterSkillLevels,
): number {
  return (
    calculateSkillTreeMultiplier(unlockedSkillNodes, 'offline_reward') *
    resolveCharacterSkillEffects(characterSkillLevels).offlineRewardMultiplier
  );
}

export function calculateOfflineMemoryPerSecond(
  upgrades: UpgradeCollection,
  unlockedSkillNodes: Record<string, number>,
  activeMuseIds: string[],
  motionIntensity: MotionIntensity,
  characterSkillLevels?: CharacterSkillLevels,
): number {
  const bounceReward = calculateBounceReward(
    upgrades,
    unlockedSkillNodes,
    motionIntensity,
    characterSkillLevels,
  );
  const speedMultiplier = Math.min(
    getVisualSpeedCap(motionIntensity),
    calculateSpeedMultiplier(upgrades) *
      resolveCharacterSkillEffects(characterSkillLevels).visualSpeedMultiplier,
  );
  const perSecond = activeMuseIds.reduce((total, museId) => {
    const muse = getMuseById(museId);
    return muse
      ? total + bounceReward * muse.memoryMultiplier * offlineBounceFrequencyPerSecond * speedMultiplier
      : total;
  }, 0);

  return Math.round(perSecond * 100) / 100;
}
