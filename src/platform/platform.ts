import { electronAdapter } from './electronAdapter';
import { localAdapter } from './localAdapter';
import type { OverlayStatus, PlatformAdapter } from './platformAdapter';

export const platformAdapter: PlatformAdapter =
  typeof window !== 'undefined' && window.desktopMusePlatform ? electronAdapter : localAdapter;

export const isElectronOverlayAvailable = () => platformAdapter.platformId === 'electron';

export async function enterPlatformOverlayMode() {
  await platformAdapter.enterOverlayMode?.();
}

export async function exitPlatformOverlayMode() {
  await platformAdapter.exitOverlayMode?.();
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
