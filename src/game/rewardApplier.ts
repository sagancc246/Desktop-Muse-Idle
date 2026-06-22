import { getBackgroundById } from '../data/backgrounds';
import { getMuseById } from '../data/muses';
import type { Reward, RewardApplyResult } from '../data/rewards';
import { getSkinById } from '../data/skins';
import type { BackfillRewardGroup, Stage } from '../types/game';
import type { PresentedReward } from '../data/rewards';

export interface RewardActions {
  addCapsule?: (id: string, amount: number) => void;
  addMemory: (amount: number) => void;
  addSkinShard?: (amount: number) => void;
  hasBackground: (id: string) => boolean;
  hasConversation?: (id: string) => boolean;
  hasMuse: (id: string) => boolean;
  hasSkin: (id: string) => boolean;
  unlockBackground: (id: string) => void;
  unlockConversation?: (id: string) => void;
  unlockMuse: (id: string) => void;
  unlockSkin: (id: string) => void;
}

function result(
  reward: Reward,
  status: 'granted' | 'alreadyOwned' | 'unsupported',
): RewardApplyResult {
  return {
    reward,
    granted: status === 'granted',
    alreadyOwned: status === 'alreadyOwned',
    unsupported: status === 'unsupported',
  };
}

function applyOwnedReward(
  reward: Reward,
  isKnown: boolean,
  isOwned: boolean,
  unlock: () => void,
): RewardApplyResult {
  if (!isKnown) {
    return result(reward, 'unsupported');
  }

  if (isOwned) {
    return result(reward, 'alreadyOwned');
  }

  unlock();
  return result(reward, 'granted');
}

export function applyReward(reward: Reward, actions: RewardActions): RewardApplyResult {
  switch (reward.type) {
    case 'skin':
      return applyOwnedReward(
        reward,
        getSkinById(reward.id) !== undefined,
        actions.hasSkin(reward.id),
        () => actions.unlockSkin(reward.id),
      );
    case 'background':
      return applyOwnedReward(
        reward,
        getBackgroundById(reward.id) !== undefined,
        actions.hasBackground(reward.id),
        () => actions.unlockBackground(reward.id),
      );
    case 'muse':
      return applyOwnedReward(
        reward,
        getMuseById(reward.id) !== undefined,
        actions.hasMuse(reward.id),
        () => actions.unlockMuse(reward.id),
      );
    case 'memory': {
      const amount = Math.floor(reward.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return result(reward, 'unsupported');
      }
      actions.addMemory(amount);
      return result({ ...reward, amount }, 'granted');
    }
    case 'capsule': {
      const amount = Math.floor(reward.amount);
      if (!actions.addCapsule || !Number.isFinite(amount) || amount <= 0) {
        return result(reward, 'unsupported');
      }
      actions.addCapsule(reward.id, amount);
      return result({ ...reward, amount }, 'granted');
    }
    case 'shard': {
      const amount = Math.floor(reward.amount);
      if (!actions.addSkinShard || !Number.isFinite(amount) || amount <= 0) {
        return result(reward, 'unsupported');
      }
      actions.addSkinShard(amount);
      return result({ ...reward, amount }, 'granted');
    }
    case 'conversation':
      if (!actions.hasConversation || !actions.unlockConversation) {
        return result(reward, 'unsupported');
      }
      return applyOwnedReward(
        reward,
        true,
        actions.hasConversation(reward.id),
        () => actions.unlockConversation?.(reward.id),
      );
    default:
      return result(reward, 'unsupported');
  }
}

export function canClaimRewardResult(result: RewardApplyResult): boolean {
  return !result.unsupported;
}

export function groupStageRewardResults(
  stage: Pick<Stage, 'id' | 'name'>,
  rewards: PresentedReward[],
): BackfillRewardGroup | null {
  if (rewards.length === 0) {
    return null;
  }

  return {
    stageId: stage.id,
    stageName: stage.name,
    rewards,
  };
}
