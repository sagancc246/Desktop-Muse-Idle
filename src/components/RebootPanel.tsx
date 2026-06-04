import { lazy, Suspense, useState } from 'react';
import { calculateRebootFragments, rebootMemoryRequirement } from '../data/balance';
import { useGameStore } from '../store/useGameStore';

const SkillTreePanel = lazy(() =>
  import('./SkillTreePanel').then(({ SkillTreePanel }) => ({ default: SkillTreePanel })),
);

export function RebootPanel() {
  const [isSkillTreeOpen, setIsSkillTreeOpen] = useState(false);
  const memory = useGameStore((state) => state.memory);
  const fragments = useGameStore((state) => state.fragments);
  const rebootCount = useGameStore((state) => state.rebootCount);
  const reboot = useGameStore((state) => state.reboot);
  const gainedFragments = calculateRebootFragments(memory);
  const canReboot = gainedFragments > 0;

  const handleReboot = () => {
    const confirmed = window.confirm(
      `Reboot now for ${gainedFragments} Fragment? Memory and standard upgrades will reset.`,
    );

    if (confirmed) {
      reboot();
    }
  };

  return (
    <>
      <footer className="reboot-panel panel">
        <div className="dialogue-heading">
          <p className="eyebrow">REBOOT</p>
          <h2>Permanent Archive</h2>
        </div>
        <div className="reboot-summary">
          <strong>{fragments.toLocaleString()} Fragment</strong>
          <span>
            Reboots: {rebootCount} / Next yield: {gainedFragments} Fragment
          </span>
          <small>
            Requires {rebootMemoryRequirement.toLocaleString()} Memory. Reboot resets Memory and
            standard upgrades only.
          </small>
        </div>
        <div className="reboot-actions">
          <button className="placeholder-action skill-tree-open" onClick={() => setIsSkillTreeOpen(true)} type="button">
            Skill Tree
          </button>
          <button
            className="reboot-action"
            disabled={!canReboot}
            onClick={handleReboot}
            type="button"
          >
            {canReboot ? `Reboot +${gainedFragments}` : 'Reboot unavailable'}
          </button>
        </div>
      </footer>
      {isSkillTreeOpen ? (
        <Suspense
          fallback={
            <div className="skill-tree-backdrop">
              <div className="lazy-panel-loading panel" role="status">
                Loading Skill Tree...
              </div>
            </div>
          }
        >
          <SkillTreePanel onClose={() => setIsSkillTreeOpen(false)} />
        </Suspense>
      ) : null}
    </>
  );
}
