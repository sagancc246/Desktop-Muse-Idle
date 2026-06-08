'use strict';

const path = require('node:path');
const { app, BrowserWindow, globalShortcut, ipcMain, shell } = require('electron');
const {
  attachWallpaperWindowToDesktop,
  detachWallpaperWindowFromDesktop,
  getWallpaperHelperStatus,
} = require('./nativeWallpaper.cjs');
const { createWallpaperWindow } = require('./wallpaperWindow.cjs');

const developmentUrl = process.env.VITE_DEV_SERVER_URL;
let mainWindow = null;
let overlayState = null;
let overlayLastError = null;
let nativeWallpaperWindow = null;
let suppressNativeWallpaperCloseStatus = false;
let nativeWallpaperStatus = {
  active: false,
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
  return {
    dryRun: Boolean(helperResult.dryRun),
    helperAvailable: Boolean(helperResult.helperAvailable),
    helperLastResult: JSON.stringify(helperResult),
    helperPath: helperResult.helperPath ?? null,
    helperVersion: helperResult.helperVersion,
    preferredWorkerWHwnd: helperResult.preferredWorkerWHwnd ?? null,
    progmanFound: helperResult.progmanFound,
    reason: helperResult.reason,
    shellDllDefViewFound: helperResult.shellDllDefViewFound,
    previousParentHwnd: helperResult.previousParentHwnd,
    setParentSucceeded: helperResult.setParentSucceeded,
    setWindowPosSucceeded: helperResult.setWindowPosSucceeded,
    warnings: Array.isArray(helperResult.warnings) ? helperResult.warnings : [],
    workerWHwnd: helperResult.workerWHwnd,
    workerWCandidateCount:
      typeof helperResult.workerWCandidateCount === 'number'
        ? helperResult.workerWCandidateCount
        : Array.isArray(helperResult.workerWCandidates)
          ? helperResult.workerWCandidates.length
          : undefined,
  };
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
}

async function closeNativeWallpaperWindow() {
  if (nativeWallpaperWindow && !nativeWallpaperWindow.isDestroyed()) {
    const detachResult = await detachWallpaperWindowFromDesktop(nativeWallpaperWindow);
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
  setNativeWallpaperStatus({
    active: false,
    backend: process.platform === 'win32' ? 'electron_window' : 'none',
    fallbackActive: false,
    attached: false,
    nativeAttached: false,
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
    await closeNativeWallpaperWindow();
    nativeWallpaperWindow = createWallpaperWindow({ developmentUrl });
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
    if (!attachResult.ok || !attachResult.attached) {
      await closeNativeWallpaperWindow();
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

    nativeWallpaperWindow.showInactive();
    setNativeWallpaperStatus({
      active: true,
      backend: 'native_desktop_wallpaper',
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
ipcMain.handle('wallpaper:get-status', () => getNativeWallpaperStatus());
ipcMain.handle('wallpaper:helper-status', () => getWallpaperHelperStatus());

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Desktop Muse Idle',
    width: 1280,
    height: 820,
    minWidth: 1120,
    minHeight: 720,
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
    mainWindow = null;
    overlayState = null;
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

app.on('will-quit', unregisterOverlayShortcuts);
