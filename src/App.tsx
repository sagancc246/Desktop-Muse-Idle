import { useEffect, useState } from 'react';
import { CreditsModal } from './components/CreditsModal';
import { DebugPanel } from './components/DebugPanel';
import { FocusHud } from './components/FocusHud';
import { GameCanvas } from './components/GameCanvas';
import { GalleryPanel } from './components/GalleryPanel';
import { MusePanel } from './components/MusePanel';
import { NeonBackground } from './components/NeonBackground';
import { OfflineRewardModal } from './components/OfflineRewardModal';
import { PinballBackground } from './components/PinballBackground';
import { RebootPanel } from './components/RebootPanel';
import { ResourceBar } from './components/ResourceBar';
import { SettingsModal } from './components/SettingsModal';
import { StageClearOverlay } from './components/StageClearOverlay';
import { StagePanel } from './components/StagePanel';
import { TitleScreen } from './components/TitleScreen';
import { UpgradePanel } from './components/UpgradePanel';
import { STAGE_HEIGHT, STAGE_WIDTH, useStageScale } from './hooks/useStageScale';
import { calculateOfflineReward } from './game/offlineReward';
import { useAppStore } from './store/useAppStore';
import { saveGameState, startAutoSave } from './systems/saveSystem';
import { useGameStore } from './store/useGameStore';
import type { CornerHitPosition } from './types/game';

export default function App() {
  const currentScreen = useAppStore((state) => state.currentScreen);
  const setScreen = useAppStore((state) => state.setScreen);
  const openSettings = useAppStore((state) => state.openSettings);
  const closeSettings = useAppStore((state) => state.closeSettings);
  const isFocusMode = useAppStore((state) => state.isFocusMode);
  const toggleFocusMode = useAppStore((state) => state.toggleFocusMode);
  const exitFocusMode = useAppStore((state) => state.exitFocusMode);
  const autoSaveEnabled = useAppStore((state) => state.settings.autoSaveEnabled);
  const motionIntensity = useAppStore((state) => state.settings.motionIntensity);
  const startNewGame = useGameStore((state) => state.startNewGame);
  const continueGame = useGameStore((state) => state.continueGame);
  const pendingOfflineReward = useGameStore((state) => state.pendingOfflineReward);
  const dismissOfflineReward = useGameStore((state) => state.dismissOfflineReward);
  const pendingStageClear = useGameStore((state) => state.pendingStageClear);
  const dismissStageClear = useGameStore((state) => state.dismissStageClear);
  const lastCornerHitFlash = useGameStore((state) => state.lastCornerHitFlash);
  const [pinballCornerHit, setPinballCornerHit] = useState<CornerHitPosition | null>(null);
  const stageScale = useStageScale();
  const showDebugPanel = import.meta.env.DEV;

  useEffect(() => {
    if (!lastCornerHitFlash) {
      return undefined;
    }

    setPinballCornerHit(null);
    const startTimer = window.setTimeout(() => {
      setPinballCornerHit(lastCornerHitFlash.corner);
    }, 0);
    const clearTimer = window.setTimeout(() => {
      setPinballCornerHit(null);
    }, 680);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(clearTimer);
    };
  }, [lastCornerHitFlash?.occurredAt, lastCornerHitFlash]);

  useEffect(() => {
    if (currentScreen !== 'game' || !autoSaveEnabled) {
      return undefined;
    }

    return startAutoSave(() => useGameStore.getState(), () => useAppStore.getState().settings.motionIntensity);
  }, [autoSaveEnabled, currentScreen]);

  useEffect(() => {
    if (currentScreen !== 'game' || typeof document === 'undefined') {
      return undefined;
    }

    let hiddenStartedAt = document.visibilityState === 'hidden' ? Date.now() : null;

    const checkpointCurrentGame = () => {
      saveGameState(
        useGameStore.getState(),
        useAppStore.getState().settings.motionIntensity,
      );
    };

    const restoreFromVisibilityCheckpoint = () => {
      if (hiddenStartedAt === null) {
        return;
      }

      const now = Date.now();
      const hiddenElapsedMs = now - hiddenStartedAt;
      useGameStore.getState().tickSkillStates(hiddenElapsedMs);
      useGameStore.getState().tickMuseTapStates(now);

      const currentState = useGameStore.getState();
      const offlineReward = calculateOfflineReward({
        lastSavedAt: hiddenStartedAt,
        memoryPerSecond: currentState.memoryPerSecond,
        now,
        unlockedSkillNodes: currentState.unlockedSkillNodes,
      });

      if (offlineReward) {
        useGameStore.setState((state) => ({
          memory: state.memory + offlineReward.memoryEarned,
          pendingOfflineReward: offlineReward,
        }));
      }

      hiddenStartedAt = null;
      saveGameState(
        useGameStore.getState(),
        useAppStore.getState().settings.motionIntensity,
      );
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenStartedAt = Date.now();
        checkpointCurrentGame();
        return;
      }

      restoreFromVisibilityCheckpoint();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', checkpointCurrentGame);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', checkpointCurrentGame);
    };
  }, [currentScreen]);

  useEffect(() => {
    useGameStore.getState().refreshMemoryPerSecond(motionIntensity);
  }, [motionIntensity]);

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
        <NeonBackground />
        <PinballBackground cornerHit={pinballCornerHit} focusMode={isFocusMode} />
        <ResourceBar onFocus={toggleFocusMode} onSettings={() => openSettings('game')} />
        <main className="workspace">
          <UpgradePanel />
          <GameCanvas />
          <div className="side-panel-stack">
            <StagePanel />
            <GalleryPanel />
            <MusePanel />
            {showDebugPanel ? <DebugPanel /> : null}
          </div>
        </main>
        <RebootPanel />
        {isFocusMode ? <FocusHud onExit={exitFocusMode} /> : null}
        {pendingOfflineReward ? (
          <OfflineRewardModal onClose={dismissOfflineReward} reward={pendingOfflineReward} />
        ) : null}
        {pendingStageClear ? (
          <StageClearOverlay onClose={dismissStageClear} summary={pendingStageClear} />
        ) : null}
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
