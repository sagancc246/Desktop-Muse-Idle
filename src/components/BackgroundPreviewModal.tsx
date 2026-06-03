import { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { Background } from '../types/game';
import { FallbackImage } from './FallbackImage';

interface BackgroundPreviewModalProps {
  background: Background;
  isCurrent: boolean;
  onClose: () => void;
  onSelect: (backgroundId: string) => void;
}

export function BackgroundPreviewModal({
  background,
  isCurrent,
  onClose,
  onSelect,
}: BackgroundPreviewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const selectButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(modalRef);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      if (isCurrent) {
        closeButtonRef.current?.focus();
        return;
      }
      selectButtonRef.current?.focus();
    }, 0);

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
  }, [background.id, isCurrent, onClose, onSelect]);

  return (
    <div className="preview-backdrop" onClick={onClose}>
      <section
        aria-label={`${background.name} preview`}
        aria-modal="true"
        className="background-preview-modal panel"
        onClick={(event) => event.stopPropagation()}
        ref={modalRef}
        role="dialog"
      >
        <button
          aria-label="Close background preview"
          className="modal-close"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          Close
        </button>
        <FallbackImage
          alt={`${background.name} background preview`}
          assetLabel={`${background.id} preview`}
          src={background.imagePath}
        />
        <div className="preview-copy">
          <p className="eyebrow">UNLOCKED STILL</p>
          <h2>{background.name}</h2>
          <p>{background.description}</p>
          <button
            className="preview-select"
            disabled={isCurrent}
            onClick={() => onSelect(background.id)}
            ref={selectButtonRef}
            type="button"
          >
            {isCurrent ? 'Current Background' : 'Set Background'}
          </button>
        </div>
      </section>
    </div>
  );
}
