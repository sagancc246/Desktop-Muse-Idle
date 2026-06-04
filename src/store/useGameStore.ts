import { create } from 'zustand';
import { backgrounds, getBackgroundById } from '../data/backgrounds';
import { calculateRebootFragments } from '../data/balance';
import { museTapCooldownMs, museTapDurationMs } from '../data/balance';
import { getMuseById } from '../data/muses';
import { getEquippedSkinForMuse, getSkinById } from '../data/skins';
import { getSkillNodeById } from '../data/skillTree';
import { getNextStage, getStageById, initialStageId } from '../data/stages';
import { calculateUpgradeCost } from '../data/upgrades';
import { createInitialUpgrades } from '../data/upgrades';
import { createInitialSkillStates } from '../game/skillEffects';
import { activateSkillState, tickSkillStates } from '../game/skillEffects';
import { getStageNumber } from '../game/statsTracker';
import { getUnlockableMuseIds, isKnownMuseId } from '../game/unlockChecker';
import {
  calculateBounceReward,
  calculateCornerReward,
  calculateOfflineMemoryPerSecond,
} from '../game/rewardCalculator';
import {
  clearSaveData,
  createNewGameState,
  loadGameState,
  manualSave as writeManualSave,
  saveGame,
  saveGameState,
} from '../systems/saveSystem';
import type { GameState, GameStore, GrantedStageReward, StageReward } from '../types/game';
import type { MotionIntensity } from '../types/game';

const initialState = loadGameState();

function getCurrentMotionIntensity(): MotionIntensity {
  if (typeof window === 'undefined') {
    return 'medium';
  }

  try {
    const serializedSettings = window.localStorage.getItem('desktop-muse-idle-settings');
    if (!serializedSettings) {
      return 'medium';
    }

    const parsedSettings = JSON.parse(serializedSettings) as { motionIntensity?: unknown };
    return parsedSettings.motionIntensity === 'low' || parsedSettings.motionIntensity === 'high'
      ? parsedSettings.motionIntensity
      : 'medium';
  } catch {
    return 'medium';
  }
}

function withOfflineRate(
  state: GameState,
  updates: Partial<GameState>,
  motionIntensity = getCurrentMotionIntensity(),
): Partial<GameState> {
  const nextState = { ...state, ...updates };

  return {
    ...updates,
    memoryPerSecond: calculateOfflineMemoryPerSecond(
      nextState.upgrades,
      nextState.unlockedSkillNodes,
      nextState.activeMuseIds,
      motionIntensity,
    ),
  };
}

function withMuseUnlocks(state: GameState, updates: Partial<GameState>): Partial<GameState> {
  const nextState = { ...state, ...updates };
  const unlockedMuseIds = nextState.unlockedMuseIds ?? [];
  const unlockableMuseIds = getUnlockableMuseIds({
    clearedStages: nextState.clearedStages,
    rebootCount: nextState.rebootCount,
    totalCornerHits: nextState.totalCornerHits,
    unlockedMuseIds,
  });

  if (unlockableMuseIds.length === 0) {
    return updates;
  }

  return {
    ...updates,
    unlockedMuseIds: [...new Set([...unlockedMuseIds, ...unlockableMuseIds])],
    newlyUnlockedMuseIds: [
      ...nextState.newlyUnlockedMuseIds,
      ...unlockableMuseIds.filter((museId) => !nextState.newlyUnlockedMuseIds.includes(museId)),
    ],
  };
}

