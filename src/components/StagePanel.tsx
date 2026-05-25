import { getNextStage, getStageById, initialStageId, stages } from '../data/stages';
import { useGameStore } from '../store/useGameStore';

export function StagePanel() {
  const currentStageId = useGameStore((state) => state.currentStageId);
  const stageCornerHits = useGameStore((state) => state.stageCornerHits);
  const clearedStages = useGameStore((state) => state.clearedStages);
  const currentStage = getStageById(currentStageId) ?? getStageById(initialStageId);

  if (!currentStage) {
    return null;
  }

  const progress = stageCornerHits[currentStage.id] ?? 0;
  const completionPercent = Math.min((progress / currentStage.cornerHitGoal) * 100, 100);
  const isComplete = clearedStages.includes(currentStage.id);
  const isFinalStageCleared = isComplete && !getNextStage(currentStage.id);

  return (
    <section className="stage-panel panel">
      <div className="stage-panel-heading">
        <div>
          <p className="eyebrow">MISSION</p>
          <h2>{currentStage.name}</h2>
        </div>
        <span className={`stage-status ${isFinalStageCleared ? 'complete' : ''}`}>
          {isFinalStageCleared ? 'ALL CLEAR' : 'ACTIVE'}
        </span>
      </div>
      <p className="stage-description">{currentStage.description}</p>
      <div
        aria-label={`${currentStage.name} Corner Hit progress`}
        aria-valuemax={currentStage.cornerHitGoal}
        aria-valuemin={0}
        aria-valuenow={progress}
        className="stage-progress-track"
        role="progressbar"
      >
        <span style={{ width: `${completionPercent}%` }} />
      </div>
      <div className="stage-progress-copy">
        <strong>{progress.toLocaleString()}</strong>
        <span>/ {currentStage.cornerHitGoal.toLocaleString()} Corner Hits</span>
      </div>
      <p className="stage-clear-count">
        Cleared {clearedStages.length} / {stages.length}
      </p>
    </section>
  );
}
