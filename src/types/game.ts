import type { PresentedReward, Reward } from '../data/rewards';

export type UpgradeId = 'bounce_boost' | 'speed_tune' | 'corner_sensor';

export type UpgradeEffectType = 'bounce_reward' | 'speed' | 'corner_reward';

export type SkillTreeCategory = 'bounce' | 'corner' | 'muse';

export type SkillTreeEffectType =
  | 'bounce_reward'
  | 'corner_reward'
  | 'corner_threshold'
  | 'near_corner_reward'
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
  rewards: Reward[];
}

export interface Background {
  id: string;
  name: string;
  description: string;
  imagePath: string;
  thumbnailAsset: string;
  unlockCondition: UnlockCondition;
}

export type CornerHitPosition = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';

export interface CornerHitFlashEvent {
  corner: CornerHitPosition;
  occurredAt: number;
}

export type SkillType = 'clone' | 'grow' | 'speed_up' | 'bumper';

export type MuseSkillId = 'clone' | 'speed_up' | 'giant' | 'muse_bumper';

export type MuseSkillTrigger = 'corner_hit';

export type UnlockCondition =
  | { type: 'initial' }
  | { type: 'stage_clear'; targetId: string }
  | { type: 'total_corner_hits'; value: number }
  | { type: 'jackpot_count'; value: number }
  | { type: 'reboot_count'; value: number }
  | { type: 'capsule'; targetId?: string }
  | { type: 'shard_exchange'; value?: number }
  | { type: 'dlc'; targetId: string };