function applyCornerHitProgress(state: GameState, hitCount = 1): Partial<GameState> {
  let currentStageId = state.currentStageId;
  let currentBackgroundId = state.currentBackgroundId;
  let memory = state.memory;
  let capsuleCount = state.capsuleCount;
  let totalCornerHits = state.totalCornerHits;
  let pendingStageClear = state.pendingStageClear;
  const stageCornerHits = { ...state.stageCornerHits };
  const clearedStages = [...state.clearedStages];
  const unlockedBackgrounds = [...state.unlockedBackgrounds];
  const unlockedMuseIds = [...state.unlockedMuseIds];
  const newlyUnlockedMuseIds = [...state.newlyUnlockedMuseIds];
  const unlockedSkinIds = [...state.unlockedSkinIds];
  const newlyUnlockedSkinIds = [...state.newlyUnlockedSkinIds];
  let stageRewardMemoryEarned = 0;
  const safeHitCount = Math.max(0, Math.floor(hitCount));

  for (let hitIndex = 0; hitIndex < safeHitCount; hitIndex += 1) {
    totalCornerHits += 1;
    const currentStage = getStageById(currentStageId) ?? getStageById(initialStageId);

    if (!currentStage) {
      continue;
    }

    const stageHits = Math.min(
      (stageCornerHits[currentStage.id] ?? 0) + 1,
      currentStage.cornerHitGoal,
    );
    stageCornerHits[currentStage.id] = stageHits;

    const isNewClear =
      stageHits >= currentStage.cornerHitGoal && !clearedStages.includes(currentStage.id);

    if (!isNewClear) {
      continue;
    }

    clearedStages.push(currentStage.id);

    const stageRewards: StageReward[] = [...currentStage.rewards];
    const addLegacyReward = (reward: StageReward) => {
      if (
        !stageRewards.some(
          (candidate) => candidate.type === reward.type && candidate.id === reward.id,
        )
      ) {
        stageRewards.push(reward);
      }
    };
    addLegacyReward({ type: 'background', id: currentStage.rewardBackgroundId });
    for (const background of backgrounds.filter(
      (candidate) => candidate.unlockStageId === currentStage.id,
    )) {
      addLegacyReward({ type: 'background', id: background.id });
    }
    for (const skinId of currentStage.skinRewardIds ?? []) {
      addLegacyReward({ type: 'skin', id: skinId });
    }

    const grantedRewards: GrantedStageReward[] = [];
    for (const reward of stageRewards) {
      if (reward.type === 'background' && reward.id && getBackgroundById(reward.id)) {
        const alreadyOwned = unlockedBackgrounds.includes(reward.id);
        if (!alreadyOwned) {
          unlockedBackgrounds.push(reward.id);
        }
        if (currentBackgroundId === null) {
          currentBackgroundId = reward.id;
        }
        grantedRewards.push({ ...reward, alreadyOwned });
      } else if (reward.type === 'skin' && reward.id && getSkinById(reward.id)) {
        const alreadyOwned = unlockedSkinIds.includes(reward.id);
        if (!alreadyOwned) {
          unlockedSkinIds.push(reward.id);
          newlyUnlockedSkinIds.push(reward.id);
        }
        grantedRewards.push({ ...reward, alreadyOwned });
      } else if (reward.type === 'muse' && reward.id && getMuseById(reward.id)) {
        const alreadyOwned = unlockedMuseIds.includes(reward.id);
        if (!alreadyOwned) {
          unlockedMuseIds.push(reward.id);
          newlyUnlockedMuseIds.push(reward.id);
        }
        grantedRewards.push({ ...reward, alreadyOwned });
      } else if (reward.type === 'memory' && (reward.amount ?? 0) > 0) {
        const amount = Math.floor(reward.amount ?? 0);
        memory += amount;
        stageRewardMemoryEarned += amount;
        grantedRewards.push({ ...reward, amount, alreadyOwned: false });
      } else if (reward.type === 'capsule' && (reward.amount ?? 0) > 0) {
        const amount = Math.floor(reward.amount ?? 0);
        capsuleCount += amount;
        grantedRewards.push({ ...reward, amount, alreadyOwned: false });
      }
    }

    const nextStage = getNextStage(currentStage.id);
    pendingStageClear = {
      stageId: currentStage.id,
      stageName: currentStage.name,
      rewards: grantedRewards,
      nextStageId: nextStage?.id ?? null,
      nextStageName: nextStage?.name ?? null,
    };

    if (nextStage) {
      currentStageId = nextStage.id;
    }
  }

  return {
    totalCornerHits,
    memory,
    capsuleCount,
    stats: {
      ...state.stats,
      highestStageReached: Math.max(state.stats.highestStageReached, getStageNumber(currentStageId)),
      totalCornerHits: state.stats.totalCornerHits + safeHitCount,
      unlockedBackgroundCount: unlockedBackgrounds.length,
      totalMemoryEarned: state.stats.totalMemoryEarned + stageRewardMemoryEarned,
    },
    currentStageId,
    stageCornerHits,
    clearedStages,
    unlockedBackgrounds,
    currentBackgroundId,
    unlockedMuseIds,
    newlyUnlockedMuseIds,
    unlockedSkinIds,
    newlyUnlockedSkinIds,
    pendingStageClear,
  };
}

