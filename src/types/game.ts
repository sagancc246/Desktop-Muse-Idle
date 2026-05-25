export type UpgradeId = 'bounce_boost' | 'speed_tune' | 'corner_sensor';

export type UpgradeEffectType = 'bounce_reward' | 'speed' | 'corner_reward';

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

export interface Muse {
  id: string;
  name: string;
  iconAsset: string;
  unlocked: boolean;
  baseSpeed: number;
  memoryMultiplier: number;
  cornerMultiplier: number;
  skill: MuseSkill;
}

export type Language = 'ja' | 'en';

export type EffectsQuality = 'low' | 'medium' | 'high';

export interface AppSettings {
  bgmVolume: number;
  seVolume: number;
  language: Language;
  effectsQuality: EffectsQuality;
  autoSaveEnabled: boolean;
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
}

export type GameStore = GameState & GameActions;
