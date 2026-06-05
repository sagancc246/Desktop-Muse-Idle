import {
  getBackgroundById,
  initialBackgroundId,
  initialUnlockedBackgroundIds,
} from '../data/backgrounds';
import {
  createInitialMuseTapStates,
  getMuseById,
  initialActiveMuseIds,
} from '../data/muses';
import {
  createInitialStageCornerHits,
  getStageById,
  initialStageId,
  legacyClaimedRewardIdsByStageId,
  stages,
} from '../data/stages';
import {
  createInitialEquippedSkinByMuseId,
  getDefaultSkinForMuse,
  getSkinById,
  initialUnlockedSkinIds,
  museSkins,
} from '../data/skins';
import { createInitialUpgrades, upgradeIds } from '../data/upgrades';
import { createInitialSkillNodes, skillNodes } from '../data/skillTree';
import { calculateOfflineReward } from '../game/offlineReward';
import { calculateOfflineMemoryPerSecond } from '../game/rewardCalculator';
import { createInitialSkillStates } from '../game/skillEffects';
import { createInitialStats, getStageNumber, normalizeStats } from '../game/statsTracker';
import {
  getInitialUnlockedMuseIds,
  getUnlockableMuseIds,
  isKnownMuseId,
} from '../game/unlockChecker';
import type { GameState, SaveData, SaveResult, UpgradeCollection, UpgradeId } from '../types/game';
import type { MotionIntensity } from '../types/game';

export const saveVersion = 1;

const storageKey = 'desktop-muse-idle-save';
const autoSaveIntervalMs = 10_000;

type CompatibleSaveData = Pick<
  SaveData,
  'saveVersion' | 'memory' | 'memoryPerSecond' | 'totalBounces' | 'totalCornerHits' | 'upgrades'
> &
  Partial<
    Pick<
      SaveData,
      | 'currentStageId'
      | 'stageCornerHits'
      | 'clearedStages'
      | 'claimedRewardIds'
      | 'claimedStageRewardIds'
      | 'unlockedBackgrounds'
      | 'currentBackgroundId'
      | 'unlockedMuseIds'
      | 'activeMuseIds'
      | 'unlockedSkinIds'
      | 'equippedSkinByMuseId'
      | 'fragments'
      | 'capsuleCount'
      | 'unlockedSkillNodes'
      | 'rebootCount'
      | 'lastSavedAt'
      | 'stats'
    >
  >;

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isUpgradeLevels(value: unknown): value is Record<UpgradeId, number> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return upgradeIds.every((upgradeId) => {
    const level = (value as Record<string, unknown>)[upgradeId];
    return Number.isInteger(level) && isNonNegativeNumber(level);
  });
}

function isSaveData(value: unknown): value is CompatibleSaveData {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const data = value as Partial<SaveData>;

  return (
    data.saveVersion === saveVersion &&
    isNonNegativeNumber(data.memory) &&
    isNonNegativeNumber(data.memoryPerSecond) &&
    isNonNegativeNumber(data.totalBounces) &&
    isNonNegativeNumber(data.totalCornerHits) &&
    isUpgradeLevels(data.upgrades)
  );
}

function restoreStageState(data: CompatibleSaveData): Pick<
  GameState,
  | 'currentStageId'
  | 'stageCornerHits'
  | 'clearedStages'
  | 'claimedRewardIds'
  | 'claimedStageRewardIds'
