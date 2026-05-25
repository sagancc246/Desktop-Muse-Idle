export type UpgradeKey = 'bounceBoost' | 'speedTune' | 'cornerSensor';

export interface UpgradeDefinition {
  key: UpgradeKey;
  name: string;
  summary: string;
  baseCost: number;
  costGrowth: number;
}

export const BALANCE = {
  startingMemory: 0,
  wallReward: 5,
  wallRewardPerBounceBoost: 3,
  cornerReward: 36,
  cornerRewardPerSensor: 18,
  baseSpeed: 225,
  speedGainPerTune: 0.13,
  iconRadius: 54,
  cornerDetectionDistance: 82,
  incomeWindowMs: 10_000,
  autoSaveMs: 10_000,
} as const;

export const UPGRADES: Record<UpgradeKey, UpgradeDefinition> = {
  bounceBoost: {
    key: 'bounceBoost',
    name: 'Bounce Boost',
    summary: '+3 Memory per wall hit',
    baseCost: 25,
    costGrowth: 1.72,
  },
  speedTune: {
    key: 'speedTune',
    name: 'Speed Tune',
    summary: '+13% travel speed',
    baseCost: 42,
    costGrowth: 1.8,
  },
  cornerSensor: {
    key: 'cornerSensor',
    name: 'Corner Sensor',
    summary: '+18 Memory per Corner Hit',
    baseCost: 70,
    costGrowth: 1.9,
  },
};

export function getUpgradeCost(key: UpgradeKey, level: number): number {
  const upgrade = UPGRADES[key];
  return Math.round(upgrade.baseCost * upgrade.costGrowth ** level);
}

export function getWallReward(bounceBoostLevel: number): number {
  return BALANCE.wallReward + bounceBoostLevel * BALANCE.wallRewardPerBounceBoost;
}

export function getCornerReward(bounceBoostLevel: number, sensorLevel: number): number {
  return (
    BALANCE.cornerReward +
    bounceBoostLevel * BALANCE.wallRewardPerBounceBoost +
    sensorLevel * BALANCE.cornerRewardPerSensor
  );
}

export function getSpeed(speedTuneLevel: number): number {
  return BALANCE.baseSpeed * (1 + speedTuneLevel * BALANCE.speedGainPerTune);
}

export function formatMemory(value: number): string {
  if (value < 1_000) {
    return value.toFixed(value % 1 === 0 ? 0 : 1);
  }

  const units = ['K', 'M', 'B'];
  let scaled = value;
  let unitIndex = -1;
  while (scaled >= 1_000 && unitIndex < units.length - 1) {
    scaled /= 1_000;
    unitIndex += 1;
  }

  return `${scaled.toFixed(scaled >= 100 ? 0 : 1)}${units[unitIndex]}`;
}
