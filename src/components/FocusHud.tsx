import {
  getStageById,
  getStageClearConditionType,
  getStageEnemyConfig,
  getStageNumber,
  initialStageId,
  stages,
} from '../data/stages';
import { useGameStore } from '../store/useGameStore';

interface FocusHudProps {
  onExit: () => void;
}

export function FocusHud({ onExit }: FocusHudProps) {
  const memory = useGameStore((state) => state.memory);
  const currentStageId = useGameStore((state) => state.currentStageId);
  const stageCornerHits = useGameStore((state) => state.stageCornerHits);
  const stageDefeatCounts = useGameStore((state) => state.stageDefeatCounts);
  const currentStage = getStageById(currentStageId) ?? getStageById(initialStageId);

  if (!currentStage) {
    return null;
  }

  const clearConditionType = getStageClearConditionType(currentStage);
  const progress =
    clearConditionType === 'enemy_defeats'
      ? stageDefeatCounts[currentStage.id] ?? 0
      : stageCornerHits[currentStage.id] ?? 0;
  const progressGoal =
    clearConditionType === 'enemy_defeats'
      ? getStageEnemyConfig(currentStage).targetDefeatCount
      : currentStage.cornerHitGoal;
  const progressLabel = clearConditionType === 'enemy_defeats' ? 'Defeats' : 'Corner Hits';
  const stageNumber = getStageNumber(currentStage);

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
        <span>{progressLabel}</span>
        <strong>
          {progress.toLocaleString()} / {progressGoal.toLocaleString()}
        </strong>
      </div>
      <button className="focus-exit" onClick={onExit} type="button">
        Exit Focus
      </button>
    </header>
  );
}
