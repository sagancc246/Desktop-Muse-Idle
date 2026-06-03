const tutorialStorageKey = 'desktop-muse-idle-tutorial-seen';

export function loadTutorialSeen(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(tutorialStorageKey) === 'true';
  } catch {
    return false;
  }
}

export function saveTutorialSeen(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(tutorialStorageKey, 'true');
  } catch {
    // Tutorial persistence should not block gameplay.
  }
}

export function clearTutorialSeen(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(tutorialStorageKey);
  } catch {
    // Tutorial persistence should not block gameplay.
  }
}
