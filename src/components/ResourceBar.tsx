import { useEffect, useState } from 'react';
import {
  getStageById,
  getStageClearConditionType,
  getStageEnemyConfig,
  getStageNumber,
  initialStageId,
} from '../data/stages';
import { useAppStore } from '../store/useAppStore';
import { useGameStore } from '../store/useGameStore';
import type { WallpaperMode } from '../types/game';

interface ResourceMetric {
  collectPulse?: boolean;
  label: string;
  pulse?: boolean;
  stageProgress?: boolean;
  value: string;
}

interface ResourceBarProps {
  onFocus: () => void;
  onSettings: () => void;
  onStats: () => void;
  onWallpaperStage: () => void;
  wallpaperMode: WallpaperMode;
}

export function ResourceBar({
  onFocus,
  onSettings,
  onStats,
  onWallpaperStage,
  wallpaperMode,
}: ResourceBarProps) {
  const memory = useGameStore((state) => state.memory);
  const memoryPerSecond = useGameStore((state) => state.memoryPerSecond);
  const totalBounces = useGameStore((state) => state.totalBounces);
  const totalCornerHits = useGameStore((state) => state.totalCornerHits);
  const fragments = useGameStore((state) => state.fragments);
  const currentStageId = useGameStore((state) => state.currentStageId);
  const stageDefeatCounts = useGameStore((state) => state.stageDefeatCounts);
  const language = useAppStore((state) => state.settings.language);
  const lastCornerHitFlash = useGameStore((state) => state.lastCornerHitFlash);
  const saveStatus = useGameStore((state) => state.saveStatus);
  const manualSave = useGameStore((state) => state.manualSave);
  const [isCornerPulseActive, setIsCornerPulseActive] = useState(false);
  const [isMemoryDropPulseActive, setIsMemoryDropPulseActive] = useState(false);
  const [isStageProgressPulseActive, setIsStageProgressPulseActive] = useState(false);
  const currentStage = getStageById(currentStageId) ?? getStageById(initialStageId);
  const stageNumber = currentStage ? getStageNumber(currentStage) : 1;
  const clearConditionType = currentStage ? getStageClearConditionType(currentStage) : 'corner_hits';
  const targetDefeatCount =
    currentStage && clearConditionType === 'enemy_defeats'
      ? getStageEnemyConfig(currentStage).targetDefeatCount
      : 0;
  const currentDefeatCount =
    currentStage && clearConditionType === 'enemy_defeats'
      ? stageDefeatCounts[currentStage.id] ?? 0
      : 0;

  useEffect(() => {
    if (!lastCornerHitFlash) {
      return undefined;
    }

    setIsCornerPulseActive(true);
    const timerId = window.setTimeout(() => setIsCornerPulseActive(false), 420);
    return () => window.clearTimeout(timerId);
  }, [lastCornerHitFlash?.occurredAt, lastCornerHitFlash]);

  useEffect(() => {
    const handleMemoryDropCollected = () => {
      setIsMemoryDropPulseActive(false);
      window.requestAnimationFrame(() => setIsMemoryDropPulseActive(true));
      window.setTimeout(() => setIsMemoryDropPulseActive(false), 360);
    };

    window.addEventListener('desktop-muse:memory-drop-collected', handleMemoryDropCollected);
    return () =>
      window.removeEventListener('desktop-muse:memory-drop-collected', handleMemoryDropCollected);
  }, []);

  useEffect(() => {
    if (clearConditionType !== 'enemy_defeats') {
      return undefined;
    }

    setIsStageProgressPulseActive(false);
    const frameId = window.requestAnimationFrame(() => setIsStageProgressPulseActive(true));
    const timerId = window.setTimeout(() => setIsStageProgressPulseActive(false), 420);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timerId);
    };
  }, [clearConditionType, currentDefeatCount, currentStageId]);

  const resources: ResourceMetric[] = [
    {
      collectPulse: isMemoryDropPulseActive,
      label: 'Memory',
      pulse: isCornerPulseActive,
      value: memory.toLocaleString(),
    },
    { label: 'Memory/sec', value: memoryPerSecond.toLocaleString() },
    { label: 'Bounces', value: totalBounces.toLocaleString() },
    { label: 'Corner Hits', pulse: isCornerPulseActive, value: totalCornerHits.toLocaleString() },
    ...(clearConditionType === 'enemy_defeats'
      ? [
          {
            label: `Stage ${stageNumber}`,
            pulse: isStageProgressPulseActive,
            stageProgress: true,
            value:
              language === 'ja'
                ? `\u6483\u7834 ${currentDefeatCount.toLocaleString()} / ${targetDefeatCount.toLocaleString()}`
                : `Defeat ${currentDefeatCount.toLocaleString()} / ${targetDefeatCount.toLocaleString()}`,
          },
        ]
      : []),
    { label: 'Fragments', value: fragments.toLocaleString() },
  ];

  return (
    <header className="resource-bar panel">
      <div className="brand">
        <p className="eyebrow">DESKTOP MUSE</p>
        <h1>Idle Observatory</h1>
        <p className="phase-label">Stage missions active</p>
      </div>
      <div className="resource-actions">
        <div className="metrics" aria-label="Game resource display">
          {resources.map((resource) => (
            <div
              className={`metric${resource.pulse ? ' corner-pulse' : ''}${
                resource.collectPulse ? ' memory-drop-pulse' : ''
              }${resource.stageProgress ? ' stage-progress-metric' : ''}`}
              data-memory-counter={resource.label === 'Memory' ? 'true' : undefined}
              key={resource.label}
            >
              <span>{resource.label}</span>
              <strong>{resource.value}</strong>
            </div>
          ))}
        </div>
        <button
          aria-label="Save Game"
          className="resource-settings save-button"
          disabled={saveStatus === 'saving'}
          onClick={manualSave}
          type="button"
        >
          {saveStatus === 'saving' ? 'Saving' : 'Save'}
        </button>
        <button
          aria-label="Toggle Focus Mode"
          className="resource-settings"
          onClick={onFocus}
          type="button"
        >
          Focus
        </button>
        <button
          aria-label="Toggle Wallpaper Stage Mode"
          aria-pressed={wallpaperMode === 'stage'}
          className={`resource-settings${wallpaperMode !== 'off' ? ' active-mode' : ''}`}
          onClick={onWallpaperStage}
          type="button"
        >
          {wallpaperMode === 'off' ? 'Wallpaper' : `Wallpaper: ${wallpaperMode === 'stage' ? 'Stage' : 'Muse'}`}
        </button>
        <button
          aria-label="Open Statistics"
          className="resource-settings"
          onClick={onStats}
          type="button"
        >
          Stats
        </button>
        <button
          aria-label="Open Settings"
          className="resource-settings"
          onClick={onSettings}
          type="button"
        >
          Settings
        </button>
      </div>
    </header>
  );
}