export interface MuseSkill {
  id: string;
  name: string;
  type: SkillType;
  description: string;
  durationMs: number;
  cooldownMs: number;
  trigger: MuseSkillTrigger;
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

export type SkinRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type SkinUnlockMethod = 'default' | 'stage' | 'capsule' | 'shard' | 'dlc';

export interface MuseSkin {
  id: string;
  museId: string;
  name: string;
  description: string;
  rarity: SkinRarity;
  iconAsset: string;
  thumbnailAsset: string;
  defaultUnlocked: boolean;
  unlockMethod: SkinUnlockMethod;
  unlockCondition: UnlockCondition;
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
  description: string;
  iconAsset: string;
  defaultSkinId: string;
  skillId: MuseSkillId;
  defaultUnlocked: boolean;
  unlockCondition: UnlockCondition;
  baseSpeed: number;
  memoryMultiplier: number;
  cornerMultiplier: number;
  skill: MuseSkill;
  tapVoices: TapVoice[];
}

export type Language = 'ja' | 'en';

export type EffectsQuality = 'low' | 'medium' | 'high';

export type MotionIntensity = 'low' | 'medium' | 'high';

export type WallpaperMode = 'off' | 'stage' | 'muse_overlay';

export interface OverlayWindowPreferences {
  isAlwaysOnTopEnabled: boolean;
  isClickThroughEnabled: boolean;
  isTransparentWindowEnabled: boolean;
}

export interface WallpaperSettings {
  alwaysOnTopPreferred: boolean;
  bgmEnabled: boolean;
  clickThroughPreferred: boolean;
  effectsQuality: 'low' | 'normal';
  fps: 30 | 60;
  seVolumeScale: number;
  showStageHud: boolean;
  showOverlayHud: boolean;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type SaveSource = 'manual' | 'auto';

export interface SaveResult {
  error?: string;
  savedAt: number | null;
  success: boolean;
}

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
  rewards: PresentedReward[];
  nextStageId: string | null;
  nextStageName: string | null;
}

export interface BackfillRewardGroup {
  stageId: string;
  stageName: string;
  rewards: PresentedReward[];
}

export interface GameStats {
  totalWallHits: number;
  totalCornerHits: number;
  highestStageReached: number;
  rebootCount: number;
  totalPlayTimeMs: number;
  unlockedBackgroundCount: number;
  totalMemoryEarned: number;
  totalNearCorners: number;
  totalJackpots: number;
  totalFeverActivations: number;
}

export interface GameState {
  memory: number;
  memoryPerSecond: number;
  totalBounces: number;
  totalCornerHits: number;
  stats: GameStats;
  upgrades: UpgradeCollection;
  currentStageId: string;
  stageCornerHits: Record<string, number>;
  clearedStages: string[];
  claimedRewardIds: string[];
  claimedStageRewardIds: string[];
  unlockedBackgrounds: string[];
  currentBackgroundId: string | null;
  unlockedMuseIds: string[];
  activeMuseIds: string[];
  newlyUnlockedMuseIds: string[];
  unlockedSkinIds: string[];
  equippedSkinByMuseId: Record<string, string>;
  newlyUnlockedSkinIds: string[];
  skillStates: Record<string, MuseSkillState>;
  museTapStates: Record<string, MuseTapState>;
  fragments: number;
  capsuleCount: number;
  unlockedSkillNodes: Record<string, number>;
  rebootCount: number;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  lastSaveError: string | null;
  lastSaveSource: SaveSource | null;
  pendingOfflineReward: OfflineRewardSummary | null;
  pendingStageClear: StageClearSummary | null;
  pendingBackfillRewards: BackfillRewardGroup[] | null;
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
  claimedRewardIds?: string[];
  claimedStageRewardIds?: string[];
  unlockedBackgrounds: string[];
  currentBackgroundId: string | null;
  unlockedMuseIds: string[];
  activeMuseIds: string[];
  unlockedSkinIds: string[];
  equippedSkinByMuseId: Record<string, string>;
  fragments: number;
  capsuleCount?: number;
  unlockedSkillNodes: Record<string, number>;
  rebootCount: number;
  lastSavedAt: number;
  stats?: GameStats;
}

export interface GameActions {
  addMemory: (amount: number) => void;
  incrementBounce: () => void;
  incrementCornerHit: () => void;
  recordWallHit: (memoryEarned: number) => void;
  recordCornerHit: (memoryEarned: number) => void;
  recordNearCorner: () => void;
  recordJackpot: (memoryEarned: number) => void;
  recordFeverStart: () => void;
  recordStageReached: (stageNumber: number) => void;
  recordReboot: () => void;
  updateUnlockedBackgroundCount: (count: number) => void;
  addPlayTime: (deltaMs: number) => void;
  purchaseUpgrade: (upgradeId: UpgradeId) => void;
  selectBackground: (backgroundId: string) => void;
  startNewGame: () => void;
  continueGame: () => void;
  resetSaveData: () => void;
  unlockMuse: (museId: string) => void;
  checkMuseUnlocks: () => void;
  setActiveMuses: (museIds: string[]) => void;
  toggleActiveMuse: (museId: string) => void;
  unlockSkin: (skinId: string) => void;
  equipSkin: (museId: string, skinId: string) => void;
  isSkinUnlocked: (skinId: string) => boolean;
  getEquippedSkin: (museId: string) => MuseSkin | null;
  activateMuseSkill: (museId: string) => boolean;
  tickSkillStates: (deltaMs: number) => void;
  activateMuseTap: (museId: string, voiceId: string, now: number) => boolean;
  tickMuseTapStates: (now: number) => void;
  unlockSkillNode: (skillNodeId: string) => void;
  reboot: () => boolean;
  manualSave: () => void;
  autoSave: () => void;
  setSaveStatus: (status: SaveStatus) => void;
  clearSaveStatus: () => void;
  dismissOfflineReward: () => void;
  dismissMuseUnlock: () => void;
  dismissSkinUnlock: () => void;
  dismissStageClear: () => void;
  dismissBackfillRewards: () => void;
  triggerCornerHitFlash: (corner: CornerHitPosition) => void;
  refreshMemoryPerSecond: (motionIntensity: MotionIntensity) => void;
  debugAddMemory: (amount: number) => void;
  debugAddFragments: (amount: number) => void;
  debugTriggerCornerHit: () => void;
  debugCompleteCurrentStage: () => void;
  debugShowBackfillRewards: (stageCount: number) => void;
  debugActivateMuseSkill: (museId: string) => void;
  debugActivateMuseTap: (museId: string) => void;
}

export type GameStore = GameState & GameActions;
