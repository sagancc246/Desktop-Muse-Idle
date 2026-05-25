import type { Background } from '../types/game';

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
  return (
    <div className="preview-backdrop" onClick={onClose}>
      <section
        aria-label={`${background.name} preview`}
        aria-modal="true"
        className="background-preview-modal panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button aria-label="プレビューを閉じる" className="modal-close" onClick={onClose} type="button">
          Close
        </button>
        <img alt={`${background.name} background preview`} src={background.imagePath} />
        <div className="preview-copy">
          <p className="eyebrow">UNLOCKED STILL</p>
          <h2>{background.name}</h2>
          <p>{background.description}</p>
          <button
            className="preview-select"
            disabled={isCurrent}
            onClick={() => onSelect(background.id)}
            type="button"
          >
            {isCurrent ? '現在の背景に設定済み' : 'この背景に設定'}
          </button>
        </div>
      </section>
    </div>
  );
}
