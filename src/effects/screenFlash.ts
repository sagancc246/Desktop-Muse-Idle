import { Graphics } from 'pixi.js';
import {
  screenFlashAlphaCorner,
  screenFlashAlphaJackpot,
  screenFlashAlphaLucky,
  screenFlashFadeMs,
} from '../data/balance';
import type { CornerEffectKind, ManagedEffect } from './effectTypes';

const flashColors: Record<CornerEffectKind, number> = {
  corner_hit: 0xd8b5ff,
  jackpot: 0xffd681,
  lucky_corner: 0xff9ddc,
  near_corner: 0x8cdcff,
};

const flashAlpha: Record<CornerEffectKind, number> = {
  corner_hit: screenFlashAlphaCorner,
  jackpot: screenFlashAlphaJackpot,
  lucky_corner: screenFlashAlphaLucky,
  near_corner: screenFlashAlphaCorner * 0.32,
};

interface CreateScreenFlashEffectParams {
  height: number;
  kind: CornerEffectKind;
  lowMotion: boolean;
  width: number;
}

export function createScreenFlashEffect({
  height,
  kind,
  lowMotion,
  width,
}: CreateScreenFlashEffectParams): ManagedEffect & { graphic: Graphics } {
  const maxLife = screenFlashFadeMs / 1_000;
  let life = maxLife;
  const alpha = lowMotion ? flashAlpha[kind] * 0.42 : flashAlpha[kind];
  const graphic = new Graphics()
    .rect(0, 0, width, height)
    .fill({ color: flashColors[kind], alpha });

  return {
    graphic,
    destroy: () => graphic.destroy(),
    update: (deltaSeconds) => {
      life -= deltaSeconds;
      const progress = Math.max(0, life / maxLife);
      graphic.alpha = progress * progress;
      return life > 0;
    },
  };
}
