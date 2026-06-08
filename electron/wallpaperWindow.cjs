'use strict';

const path = require('node:path');
const { BrowserWindow, screen } = require('electron');

function createWallpaperWindow({ developmentUrl }) {
  const primaryDisplay = screen.getPrimaryDisplay();
  const bounds = primaryDisplay.bounds;
  const wallpaperWindow = new BrowserWindow({
    title: 'Desktop Muse Idle Native Wallpaper',
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    fullscreen: false,
    movable: false,
    resizable: false,
    show: false,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    transparent: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: true,
    },
  });

  if (developmentUrl) {
    const separator = developmentUrl.includes('?') ? '&' : '?';
    void wallpaperWindow.loadURL(`${developmentUrl}${separator}nativeWallpaperRenderer=1`);
  } else {
    void wallpaperWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), {
      query: { nativeWallpaperRenderer: '1' },
    });
  }

  return wallpaperWindow;
}

module.exports = {
  createWallpaperWindow,
};
