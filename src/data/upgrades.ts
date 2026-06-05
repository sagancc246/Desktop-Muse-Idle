import type { UpgradeCollection, UpgradeDefinition, UpgradeId } from '../types/game';
import {
  bounceBoostBaseCost,
  bounceBoostCostRate,
  bounceBoostRewardMultiplier,
  cornerSensorBaseCost,
  cornerSensorCostRate,
  cornerSensorRewardMultiplier,
  speedTuneBaseCost,
  speedTuneCostRate,
  speedTuneMultiplier,
} from './balance';

export const upgradeIds: UpgradeId[] = ['bounce_boost', 'speed_tune', 'corner_sensor'];

export const upgradeDefinitions: Record<UpgradeId, UpgradeDefinition> = {
  bounce_boost: {
    id: 'bounce_boost',
    name: 'Bounce Boost',
    description: 'Wall hit Memory x2.00',
    baseCost: bounceBoostBaseCost,
    costRate: bounceBoostCostRate,
    effectType: 'bounce_reward',
    effectValue: bounceBoostRewardMultiplier,
  },
  speed_tune: {
    id: 'speed_tune',
    name: 'Speed Tune',
    description: 'Muse speed x1.20',
    baseCost: speedTuneBaseCost,
    costRate: speedTuneCostRate,
    effectType: 'speed',
    effectValue: speedTuneMultiplier,
  },
  corner_sensor: {
    id: 'corner_sensor',
    name: 'Corner Sensor',
    description: 'Improves Near Corner guidance and Corner support rewards.',
    baseCost: cornerSensorBaseCost,
    costRate: cornerSensorCostRate,
    effectType: 'corner_reward',
    effectValue: cornerSensorRewardMultiplier,
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
