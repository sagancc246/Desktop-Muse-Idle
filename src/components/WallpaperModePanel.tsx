import { useAppStore } from '../store/useAppStore';
import { NativeWallpaperStatus } from './NativeWallpaperStatus';
import type { WallpaperMode } from '../types/game';

const wallpaperModeLabels: Record<WallpaperMode, string> = {
  native_wallpaper: 'Native Wallpaper',
  off: 'Off',
  stage: 'Wallpaper Stage',
  muse_overlay: 'Muse Overlay',
};

export function WallpaperModePanel() {
  const wallpaperMode = useAppStore((state) => state.wallpaperMode);
  const nativeWallpaperStatus = useAppStore((state) => state.nativeWallpaperStatus);
  const setWallpaperMode = useAppStore((state) => state.setWallpaperMode);
  const toggleWallpaperStageMode = useAppStore((state) => state.toggleWallpaperStageMode);
  const toggleMuseOverlayMode = useAppStore((state) => state.toggleMuseOverlayMode);
  const nativeProbeActive = Boolean(
    nativeWallpaperStatus.nativeProbeActive ||
      (nativeWallpaperStatus.probeAttached && nativeWallpaperStatus.needsManualVerification),
  );

  return (
    <section className="wallpaper-mode-panel panel" aria-label="Wallpaper Mode">
      <div className="panel-heading panel-heading-row">
        <div>
          <p className="eyebrow">WALLPAPER</p>
          <h2>Wallpaper Mode</h2>
        </div>
        <span className={`wallpaper-mode-chip mode-${wallpaperMode}`}>
          {wallpaperModeLabels[wallpaperMode]}
        </span>
      </div>
      <p className="wallpaper-mode-copy">
        Shared mode state for future Wallpaper Stage and Muse Overlay layouts.
      </p>
      <div className="wallpaper-mode-actions">
        <button
          aria-pressed={wallpaperMode === 'off'}
          className={wallpaperMode === 'off' ? 'active' : ''}
          onClick={() => setWallpaperMode('off')}
          type="button"
        >
          Off
        </button>
        <button
          aria-pressed={wallpaperMode === 'stage'}
          className={wallpaperMode === 'stage' ? 'active' : ''}
          onClick={toggleWallpaperStageMode}
          type="button"
        >
          Stage
        </button>
        <button
          aria-pressed={wallpaperMode === 'native_wallpaper'}
          className={wallpaperMode === 'native_wallpaper' ? 'active' : ''}
          disabled={!nativeWallpaperStatus.supported}
          onClick={() => setWallpaperMode('native_wallpaper')}
          title={
            nativeWallpaperStatus.supported
              ? 'Start Native Desktop Wallpaper Mode'
              : 'Native wallpaper is only available on Windows Electron builds'
          }
          type="button"
        >
          Native
        </button>
        <button
          aria-pressed={wallpaperMode === 'muse_overlay'}
          className={wallpaperMode === 'muse_overlay' ? 'active' : ''}
          disabled={nativeProbeActive}
          onClick={toggleMuseOverlayMode}
          title={
            nativeProbeActive
              ? 'Native Wallpaper and Overlay cannot be enabled at the same time'
              : 'Start Muse Overlay Mode'
          }
          type="button"
        >
          Muse Overlay
        </button>
      </div>
      {nativeProbeActive ? (
        <p className="wallpaper-mode-copy">
          Native Probe Active. The wallpaper surface is click-through and visual-only; use this
          Control View for Exit, settings, and diagnostics.
        </p>
      ) : null}
      {wallpaperMode === 'native_wallpaper' ? (
        <NativeWallpaperStatus className="wallpaper-mode-copy" />
      ) : null}
    </section>
  );
}
