import { create } from 'zustand';
import { getBackgroundById } from '../data/backgrounds';
import { calculateRebootFragments } from '../data/balance';
import { museTapCooldownMs, museTapDurationMs } from '../data/balance';
import { getMuseById } from '../data/muses';
import { getSkillNodeById } from '../data/skillTree';
import { getNextStage, getStageById, initialStageId } from '../data/stages';
import { calculateUpgradeCost } from '../data/upgrades';
import { createInitialUpgrades } from '../data/upgrades';
import { createInitialSkillStates } from '../game/skillEffects';
import { activateSkillState, tickSkillStates } from '../game/skillEffects';
import { clearSaveData, createNewGameState, loadGameState, saveGameState } from '../systems/saveSystem';
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

      return {
        fragments: state.fragments - skillNode.cost,
        unlockedSkillNodes: {
          ...state.unlockedSkillNodes,
          [skillNode.id]: level + 1,
        },
      };
    });
    saveGameState(get());
  },

  reboot: () => {
    const gainedFragments = calculateRebootFragments(get().memory);

    if (gainedFragments <= 0) {
      return false;
    }

    set((state) => ({
      memory: 0,
      memoryPerSecond: 0,
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
    saveGameState(get());
    return true;
  },
}));
