import { lazy, Suspense, useEffect, useState } from 'react';
import { FocusHud } from './components/FocusHud';
import { BackfillRewardsModal } from './components/BackfillRewardsModal';
import { FirstRunTutorial } from './components/FirstRunTutorial';
import { MusePanel } from './components/MusePanel';
import { MuseOverlayHud } from './components/MuseOverlayHud';
import { MuseUnlockModal } from './components/MuseUnlockModal';
import { NeonBackground } from './components/NeonBackground';
import { OfflineRewardModal } from './components/OfflineRewardModal';
import { PinballBackground } from './components/PinballBackground';
import { RebootPanel } from './components/RebootPanel';
import { ResourceBar } from './components/ResourceBar';
import { SaveStatusToast } from './components/SaveStatusToast';
import { SkinUnlockToast } from './components/SkinUnlockToast';
import { StageClearModal } from './components/StageClearModal';
import { StagePanel } from './components/StagePanel';
import { TitleScreen } from './components/TitleScreen';
import { UpgradePanel } from './components/UpgradePanel';
import { WallpaperModePanel } from './components/WallpaperModePanel';
import { WallpaperStageHud } from './components/WallpaperStageHud';
import { STAGE_HEIGHT, STAGE_WIDTH, useStageScale } from './hooks/useStageScale';
import { calculateOfflineReward } from './game/offlineReward';
import { useAppStore } from './store/useAppStore';
import { useGameStore } from './store/useGameStore';
import { setWallpaperBgmMuted } from './systems/audioSystem';
import {
  isElectronOverlayAvailable,
  onPlatformOverlayExitRequested,
  onPlatformOverlayState,
} from './platform/platform';
import type { CornerHitPosition } from './types/game';

const CreditsModal = lazy(() =>
  import('./components/CreditsModal').then(({ CreditsModal }) => ({ default: CreditsModal })),
);
const DebugPanel = lazy(() =>
  import('./components/DebugPanel').then(({ DebugPanel }) => ({ default: DebugPanel })),
);
const GalleryPanel = lazy(() =>
  import('./components/GalleryPanel').then(({ GalleryPanel }) => ({ default: GalleryPanel })),
);
const GameCanvas = lazy(() =>
  import('./components/GameCanvas').then(({ GameCanvas }) => ({ default: GameCanvas })),
);
const SettingsModal = lazy(() =>
  import('./components/SettingsModal').then(({ SettingsModal }) => ({ default: SettingsModal })),
);
const StatsPanel = lazy(() =>
  import('./components/StatsPanel').then(({ StatsPanel }) => ({ default: StatsPanel })),
);

function LazyStageFallback() {
  return (
    <div className="lazy-screen-loading" role="status">
      Loading...
    </div>
  );
}

