import { defaultEnemyTypeId } from './enemies';
import { applyStageMasterToStage } from '../masters/stages';
import { applyStageRewardsToStage } from '../masters/stageRewards';
import type { Stage, StageClearConditionType, StageEnemyConfig } from '../types/game';

const createEnemyStageConfig = (
  maxActiveEnemies: number,
  targetDefeatCount: number,
  enemyHpMultiplier = 1,
  dropMultiplier = 1,
): StageEnemyConfig => ({
  maxActiveEnemies,
  targetDefeatCount,
  enemyTypes: [defaultEnemyTypeId],
  enemyHpMultiplier,
  dropMultiplier,
  clearConditionType: 'enemy_defeats',
});

const baseStages: Stage[] = [
  {
    id: 'stage-1',
    name: 'Stage 1',
    description: 'Find the rhythm of the first corners.',
    cornerHitGoal: 100,
    clearConditionType: 'enemy_defeats',
    enemyConfig: createEnemyStageConfig(1, 3),
    rewards: [
      { rewardId: 'memory_500', type: 'memory', amount: 500 },
      { rewardId: 'cozy_room', type: 'background', id: 'bg_cozy_room' },
    ],
  },
  {
    id: 'stage-2',
    name: 'Stage 2',
    description: 'Keep the muse bouncing through a longer session.',
    cornerHitGoal: 300,
    clearConditionType: 'enemy_defeats',
    enemyConfig: createEnemyStageConfig(2, 5, 1.2, 1.1),
    rewards: [
      { rewardId: 'lumi_pastel', type: 'skin', id: 'lumi_pastel' },
      { rewardId: 'astra', type: 'muse', id: 'astra' },
    ],
  },
  {
    id: 'stage-3',
    name: 'Stage 3',
    description: 'Reach the neon rhythm and prepare for the final unlock.',
    cornerHitGoal: 500,
    clearConditionType: 'enemy_defeats',
    enemyConfig: createEnemyStageConfig(2, 8, 1.5, 1.2),
    rewards: [
      { rewardId: 'neon_room', type: 'background', id: 'bg_neon_room' },
    ],
  },
  {
    id: 'stage-4',
    name: 'Stage 4',
    description: 'Settle into the night and unlock the late-game Muse.',
    cornerHitGoal: 700,
    clearConditionType: 'enemy_defeats',
    enemyConfig: createEnemyStageConfig(2, 10, 1.75, 1.3),
    rewards: [
      { rewardId: 'night_room', type: 'background', id: 'bg_night_room' },
      { rewardId: 'noir', type: 'muse', id: 'noir' },
    ],
  },
  {
    id: 'stage-5',
    name: 'Stage 5',
    description: 'Redirect the field and unlock Vega.',
    cornerHitGoal: 900,
    clearConditionType: 'enemy_defeats',
    enemyConfig: createEnemyStageConfig(2, 12, 2, 1.4),
    rewards: [{ rewardId: 'vega', type: 'muse', id: 'vega' }],
  },
  {
    id: 'stage-6',
    name: 'Stage 6',
    description: 'Build a stable Memory reserve.',
    cornerHitGoal: 1_200,
    clearConditionType: 'enemy_defeats',
    enemyConfig: createEnemyStageConfig(3, 15, 2.2, 1.5),
    rewards: [{ rewardId: 'memory_10000', type: 'memory', amount: 10_000 }],
  },
  {
    id: 'stage-7',
    name: 'Stage 7',
    description: 'Reach the cyber pinball field.',
    cornerHitGoal: 1_500,
    clearConditionType: 'enemy_defeats',
    enemyConfig: createEnemyStageConfig(3, 18, 2.45, 1.6),
    rewards: [
      { rewardId: 'astra_cyber', type: 'skin', id: 'astra_cyber' },
      { rewardId: 'pinball_neon', type: 'background', id: 'bg_pinball_neon' },
    ],
  },
  {
    id: 'stage-8',
    name: 'Stage 8',
    description: 'Open the observatory beyond the night.',
    cornerHitGoal: 1_900,
    clearConditionType: 'enemy_defeats',
    enemyConfig: createEnemyStageConfig(3, 21, 2.7, 1.7),
    rewards: [{ rewardId: 'star_room', type: 'background', id: 'bg_star_room' }],
  },
  {
    id: 'stage-9',
    name: 'Stage 9',
    description: 'Prepare a pair of future Muse Capsules.',
    cornerHitGoal: 2_300,
    clearConditionType: 'enemy_defeats',
    enemyConfig: createEnemyStageConfig(3, 24, 3, 1.8),
    rewards: [{ rewardId: 'muse_capsule_2', type: 'capsule', id: 'muse_capsule', amount: 2 }],
  },
  {
    id: 'stage-10',
    name: 'Stage 10',
    description: 'Complete the v1.0 route and prepare for Reboot.',
    cornerHitGoal: 3_000,
    clearConditionType: 'enemy_defeats',
    enemyConfig: createEnemyStageConfig(3, 30, 3.4, 2),
    rewards: [{ rewardId: 'memory_100000', type: 'memory', amount: 100_000 }],
  },
];

export const stages: Stage[] = baseStages
  .map(applyStageMasterToStage)
  .map(applyStageRewardsToStage);

export const initialStageId = stages[0].id;

// Keep this migration snapshot unchanged when adding future rewards to existing stages.
export const legacyClaimedRewardIdsByStageId: Record<string, string[]> = {
  'stage-1': ['memory_500', 'cozy_room'],
  'stage-2': ['lumi_pastel', 'astra'],
  'stage-3': ['neon_room'],
  'stage-4': ['night_room', 'noir'],
  'stage-5': ['vega'],
  'stage-6': ['memory_10000'],
  'stage-7': ['astra_cyber', 'pinball_neon'],
  'stage-8': ['star_room'],
  'stage-9': ['muse_capsule_2'],
  'stage-10': ['memory_100000'],
};

export function getStageById(stageId: string): Stage | undefined {
  return stages.find((stage) => stage.id === stageId);
}

export function getNextStage(stageId: string): Stage | undefined {
  const currentStageIndex = stages.findIndex((stage) => stage.id === stageId);
  return stages[currentStageIndex + 1];
}

export function getStageNumber(stage: Stage): number {
  if (typeof stage.stageNumber === 'number' && Number.isFinite(stage.stageNumber)) {
    return Math.max(1, Math.floor(stage.stageNumber));
  }

  const stageIndex = stages.findIndex((candidate) => candidate.id === stage.id);
  return stageIndex >= 0 ? stageIndex + 1 : 1;
}

export function createInitialStageCornerHits(): Record<string, number> {
  return Object.fromEntries(stages.map((stage) => [stage.id, 0]));
}

export function createInitialStageDefeatCounts(): Record<string, number> {
  return Object.fromEntries(stages.map((stage) => [stage.id, 0]));
}

export function getStageClearConditionType(stage: Stage): StageClearConditionType {
  return stage.clearConditionType ?? 'corner_hits';
}

export function getStageEnemyConfig(stage: Stage): StageEnemyConfig {
  return (
    stage.enemyConfig ?? {
      maxActiveEnemies: 1,
      targetDefeatCount: 3,
      enemyTypes: [defaultEnemyTypeId],
      enemyHpMultiplier: 1,
      dropMultiplier: 1,
      clearConditionType: 'enemy_defeats',
    }
  );
}
