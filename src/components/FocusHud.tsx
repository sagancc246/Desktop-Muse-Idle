import { getStageById, initialStageId, stages } from '../data/stages';
import { useGameStore } from '../store/useGameStore';

interface FocusHudProps {
  onExit: () => void;
}

export function FocusHud({ onExit }: FocusHudProps) {
  const memory = useGameStore((state) => state.memory);
  const currentStageId = useGameStore((state) => state.currentStageId);
  const stageCornerHits = useGameStore((state) => state.stageCornerHits);
  const currentStage = getStageById(currentStageId) ?? getStageById(initialStageId);

  if (!currentStage) {
    return null;
  }

  const progress = stageCornerHits[currentStage.id] ?? 0;
  const stageNumber = stages.findIndex((stage) => stage.id === currentStage.id) + 1;

  return (
    <header className="focus-hud" aria-label="Focus Mode HUD">
      <div className="focus-hud-metric">
        <span>Memory</span>
        <strong>{memory.toLocaleString()}</strong>
      </div>
      <div className="focus-hud-metric">
        <span>Stage Progress</span>
        <strong>
          {stageNumber} / {stages.length} - {currentStage.name}
        </strong>
      </div>
      <div className="focus-hud-metric">
        <span>Corner Hits</span>
        <strong>
          {progress.toLocaleString()} / {currentStage.cornerHitGoal.toLocaleString()}
        </strong>
      </div>
      <button className="focus-exit" onClick={onExit} type="button">
        Exit Focus
      </button>
    </header>
  );
}
