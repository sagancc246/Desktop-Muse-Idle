import { useEffect } from 'react';
import { CreditsModal } from './components/CreditsModal';
import { FocusHud } from './components/FocusHud';
import { GameCanvas } from './components/GameCanvas';
import { GalleryPanel } from './components/GalleryPanel';
import { MusePanel } from './components/MusePanel';
import { RebootPanel } from './components/RebootPanel';
import { ResourceBar } from './components/ResourceBar';
import { SettingsModal } from './components/SettingsModal';
import { StagePanel } from './components/StagePanel';
import { TitleScreen } from './components/TitleScreen';
import { UpgradePanel } from './components/UpgradePanel';
import { STAGE_HEIGHT, STAGE_WIDTH, useStageScale } from './hooks/useStageScale';
import { useAppStore } from './store/useAppStore';
import { startAutoSave } from './systems/saveSystem';
import { useGameStore } from './store/useGameStore';

export default function App() {
  const currentScreen = useAppStore((state) => state.currentScreen);
  const setScreen = useAppStore((state) => state.setScreen);
  const openSettings = useAppStore((state) => state.openSettings);
  const closeSettings = useAppStore((state) => state.closeSettings);
  const isFocusMode = useAppStore((state) => state.isFocusMode);
  const toggleFocusMode = useAppStore((state) => state.toggleFocusMode);
  const exitFocusMode = useAppStore((state) => state.exitFocusMode);
  const autoSaveEnabled = useAppStore((state) => state.settings.autoSaveEnabled);
  const startNewGame = useGameStore((state) => state.startNewGame);
  const continueGame = useGameStore((state) => state.continueGame);
  const stageScale = useStageScale();

  useEffect(() => {
    if (currentScreen !== 'game' || !autoSaveEnabled) {
      return undefined;
    }

    return startAutoSave(() => useGameStore.getState());
  }, [autoSaveEnabled, currentScreen]);

  useEffect(() => {
    if (currentScreen !== 'game') {
      exitFocusMode();
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA');

      if (isEditable || event.repeat) {
        return;
      }

      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        toggleFocusMode();
      } else if (event.key === 'Escape' && isFocusMode) {
        event.preventDefault();
        exitFocusMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, exitFocusMode, isFocusMode, toggleFocusMode]);

  let screenContent;

  if (currentScreen === 'title') {
    screenContent = (
      <TitleScreen
        onContinue={() => {
          continueGame();
          setScreen('game');
        }}
        onCredits={() => setScreen('credits')}
        onGallery={() => setScreen('gallery')}
        onSettings={() => openSettings('title')}
        onStart={() => {
          startNewGame();
          setScreen('game');
        }}
      />
    );
  } else if (currentScreen === 'settings') {
    screenContent = <SettingsModal onBack={closeSettings} />;
  } else if (currentScreen === 'gallery') {
    screenContent = <GalleryPanel mode="screen" onBack={() => setScreen('title')} />;
  } else if (currentScreen === 'credits') {
    screenContent = <CreditsModal onBack={() => setScreen('title')} />;
  } else {
    screenContent = (
      <div className={`app-shell${isFocusMode ? ' focus-mode' : ''}`}>
        <ResourceBar onFocus={toggleFocusMode} onSettings={() => openSettings('game')} />
        <main className="workspace">
          <UpgradePanel />
          <GameCanvas />
          <div className="side-panel-stack">
            <StagePanel />
            <GalleryPanel />
            <MusePanel />
          </div>
        </main>
        <RebootPanel />
        {isFocusMode ? <FocusHud onExit={exitFocusMode} /> : null}
      </div>
    );
  }

  return (
    <div className="appViewport">
      <div
        className="gameStage"
        style={{
          height: STAGE_HEIGHT,
          transform: `scale(${stageScale})`,
          width: STAGE_WIDTH,
        }}
      >
        {screenContent}
      </div>
    </div>
  );
}
