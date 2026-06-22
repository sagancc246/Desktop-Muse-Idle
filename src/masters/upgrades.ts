import { upgrades as generatedUpgrades } from '../generated/masters/upgrades.generated';
import type { UpgradeDefinition, UpgradeEffectType, UpgradeId } from '../types/game';
import type { UpgradeMaster, UpgradeMasterEffectType } from './types';

export type RuntimeUpgradeMaster = UpgradeDefinition & {
  category: UpgradeMaster['category'];
  effectTarget: string;
  masterEffectType: UpgradeMasterEffectType;
  effectBaseValue: number;
  effectValuePerLevel: number;
  effectMultiplierPerLevel: number;
};

const fallbackUpgradeMasters: readonly RuntimeUpgradeMaster[] = [
  {
    baseCost: 25,
    category: 'bounce',
    costRate: 1.45,
    description: 'Wall hit reward and tap boost growth',
    effectBaseValue: 1,
    effectMultiplierPerLevel: 2,
    effectTarget: 'bounceReward.multiplier',
    effectType: 'bounce_reward',
    effectValue: 2,
    effectValuePerLevel: 0.02,
    enabled: true,
    id: 'bounce_boost',
    masterEffectType: 'multiply',
    maxLevel: 10,
    name: 'Bounce Boost',
    sortOrder: 10,
    unlockRebootCount: 0,
    unlockStageNumber: 1,
  },
  {
    baseCost: 40,
    category: 'speed',
    costRate: 1.5,
    description: 'Muse speed multiplier',
    effectBaseValue: 1,
    effectMultiplierPerLevel: 1.2,
    effectTarget: 'speedTune.multiplier',
    effectType: 'speed',
    effectValue: 1.2,
    effectValuePerLevel: 0,
    enabled: true,
    id: 'speed_tune',
    masterEffectType: 'multiply',
    maxLevel: 20,
    name: 'Speed Tune',
    sortOrder: 20,
    unlockRebootCount: 0,
    unlockStageNumber: 1,
  },
  {
    baseCost: 60,
    category: 'corner',
    costRate: 1.55,
    description: 'Corner reward and assisted Corner Hit range',
    effectBaseValue: 1,
    effectMultiplierPerLevel: 1.5,
    effectTarget: 'cornerReward.multiplier',
    effectType: 'corner_reward',
    effectValue: 1.5,
    effectValuePerLevel: 4,
    enabled: true,
    id: 'corner_sensor',
    masterEffectType: 'multiply',
    maxLevel: 10,
    name: 'Corner Sensor',
    sortOrder: 30,
    unlockRebootCount: 0,
    unlockStageNumber: 2,
  },
  {
    baseCost: 120,
    category: 'reboot',
    costRate: 1.8,
    description: 'Improve permanent reboot multiplier',
    effectBaseValue: 0.03,
    effectMultiplierPerLevel: 0,
    effectTarget: 'reboot.multiplierPerReboot',
    effectType: 'reboot',
    effectValue: 0,
    effectValuePerLevel: 0.005,
    enabled: true,
    id: 'reboot_core',
    masterEffectType: 'add',
    maxLevel: 10,
    name: 'REBOOT Core',
    sortOrder: 40,
    unlockRebootCount: 1,
    unlockStageNumber: 3,
  },
];

const legacyEffectTypesByTarget: Record<string, UpgradeEffectType> = {
  'bounceBoost.tapBoostAdd': 'bounce_reward',
  'bounceReward.multiplier': 'bounce_reward',
  'cornerReward.multiplier': 'corner_reward',
  'cornerSensor.cornerZonePx': 'corner_reward',
  'reboot.multiplierPerReboot': 'reboot',
  'speedTune.baseSpeed': 'speed',
  'speedTune.maxSpeed': 'speed',
  'speedTune.multiplier': 'speed',
};

function readPositiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function readNonNegativeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function readNonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function calculateLegacyEffectValue(master: UpgradeMaster, fallback: RuntimeUpgradeMaster): number {
  if (master.effectType === 'multiply') {
    return readPositiveNumber(master.effectMultiplierPerLevel, fallback.effectValue);
  }

  if (master.effectTarget === 'bounceBoost.tapBoostAdd') {
    return 1 + readNonNegativeNumber(master.effectValuePerLevel || master.effectBaseValue, 0.1);
  }

  if (master.effectTarget === 'cornerSensor.cornerZonePx') {
    return fallback.effectValue;
  }

  return fallback.effectValue;
}

function normalizeUpgradeMaster(
  source: UpgradeMaster,
  fallback: RuntimeUpgradeMaster,
): RuntimeUpgradeMaster {
  const effectTarget = readString(source.effectTarget, fallback.effectTarget);
  const effectType = legacyEffectTypesByTarget[effectTarget] ?? fallback.effectType;

  return {
    baseCost: readNonNegativeNumber(source.baseCost, fallback.baseCost),
    category: source.category || fallback.category,
    costRate: Math.max(1, readPositiveNumber(source.costGrowth, fallback.costRate)),
    description: readString(source.description, fallback.description),
    effectBaseValue:
      typeof source.effectBaseValue === 'number' && Number.isFinite(source.effectBaseValue)
        ? source.effectBaseValue
        : fallback.effectBaseValue,
    effectMultiplierPerLevel:
      typeof source.effectMultiplierPerLevel === 'number' &&
      Number.isFinite(source.effectMultiplierPerLevel)
        ? source.effectMultiplierPerLevel
        : fallback.effectMultiplierPerLevel,
    effectTarget,
    effectType,
    effectValue: calculateLegacyEffectValue(source, fallback),
    effectValuePerLevel:
      typeof source.effectValuePerLevel === 'number' && Number.isFinite(source.effectValuePerLevel)
        ? source.effectValuePerLevel
        : fallback.effectValuePerLevel,
    enabled: typeof source.enabled === 'boolean' ? source.enabled : fallback.enabled,
    id: readString(source.upgradeId, fallback.id) as UpgradeId,
    masterEffectType: source.effectType || fallback.masterEffectType,
    maxLevel: readNonNegativeInteger(source.maxLevel, fallback.maxLevel),
    name: readString(source.name, fallback.name),
    sortOrder:
      typeof source.sortOrder === 'number' && Number.isFinite(source.sortOrder)
        ? source.sortOrder
        : fallback.sortOrder,
    unlockRebootCount: readNonNegativeInteger(
      source.unlockRebootCount,
      fallback.unlockRebootCount,
    ),
    unlockStageNumber: readNonNegativeInteger(
      source.unlockStageNumber,
      fallback.unlockStageNumber,
    ),
  };
}

export function normalizeUpgradeMasters(
  sourceUpgrades: readonly UpgradeMaster[] = generatedUpgrades,
  fallbackUpgrades: readonly RuntimeUpgradeMaster[] = fallbackUpgradeMasters,
): RuntimeUpgradeMaster[] {
  const fallbackById = new Map(fallbackUpgrades.map((upgrade) => [upgrade.id, upgrade]));
  const normalized = sourceUpgrades.map((upgrade, index) => {
    const fallback =
      fallbackById.get(upgrade.upgradeId as UpgradeId) ??
      fallbackUpgrades[index] ??
      fallbackUpgrades[0];

    return normalizeUpgradeMaster(upgrade, fallback);
  });

  return normalized.length > 0 ? normalized : fallbackUpgrades.map((upgrade) => ({ ...upgrade }));
}

export const upgradeMasters = normalizeUpgradeMasters().sort(
  (left, right) => left.sortOrder - right.sortOrder,
);

export const upgradeIds = upgradeMasters.map((upgrade) => upgrade.id) as UpgradeId[];

export const upgradeDefinitions = Object.fromEntries(
  upgradeMasters.map((upgrade) => [upgrade.id, upgrade]),
) as Record<UpgradeId, RuntimeUpgradeMaster>;

export function getUpgradeMaster(upgradeId: string): RuntimeUpgradeMaster | undefined {
  return upgradeMasters.find((upgrade) => upgrade.id === upgradeId);
}