> {
  const defaultStageHits = createInitialStageCornerHits();
  const storedHits =
    data.stageCornerHits && typeof data.stageCornerHits === 'object'
      ? data.stageCornerHits
      : {};

  const stageCornerHits = Object.fromEntries(
    stages.map((stage) => {
      const value = storedHits[stage.id];
      const hits = isNonNegativeNumber(value)
        ? Math.min(Math.floor(value), stage.cornerHitGoal)
        : defaultStageHits[stage.id];

      return [stage.id, hits];
    }),
  );
  const clearedStages = Array.isArray(data.clearedStages)
    ? data.clearedStages.filter(
        (stageId): stageId is string =>
          typeof stageId === 'string' &&
          getStageById(stageId) !== undefined &&
          stageCornerHits[stageId] >= (getStageById(stageId)?.cornerHitGoal ?? Infinity),
      )
    : [];
  const currentStageId =
    typeof data.currentStageId === 'string' && getStageById(data.currentStageId)
      ? data.currentStageId
      : initialStageId;
  const claimedStageRewardIds = Array.isArray(data.claimedStageRewardIds)
    ? data.claimedStageRewardIds.filter(
        (stageId): stageId is string =>
          typeof stageId === 'string' && getStageById(stageId) !== undefined,
      )
    : [];
  const rawClaimedRewardIds = data.claimedRewardIds;
  const hasStoredClaimedRewardIds = Array.isArray(rawClaimedRewardIds);
  const storedClaimedRewardIds = hasStoredClaimedRewardIds
    ? rawClaimedRewardIds.filter(
        (claimId): claimId is string => typeof claimId === 'string' && claimId.length > 0,
      )
    : [];
  const migratedClaimedRewardIds =
    hasStoredClaimedRewardIds
      ? storedClaimedRewardIds
      : claimedStageRewardIds.flatMap((stageId) =>
          (legacyClaimedRewardIdsByStageId[stageId] ?? []).map(
            (rewardId) => `${stageId}:${rewardId}`,
          ),
        );

  return {
    currentStageId,
    stageCornerHits,
    clearedStages: [...new Set(clearedStages)],
    claimedRewardIds: [...new Set(migratedClaimedRewardIds)],
    claimedStageRewardIds: [...new Set(claimedStageRewardIds)],
  };
}

function restoreUpgrades(levels: Record<UpgradeId, number>): UpgradeCollection {
  const upgrades = createInitialUpgrades();

  for (const upgradeId of upgradeIds) {
    upgrades[upgradeId].level = levels[upgradeId];
  }

  return upgrades;
}

function restoreBackgroundState(
  data: CompatibleSaveData,
  clearedStages: string[],
): Pick<GameState, 'unlockedBackgrounds' | 'currentBackgroundId'> {
  const clearedRewards = stages
    .filter((stage) => clearedStages.includes(stage.id))
    .flatMap((stage) =>
      stage.rewards
        .filter((reward) => reward.type === 'background')
        .map((reward) => reward.id),
    )
    .filter((backgroundId) => getBackgroundById(backgroundId) !== undefined);
  const savedBackgrounds = Array.isArray(data.unlockedBackgrounds)
    ? data.unlockedBackgrounds.filter(
        (backgroundId): backgroundId is string =>
          typeof backgroundId === 'string' && getBackgroundById(backgroundId) !== undefined,
      )
    : [];
  const unlockedBackgrounds = [
    ...new Set([...initialUnlockedBackgroundIds, ...clearedRewards, ...savedBackgrounds]),
  ];
  const currentBackgroundId =
    typeof data.currentBackgroundId === 'string' &&
    unlockedBackgrounds.includes(data.currentBackgroundId)
      ? data.currentBackgroundId
      : (initialBackgroundId ?? unlockedBackgrounds[0] ?? null);

  return { unlockedBackgrounds, currentBackgroundId };
}

