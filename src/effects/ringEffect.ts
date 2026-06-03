import { Graphics } from 'pixi.js';
import { ringDurationMs, ringEndRadius, ringStartRadius } from '../data/balance';
import type { CornerEffectKind, ManagedEffect } from './effectTypes';

const ringColors: Record<CornerEffectKind, number> = {
  corner_hit: 0x8cdcff,
  jackpot: 0xffd681,
  lucky_corner: 0xff9ddc,
  near_corner: 0x8cdcff,
};

interface CreateRingEffectParams {
  kind: CornerEffectKind;
  lowMotion: boolean;
  x: number;
  y: number;
}

export function createRingEffect({
  kind,
  lowMotion,
  x,
  y,
}: CreateRingEffectParams): ManagedEffect & { graphic: Graphics } {
  const maxLife = ringDurationMs / 1_000;
  let life = maxLife;
  const startRadius = lowMotion ? ringStartRadius * 0.85 : ringStartRadius;
  const endRadius = lowMotion ? ringEndRadius * 0.78 : ringEndRadius;
  const graphic = new Graphics();

  const redraw = (progress: number) => {
    const radius = startRadius + (endRadius - startRadius) * (1 - progress);
    graphic
      .clear()
      .circle(x, y, radius)
      .stroke({ color: ringColors[kind], alpha: 0.85 * progress, width: lowMotion ? 3 : 5 })
      .circle(x, y, radius * 0.62)
      .stroke({ color: 0xffffff, alpha: 0.18 * progress, width: lowMotion ? 1 : 2 });
  };

  redraw(1);

  return {
    graphic,
    destroy: () => graphic.destroy(),
    update: (deltaSeconds) => {
      life -= deltaSeconds;
      const progress = Math.max(0, life / maxLife);
      redraw(progress);
      return life > 0;
    },
  };
}
