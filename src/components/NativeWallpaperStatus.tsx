import { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

interface NativeWallpaperStatusProps {
  className?: string;
  prefix?: string;
  showHelperLastResult?: boolean;
}

function formatDiagnosticValue(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return 'n/a';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
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

  const summary = [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([reason, count]) => `${reason}:${count}`)
    .join(', ');
  return summary || 'n/a';
}

export function NativeWallpaperStatus({
  className = 'settings-help',
  prefix = 'Native Wallpaper',
  showHelperLastResult = true,
}: NativeWallpaperStatusProps) {
  const nativeWallpaperStatus = useAppStore((state) => state.nativeWallpaperStatus);
  const refreshNativeWallpaperStatus = useAppStore((state) => state.refreshNativeWallpaperStatus);
  const [copyLabel, setCopyLabel] = useState('Copy diagnostics');

  const diagnostics = useMemo<Array<[string, unknown]>>(
    () => [
      ['App', nativeWallpaperStatus.appVersion],
      ['Helper', `${nativeWallpaperStatus.helperAvailable ? 'reachable' : 'missing'} ${
        nativeWallpaperStatus.helperVersion ?? ''
      }`.trim()],
      ['Backend', nativeWallpaperStatus.backend],
      ['Attached', nativeWallpaperStatus.attached || nativeWallpaperStatus.nativeAttached],
      ['Probe attached', nativeWallpaperStatus.probeAttached],
      ['Native probe active', nativeWallpaperStatus.nativeProbeActive],
      ['Native probe backend', nativeWallpaperStatus.nativeProbeBackend],
      ['Native probe visible', nativeWallpaperStatus.nativeProbeVisible],
      ['Render surface', nativeWallpaperStatus.renderSurface],
      ['Wallpaper surface', nativeWallpaperStatus.nativeWallpaperSurface],
      ['Control view', nativeWallpaperStatus.controlView],
      ['Control view mode', nativeWallpaperStatus.controlViewMode],
      ['Control movable', nativeWallpaperStatus.controlViewMovable],
      ['Control draggable', nativeWallpaperStatus.controlViewDraggable],
      ['Control minimize button', nativeWallpaperStatus.controlViewMinimizeButtonVisible],
      ['Control close button', nativeWallpaperStatus.controlViewCloseButtonVisible],
      ['Control close action', nativeWallpaperStatus.controlViewCloseAction],
      ['Control minimized', nativeWallpaperStatus.controlViewMinimized],
      ['Control bounds', nativeWallpaperStatus.controlViewBounds],
      ['Control restore screen', nativeWallpaperStatus.controlViewRestoreTargetScreen],
      ['Saved main bounds', nativeWallpaperStatus.savedMainWindowBoundsBeforeNativeWallpaper],
      ['Saved main state', nativeWallpaperStatus.savedMainWindowStateBeforeNativeWallpaper],
      ['Saved menu visible', nativeWallpaperStatus.savedMenuBarVisibleBeforeNativeWallpaper],
      ['Control window resized', nativeWallpaperStatus.controlViewWindowResized],
      ['Control resize reason', nativeWallpaperStatus.controlViewWindowResizeReason],
      ['Control menu visible', nativeWallpaperStatus.controlViewMenuBarVisible],
      ['Menu suppressed', nativeWallpaperStatus.menuBarSuppressedForControlView],
      ['Control compact layout', nativeWallpaperStatus.controlViewLayoutCompact],
      ['Large blank suppressed', nativeWallpaperStatus.controlViewLargeBlankSuppressed],
      ['Main game mounted', nativeWallpaperStatus.mainGameLayoutMounted],
      ['Wallpaper stage mounted', nativeWallpaperStatus.wallpaperStageLayoutMounted],
      ['Control view mounted', nativeWallpaperStatus.nativeWallpaperControlViewMounted],
      ['Control window created', nativeWallpaperStatus.nativeWallpaperControlWindowCreated],
      ['Control window visible', nativeWallpaperStatus.nativeWallpaperControlWindowVisible],
      ['Control window bounds', nativeWallpaperStatus.nativeWallpaperControlWindowBounds],
      ['Control window frameless', nativeWallpaperStatus.nativeWallpaperControlWindowFrameless],
      ['Control window draggable', nativeWallpaperStatus.nativeWallpaperControlWindowDraggable],
      ['Control window route', nativeWallpaperStatus.nativeWallpaperControlWindowRoute],
      ['Control button count', nativeWallpaperStatus.nativeWallpaperControlWindowButtonCount],
      ['Duplicate buttons', nativeWallpaperStatus.duplicateControlButtonsDetected],
      ['Main window hidden', nativeWallpaperStatus.mainWindowHiddenForNativeWallpaper],
      ['Main window restored', nativeWallpaperStatus.mainWindowRestoredAfterNativeWallpaper],
      ['Restored main bounds', nativeWallpaperStatus.restoredMainWindowBoundsAfterNativeWallpaper],
      ['Restored main state', nativeWallpaperStatus.restoredMainWindowStateAfterNativeWallpaper],
      ['Restore reason', nativeWallpaperStatus.restoreMainWindowReason],
      ['Control view visible', nativeWallpaperStatus.controlViewVisible],
      ['Control diagnostics', nativeWallpaperStatus.controlViewDiagnosticsVisible],
      ['Control mode selector', nativeWallpaperStatus.controlViewModeSelectorVisible],
      ['Control window bounds', nativeWallpaperStatus.controlViewWindowBounds],
      ['Main window bounds', nativeWallpaperStatus.mainWindowBounds],
      ['Main covers primary', nativeWallpaperStatus.mainWindowCoversPrimaryScreen],
      ['Main may block clicks', nativeWallpaperStatus.mainWindowMayBlockDesktopClicks],
      ['Control empty suspected', nativeWallpaperStatus.controlViewTransparentOrEmptySuspected],
      ['Desktop click-through expected', nativeWallpaperStatus.desktopIconClickThroughExpected],
      ['Desktop click blocked suspected', nativeWallpaperStatus.desktopIconClickThroughBlockedSuspected],
      ['Wallpaper may block clicks', nativeWallpaperStatus.wallpaperWindowMayBlockDesktopClicks],
      ['Control may block clicks', nativeWallpaperStatus.controlViewMayBlockDesktopClicks],
      ['Electron wallpaper ignore mouse', nativeWallpaperStatus.electronWallpaperIgnoreMouseEventsEnabled],
      ['Native host toolwindow', nativeWallpaperStatus.nativeHostToolWindowEnabled],
      ['App screen', nativeWallpaperStatus.appScreen],
      ['Previous app screen', nativeWallpaperStatus.previousAppScreenBeforeNativeWallpaper],
      ['Restored app screen', nativeWallpaperStatus.restoredAppScreenAfterNativeWallpaperOff],
      ['Native changed app screen', nativeWallpaperStatus.nativeWallpaperChangedAppScreen],
      ['Main canvas suppressed', nativeWallpaperStatus.mainWindowGameCanvasSuppressed],
      ['Canvas suppression reason', nativeWallpaperStatus.mainWindowGameCanvasSuppressionReason],
      ['Normal canvas visible', nativeWallpaperStatus.normalGameCanvasVisible],
      ['Normal background visible', nativeWallpaperStatus.normalBackgroundVisible],
      ['Normal Muse visible', nativeWallpaperStatus.normalMuseVisible],
      [
        'Surface interactive UI',
        nativeWallpaperStatus.nativeWallpaperSurfaceInteractiveUiVisible,
      ],
      ['Surface buttons', nativeWallpaperStatus.nativeWallpaperSurfaceButtonsVisible],
      ['Surface Exit button', nativeWallpaperStatus.nativeWallpaperSurfaceExitButtonVisible],
      ['Control Exit button', nativeWallpaperStatus.controlViewExitButtonVisible],
      ['Surface click-through expected', nativeWallpaperStatus.wallpaperSurfaceClickThroughExpected],
      ['Surface UI suppressed', nativeWallpaperStatus.wallpaperSurfaceUiSuppressed],
      ['Surface suppression reason', nativeWallpaperStatus.wallpaperSurfaceUiSuppressionReason],
      ['Manual verification', nativeWallpaperStatus.needsManualVerification],
      ['Fallback Stage visible', nativeWallpaperStatus.fallbackStageVisible],
      ['Overlay visible', nativeWallpaperStatus.overlayVisible],
      ['Main Stage visible', nativeWallpaperStatus.mainStageVisible],
      ['Duplicate suppressed', nativeWallpaperStatus.duplicateStageSuppressed],
      ['Suppression reason', nativeWallpaperStatus.duplicateStageSuppressionReason],
      ['Active surfaces', nativeWallpaperStatus.activeDisplaySurfaces?.join(', ')],
      ['Reason', nativeWallpaperStatus.reason],
      ['Fallback reason', nativeWallpaperStatus.fallbackReason ?? nativeWallpaperStatus.lastError],
      ['Helper PID', nativeWallpaperStatus.helperPid],
      ['Helper alive', nativeWallpaperStatus.helperProcessAlive],
      ['Selected WorkerW strategy', nativeWallpaperStatus.selectedWorkerWStrategy],
      ['Selected WorkerW HWND', nativeWallpaperStatus.selectedWorkerWHwnd],
      ['Selected Progman child WorkerW', nativeWallpaperStatus.selectedProgmanChildWorkerWHwnd],
      ['WorkerW strategies', nativeWallpaperStatus.workerWDiscoveryStrategies?.length],
      ['Progman child WorkerWs', nativeWallpaperStatus.progmanChildWorkerWCandidates?.length],
      ['WorkerW HWND', nativeWallpaperStatus.workerWHwnd],
      ['WorkerW candidates', nativeWallpaperStatus.workerWCandidateCount],
      ['WorkerW before 0x052C', nativeWallpaperStatus.workerWCandidatesBeforeMessage?.length],
      ['WorkerW created', nativeWallpaperStatus.workerWCreatedHwnds?.join(', ')],
      ['Closest WorkerW', nativeWallpaperStatus.closestWorkerWHwnd],
      ['Closest reject', nativeWallpaperStatus.closestWorkerWReason],
      ['Preferred reason', nativeWallpaperStatus.preferredReason],
      ['Reject summary', summarizeRejectReasons(nativeWallpaperStatus.workerWCandidates)],
      ['Progman probe attempted', nativeWallpaperStatus.progmanProbeAttempted],
      ['WorkerW probe attempted', nativeWallpaperStatus.workerWProbeAttempted],
      ['Progman HWND', nativeWallpaperStatus.progmanHwnd],
      ['ShellDLL_DefView HWND', nativeWallpaperStatus.shellDllDefViewHwnd],
      ['SysListView32 HWND', nativeWallpaperStatus.sysListView32Hwnd],
      ['Progman ShellDLL_DefView', nativeWallpaperStatus.progmanHasShellDllDefView],
      ['Progman SysListView32', nativeWallpaperStatus.progmanHasSysListView32],
      ['Progman covers primary', nativeWallpaperStatus.progmanCoversPrimaryScreen],
      ['Progman native host HWND', nativeWallpaperStatus.progmanNativeHostHwnd],
      ['WorkerW child HWND', nativeWallpaperStatus.workerWChildHwnd],
      ['WorkerW child host HWND', nativeWallpaperStatus.workerWChildNativeHostProbeHwnd],
      ['Native Host HWND', nativeWallpaperStatus.nativeHostHwnd ?? nativeWallpaperStatus.hostHwnd],
      ['Electron Wallpaper HWND', nativeWallpaperStatus.electronWallpaperHwnd],
      ['Parent after SetParent', nativeWallpaperStatus.parentHwndAfterSetParent],
      ['Host parent after SetParent', nativeWallpaperStatus.hostParentHwndAfterSetParent],
      ['Electron parent after SetParent', nativeWallpaperStatus.electronParentHwndAfterSetParent],
      ['Rect mismatch', nativeWallpaperStatus.rectMismatch],
      ['Coordinate mode', nativeWallpaperStatus.coordinateMode],
      ['SetParent result', nativeWallpaperStatus.setParentResult],
      ['Z-order strategy', nativeWallpaperStatus.zOrderStrategy],
      ['Z-order result', nativeWallpaperStatus.zOrderResult],
      ['Host vs ShellDLL_DefView', nativeWallpaperStatus.hostRelativeToShellDllDefView],
      ['Host vs SysListView32', nativeWallpaperStatus.hostRelativeToSysListView32],
      ['Click-through', nativeWallpaperStatus.clickThroughEnabled],
      ['Click-through mode', nativeWallpaperStatus.clickThroughMode],
      ['Electron ignore requested', nativeWallpaperStatus.electronIgnoreMouseEventsRequested],
      ['Electron ignore mouse', nativeWallpaperStatus.electronIgnoreMouseEventsEnabled],
      ['Native transparent requested', nativeWallpaperStatus.nativeHostTransparentRequested],
      ['Native transparent', nativeWallpaperStatus.nativeHostTransparentEnabled],
      ['Native no-activate requested', nativeWallpaperStatus.nativeHostNoActivateRequested],
      ['Native no-activate', nativeWallpaperStatus.nativeHostNoActivateEnabled],
      ['Stale hosts before cleanup', nativeWallpaperStatus.staleHostWindowsBeforeCleanup?.length],
      ['Cleanup stale hosts', nativeWallpaperStatus.cleanupStaleHostWindowsSucceeded],
      ['SetParent ok', nativeWallpaperStatus.setParentSucceeded],
      ['SetWindowPos ok', nativeWallpaperStatus.setWindowPosSucceeded],
      ['Host rect', nativeWallpaperStatus.hostWindowRect],
      ['Wallpaper rect', nativeWallpaperStatus.wallpaperWindowRect],
      ['Virtual screen', nativeWallpaperStatus.virtualScreenRect],
      ['Helper path', nativeWallpaperStatus.helperPath],
    ],
    [nativeWallpaperStatus],
  );

  const copyDiagnostics = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(nativeWallpaperStatus, null, 2));
      setCopyLabel('Copied');
      window.setTimeout(() => setCopyLabel('Copy diagnostics'), 1_500);
    } catch {
      setCopyLabel('Copy failed');
      window.setTimeout(() => setCopyLabel('Copy diagnostics'), 1_500);
    }
  };

  return (
    <div className={className}>
      <strong>{prefix}</strong>
      <div className="native-wallpaper-diagnostics">
        {diagnostics.map(([label, value]) => (
          <span className="native-wallpaper-diagnostic" key={label}>
            <b>{label}:</b> {formatDiagnosticValue(value)}
          </span>
        ))}
      </div>
      {nativeWallpaperStatus.lastError ? (
        <span className="native-wallpaper-error">{nativeWallpaperStatus.lastError}</span>
      ) : null}
      {showHelperLastResult && nativeWallpaperStatus.helperLastResult ? (
        <details className="native-wallpaper-raw">
          <summary>Raw helper result</summary>
          <code>{nativeWallpaperStatus.helperLastResult}</code>
        </details>
      ) : null}
      <div className="native-wallpaper-actions">
        <button onClick={() => void refreshNativeWallpaperStatus()} type="button">
          Recheck
        </button>
        <button onClick={() => void copyDiagnostics()} type="button">
          {copyLabel}
        </button>
      </div>
    </div>
  );
}
