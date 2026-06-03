import { localAdapter } from './localAdapter';
import type { PlatformAdapter } from './platformAdapter';

export const platformAdapter: PlatformAdapter = localAdapter;

export async function enterPlatformOverlayMode() {
  await platformAdapter.enterOverlayMode?.();
}

export async function exitPlatformOverlayMode() {
  await platformAdapter.exitOverlayMode?.();
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
