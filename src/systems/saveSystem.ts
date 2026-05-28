import { backgrounds, getBackgroundById } from '../data/backgrounds';
import { createInitialMuseTapStates, getMuseById, initialActiveMuseIds } from '../data/muses';
import {
  createInitialStageCornerHits,
  getStageById,
  initialStageId,
  stages,
} from '../data/stages';
import { createInitialUpgrades, upgradeIds } from '../data/upgrades';
import { createInitialSkillNodes, skillNodes } from '../data/skillTree';
import { calculateOfflineReward } from '../game/offlineReward';
import { calculateOfflineMemoryPerSecond } from '../game/rewardCalculator';
import { createInitialSkillStates } from '../game/skillEffects';
import type { GameState, SaveData, UpgradeCollection, UpgradeId } from '../types/game';
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
      | 'unlockedBackgrounds'
      | 'currentBackgroundId'
      | 'activeMuseIds'
      | 'fragments'
      | 'unlockedSkillNodes'
      | 'rebootCount'
      | 'lastSavedAt'
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
  'currentStageId' | 'stageCornerHits' | 'clearedStages'
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

  return {
    currentStageId,
    stageCornerHits,
    clearedStages: [...new Set(clearedStages)],
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
    .flatMap((stage) => [
      stage.rewardBackgroundId,
      ...backgrounds
        .filter((background) => background.unlockStageId === stage.id)
        .map((background) => background.id),
    ])
    .filter((backgroundId) => getBackgroundById(backgroundId) !== undefined);
  const savedBackgrounds = Array.isArray(data.unlockedBackgrounds)
    ? data.unlockedBackgrounds.filter(
        (backgroundId): backgroundId is string =>
          typeof backgroundId === 'string' && getBackgroundById(backgroundId) !== undefined,
      )
    : [];
  const unlockedBackgrounds = [...new Set([...clearedRewards, ...savedBackgrounds])];
  const currentBackgroundId =
    typeof data.currentBackgroundId === 'string' &&
    unlockedBackgrounds.includes(data.currentBackgroundId)
      ? data.currentBackgroundId
      : (unlockedBackgrounds[0] ?? null);

  return { unlockedBackgrounds, currentBackgroundId };
}

function restoreMuseState(data: CompatibleSaveData): Pick<GameState, 'activeMuseIds'> {
  const activeMuseIds = Array.isArray(data.activeMuseIds)
    ? data.activeMuseIds.filter(
        (museId): museId is string =>
          typeof museId === 'string' && getMuseById(museId)?.unlocked === true,
      )
    : initialActiveMuseIds;

  return {
    activeMuseIds: [...new Set(activeMuseIds)].slice(0, 3).length
      ? [...new Set(activeMuseIds)].slice(0, 3)
      : initialActiveMuseIds,
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

export function createNewGameState(motionIntensity: MotionIntensity = 'medium'): GameState {
  const state: GameState = {
    memory: 0,
    memoryPerSecond: 0,
    totalBounces: 0,
    totalCornerHits: 0,
    upgrades: createInitialUpgrades(),
    currentStageId: initialStageId,
    stageCornerHits: createInitialStageCornerHits(),
    clearedStages: [],
    unlockedBackgrounds: [],
    currentBackgroundId: null,
    activeMuseIds: initialActiveMuseIds,
    skillStates: createInitialSkillStates(),
    museTapStates: createInitialMuseTapStates(),
    fragments: 0,
    unlockedSkillNodes: createInitialSkillNodes(),
    rebootCount: 0,
    pendingOfflineReward: null,
    pendingStageClear: null,
    lastCornerHitFlash: null,
  };

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
      upgrades: restoreUpgrades(parsedData.upgrades),
      ...stageState,
      ...restoreBackgroundState(parsedData, stageState.clearedStages),
      ...restoreMuseState(parsedData),
      skillStates: createInitialSkillStates(),
      museTapStates: createInitialMuseTapStates(),
      ...restoreSkillTreeState(parsedData),
      pendingOfflineReward: null,
      pendingStageClear: null,
      lastCornerHitFlash: null,
    };
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
          pendingOfflineReward: offlineReward,
        }
      : restoredState;
  } catch {
    window.localStorage.removeItem(storageKey);
    return defaultState;
  }
}

export function saveGameState(state: GameState, motionIntensity: MotionIntensity = 'medium'): void {
  if (typeof window === 'undefined') {
    return;
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
    unlockedBackgrounds: state.unlockedBackgrounds,
    currentBackgroundId: state.currentBackgroundId,
    activeMuseIds: state.activeMuseIds,
    fragments: state.fragments,
    unlockedSkillNodes: state.unlockedSkillNodes,
    rebootCount: state.rebootCount,
    lastSavedAt: Date.now(),
  };

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // Storage can be unavailable or full; gameplay should continue in memory.
  }
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
