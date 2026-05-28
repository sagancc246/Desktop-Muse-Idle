export type UpgradeId = 'bounce_boost' | 'speed_tune' | 'corner_sensor';

export type UpgradeEffectType = 'bounce_reward' | 'speed' | 'corner_reward';

export type SkillTreeCategory = 'bounce' | 'corner' | 'muse';

export type SkillTreeEffectType =
  | 'bounce_reward'
  | 'corner_reward'
  | 'corner_threshold'
  | 'offline_reward'
  | 'skill_duration'
  | 'skill_cooldown'
  | 'internal_speed_bonus';

export interface SkillNode {
  id: string;
  category: SkillTreeCategory;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  requiredNodeIds: string[];
  effectType: SkillTreeEffectType;
  effectValue: number;
}

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  description: string;
  baseCost: number;
  costRate: number;
  effectType: UpgradeEffectType;
  effectValue: number;
}

export interface UpgradeProgress extends UpgradeDefinition {
  level: number;
}

export type UpgradeCollection = Record<UpgradeId, UpgradeProgress>;

export interface Stage {
  id: string;
  name: string;
  description: string;
  cornerHitGoal: number;
  rewardBackgroundId: string;
}

export interface Background {
  id: string;
  name: string;
  description: string;
  imagePath: string;
  unlockStageId: string;
}

export type CornerHitPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface CornerHitFlashEvent {
  corner: CornerHitPosition;
  occurredAt: number;
}

export type SkillType = 'clone' | 'grow' | 'speed_up';

export interface MuseSkill {
  id: string;
  name: string;
  type: SkillType;
  description: string;
  durationMs: number;
  cooldownMs: number;
  power: number;
}

export interface MuseSkillState {
  activeRemainingMs: number;
  cooldownRemainingMs: number;
}

export interface TapVoice {
  id: string;
  audioPath: string;
  subtitleJa: string;
  subtitleEn: string;
}

export interface MuseTapState {
  isTapBoostActive: boolean;
  tapBoostEndsAt: number;
  tapCooldownEndsAt: number;
  lastTapVoiceId: string | null;
}

export interface Muse {
  id: string;
  name: string;
  iconAsset: string;
  unlocked: boolean;
  baseSpeed: number;
  memoryMultiplier: number;
  cornerMultiplier: number;
  skill: MuseSkill;
  tapVoices: TapVoice[];
}

export type Language = 'ja' | 'en';

export type EffectsQuality = 'low' | 'medium' | 'high';

export type MotionIntensity = 'low' | 'medium' | 'high';

export interface AppSettings {
  bgmVolume: number;
  seVolume: number;
  language: Language;
  effectsQuality: EffectsQuality;
  motionIntensity: MotionIntensity;
  autoSaveEnabled: boolean;
}

export interface OfflineRewardSummary {
  elapsedSeconds: number;
  memoryEarned: number;
  multiplier: number;
  wasCapped: boolean;
}

export interface StageClearSummary {
  stageId: string;
  stageName: string;
  rewardBackgroundId: string;
  rewardBackgroundName: string;
  nextStageId: string | null;
  nextStageName: string | null;
}

export interface GameState {
  memory: number;
  memoryPerSecond: number;
  totalBounces: number;
  totalCornerHits: number;
  upgrades: UpgradeCollection;
  currentStageId: string;
  stageCornerHits: Record<string, number>;
  clearedStages: string[];
  unlockedBackgrounds: string[];
  currentBackgroundId: string | null;
  activeMuseIds: string[];
  skillStates: Record<string, MuseSkillState>;
  museTapStates: Record<string, MuseTapState>;
  fragments: number;
  unlockedSkillNodes: Record<string, number>;
  rebootCount: number;
  pendingOfflineReward: OfflineRewardSummary | null;
  pendingStageClear: StageClearSummary | null;
  lastCornerHitFlash: CornerHitFlashEvent | null;
}

export interface SaveData {
  saveVersion: number;
  memory: number;
  memoryPerSecond: number;
  totalBounces: number;
  totalCornerHits: number;
  upgrades: Record<UpgradeId, number>;
  currentStageId: string;
  stageCornerHits: Record<string, number>;
  clearedStages: string[];
  unlockedBackgrounds: string[];
  currentBackgroundId: string | null;
  activeMuseIds: string[];
  fragments: number;
  unlockedSkillNodes: Record<string, number>;
  rebootCount: number;
  lastSavedAt: number;
}

export interface GameActions {
  addMemory: (amount: number) => void;
  incrementBounce: () => void;
  incrementCornerHit: () => void;
  purchaseUpgrade: (upgradeId: UpgradeId) => void;
  selectBackground: (backgroundId: string) => void;
  startNewGame: () => void;
  continueGame: () => void;
  resetSaveData: () => void;
  toggleActiveMuse: (museId: string) => void;
  activateMuseSkill: (museId: string) => boolean;
  tickSkillStates: (deltaMs: number) => void;
  activateMuseTap: (museId: string, voiceId: string, now: number) => boolean;
  tickMuseTapStates: (now: number) => void;
  unlockSkillNode: (skillNodeId: string) => void;
  reboot: () => boolean;
  dismissOfflineReward: () => void;
  dismissStageClear: () => void;
  triggerCornerHitFlash: (corner: CornerHitPosition) => void;
  refreshMemoryPerSecond: (motionIntensity: MotionIntensity) => void;
  debugAddMemory: (amount: number) => void;
  debugAddFragments: (amount: number) => void;
  debugTriggerCornerHit: () => void;
  debugCompleteCurrentStage: () => void;
  debugActivateMuseSkill: (museId: string) => void;
  debugActivateMuseTap: (museId: string) => void;
}

export type GameStore = GameState & GameActions;
