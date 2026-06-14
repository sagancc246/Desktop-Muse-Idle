'use strict';

const path = require('node:path');
const { app, BrowserWindow, globalShortcut, ipcMain, screen, shell } = require('electron');
const {
  attachWallpaperWindowToDesktop,
  detachWallpaperWindowFromDesktop,
  getWallpaperHostProcessState,
  getWallpaperHelperStatus,
  inspectWallpaperWindow,
  setWallpaperHostExitHandler,
} = require('./nativeWallpaper.cjs');
const { createWallpaperWindow } = require('./wallpaperWindow.cjs');

const developmentUrl = process.env.VITE_DEV_SERVER_URL;
let mainWindow = null;
let overlayState = null;
let overlayLastError = null;
let nativeWallpaperWindow = null;
let nativeWallpaperControlWindow = null;
let isQuittingAfterNativeWallpaperCleanup = false;
let suppressNativeWallpaperCloseStatus = false;
let suppressNativeWallpaperControlCloseStatus = false;
let nativeWallpaperControlWindowState = null;
let lastNativeWallpaperControlRestore = null;
let nativeWallpaperStatus = {
  active: false,
  appVersion: app.getVersion(),
  backend: process.platform === 'win32' ? 'electron_window' : 'none',
  fallbackActive: false,
  attached: false,
  helperAvailable: false,
  helperLastResult: undefined,
  helperPath: undefined,
  helperVersion: undefined,
  lastError:
    process.platform === 'win32' ? undefined : 'Native wallpaper is only available on Windows.',
  nativeAttached: false,
  supported: process.platform === 'win32',
};

