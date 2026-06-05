import { getMuseById, initialUnlockedMuseIds, muses } from '../data/muses';
import { getStageById } from '../data/stages';
import type { Muse, UnlockCondition } from '../types/game';

interface UnlockState {
  clearedStages: string[];
  rebootCount: number;
  totalCornerHits: number;
  totalJackpots?: number;
  unlockedMuseIds: string[];
}

export function isUnlockConditionMet(
  condition: UnlockCondition,
  state: UnlockState,
): boolean {
  switch (condition.type) {
    case 'initial':
      return true;
    case 'stage_clear':
      return state.clearedStages.includes(condition.targetId);
    case 'total_corner_hits':
      return state.totalCornerHits >= condition.value;
    case 'reboot_count':
      return state.rebootCount >= condition.value;
    case 'jackpot_count':
      return (state.totalJackpots ?? 0) >= condition.value;
    case 'capsule':
    case 'shard_exchange':
    case 'dlc':
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
        isUnlockConditionMet(muse.unlockCondition, state),
    )
    .map((muse) => muse.id);
}

export function getInitialUnlockedMuseIds(): string[] {
  return [...initialUnlockedMuseIds];
}

export function getMuseUnlockConditionLabel(muse: Muse): string {
  return getUnlockConditionLabel(muse.unlockCondition);
}

export function getUnlockConditionLabel(condition: UnlockCondition): string {
  switch (condition.type) {
    case 'initial':
      return 'Initially unlocked';
    case 'stage_clear':
      return `Clear ${getStageById(condition.targetId)?.name ?? condition.targetId}`;
    case 'total_corner_hits':
      return `Reach ${condition.value.toLocaleString()} total Corner Hits`;
    case 'reboot_count':
      return `Reboot ${condition.value.toLocaleString()} times`;
    case 'jackpot_count':
      return `Hit ${condition.value.toLocaleString()} Jackpot Corners`;
    case 'capsule':
      return 'Unlock from Muse Capsule';
    case 'shard_exchange':
      return 'Exchange Shards';
    case 'dlc':
      return 'DLC';
    default:
      return 'Locked';
  }
}

export function isKnownMuseId(museId: string): boolean {
  return getMuseById(museId) !== undefined;
}
