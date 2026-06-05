import { useEffect, useState } from 'react';
import { rebootMemoryRequirement } from '../data/balance';
import { muses } from '../data/muses';
import { getSkinById, museSkins } from '../data/skins';
import { getStageById } from '../data/stages';
import { useGameStore } from '../store/useGameStore';

interface DebugCollisionStatus {
  activeRuntimeIds: string[];
  cloneCount: number;
  currentWallpaperFps: number;
  lastEvent: string;
  lastEventAt: number | null;
  lastUpdateDeltaMs: number;
  measuredUpdatesPerSecond: number;
  updateIntervalMs: number;
}

const defaultCollisionStatus: DebugCollisionStatus = {
  activeRuntimeIds: [],
  cloneCount: 0,
  currentWallpaperFps: 0,
  lastEvent: 'Waiting for GameCanvas',
  lastEventAt: null,
  lastUpdateDeltaMs: 0,
  measuredUpdatesPerSecond: 0,
  updateIntervalMs: 0,
};

const formatRemaining = (milliseconds: number) =>
  milliseconds > 0 ? `${(milliseconds / 1_000).toFixed(1)}s` : '0.0s';

const dispatchCanvasDebugEvent = (eventName: string, detail?: Record<string, unknown>) => {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
};

interface DebugPanelProps {
  onClose: () => void;
}

