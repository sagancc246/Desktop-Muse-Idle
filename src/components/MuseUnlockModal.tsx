import { useEffect, useRef } from 'react';
import { getMuseById } from '../data/muses';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface MuseUnlockModalProps {
  museId: string;
  onClose: () => void;
}

export function MuseUnlockModal({ museId, onClose }: MuseUnlockModalProps) {
  const muse = getMuseById(museId);
  const modalRef = useRef<HTMLElement>(null);
  const okButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(modalRef);

  useEffect(() => {
    const timerId = window.setTimeout(() => okButtonRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
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

  return (
    <div className="muse-unlock-backdrop" role="presentation">
      <section
        aria-label={`${muse.name} unlocked`}
        aria-modal="true"
        className="muse-unlock-card panel"
        ref={modalRef}
        role="dialog"
      >
        <p className="eyebrow">NEW MUSE UNLOCKED!</p>
        <div className={`muse-unlock-icon ${muse.iconAsset}`} aria-hidden="true" />
        <h1>{muse.name}</h1>
        <p className="muse-unlock-description">{muse.description}</p>
        <div className="muse-unlock-skill">
          <span>Skill</span>
          <strong>{muse.skill.name}</strong>
        </div>
        <button className="muse-unlock-action" onClick={onClose} ref={okButtonRef} type="button">
          OK
        </button>
      </section>
    </div>
  );
}
