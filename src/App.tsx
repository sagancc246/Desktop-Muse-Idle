import { useEffect } from 'react';
import { CreditsModal } from './components/CreditsModal';
import { DialoguePanel } from './components/DialoguePanel';
import { GameCanvas } from './components/GameCanvas';
import { GalleryPanel } from './components/GalleryPanel';
import { MusePanel } from './components/MusePanel';
import { ResourceBar } from './components/ResourceBar';
import { SettingsModal } from './components/SettingsModal';
import { StagePanel } from './components/StagePanel';
import { TitleScreen } from './components/TitleScreen';
import { UpgradePanel } from './components/UpgradePanel';
import { useAppStore } from './store/useAppStore';
import { startAutoSave } from './systems/saveSystem';
import { useGameStore } from './store/useGameStore';

export default function App() {
  const currentScreen = useAppStore((state) => state.currentScreen);
  const setScreen = useAppStore((state) => state.setScreen);
  const openSettings = useAppStore((state) => state.openSettings);
  const closeSettings = useAppStore((state) => state.closeSettings);
  const autoSaveEnabled = useAppStore((state) => state.settings.autoSaveEnabled);
  const startNewGame = useGameStore((state) => state.startNewGame);
  const continueGame = useGameStore((state) => state.continueGame);

  useEffect(() => {
    if (currentScreen !== 'game' || !autoSaveEnabled) {
      return undefined;
    }

    return startAutoSave(() => useGameStore.getState());
  }, [autoSaveEnabled, currentScreen]);

  if (currentScreen === 'title') {
    return (
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
  }

  if (currentScreen === 'settings') {
    return <SettingsModal onBack={closeSettings} />;
  }

  if (currentScreen === 'gallery') {
    return <GalleryPanel mode="screen" onBack={() => setScreen('title')} />;
  }

  if (currentScreen === 'credits') {
    return <CreditsModal onBack={() => setScreen('title')} />;
  }

  return (
    <div className="app-shell">
      <ResourceBar onSettings={() => openSettings('game')} />
      <main className="workspace">
        <UpgradePanel />
        <GameCanvas />
        <div className="side-panel-stack">
          <StagePanel />
          <GalleryPanel />
          <MusePanel />
        </div>
      </main>
      <DialoguePanel />
    </div>
  );
}