function getHelperStatusFields(helperResult) {
  const nativeProbeActive = Boolean(helperResult.probeAttached && helperResult.needsManualVerification);
  const nativeProbeBackend = nativeProbeActive ? helperResult.backend ?? helperResult.attachMethod : undefined;
  const controlViewMinimized = Boolean(
    nativeProbeActive &&
      nativeWallpaperControlWindow &&
      !nativeWallpaperControlWindow.isDestroyed() &&
      nativeWallpaperControlWindow.isMinimized(),
  );
  const savedMainWindowStateBeforeNativeWallpaper = nativeWallpaperControlWindowState
    ? {
        fullScreen: nativeWallpaperControlWindowState.fullScreen,
        maximized: nativeWallpaperControlWindowState.maximized,
        minimized: nativeWallpaperControlWindowState.minimized,
        resizable: nativeWallpaperControlWindowState.resizable,
        alwaysOnTop: nativeWallpaperControlWindowState.alwaysOnTop,
      }
    : undefined;
  const activeDisplaySurfaces = [];
  if (nativeProbeActive) {
    activeDisplaySurfaces.push('native_wallpaper_control_window');
    if (helperResult.backend === 'workerw_child_native_host_probe') {
      activeDisplaySurfaces.push('native_workerw_child');
    } else if (helperResult.backend === 'progman_native_host_probe') {
      activeDisplaySurfaces.push('native_progman_probe');
    } else {
      activeDisplaySurfaces.push('native_probe');
    }
  } else if (helperResult.fallbackActive) {
    activeDisplaySurfaces.push('fallback_stage');
  }
  const mainWindowBounds = mainWindow && !mainWindow.isDestroyed() ? mainWindow.getBounds() : null;
  const controlWindowBounds =
    nativeWallpaperControlWindow && !nativeWallpaperControlWindow.isDestroyed()
      ? nativeWallpaperControlWindow.getBounds()
      : null;
  const primaryBounds = screen.getPrimaryDisplay().bounds;
  const mainWindowCoversPrimaryScreen =
    !nativeProbeActive && !controlViewMinimized && rectCovers(mainWindowBounds, primaryBounds);
  const controlViewWindowBounds = nativeProbeActive ? controlWindowBounds : null;
  const controlViewRestoreTargetScreen = nativeProbeActive ? getControlViewRestoreTargetScreen() : null;

  return {
    appVersion: app.getVersion(),
    activeDisplaySurfaces,
    attachMethod: helperResult.attachMethod,
    electronWallpaperHwnd: helperResult.electronWallpaperHwnd ?? helperResult.hwnd,
    dryRun: Boolean(helperResult.dryRun),
    fallbackReason: helperResult.fallbackReason ?? helperResult.reason,
    helperAvailable: Boolean(helperResult.helperAvailable),
    helperLastResult: JSON.stringify(helperResult),
    helperPid: helperResult.helperPid,
    helperProcessAlive: Boolean(helperResult.helperProcessAlive),
    helperRunning: Boolean(helperResult.helperRunning),
    helperPath: helperResult.helperPath ?? null,
    helperVersion: helperResult.helperVersion,
    hostHwnd: helperResult.hostHwnd,
    clickThroughEnabled: Boolean(helperResult.clickThroughEnabled),
    clickThroughMode: helperResult.clickThroughMode,
    coordinateMode: helperResult.coordinateMode,
    nativeHostHwnd: helperResult.nativeHostHwnd ?? helperResult.hostHwnd,
    nativeExStyleAfterClickThrough: helperResult.nativeExStyleAfterClickThrough,
    nativeExStyleBeforeClickThrough: helperResult.nativeExStyleBeforeClickThrough,
    nativeHostNoActivateEnabled: Boolean(helperResult.nativeHostNoActivateEnabled),
    nativeHostNoActivateRequested: Boolean(helperResult.nativeHostNoActivateRequested),
    nativeHostTransparentEnabled: Boolean(helperResult.nativeHostTransparentEnabled),
    nativeHostTransparentRequested: Boolean(helperResult.nativeHostTransparentRequested),
    needsManualVerification: Boolean(helperResult.needsManualVerification),
    nativeProbeActive,
    nativeProbeBackend,
    nativeProbeVisible: nativeProbeActive,
    renderSurface: nativeProbeActive ? 'control_view' : 'main_window',
    nativeWallpaperSurface: false,
    controlView: nativeProbeActive,
    controlViewMode: nativeProbeActive ? 'native_wallpaper_control' : undefined,
    controlViewMovable: nativeProbeActive,
    controlViewDraggable: nativeProbeActive,
    controlViewMinimizeButtonVisible: nativeProbeActive,
    controlViewCloseButtonVisible: nativeProbeActive,
    controlViewCloseAction: nativeProbeActive ? 'exit_native_wallpaper' : undefined,
    controlViewMinimized,
    controlViewBounds: controlViewWindowBounds,
    controlViewRestoreTargetScreen,
    nativeWallpaperControlWindowCreated: nativeProbeActive && Boolean(nativeWallpaperControlWindow),
    nativeWallpaperControlWindowVisible:
      nativeProbeActive &&
      Boolean(nativeWallpaperControlWindow && !nativeWallpaperControlWindow.isDestroyed()) &&
      !controlViewMinimized,
    nativeWallpaperControlWindowBounds: controlWindowBounds,
    nativeWallpaperControlWindowFrameless: nativeProbeActive,
    nativeWallpaperControlWindowDraggable: nativeProbeActive,
    nativeWallpaperControlWindowRoute: nativeProbeActive ? 'nativeWallpaperControl=1' : undefined,
    nativeWallpaperControlWindowButtonCount: nativeProbeActive ? 3 : 0,
    duplicateControlButtonsDetected: false,
    mainWindowHiddenForNativeWallpaper:
      nativeProbeActive && Boolean(mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()),
    mainWindowRestoredAfterNativeWallpaper: false,
    savedMainWindowBoundsBeforeNativeWallpaper: nativeWallpaperControlWindowState?.bounds,
    savedMainWindowStateBeforeNativeWallpaper,
    savedMenuBarVisibleBeforeNativeWallpaper: nativeWallpaperControlWindowState?.menuBarVisible,
    controlViewWindowResized: nativeProbeActive,
    controlViewWindowResizeReason: nativeProbeActive ? 'native_wallpaper_probe_active' : undefined,
    controlViewMenuBarVisible: nativeProbeActive ? false : undefined,
    menuBarSuppressedForControlView: nativeProbeActive,
    controlViewLayoutCompact: nativeProbeActive,
    controlViewLargeBlankSuppressed: nativeProbeActive,
    mainGameLayoutMounted: false,
    wallpaperStageLayoutMounted: false,
    nativeWallpaperControlViewMounted: nativeProbeActive,
    nativeWallpaperSurfaceInteractiveUiVisible: false,
    nativeWallpaperSurfaceButtonsVisible: false,
    nativeWallpaperSurfaceExitButtonVisible: false,
    controlViewExitButtonVisible: nativeProbeActive,
    controlViewVisible: nativeProbeActive && !controlViewMinimized,
    controlViewDiagnosticsVisible: nativeProbeActive,
    controlViewModeSelectorVisible: nativeProbeActive,
    controlViewWindowBounds,
    mainWindowBounds,
    mainWindowCoversPrimaryScreen,
    mainWindowMayBlockDesktopClicks: nativeProbeActive && !controlViewMinimized && mainWindowCoversPrimaryScreen,
    controlViewTransparentOrEmptySuspected: false,
    desktopIconClickThroughExpected: nativeProbeActive,
    desktopIconClickThroughBlockedSuspected:
      nativeProbeActive && !controlViewMinimized && mainWindowCoversPrimaryScreen,
    wallpaperWindowMayBlockDesktopClicks: false,
    controlViewMayBlockDesktopClicks: nativeProbeActive,
    electronWallpaperIgnoreMouseEventsEnabled: Boolean(helperResult.electronIgnoreMouseEventsEnabled),
    nativeHostToolWindowEnabled: Boolean(helperResult.nativeHostNoActivateEnabled),
    appScreen: undefined,
    previousAppScreenBeforeNativeWallpaper: undefined,
    restoredAppScreenAfterNativeWallpaperOff: undefined,
    nativeWallpaperChangedAppScreen: false,
    mainWindowGameCanvasSuppressed: nativeProbeActive,
    mainWindowGameCanvasSuppressionReason: nativeProbeActive
      ? 'native_probe_control_view_hides_game_canvas'
      : undefined,
    normalGameCanvasVisible: !nativeProbeActive,
    normalBackgroundVisible: !nativeProbeActive,
    normalMuseVisible: !nativeProbeActive,
    wallpaperSurfaceClickThroughExpected: nativeProbeActive,
    wallpaperSurfaceUiSuppressed: nativeProbeActive,
    wallpaperSurfaceUiSuppressionReason: nativeProbeActive
      ? 'native_wallpaper_surface_is_click_through_visual_only'
      : undefined,
    fallbackStageVisible: false,
    overlayVisible: Boolean(overlayState),
    mainStageVisible: !nativeProbeActive,
    duplicateStageSuppressed: nativeProbeActive,
    duplicateStageSuppressionReason: nativeProbeActive
      ? 'native_probe_active_hides_main_and_fallback_stage'
      : undefined,
    probeAttached: Boolean(helperResult.probeAttached),
    progmanCandidate: helperResult.progmanCandidate,
    progmanCoversPrimaryScreen: helperResult.progmanCoversPrimaryScreen,
    progmanHasShellDllDefView: helperResult.progmanHasShellDllDefView,
    progmanHasSysListView32: helperResult.progmanHasSysListView32,
    progmanHwnd: helperResult.progmanHwnd,
    progmanNativeHostHwnd: helperResult.progmanNativeHostHwnd,
    progmanNativeHostProbeResult: helperResult.progmanNativeHostProbeResult,
    progmanChildrenAfterHostCreate: Array.isArray(helperResult.progmanChildrenAfterHostCreate)
      ? helperResult.progmanChildrenAfterHostCreate
      : [],
    progmanChildrenAfterSetParent: Array.isArray(helperResult.progmanChildrenAfterSetParent)
      ? helperResult.progmanChildrenAfterSetParent
      : [],
    progmanChildrenAfterZOrder: Array.isArray(helperResult.progmanChildrenAfterZOrder)
      ? helperResult.progmanChildrenAfterZOrder
      : [],
    progmanChildrenBeforeProbe: Array.isArray(helperResult.progmanChildrenBeforeProbe)
      ? helperResult.progmanChildrenBeforeProbe
      : [],
    progmanChildWorkerWCandidates: Array.isArray(helperResult.progmanChildWorkerWCandidates)
      ? helperResult.progmanChildWorkerWCandidates
      : [],
    progmanProbeAttempted: Boolean(
      helperResult.attachMethod === 'progman_native_host_probe' ||
        helperResult.backend === 'progman_native_host_probe',
    ),
    selectedProgmanChildWorkerWHwnd: helperResult.selectedProgmanChildWorkerWHwnd,
    workerWProbeAttempted: Boolean(
      helperResult.attachMethod === 'workerw_native_host_probe' ||
        helperResult.backend === 'workerw_native_host_probe' ||
        helperResult.attachMethod === 'workerw_child_native_host_probe' ||
        helperResult.backend === 'workerw_child_native_host_probe',
    ),
    requestedParentClientRect: helperResult.requestedParentClientRect,
    requestedScreenRect: helperResult.requestedScreenRect,
    progmanClientRect: helperResult.progmanClientRect,
    progmanWindowRect: helperResult.progmanWindowRect,
    hostWindowRect: helperResult.hostWindowRect,
    parentHwndAfterSetParent: helperResult.parentHwndAfterSetParent,
    cleanupStaleHostWindowsAttempted: Boolean(helperResult.cleanupStaleHostWindowsAttempted),
    cleanupStaleHostWindowsFailed: Boolean(helperResult.cleanupStaleHostWindowsFailed),
    cleanupStaleHostWindowsSucceeded: Boolean(helperResult.cleanupStaleHostWindowsSucceeded),
    electronIgnoreMouseEventsEnabled: Boolean(helperResult.electronIgnoreMouseEventsEnabled),
    electronIgnoreMouseEventsRequested: Boolean(helperResult.electronIgnoreMouseEventsRequested),
    electronParentHwndAfterSetParent: helperResult.electronParentHwndAfterSetParent,
    hostParentHwndAfterSetParent: helperResult.hostParentHwndAfterSetParent,
    hostRectAfterSetParent: helperResult.hostRectAfterSetParent,
    hostRectAfterSetWindowPos: helperResult.hostRectAfterSetWindowPos,
    hostRectBeforeSetParent: helperResult.hostRectBeforeSetParent,
    hostRelativeToShellDllDefView: helperResult.hostRelativeToShellDllDefView,
    hostRelativeToSysListView32: helperResult.hostRelativeToSysListView32,
    hitTestTransparentIfImplemented: Boolean(helperResult.hitTestTransparentIfImplemented),
    closestWorkerWHwnd: helperResult.closestWorkerWHwnd,
    closestWorkerWReason: helperResult.closestWorkerWReason,
    preferredWorkerWHwnd: helperResult.preferredWorkerWHwnd ?? null,
    preferredReason: helperResult.preferredReason,
    progmanFound: helperResult.progmanFound,
    rectMismatch: Boolean(helperResult.rectMismatch),
    reason: helperResult.reason,
    restoredAfterProbe: helperResult.restoredAfterProbe,
    shellDllDefViewFound: helperResult.shellDllDefViewFound,
    shellDllDefViewHwnd: helperResult.shellDllDefViewHwnd,
    sysListView32Hwnd: helperResult.sysListView32Hwnd,
    previousParentHwnd: helperResult.previousParentHwnd,
    setParentSucceeded: helperResult.setParentSucceeded,
    setParentResult: helperResult.setParentResult,
    setWindowPosSucceeded: helperResult.setWindowPosSucceeded,
    virtualScreenRect: helperResult.virtualScreenRect,
    wallpaperWindowRect: helperResult.wallpaperWindowRect,
    wallpaperRectAfterSetParent: helperResult.wallpaperRectAfterSetParent,
    wallpaperRectAfterSetWindowPos: helperResult.wallpaperRectAfterSetWindowPos,
    staleHostWindowsBeforeCleanup: Array.isArray(helperResult.staleHostWindowsBeforeCleanup)
      ? helperResult.staleHostWindowsBeforeCleanup
      : [],
    progmanChildrenAfterCleanup: Array.isArray(helperResult.progmanChildrenAfterCleanup)
      ? helperResult.progmanChildrenAfterCleanup
      : [],
    workerWChildHwnd: helperResult.workerWChildHwnd,
    workerWChildNativeHostProbeHwnd: helperResult.workerWChildNativeHostProbeHwnd,
    workerWChildNativeHostProbeResult: helperResult.workerWChildNativeHostProbeResult,
    workerWNativeHostProbeHwnd: helperResult.workerWNativeHostProbeHwnd,
    workerWNativeHostProbeResult: helperResult.workerWNativeHostProbeResult,
    selectedWorkerWHwnd: helperResult.selectedWorkerWHwnd,
    selectedWorkerWStrategy: helperResult.selectedWorkerWStrategy,
    zOrderResult: helperResult.zOrderResult,
    zOrderStrategy: helperResult.zOrderStrategy,
    zOrderStrategyResults: Array.isArray(helperResult.zOrderStrategyResults)
      ? helperResult.zOrderStrategyResults
      : [],
    zOrderSucceeded: helperResult.zOrderSucceeded,
    warnings: Array.isArray(helperResult.warnings) ? helperResult.warnings : [],
    workerWHwnd: helperResult.workerWHwnd,
    workerWCandidates: Array.isArray(helperResult.workerWCandidates)
      ? helperResult.workerWCandidates
      : [],
    workerWCandidatesBeforeMessage: Array.isArray(helperResult.workerWCandidatesBeforeMessage)
      ? helperResult.workerWCandidatesBeforeMessage
      : [],
    workerWCreatedHwnds: Array.isArray(helperResult.workerWCreatedHwnds)
      ? helperResult.workerWCreatedHwnds
      : [],
    workerWRemovedHwnds: Array.isArray(helperResult.workerWRemovedHwnds)
      ? helperResult.workerWRemovedHwnds
      : [],
    workerWSelectionOrder: Array.isArray(helperResult.workerWSelectionOrder)
      ? helperResult.workerWSelectionOrder
      : [],
    workerWDiscoveryStrategies: Array.isArray(helperResult.workerWDiscoveryStrategies)
      ? helperResult.workerWDiscoveryStrategies
      : [],
    workerWCandidateCount:
      typeof helperResult.workerWCandidateCount === 'number'
        ? helperResult.workerWCandidateCount
        : Array.isArray(helperResult.workerWCandidates)
          ? helperResult.workerWCandidates.length
          : undefined,
  };
}

