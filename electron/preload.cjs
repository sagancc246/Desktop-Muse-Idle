'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopMusePlatform', {
  enterOverlayMode: () => ipcRenderer.invoke('desktop-muse-idle:enter-overlay-mode'),
  exitOverlayMode: () => ipcRenderer.invoke('desktop-muse-idle:exit-overlay-mode'),
  setAlwaysOnTop: (enabled) =>
    ipcRenderer.invoke('desktop-muse-idle:set-always-on-top', Boolean(enabled)),
  setClickThrough: (enabled) =>
    ipcRenderer.invoke('overlay:set-click-through', Boolean(enabled)),
  getOverlayStatus: () => ipcRenderer.invoke('overlay:get-status'),
  setTransparentWindow: (enabled) =>
    ipcRenderer.invoke('desktop-muse-idle:set-transparent-window', Boolean(enabled)),
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
