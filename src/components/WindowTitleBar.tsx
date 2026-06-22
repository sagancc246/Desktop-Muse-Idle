import type { MouseEvent, SyntheticEvent } from 'react';
import { minimizePlatformWindow, quitPlatformApp, togglePlatformFullscreen } from '../platform/platform';
import { useGameStore } from '../store/useGameStore';
import type { WindowDisplayMode } from '../types/game';

interface WindowTitleBarProps {
  displayMode: WindowDisplayMode;
  onDisplayModeChange: (mode: WindowDisplayMode) => void;
  onInteraction?: () => void;
}

function MinimizeIcon() {
  return (
    <svg aria-hidden="true" focusable="false" height="14" viewBox="0 0 16 16" width="14">
      <path d="M3 11.5h10" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg aria-hidden="true" focusable="false" height="14" viewBox="0 0 16 16" width="14">
      <path
        d="M3 6V3h3M10 3h3v3M13 10v3h-3M6 13H3v-3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg aria-hidden="true" focusable="false" height="14" viewBox="0 0 16 16" width="14">
      <path
        d="M5 3h8v8M3 5h8v8H3z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" focusable="false" height="14" viewBox="0 0 16 16" width="14">
      <path
        d="M4 4l8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function WindowTitleBar({
  displayMode,
  onDisplayModeChange,
  onInteraction,
}: WindowTitleBarProps) {
  const autoSave = useGameStore((state) => state.autoSave);
  const isFullscreen = displayMode === 'fullscreen';
  const fullscreenLabel = isFullscreen ? 'ウィンドウに戻す' : 'フルスクリーン';

  const stopTitleBarEvent = (event: SyntheticEvent) => {
    event.stopPropagation();
    onInteraction?.();
  };

  const handleMinimize = (event: MouseEvent<HTMLButtonElement>) => {
    stopTitleBarEvent(event);
    void minimizePlatformWindow();
  };

  const handleToggleFullscreen = (event: MouseEvent<HTMLButtonElement>) => {
    stopTitleBarEvent(event);
    void togglePlatformFullscreen().then((mode) => {
      if (mode) {
        onDisplayModeChange(mode);
      }
    });
  };

  const handleQuit = (event: MouseEvent<HTMLButtonElement>) => {
    stopTitleBarEvent(event);
    autoSave();
    void quitPlatformApp();
  };

  return (
    <header
      className="window-titlebar"
      onMouseMove={onInteraction}
      onPointerDown={(event) => {
        event.stopPropagation();
        onInteraction?.();
      }}
    >
      <div className="window-titlebar-title">Desktop Muse Idle</div>
      <div className="window-titlebar-actions">
        <button aria-label="Minimize Window" onClick={handleMinimize} title="Minimize" type="button">
          <MinimizeIcon />
        </button>
        <button
          aria-label={fullscreenLabel}
          onClick={handleToggleFullscreen}
          title={fullscreenLabel}
          type="button"
        >
          {isFullscreen ? <RestoreIcon /> : <FullscreenIcon />}
        </button>
        <button
          aria-label="Quit App"
          className="window-titlebar-close"
          onClick={handleQuit}
          title="Quit"
          type="button"
        >
          <CloseIcon />
        </button>
      </div>
    </header>
  );
}
