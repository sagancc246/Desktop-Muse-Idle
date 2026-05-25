import { muses } from '../data/muses';
import { useGameStore } from '../store/useGameStore';

export function MusePanel() {
  const activeMuseIds = useGameStore((state) => state.activeMuseIds);
  const skillStates = useGameStore((state) => state.skillStates);
  const toggleActiveMuse = useGameStore((state) => state.toggleActiveMuse);
  const activeMuses = muses.filter((muse) => activeMuseIds.includes(muse.id));

  return (
    <aside className="muse-panel panel">
      <div className="muse-heading">
        <div>
          <p className="eyebrow">MUSE</p>
          <h2>Deployment</h2>
        </div>
        <span className="muse-count">{activeMuseIds.length} / 3</span>
      </div>
      <p className="muse-subtitle">Active muses bounce independently in the field.</p>
      <div className="active-muse-list">
        {activeMuses.map((muse) => (
          <span className="active-muse-chip" key={muse.id}>
            {muse.name}
          </span>
        ))}
      </div>
      <div className="muse-roster">
        {muses.map((muse) => {
          const isActive = activeMuseIds.includes(muse.id);
          const skillState = skillStates[muse.id];
          const isSkillActive = (skillState?.activeRemainingMs ?? 0) > 0;
          const isCoolingDown = !isSkillActive && (skillState?.cooldownRemainingMs ?? 0) > 0;
          const remainingMs = isSkillActive
            ? skillState.activeRemainingMs
            : (skillState?.cooldownRemainingMs ?? 0);
          const skillStatus = isSkillActive
            ? `ACTIVE ${(remainingMs / 1_000).toFixed(1)}s`
            : isCoolingDown
              ? `CD ${(remainingMs / 1_000).toFixed(1)}s`
              : 'READY';

          return (
            <article className={`muse-card${isActive ? ' active' : ''}`} key={muse.id}>
              <div className={`muse-swatch ${muse.iconAsset}`} aria-hidden="true" />
              <div className="muse-card-copy">
                <h3>{muse.name}</h3>
                <p>
                  Memory x{muse.memoryMultiplier.toFixed(2)} / Corner x
                  {muse.cornerMultiplier.toFixed(2)}
                </p>
              </div>
              <button
                disabled={!muse.unlocked || (isActive && activeMuseIds.length === 1)}
                onClick={() => toggleActiveMuse(muse.id)}
                type="button"
              >
                {isActive ? 'Recall' : 'Deploy'}
              </button>
              <div className="muse-skill">
                <div className="muse-skill-heading">
                  <strong>{muse.skill.name}</strong>
                  <span
                    className={`muse-skill-status${isSkillActive ? ' active' : ''}${isCoolingDown ? ' cooldown' : ''}`}
                  >
                    {skillStatus}
                  </span>
                </div>
                <p>{muse.skill.description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
