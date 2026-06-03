import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { WallpaperMode } from '../types/game';

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
  const lastCornerHitFlash = useGameStore((state) => state.lastCornerHitFlash);
  const saveStatus = useGameStore((state) => state.saveStatus);
  const manualSave = useGameStore((state) => state.manualSave);
  const [isCornerPulseActive, setIsCornerPulseActive] = useState(false);

  useEffect(() => {
    if (!lastCornerHitFlash) {
      return undefined;
    }

    setIsCornerPulseActive(true);
    const timerId = window.setTimeout(() => setIsCornerPulseActive(false), 420);
    return () => window.clearTimeout(timerId);
  }, [lastCornerHitFlash?.occurredAt, lastCornerHitFlash]);

  const resources = [
    { label: 'Memory', pulse: isCornerPulseActive, value: memory.toLocaleString() },
    { label: 'Memory/sec', value: memoryPerSecond.toLocaleString() },
    { label: 'Bounces', value: totalBounces.toLocaleString() },
    { label: 'Corner Hits', pulse: isCornerPulseActive, value: totalCornerHits.toLocaleString() },
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
            <div className={`metric${resource.pulse ? ' corner-pulse' : ''}`} key={resource.label}>
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
