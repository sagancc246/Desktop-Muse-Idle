export type ClearConditionType = 'enemy_defeats' | 'corner_hits';

export type BalancePrimitiveType = 'number' | 'boolean' | 'string';

export type BalanceConfigValue =
  | boolean
  | number
  | string
  | { readonly [key: string]: BalanceConfigValue };

export interface BalanceCsvRow {
  key: string;
  value: string;
  type: BalancePrimitiveType;
  description: string;
}

export interface BalanceConfig {
  readonly [key: string]: BalanceConfigValue;
}

export interface StageMaster {
  stageId: string;
  stageNumber: number;
  clearConditionType: ClearConditionType;
  targetDefeatCount: number;
  maxActiveEnemies: number;
  enemyHpMultiplier: number;
  dropMultiplier: number;
  cornerRequirement: number;
}

export interface EnemyMaster {
  enemyId: string;
  name: string;
  radius: number;
  maxHp: number;
  hitCooldownMs: number;
  dropAmount: number;
  color: string;
  spawnWeight: number;
}

export type StageRewardType =
  | 'background'
  | 'capsule'
  | 'feature'
  | 'memory'
  | 'monster'
  | 'muse'
  | 'skin';

export interface StageRewardMaster {
  stageId: string;
  rewardId: string;
  rewardType: StageRewardType;
  rewardTargetId?: string;
  amount?: number;
  clearRewardMemory: number;
  firstClearRewardMemory: number;
  unlockBackgroundId?: string;
  unlockMonsterId?: string;
  unlockFeatureId?: string;
  unlockMuseId?: string;
  unlockSkinId?: string;
  unlockCapsuleId?: string;
  capsuleAmount?: number;
  rewardText?: string;
}
