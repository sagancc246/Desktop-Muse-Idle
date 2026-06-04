import { useEffect, useRef, useState } from 'react';
import { backgrounds } from '../data/backgrounds';
import { getStageById } from '../data/stages';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useGameStore } from '../store/useGameStore';
import type { Background } from '../types/game';
import { BackgroundPreviewModal } from './BackgroundPreviewModal';
import { FallbackImage } from './FallbackImage';

interface GalleryPanelProps {
  mode?: 'panel' | 'screen';
  onBack?: () => void;
  openRequestKey?: number;
}

export function GalleryPanel({ mode = 'panel', onBack, openRequestKey = 0 }: GalleryPanelProps) {
  const unlockedBackgrounds = useGameStore((state) => state.unlockedBackgrounds);
  const currentBackgroundId = useGameStore((state) => state.currentBackgroundId);
  const selectBackground = useGameStore((state) => state.selectBackground);
  const [isOpen, setIsOpen] = useState(false);
  const [previewBackground, setPreviewBackground] = useState<Background | null>(null);
  const galleryModalRef = useRef<HTMLElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const currentBackground = backgrounds.find((background) => background.id === currentBackgroundId);
  const isScreen = mode === 'screen';
  const isGalleryVisible = isScreen || isOpen;

  useEffect(() => {
    if (!isScreen && openRequestKey > 0) {
      setIsOpen(true);
    }
  }, [isScreen, openRequestKey]);

  useFocusTrap(galleryModalRef, isGalleryVisible && !previewBackground);

  const closeGallery = () => {
    if (isScreen) {
      onBack?.();
      return;
    }

    setIsOpen(false);
    window.setTimeout(() => openButtonRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!isGalleryVisible) {
      setPreviewBackground(null);
      return;
    }

    const timerId = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      if (previewBackground) {
        setPreviewBackground(null);
        return;
      }

      closeGallery();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isGalleryVisible, previewBackground]);

  return (
    <>
      {!isScreen && (
        <section className="background-panel panel">
          <div className="panel-heading background-panel-heading">
            <p className="eyebrow">COLLECTION</p>
            <h2>Still Gallery</h2>
          </div>
          <p className="gallery-summary">
            {unlockedBackgrounds.length} / {backgrounds.length} backgrounds unlocked
          </p>
          <p className="gallery-current">
            Now showing <strong>{currentBackground?.name ?? 'No backdrop'}</strong>
          </p>
          <button
            aria-label="Open Still Gallery"
            className="gallery-open"
            onClick={() => setIsOpen(true)}
            ref={openButtonRef}
            type="button"
          >
            Open Gallery
          </button>
        </section>
      )}
      {isGalleryVisible && (
        <div
          className={isScreen ? 'gallery-screen title-screen' : 'gallery-backdrop'}
          onClick={isScreen ? undefined : closeGallery}
        >
          <section
            aria-label="Still Gallery"
            aria-modal={!isScreen}
            className={`gallery-modal panel${isScreen ? ' gallery-page' : ''}`}
            onClick={(event) => event.stopPropagation()}
            ref={galleryModalRef}
            role={isScreen ? undefined : 'dialog'}
          >
            <header className="gallery-header">
              <div>
                <p className="eyebrow">BACKGROUND COLLECTION</p>
                <h2>Still Gallery</h2>
              </div>
              <button
                aria-label={isScreen ? 'Back to Title' : 'Close Gallery'}
                className="modal-close"
                onClick={closeGallery}
                ref={closeButtonRef}
                type="button"
              >
                {isScreen ? 'Back to Title' : 'Close'}
              </button>
            </header>
            <div className="gallery-grid">
              {backgrounds.map((background) => {
                const isUnlocked = unlockedBackgrounds.includes(background.id);
                const unlockStage = getStageById(background.unlockStageId);

                if (!isUnlocked) {
                  return (
                    <article
                      aria-label={`${background.name} locked`}
                      className="gallery-card locked"
                      key={background.id}
                    >
                      <div className="gallery-locked-image">
                        <span>LOCKED</span>
                      </div>
                      <h3>???</h3>
                      <p>Unlock by clearing {unlockStage?.name ?? background.unlockStageId}</p>
                    </article>
                  );
                }

                return (
                  <button
                    aria-label={`Preview ${background.name}`}
                    className={`gallery-card unlocked${
                      background.id === currentBackgroundId ? ' selected' : ''
                    }`}
                    key={background.id}
                    onClick={() => setPreviewBackground(background)}
                    type="button"
                  >
                    <FallbackImage
                      alt={`${background.name} thumbnail`}
                      assetLabel={`${background.id} thumbnail`}
                      src={background.imagePath}
                    />
                    <h3>{background.name}</h3>
                    <p>{background.description}</p>
                    <b>{background.id === currentBackgroundId ? 'IN USE' : 'PREVIEW'}</b>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}
      {previewBackground && (
        <BackgroundPreviewModal
          background={previewBackground}
          isCurrent={previewBackground.id === currentBackgroundId}
          onClose={() => setPreviewBackground(null)}
          onSelect={selectBackground}
        />
      )}
    </>
  );
}
