import type { Stage } from '../types/game';

export const stages: Stage[] = [
  {
    id: 'stage-1',
    name: 'Stage 1',
    description: 'Find the rhythm of the first corners.',
    cornerHitGoal: 100,
    rewardBackgroundId: 'bg_default_room',
  },
  {
    id: 'stage-2',
    name: 'Stage 2',
    description: 'Keep the muse bouncing through a longer session.',
    cornerHitGoal: 300,
    rewardBackgroundId: 'bg_cozy_room',
    skinRewardIds: ['lumi_pastel'],
  },
  {
    id: 'stage-3',
    name: 'Stage 3',
    description: 'Reach the neon rhythm and prepare for the final unlock.',
    cornerHitGoal: 500,
    rewardBackgroundId: 'bg_neon_room',
  },
  {
    id: 'stage-4',
    name: 'Stage 4',
    description: 'Master the pinball field and unlock the late-game Muse.',
    cornerHitGoal: 700,
    rewardBackgroundId: 'bg_pinball_neon',
  },
];

export const initialStageId = stages[0].id;

export function getStageById(stageId: string): Stage | undefined {
  return stages.find((stage) => stage.id === stageId);
}

export function getNextStage(stageId: string): Stage | undefined {
  const currentStageIndex = stages.findIndex((stage) => stage.id === stageId);
  return stages[currentStageIndex + 1];
}

export function createInitialStageCornerHits(): Record<string, number> {
  return Object.fromEntries(stages.map((stage) => [stage.id, 0]));
}