export default function App() {
  const currentScreen = useAppStore((state) => state.currentScreen);
  const setScreen = useAppStore((state) => state.setScreen);
  const openSettings = useAppStore((state) => state.openSettings);
  const closeSettings = useAppStore((state) => state.closeSettings);
  const openStats = useAppStore((state) => state.openStats);
  const closeStats = useAppStore((state) => state.closeStats);
  const hasSeenTutorial = useAppStore((state) => state.hasSeenTutorial);
  const completeTutorial = useAppStore((state) => state.completeTutorial);
  const isDebugPanelOpen = useAppStore((state) => state.isDebugPanelOpen);
  const isFocusMode = useAppStore((state) => state.isFocusMode);
  const wallpaperMode = useAppStore((state) => state.wallpaperMode);
  const wallpaperSettings = useAppStore((state) => state.wallpaperSettings);
  const toggleFocusMode = useAppStore((state) => state.toggleFocusMode);
  const toggleDebugPanel = useAppStore((state) => state.toggleDebugPanel);
  const setDebugPanelOpen = useAppStore((state) => state.setDebugPanelOpen);
  const exitFocusMode = useAppStore((state) => state.exitFocusMode);
  const exitWallpaperMode = useAppStore((state) => state.exitWallpaperMode);
  const toggleWallpaperStageMode = useAppStore((state) => state.toggleWallpaperStageMode);
  const setClickThroughEnabled = useAppStore((state) => state.setClickThroughEnabled);
  const applyPlatformOverlayState = useAppStore((state) => state.applyPlatformOverlayState);
  const isClickThroughEnabled = useAppStore((state) => state.isClickThroughEnabled);
  const autoSaveEnabled = useAppStore((state) => state.settings.autoSaveEnabled);
  const language = useAppStore((state) => state.settings.language);
  const motionIntensity = useAppStore((state) => state.settings.motionIntensity);
  const startNewGame = useGameStore((state) => state.startNewGame);
  const continueGame = useGameStore((state) => state.continueGame);
  const autoSave = useGameStore((state) => state.autoSave);
  const addPlayTime = useGameStore((state) => state.addPlayTime);
  const pendingOfflineReward = useGameStore((state) => state.pendingOfflineReward);
  const dismissOfflineReward = useGameStore((state) => state.dismissOfflineReward);
  const pendingStageClear = useGameStore((state) => state.pendingStageClear);
  const dismissStageClear = useGameStore((state) => state.dismissStageClear);
  const pendingBackfillRewards = useGameStore((state) => state.pendingBackfillRewards);
  const dismissBackfillRewards = useGameStore((state) => state.dismissBackfillRewards);
  const newlyUnlockedMuseIds = useGameStore((state) => state.newlyUnlockedMuseIds);
  const dismissMuseUnlock = useGameStore((state) => state.dismissMuseUnlock);
  const newlyUnlockedSkinIds = useGameStore((state) => state.newlyUnlockedSkinIds);
  const dismissSkinUnlock = useGameStore((state) => state.dismissSkinUnlock);
  const lastCornerHitFlash = useGameStore((state) => state.lastCornerHitFlash);
  const [pinballCornerHit, setPinballCornerHit] = useState<CornerHitPosition | null>(null);
  const [galleryOpenRequestKey, setGalleryOpenRequestKey] = useState(0);
  const stageScale = useStageScale();
  const isWallpaperStageMode = wallpaperMode === 'stage';
  const isMuseOverlayMode = wallpaperMode === 'muse_overlay';
  const canShowDebugPanel =
    import.meta.env.DEV &&
    currentScreen === 'game' &&
    !isFocusMode &&
    wallpaperMode === 'off';
  const shouldShowTutorial =
    currentScreen === 'game' &&
    !isMuseOverlayMode &&
    !hasSeenTutorial &&
    !pendingOfflineReward &&
    !pendingStageClear &&
    !pendingBackfillRewards &&
    !newlyUnlockedMuseIds[0];

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

    const intervalId = window.setInterval(() => {
      useGameStore.getState().autoSave();
    }, 10_000);

    return () => window.clearInterval(intervalId);
  }, [autoSave, autoSaveEnabled, currentScreen]);

  useEffect(() => {
    if (currentScreen !== 'game') {
      return undefined;
    }

    let lastTickAt = Date.now();
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      addPlayTime(now - lastTickAt);
      lastTickAt = now;
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, [addPlayTime, currentScreen]);

  useEffect(() => {
    if (currentScreen !== 'game' || typeof document === 'undefined') {
      return undefined;
    }

    let hiddenStartedAt = document.visibilityState === 'hidden' ? Date.now() : null;

    const checkpointCurrentGame = () => {
      useGameStore.getState().autoSave();
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
          stats: {
            ...state.stats,
            totalMemoryEarned: state.stats.totalMemoryEarned + offlineReward.memoryEarned,
          },
          pendingOfflineReward: offlineReward,
        }));
      }

      hiddenStartedAt = null;
      useGameStore.getState().autoSave();
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
    setWallpaperBgmMuted(wallpaperMode !== 'off' && !wallpaperSettings.bgmEnabled);
  }, [wallpaperMode, wallpaperSettings.bgmEnabled]);

  useEffect(() => {
    const unsubscribeExit = onPlatformOverlayExitRequested(() => {
      useAppStore.getState().exitWallpaperMode();
    });
    const unsubscribeState = onPlatformOverlayState((overlayState) => {
      useAppStore.getState().applyPlatformOverlayState(overlayState);
    });

    return () => {
      unsubscribeExit();
      unsubscribeState();
    };
  }, [applyPlatformOverlayState]);

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

      if (
        import.meta.env.DEV &&
        event.ctrlKey &&
        event.shiftKey &&
        event.key.toLowerCase() === 'd' &&
        !isFocusMode &&
        wallpaperMode === 'off'
      ) {
        event.preventDefault();
        toggleDebugPanel();
      } else if (
        event.ctrlKey &&
        event.shiftKey &&
        event.key.toLowerCase() === 'm' &&
        wallpaperMode === 'muse_overlay' &&
        !isElectronOverlayAvailable()
      ) {
        event.preventDefault();
        setClickThroughEnabled(!isClickThroughEnabled);
      } else if (event.key === 'Escape' && isDebugPanelOpen) {
        event.preventDefault();
        setDebugPanelOpen(false);
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        toggleFocusMode();
      } else if (event.key === 'Escape' && wallpaperMode !== 'off') {
        event.preventDefault();
        exitWallpaperMode();
      } else if (event.key === 'Escape' && isFocusMode) {
        event.preventDefault();
        exitFocusMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentScreen,
    exitFocusMode,
    exitWallpaperMode,
    isDebugPanelOpen,
    isClickThroughEnabled,
    isFocusMode,
    setDebugPanelOpen,
    setClickThroughEnabled,
    toggleDebugPanel,
    toggleFocusMode,
    wallpaperMode,
  ]);

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
        onStats={() => openStats('title')}
      />
    );
  } else if (currentScreen === 'settings') {
    screenContent = <SettingsModal onBack={closeSettings} onStats={() => openStats('settings')} />;
  } else if (currentScreen === 'gallery') {
    screenContent = <GalleryPanel mode="screen" onBack={() => setScreen('title')} />;
  } else if (currentScreen === 'credits') {
    screenContent = <CreditsModal onBack={() => setScreen('title')} />;
  } else if (currentScreen === 'stats') {
    screenContent = <StatsPanel onBack={closeStats} />;
  } else {
    screenContent = (
      <div
        className={`app-shell${isFocusMode ? ' focus-mode' : ''}${
          isWallpaperStageMode ? ' wallpaper-stage-mode' : ''
        }${isMuseOverlayMode ? ' muse-overlay-mode' : ''}`}
      >
        <NeonBackground />
        <PinballBackground
          cornerHit={pinballCornerHit}
          focusMode={isFocusMode || isWallpaperStageMode}
        />
        <ResourceBar
          onFocus={toggleFocusMode}
          onSettings={() => openSettings('game')}
          onStats={() => openStats('game')}
          onWallpaperStage={toggleWallpaperStageMode}
          wallpaperMode={wallpaperMode}
        />
        <main className="workspace">
          <UpgradePanel />
          <GameCanvas presentationMode={isMuseOverlayMode ? 'muse_overlay' : 'normal'} />
          <div className="side-panel-stack">
            <StagePanel />
            <WallpaperModePanel />
            <GalleryPanel openRequestKey={galleryOpenRequestKey} />
            <MusePanel />
          </div>
        </main>
        <RebootPanel />
        {canShowDebugPanel ? (
          <button
            aria-label="Toggle Debug Panel"
            className="debug-toggle"
            onClick={toggleDebugPanel}
            type="button"
          >
            Debug
          </button>
        ) : null}
        {canShowDebugPanel && isDebugPanelOpen ? (
          <DebugPanel onClose={() => setDebugPanelOpen(false)} />
        ) : null}
        {!isMuseOverlayMode ? <SaveStatusToast /> : null}
        {isFocusMode ? <FocusHud onExit={exitFocusMode} /> : null}
        {isWallpaperStageMode && wallpaperSettings.showStageHud ? (
          <WallpaperStageHud onExit={exitWallpaperMode} />
        ) : null}
        {isMuseOverlayMode ? (
          <MuseOverlayHud onExit={exitWallpaperMode} />
        ) : null}
        {!isMuseOverlayMode && pendingOfflineReward ? (
          <OfflineRewardModal onClose={dismissOfflineReward} reward={pendingOfflineReward} />
        ) : null}
        {!isMuseOverlayMode && pendingStageClear ? (
          <StageClearModal
            onContinue={dismissStageClear}
            onOpenGallery={() => {
              dismissStageClear();
              setGalleryOpenRequestKey((requestKey) => requestKey + 1);
            }}
            summary={pendingStageClear}
          />
        ) : null}
        {!isMuseOverlayMode && !pendingOfflineReward && !pendingStageClear && pendingBackfillRewards ? (
          <BackfillRewardsModal
            groups={pendingBackfillRewards}
            onContinue={dismissBackfillRewards}
            onOpenGallery={() => {
              dismissBackfillRewards();
              setGalleryOpenRequestKey((requestKey) => requestKey + 1);
            }}
          />
        ) : null}
        {!isMuseOverlayMode && !pendingStageClear && !pendingBackfillRewards && newlyUnlockedMuseIds[0] ? (
          <MuseUnlockModal museId={newlyUnlockedMuseIds[0]} onClose={dismissMuseUnlock} />
        ) : null}
        {!isMuseOverlayMode && !pendingStageClear && !pendingBackfillRewards && newlyUnlockedSkinIds[0] ? (
          <SkinUnlockToast skinId={newlyUnlockedSkinIds[0]} onClose={dismissSkinUnlock} />
        ) : null}
        {shouldShowTutorial ? (
          <FirstRunTutorial language={language} onComplete={completeTutorial} />
        ) : null}
      </div>
    );
  }

  return (
    <div className={`appViewport${isMuseOverlayMode ? ' muse-overlay-viewport' : ''}`}>
      <div
        className="gameStage"
        style={{
          height: STAGE_HEIGHT,
          transform: `scale(${stageScale})`,
          width: STAGE_WIDTH,
        }}
      >
        <Suspense fallback={<LazyStageFallback />}>{screenContent}</Suspense>
      </div>
    </div>
  );
}