function rectCovers(rect, target) {
  if (!rect || !target) {
    return false;
  }

  return rect.x <= target.x &&
    rect.y <= target.y &&
    rect.x + rect.width >= target.x + target.width &&
    rect.y + rect.height >= target.y + target.height;
}

function getControlViewRestoreTargetScreen() {
  if (nativeWallpaperControlWindowState?.restoreTargetScreen) {
    return nativeWallpaperControlWindowState.restoreTargetScreen;
  }
  const referenceBounds = mainWindow && !mainWindow.isDestroyed()
    ? mainWindow.getBounds()
    : screen.getPrimaryDisplay().bounds;
  const display = screen.getDisplayMatching(referenceBounds);
  return {
    id: display.id,
    bounds: display.bounds,
    workArea: display.workArea,
  };
}

function getControlViewBounds() {
  const primaryBounds = screen.getPrimaryDisplay().workArea;
  const width = Math.min(560, Math.max(520, primaryBounds.width - 96));
  const height = Math.min(400, Math.max(360, primaryBounds.height - 96));
  return {
    x: primaryBounds.x + primaryBounds.width - width - 24,
    y: primaryBounds.y + 40,
    width,
    height,
  };
}

function getMenuBarVisible(window) {
  if (!window || window.isDestroyed() || typeof window.isMenuBarVisible !== 'function') {
    return true;
  }
  return window.isMenuBarVisible();
}