function applySaveResult(
  state: GameState,
  source: 'manual' | 'auto',
  save: typeof saveGame,
): Partial<GameState> {
  const result = save(state, getCurrentMotionIntensity());

  if (result.success) {
    return {
      saveStatus: 'saved',
      lastSavedAt: result.savedAt,
      lastSaveError: null,
      lastSaveSource: source,
    };
  }

  return {
    saveStatus: 'error',
    lastSavedAt: state.lastSavedAt,
    lastSaveError: result.error ?? 'Save failed.',
    lastSaveSource: source,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  addMemory: (amount) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    set((state) => ({
      memory: state.memory + amount,
      stats: {
        ...state.stats,
        totalMemoryEarned: state.stats.totalMemoryEarned + amount,
      },
    }));
  },

  incrementBounce: () => {
    set((state) => ({
      totalBounces: state.totalBounces + 1,
      stats: {
        ...state.stats,
        totalWallHits: state.stats.totalWallHits + 1,
      },
    }));
  },

  incrementCornerHit: () => {
    const previousStageClearId = get().pendingStageClear?.stageId;
    set((state) => withMuseUnlocks(state, applyCornerHitProgress(state)));
    if (get().pendingStageClear?.stageId !== previousStageClearId) {
      saveGameState(get(), getCurrentMotionIntensity());
    }
  },

  recordWallHit: (memoryEarned) => {
    if (!Number.isFinite(memoryEarned) || memoryEarned < 0) {
      return;
    }

    set((state) => ({
      memory: state.memory + memoryEarned,
      totalBounces: state.totalBounces + 1,
      stats: {
        ...state.stats,
        totalMemoryEarned: state.stats.totalMemoryEarned + memoryEarned,
        totalWallHits: state.stats.totalWallHits + 1,
      },
    }));
  },

  recordCornerHit: (memoryEarned) => {
    if (!Number.isFinite(memoryEarned) || memoryEarned < 0) {
      return;
    }

    const previousStageClearId = get().pendingStageClear?.stageId;
    set((state) => {
      const progress = applyCornerHitProgress(state);
      const progressStats = progress.stats ?? state.stats;

      return withMuseUnlocks(state, {
        ...progress,
        memory: (progress.memory ?? state.memory) + memoryEarned,
        stats: {
          ...progressStats,
          totalMemoryEarned: progressStats.totalMemoryEarned + memoryEarned,
        },
      });
    });
    if (get().pendingStageClear?.stageId !== previousStageClearId) {
      saveGameState(get(), getCurrentMotionIntensity());
    }
  },

  recordNearCorner: () => {
    set((state) => ({
      stats: {
        ...state.stats,
        totalNearCorners: state.stats.totalNearCorners + 1,
      },
    }));
  },

  recordJackpot: (memoryEarned) => {
    if (!Number.isFinite(memoryEarned) || memoryEarned < 0) {
      return;
    }

    set((state) => ({
      memory: state.memory + memoryEarned,
      stats: {
        ...state.stats,
        totalJackpots: state.stats.totalJackpots + 1,
        totalMemoryEarned: state.stats.totalMemoryEarned + memoryEarned,
      },
    }));
  },

  recordFeverStart: () => {
    set((state) => ({
      stats: {
        ...state.stats,
        totalFeverActivations: state.stats.totalFeverActivations + 1,
      },
    }));
  },

  recordStageReached: (stageNumber) => {
    if (!Number.isFinite(stageNumber) || stageNumber <= 0) {
      return;
    }

    set((state) => ({
      stats: {
        ...state.stats,
        highestStageReached: Math.max(state.stats.highestStageReached, Math.floor(stageNumber)),
      },
    }));
  },

  recordReboot: () => {
    set((state) => ({
      stats: {
        ...state.stats,
        rebootCount: state.stats.rebootCount + 1,
      },
    }));
  },

  updateUnlockedBackgroundCount: (count) => {
    if (!Number.isFinite(count) || count < 0) {
      return;
    }

    set((state) => ({
      stats: {
        ...state.stats,
        unlockedBackgroundCount: Math.floor(count),
      },
    }));
  },

  addPlayTime: (deltaMs) => {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) {
      return;
    }

    set((state) => ({
      stats: {
        ...state.stats,
        totalPlayTimeMs: state.stats.totalPlayTimeMs + deltaMs,
      },
    }));
  },

  purchaseUpgrade: (upgradeId) => {
    set((state) => {
      const upgrade = state.upgrades[upgradeId];
      const cost = calculateUpgradeCost(upgrade, upgrade.level);

      if (state.memory < cost) {
        return state;
      }

      return withOfflineRate(state, {
        memory: state.memory - cost,
        upgrades: {
          ...state.upgrades,
          [upgradeId]: {
            ...upgrade,
            level: upgrade.level + 1,
          },
        },
      });
    });
  },

  selectBackground: (backgroundId) => {
    set((state) => {
      if (!state.unlockedBackgrounds.includes(backgroundId) || !getBackgroundById(backgroundId)) {
        return state;
      }

      return { currentBackgroundId: backgroundId };
    });
  },

  startNewGame: () => {
    clearSaveData();
    set(createNewGameState(getCurrentMotionIntensity()));
  },

  continueGame: () => {
    const motionIntensity = getCurrentMotionIntensity();
    const restoredState = loadGameState({ applyOfflineReward: true, motionIntensity });
    set(restoredState);
    saveGameState(restoredState, motionIntensity);
  },

  resetSaveData: () => {
    clearSaveData();
    set(createNewGameState(getCurrentMotionIntensity()));
  },

  manualSave: () => {
    if (get().saveStatus === 'saving') {
      return;
    }

    set({ saveStatus: 'saving', lastSaveError: null, lastSaveSource: 'manual' });

    const completeManualSave = () => {
      set((state) => applySaveResult(state, 'manual', writeManualSave));
    };

    if (typeof window === 'undefined') {
      completeManualSave();
      return;
    }

    window.setTimeout(completeManualSave, 120);
  },

  autoSave: () => {
    if (get().saveStatus === 'saving') {
      return;
    }

    set((state) => applySaveResult(state, 'auto', saveGame));
  },

  setSaveStatus: (status) => {
    set({ saveStatus: status });
  },

  clearSaveStatus: () => {
    set({ saveStatus: 'idle', lastSaveError: null, lastSaveSource: null });
  },

  unlockMuse: (museId) => {
    set((state) => {
      if (!isKnownMuseId(museId) || state.unlockedMuseIds.includes(museId)) {
        return state;
      }

      return withOfflineRate(state, {
        unlockedMuseIds: [...state.unlockedMuseIds, museId],
        newlyUnlockedMuseIds: [...state.newlyUnlockedMuseIds, museId],
      });
    });
  },

  checkMuseUnlocks: () => {
    set((state) => withMuseUnlocks(state, {}));
  },

  setActiveMuses: (museIds) => {
    set((state) => {
      const activeMuseIds = [...new Set(museIds)]
        .filter((museId) => isKnownMuseId(museId) && state.unlockedMuseIds.includes(museId))
        .slice(0, 3);

      return withOfflineRate(state, {
        activeMuseIds: activeMuseIds.length ? activeMuseIds : ['lumi'],
      });
    });
  },

  toggleActiveMuse: (museId) => {
    set((state) => {
      const muse = getMuseById(museId);

      if (!muse || !state.unlockedMuseIds.includes(museId)) {
        return state;
      }

      if (state.activeMuseIds.includes(museId)) {
        return state.activeMuseIds.length === 1
          ? state
          : withOfflineRate(state, {
              activeMuseIds: state.activeMuseIds.filter((activeId) => activeId !== museId),
            });
      }

      if (state.activeMuseIds.length >= 3) {
        return state;
      }

      return withOfflineRate(state, { activeMuseIds: [...state.activeMuseIds, museId] });
    });
  },

  unlockSkin: (skinId) => {
    set((state) => {
      const skin = getSkinById(skinId);

      if (!skin || state.unlockedSkinIds.includes(skin.id)) {
        return state;
      }

      return {
        unlockedSkinIds: [...state.unlockedSkinIds, skin.id],
        newlyUnlockedSkinIds: [...state.newlyUnlockedSkinIds, skin.id],
      };
    });
    saveGameState(get(), getCurrentMotionIntensity());
  },

  equipSkin: (museId, skinId) => {
    set((state) => {
      const skin = getSkinById(skinId);

      if (
        !skin ||
        skin.museId !== museId ||
        !state.unlockedMuseIds.includes(museId) ||
        !state.unlockedSkinIds.includes(skin.id)
      ) {
        return state;
      }

      return {
        equippedSkinByMuseId: {
          ...state.equippedSkinByMuseId,
          [museId]: skin.id,
        },
      };
    });
    saveGameState(get(), getCurrentMotionIntensity());
  },

  isSkinUnlocked: (skinId) => {
    return get().unlockedSkinIds.includes(skinId);
  },

  getEquippedSkin: (museId) => {
    return getEquippedSkinForMuse(museId, get().equippedSkinByMuseId) ?? null;
  },

  activateMuseSkill: (museId) => {
    const muse = getMuseById(museId);
    const skillState = get().skillStates[museId];

    if (!muse || !skillState || skillState.cooldownRemainingMs > 0) {
      return false;
    }

    set((state) => ({
      skillStates: activateSkillState(state.skillStates, muse, state.unlockedSkillNodes),
    }));
    return true;
  },

  tickSkillStates: (deltaMs) => {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) {
      return;
    }

    set((state) => ({ skillStates: tickSkillStates(state.skillStates, deltaMs) }));
  },

  activateMuseTap: (museId, voiceId, now) => {
    const tapState = get().museTapStates[museId];
    const muse = getMuseById(museId);

    if (
      !muse ||
      !tapState ||
      !muse.tapVoices.some((tapVoice) => tapVoice.id === voiceId) ||
      tapState.isTapBoostActive ||
      now < tapState.tapCooldownEndsAt
    ) {
      return false;
    }

    set((state) => ({
      museTapStates: {
        ...state.museTapStates,
        [museId]: {
          isTapBoostActive: true,
          tapBoostEndsAt: now + museTapDurationMs,
          tapCooldownEndsAt: now + museTapCooldownMs,
          lastTapVoiceId: voiceId,
        },
      },
    }));
    return true;
  },

  tickMuseTapStates: (now) => {
    set((state) => {
      const hasTimedState = Object.values(state.museTapStates).some(
        (tapState) => tapState.isTapBoostActive || now < tapState.tapCooldownEndsAt,
      );

      if (!hasTimedState) {
        return state;
      }

      return {
        museTapStates: Object.fromEntries(
          Object.entries(state.museTapStates).map(([museId, tapState]) => [
            museId,
            {
              ...tapState,
              isTapBoostActive: tapState.isTapBoostActive && now < tapState.tapBoostEndsAt,
            },
          ]),
        ),
      };
    });
  },

  unlockSkillNode: (skillNodeId) => {
    set((state) => {
      const skillNode = getSkillNodeById(skillNodeId);

      if (!skillNode) {
        return state;
      }

      const level = state.unlockedSkillNodes[skillNode.id] ?? 0;
      const prerequisitesMet = skillNode.requiredNodeIds.every(
        (requiredNodeId) => (state.unlockedSkillNodes[requiredNodeId] ?? 0) > 0,
      );

      if (!prerequisitesMet || level >= skillNode.maxLevel || state.fragments < skillNode.cost) {
        return state;
      }

      return withOfflineRate(state, {
        fragments: state.fragments - skillNode.cost,
        unlockedSkillNodes: {
          ...state.unlockedSkillNodes,
          [skillNode.id]: level + 1,
        },
      });
    });
    saveGameState(get(), getCurrentMotionIntensity());
  },

  reboot: () => {
    const gainedFragments = calculateRebootFragments(get().memory);

    if (gainedFragments <= 0) {
      return false;
    }

    set((state) => withMuseUnlocks(state, withOfflineRate(state, {
      memory: 0,
      upgrades: createInitialUpgrades(),
      fragments: state.fragments + gainedFragments,
      rebootCount: state.rebootCount + 1,
      stats: {
        ...state.stats,
        rebootCount: state.stats.rebootCount + 1,
      },
      skillStates: createInitialSkillStates(),
      museTapStates: Object.fromEntries(
        Object.entries(state.museTapStates).map(([museId, tapState]) => [
          museId,
          {
            ...tapState,
            isTapBoostActive: false,
            tapBoostEndsAt: 0,
            tapCooldownEndsAt: 0,
          },
        ]),
      ),
    })));
    saveGameState(get(), getCurrentMotionIntensity());
    return true;
  },

  dismissOfflineReward: () => {
    set({ pendingOfflineReward: null });
  },

  dismissMuseUnlock: () => {
    set((state) => ({ newlyUnlockedMuseIds: state.newlyUnlockedMuseIds.slice(1) }));
  },

  dismissSkinUnlock: () => {
    set((state) => ({ newlyUnlockedSkinIds: state.newlyUnlockedSkinIds.slice(1) }));
  },

  dismissStageClear: () => {
    set((state) => {
      const skinRewardIds = new Set(
        state.pendingStageClear?.rewards
          .filter((reward) => reward.type === 'skin' && reward.id)
          .map((reward) => reward.id as string) ?? [],
      );
      const museRewardIds = new Set(
        state.pendingStageClear?.rewards
          .filter((reward) => reward.type === 'muse' && reward.id)
          .map((reward) => reward.id as string) ?? [],
      );

      return {
        pendingStageClear: null,
        newlyUnlockedSkinIds: state.newlyUnlockedSkinIds.filter(
          (skinId) => !skinRewardIds.has(skinId),
        ),
        newlyUnlockedMuseIds: state.newlyUnlockedMuseIds.filter(
          (museId) => !museRewardIds.has(museId),
        ),
      };
    });
    saveGameState(get(), getCurrentMotionIntensity());
  },

  triggerCornerHitFlash: (corner) => {
    set({ lastCornerHitFlash: { corner, occurredAt: Date.now() } });
  },

  refreshMemoryPerSecond: (motionIntensity) => {
    set((state) =>
      withOfflineRate(
        state,
        {
          memoryPerSecond: state.memoryPerSecond,
        },
        motionIntensity,
      ),
    );
  },

  debugAddMemory: (amount) => {
    if (!import.meta.env.DEV || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    set((state) => ({ memory: state.memory + amount }));
  },

  debugAddFragments: (amount) => {
    if (!import.meta.env.DEV || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    set((state) => ({ fragments: state.fragments + Math.floor(amount) }));
  },

  debugTriggerCornerHit: () => {
    if (!import.meta.env.DEV) {
      return;
    }

    const previousStageClearId = get().pendingStageClear?.stageId;
    set((state) => {
      const motionIntensity = getCurrentMotionIntensity();
      const bounceReward = calculateBounceReward(
        state.upgrades,
        state.unlockedSkillNodes,
        motionIntensity,
      );
      const cornerReward = calculateCornerReward(
        state.upgrades,
        state.unlockedSkillNodes,
        motionIntensity,
      );

      const progress = applyCornerHitProgress(state);
      const progressStats = progress.stats ?? state.stats;

      return withMuseUnlocks(state, {
        ...progress,
        memory: (progress.memory ?? state.memory) + bounceReward + cornerReward,
        totalBounces: state.totalBounces + 1,
        stats: {
          ...progressStats,
          totalMemoryEarned:
            progressStats.totalMemoryEarned + bounceReward + cornerReward,
          totalWallHits: state.stats.totalWallHits + 1,
        },
        lastCornerHitFlash: { corner: 'top_left', occurredAt: Date.now() },
      });
    });
    if (get().pendingStageClear?.stageId !== previousStageClearId) {
      saveGameState(get(), getCurrentMotionIntensity());
    }
  },

  debugCompleteCurrentStage: () => {
    if (!import.meta.env.DEV) {
      return;
    }

    const previousStageClearId = get().pendingStageClear?.stageId;
    set((state) => {
      const currentStage = getStageById(state.currentStageId);

      if (!currentStage) {
        return state;
      }

      const currentHits = state.stageCornerHits[currentStage.id] ?? 0;
      const remainingHits = Math.max(0, currentStage.cornerHitGoal - currentHits);

      if (remainingHits === 0 && state.clearedStages.includes(currentStage.id)) {
        return state;
      }

      return withMuseUnlocks(state, applyCornerHitProgress(state, Math.max(1, remainingHits)));
    });
    if (get().pendingStageClear?.stageId !== previousStageClearId) {
      saveGameState(get(), getCurrentMotionIntensity());
    }
  },

  debugActivateMuseSkill: (museId) => {
    if (!import.meta.env.DEV) {
      return;
    }

    const muse = getMuseById(museId);

    if (!muse) {
      return;
    }

    set((state) => ({
      skillStates: activateSkillState(state.skillStates, muse, state.unlockedSkillNodes),
    }));
  },

  debugActivateMuseTap: (museId) => {
    if (!import.meta.env.DEV) {
      return;
    }

    const muse = getMuseById(museId);
    const voiceId = muse?.tapVoices[0]?.id;

    if (!muse || !voiceId) {
      return;
    }

    const now = Date.now();

    set((state) => ({
      museTapStates: {
        ...state.museTapStates,
        [muse.id]: {
          isTapBoostActive: true,
          tapBoostEndsAt: now + museTapDurationMs,
          tapCooldownEndsAt: now + museTapCooldownMs,
          lastTapVoiceId: voiceId,
        },
      },
    }));
  },

}));
