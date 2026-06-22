import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type {
  BalanceConfig,
  BalanceCsvRow,
  BalancePrimitiveType,
  ClearConditionType,
  EnemyMaster,
  StageMaster,
  StageRewardMaster,
  StageRewardType,
  UpgradeCategory,
  UpgradeMaster,
  UpgradeMasterEffectType,
} from '../src/masters/types';

export interface CsvValidationResult {
  errors: string[];
}

export const csvRoot = resolve(process.cwd(), 'masters/csv');
export const generatedMastersRoot = resolve(process.cwd(), 'src/generated/masters');

const csvFiles = {
  balance: 'balance.csv',
  enemies: 'enemies.csv',
  stageRewards: 'stage_rewards.csv',
  stages: 'stages.csv',
  upgrades: 'upgrades.csv',
} as const;

export function getCsvPath(csvName: keyof typeof csvFiles): string {
  return resolve(csvRoot, csvFiles[csvName]);
}

export function ensureCsvInputsExist(): CsvValidationResult {
  const errors: string[] = [];
  for (const [csvName, fileName] of Object.entries(csvFiles)) {
    const path = resolve(csvRoot, fileName);
    if (!existsSync(path)) {
      errors.push(`[csv:${csvName}] missing required CSV file: ${path}`);
    }
  }
  return { errors };
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === ',' && !insideQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

export function readCsvRows(path: string): Record<string, string>[] {
  const source = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0 && !line.trimStart().startsWith('#'));
  const [headerLine, ...dataLines] = lines;
  if (!headerLine) {
    return [];
  }

  const headers = parseCsvLine(headerLine);
  return dataLines.map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function parseFiniteNumber(scope: string, value: string, errors: string[]): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    errors.push(`[${scope}] expected finite number, got "${value}"`);
    return 0;
  }
  return parsed;
}

function parseOptionalFiniteNumber(scope: string, value: string, errors: string[]): number | undefined {
  if (value.trim() === '') {
    return undefined;
  }
  return parseFiniteNumber(scope, value, errors);
}

function parsePrimitive(
  scope: string,
  value: string,
  type: BalancePrimitiveType,
  errors: string[],
): boolean | number | string {
  if (type === 'number') {
    return parseFiniteNumber(scope, value, errors);
  }
  if (type === 'boolean') {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    errors.push(`[${scope}] expected boolean true/false, got "${value}"`);
    return false;
  }
  return value;
}

function parseBoolean(scope: string, value: string, errors: string[]): boolean {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  errors.push(`[${scope}] expected boolean true/false, got "${value}"`);
  return false;
}

function assignDotPath(target: Record<string, unknown>, key: string, value: unknown): void {
  const segments = key.split('.').filter(Boolean);
  let cursor = target;

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (index === segments.length - 1) {
      cursor[segment] = value;
      return;
    }

    const next = cursor[segment];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }
}

export function loadBalanceCsv(): { balanceConfig: BalanceConfig; rows: BalanceCsvRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows = readCsvRows(getCsvPath('balance')).map((row, index): BalanceCsvRow => {
    const type = row.type as BalancePrimitiveType;
    if (!row.key) errors.push(`[balance:${index + 2}] key must not be empty`);
    if (!['number', 'boolean', 'string'].includes(type)) {
      errors.push(`[balance:${row.key || index + 2}] unsupported type "${row.type}"`);
    }
    return {
      description: row.description ?? '',
      key: row.key,
      type,
      value: row.value,
    };
  });

  const config: Record<string, unknown> = {};
  for (const row of rows) {
    if (!row.key || !['number', 'boolean', 'string'].includes(row.type)) {
      continue;
    }
    assignDotPath(
      config,
      row.key,
      parsePrimitive(`balance:${row.key}`, row.value, row.type, errors),
    );
  }

  return { balanceConfig: config as BalanceConfig, errors, rows };
}

