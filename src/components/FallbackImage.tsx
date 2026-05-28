import type { ImgHTMLAttributes, SyntheticEvent } from 'react';
import { fallbackBackgroundImagePath, warnAssetFallbackOnce } from '../systems/assetFallbacks';

type FallbackImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  assetLabel: string;
};

export function FallbackImage({ assetLabel, onError, src, ...props }: FallbackImageProps) {
  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    const image = event.currentTarget;

    if (image.src !== fallbackBackgroundImagePath) {
      warnAssetFallbackOnce(
        `image:${assetLabel}`,
        `Image asset missing for ${assetLabel}; using fallback image.`,
      );
      image.src = fallbackBackgroundImagePath;
    }

    onError?.(event);
  };

  return <img {...props} onError={handleError} src={src || fallbackBackgroundImagePath} />;
}
