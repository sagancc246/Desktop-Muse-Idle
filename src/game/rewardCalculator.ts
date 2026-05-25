import { baseCornerReward, baseMemoryPerBounce } from '../data/balance';
import type { UpgradeCollection } from '../types/game';

export function calculateBounceReward(upgrades: UpgradeCollection): number {
  const upgrade = upgrades.bounce_boost;
  return Math.floor(baseMemoryPerBounce * Math.pow(upgrade.effectValue, upgrade.level));
}

export function calculateCornerReward(upgrades: UpgradeCollection): number {
  const upgrade = upgrades.corner_sensor;
  return Math.floor(baseCornerReward * Math.pow(upgrade.effectValue, upgrade.level));
}

export function calculateSpeedMultiplier(upgrades: UpgradeCollection): number {
  const upgrade = upgrades.speed_tune;
  return Math.pow(upgrade.effectValue, upgrade.level);
}
