import { create } from 'zustand';
import {
  BALANCE,
  type UpgradeKey,
  getCornerReward,
  getSpeed,
  getUpgradeCost,
  getWallReward,
} from '../data/balance';

const SAVE_KEY = 'desktop-muse-idle-save-v1';

export type UpgradeLevels = Record<UpgradeKey, number>;

interface IncomeEvent {
  amount: number;
  time: number;
}

interface SavedGame {
  memory: number;
  cornerHits: number;
  upgrades: UpgradeLevels;
}

interface GameState extends SavedGame {
  memoryPerSecond: number;
  incomeEvents: IncomeEvent[];
  recordBounce: (isCornerHit: boolean) => void;
  buyUpgrade: (key: UpgradeKey) => void;
  refreshIncomeRate: () => void;
  getCurrentSpeed: () => number;
  getWallReward: () => number;
  getCornerReward: () => number;
  loadGame: () => void;
  saveGame: () => void;
}

const initialUpgrades: UpgradeLevels = {
  bounceBoost: 0,
  speedTune: 0,
  cornerSensor: 0,
};

function cleanIncomeEvents(events: IncomeEvent[], now: number): IncomeEvent[] {
  return events.filter((event) => now - event.time <= BALANCE.incomeWindowMs);
}

function calculateIncomeRate(events: IncomeEvent[]): number {
  const total = events.reduce((sum, event) => sum + event.amount, 0);
  return total / (BALANCE.incomeWindowMs / 1_000);
}

function safeInteger(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

export const useGameStore = create<GameState>((set, get) => ({
  memory: BALANCE.startingMemory,
  memoryPerSecond: 0,
  cornerHits: 0,
  upgrades: { ...initialUpgrades },
  incomeEvents: [],

  recordBounce: (isCornerHit) => {
    const state = get();
    const amount = isCornerHit ? state.getCornerReward() : state.getWallReward();
    const now = Date.now();
    const events = cleanIncomeEvents([...state.incomeEvents, { amount, time: now }], now);

    set({
      memory: state.memory + amount,
      cornerHits: state.cornerHits + (isCornerHit ? 1 : 0),
      incomeEvents: events,
      memoryPerSecond: calculateIncomeRate(events),
    });
  },

  buyUpgrade: (key) => {
    const state = get();
    const currentLevel = state.upgrades[key];
    const cost = getUpgradeCost(key, currentLevel);
    if (state.memory < cost) {
      return;
    }

    set({
      memory: state.memory - cost,
      upgrades: {
        ...state.upgrades,
        [key]: currentLevel + 1,
      },
    });
  },

  refreshIncomeRate: () => {
    const events = cleanIncomeEvents(get().incomeEvents, Date.now());
    set({
      incomeEvents: events,
      memoryPerSecond: calculateIncomeRate(events),
    });
  },

  getCurrentSpeed: () => getSpeed(get().upgrades.speedTune),
  getWallReward: () => getWallReward(get().upgrades.bounceBoost),
  getCornerReward: () =>
    getCornerReward(get().upgrades.bounceBoost, get().upgrades.cornerSensor),

  loadGame: () => {
    try {
      const rawSave = window.localStorage.getItem(SAVE_KEY);
      if (!rawSave) {
        return;
      }

      const parsed = JSON.parse(rawSave) as Partial<SavedGame>;
      const upgrades = parsed.upgrades ?? initialUpgrades;
      set({
        memory: safeInteger(parsed.memory),
        cornerHits: safeInteger(parsed.cornerHits),
        upgrades: {
          bounceBoost: safeInteger(upgrades.bounceBoost),
          speedTune: safeInteger(upgrades.speedTune),
          cornerSensor: safeInteger(upgrades.cornerSensor),
        },
        memoryPerSecond: 0,
        incomeEvents: [],
      });
    } catch {
      window.localStorage.removeItem(SAVE_KEY);
    }
  },

  saveGame: () => {
    const state = get();
    const save: SavedGame = {
      memory: Math.floor(state.memory),
      cornerHits: state.cornerHits,
      upgrades: state.upgrades,
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  },
}));
