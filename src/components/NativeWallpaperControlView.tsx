import { useState } from 'react';
import { minimizePlatformNativeWallpaperControlView } from '../platform/platform';
import { useAppStore } from '../store/useAppStore';
import { NativeWallpaperStatus } from './NativeWallpaperStatus';

export function NativeWallpaperControlView() {
  const nativeWallpaperStatus = useAppStore((state) => state.nativeWallpaperStatus);
  const exitWallpaperMode = useAppStore((state) => state.exitWallpaperMode);
  const [copyLabel, setCopyLabel] = useState('Copy Diagnostics');

  const copyDiagnostics = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(nativeWallpaperStatus, null, 2));
      setCopyLabel('Copied');
      window.setTimeout(() => setCopyLabel('Copy Diagnostics'), 1_500);
    } catch {
      setCopyLabel('Copy failed');
      window.setTimeout(() => setCopyLabel('Copy Diagnostics'), 1_500);
    }
  };

  const minimizeControlView = async () => {
    await minimizePlatformNativeWallpaperControlView();
  };

  return (
    <section
      className="native-wallpaper-control-view native-wallpaper-control-view-root native-wallpaper-control-window native-wallpaper-control-compact"
      aria-label="Native Wallpaper Control"
    >
      <div className="native-control-titlebar native-wallpaper-control-titlebar">
        <div>
          <p className="eyebrow">NATIVE WALLPAPER</p>
          <h1>Native Wallpaper Control</h1>
        </div>
        <div className="native-control-window-actions">
          <button onClick={() => void minimizeControlView()} type="button">
            Minimize
          </button>
        </div>
      </div>

      <div className="native-control-summary native-wallpaper-control-content">
        <span>
          Backend: <strong>{nativeWallpaperStatus.backend}</strong>
        </span>
        <span>
          Probe attached:{' '}
          <strong>{nativeWallpaperStatus.probeAttached ? 'true' : 'false'}</strong>
        </span>
        <span>
          Manual verification:{' '}
          <strong>{nativeWallpaperStatus.needsManualVerification ? 'required' : 'n/a'}</strong>
        </span>
      </div>

      <div className="native-control-primary-actions">
        <button onClick={exitWallpaperMode} type="button">
          Exit Wallpaper
        </button>
        <button onClick={() => void copyDiagnostics()} type="button">
          {copyLabel}
        </button>
      </div>

      <details className="native-wallpaper-control-diagnostics">
        <summary>Native status and diagnostics</summary>
        <NativeWallpaperStatus className="wallpaper-mode-copy" showHelperLastResult={false} />
      </details>
    </section>
  );
}
