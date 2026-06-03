import { useEffect } from 'react';
import { getMuseById } from '../data/muses';
import { getSkinById } from '../data/skins';

interface SkinUnlockToastProps {
  onClose: () => void;
  skinId: string;
}

export function SkinUnlockToast({ onClose, skinId }: SkinUnlockToastProps) {
  const skin = getSkinById(skinId);
  const muse = skin ? getMuseById(skin.museId) : undefined;

  useEffect(() => {
    const timerId = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timerId);
  }, [onClose, skinId]);

  if (!skin || !muse) {
    return null;
  }

  return (
    <aside aria-live="polite" className={`skin-unlock-toast rarity-${skin.rarity}`}>
      <span>New Skin Unlocked!</span>
      <strong>{skin.name}</strong>
      <small>
        {muse.name} / {skin.rarity}
      </small>
      <button aria-label="Dismiss skin unlock notification" onClick={onClose} type="button">
        OK
      </button>
    </aside>
  );
}
