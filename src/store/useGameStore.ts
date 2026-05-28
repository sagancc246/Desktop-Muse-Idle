import { create } from 'zustand';
import { backgrounds, getBackgroundById } from '../data/backgrounds';
import { calculateRebootFragments } from '../data/balance';
import { museTapCooldownMs, museTapDurationMs } from '../data/balance';
import { getMuseById } from '../data/muses';
import { getSkillNodeById } from '../data/skillTree';
import { getNextStage, getStageById, initialStageId } from '../data/stages';
import { calculateUpgradeCost } from '../data/upgrades';
import { createInitialUpgrades } from '../data/upgrades';
import { createInitialSkillStates } from '../game/skillEffects';
import { activateSkillState, tickSkillStates } from '../game/skillEffects';
import {
  calculateBounceReward,
  calculateCornerReward,
  calculateOfflineMemoryPerSecond,
} from '../game/rewardCalculator';
import { clearSaveData, createNewGameState, loadGameState, saveGameState } from '../systems/saveSystem';
import type { GameState, GameStore } from '../types/game';
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

function applyCornerHitProgress(state: GameState, hitCount = 1): Partial<GameState> {
  let currentStageId = state.currentStageId;
  let currentBackgroundId = state.currentBackgroundId;
  let totalCornerHits = state.totalCornerHits;
  let pendingStageClear = state.pendingStageClear;
  const stageCornerHits = { ...state.stageCornerHits };
  const clearedStages = [...state.clearedStages];
  const unlockedBackgrounds = [...state.unlockedBackgrounds];
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

    const stageBackgrounds = backgrounds.filter(
      (background) =>
        background.id === currentStage.rewardBackgroundId ||
        background.unlockStageId === currentStage.id,
    );
    const rewardBackground = getBackgroundById(currentStage.rewardBackgroundId);

    for (const stageBackground of stageBackgrounds) {
      if (!unlockedBackgrounds.includes(stageBackground.id)) {
        unlockedBackgrounds.push(stageBackground.id);
      }

      if (currentBackgroundId === null) {
        currentBackgroundId = stageBackground.id;
      }
    }

    const nextStage = getNextStage(currentStage.id);
    pendingStageClear = {
      stageId: currentStage.id,
      stageName: currentStage.name,
      rewardBackgroundId: currentStage.rewardBackgroundId,
      rewardBackgroundName: rewardBackground?.name ?? 'New Background',
      nextStageId: nextStage?.id ?? null,
      nextStageName: nextStage?.name ?? null,
    };

    if (nextStage) {
      currentStageId = nextStage.id;
    }
  }

  return {
    totalCornerHits,
    currentStageId,
    stageCornerHits,
    clearedStages,
    unlockedBackgrounds,
    currentBackgroundId,
    pendingStageClear,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  addMemory: (amount) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    set((state) => ({ memory: state.memory + amount }));
  },

  incrementBounce: () => {
    set((state) => ({ totalBounces: state.totalBounces + 1 }));
  },

  incrementCornerHit: () => {
    set((state) => applyCornerHitProgress(state));
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

  toggleActiveMuse: (museId) => {
    set((state) => {
      const muse = getMuseById(museId);

      if (!muse?.unlocked) {
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

    set((state) => withOfflineRate(state, {
      memory: 0,
      upgrades: createInitialUpgrades(),
      fragments: state.fragments + gainedFragments,
      rebootCount: state.rebootCount + 1,
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
    }));
    saveGameState(get(), getCurrentMotionIntensity());
    return true;
  },

  dismissOfflineReward: () => {
    set({ pendingOfflineReward: null });
  },

  dismissStageClear: () => {
    set({ pendingStageClear: null });
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

      return {
        ...applyCornerHitProgress(state),
        memory: state.memory + bounceReward + cornerReward,
        totalBounces: state.totalBounces + 1,
        lastCornerHitFlash: { corner: 'top-left', occurredAt: Date.now() },
      };
    });
  },

  debugCompleteCurrentStage: () => {
    if (!import.meta.env.DEV) {
      return;
    }

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

      return applyCornerHitProgress(state, Math.max(1, remainingHits));
    });
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
