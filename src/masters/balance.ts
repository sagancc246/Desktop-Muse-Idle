import { balanceConfig as generatedBalanceConfig } from '../generated/masters/balance.generated';

interface BalanceSection {
  readonly [key: string]: unknown;
}

interface NormalizedBalanceConfig {
  readonly bounceBoost: {
    readonly tapBoostAdd: number;
    readonly maxTemporaryBoost: number;
    readonly decayDurationMs: number;
    readonly decayStepMs: number;
    readonly visualPulseScale: number;
  };
  readonly speedTune: {
    readonly baseSpeed: number;
    readonly minSpeed: number;
    readonly maxSpeed: number;
    readonly tapBoostMaxSpeed: number;
    readonly upgradeMultiplier: number;
    readonly visualSpeedMultiplierMaxLow: number;
    readonly visualSpeedMultiplierMaxMedium: number;
    readonly visualSpeedMultiplierMaxHigh: number;
  };
  readonly cornerSensor: {
    readonly cornerZonePx: number;
    readonly cornerHitCooldownMs: number;
    readonly showCornerZonesDefault: boolean;
    readonly strictCornerEnabled: boolean;
    readonly assistedCornerEnabled: boolean;
  };
  readonly reboot: {
    readonly baseRequirement: number;
    readonly requirementGrowth: number;
    readonly basePermanentMultiplier: number;
    readonly multiplierPerReboot: number;
    readonly memoryCarryOverRate: number;
  };
}

const fallbackBalanceConfig: NormalizedBalanceConfig = {
  bounceBoost: {
    decayDurationMs: 1_800,
    decayStepMs: 260,
    maxTemporaryBoost: 1,
    tapBoostAdd: 0.12,
    visualPulseScale: 1.08,
  },
  cornerSensor: {
    assistedCornerEnabled: true,
    cornerHitCooldownMs: 600,
    cornerZonePx: 32,
    showCornerZonesDefault: false,
    strictCornerEnabled: true,
  },
  reboot: {
    basePermanentMultiplier: 0.05,
    baseRequirement: 100_000,
    memoryCarryOverRate: 0,
    multiplierPerReboot: 0.03,
    requirementGrowth: 1.8,
  },
  speedTune: {
    baseSpeed: 180,
    minSpeed: 120,
    maxSpeed: 720,
    tapBoostMaxSpeed: 980,
    upgradeMultiplier: 1.2,
    visualSpeedMultiplierMaxHigh: 3,
    visualSpeedMultiplierMaxLow: 1.6,
    visualSpeedMultiplierMaxMedium: 2.2,
  },
};

function getSection(source: unknown, key: string, fallback: BalanceSection): BalanceSection {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return fallback;
  }

  const value = (source as BalanceSection)[key];
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as BalanceSection)
    : fallback;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function positiveNumber(value: unknown, fallback: number): number {
  const parsed = finiteNumber(value, fallback);
  return parsed > 0 ? parsed : fallback;
}

