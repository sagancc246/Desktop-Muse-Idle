import { rebootMemoryRequirement } from '../data/balance';
import { muses } from '../data/muses';
import { getStageById } from '../data/stages';
import { useGameStore } from '../store/useGameStore';

export function DebugPanel() {
  const memory = useGameStore((state) => state.memory);
  const fragments = useGameStore((state) => state.fragments);
  const currentStageId = useGameStore((state) => state.currentStageId);
  const stageCornerHits = useGameStore((state) => state.stageCornerHits);
  const clearedStages = useGameStore((state) => state.clearedStages);
  const debugAddMemory = useGameStore((state) => state.debugAddMemory);
  const debugAddFragments = useGameStore((state) => state.debugAddFragments);
  const debugTriggerCornerHit = useGameStore((state) => state.debugTriggerCornerHit);
  const debugCompleteCurrentStage = useGameStore((state) => state.debugCompleteCurrentStage);
  const currentStage = getStageById(currentStageId);
  const currentStageHits = currentStage ? stageCornerHits[currentStage.id] ?? 0 : 0;
  const stageProgress = currentStage
    ? `${currentStageHits.toLocaleString()} / ${currentStage.cornerHitGoal.toLocaleString()}`
    : 'No stage';

  return (
    <aside className="debug-panel panel" aria-label="Development debug panel">
      <div className="debug-heading">
        <div>
          <p className="eyebrow">DEV ONLY</p>
          <h2>Debug Panel</h2>
        </div>
        <span>Vite dev</span>
      </div>

      <div className="debug-status">
        <span>Memory {Math.floor(memory).toLocaleString()}</span>
        <span>Fragment {fragments.toLocaleString()}</span>
        <span>
          {currentStage?.name ?? 'Stage'} {stageProgress}
        </span>
        <span>Cleared {clearedStages.length}</span>
      </div>

      <div className="debug-section">
        <h3>Resources</h3>
        <div className="debug-button-grid">
          <button onClick={() => debugAddMemory(1_000)} type="button">
            +1K Memory
          </button>
          <button onClick={() => debugAddMemory(10_000)} type="button">
            +10K Memory
          </button>
          <button onClick={() => debugAddMemory(rebootMemoryRequirement)} type="button">
            Reboot Check
          </button>
          <button onClick={() => debugAddFragments(1)} type="button">
            +1 Fragment
          </button>
        </div>
      </div>

      <div className="debug-section">
        <h3>Progress</h3>
        <div className="debug-button-grid">
          <button onClick={debugTriggerCornerHit} type="button">
            Trigger Corner
          </button>
          <button onClick={debugCompleteCurrentStage} type="button">
            Clear Stage
          </button>
        </div>
      </div>

      <div className="debug-section">
        <h3>Muse Checks</h3>
        <div className="debug-muse-actions">
          {muses.map((muse) => (
            <div className="debug-muse-row" key={muse.id}>
              <strong>{muse.name}</strong>
              <button
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('desktop-muse-idle:debug-skill', {
                      detail: { museId: muse.id },
                    }),
                  )
                }
                type="button"
              >
                Skill
              </button>
              <button
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('desktop-muse-idle:debug-tap', {
                      detail: { museId: muse.id },
                    }),
                  )
                }
                type="button"
              >
                Tap
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
