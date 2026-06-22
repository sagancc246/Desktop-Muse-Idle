import { stageRewardMasters as generatedStageRewardMasters } from '../generated/masters/stageRewards.generated';
import type { Reward } from '../data/rewards';
import type { StageRewardMaster, StageRewardType } from './types';
import type { Stage } from '../types/game';

const SUPPORTED_REWARD_TYPES = new Set<StageRewardType>([
  'background',
  'capsule',
  'memory',
  'muse',
  'skin',
]);

function readNonNegativeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function readPositiveInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.max(1, Math.floor(value))
    : fallback;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeStageReward(source: StageRewardMaster): StageRewardMaster {
  return {
    ...source,
    amount:
      typeof source.amount === 'number' && Number.isFinite(source.amount)
        ? source.amount
        : undefined,
    capsuleAmount:
      typeof source.capsuleAmount === 'number' && Number.isFinite(source.capsuleAmount)
        ? source.capsuleAmount
        : undefined,
    clearRewardMemory: readNonNegativeNumber(source.clearRewardMemory),
    firstClearRewardMemory: readNonNegativeNumber(source.firstClearRewardMemory),
    rewardTargetId: readOptionalString(source.rewardTargetId),
    rewardText: readOptionalString(source.rewardText),
    unlockBackgroundId: readOptionalString(source.unlockBackgroundId),
    unlockCapsuleId: readOptionalString(source.unlockCapsuleId),
    unlockFeatureId: readOptionalString(source.unlockFeatureId),
    unlockMonsterId: readOptionalString(source.unlockMonsterId),
    unlockMuseId: readOptionalString(source.unlockMuseId),
    unlockSkinId: readOptionalString(source.unlockSkinId),
  };
}

export function normalizeStageRewardMasters(
  sourceRewards: readonly StageRewardMaster[] = generatedStageRewardMasters,
): StageRewardMaster[] {
  return sourceRewards
    .filter(
      (reward) =>
        typeof reward.stageId === 'string' &&
        reward.stageId.trim().length > 0 &&
        typeof reward.rewardId === 'string' &&
        reward.rewardId.trim().length > 0 &&
        SUPPORTED_REWARD_TYPES.has(reward.rewardType),
    )
    .map(normalizeStageReward);
}

export const stageRewardMasters = normalizeStageRewardMasters();

export function getStageRewardMasters(stageId: string): StageRewardMaster[] {
  return stageRewardMasters.filter((reward) => reward.stageId === stageId);
}

function toReward(master: StageRewardMaster): Reward | null {
  const rewardText = master.rewardText;
  const withMeta = <T extends Reward>(reward: T): T => ({
    ...reward,
    rewardId: master.rewardId,
    rewardText,
  });

  switch (master.rewardType) {
    case 'memory': {
      const fallbackAmount = master.clearRewardMemory + master.firstClearRewardMemory;
      const amount = readPositiveInteger(master.amount, Math.max(1, Math.floor(fallbackAmount)));
      return withMeta({ type: 'memory', amount });
    }
    case 'background': {
      const id = master.unlockBackgroundId ?? master.rewardTargetId;
      return id ? withMeta({ type: 'background', id }) : null;
    }
    case 'muse': {
      const id = master.unlockMuseId ?? master.rewardTargetId;
      return id ? withMeta({ type: 'muse', id }) : null;
    }
    case 'skin': {
      const id = master.unlockSkinId ?? master.rewardTargetId;
      return id ? withMeta({ type: 'skin', id }) : null;
    }
    case 'capsule': {
      const id = master.unlockCapsuleId ?? master.rewardTargetId;
      if (!id) {
        return null;
      }
      const amount = readPositiveInteger(master.capsuleAmount ?? master.amount, 1);
      return withMeta({ type: 'capsule', id, amount });
    }
    default:
      return null;
  }
}

export function getStageRewards(stageId: string, fallbackRewards: Reward[]): Reward[] {
  const rewards = getStageRewardMasters(stageId).flatMap((reward) => {
    const runtimeReward = toReward(reward);
    return runtimeReward ? [runtimeReward] : [];
  });

  return rewards.length > 0 ? rewards : fallbackRewards;
}

export function applyStageRewardsToStage(stage: Stage): Stage {
  return {
    ...stage,
    rewards: getStageRewards(stage.id, stage.rewards),
  };
}