export function loadStagesCsv(): { errors: string[]; stages: StageMaster[] } {
  const errors: string[] = [];
  const stages = readCsvRows(getCsvPath('stages')).map((row, index): StageMaster => {
    const scope = `stages:${row.stageId || index + 2}`;
    return {
      clearConditionType: row.clearConditionType as ClearConditionType,
      cornerRequirement: parseFiniteNumber(`${scope}:cornerRequirement`, row.cornerRequirement, errors),
      dropMultiplier: parseFiniteNumber(`${scope}:dropMultiplier`, row.dropMultiplier, errors),
      enemyHpMultiplier: parseFiniteNumber(`${scope}:enemyHpMultiplier`, row.enemyHpMultiplier, errors),
      maxActiveEnemies: parseFiniteNumber(`${scope}:maxActiveEnemies`, row.maxActiveEnemies, errors),
      stageId: row.stageId,
      stageNumber: parseFiniteNumber(`${scope}:stageNumber`, row.stageNumber, errors),
      targetDefeatCount: parseFiniteNumber(`${scope}:targetDefeatCount`, row.targetDefeatCount, errors),
    };
  });
  return { errors, stages };
}

export function loadEnemiesCsv(): { enemies: EnemyMaster[]; errors: string[] } {
  const errors: string[] = [];
  const enemies = readCsvRows(getCsvPath('enemies')).map((row, index): EnemyMaster => {
    const scope = `enemies:${row.enemyId || index + 2}`;
    return {
      color: row.color,
      dropAmount: parseFiniteNumber(`${scope}:dropAmount`, row.dropAmount, errors),
      enemyId: row.enemyId,
      hitCooldownMs: parseFiniteNumber(`${scope}:hitCooldownMs`, row.hitCooldownMs, errors),
      maxHp: parseFiniteNumber(`${scope}:maxHp`, row.maxHp, errors),
      name: row.name,
      radius: parseFiniteNumber(`${scope}:radius`, row.radius, errors),
      spawnWeight: parseFiniteNumber(`${scope}:spawnWeight`, row.spawnWeight, errors),
    };
  });
  return { enemies, errors };
}

export function loadStageRewardsCsv(): { errors: string[]; stageRewards: StageRewardMaster[] } {
  const errors: string[] = [];
  const stageRewards = readCsvRows(getCsvPath('stageRewards')).map((row, index): StageRewardMaster => {
    const scope = `stage_rewards:${row.stageId || index + 2}:${row.rewardId || 'missing_reward_id'}`;
    return {
      amount: parseOptionalFiniteNumber(`${scope}:amount`, row.amount, errors),
      capsuleAmount: parseOptionalFiniteNumber(`${scope}:capsuleAmount`, row.capsuleAmount, errors),
      clearRewardMemory: parseOptionalFiniteNumber(`${scope}:clearRewardMemory`, row.clearRewardMemory, errors) ?? 0,
      firstClearRewardMemory:
        parseOptionalFiniteNumber(`${scope}:firstClearRewardMemory`, row.firstClearRewardMemory, errors) ?? 0,
      rewardId: row.rewardId,
      rewardTargetId: row.rewardTargetId || undefined,
      rewardText: row.rewardText || undefined,
      rewardType: row.rewardType as StageRewardType,
      stageId: row.stageId,
      unlockBackgroundId: row.unlockBackgroundId || undefined,
      unlockCapsuleId: row.unlockCapsuleId || undefined,
      unlockFeatureId: row.unlockFeatureId || undefined,
      unlockMonsterId: row.unlockMonsterId || undefined,
      unlockMuseId: row.unlockMuseId || undefined,
      unlockSkinId: row.unlockSkinId || undefined,
    };
  });
  return { errors, stageRewards };
}

