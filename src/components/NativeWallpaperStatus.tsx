import { useAppStore } from '../store/useAppStore';

interface NativeWallpaperStatusProps {
  className?: string;
  prefix?: string;
  showHelperLastResult?: boolean;
}

export function NativeWallpaperStatus({
  className = 'settings-help',
  prefix = 'Native Wallpaper',
  showHelperLastResult = true,
}: NativeWallpaperStatusProps) {
  const nativeWallpaperStatus = useAppStore((state) => state.nativeWallpaperStatus);

  return (
    <p className={className}>
      {prefix}: {nativeWallpaperStatus.supported ? 'supported' : 'unsupported'} / Backend:{' '}
      {nativeWallpaperStatus.backend} / Active:{' '}
      {nativeWallpaperStatus.active ? 'true' : 'false'} / Attached:{' '}
      {nativeWallpaperStatus.attached || nativeWallpaperStatus.nativeAttached ? 'true' : 'false'} /
      Fallback: {nativeWallpaperStatus.fallbackActive ? 'true' : 'false'} / Helper:{' '}
      {nativeWallpaperStatus.helperAvailable ? 'reachable' : 'missing'}
      {nativeWallpaperStatus.helperVersion ? ` ${nativeWallpaperStatus.helperVersion}` : ''}
      {nativeWallpaperStatus.helperPath ? ` / Helper path: ${nativeWallpaperStatus.helperPath}` : ''}
      {' / '}Progman: {nativeWallpaperStatus.progmanFound ? 'found' : 'unknown'}
      {' / '}SHELLDLL_DefView:{' '}
      {nativeWallpaperStatus.shellDllDefViewFound ? 'found' : 'unknown'}
      {' / '}WorkerW candidates: {nativeWallpaperStatus.workerWCandidateCount ?? 0}
      {nativeWallpaperStatus.workerWHwnd ? ` / WorkerW: ${nativeWallpaperStatus.workerWHwnd}` : ''}
      {nativeWallpaperStatus.preferredWorkerWHwnd
        ? ` / Preferred WorkerW: ${nativeWallpaperStatus.preferredWorkerWHwnd}`
        : ''}
      {nativeWallpaperStatus.previousParentHwnd
        ? ` / Previous parent: ${nativeWallpaperStatus.previousParentHwnd}`
        : ''}
      {' / '}SetParent: {nativeWallpaperStatus.setParentSucceeded ? 'true' : 'false'}
      {' / '}SetWindowPos: {nativeWallpaperStatus.setWindowPosSucceeded ? 'true' : 'false'}
      {nativeWallpaperStatus.reason ? ` / Reason: ${nativeWallpaperStatus.reason}` : ''}
      {nativeWallpaperStatus.lastError ? ` / ${nativeWallpaperStatus.lastError}` : ''}
      {showHelperLastResult && nativeWallpaperStatus.helperLastResult
        ? ` / Helper result: ${nativeWallpaperStatus.helperLastResult}`
        : ''}
    </p>
  );
}
