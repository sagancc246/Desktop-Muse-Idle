export type Reward = (
  | { type: 'skin'; id: string }
  | { type: 'background'; id: string }
  | { type: 'muse'; id: string }
  | { type: 'memory'; amount: number }
  | { type: 'capsule'; id: string; amount: number }
  | { type: 'shard'; amount: number }
  | { type: 'conversation'; id: string }
) & { rewardId?: string };

export interface RewardApplyResult {
  granted: boolean;
  alreadyOwned: boolean;
  unsupported: boolean;
  reward: Reward;
}

export type PresentedReward = Reward &
  Pick<RewardApplyResult, 'granted' | 'alreadyOwned' | 'unsupported'> & {
    claimed: boolean;
    claimKey: string;
  };

export function presentReward(result: RewardApplyResult, claimKey: string): PresentedReward {
  return {
    ...result.reward,
    granted: result.granted,
    alreadyOwned: result.alreadyOwned,
    unsupported: result.unsupported,
    claimed: false,
    claimKey,
  };
}

export function presentClaimedReward(reward: Reward, claimKey: string): PresentedReward {
  return {
    ...reward,
    granted: false,
    alreadyOwned: true,
    unsupported: false,
    claimed: true,
    claimKey,
  };
}

export function getRewardKey(reward: Reward, fallback: string | number = ''): string {
  switch (reward.type) {
    case 'skin':
    case 'background':
    case 'muse':
    case 'conversation':
      return `${reward.type}:${reward.id}`;
    case 'capsule':
      return `${reward.type}:${reward.id}:${reward.amount}`;
    case 'memory':
    case 'shard':
      return `${reward.type}:${reward.amount}:${fallback}`;
    default:
      return `unknown:${fallback}`;
  }
}

export function getStageRewardClaimKey(stageId: string, reward: Reward, index: number): string {
  if (reward.rewardId) {
    return `${stageId}:${reward.rewardId}`;
  }

  const rewardValue =
    'id' in reward ? reward.id : 'amount' in reward ? reward.amount : index;
  return `${stageId}:${reward.type}:${rewardValue}`;
}

export function getStageRewardClaimKeys(stageId: string, rewards: Reward[]): string[] {
  return rewards.map((reward, index) => getStageRewardClaimKey(stageId, reward, index));
}

export function migrateLegacyStageRewardClaims(
  claimedStageRewardIds: string[],
  legacyRewardIdsByStageId: Record<string, string[]>,
): string[] {
  return [
    ...new Set(
      claimedStageRewardIds.flatMap((stageId) =>
        (legacyRewardIdsByStageId[stageId] ?? []).map((rewardId) => `${stageId}:${rewardId}`),
      ),
    ),
  ];
}