function getNativeWallpaperControlUrl() {
  if (!developmentUrl) {
    return null;
  }
  const url = new URL(developmentUrl);
  url.searchParams.set('nativeWallpaperControl', '1');
  return url.toString();
}

function createNativeWallpaperControlWindow() {
  if (nativeWallpaperControlWindow && !nativeWallpaperControlWindow.isDestroyed()) {
    nativeWallpaperControlWindow.show();
    nativeWallpaperControlWindow.focus();
    return nativeWallpaperControlWindow;
  }

  nativeWallpaperControlWindow = new BrowserWindow({
    title: 'Native Wallpaper Control',
    ...getControlViewBounds(),
    minWidth: 520,
    minHeight: 360,
    resizable: false,
    frame: false,
    transparent: false,
    show: false,
    alwaysOnTop: false,
    skipTaskbar: false,
    autoHideMenuBar: true,
    backgroundColor: '#070919',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: true,
    },
  });

  nativeWallpaperControlWindow.setMenuBarVisibility(false);
  if (typeof nativeWallpaperControlWindow.setMenu === 'function') {
    nativeWallpaperControlWindow.setMenu(null);
  }
  nativeWallpaperControlWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      void shell.openExternal(url);
    }

    return { action: 'deny' };
  });
  nativeWallpaperControlWindow.on('closed', () => {
    nativeWallpaperControlWindow = null;
    if (suppressNativeWallpaperControlCloseStatus) {
      suppressNativeWallpaperControlCloseStatus = false;
      return;
    }
    if (nativeWallpaperStatus.nativeProbeActive || nativeWallpaperStatus.probeAttached) {
      void exitNativeWallpaperMode();
    }
  });
  nativeWallpaperControlWindow.on('minimize', () => {
    setNativeWallpaperStatus({
      controlViewMinimized: true,
      controlViewVisible: false,
      nativeWallpaperControlWindowVisible: false,
      nativeWallpaperControlWindowBounds:
        nativeWallpaperControlWindow && !nativeWallpaperControlWindow.isDestroyed()
          ? nativeWallpaperControlWindow.getBounds()
          : null,
    });
  });
  nativeWallpaperControlWindow.on('restore', () => {
    setNativeWallpaperStatus({
      controlViewMinimized: false,
      controlViewVisible: true,
      nativeWallpaperControlWindowVisible: true,
      nativeWallpaperControlWindowBounds:
        nativeWallpaperControlWindow && !nativeWallpaperControlWindow.isDestroyed()
          ? nativeWallpaperControlWindow.getBounds()
          : null,
    });
  });

  const controlUrl = getNativeWallpaperControlUrl();
  if (controlUrl) {
    void nativeWallpaperControlWindow.loadURL(controlUrl);
  } else {
    void nativeWallpaperControlWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), {
      query: { nativeWallpaperControl: '1' },
    });
  }
  nativeWallpaperControlWindow.once('ready-to-show', () => {
    nativeWallpaperControlWindow?.show();
    nativeWallpaperControlWindow?.focus();
    setNativeWallpaperStatus({
      nativeWallpaperControlWindowCreated: true,
      nativeWallpaperControlWindowVisible: true,
      nativeWallpaperControlWindowBounds: nativeWallpaperControlWindow?.getBounds() ?? null,
    });
  });
  return nativeWallpaperControlWindow;
}

function closeNativeWallpaperControlWindow() {
  if (!nativeWallpaperControlWindow || nativeWallpaperControlWindow.isDestroyed()) {
    nativeWallpaperControlWindow = null;
    return;
  }
  suppressNativeWallpaperControlCloseStatus = true;
  nativeWallpaperControlWindow.close();
  nativeWallpaperControlWindow = null;
}

function enterNativeWallpaperControlView() {
  if (!mainWindow || mainWindow.isDestroyed() || nativeWallpaperControlWindowState) {
    return null;
  }
  lastNativeWallpaperControlRestore = null;

  nativeWallpaperControlWindowState = {
    alwaysOnTop: mainWindow.isAlwaysOnTop(),
    bounds: mainWindow.getBounds(),
    fullScreen: mainWindow.isFullScreen(),
    maximized: mainWindow.isMaximized(),
    minimized: mainWindow.isMinimized(),
    menu: typeof mainWindow.getMenu === 'function' ? mainWindow.getMenu() : null,
    menuBarVisible: getMenuBarVisible(mainWindow),
    minimumSize: mainWindow.getMinimumSize(),
    resizable: mainWindow.isResizable(),
    restoreTargetScreen: getControlViewRestoreTargetScreen(),
    skipTaskbar: false,
    visible: mainWindow.isVisible(),
  };

  mainWindow.hide();
  const controlWindow = createNativeWallpaperControlWindow();
  return controlWindow?.getBounds() ?? null;
}

function minimizeNativeWallpaperControlView() {
  if (!nativeWallpaperControlWindow || nativeWallpaperControlWindow.isDestroyed()) {
    return { ok: false, reason: 'control_window_unavailable' };
  }
  if (!nativeWallpaperStatus.nativeProbeActive && !nativeWallpaperStatus.probeAttached) {
    return { ok: false, reason: 'native_probe_not_active' };
  }

  nativeWallpaperControlWindow.minimize();
  setNativeWallpaperStatus({
    controlViewMinimized: true,
    controlViewVisible: false,
    nativeWallpaperControlWindowVisible: false,
    nativeWallpaperControlWindowBounds: nativeWallpaperControlWindow.getBounds(),
    controlViewBounds: nativeWallpaperControlWindow.getBounds(),
    controlViewWindowBounds: nativeWallpaperControlWindow.getBounds(),
    mainWindowMayBlockDesktopClicks: false,
    desktopIconClickThroughBlockedSuspected: false,
  });
  return { ok: true, minimized: true };
}

