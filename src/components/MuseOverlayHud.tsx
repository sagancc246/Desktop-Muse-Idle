import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { isElectronOverlayAvailable } from '../platform/platform';

interface MuseOverlayHudProps {
  onExit: () => void;
}

export function MuseOverlayHud({ onExit }: MuseOverlayHudProps) {
  const isAlwaysOnTopEnabled = useAppStore((state) => state.isAlwaysOnTopEnabled);
  const isClickThroughEnabled = useAppStore((state) => state.isClickThroughEnabled);
  const isTransparentWindowEnabled = useAppStore((state) => state.isTransparentWindowEnabled);
  const overlayLastError = useAppStore((state) => state.overlayLastError);
  const wallpaperMode = useAppStore((state) => state.wallpaperMode);
  const wallpaperSettings = useAppStore((state) => state.wallpaperSettings);
  const setClickThroughEnabled = useAppStore((state) => state.setClickThroughEnabled);
  const [showSafetyGuide, setShowSafetyGuide] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const safetyTimerId = window.setTimeout(() => {
      setShowSafetyGuide(false);
    }, 3_400);

    return () => window.clearTimeout(safetyTimerId);
  }, []);

  useEffect(() => {
    const revealHud = () => {
      setIsVisible(true);

      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
      }

      hideTimerRef.current = window.setTimeout(() => {
        setIsVisible(false);
      }, 2800);
    };

    window.addEventListener('pointermove', revealHud);
    window.addEventListener('keydown', revealHud);

    return () => {
      window.removeEventListener('pointermove', revealHud);
      window.removeEventListener('keydown', revealHud);
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const shouldShowHud =
    showSafetyGuide ||
    (wallpaperSettings.showOverlayHud && (isVisible || isClickThroughEnabled));

  return (
    <div className={`muse-overlay-hud${shouldShowHud ? ' visible' : ''}`}>
      <div>
        <strong>Muse Overlay</strong>
        {showSafetyGuide ? (
          <span className="overlay-safety-guide">
            Click Through ON中はボタンを押せません。Ctrl + Shift + Mで操作モードに戻せます。Escで終了できます。
          </span>
        ) : null}
        <span>
          Backend: {isElectronOverlayAvailable() ? 'Electron Overlay' : 'Web Preview'}
        </span>
        <span>
          Overlay Active: {wallpaperMode === 'muse_overlay' ? 'ON' : 'OFF'} / Transparent:{' '}
          {isTransparentWindowEnabled ? 'ON' : 'OFF'}
        </span>
        <span>
          Always On Top: {isAlwaysOnTopEnabled ? 'ON' : 'OFF'}
        </span>
        <span>
          Click Through: {isClickThroughEnabled ? 'ON - Desktop操作優先' : 'OFF - Muse Tap優先'} / Ctrl + Shift + M
        </span>
        <span>
          Load: {wallpaperSettings.fps}fps / {wallpaperSettings.effectsQuality}
        </span>
        {overlayLastError ? <span>Last Error: {overlayLastError}</span> : null}
      </div>
      <button
        onClick={() => setClickThroughEnabled(!isClickThroughEnabled)}
        tabIndex={shouldShowHud && !isClickThroughEnabled ? 0 : -1}
        type="button"
      >
        Click Through {isClickThroughEnabled ? 'OFF' : 'ON'}
      </button>
      <button onClick={onExit} tabIndex={shouldShowHud && !isClickThroughEnabled ? 0 : -1} type="button">
        Exit
      </button>
    </div>
  );
}
