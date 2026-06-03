import { getMuseById, initialUnlockedMuseIds, muses } from '../data/muses';
import { getStageById } from '../data/stages';
import type { GameState, Muse, MuseUnlockCondition } from '../types/game';

type UnlockState = Pick<
  GameState,
  'clearedStages' | 'rebootCount' | 'totalCornerHits' | 'unlockedMuseIds'
>;

export function isMuseUnlockConditionMet(
  condition: MuseUnlockCondition,
  state: UnlockState,
): boolean {
  switch (condition.type) {
    case 'initial':
      return true;
    case 'stage_clear':
      return typeof condition.targetId === 'string' && state.clearedStages.includes(condition.targetId);
    case 'total_corner_hits':
      return state.totalCornerHits >= (condition.value ?? Infinity);
    case 'reboot_count':
      return state.rebootCount >= (condition.value ?? Infinity);
    case 'jackpot_count':
    case 'capsule':
    case 'shard_exchange':
      return false;
    default:
      return false;
  }
}

export function getUnlockableMuseIds(state: UnlockState): string[] {
  return muses
    .filter(
      (muse) =>
        !state.unlockedMuseIds.includes(muse.id) &&
        isMuseUnlockConditionMet(muse.unlockCondition, state),
    )
    .map((muse) => muse.id);
}

export function getInitialUnlockedMuseIds(): string[] {
  return [...initialUnlockedMuseIds];
}

export function getMuseUnlockConditionLabel(muse: Muse): string {
  const { unlockCondition } = muse;

  if (unlockCondition.type === 'initial') {
    return 'Initially unlocked';
  }

  if (unlockCondition.type === 'stage_clear' && unlockCondition.targetId) {
    return `Clear ${getStageById(unlockCondition.targetId)?.name ?? unlockCondition.targetId}`;
  }

  if (unlockCondition.type === 'total_corner_hits') {
    return `Reach ${(unlockCondition.value ?? 0).toLocaleString()} total Corner Hits`;
  }

  if (unlockCondition.type === 'reboot_count') {
    return `Reboot ${(unlockCondition.value ?? 0).toLocaleString()} times`;
  }

  if (unlockCondition.type === 'jackpot_count') {
    return 'Hit a Jackpot Corner';
  }

  if (unlockCondition.type === 'capsule') {
    return 'Unlock from Muse Capsule';
  }

  if (unlockCondition.type === 'shard_exchange') {
    return 'Exchange Shards';
  }

  return 'Locked';
}

export function isKnownMuseId(museId: string): boolean {
  return getMuseById(museId) !== undefined;
}
