import { useAppStore } from '../store/useAppStore';
import type { WallpaperMode } from '../types/game';

const wallpaperModeLabels: Record<WallpaperMode, string> = {
  off: 'Off',
  stage: 'Wallpaper Stage',
  muse_overlay: 'Muse Overlay',
};

export function WallpaperModePanel() {
  const wallpaperMode = useAppStore((state) => state.wallpaperMode);
  const setWallpaperMode = useAppStore((state) => state.setWallpaperMode);
  const toggleWallpaperStageMode = useAppStore((state) => state.toggleWallpaperStageMode);
  const toggleMuseOverlayMode = useAppStore((state) => state.toggleMuseOverlayMode);

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
          aria-pressed={wallpaperMode === 'muse_overlay'}
          className={wallpaperMode === 'muse_overlay' ? 'active' : ''}
          onClick={toggleMuseOverlayMode}
          type="button"
        >
          Muse Overlay
        </button>
      </div>
    </section>
  );
}