function restoreMuseState(
  data: CompatibleSaveData,
  stageState: Pick<GameState, 'clearedStages'>,
): Pick<GameState, 'unlockedMuseIds' | 'activeMuseIds' | 'newlyUnlockedMuseIds'> {
  const baseUnlockedMuseIds = getInitialUnlockedMuseIds();
  const savedUnlockedMuseIds = Array.isArray(data.unlockedMuseIds)
    ? data.unlockedMuseIds.filter(
        (museId): museId is string => typeof museId === 'string' && isKnownMuseId(museId),
      )
    : [];
  const unlockState = {
    clearedStages: stageState.clearedStages,
    rebootCount: isNonNegativeNumber(data.rebootCount) ? Math.floor(data.rebootCount) : 0,
    totalCornerHits: data.totalCornerHits,
    unlockedMuseIds: [...new Set([...baseUnlockedMuseIds, ...savedUnlockedMuseIds])],
  };
  const unlockedMuseIds = [
    ...new Set([...unlockState.unlockedMuseIds, ...getUnlockableMuseIds(unlockState)]),
  ];
  const activeMuseIds = Array.isArray(data.activeMuseIds)
    ? data.activeMuseIds.filter(
        (museId): museId is string =>
          typeof museId === 'string' &&
          getMuseById(museId) !== undefined &&
          unlockedMuseIds.includes(museId),
      )
    : initialActiveMuseIds;

  return {
    unlockedMuseIds,
    activeMuseIds: [...new Set(activeMuseIds)].slice(0, 3).length
      ? [...new Set(activeMuseIds)].slice(0, 3)
      : initialActiveMuseIds,
    newlyUnlockedMuseIds: [],
  };
}

function restoreSkillTreeState(
  data: CompatibleSaveData,
): Pick<GameState, 'fragments' | 'unlockedSkillNodes' | 'rebootCount'> {
  const storedNodes =
    data.unlockedSkillNodes && typeof data.unlockedSkillNodes === 'object'
      ? data.unlockedSkillNodes
      : {};
  const unlockedSkillNodes = createInitialSkillNodes();

  for (const skillNode of skillNodes) {
    const level = storedNodes[skillNode.id];
    if (Number.isInteger(level) && isNonNegativeNumber(level)) {
      unlockedSkillNodes[skillNode.id] = Math.min(Math.floor(level), skillNode.maxLevel);
    }
  }

  return {
    fragments: isNonNegativeNumber(data.fragments) ? Math.floor(data.fragments) : 0,
    unlockedSkillNodes,
    rebootCount: isNonNegativeNumber(data.rebootCount) ? Math.floor(data.rebootCount) : 0,
  };
}

function restoreSkinState(
  data: CompatibleSaveData,
): Pick<GameState, 'unlockedSkinIds' | 'equippedSkinByMuseId'> {
  const savedSkinIds = Array.isArray(data.unlockedSkinIds)
    ? data.unlockedSkinIds.filter(
        (skinId): skinId is string => typeof skinId === 'string' && getSkinById(skinId) !== undefined,
      )
    : [];
  const unlockedSkinIds = [...new Set([...initialUnlockedSkinIds, ...savedSkinIds])];
  const storedEquipped =
    data.equippedSkinByMuseId && typeof data.equippedSkinByMuseId === 'object'
      ? data.equippedSkinByMuseId
      : {};
  const defaultEquipped = createInitialEquippedSkinByMuseId();
  const equippedSkinByMuseId = Object.fromEntries(
    [...new Set(museSkins.map((skin) => skin.museId))].map((museId) => {
      const savedSkinId = (storedEquipped as Record<string, unknown>)[museId];
      const savedSkin = typeof savedSkinId === 'string' ? getSkinById(savedSkinId) : undefined;
      const defaultSkin = getDefaultSkinForMuse(museId);
      const equippedSkinId =
        savedSkin && savedSkin.museId === museId && unlockedSkinIds.includes(savedSkin.id)
          ? savedSkin.id
          : (defaultSkin?.id ?? defaultEquipped[museId]);

      return [museId, equippedSkinId];
    }),
  );

  return { unlockedSkinIds, equippedSkinByMuseId };
}

