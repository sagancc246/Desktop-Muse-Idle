import { Container } from 'pixi.js';
import { createCornerGlowEffect } from './cornerGlow';
import type { CornerEffectLayers, CornerEffectTrigger, ManagedEffect } from './effectTypes';
import { createFloatingTextEffect } from './floatingText';
import { createRingEffect } from './ringEffect';
import { createScreenFlashEffect } from './screenFlash';

export function createEffectManager(layers: CornerEffectLayers) {
  const effects: Array<ManagedEffect & { graphic: unknown }> = [];

  const addEffect = (
    layer: Container,
    effect: ManagedEffect & { graphic: Parameters<Container['addChild']>[0] },
  ) => {
    layer.addChild(effect.graphic);
    effects.push(effect);
  };

  const triggerCornerHitEffect = ({
    corner,
    kind,
    motionIntensity,
    reward,
    stageHeight,
    stageInset,
    stageWidth,
    x,
    y,
  }: CornerEffectTrigger) => {
    const lowMotion = motionIntensity === 'low';
    addEffect(
      layers.screenFlashLayer,
      createScreenFlashEffect({
        height: stageHeight,
        kind,
        lowMotion,
        width: stageWidth,
      }),
    );
    addEffect(
      layers.cornerGlowLayer,
      createCornerGlowEffect({
        corner,
        height: stageHeight,
        inset: stageInset,
        kind,
        lowMotion,
        width: stageWidth,
      }),
    );
    addEffect(layers.ringLayer, createRingEffect({ kind, lowMotion, x, y }));
    addEffect(
      layers.textLayer,
      createFloatingTextEffect({
        anchor: 'center',
        kind,
        text: kind === 'corner_hit' ? 'CORNER HIT!' : kind === 'lucky_corner' ? 'LUCKY CORNER!' : 'JACKPOT!',
        x: stageWidth / 2,
        y: stageHeight * 0.2,
      }),
    );
    addEffect(
      layers.textLayer,
      createFloatingTextEffect({
        kind,
        text: `+${reward.toLocaleString()} Memory`,
        x,
        y: y - 68,
      }),
    );
  };

  const triggerNearCornerEffect = ({
    corner,
    motionIntensity,
    stageHeight,
    stageInset,
    stageWidth,
    x,
    y,
  }: Omit<CornerEffectTrigger, 'kind' | 'reward'>) => {
    const lowMotion = motionIntensity === 'low';
    const kind = 'near_corner';

    addEffect(
      layers.cornerGlowLayer,
      createCornerGlowEffect({
        corner,
        height: stageHeight,
        inset: stageInset,
        kind,
        lowMotion: true,
        width: stageWidth,
      }),
    );
    if (!lowMotion) {
      addEffect(layers.ringLayer, createRingEffect({ kind, lowMotion: true, x, y }));
    }
    addEffect(
      layers.textLayer,
      createFloatingTextEffect({
        kind,
        text: 'NEAR CORNER',
        x,
        y: y - 58,
      }),
    );
  };

  const triggerVegaBumperEffect = ({
    motionIntensity,
    x,
    y,
  }: Pick<CornerEffectTrigger, 'motionIntensity' | 'x' | 'y'>) => {
    const lowMotion = motionIntensity === 'low';
    const kind = 'near_corner';

    addEffect(layers.ringLayer, createRingEffect({ kind, lowMotion, x, y }));
    if (!lowMotion) {
      addEffect(
        layers.textLayer,
        createFloatingTextEffect({
          kind,
          text: 'BUMPER!',
          x,
          y: y - 58,
        }),
      );
    }
  };

  const update = (deltaSeconds: number) => {
    for (let index = effects.length - 1; index >= 0; index -= 1) {
      const effect = effects[index];
      if (effect.update(deltaSeconds)) {
        continue;
      }

      effect.destroy();
      effects.splice(index, 1);
    }
  };

  const destroy = () => {
    for (const effect of effects) {
      effect.destroy();
    }
    effects.length = 0;
  };

  return {
    destroy,
    triggerCornerHitEffect,
    triggerNearCornerEffect,
    triggerVegaBumperEffect,
    update,
  };
}
