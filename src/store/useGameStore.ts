import { create } from 'zustand';
import { getBackgroundById } from '../data/backgrounds';
import { getMuseById } from '../data/muses';
import { getNextStage, getStageById, initialStageId } from '../data/stages';
import { calculateUpgradeCost } from '../data/upgrades';
import { activateSkillState, tickSkillStates } from '../game/skillEffects';
import { clearSaveData, createNewGameState, loadGameState } from '../systems/saveSystem';
import type { GameStore } from '../types/game';

const initialState = loadGameState();

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
    set((state) => {
      const currentStage = getStageById(state.currentStageId) ?? getStageById(initialStageId);

      if (!currentStage) {
        return { totalCornerHits: state.totalCornerHits + 1 };
      }

      const stageHits = Math.min(
        (state.stageCornerHits[currentStage.id] ?? 0) + 1,
        currentStage.cornerHitGoal,
      );
      const isNewClear =
        stageHits >= currentStage.cornerHitGoal && !state.clearedStages.includes(currentStage.id);
      const nextStage = isNewClear ? getNextStage(currentStage.id) : undefined;
      const rewardBackground = getBackgroundById(currentStage.rewardBackgroundId);
      const shouldUnlockBackground =
        isNewClear &&
        rewardBackground !== undefined &&
        !state.unlockedBackgrounds.includes(rewardBackground.id);
      const unlockedBackgrounds = shouldUnlockBackground
        ? [...state.unlockedBackgrounds, currentStage.rewardBackgroundId]
        : state.unlockedBackgrounds;

      return {
        totalCornerHits: state.totalCornerHits + 1,
        currentStageId: nextStage?.id ?? state.currentStageId,
        stageCornerHits: {
          ...state.stageCornerHits,
          [currentStage.id]: stageHits,
        },
        clearedStages: isNewClear
          ? [...state.clearedStages, currentStage.id]
          : state.clearedStages,
        unlockedBackgrounds,
        currentBackgroundId:
          shouldUnlockBackground && state.currentBackgroundId === null
            ? currentStage.rewardBackgroundId
            : state.currentBackgroundId,
      };
    });
  },

  purchaseUpgrade: (upgradeId) => {
    set((state) => {
      const upgrade = state.upgrades[upgradeId];
      const cost = calculateUpgradeCost(upgrade, upgrade.level);

      if (state.memory < cost) {
        return state;
      }

      return {
        memory: state.memory - cost,
        upgrades: {
          ...state.upgrades,
          [upgradeId]: {
            ...upgrade,
            level: upgrade.level + 1,
          },
        },
      };
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
    set(createNewGameState());
  },

  continueGame: () => {
    set(loadGameState());
  },

  resetSaveData: () => {
    clearSaveData();
    set(createNewGameState());
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
          : { activeMuseIds: state.activeMuseIds.filter((activeId) => activeId !== museId) };
      }

      if (state.activeMuseIds.length >= 3) {
        return state;
      }

      return { activeMuseIds: [...state.activeMuseIds, museId] };
    });
  },

  activateMuseSkill: (museId) => {
    const muse = getMuseById(museId);
    const skillState = get().skillStates[museId];

    if (!muse || !skillState || skillState.cooldownRemainingMs > 0) {
      return false;
    }

    set((state) => ({ skillStates: activateSkillState(state.skillStates, muse) }));
    return true;
  },

  tickSkillStates: (deltaMs) => {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) {
      return;
    }

    set((state) => ({ skillStates: tickSkillStates(state.skillStates, deltaMs) }));
  },
}));