export function loadUpgradesCsv(): { errors: string[]; upgrades: UpgradeMaster[] } {
  const errors: string[] = [];
  const upgrades = readCsvRows(getCsvPath('upgrades')).map((row, index): UpgradeMaster => {
    const scope = `upgrades:${row.upgradeId || index + 2}`;
    return {
      baseCost: parseFiniteNumber(`${scope}:baseCost`, row.baseCost, errors),
      category: row.category as UpgradeCategory,
      costGrowth: parseFiniteNumber(`${scope}:costGrowth`, row.costGrowth, errors),
      description: row.description,
      effectBaseValue: parseFiniteNumber(`${scope}:effectBaseValue`, row.effectBaseValue, errors),
      effectMultiplierPerLevel: parseFiniteNumber(
        `${scope}:effectMultiplierPerLevel`,
        row.effectMultiplierPerLevel,
        errors,
      ),
      effectTarget: row.effectTarget,
      effectType: row.effectType as UpgradeMasterEffectType,
      effectValuePerLevel: parseFiniteNumber(
        `${scope}:effectValuePerLevel`,
        row.effectValuePerLevel,
        errors,
      ),
      enabled: parseBoolean(`${scope}:enabled`, row.enabled, errors),
      maxLevel: parseFiniteNumber(`${scope}:maxLevel`, row.maxLevel, errors),
      name: row.name,
      sortOrder: parseFiniteNumber(`${scope}:sortOrder`, row.sortOrder, errors),
      unlockRebootCount: parseFiniteNumber(
        `${scope}:unlockRebootCount`,
        row.unlockRebootCount,
        errors,
      ),
      unlockStageNumber: parseFiniteNumber(
        `${scope}:unlockStageNumber`,
        row.unlockStageNumber,
        errors,
      ),
      upgradeId: row.upgradeId,
    };
  });
  return { errors, upgrades };
}

export function validateUnique(scope: string, values: string[], errors: string[]): void {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  for (const duplicate of duplicates) {
    errors.push(`[${scope}] duplicate id ${duplicate}`);
  }
}

