import {
  baseCornerReward,
  baseMemoryPerBounce,
  museTapCornerRewardMultiplier,
  museTapSpeedMultiplierMedium,
  visualSpeedMultiplierMax,
} from '../data/balance';
import {
  calculateSkillTreeAdditiveBonus,
  calculateSkillTreeMultiplier,
} from '../data/skillTree';
import type { UpgradeCollection } from '../types/game';

function calculateInternalYieldMultiplier(unlockedSkillNodes: Record<string, number>): number {
  return calculateSkillTreeMultiplier(unlockedSkillNodes, 'internal_speed_bonus');
}

export function calculateBounceReward(
  upgrades: UpgradeCollection,
  unlockedSkillNodes: Record<string, number>,
): number {
  const upgrade = upgrades.bounce_boost;
  return Math.floor(
    baseMemoryPerBounce *
      Math.pow(upgrade.effectValue, upgrade.level) *
      calculateSkillTreeMultiplier(unlockedSkillNodes, 'bounce_reward') *
      calculateInternalYieldMultiplier(unlockedSkillNodes),
  );
}

export function calculateCornerReward(
  upgrades: UpgradeCollection,
  unlockedSkillNodes: Record<string, number>,
): number {
  const upgrade = upgrades.corner_sensor;
  return Math.floor(
    baseCornerReward *
      Math.pow(upgrade.effectValue, upgrade.level) *
      calculateSkillTreeMultiplier(unlockedSkillNodes, 'corner_reward') *
      calculateInternalYieldMultiplier(unlockedSkillNodes),
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
): number {
  const tapMultiplier = isTapBoostActive ? museTapSpeedMultiplierMedium : 1;

  return Math.min(
    visualSpeedMultiplierMax,
    calculateSpeedMultiplier(upgrades) * temporarySkillMultiplier * tapMultiplier,
  );
}

export function calculateMuseTapCornerRewardMultiplier(isTapBoostActive: boolean): number {
  return isTapBoostActive ? museTapCornerRewardMultiplier : 1;
}

export function calculateCornerThresholdBonus(unlockedSkillNodes: Record<string, number>): number {
  return calculateSkillTreeAdditiveBonus(unlockedSkillNodes, 'corner_threshold');
}

export function calculateOfflineRewardMultiplier(
  unlockedSkillNodes: Record<string, number>,
): number {
  return calculateSkillTreeMultiplier(unlockedSkillNodes, 'offline_reward');
}
