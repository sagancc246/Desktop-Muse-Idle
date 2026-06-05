import { getBackgroundById } from '../data/backgrounds';
import { getMuseById } from '../data/muses';
import type { PresentedReward } from '../data/rewards';
import { getSkinById } from '../data/skins';
import { useGameStore } from '../store/useGameStore';
import { FallbackImage } from './FallbackImage';

interface RewardCardProps {
  onOpenGallery: () => void;
  reward: PresentedReward;
}

export function RewardCard({ onOpenGallery, reward }: RewardCardProps) {
  const activeMuseIds = useGameStore((state) => state.activeMuseIds);
  const currentBackgroundId = useGameStore((state) => state.currentBackgroundId);
  const equippedSkinByMuseId = useGameStore((state) => state.equippedSkinByMuseId);
  const selectBackground = useGameStore((state) => state.selectBackground);
  const setActiveMuses = useGameStore((state) => state.setActiveMuses);
  const equipSkin = useGameStore((state) => state.equipSkin);
  const skin = reward.type === 'skin' ? getSkinById(reward.id) : undefined;
  const background =
    reward.type === 'background' ? getBackgroundById(reward.id) : undefined;
  const muse = reward.type === 'muse' ? getMuseById(reward.id) : undefined;
  const claimLabel = reward.claimed
    ? 'Already Claimed'
    : reward.alreadyOwned
      ? 'Already Owned'
      : reward.unsupported
        ? 'Unsupported'
        : 'NEW';

  const setMuseActive = () => {
    if (!muse || activeMuseIds.includes(muse.id)) {
      return;
    }

    setActiveMuses(
      activeMuseIds.length < 3
        ? [...activeMuseIds, muse.id]
        : [...activeMuseIds.slice(0, 2), muse.id],
    );
  };

  if (skin) {
    const isEquipped = equippedSkinByMuseId[skin.museId] === skin.id;
    const skinMuse = getMuseById(skin.museId);

    return (
      <article className={`reward-card reward-skin rarity-${skin.rarity}`}>
        <FallbackImage
          alt={`${skin.name} thumbnail`}
          assetLabel={`${skin.id} stage reward`}
          className="reward-card-image"
          src={skin.thumbnailAsset}
        />
        <div className="reward-card-copy">
          <span>New Skin Unlocked!</span>
          <h2>{skin.name}</h2>
          <p>{skinMuse?.name ?? skin.museId}</p>
          <b>{skin.rarity.replace('_', ' ')}</b>
        </div>
        <div className="reward-card-actions">
          <em>{claimLabel}</em>
          <button
            disabled={isEquipped}
            onClick={() => equipSkin(skin.museId, skin.id)}
            type="button"
          >
            {isEquipped ? 'Equipped' : 'Equip'}
          </button>
        </div>
      </article>
    );
  }

  if (background) {
    const isCurrent = currentBackgroundId === background.id;

    return (
      <article className="reward-card reward-background rarity-rare">
        <FallbackImage
          alt={`${background.name} thumbnail`}
          assetLabel={`${background.id} stage reward`}
          className="reward-card-image"
          src={background.thumbnailAsset}
        />
        <div className="reward-card-copy">
          <span>New Background Unlocked!</span>
          <h2>{background.name}</h2>
          <p>{background.description}</p>
        </div>
        <div className="reward-card-actions stacked">
          <em>{claimLabel}</em>
          <button
            disabled={isCurrent}
            onClick={() => selectBackground(background.id)}
            type="button"
          >
            {isCurrent ? 'In Use' : 'Set Background'}
          </button>
          <button className="secondary" onClick={onOpenGallery} type="button">
            Open Gallery
          </button>
        </div>
      </article>
    );
  }

  if (muse) {
    const isActive = activeMuseIds.includes(muse.id);

    return (
      <article className="reward-card reward-muse rarity-super_rare">
        <div className={`muse-swatch reward-muse-icon ${muse.iconAsset}`} aria-hidden="true" />
        <div className="reward-card-copy">
          <span>New Muse Unlocked!</span>
          <h2>{muse.name}</h2>
          <p>{muse.description}</p>
          <b>{muse.skill.name}</b>
        </div>
        <div className="reward-card-actions">
          <em>{claimLabel}</em>
          <button disabled={isActive} onClick={setMuseActive} type="button">
            {isActive ? 'Active' : 'Set Active'}
          </button>
        </div>
      </article>
    );
  }

  if (reward.type === 'memory') {
    return (
      <article className="reward-card reward-memory rarity-common">
        <div className="reward-amount-icon" aria-hidden="true">M</div>
        <div className="reward-card-copy">
          <span>Memory Acquired</span>
          <h2>+{reward.amount.toLocaleString()}</h2>
          <p>Added to your Memory total.</p>
          {reward.claimed ? <b>Already Claimed</b> : null}
        </div>
      </article>
    );
  }

  if (reward.type === 'capsule') {
    return (
      <article className="reward-card reward-capsule rarity-ultra_rare">
        <div className="reward-amount-icon" aria-hidden="true">C</div>
        <div className="reward-card-copy">
          <span>Muse Capsule Acquired</span>
          <h2>+{reward.amount.toLocaleString()}</h2>
          <p>Added to your Capsule inventory.</p>
          {reward.claimed ? <b>Already Claimed</b> : null}
        </div>
      </article>
    );
  }

  if (reward.type === 'shard') {
    return (
      <article className="reward-card reward-memory rarity-common">
        <div className="reward-amount-icon" aria-hidden="true">S</div>
        <div className="reward-card-copy">
          <span>Shard Reward</span>
          <h2>+{reward.amount.toLocaleString()}</h2>
          <p>{reward.unsupported ? 'This reward is not implemented yet.' : 'Added to your Shards.'}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="reward-card rarity-common">
      <div className="reward-amount-icon" aria-hidden="true">?</div>
      <div className="reward-card-copy">
        <span>Unknown Reward</span>
        <h2>{reward.type}</h2>
        <p>This reward is unavailable or not implemented yet.</p>
      </div>
    </article>
  );
}
