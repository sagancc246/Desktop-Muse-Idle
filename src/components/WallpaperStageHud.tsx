import { useEffect, useRef, useState } from 'react';
import { getStageById, initialStageId, stages } from '../data/stages';
import { useAppStore } from '../store/useAppStore';
import { useGameStore } from '../store/useGameStore';

interface WallpaperStageHudProps {
  onExit: () => void;
}

export function WallpaperStageHud({ onExit }: WallpaperStageHudProps) {
  const memory = useGameStore((state) => state.memory);
  const currentStageId = useGameStore((state) => state.currentStageId);
  const stageCornerHits = useGameStore((state) => state.stageCornerHits);
  const wallpaperSettings = useAppStore((state) => state.wallpaperSettings);
  const currentStage = getStageById(currentStageId) ?? getStageById(initialStageId);
  const [isDimmed, setIsDimmed] = useState(false);
  const dimTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const scheduleDim = () => {
      if (dimTimerRef.current !== null) {
        window.clearTimeout(dimTimerRef.current);
      }

      dimTimerRef.current = window.setTimeout(() => setIsDimmed(true), 5_000);
    };
    const reveal = () => {
      setIsDimmed(false);
      scheduleDim();
    };

    scheduleDim();
    window.addEventListener('pointermove', reveal);
    window.addEventListener('keydown', reveal);

    return () => {
      if (dimTimerRef.current !== null) {
        window.clearTimeout(dimTimerRef.current);
      }
      window.removeEventListener('pointermove', reveal);
      window.removeEventListener('keydown', reveal);
    };
  }, []);

  if (!currentStage) {
    return null;
  }

  const progress = stageCornerHits[currentStage.id] ?? 0;
  const completionPercent = Math.min((progress / currentStage.cornerHitGoal) * 100, 100);
  const stageNumber = stages.findIndex((stage) => stage.id === currentStage.id) + 1;

  return (
    <header
      aria-label="Wallpaper Stage Mode HUD"
      className={`wallpaper-stage-hud${isDimmed ? ' dimmed' : ''}`}
    >
      <div className="wallpaper-stage-metric">
        <span>Memory</span>
        <strong>{Math.floor(memory).toLocaleString()}</strong>
      </div>
      <div className="wallpaper-stage-metric wide">
        <span>Stage</span>
        <strong>
          {stageNumber} / {stages.length} - {currentStage.name}
        </strong>
      </div>
      <div className="wallpaper-stage-progress" aria-label="Current stage Corner Hit progress">
        <div>
          <span>Corner Hit Progress</span>
          <strong>
            {progress.toLocaleString()} / {currentStage.cornerHitGoal.toLocaleString()}
          </strong>
        </div>
        <div className="wallpaper-stage-progress-track">
          <span style={{ width: `${completionPercent}%` }} />
        </div>
      </div>
      <div className="wallpaper-stage-metric">
        <span>Fever</span>
        <strong>Standby</strong>
      </div>
      <div className="wallpaper-stage-metric">
        <span>Load</span>
        <strong>
          {wallpaperSettings.fps}fps / {wallpaperSettings.effectsQuality}
        </strong>
      </div>
      <button className="wallpaper-stage-exit" onClick={onExit} type="button">
        Exit Wallpaper
      </button>
    </header>
  );
}
