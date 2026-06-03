import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

interface MuseOverlayHudProps {
  onExit: () => void;
}

export function MuseOverlayHud({ onExit }: MuseOverlayHudProps) {
  const isClickThroughEnabled = useAppStore((state) => state.isClickThroughEnabled);
  const wallpaperSettings = useAppStore((state) => state.wallpaperSettings);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

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

  return (
    <div className={`muse-overlay-hud${isVisible ? ' visible' : ''}`}>
      <div>
        <strong>Muse Overlay</strong>
        <span>
          Click Through: Web placeholder {isClickThroughEnabled ? 'ON' : 'OFF'}
        </span>
        <span>
          Load: {wallpaperSettings.fps}fps / {wallpaperSettings.effectsQuality}
        </span>
      </div>
      <button onClick={onExit} tabIndex={isVisible ? 0 : -1} type="button">
        Exit
      </button>
    </div>
  );
}