export function DebugPanel({ onClose }: DebugPanelProps) {
  const memory = useGameStore((state) => state.memory);
  const fragments = useGameStore((state) => state.fragments);
  const currentStageId = useGameStore((state) => state.currentStageId);
  const stageCornerHits = useGameStore((state) => state.stageCornerHits);
  const clearedStages = useGameStore((state) => state.clearedStages);
  const activeMuseIds = useGameStore((state) => state.activeMuseIds);
  const unlockedMuseIds = useGameStore((state) => state.unlockedMuseIds);
  const unlockedSkinIds = useGameStore((state) => state.unlockedSkinIds);
  const skillStates = useGameStore((state) => state.skillStates);
  const debugAddMemory = useGameStore((state) => state.debugAddMemory);
  const debugAddFragments = useGameStore((state) => state.debugAddFragments);
  const debugTriggerCornerHit = useGameStore((state) => state.debugTriggerCornerHit);
  const debugCompleteCurrentStage = useGameStore((state) => state.debugCompleteCurrentStage);
  const unlockMuse = useGameStore((state) => state.unlockMuse);
  const setActiveMuses = useGameStore((state) => state.setActiveMuses);
  const unlockSkin = useGameStore((state) => state.unlockSkin);
  const [collisionStatus, setCollisionStatus] =
    useState<DebugCollisionStatus>(defaultCollisionStatus);
  const currentStage = getStageById(currentStageId);
  const debugSkinIds = ['lumi_pastel', 'astra_cyber', 'noir_gothic'];
  const currentStageHits = currentStage ? stageCornerHits[currentStage.id] ?? 0 : 0;
  const stageProgress = currentStage
    ? `${currentStageHits.toLocaleString()} / ${currentStage.cornerHitGoal.toLocaleString()}`
    : 'No stage';
  const vegaSkillState = skillStates.vega;
  const vegaStatus = vegaSkillState?.activeRemainingMs
    ? `Active ${formatRemaining(vegaSkillState.activeRemainingMs)}`
    : vegaSkillState?.cooldownRemainingMs
      ? `Cooldown ${formatRemaining(vegaSkillState.cooldownRemainingMs)}`
      : 'Ready';
  const hasActiveVega = activeMuseIds.includes('vega');
  const lastEventTime = collisionStatus.lastEventAt
    ? new Date(collisionStatus.lastEventAt).toLocaleTimeString()
    : '-';

  useEffect(() => {
    const handleCollisionStatus = (event: Event) => {
      setCollisionStatus(
        (event as CustomEvent<DebugCollisionStatus>).detail ?? defaultCollisionStatus,
      );
    };

    window.addEventListener(
      'desktop-muse-idle:debug-collision-status',
      handleCollisionStatus,
    );
    return () =>
      window.removeEventListener(
        'desktop-muse-idle:debug-collision-status',
        handleCollisionStatus,
      );
  }, []);

  const deployVega = () => {
    if (!unlockedMuseIds.includes('vega')) {
      unlockMuse('vega');
    }

    const nextActiveMuseIds = [
      ...activeMuseIds.filter((museId) => museId !== 'vega').slice(0, 2),
      'vega',
    ];
    setActiveMuses(nextActiveMuseIds);
  };

  const forceCloneCorner = () => {
    if (!activeMuseIds.includes('lumi')) {
      const nextActiveMuseIds = [
        ...activeMuseIds.filter((museId) => museId !== 'lumi').slice(0, 2),
        'lumi',
      ];
      setActiveMuses(nextActiveMuseIds);
      window.setTimeout(
        () => dispatchCanvasDebugEvent('desktop-muse-idle:debug-clone-corner'),
        0,
      );
      return;
    }

    dispatchCanvasDebugEvent('desktop-muse-idle:debug-clone-corner');
  };

  return (
    <aside className="debug-panel panel" aria-label="Development debug panel">
      <div className="debug-heading">
        <div>
          <p className="eyebrow">DEV ONLY</p>
          <h2>Debug Panel</h2>
        </div>
        <div className="debug-heading-actions">
          <span>Vite dev</span>
          <button aria-label="Close Debug Panel" onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>

      <div className="debug-status">
        <span>Memory {Math.floor(memory).toLocaleString()}</span>
        <span>Fragment {fragments.toLocaleString()}</span>
        <span>
          {currentStage?.name ?? 'Stage'} {stageProgress}
        </span>
        <span>Cleared {clearedStages.length}</span>
        <span>Skins {unlockedSkinIds.join(', ')}</span>
      </div>

      <div className="debug-section">
        <h3>Collision / Skill Status</h3>
        <div className="debug-status debug-collision-status">
          <span>Active Bodies {collisionStatus.activeRuntimeIds.join(', ') || 'none'}</span>
          <span>Clones {collisionStatus.cloneCount}</span>
          <span>Vega Bumper {vegaStatus}</span>
          <span>
            Wallpaper FPS{' '}
            {collisionStatus.currentWallpaperFps > 0
              ? collisionStatus.currentWallpaperFps
              : 'off'}
          </span>
          <span>Update interval {collisionStatus.updateIntervalMs.toFixed(1)}ms</span>
          <span>Last delta {collisionStatus.lastUpdateDeltaMs.toFixed(1)}ms</span>
          <span>Measured updates {collisionStatus.measuredUpdatesPerSecond.toFixed(1)}/s</span>
          <span>Last {collisionStatus.lastEvent}</span>
          <span>At {lastEventTime}</span>
        </div>
        <div className="debug-button-grid">
          <button onClick={deployVega} type="button">
            Deploy Vega
          </button>
          <button
            disabled={!hasActiveVega}
            onClick={() =>
              dispatchCanvasDebugEvent('desktop-muse-idle:debug-vega-bumper')
            }
            type="button"
          >
            Force Vega Bumper
          </button>
          <button
            disabled={!hasActiveVega}
            onClick={() => dispatchCanvasDebugEvent('desktop-muse-idle:debug-vega-hit')}
            type="button"
          >
            Force Vega Hit
          </button>
          <button
            onClick={forceCloneCorner}
            type="button"
          >
            Force Clone Corner
          </button>
          <button
            onClick={() => dispatchCanvasDebugEvent('desktop-muse-idle:debug-near-corner')}
            type="button"
          >
            Force Near Corner
          </button>
        </div>
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
        <h3>Skins</h3>
        <div className="debug-button-grid">
          {debugSkinIds.map((skinId) => {
            const skin = getSkinById(skinId);
            const isUnlocked = unlockedSkinIds.includes(skinId);

            return (
              <button disabled={isUnlocked} key={skinId} onClick={() => unlockSkin(skinId)} type="button">
                {isUnlocked ? 'Owned' : `Unlock ${skin?.name ?? skinId}`}
              </button>
            );
          })}
          <button
            onClick={() =>
              museSkins
                .filter((skin) => !skin.defaultUnlocked)
                .forEach((skin) => unlockSkin(skin.id))
            }
            type="button"
          >
            Unlock All Skins
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
                  dispatchCanvasDebugEvent('desktop-muse-idle:debug-skill', {
                    museId: muse.id,
                  })
                }
                type="button"
              >
                Skill
              </button>
              <button
                onClick={() =>
                  dispatchCanvasDebugEvent('desktop-muse-idle:debug-tap', {
                    museId: muse.id,
                  })
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
