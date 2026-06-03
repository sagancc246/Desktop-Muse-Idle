import { Text } from 'pixi.js';
import { cornerTextDurationMs, rewardTextDurationMs } from '../data/balance';
import type { CornerEffectKind, ManagedEffect } from './effectTypes';

const textColors: Record<CornerEffectKind, number> = {
  corner_hit: 0xffd681,
  jackpot: 0xfff0a8,
  lucky_corner: 0xff9ddc,
  near_corner: 0x8cdcff,
};

interface CreateFloatingTextEffectParams {
  anchor?: 'center' | 'reward';
  kind: CornerEffectKind;
  text: string;
  x: number;
  y: number;
}

export function createFloatingTextEffect({
  anchor = 'reward',
  kind,
  text,
  x,
  y,
}: CreateFloatingTextEffectParams): ManagedEffect & { graphic: Text } {
  const isCenter = anchor === 'center';
  const maxLife = (isCenter ? cornerTextDurationMs : rewardTextDurationMs) / 1_000;
  let life = maxLife;
  const graphic = new Text({
    text,
    style: {
      align: 'center',
      fill: isCenter ? textColors[kind] : 0x8cdcff,
      fontFamily: 'Arial, sans-serif',
      fontSize: isCenter ? 50 : 27,
      fontWeight: 'bold',
      letterSpacing: isCenter ? 2 : 0,
      stroke: { color: isCenter ? 0x4b245f : 0x142044, width: isCenter ? 5 : 4 },
    },
  });
  graphic.anchor.set(0.5);
  graphic.position.set(x, y);

  return {
    graphic,
    destroy: () => graphic.destroy(),
    update: (deltaSeconds) => {
      life -= deltaSeconds;
      const progress = Math.max(0, life / maxLife);
      const fadeIn = Math.min(1, (maxLife - life) / 0.08);
      graphic.alpha = Math.min(fadeIn, Math.min(1, progress / 0.28));
      graphic.y -= (isCenter ? 8 : 24) * deltaSeconds;
      if (isCenter) {
        graphic.scale.set(1 + Math.max(0, progress - 0.72) * 0.28);
      }
      return life > 0;
    },
  };
}
