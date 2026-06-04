import { useEffect, useRef, useState } from 'react';
import { getMuseById } from '../data/muses';
import { getSkinUnlockMethodLabel, getSkinsByMuseId } from '../data/skins';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useGameStore } from '../store/useGameStore';
import { FallbackImage } from './FallbackImage';

interface SkinSelectorModalProps {
  museId: string;
  onClose: () => void;
}

export function SkinSelectorModal({ museId, onClose }: SkinSelectorModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const [equipConfirmation, setEquipConfirmation] = useState<string | null>(null);
  const muse = getMuseById(museId);
  const skins = getSkinsByMuseId(museId);
  const unlockedMuseIds = useGameStore((state) => state.unlockedMuseIds);
  const unlockedSkinIds = useGameStore((state) => state.unlockedSkinIds);
  const equippedSkinByMuseId = useGameStore((state) => state.equippedSkinByMuseId);
  const equipSkin = useGameStore((state) => state.equipSkin);
  const isMuseUnlocked = unlockedMuseIds.includes(museId);
  const equippedSkinId = equippedSkinByMuseId[museId];

  useFocusTrap(modalRef);

  useEffect(() => {
    const timerId = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!muse) {
    return null;
  }

  const handleEquip = (skinId: string, skinName: string) => {
    equipSkin(museId, skinId);
    setEquipConfirmation(`${skinName} is now equipped.`);
  };

  return (
    <div className="skin-selector-backdrop" onClick={onClose}>
      <section
        aria-label={`${muse.name} skin selector`}
        aria-modal="true"
        className="skin-selector-modal panel"
        onClick={(event) => event.stopPropagation()}
        ref={modalRef}
        role="dialog"
      >
        <header className="skin-selector-header">
          <div>
            <p className="eyebrow">MUSE SKINS</p>
            <h1>{muse.name}</h1>
            <p>
              {isMuseUnlocked
                ? 'Choose an owned skin. Skins are visual only.'
                : 'This Muse is locked, but future skin options can still be previewed here.'}
            </p>
          </div>
          <button
            aria-label="Close skin selector"
            className="modal-close"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            Close
          </button>
        </header>
        <div
          aria-live="polite"
          className={`skin-equip-status${equipConfirmation ? ' confirmed' : ''}`}
          role="status"
        >
          {equipConfirmation ?? 'Select an owned skin to update this Muse immediately.'}
        </div>
        <div className="skin-grid">
          {skins.map((skin) => {
            const isUnlocked = unlockedSkinIds.includes(skin.id);
            const isEquipped = equippedSkinId === skin.id;
            const canEquip = isMuseUnlocked && isUnlocked && !isEquipped;

            return (
              <article
                aria-current={isEquipped ? 'true' : undefined}
                className={`skin-card rarity-${skin.rarity}${isEquipped ? ' equipped' : ''}`}
                key={skin.id}
              >
                <FallbackImage
                  alt={`${skin.name} thumbnail`}
                  assetLabel={`${skin.id} thumbnail`}
                  className="skin-thumbnail"
                  src={skin.thumbnailAsset}
                />
                <div className="skin-card-copy">
                  <div className="skin-card-title">
                    <h2>{skin.name}</h2>
                    <span>{skin.rarity}</span>
                  </div>
                  <p>{skin.description}</p>
                  <small>{getSkinUnlockMethodLabel(skin.unlockMethod)}</small>
                </div>
                <div className="skin-card-footer">
                  <strong className={isUnlocked ? 'owned' : 'locked'}>
                    {isEquipped ? 'Currently equipped' : isUnlocked ? 'Owned' : 'Locked'}
                  </strong>
                  <button
                    disabled={!canEquip}
                    onClick={() => handleEquip(skin.id, skin.name)}
                    type="button"
                  >
                    {isEquipped ? 'Equipped' : isUnlocked ? 'Equip' : 'Locked'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
