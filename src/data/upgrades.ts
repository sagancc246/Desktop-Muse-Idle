import type { UpgradeCollection, UpgradeDefinition, UpgradeId } from '../types/game';

export const upgradeIds: UpgradeId[] = ['bounce_boost', 'speed_tune', 'corner_sensor'];

export const upgradeDefinitions: Record<UpgradeId, UpgradeDefinition> = {
  bounce_boost: {
    id: 'bounce_boost',
    name: 'Bounce Boost',
    description: 'Wall hit Memory x2.00',
    baseCost: 15,
    costRate: 1.8,
    effectType: 'bounce_reward',
    effectValue: 2,
  },
  speed_tune: {
    id: 'speed_tune',
    name: 'Speed Tune',
    description: 'Muse speed x1.20',
    baseCost: 30,
    costRate: 1.8,
    effectType: 'speed',
    effectValue: 1.2,
  },
  corner_sensor: {
    id: 'corner_sensor',
    name: 'Corner Sensor',
    description: 'Corner reward x1.50',
    baseCost: 50,
    costRate: 1.8,
    effectType: 'corner_reward',
    effectValue: 1.5,
  },
};

export function createInitialUpgrades(): UpgradeCollection {
  return {
    bounce_boost: { ...upgradeDefinitions.bounce_boost, level: 0 },
    speed_tune: { ...upgradeDefinitions.speed_tune, level: 0 },
    corner_sensor: { ...upgradeDefinitions.corner_sensor, level: 0 },
  };
}

export function calculateUpgradeCost(upgrade: UpgradeDefinition, level: number): number {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costRate, level));
}
