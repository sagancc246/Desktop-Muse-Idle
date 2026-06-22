import { getSkinById } from '../data/skins';
import { getBackgroundById } from '../data/backgrounds';
import { getMuseById } from '../data/muses';
import {
  getNextStage,
  getStageById,
  getStageClearConditionType,
  getStageEnemyConfig,
  initialStageId,
  stages,
} from '../data/stages';
import { useGameStore } from '../store/useGameStore';

export function StagePanel() {
  const currentStageId = useGameStore((state) => state.currentStageId);
  const stageCornerHits = useGameStore((state) => state.stageCornerHits);
  const stageDefeatCounts = useGameStore((state) => state.stageDefeatCounts);
  const clearedStages = useGameStore((state) => state.clearedStages);
  const currentStage = getStageById(currentStageId) ?? getStageById(initialStageId);

  if (!currentStage) {
    return null;
  }

  const clearConditionType = getStageClearConditionType(currentStage);
  const enemyConfig = getStageEnemyConfig(currentStage);
  const progress =
    clearConditionType === 'enemy_defeats'
      ? stageDefeatCounts[currentStage.id] ?? 0
      : stageCornerHits[currentStage.id] ?? 0;
  const progressGoal =
    clearConditionType === 'enemy_defeats'
      ? enemyConfig.targetDefeatCount
      : currentStage.cornerHitGoal;
  const progressLabel = clearConditionType === 'enemy_defeats' ? 'Defeats' : 'Corner Hits';
  const completionPercent = Math.min((progress / progressGoal) * 100, 100);
  const isComplete = clearedStages.includes(currentStage.id);
  const isFinalStageCleared = isComplete && !getNextStage(currentStage.id);
  const rewardLabels = currentStage.rewards
    .map((reward) => {
      if (reward.type === 'skin') return getSkinById(reward.id)?.name;
      if (reward.type === 'background') return getBackgroundById(reward.id)?.name;
      if (reward.type === 'muse') return getMuseById(reward.id)?.name;
      if (reward.type === 'memory') return `${reward.amount.toLocaleString()} Memory`;
      if (reward.type === 'capsule') return `${reward.amount.toLocaleString()} Capsule`;
      if (reward.type === 'shard') return `${reward.amount.toLocaleString()} Shard`;
      if (reward.type === 'conversation') return `Conversation: ${reward.id}`;
      return undefined;
    })
    .filter((label) => label !== undefined);

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
        aria-label={`${currentStage.name} ${progressLabel} progress`}
        aria-valuemax={progressGoal}
        aria-valuemin={0}
        aria-valuenow={progress}
        className="stage-progress-track"
        role="progressbar"
      >
        <span style={{ width: `${completionPercent}%` }} />
      </div>
      <div className="stage-progress-copy">
        <strong>{progress.toLocaleString()}</strong>
        <span>/ {progressGoal.toLocaleString()} {progressLabel}</span>
      </div>
      <p className="stage-clear-count">
        Cleared {clearedStages.length} / {stages.length}
      </p>
      <p className="stage-rule-note">
        {clearConditionType === 'enemy_defeats'
          ? 'Defeat Memory Bugs to advance. Corner Hits still grant Memory and trigger rewards.'
          : 'Stage progress counts only true Corner Hits. Near Corners are guidance and do not advance this goal.'}
      </p>
      {rewardLabels.length > 0 ? (
        <p className="stage-skin-reward">
          Clear rewards: {rewardLabels.join(', ')}
        </p>
      ) : null}
    </section>
  );
}