export function validateCsvMasters(): CsvValidationResult {
  const errors: string[] = [...ensureCsvInputsExist().errors];
  if (errors.length > 0) {
    return { errors };
  }

  const { balanceConfig, errors: balanceErrors, rows: balanceRows } = loadBalanceCsv();
  const { errors: stageErrors, stages } = loadStagesCsv();
  const { enemies, errors: enemyErrors } = loadEnemiesCsv();
  const { errors: rewardErrors, stageRewards } = loadStageRewardsCsv();
  const { errors: upgradeErrors, upgrades } = loadUpgradesCsv();
  errors.push(...balanceErrors, ...stageErrors, ...enemyErrors, ...rewardErrors, ...upgradeErrors);

  validateUnique('balance', balanceRows.map((row) => row.key), errors);
  validateUnique('stages:stageId', stages.map((stage) => stage.stageId), errors);
  validateUnique('stages:stageNumber', stages.map((stage) => String(stage.stageNumber)), errors);
  validateUnique('enemies', enemies.map((enemy) => enemy.enemyId), errors);
  validateUnique('upgrades', upgrades.map((upgrade) => upgrade.upgradeId), errors);

  for (const stage of stages) {
    const scope = `stages:${stage.stageId}`;
    if (!stage.stageId) errors.push(`[${scope}] stageId must not be empty`);
    if (!Number.isInteger(stage.stageNumber) || stage.stageNumber <= 0) {
      errors.push(`[${scope}] stageNumber must be a positive integer`);
    }
    if (!['enemy_defeats', 'corner_hits'].includes(stage.clearConditionType)) {
      errors.push(`[${scope}] clearConditionType must be enemy_defeats or corner_hits`);
    }
    if (!Number.isInteger(stage.targetDefeatCount) || stage.targetDefeatCount <= 0) {
      errors.push(`[${scope}] targetDefeatCount must be a positive integer`);
    }
    if (!Number.isInteger(stage.maxActiveEnemies) || stage.maxActiveEnemies <= 0) {
      errors.push(`[${scope}] maxActiveEnemies must be a positive integer`);
    }
    if (!(stage.enemyHpMultiplier > 0)) errors.push(`[${scope}] enemyHpMultiplier must be positive`);
    if (!(stage.dropMultiplier > 0)) errors.push(`[${scope}] dropMultiplier must be positive`);
    if (stage.cornerRequirement < 0) errors.push(`[${scope}] cornerRequirement must be non-negative`);
  }

  for (const enemy of enemies) {
    const scope = `enemies:${enemy.enemyId}`;
    if (!enemy.enemyId) errors.push(`[${scope}] enemyId must not be empty`);
    if (!(enemy.radius > 0)) errors.push(`[${scope}] radius must be positive`);
    if (!(enemy.maxHp > 0)) errors.push(`[${scope}] maxHp must be positive`);
    if (enemy.hitCooldownMs < 0) errors.push(`[${scope}] hitCooldownMs must be non-negative`);
    if (!(enemy.dropAmount > 0)) errors.push(`[${scope}] dropAmount must be positive`);
    if (!(enemy.spawnWeight > 0)) errors.push(`[${scope}] spawnWeight must be positive`);
    if (!/^#[0-9a-fA-F]{6}$/.test(enemy.color)) errors.push(`[${scope}] color must be #RRGGBB`);
  }

  const stageIds = new Set(stages.map((stage) => stage.stageId));
  const rewardTypes = new Set<StageRewardType>([
    'background',
    'capsule',
    'feature',
    'memory',
    'monster',
    'muse',
    'skin',
  ]);
  for (const reward of stageRewards) {
    const scope = `stage_rewards:${reward.stageId}:${reward.rewardId}`;
    if (!stageIds.has(reward.stageId)) errors.push(`[${scope}] stageId not found in stages.csv`);
    if (!reward.rewardId) errors.push(`[${scope}] rewardId must not be empty`);
    if (!rewardTypes.has(reward.rewardType)) errors.push(`[${scope}] unsupported rewardType ${reward.rewardType}`);
    if (reward.clearRewardMemory < 0) errors.push(`[${scope}] clearRewardMemory must be non-negative`);
    if (reward.firstClearRewardMemory < 0) errors.push(`[${scope}] firstClearRewardMemory must be non-negative`);
    if (reward.amount !== undefined && reward.amount <= 0) errors.push(`[${scope}] amount must be positive when set`);
    if (reward.capsuleAmount !== undefined && reward.capsuleAmount <= 0) {
      errors.push(`[${scope}] capsuleAmount must be positive when set`);
    }
    if (reward.rewardType === 'background' && reward.unlockBackgroundId !== reward.rewardTargetId) {
      errors.push(`[${scope}] background rewards must set unlockBackgroundId to rewardTargetId`);
    }
    if (reward.rewardType === 'muse' && reward.unlockMuseId !== reward.rewardTargetId) {
      errors.push(`[${scope}] muse rewards must set unlockMuseId to rewardTargetId`);
    }
    if (reward.rewardType === 'skin' && reward.unlockSkinId !== reward.rewardTargetId) {
      errors.push(`[${scope}] skin rewards must set unlockSkinId to rewardTargetId`);
    }
    if (reward.rewardType === 'capsule' && reward.unlockCapsuleId !== reward.rewardTargetId) {
      errors.push(`[${scope}] capsule rewards must set unlockCapsuleId to rewardTargetId`);
    }
  }

  const upgradeCategories = new Set<UpgradeCategory>([
    'bounce',
    'corner',
    'drop',
    'memory',
    'reboot',
    'speed',
    'utility',
  ]);
  const upgradeEffectTypes = new Set<UpgradeMasterEffectType>(['add', 'multiply', 'none', 'set']);
  for (const upgrade of upgrades) {
    const scope = `upgrades:${upgrade.upgradeId}`;
    if (!upgrade.upgradeId) errors.push(`[${scope}] upgradeId must not be empty`);
    if (!upgrade.name) errors.push(`[${scope}] name must not be empty`);
    if (!upgradeCategories.has(upgrade.category)) {
      errors.push(`[${scope}] unsupported category ${upgrade.category}`);
    }
    if (!Number.isInteger(upgrade.maxLevel) || upgrade.maxLevel < 0) {
      errors.push(`[${scope}] maxLevel must be a non-negative integer`);
    }
    if (upgrade.baseCost < 0) errors.push(`[${scope}] baseCost must be non-negative`);
    if (upgrade.costGrowth < 1) errors.push(`[${scope}] costGrowth must be greater than or equal to 1`);
    if (!upgradeEffectTypes.has(upgrade.effectType)) {
      errors.push(`[${scope}] unsupported effectType ${upgrade.effectType}`);
    }
    if (upgrade.effectType !== 'none' && !upgrade.effectTarget) {
      errors.push(`[${scope}] effectTarget must not be empty unless effectType is none`);
    }
    if (!Number.isFinite(upgrade.effectBaseValue)) {
      errors.push(`[${scope}] effectBaseValue must be finite`);
    }
    if (!Number.isFinite(upgrade.effectValuePerLevel)) {
      errors.push(`[${scope}] effectValuePerLevel must be finite`);
    }
    if (!Number.isFinite(upgrade.effectMultiplierPerLevel)) {
      errors.push(`[${scope}] effectMultiplierPerLevel must be finite`);
    }
    if (!Number.isInteger(upgrade.unlockStageNumber) || upgrade.unlockStageNumber < 0) {
      errors.push(`[${scope}] unlockStageNumber must be a non-negative integer`);
    }
    if (!Number.isInteger(upgrade.unlockRebootCount) || upgrade.unlockRebootCount < 0) {
      errors.push(`[${scope}] unlockRebootCount must be a non-negative integer`);
    }
    if (!Number.isFinite(upgrade.sortOrder)) errors.push(`[${scope}] sortOrder must be finite`);
  }

  const bounceBoost = balanceConfig.bounceBoost;
  if (!bounceBoost || typeof bounceBoost !== 'object') {
    errors.push('[balance:bounceBoost] section is required');
  } else {
    const section = bounceBoost as Record<string, unknown>;
    if (!isFiniteNumber(section.tapBoostAdd) || section.tapBoostAdd < 0) {
      errors.push('[balance:bounceBoost.tapBoostAdd] must be a non-negative finite number');
    }
    if (!isFiniteNumber(section.maxTemporaryBoost) || section.maxTemporaryBoost < 0) {
      errors.push('[balance:bounceBoost.maxTemporaryBoost] must be a non-negative finite number');
    }
    if (!isFiniteNumber(section.decayDurationMs) || section.decayDurationMs <= 0) {
      errors.push('[balance:bounceBoost.decayDurationMs] must be a positive finite number');
    }
  }

  const speedTune = balanceConfig.speedTune;
  if (!speedTune || typeof speedTune !== 'object') {
    errors.push('[balance:speedTune] section is required');
  } else {
    const section = speedTune as Record<string, unknown>;
    const minSpeed = section.minSpeed;
    const baseSpeed = section.baseSpeed;
    const maxSpeed = section.maxSpeed;
    const tapBoostMaxSpeed = section.tapBoostMaxSpeed;
    if (!isFiniteNumber(minSpeed) || !isFiniteNumber(baseSpeed) || !isFiniteNumber(maxSpeed)) {
      errors.push('[balance:speedTune] minSpeed, baseSpeed, and maxSpeed must be finite numbers');
    } else {
      if (!(minSpeed <= baseSpeed && baseSpeed <= maxSpeed)) {
        errors.push('[balance:speedTune] expected minSpeed <= baseSpeed <= maxSpeed');
      }
    }
    if (!isFiniteNumber(tapBoostMaxSpeed) || (isFiniteNumber(maxSpeed) && tapBoostMaxSpeed < maxSpeed)) {
      errors.push('[balance:speedTune.tapBoostMaxSpeed] must be finite and greater than or equal to maxSpeed');
    }
    if (!isFiniteNumber(section.upgradeMultiplier) || section.upgradeMultiplier <= 0) {
      errors.push('[balance:speedTune.upgradeMultiplier] must be a positive finite number');
    }
  }

  const cornerSensor = balanceConfig.cornerSensor;
  if (!cornerSensor || typeof cornerSensor !== 'object') {
    errors.push('[balance:cornerSensor] section is required');
  } else {
    const section = cornerSensor as Record<string, unknown>;
    if (!isFiniteNumber(section.cornerZonePx) || section.cornerZonePx < 0) {
      errors.push('[balance:cornerSensor.cornerZonePx] must be a non-negative finite number');
    }
    if (!isFiniteNumber(section.cornerHitCooldownMs) || section.cornerHitCooldownMs < 0) {
      errors.push('[balance:cornerSensor.cornerHitCooldownMs] must be a non-negative finite number');
    }
  }

  const reboot = balanceConfig.reboot;
  if (!reboot || typeof reboot !== 'object') {
    errors.push('[balance:reboot] section is required');
  } else {
    const section = reboot as Record<string, unknown>;
    if (!isFiniteNumber(section.baseRequirement) || section.baseRequirement <= 0) {
      errors.push('[balance:reboot.baseRequirement] must be a positive finite number');
    }
    if (!isFiniteNumber(section.requirementGrowth) || section.requirementGrowth <= 0) {
      errors.push('[balance:reboot.requirementGrowth] must be a positive finite number');
    }
    if (!isFiniteNumber(section.basePermanentMultiplier)) {
      errors.push('[balance:reboot.basePermanentMultiplier] must be finite');
    }
    if (!isFiniteNumber(section.multiplierPerReboot)) {
      errors.push('[balance:reboot.multiplierPerReboot] must be finite');
    }
  }

  return { errors };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function generatedHeader(source: string): string {
  return `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.\n// Source: ${source}\n\n`;
}

export function writeGeneratedMasters(): void {
  const validation = validateCsvMasters();
  if (validation.errors.length > 0) {
    throw new Error(`CSV master validation failed:\n${validation.errors.join('\n')}`);
  }

  const { balanceConfig, rows } = loadBalanceCsv();
  const { stages } = loadStagesCsv();
  const { enemies } = loadEnemiesCsv();
  const { stageRewards } = loadStageRewardsCsv();
  const { upgrades } = loadUpgradesCsv();

  mkdirSync(generatedMastersRoot, { recursive: true });
  const files = [
    {
      name: 'balance.generated.ts',
      source: 'masters/csv/balance.csv',
      body:
        `import type { BalanceConfig, BalanceCsvRow } from '../../masters/types';\n\n` +
        `export const balanceRows = ${JSON.stringify(rows, null, 2)} as const satisfies readonly BalanceCsvRow[];\n` +
        `\nexport const balanceConfig = ${JSON.stringify(balanceConfig, null, 2)} as const satisfies BalanceConfig;\n`,
    },
    {
      name: 'stages.generated.ts',
      source: 'masters/csv/stages.csv',
      body:
        `import type { StageMaster } from '../../masters/types';\n\n` +
        `export const stageMasters = ${JSON.stringify(stages, null, 2)} as const satisfies readonly StageMaster[];\n`,
    },
    {
      name: 'enemies.generated.ts',
      source: 'masters/csv/enemies.csv',
      body:
        `import type { EnemyMaster } from '../../masters/types';\n\n` +
        `export const enemyMasters = ${JSON.stringify(enemies, null, 2)} as const satisfies readonly EnemyMaster[];\n`,
    },
    {
      name: 'stageRewards.generated.ts',
      source: 'masters/csv/stage_rewards.csv',
      body:
        `import type { StageRewardMaster } from '../../masters/types';\n\n` +
        `export const stageRewardMasters = ${JSON.stringify(stageRewards, null, 2)} as const satisfies readonly StageRewardMaster[];\n`,
    },
    {
      name: 'upgrades.generated.ts',
      source: 'masters/csv/upgrades.csv',
      body:
        `import type { UpgradeMaster } from '../../masters/types';\n\n` +
        `export const upgrades = ${JSON.stringify(upgrades, null, 2)} as const satisfies readonly UpgradeMaster[];\n`,
    },
  ];

  for (const file of files) {
    const path = resolve(generatedMastersRoot, file.name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${generatedHeader(file.source)}${file.body}`, 'utf8');
  }
}