function nonNegativeNumber(value: unknown, fallback: number): number {
  const parsed = finiteNumber(value, fallback);
  return parsed >= 0 ? parsed : fallback;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function clampMinMax(min: number, value: number, max: number) {
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  return Math.min(safeMax, Math.max(safeMin, value));
}

export function normalizeBalanceConfig(source: unknown): NormalizedBalanceConfig {
  const bounceBoostSource = getSection(source, 'bounceBoost', fallbackBalanceConfig.bounceBoost);
  const museTapSource = getSection(source, 'museTap', {});
  const speedTuneSource = getSection(source, 'speedTune', fallbackBalanceConfig.speedTune);
  const cornerSensorSource = getSection(source, 'cornerSensor', fallbackBalanceConfig.cornerSensor);
  const rebootSource = getSection(source, 'reboot', fallbackBalanceConfig.reboot);

  const tapBoostAdd = nonNegativeNumber(
    bounceBoostSource.tapBoostAdd,
    Math.max(0, positiveNumber(museTapSource.speedPerStack, 1.12) - 1),
  );
  const maxTemporaryBoost = nonNegativeNumber(
    bounceBoostSource.maxTemporaryBoost,
    Math.max(0, positiveNumber(museTapSource.speedMultiplierCap, 2) - 1),
  );
  const minSpeed = positiveNumber(speedTuneSource.minSpeed, fallbackBalanceConfig.speedTune.minSpeed);
  const maxSpeed = Math.max(
    minSpeed,
    positiveNumber(speedTuneSource.maxSpeed, fallbackBalanceConfig.speedTune.maxSpeed),
  );
  const baseSpeed = clampMinMax(
    minSpeed,
    positiveNumber(speedTuneSource.baseSpeed, fallbackBalanceConfig.speedTune.baseSpeed),
    maxSpeed,
  );
  const tapBoostMaxSpeed = Math.max(
    maxSpeed,
    positiveNumber(speedTuneSource.tapBoostMaxSpeed, fallbackBalanceConfig.speedTune.tapBoostMaxSpeed),
  );

  return {
    bounceBoost: {
      decayDurationMs: positiveNumber(
        bounceBoostSource.decayDurationMs,
        positiveNumber(museTapSource.durationMs, fallbackBalanceConfig.bounceBoost.decayDurationMs),
      ),
      decayStepMs: positiveNumber(bounceBoostSource.decayStepMs, fallbackBalanceConfig.bounceBoost.decayStepMs),
      maxTemporaryBoost,
      tapBoostAdd,
      visualPulseScale: positiveNumber(
        bounceBoostSource.visualPulseScale,
        fallbackBalanceConfig.bounceBoost.visualPulseScale,
      ),
    },
    cornerSensor: {
      assistedCornerEnabled: booleanValue(
        cornerSensorSource.assistedCornerEnabled,
        fallbackBalanceConfig.cornerSensor.assistedCornerEnabled,
      ),
      cornerHitCooldownMs: nonNegativeNumber(
        cornerSensorSource.cornerHitCooldownMs,
        fallbackBalanceConfig.cornerSensor.cornerHitCooldownMs,
      ),
      cornerZonePx: nonNegativeNumber(
        cornerSensorSource.cornerZonePx,
        fallbackBalanceConfig.cornerSensor.cornerZonePx,
      ),
      showCornerZonesDefault: booleanValue(
        cornerSensorSource.showCornerZonesDefault,
        fallbackBalanceConfig.cornerSensor.showCornerZonesDefault,
      ),
      strictCornerEnabled: booleanValue(
        cornerSensorSource.strictCornerEnabled,
        fallbackBalanceConfig.cornerSensor.strictCornerEnabled,
      ),
    },
    reboot: {
      basePermanentMultiplier: finiteNumber(
        rebootSource.basePermanentMultiplier,
        fallbackBalanceConfig.reboot.basePermanentMultiplier,
      ),
      baseRequirement: positiveNumber(
        rebootSource.baseRequirement,
        fallbackBalanceConfig.reboot.baseRequirement,
      ),
      memoryCarryOverRate: clampMinMax(
        0,
        nonNegativeNumber(rebootSource.memoryCarryOverRate, fallbackBalanceConfig.reboot.memoryCarryOverRate),
        1,
      ),
      multiplierPerReboot: finiteNumber(
        rebootSource.multiplierPerReboot,
        fallbackBalanceConfig.reboot.multiplierPerReboot,
      ),
      requirementGrowth: positiveNumber(
        rebootSource.requirementGrowth,
        fallbackBalanceConfig.reboot.requirementGrowth,
      ),
    },
    speedTune: {
      baseSpeed,
      minSpeed,
      maxSpeed,
      tapBoostMaxSpeed,
      upgradeMultiplier: positiveNumber(
        speedTuneSource.upgradeMultiplier,
        fallbackBalanceConfig.speedTune.upgradeMultiplier,
      ),
      visualSpeedMultiplierMaxHigh: positiveNumber(
        speedTuneSource.visualSpeedMultiplierMaxHigh,
        fallbackBalanceConfig.speedTune.visualSpeedMultiplierMaxHigh,
      ),
      visualSpeedMultiplierMaxLow: positiveNumber(
        speedTuneSource.visualSpeedMultiplierMaxLow,
        fallbackBalanceConfig.speedTune.visualSpeedMultiplierMaxLow,
      ),
      visualSpeedMultiplierMaxMedium: positiveNumber(
        speedTuneSource.visualSpeedMultiplierMaxMedium,
        fallbackBalanceConfig.speedTune.visualSpeedMultiplierMaxMedium,
      ),
    },
  };
}

export const balanceConfig = normalizeBalanceConfig(generatedBalanceConfig);

export const balanceConfigFallbacks = fallbackBalanceConfig;