function exitNativeWallpaperControlView() {
  closeNativeWallpaperControlWindow();
  if (!mainWindow || mainWindow.isDestroyed() || !nativeWallpaperControlWindowState) {
    nativeWallpaperControlWindowState = null;
    return null;
  }

  const previousState = nativeWallpaperControlWindowState;
  nativeWallpaperControlWindowState = null;
  mainWindow.setIgnoreMouseEvents(false);
  if (typeof mainWindow.setFocusable === 'function') {
    mainWindow.setFocusable(true);
  }
  mainWindow.setAlwaysOnTop(previousState.alwaysOnTop);
  mainWindow.setSkipTaskbar(previousState.skipTaskbar);
  if (typeof mainWindow.setMenu === 'function') {
    mainWindow.setMenu(previousState.menu ?? null);
  }
  mainWindow.setMenuBarVisibility(previousState.menuBarVisible);
  mainWindow.setAutoHideMenuBar(!previousState.menuBarVisible);
  mainWindow.setResizable(previousState.resizable);
  mainWindow.setMinimumSize(previousState.minimumSize[0], previousState.minimumSize[1]);
  if (previousState.fullScreen) {
    mainWindow.setFullScreen(true);
  } else {
    mainWindow.setBounds(previousState.bounds);
    if (previousState.maximized) {
      mainWindow.maximize();
    }
  }
  if (previousState.minimized) {
    mainWindow.minimize();
  } else if (previousState.visible) {
    mainWindow.show();
    mainWindow.focus();
  }
  lastNativeWallpaperControlRestore = {
    bounds: mainWindow.getBounds(),
    reason: 'native_wallpaper_exit',
    state: {
      fullScreen: previousState.fullScreen,
      maximized: previousState.maximized,
      minimized: previousState.minimized,
      resizable: previousState.resizable,
      alwaysOnTop: previousState.alwaysOnTop,
    },
  };
  return mainWindow.getBounds();
}

function getNativeWallpaperStatus() {
  return nativeWallpaperStatus;
}

function setNativeWallpaperStatus(updates) {
  nativeWallpaperStatus = {
    ...nativeWallpaperStatus,
    ...updates,
  };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('wallpaper:native-status', nativeWallpaperStatus);
  }
  if (nativeWallpaperControlWindow && !nativeWallpaperControlWindow.isDestroyed()) {
    nativeWallpaperControlWindow.webContents.send('wallpaper:native-status', nativeWallpaperStatus);
  }
}

function logNativeWallpaperDiagnostic(eventName, payload = {}) {
  try {
    console.info(
      `[native-wallpaper] ${eventName}`,
      JSON.stringify({
        appVersion: app.getVersion(),
        ...payload,
      }),
    );
  } catch {
    console.info(`[native-wallpaper] ${eventName}`);
  }
}

function setNativeWallpaperFallback(reason, helperResult = {}) {
  logNativeWallpaperDiagnostic('fallback', { reason, helperResult });
  const restoredControlViewBounds = exitNativeWallpaperControlView();
  setNativeWallpaperStatus({
    active: false,
    backend: 'fallback_stage',
    fallbackActive: true,
    attached: false,
    ...getHelperStatusFields({
      ...getWallpaperHostProcessState(),
      ...helperResult,
      reason,
    }),
    fallbackReason: reason,
    fallbackStageVisible: true,
    nativeProbeActive: false,
    nativeProbeVisible: false,
    overlayVisible: Boolean(overlayState),
    mainStageVisible: true,
    duplicateStageSuppressed: false,
    activeDisplaySurfaces: ['fallback_stage'],
    restoredControlViewBounds,
    lastError: `Native wallpaper fallback: ${reason}`,
    nativeAttached: false,
    supported: process.platform === 'win32',
  });
}

async function refreshNativeWallpaperInspection() {
  if (!nativeWallpaperStatus.active || !nativeWallpaperStatus.attached) {
    return nativeWallpaperStatus;
  }

  const inspectResult = await inspectWallpaperWindow();
  logNativeWallpaperDiagnostic('inspect', inspectResult);
  if (!inspectResult.ok || !inspectResult.attached) {
    const reason = inspectResult.reason ?? 'native_wallpaper_inspection_failed';
    await closeNativeWallpaperWindow();
    setNativeWallpaperFallback(reason, inspectResult);
    return nativeWallpaperStatus;
  }

  setNativeWallpaperStatus({
    ...getHelperStatusFields(inspectResult),
    active: true,
    attached: true,
    backend: 'native_desktop_wallpaper',
    fallbackActive: false,
    lastError: undefined,
    nativeAttached: true,
  });
  return nativeWallpaperStatus;
}

setWallpaperHostExitHandler((hostExitResult) => {
  if (!nativeWallpaperStatus.active && !nativeWallpaperStatus.attached) {
    return;
  }

  setNativeWallpaperFallback(hostExitResult.reason ?? 'host_helper_process_exited', hostExitResult);
  if (nativeWallpaperWindow && !nativeWallpaperWindow.isDestroyed()) {
    suppressNativeWallpaperCloseStatus = true;
    nativeWallpaperWindow.close();
  }
  nativeWallpaperWindow = null;
});

async function closeNativeWallpaperWindow() {
  if (nativeWallpaperWindow && !nativeWallpaperWindow.isDestroyed()) {
    const detachResult = await detachWallpaperWindowFromDesktop(nativeWallpaperWindow);
    logNativeWallpaperDiagnostic('detach-result', detachResult);
    if (!detachResult.ok || detachResult.reason) {
      setNativeWallpaperStatus({
        helperLastResult: JSON.stringify(detachResult),
        lastError: detachResult.reason
          ? `Native wallpaper detach returned: ${detachResult.reason}`
          : nativeWallpaperStatus.lastError,
      });
    }
    suppressNativeWallpaperCloseStatus = true;
    nativeWallpaperWindow.close();
  }
  nativeWallpaperWindow = null;
}