export function createNewGameState(motionIntensity: MotionIntensity = 'medium'): GameState {
  const state: GameState = {
    memory: 0,
    memoryPerSecond: 0,
    totalBounces: 0,
    totalCornerHits: 0,
    stats: createInitialStats(),
    upgrades: createInitialUpgrades(),
    currentStageId: initialStageId,
    stageCornerHits: createInitialStageCornerHits(),
    clearedStages: [],
    claimedRewardIds: [],
    claimedStageRewardIds: [],
    unlockedBackgrounds: initialUnlockedBackgroundIds,
    currentBackgroundId: initialBackgroundId,
    unlockedMuseIds: getInitialUnlockedMuseIds(),
    activeMuseIds: initialActiveMuseIds,
    newlyUnlockedMuseIds: [],
    unlockedSkinIds: initialUnlockedSkinIds,
    equippedSkinByMuseId: createInitialEquippedSkinByMuseId(),
    newlyUnlockedSkinIds: [],
    skillStates: createInitialSkillStates(),
    museTapStates: createInitialMuseTapStates(),
    fragments: 0,
    capsuleCount: 0,
    unlockedSkillNodes: createInitialSkillNodes(),
    rebootCount: 0,
    saveStatus: 'idle',
    lastSavedAt: null,
    lastSaveError: null,
    lastSaveSource: null,
    pendingOfflineReward: null,
    pendingStageClear: null,
    pendingBackfillRewards: null,
    lastCornerHitFlash: null,
  };
  state.stats.unlockedBackgroundCount = state.unlockedBackgrounds.length;

  state.memoryPerSecond = calculateOfflineMemoryPerSecond(
    state.upgrades,
    state.unlockedSkillNodes,
    state.activeMuseIds,
    motionIntensity,
  );

  return state;
}

export function hasSaveData(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const serializedData = window.localStorage.getItem(storageKey);
    return serializedData !== null && isSaveData(JSON.parse(serializedData));
  } catch {
    return false;
  }
}

export function clearSaveData(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(storageKey);
  }
}

interface LoadGameStateOptions {
  applyOfflineReward?: boolean;
  motionIntensity?: MotionIntensity;
  now?: number;
}

export function loadGameState({
  applyOfflineReward = false,
  motionIntensity = 'medium',
  now = Date.now(),
}: LoadGameStateOptions = {}): GameState {
  const defaultState = createNewGameState(motionIntensity);

  if (typeof window === 'undefined') {
    return defaultState;
  }

  try {
    const serializedData = window.localStorage.getItem(storageKey);

    if (!serializedData) {
      return defaultState;
    }

    const parsedData: unknown = JSON.parse(serializedData);

    if (!isSaveData(parsedData)) {
      window.localStorage.removeItem(storageKey);
      return defaultState;
    }

    const stageState = restoreStageState(parsedData);
    const restoredState: GameState = {
      memory: parsedData.memory,
      memoryPerSecond: 0,
      totalBounces: parsedData.totalBounces,
      totalCornerHits: parsedData.totalCornerHits,
      stats: normalizeStats(parsedData.stats, {
        highestStageReached: Math.max(1, getStageNumber(stageState.currentStageId)),
        rebootCount: isNonNegativeNumber(parsedData.rebootCount) ? Math.floor(parsedData.rebootCount) : 0,
        totalCornerHits: Math.floor(parsedData.totalCornerHits),
        totalMemoryEarned: parsedData.memory,
        totalWallHits: Math.floor(parsedData.totalBounces),
      }),
      upgrades: restoreUpgrades(parsedData.upgrades),
      ...stageState,
      ...restoreBackgroundState(parsedData, stageState.clearedStages),
      ...restoreMuseState(parsedData, stageState),
      ...restoreSkinState(parsedData),
      newlyUnlockedSkinIds: [],
      skillStates: createInitialSkillStates(),
      museTapStates: createInitialMuseTapStates(),
      ...restoreSkillTreeState(parsedData),
      capsuleCount: isNonNegativeNumber(parsedData.capsuleCount)
        ? Math.floor(parsedData.capsuleCount)
        : 0,
      saveStatus: 'idle',
      lastSavedAt: isNonNegativeNumber(parsedData.lastSavedAt) ? parsedData.lastSavedAt : null,
      lastSaveError: null,
      lastSaveSource: null,
      pendingOfflineReward: null,
      pendingStageClear: null,
      pendingBackfillRewards: null,
      lastCornerHitFlash: null,
    };
    restoredState.stats.unlockedBackgroundCount = restoredState.unlockedBackgrounds.length;
    restoredState.memoryPerSecond = calculateOfflineMemoryPerSecond(
      restoredState.upgrades,
      restoredState.unlockedSkillNodes,
      restoredState.activeMuseIds,
      motionIntensity,
    );

    if (!applyOfflineReward) {
      return restoredState;
    }

    const offlineReward = calculateOfflineReward({
      lastSavedAt: isNonNegativeNumber(parsedData.lastSavedAt)
        ? parsedData.lastSavedAt
        : undefined,
      memoryPerSecond: parsedData.memoryPerSecond,
      now,
      unlockedSkillNodes: restoredState.unlockedSkillNodes,
    });

    return offlineReward
      ? {
          ...restoredState,
          memory: restoredState.memory + offlineReward.memoryEarned,
          stats: {
            ...restoredState.stats,
            totalMemoryEarned: restoredState.stats.totalMemoryEarned + offlineReward.memoryEarned,
          },
          pendingOfflineReward: offlineReward,
        }
      : restoredState;
  } catch {
    window.localStorage.removeItem(storageKey);
    return defaultState;
  }
}

