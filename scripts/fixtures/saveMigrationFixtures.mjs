export const legacyCoreSave = {
  saveVersion: 1,
  memory: 456,
  memoryPerSecond: 0,
  totalBounces: 72,
  totalCornerHits: 3,
  upgrades: {
    bounce_boost: 2,
    speed_tune: 1,
    corner_sensor: 0,
  },
};

export const expandedProgressSave = {
  ...legacyCoreSave,
  memory: 12_345,
  currentStageId: 'stage-2',
  stageCornerHits: {
    'stage-1': 100,
    'stage-2': 28,
    removed_stage: 999,
  },
  clearedStages: ['stage-1', 'removed_stage'],
  unlockedBackgrounds: ['bg_cozy_room', 'removed_background'],
  currentBackgroundId: 'bg_cozy_room',
  activeMuseIds: ['astra', 'noir', 'removed_muse'],
  fragments: 5,
  unlockedSkillNodes: {
    bounce_memory_1: 99,
    passive_cache: 1,
    removed_skill: 1,
  },
  rebootCount: 2,
};

export const savedSettings = {
  bgmVolume: 42,
  seVolume: 55,
  language: 'en',
  effectsQuality: 'high',
  motionIntensity: 'low',
  autoSaveEnabled: false,
};

export const legacySettings = {
  bgmVolume: 66,
  seVolume: 77,
  language: 'en',
  effectsQuality: 'high',
  autoSaveEnabled: false,
};

export const incompleteSettings = {
  bgmVolume: 42,
  seVolume: 55,
  language: 'en',
};