async function exitNativeWallpaperMode() {
  await closeNativeWallpaperWindow();
  const restoredControlViewBounds = exitNativeWallpaperControlView();
  setNativeWallpaperStatus({
    active: false,
    activeDisplaySurfaces: [],
    backend: process.platform === 'win32' ? 'electron_window' : 'none',
    fallbackActive: false,
    attached: false,
    duplicateStageSuppressed: false,
    duplicateStageSuppressionReason: undefined,
    fallbackStageVisible: false,
    controlViewVisible: false,
    controlViewExitButtonVisible: false,
    controlViewDiagnosticsVisible: false,
    controlViewModeSelectorVisible: false,
    controlViewMode: undefined,
    controlViewMovable: false,
    controlViewDraggable: false,
    controlViewMinimizeButtonVisible: false,
    controlViewCloseButtonVisible: false,
    controlViewCloseAction: undefined,
    controlViewMinimized: false,
    controlViewBounds: null,
    controlViewRestoreTargetScreen: null,
    controlViewWindowResized: false,
    controlViewWindowResizeReason: undefined,
    controlViewMenuBarVisible: getMenuBarVisible(mainWindow),
    menuBarSuppressedForControlView: false,
    controlViewLayoutCompact: false,
    controlViewLargeBlankSuppressed: false,
    mainGameLayoutMounted: true,
    wallpaperStageLayoutMounted: false,
    nativeWallpaperControlViewMounted: false,
    nativeWallpaperControlWindowCreated: false,
    nativeWallpaperControlWindowVisible: false,
    nativeWallpaperControlWindowBounds: null,
    nativeWallpaperControlWindowFrameless: false,
    nativeWallpaperControlWindowDraggable: false,
    nativeWallpaperControlWindowRoute: undefined,
    nativeWallpaperControlWindowButtonCount: 0,
    duplicateControlButtonsDetected: false,
    mainWindowHiddenForNativeWallpaper: false,
    mainWindowRestoredAfterNativeWallpaper: Boolean(lastNativeWallpaperControlRestore),
    restoredMainWindowBoundsAfterNativeWallpaper:
      lastNativeWallpaperControlRestore?.bounds ?? restoredControlViewBounds,
    restoredMainWindowStateAfterNativeWallpaper: lastNativeWallpaperControlRestore?.state,
    restoreMainWindowReason: lastNativeWallpaperControlRestore?.reason,
    restoredControlViewBounds,
    helperProcessAlive: false,
    helperRunning: false,
    mainStageVisible: true,
    mainWindowGameCanvasSuppressed: false,
    mainWindowGameCanvasSuppressionReason: undefined,
    nativeAttached: false,
    nativeProbeActive: false,
    nativeProbeBackend: undefined,
    nativeProbeVisible: false,
    overlayVisible: Boolean(overlayState),
    probeAttached: false,
    renderSurface: 'main_window',
    controlView: false,
    normalGameCanvasVisible: true,
    normalBackgroundVisible: true,
    normalMuseVisible: true,
  });
}

