import {
  baseCornerReward,
  baseMemoryPerBounce,
  museTapCornerRewardMultiplier,
  museTapCornerRewardMultiplierHigh,
  museTapSpeedMultiplierHigh,
  museTapSpeedMultiplierLow,
  museTapSpeedMultiplierMedium,
  offlineBounceFrequencyPerSecond,
  visualSpeedMultiplierMaxHigh,
  visualSpeedMultiplierMaxLow,
  visualSpeedMultiplierMaxMedium,
} from '../data/balance';
import { getMuseById } from '../data/muses';
import {
  calculateSkillTreeAdditiveBonus,
  calculateSkillTreeMultiplier,
} from '../data/skillTree';
import type { UpgradeCollection } from '../types/game';
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

export function getMuseTapSpeedMultiplier(motionIntensity: MotionIntensity): number {
  if (motionIntensity === 'low') {
    return museTapSpeedMultiplierLow;
  }

  if (motionIntensity === 'high') {
    return museTapSpeedMultiplierHigh;
  }

  return museTapSpeedMultiplierMedium;
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
): number {
  const upgrade = upgrades.bounce_boost;
  return Math.floor(
    baseMemoryPerBounce *
      Math.pow(upgrade.effectValue, upgrade.level) *
      calculateSkillTreeMultiplier(unlockedSkillNodes, 'bounce_reward') *
      calculateInternalYieldMultiplier(upgrades, unlockedSkillNodes, motionIntensity),
  );
}

export function calculateCornerReward(
  upgrades: UpgradeCollection,
  unlockedSkillNodes: Record<string, number>,
  motionIntensity: MotionIntensity,
): number {
  const upgrade = upgrades.corner_sensor;
  return Math.floor(
    baseCornerReward *
      Math.pow(upgrade.effectValue, upgrade.level) *
      calculateSkillTreeMultiplier(unlockedSkillNodes, 'corner_reward') *
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
  isTapBoostActive: boolean,
  motionIntensity: MotionIntensity,
): number {
  const tapMultiplier = isTapBoostActive ? getMuseTapSpeedMultiplier(motionIntensity) : 1;

  return Math.min(
    getVisualSpeedCap(motionIntensity),
    calculateSpeedMultiplier(upgrades) * temporarySkillMultiplier * tapMultiplier,
  );
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

export function calculateOfflineRewardMultiplier(
  unlockedSkillNodes: Record<string, number>,
): number {
  return calculateSkillTreeMultiplier(unlockedSkillNodes, 'offline_reward');
}

export function calculateOfflineMemoryPerSecond(
  upgrades: UpgradeCollection,
  unlockedSkillNodes: Record<string, number>,
  activeMuseIds: string[],
  motionIntensity: MotionIntensity,
): number {
  const bounceReward = calculateBounceReward(upgrades, unlockedSkillNodes, motionIntensity);
  const speedMultiplier = Math.min(
    getVisualSpeedCap(motionIntensity),
    calculateSpeedMultiplier(upgrades),
  );
  const perSecond = activeMuseIds.reduce((total, museId) => {
    const muse = getMuseById(museId);
    return muse
      ? total + bounceReward * muse.memoryMultiplier * offlineBounceFrequencyPerSecond * speedMultiplier
      : total;
  }, 0);

  return Math.round(perSecond * 100) / 100;
}