export function saveGameState(
  state: GameState,
  motionIntensity: MotionIntensity = 'medium',
): SaveResult {
  const savedAt = Date.now();

  if (typeof window === 'undefined') {
    return { savedAt: null, success: false, error: 'LocalStorage is unavailable.' };
  }

  const data: SaveData = {
    saveVersion,
    memory: state.memory,
    memoryPerSecond: calculateOfflineMemoryPerSecond(
      state.upgrades,
      state.unlockedSkillNodes,
      state.activeMuseIds,
      motionIntensity,
    ),
    totalBounces: state.totalBounces,
    totalCornerHits: state.totalCornerHits,
    upgrades: {
      bounce_boost: state.upgrades.bounce_boost.level,
      speed_tune: state.upgrades.speed_tune.level,
      corner_sensor: state.upgrades.corner_sensor.level,
    },
    currentStageId: state.currentStageId,
    stageCornerHits: state.stageCornerHits,
    clearedStages: state.clearedStages,
    claimedRewardIds: state.claimedRewardIds,
    claimedStageRewardIds: state.claimedStageRewardIds,
    unlockedBackgrounds: state.unlockedBackgrounds,
    currentBackgroundId: state.currentBackgroundId,
    unlockedMuseIds: state.unlockedMuseIds,
    activeMuseIds: state.activeMuseIds,
    unlockedSkinIds: state.unlockedSkinIds,
    equippedSkinByMuseId: state.equippedSkinByMuseId,
    fragments: state.fragments,
    capsuleCount: state.capsuleCount,
    unlockedSkillNodes: state.unlockedSkillNodes,
    rebootCount: state.rebootCount,
    lastSavedAt: savedAt,
    stats: state.stats,
  };

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(data));
    return { savedAt, success: true };
  } catch {
    return {
      savedAt: null,
      success: false,
      error: 'Unable to write save data.',
    };
  }
}

export function saveGame(
  state: GameState,
  motionIntensity: MotionIntensity = 'medium',
): SaveResult {
  return saveGameState(state, motionIntensity);
}

export function manualSave(
  state: GameState,
  motionIntensity: MotionIntensity = 'medium',
): SaveResult {
  return saveGameState(state, motionIntensity);
}

export function loadGame(options: LoadGameStateOptions = {}): GameState {
  return loadGameState(options);
}

export function startAutoSave(
  getState: () => GameState,
  getMotionIntensity: () => MotionIntensity = () => 'medium',
): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const intervalId = window.setInterval(
    () => saveGameState(getState(), getMotionIntensity()),
    autoSaveIntervalMs,
  );

  return () => window.clearInterval(intervalId);
}