async function enterNativeWallpaperMode() {
  if (process.platform !== 'win32') {
    const message = 'Native wallpaper is only available on Windows.';
    setNativeWallpaperStatus({
      active: false,
      backend: 'none',
      fallbackActive: true,
      attached: false,
      helperAvailable: false,
      lastError: message,
      nativeAttached: false,
      supported: false,
    });
    return { ok: false, mode: 'unsupported', message };
  }

  try {
    if (overlayState) {
      exitOverlayMode({ notifyRenderer: true });
    }
    await closeNativeWallpaperWindow();
    nativeWallpaperWindow = createWallpaperWindow({ developmentUrl });
    logNativeWallpaperDiagnostic('enter-start', {
      development: Boolean(developmentUrl),
    });
    nativeWallpaperWindow.on('closed', () => {
      nativeWallpaperWindow = null;
      if (suppressNativeWallpaperCloseStatus) {
        suppressNativeWallpaperCloseStatus = false;
        return;
      }
      setNativeWallpaperStatus({
        active: false,
        fallbackActive: false,
        nativeAttached: false,
      });
    });

    const attachResult = await attachWallpaperWindowToDesktop(nativeWallpaperWindow);
    logNativeWallpaperDiagnostic('attach-result', attachResult);
    if (attachResult.ok && attachResult.probeAttached && attachResult.needsManualVerification) {
      nativeWallpaperWindow.setIgnoreMouseEvents(true, { forward: true });
      nativeWallpaperWindow.showInactive();
      const controlViewWindowBounds = enterNativeWallpaperControlView();
      const mainWindowBounds = mainWindow && !mainWindow.isDestroyed() ? mainWindow.getBounds() : null;
      const mainWindowCoversPrimaryScreen =
        Boolean(mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) &&
        rectCovers(mainWindowBounds, screen.getPrimaryDisplay().bounds);
      setNativeWallpaperStatus({
        active: true,
        backend: attachResult.backend ?? 'fallback_stage',
        fallbackActive: false,
        attached: false,
        ...getHelperStatusFields(attachResult),
        clickThroughEnabled: true,
        clickThroughMode: attachResult.nativeHostTransparentEnabled ? 'both' : 'electron_only',
        electronIgnoreMouseEventsEnabled: true,
        electronIgnoreMouseEventsRequested: true,
        fallbackStageVisible: false,
        mainStageVisible: false,
        nativeProbeActive: true,
        nativeProbeBackend: attachResult.backend,
        nativeProbeVisible: true,
        renderSurface: 'control_view',
        nativeWallpaperSurface: false,
        controlView: true,
        controlViewMode: 'native_wallpaper_control',
        controlViewMovable: true,
        controlViewDraggable: true,
        controlViewMinimizeButtonVisible: true,
        controlViewCloseButtonVisible: true,
        controlViewCloseAction: 'exit_native_wallpaper',
        controlViewMinimized: false,
        controlViewBounds: controlViewWindowBounds,
        controlViewRestoreTargetScreen: getControlViewRestoreTargetScreen(),
        savedMainWindowBoundsBeforeNativeWallpaper: nativeWallpaperControlWindowState?.bounds,
        savedMainWindowStateBeforeNativeWallpaper: nativeWallpaperControlWindowState
          ? {
              fullScreen: nativeWallpaperControlWindowState.fullScreen,
              maximized: nativeWallpaperControlWindowState.maximized,
              minimized: nativeWallpaperControlWindowState.minimized,
              resizable: nativeWallpaperControlWindowState.resizable,
              alwaysOnTop: nativeWallpaperControlWindowState.alwaysOnTop,
            }
          : undefined,
        savedMenuBarVisibleBeforeNativeWallpaper: nativeWallpaperControlWindowState?.menuBarVisible,
        controlViewWindowResized: true,
        controlViewWindowResizeReason: 'native_wallpaper_probe_active',
        controlViewMenuBarVisible: false,
        menuBarSuppressedForControlView: true,
        controlViewLayoutCompact: true,
        controlViewLargeBlankSuppressed: true,
        mainGameLayoutMounted: false,
        wallpaperStageLayoutMounted: false,
        nativeWallpaperControlViewMounted: true,
        nativeWallpaperControlWindowCreated: true,
        nativeWallpaperControlWindowVisible: true,
        nativeWallpaperControlWindowBounds: controlViewWindowBounds,
        nativeWallpaperControlWindowFrameless: true,
        nativeWallpaperControlWindowDraggable: true,
        nativeWallpaperControlWindowRoute: 'nativeWallpaperControl=1',
        nativeWallpaperControlWindowButtonCount: 3,
        duplicateControlButtonsDetected: false,
        mainWindowHiddenForNativeWallpaper:
          Boolean(mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()),
        mainWindowRestoredAfterNativeWallpaper: false,
        controlViewVisible: true,
        controlViewDiagnosticsVisible: true,
        controlViewModeSelectorVisible: true,
        nativeWallpaperSurfaceInteractiveUiVisible: false,
        nativeWallpaperSurfaceButtonsVisible: false,
        nativeWallpaperSurfaceExitButtonVisible: false,
        controlViewExitButtonVisible: true,
        controlViewWindowBounds,
        mainWindowBounds,
        mainWindowCoversPrimaryScreen,
        mainWindowMayBlockDesktopClicks: mainWindowCoversPrimaryScreen,
        controlViewTransparentOrEmptySuspected: false,
        desktopIconClickThroughExpected: true,
        desktopIconClickThroughBlockedSuspected: mainWindowCoversPrimaryScreen,
        wallpaperWindowMayBlockDesktopClicks: false,
        controlViewMayBlockDesktopClicks: true,
        electronWallpaperIgnoreMouseEventsEnabled: true,
        nativeHostToolWindowEnabled: Boolean(attachResult.nativeHostNoActivateEnabled),
        mainWindowGameCanvasSuppressed: true,
        mainWindowGameCanvasSuppressionReason: 'native_probe_control_view_hides_game_canvas',
        normalGameCanvasVisible: false,
        normalBackgroundVisible: false,
        normalMuseVisible: false,
        wallpaperSurfaceClickThroughExpected: true,
        wallpaperSurfaceUiSuppressed: true,
        wallpaperSurfaceUiSuppressionReason: 'native_wallpaper_surface_is_click_through_visual_only',
        overlayVisible: false,
        duplicateStageSuppressed: true,
        duplicateStageSuppressionReason: 'native_probe_active_hides_main_and_fallback_stage',
        lastError: 'Native wallpaper probe is active. Manual verification required.',
        nativeAttached: false,
        supported: true,
      });
      return {
        ok: false,
        mode: 'fallback_stage',
        message: nativeWallpaperStatus.lastError,
      };
    }

    if (!attachResult.ok || !attachResult.attached) {
      await closeNativeWallpaperWindow();
      exitNativeWallpaperControlView();
      const message =
        attachResult.message ??
        attachResult.reason ??
        'Native wallpaper attach failed. Fallback to Wallpaper Stage Mode.';
      setNativeWallpaperStatus({
        active: false,
        backend: 'fallback_stage',
        fallbackActive: true,
        attached: false,
        ...getHelperStatusFields(attachResult),
        lastError: `Native wallpaper attach failed. Fallback to Wallpaper Stage Mode. ${message}`,
        nativeAttached: false,
        supported: true,
      });
      return {
        ok: false,
        mode: 'fallback_stage',
        message: nativeWallpaperStatus.lastError,
      };
    }

    nativeWallpaperWindow.setIgnoreMouseEvents(true, { forward: true });
    nativeWallpaperWindow.showInactive();
    setNativeWallpaperStatus({
      active: true,
      backend: attachResult.backend ?? 'native_desktop_wallpaper',
      fallbackActive: false,
      attached: true,
      ...getHelperStatusFields(attachResult),
      lastError: undefined,
      nativeAttached: true,
      supported: true,
    });
    return { ok: true, mode: 'native_desktop_wallpaper' };
  } catch (error) {
    await closeNativeWallpaperWindow();
    exitNativeWallpaperControlView();
    const message = error instanceof Error ? error.message : String(error);
    setNativeWallpaperStatus({
      active: false,
      backend: 'fallback_stage',
      fallbackActive: true,
      attached: false,
      lastError: `Native wallpaper attach failed. Fallback to Wallpaper Stage Mode. ${message}`,
      nativeAttached: false,
      supported: true,
    });
    return {
      ok: false,
      mode: 'fallback_stage',
      message: nativeWallpaperStatus.lastError,
    };
  }
}

function getOverlayStatus() {
  const status = {
    active: overlayState !== null,
    alwaysOnTop: mainWindow && !mainWindow.isDestroyed() ? mainWindow.isAlwaysOnTop() : false,
    clickThrough: overlayState?.clickThrough ?? false,
    transparent: overlayState !== null,
    lastError: overlayLastError ?? undefined,
  };

  return {
    ...status,
    overlayActive: status.active,
    alwaysOnTopEnabled: status.alwaysOnTop,
    clickThroughEnabled: status.clickThrough,
    transparentEnabled: status.transparent,
  };
}

function sendOverlayState() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send('desktop-muse-idle:overlay-state', getOverlayStatus());
}

function setClickThrough(enabled) {
  if (!mainWindow || mainWindow.isDestroyed() || !overlayState) {
    overlayLastError = 'Click Through can only be changed while Muse Overlay is active.';
    sendOverlayState();
    return false;
  }

  try {
    overlayLastError = null;
    overlayState.clickThrough = enabled;

    if (enabled && process.platform !== 'linux') {
      mainWindow.setIgnoreMouseEvents(true, { forward: true });
    } else {
      mainWindow.setIgnoreMouseEvents(enabled);
    }

    if (typeof mainWindow.setFocusable === 'function') {
      mainWindow.setFocusable(!enabled);
    }

    if (!enabled) {
      mainWindow.focus();
    }

    sendOverlayState();
    return true;
  } catch (error) {
    const fallbackMessage = error instanceof Error ? error.message : String(error);
    try {
      mainWindow.setIgnoreMouseEvents(enabled);
      overlayLastError = `Click Through fallback used: ${fallbackMessage}`;
      sendOverlayState();
      return true;
    } catch (fallbackError) {
      overlayState.clickThrough = false;
      mainWindow.setIgnoreMouseEvents(false);
      overlayLastError =
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      sendOverlayState();
      return false;
    }
  }
}

