import { useEffect, useRef, useState } from 'react';
import { getStageById, initialStageId, stages } from '../data/stages';
import { useAppStore } from '../store/useAppStore';
import { useGameStore } from '../store/useGameStore';

interface WallpaperStageHudProps {
  onExit: () => void;
}

function summarizeRejectReasons(candidates: unknown[] | undefined) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return 'n/a';
  }

  const counts = new Map<string, number>();
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object' || !('rejectReason' in candidate)) {
      continue;
    }

    const reason = String(candidate.rejectReason || 'eligible');
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([reason, count]) => `${reason}:${count}`)
    .join(', ') || 'n/a';
}

export function WallpaperStageHud({ onExit }: WallpaperStageHudProps) {
  const memory = useGameStore((state) => state.memory);
  const currentStageId = useGameStore((state) => state.currentStageId);
  const stageCornerHits = useGameStore((state) => state.stageCornerHits);
  const nativeWallpaperStatus = useAppStore((state) => state.nativeWallpaperStatus);
  const wallpaperMode = useAppStore((state) => state.wallpaperMode);
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
      {wallpaperMode === 'native_wallpaper' ? (
        <div className="wallpaper-stage-metric wide">
          <span>Native Wallpaper</span>
          <strong>
            {nativeWallpaperStatus.nativeProbeActive || nativeWallpaperStatus.probeAttached
              ? 'Native Probe Active'
              : nativeWallpaperStatus.nativeAttached
              ? 'Native Wallpaper Active'
              : 'Fallback Stage Active'}
          </strong>
          <small>
            Helper: {nativeWallpaperStatus.helperAvailable ? 'reachable' : 'missing'}
            {nativeWallpaperStatus.helperVersion ? ` ${nativeWallpaperStatus.helperVersion}` : ''}
            {nativeWallpaperStatus.helperRunning ? ' / running' : ''}
            {nativeWallpaperStatus.helperPid ? ` / PID ${nativeWallpaperStatus.helperPid}` : ''}
            {nativeWallpaperStatus.attachMethod
              ? ` / ${nativeWallpaperStatus.attachMethod}`
              : ''}
          </small>
          <small>
            Dry run: {nativeWallpaperStatus.dryRun ? 'true' : 'false'} / Progman:{' '}
            {nativeWallpaperStatus.progmanFound ? 'found' : 'unknown'} / WorkerW:{' '}
            {nativeWallpaperStatus.workerWCandidateCount ?? 0}
          </small>
          <small>
            Attached: {nativeWallpaperStatus.attached ? 'true' : 'false'} / SetParent:{' '}
            {nativeWallpaperStatus.setParentSucceeded ? 'true' : 'false'} / SetWindowPos:{' '}
            {nativeWallpaperStatus.setWindowPosSucceeded ? 'true' : 'false'}
          </small>
          <small>
            Probe: {nativeWallpaperStatus.probeAttached ? 'true' : 'false'} / Fallback Stage:{' '}
            {nativeWallpaperStatus.fallbackStageVisible ? 'visible' : 'hidden'} / Main Stage:{' '}
            {nativeWallpaperStatus.mainStageVisible ? 'visible' : 'hidden'}
          </small>
          <small>
            Control: {nativeWallpaperStatus.controlViewVisible ? 'visible' : 'hidden'} / Bounds:{' '}
            {nativeWallpaperStatus.controlViewWindowBounds
              ? JSON.stringify(nativeWallpaperStatus.controlViewWindowBounds)
              : 'n/a'} / Blocks desktop:{' '}
            {nativeWallpaperStatus.mainWindowMayBlockDesktopClicks ? 'suspected' : 'false'}
          </small>
          <small>
            Back surface UI: {nativeWallpaperStatus.wallpaperSurfaceUiSuppressed ? 'hidden' : 'visible'} /
            Exit: {nativeWallpaperStatus.nativeWallpaperSurfaceExitButtonVisible ? 'surface' : 'control'} /
            Click-through: {nativeWallpaperStatus.wallpaperSurfaceClickThroughExpected ? 'expected' : 'n/a'}
          </small>
          <small>
            WorkerW probe: {nativeWallpaperStatus.workerWProbeAttempted ? 'true' : 'false'} /
            Progman probe: {nativeWallpaperStatus.progmanProbeAttempted ? 'true' : 'false'} /
            Manual check: {nativeWallpaperStatus.needsManualVerification ? 'required' : 'n/a'}
          </small>
          <small>
            Strategy: {nativeWallpaperStatus.selectedWorkerWStrategy ?? 'n/a'} / Selected WorkerW:{' '}
            {nativeWallpaperStatus.selectedWorkerWHwnd ?? 'n/a'} / Strategies:{' '}
            {nativeWallpaperStatus.workerWDiscoveryStrategies?.length ?? 0}
          </small>
          <small>
            Progman child WorkerW: {nativeWallpaperStatus.selectedProgmanChildWorkerWHwnd ?? 'n/a'} /
            Child candidates: {nativeWallpaperStatus.progmanChildWorkerWCandidates?.length ?? 0} /
            Child host: {nativeWallpaperStatus.workerWChildNativeHostProbeHwnd ?? 'n/a'}
          </small>
          <small>
            Stale hosts: {nativeWallpaperStatus.staleHostWindowsBeforeCleanup?.length ?? 0} /
            Cleanup: {nativeWallpaperStatus.cleanupStaleHostWindowsSucceeded ? 'ok' : 'n/a'} /
            Click: {nativeWallpaperStatus.clickThroughMode ?? (
              nativeWallpaperStatus.clickThroughEnabled ? 'enabled' : 'normal'
            )}
          </small>
          <small>
            Progman: {nativeWallpaperStatus.progmanHwnd ?? 'n/a'} / ShellDLL:{' '}
            {nativeWallpaperStatus.shellDllDefViewHwnd ?? (
              nativeWallpaperStatus.progmanHasShellDllDefView ? 'true' : 'false'
            )} / SysListView32:{' '}
            {nativeWallpaperStatus.sysListView32Hwnd ?? (
              nativeWallpaperStatus.progmanHasSysListView32 ? 'true' : 'false'
            )} / Covers primary:{' '}
            {nativeWallpaperStatus.progmanCoversPrimaryScreen ? 'true' : 'false'}
          </small>
          <small>
            WorkerW: {nativeWallpaperStatus.workerWHwnd ?? 'n/a'} / Host:{' '}
            {nativeWallpaperStatus.progmanNativeHostHwnd ?? nativeWallpaperStatus.hostHwnd ?? 'n/a'} / Electron:{' '}
            {nativeWallpaperStatus.electronWallpaperHwnd ?? 'n/a'}
          </small>
          <small>
            Parent: {nativeWallpaperStatus.parentHwndAfterSetParent ?? 'n/a'} / Rect mismatch:{' '}
            {nativeWallpaperStatus.rectMismatch ? 'true' : 'false'} / Reason:{' '}
            {nativeWallpaperStatus.reason ?? nativeWallpaperStatus.fallbackReason ?? 'n/a'}
          </small>
          <small>
            Z-order: {nativeWallpaperStatus.zOrderStrategy ?? nativeWallpaperStatus.zOrderResult ?? 'n/a'} /
            Shell rel: {nativeWallpaperStatus.hostRelativeToShellDllDefView ?? 'n/a'} / Click:{' '}
            {nativeWallpaperStatus.clickThroughEnabled ? 'through' : 'normal'}
          </small>
          <small>
            Closest: {nativeWallpaperStatus.closestWorkerWHwnd ?? 'n/a'} / Reject:{' '}
            {nativeWallpaperStatus.closestWorkerWReason ?? 'n/a'} / Reject summary:{' '}
            {summarizeRejectReasons(nativeWallpaperStatus.workerWCandidates)}
          </small>
          {nativeWallpaperStatus.lastError ? <small>{nativeWallpaperStatus.lastError}</small> : null}
        </div>
      ) : null}
      <button className="wallpaper-stage-exit" onClick={onExit} type="button">
        Exit Wallpaper
      </button>
    </header>
  );
}
