import { stageMasters as generatedStageMasters } from '../generated/masters/stages.generated';
import type { StageMaster } from './types';
import type { Stage, StageClearConditionType, StageEnemyConfig } from '../types/game';

const DEFAULT_ENEMY_TYPE_ID = 'memory_bug';

const VALID_CLEAR_CONDITIONS = new Set<StageClearConditionType>([
  'corner_hits',
  'enemy_defeats',
]);

const fallbackStageMasters: readonly StageMaster[] = [
  {
    stageId: 'stage-1',
    stageNumber: 1,
    clearConditionType: 'enemy_defeats',
    targetDefeatCount: 3,
    maxActiveEnemies: 1,
    enemyHpMultiplier: 1,
    dropMultiplier: 1,
    cornerRequirement: 100,
  },
  {
    stageId: 'stage-2',
    stageNumber: 2,
    clearConditionType: 'enemy_defeats',
    targetDefeatCount: 5,
    maxActiveEnemies: 2,
    enemyHpMultiplier: 1.2,
    dropMultiplier: 1.1,
    cornerRequirement: 300,
  },
  {
    stageId: 'stage-3',
    stageNumber: 3,
    clearConditionType: 'enemy_defeats',
    targetDefeatCount: 8,
    maxActiveEnemies: 2,
    enemyHpMultiplier: 1.5,
    dropMultiplier: 1.2,
    cornerRequirement: 500,
  },
];

function readPositiveInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.max(1, Math.floor(value))
    : fallback;
}

function readNonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

function readPositiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeClearCondition(value: unknown, fallback: StageClearConditionType) {
  return typeof value === 'string' && VALID_CLEAR_CONDITIONS.has(value as StageClearConditionType)
    ? (value as StageClearConditionType)
    : fallback;
}

function normalizeStageMaster(source: StageMaster, fallback: StageMaster): StageMaster {
  const stageNumber = readPositiveInteger(source.stageNumber, fallback.stageNumber);
  const stageId =
    typeof source.stageId === 'string' && source.stageId.trim().length > 0
      ? source.stageId.trim()
      : fallback.stageId || `stage-${stageNumber}`;

  return {
    stageId,
    stageNumber,
    clearConditionType: normalizeClearCondition(
      source.clearConditionType,
      fallback.clearConditionType,
    ),
    targetDefeatCount: readPositiveInteger(
      source.targetDefeatCount,
      fallback.targetDefeatCount,
    ),
    maxActiveEnemies: readPositiveInteger(source.maxActiveEnemies, fallback.maxActiveEnemies),
    enemyHpMultiplier: readPositiveNumber(
      source.enemyHpMultiplier,
      fallback.enemyHpMultiplier,
    ),
    dropMultiplier: readPositiveNumber(source.dropMultiplier, fallback.dropMultiplier),
    cornerRequirement: readNonNegativeInteger(
      source.cornerRequirement,
      fallback.cornerRequirement,
    ),
  };
}

export function normalizeStageMasters(
  sourceStages: readonly StageMaster[] = generatedStageMasters,
  fallbackStages: readonly StageMaster[] = fallbackStageMasters,
): StageMaster[] {
  const fallbackByStageNumber = new Map(
    fallbackStages.map((stage) => [stage.stageNumber, stage]),
  );
  const fallbackByStageId = new Map(fallbackStages.map((stage) => [stage.stageId, stage]));
  const normalized = sourceStages.map((stage, index) => {
    const fallback =
      fallbackByStageId.get(stage.stageId) ??
      fallbackByStageNumber.get(stage.stageNumber) ??
      fallbackStages[index] ??
      fallbackStages[fallbackStages.length - 1] ??
      {
        stageId: `stage-${index + 1}`,
        stageNumber: index + 1,
        clearConditionType: 'enemy_defeats',
        targetDefeatCount: 3,
        maxActiveEnemies: 1,
        enemyHpMultiplier: 1,
        dropMultiplier: 1,
        cornerRequirement: 100,
      };

    return normalizeStageMaster(stage, fallback);
  });

  return normalized.length > 0 ? normalized : fallbackStages.map((stage) => ({ ...stage }));
}

export const stageMasters = normalizeStageMasters();

export function getStageMasterById(stageId: string): StageMaster | undefined {
  return stageMasters.find((stage) => stage.stageId === stageId);
}

export function getStageMasterByNumber(stageNumber: number): StageMaster | undefined {
  return stageMasters.find((stage) => stage.stageNumber === stageNumber);
}

export function getStageMasterForStage(stage: Stage): StageMaster | undefined {
  return (
    getStageMasterById(stage.id) ??
    (stage.stageNumber ? getStageMasterByNumber(stage.stageNumber) : undefined)
  );
}

export function createStageEnemyConfigFromMaster(master: StageMaster): StageEnemyConfig {
  return {
    clearConditionType: 'enemy_defeats',
    dropMultiplier: master.dropMultiplier,
    enemyHpMultiplier: master.enemyHpMultiplier,
    enemyTypes: [DEFAULT_ENEMY_TYPE_ID],
    maxActiveEnemies: master.maxActiveEnemies,
    targetDefeatCount: master.targetDefeatCount,
  };
}

export function applyStageMasterToStage(stage: Stage): Stage {
  const master = getStageMasterForStage(stage);
  if (!master) {
    return stage;
  }

  return {
    ...stage,
    id: master.stageId,
    stageNumber: master.stageNumber,
    cornerHitGoal: master.cornerRequirement,
    clearConditionType: master.clearConditionType,
    enemyConfig:
      master.clearConditionType === 'enemy_defeats'
        ? createStageEnemyConfigFromMaster(master)
        : stage.enemyConfig,
  };
}
