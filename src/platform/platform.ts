import { electronAdapter } from './electronAdapter';
import { localAdapter } from './localAdapter';
import type { NativeWallpaperStatus, OverlayStatus, PlatformAdapter } from './platformAdapter';
import type { WindowDisplayMode } from '../types/game';

export const platformAdapter: PlatformAdapter =
  typeof window !== 'undefined' && (window.desktopMusePlatform || window.desktopMuse)
    ? electronAdapter
    : localAdapter;

export const isElectronOverlayAvailable = () => platformAdapter.platformId === 'electron';
export const isElectronAppQuitAvailable = () =>
  platformAdapter.platformId === 'electron' &&
  typeof window !== 'undefined' &&
  typeof window.desktopMuse?.quitApp === 'function';
export const isElectronDisplayModeAvailable = () =>
  platformAdapter.platformId === 'electron' &&
  typeof window !== 'undefined' &&
  typeof window.desktopMuse?.setDisplayMode === 'function';
export const isElectronWindowControlsAvailable = () =>
  platformAdapter.platformId === 'electron' &&
  typeof window !== 'undefined' &&
  typeof window.desktopMuse?.minimizeWindow === 'function' &&
  typeof window.desktopMuse?.toggleFullscreen === 'function';

export async function quitPlatformApp() {
  await platformAdapter.quitApp?.();
}

export async function getPlatformDisplayMode() {
  return platformAdapter.getDisplayMode?.();
}

export async function minimizePlatformWindow() {
  await platformAdapter.minimizeWindow?.();
}

export async function setPlatformDisplayMode(mode: WindowDisplayMode) {
  return platformAdapter.setDisplayMode?.(mode);
}

export async function togglePlatformFullscreen() {
  return platformAdapter.toggleFullscreen?.();
}

export async function enterPlatformOverlayMode() {
  await platformAdapter.enterOverlayMode?.();
}

export async function exitPlatformOverlayMode() {
  await platformAdapter.exitOverlayMode?.();
}

export async function enterPlatformNativeWallpaperMode() {
  return platformAdapter.enterNativeWallpaperMode?.();
}

export async function exitPlatformNativeWallpaperMode() {
  return platformAdapter.exitNativeWallpaperMode?.();
}

export async function minimizePlatformNativeWallpaperControlView() {
  return platformAdapter.minimizeNativeWallpaperControlView?.();
}

export async function getPlatformNativeWallpaperStatus() {
  return platformAdapter.getNativeWallpaperStatus?.();
}

export async function getPlatformOverlayStatus() {
  return platformAdapter.getOverlayStatus?.();
}

export async function setPlatformAlwaysOnTop(enabled: boolean) {
  await platformAdapter.setAlwaysOnTop?.(enabled);
}

export async function setPlatformClickThrough(enabled: boolean) {
  await platformAdapter.setClickThrough?.(enabled);
}

export async function setPlatformTransparentWindow(enabled: boolean) {
  await platformAdapter.setTransparentWindow?.(enabled);
}

export function onPlatformOverlayExitRequested(callback: () => void) {
  return platformAdapter.onOverlayExitRequested?.(callback) ?? (() => undefined);
}

export function onPlatformOverlayState(callback: (state: OverlayStatus) => void) {
  return platformAdapter.onOverlayState?.(callback) ?? (() => undefined);
}

export function onPlatformNativeWallpaperStatus(callback: (state: NativeWallpaperStatus) => void) {
  return platformAdapter.onNativeWallpaperStatus?.(callback) ?? (() => undefined);
}
