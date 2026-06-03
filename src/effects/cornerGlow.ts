import { Graphics } from 'pixi.js';
import { cornerGlowDurationMs, cornerGlowRadius } from '../data/balance';
import type { CornerHitPosition } from '../types/game';
import type { CornerEffectKind, ManagedEffect } from './effectTypes';

const glowColors: Record<CornerEffectKind, number> = {
  corner_hit: 0xc999ff,
  jackpot: 0xffd681,
  lucky_corner: 0xff9ddc,
  near_corner: 0x8cdcff,
};

function getCornerPosition(
  corner: CornerHitPosition,
  width: number,
  height: number,
  inset: number,
) {
  return {
    x: corner.endsWith('left') ? inset : width - inset,
    y: corner.startsWith('top') ? inset : height - inset,
  };
}

interface CreateCornerGlowEffectParams {
  corner: CornerHitPosition;
  height: number;
  inset: number;
  kind: CornerEffectKind;
  lowMotion: boolean;
  width: number;
}

export function createCornerGlowEffect({
  corner,
  height,
  inset,
  kind,
  lowMotion,
  width,
}: CreateCornerGlowEffectParams): ManagedEffect & { graphic: Graphics } {
  const maxLife = cornerGlowDurationMs / 1_000;
  let life = maxLife;
  const position = getCornerPosition(corner, width, height, inset);
  const isNearCorner = kind === 'near_corner';
  const radius = (lowMotion ? cornerGlowRadius * 0.72 : cornerGlowRadius) * (isNearCorner ? 0.7 : 1);
  const graphic = new Graphics()
    .circle(position.x, position.y, radius * 0.35)
    .fill({ color: glowColors[kind], alpha: isNearCorner ? 0.12 : lowMotion ? 0.2 : 0.32 })
    .circle(position.x, position.y, radius * 0.72)
    .stroke({ color: glowColors[kind], alpha: isNearCorner ? 0.18 : lowMotion ? 0.22 : 0.38, width: 5 })
    .circle(position.x, position.y, radius)
    .stroke({ color: glowColors[kind], alpha: isNearCorner ? 0.08 : lowMotion ? 0.1 : 0.18, width: 8 });

  return {
    graphic,
    destroy: () => graphic.destroy(),
    update: (deltaSeconds) => {
      life -= deltaSeconds;
      const progress = Math.max(0, life / maxLife);
      graphic.alpha = progress;
      graphic.scale.set(1 + (1 - progress) * 0.18);
      return life > 0;
    },
  };
}
