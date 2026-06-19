'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const displayModes = new Set(['windowed', 'fullscreen']);
const normalizeDisplayMode = (mode) => (displayModes.has(mode) ? mode : 'windowed');

const desktopMuse = {
  quitApp: () => ipcRenderer.invoke('app:quit'),
  getDisplayMode: () => ipcRenderer.invoke('window:get-display-mode'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  setDisplayMode: (mode) =>
    ipcRenderer.invoke('window:set-display-mode', normalizeDisplayMode(mode)),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
};

contextBridge.exposeInMainWorld('desktopMuse', desktopMuse);

contextBridge.exposeInMainWorld('desktopMusePlatform', {
  ...desktopMuse,
  enterOverlayMode: () => ipcRenderer.invoke('desktop-muse-idle:enter-overlay-mode'),
  exitOverlayMode: () => ipcRenderer.invoke('desktop-muse-idle:exit-overlay-mode'),
  setAlwaysOnTop: (enabled) =>
    ipcRenderer.invoke('desktop-muse-idle:set-always-on-top', Boolean(enabled)),
  setClickThrough: (enabled) =>
    ipcRenderer.invoke('overlay:set-click-through', Boolean(enabled)),
  getOverlayStatus: () => ipcRenderer.invoke('overlay:get-status'),
  setTransparentWindow: (enabled) =>
    ipcRenderer.invoke('desktop-muse-idle:set-transparent-window', Boolean(enabled)),
  enterNativeWallpaperMode: () => ipcRenderer.invoke('wallpaper:enter-native'),
  exitNativeWallpaperMode: () => ipcRenderer.invoke('wallpaper:exit-native'),
  minimizeNativeWallpaperControlView: () => ipcRenderer.invoke('wallpaper:minimize-control-view'),
  getNativeWallpaperStatus: () => ipcRenderer.invoke('wallpaper:get-status'),
  inspectNativeWallpaper: () => ipcRenderer.invoke('wallpaper:inspect-native'),
  onNativeWallpaperStatus: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('wallpaper:native-status', listener);
    return () => ipcRenderer.removeListener('wallpaper:native-status', listener);
  },
  onOverlayExitRequested: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('desktop-muse-idle:overlay-exit-requested', listener);
    return () => ipcRenderer.removeListener('desktop-muse-idle:overlay-exit-requested', listener);
  },
  onOverlayState: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('desktop-muse-idle:overlay-state', listener);
    return () => ipcRenderer.removeListener('desktop-muse-idle:overlay-state', listener);
  },
});