function unregisterOverlayShortcuts() {
  globalShortcut.unregister('CommandOrControl+Shift+M');
  globalShortcut.unregister('Esc');
}

function exitOverlayMode({ notifyRenderer = false } = {}) {
  if (!mainWindow || mainWindow.isDestroyed() || !overlayState) {
    return;
  }

  const previousState = overlayState;
  overlayState = null;
  overlayLastError = null;
  unregisterOverlayShortcuts();
  mainWindow.setIgnoreMouseEvents(false);
  if (typeof mainWindow.setFocusable === 'function') {
    mainWindow.setFocusable(true);
  }
  mainWindow.setSkipTaskbar(previousState.skipTaskbar);
  mainWindow.setAlwaysOnTop(previousState.alwaysOnTop);
  mainWindow.setFullScreen(previousState.fullScreen);
  if (!previousState.fullScreen) {
    mainWindow.setBounds(previousState.bounds);
  }
  sendOverlayState();

  if (notifyRenderer) {
    mainWindow.webContents.send('desktop-muse-idle:overlay-exit-requested');
  }
}

function registerOverlayShortcuts() {
  unregisterOverlayShortcuts();
  globalShortcut.register('CommandOrControl+Shift+M', () => {
    if (overlayState) {
      setClickThrough(!overlayState.clickThrough);
    }
  });
  globalShortcut.register('Esc', () => exitOverlayMode({ notifyRenderer: true }));
}

function enterOverlayMode() {
  if (!mainWindow || mainWindow.isDestroyed() || overlayState) {
    return;
  }

  overlayState = {
    alwaysOnTop: mainWindow.isAlwaysOnTop(),
    bounds: mainWindow.getBounds(),
    clickThrough: false,
    fullScreen: mainWindow.isFullScreen(),
    skipTaskbar: false,
  };
  overlayLastError = null;
  mainWindow.setIgnoreMouseEvents(false);
  if (typeof mainWindow.setFocusable === 'function') {
    mainWindow.setFocusable(true);
  }
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setSkipTaskbar(true);
  mainWindow.setFullScreen(true);
  registerOverlayShortcuts();
  sendOverlayState();
}

ipcMain.handle('desktop-muse-idle:enter-overlay-mode', () => {
  enterOverlayMode();
  return true;
});
ipcMain.handle('desktop-muse-idle:exit-overlay-mode', () => {
  exitOverlayMode();
  return true;
});
ipcMain.handle('desktop-muse-idle:set-always-on-top', (_event, enabled) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return false;
  }
  mainWindow.setAlwaysOnTop(Boolean(enabled), enabled ? 'screen-saver' : 'normal');
  sendOverlayState();
  return true;
});
ipcMain.handle('desktop-muse-idle:set-click-through', (_event, enabled) =>
  setClickThrough(Boolean(enabled)),
);
ipcMain.handle('desktop-muse-idle:get-overlay-status', () => getOverlayStatus());
ipcMain.handle('desktop-muse-idle:set-transparent-window', (_event, enabled) =>
  Boolean(enabled) === Boolean(overlayState),
);
ipcMain.handle('overlay:set-click-through', (_event, enabled) => setClickThrough(Boolean(enabled)));
ipcMain.handle('overlay:get-status', () => getOverlayStatus());
ipcMain.handle('wallpaper:enter-native', () => enterNativeWallpaperMode());
ipcMain.handle('wallpaper:exit-native', async () => {
  await exitNativeWallpaperMode();
  return { ok: true, mode: 'fallback_stage' };
});
ipcMain.handle('wallpaper:minimize-control-view', () => minimizeNativeWallpaperControlView());
ipcMain.handle('wallpaper:get-status', () => refreshNativeWallpaperInspection());
ipcMain.handle('wallpaper:inspect-native', () => refreshNativeWallpaperInspection());
ipcMain.handle('wallpaper:helper-status', () => getWallpaperHelperStatus());

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Desktop Muse Idle',
    width: 1280,
    height: 820,
    minWidth: 1120,
    minHeight: 720,
    autoHideMenuBar: true,
    backgroundColor: '#00000000',
    transparent: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      void shell.openExternal(url);
    }

    return { action: 'deny' };
  });
  mainWindow.on('closed', () => {
    unregisterOverlayShortcuts();
    void closeNativeWallpaperWindow();
    closeNativeWallpaperControlWindow();
    mainWindow = null;
    overlayState = null;
  });
  mainWindow.on('minimize', () => {
    if (!nativeWallpaperStatus.nativeProbeActive && !nativeWallpaperStatus.probeAttached) {
      return;
    }
    const bounds = mainWindow.getBounds();
    setNativeWallpaperStatus({
      controlViewMinimized: true,
      controlViewVisible: false,
      controlViewBounds: bounds,
      controlViewWindowBounds: bounds,
      mainWindowMayBlockDesktopClicks: false,
      desktopIconClickThroughBlockedSuspected: false,
    });
  });
  mainWindow.on('restore', () => {
    if (!nativeWallpaperStatus.nativeProbeActive && !nativeWallpaperStatus.probeAttached) {
      return;
    }
    const bounds = mainWindow.getBounds();
    const coversPrimary = rectCovers(bounds, screen.getPrimaryDisplay().bounds);
    setNativeWallpaperStatus({
      controlViewMinimized: false,
      controlViewVisible: true,
      controlViewBounds: bounds,
      controlViewWindowBounds: bounds,
      mainWindowMayBlockDesktopClicks: coversPrimary,
      desktopIconClickThroughBlockedSuspected: coversPrimary,
    });
  });

  if (developmentUrl) {
    void mainWindow.loadURL(developmentUrl);
    return;
  }

  void mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', (event) => {
  if (
    isQuittingAfterNativeWallpaperCleanup ||
    (!nativeWallpaperWindow && !nativeWallpaperControlWindow)
  ) {
    return;
  }

  event.preventDefault();
  isQuittingAfterNativeWallpaperCleanup = true;
  closeNativeWallpaperControlWindow();
  void closeNativeWallpaperWindow().finally(() => {
    app.quit();
  });
});

app.on('will-quit', unregisterOverlayShortcuts);