export function getVisibleUpgradeMasters(context: {
  rebootCount: number;
  stageNumber: number;
}): RuntimeUpgradeMaster[] {
  return upgradeMasters.filter(
    (upgrade) =>
      upgrade.enabled &&
      context.stageNumber >= upgrade.unlockStageNumber &&
      context.rebootCount >= upgrade.unlockRebootCount,
  );
}

export function calculateUpgradeCost(upgrade: Pick<RuntimeUpgradeMaster, 'baseCost' | 'costRate'>, level: number): number {
  const safeLevel = Math.max(0, Math.floor(Number.isFinite(level) ? level : 0));
  const rawCost = upgrade.baseCost * Math.pow(Math.max(1, upgrade.costRate), safeLevel);
  return Number.isFinite(rawCost) ? Math.max(0, Math.floor(rawCost)) : Number.MAX_SAFE_INTEGER;
}

export function clampUpgradeLevel(upgradeId: string, level: unknown): number {
  const master = getUpgradeMaster(upgradeId);
  const safeLevel = typeof level === 'number' && Number.isFinite(level) && level >= 0
    ? Math.floor(level)
    : 0;

  return master ? Math.min(safeLevel, master.maxLevel) : safeLevel;
}

export function calculateUpgradeMasterEffect(master: RuntimeUpgradeMaster, level: number): number {
  const safeLevel = Math.max(0, Math.floor(level));
  if (safeLevel <= 0 || master.masterEffectType === 'none') {
    return master.masterEffectType === 'multiply' ? 1 : 0;
  }

  if (master.masterEffectType === 'add') {
    return master.effectBaseValue + master.effectValuePerLevel * safeLevel;
  }

  if (master.masterEffectType === 'multiply') {
    return master.effectBaseValue * Math.pow(master.effectMultiplierPerLevel, safeLevel);
  }

  if (master.masterEffectType === 'set') {
    return master.effectBaseValue;
  }

  return 0;
}

export function calculateUpgradeTargetAdditiveBonus(
  upgrades: Partial<Record<UpgradeId, { level: number }>>,
  effectTarget: string,
): number {
  return upgradeMasters
    .filter((upgrade) => upgrade.enabled && upgrade.effectTarget === effectTarget)
    .reduce((total, upgrade) => {
      const level = clampUpgradeLevel(upgrade.id, upgrades[upgrade.id]?.level ?? 0);
      const value = calculateUpgradeMasterEffect(upgrade, level);
      return Number.isFinite(value) ? total + value : total;
    }, 0);
}

export function calculateUpgradePerLevelBonus(
  upgrades: Partial<Record<UpgradeId, { level: number }>>,
  upgradeId: UpgradeId,
): number {
  const master = getUpgradeMaster(upgradeId);
  if (!master || !master.enabled) {
    return 0;
  }

  const level = clampUpgradeLevel(upgradeId, upgrades[upgradeId]?.level ?? 0);
  return master.effectValuePerLevel * level;
}

export function calculateEffectiveCornerZonePx(
  baseCornerZonePx: number,
  upgrades: Partial<Record<UpgradeId, { level: number }>>,
): number {
  return Math.max(0, baseCornerZonePx + calculateUpgradePerLevelBonus(upgrades, 'corner_sensor'));
}

export function calculateEffectiveMuseTapSpeedPerStack(
  baseSpeedPerStack: number,
  upgrades: Partial<Record<UpgradeId, { level: number }>>,
): number {
  return Math.max(1, baseSpeedPerStack + calculateUpgradePerLevelBonus(upgrades, 'bounce_boost'));
}

export function calculateEffectiveRebootMultiplierPerReboot(
  baseMultiplierPerReboot: number,
  upgrades: Partial<Record<UpgradeId, { level: number }>>,
): number {
  return Math.max(
    0,
    baseMultiplierPerReboot +
      calculateUpgradeTargetAdditiveBonus(upgrades, 'reboot.multiplierPerReboot'),
  );
}
