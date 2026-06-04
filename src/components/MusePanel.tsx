import { lazy, Suspense, useState } from 'react';
import { muses } from '../data/muses';
import { getEquippedSkinForMuse } from '../data/skins';
import { getMuseUnlockConditionLabel } from '../game/unlockChecker';
import { useGameStore } from '../store/useGameStore';

const SkinSelectorModal = lazy(() =>
  import('./SkinSelectorModal').then(({ SkinSelectorModal }) => ({ default: SkinSelectorModal })),
);

export function MusePanel() {
  const [skinModalMuseId, setSkinModalMuseId] = useState<string | null>(null);
  const activeMuseIds = useGameStore((state) => state.activeMuseIds);
  const unlockedMuseIds = useGameStore((state) => state.unlockedMuseIds);
  const equippedSkinByMuseId = useGameStore((state) => state.equippedSkinByMuseId);
  const skillStates = useGameStore((state) => state.skillStates);
  const museTapStates = useGameStore((state) => state.museTapStates);
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
          const isUnlocked = unlockedMuseIds.includes(muse.id);
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
          const tapState = museTapStates[muse.id];
          const now = Date.now();
          const isTapActive =
            tapState?.isTapBoostActive === true && now < tapState.tapBoostEndsAt;
          const isTapCoolingDown = !isTapActive && now < (tapState?.tapCooldownEndsAt ?? 0);
          const tapRemainingMs = isTapActive
            ? tapState.tapBoostEndsAt - now
            : Math.max(0, (tapState?.tapCooldownEndsAt ?? 0) - now);
          const tapStatus = isTapActive
            ? `Active: ${(tapRemainingMs / 1_000).toFixed(1)}s`
            : isTapCoolingDown
              ? `Cooldown: ${(tapRemainingMs / 1_000).toFixed(1)}s`
              : 'Ready';
          const equippedSkin = getEquippedSkinForMuse(muse.id, equippedSkinByMuseId);

          return (
            <article
              className={`muse-card${isActive ? ' active' : ''}${isUnlocked ? '' : ' locked'}`}
              key={muse.id}
            >
              <div className={`muse-swatch ${muse.iconAsset}`} aria-hidden="true" />
              <div className="muse-card-copy">
                <h3>{isUnlocked ? muse.name : '???'}</h3>
                <p>
                  {isUnlocked
                    ? `Memory x${muse.memoryMultiplier.toFixed(2)} / Corner x${muse.cornerMultiplier.toFixed(2)}`
                    : getMuseUnlockConditionLabel(muse)}
                </p>
              </div>
              <div className="muse-card-actions">
                <button
                  disabled={!isUnlocked || (isActive && activeMuseIds.length === 1)}
                  onClick={() => toggleActiveMuse(muse.id)}
                  type="button"
                >
                  {isUnlocked ? (isActive ? 'Recall' : 'Deploy') : 'Locked'}
                </button>
                <button
                  className="muse-skin-action"
                  onClick={() => setSkinModalMuseId(muse.id)}
                  type="button"
                >
                  {isUnlocked ? 'Change Skin' : 'View Skins'}
                </button>
              </div>
              <div className="muse-skin-row">
                <span>Skin</span>
                <strong>{equippedSkin?.name ?? 'Default Skin'}</strong>
              </div>
              {isUnlocked ? (
                <>
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
                  <div className="muse-tap-state">
                    <span>Muse Tap</span>
                    <strong className={`${isTapActive ? 'active' : ''}${isTapCoolingDown ? ' cooldown' : ''}`}>
                      {tapStatus}
                    </strong>
                  </div>
                </>
              ) : (
                <div className="muse-skill locked-copy">
                  <div className="muse-skill-heading">
                    <strong>Unlock Condition</strong>
                    <span className="muse-skill-status cooldown">LOCKED</span>
                  </div>
                  <p>{getMuseUnlockConditionLabel(muse)}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {skinModalMuseId ? (
        <Suspense
          fallback={
            <div className="skin-selector-backdrop">
              <div className="lazy-panel-loading panel" role="status">
                Loading Skin Selector...
              </div>
            </div>
          }
        >
          <SkinSelectorModal museId={skinModalMuseId} onClose={() => setSkinModalMuseId(null)} />
        </Suspense>
      ) : null}
    </aside>
  );
}
