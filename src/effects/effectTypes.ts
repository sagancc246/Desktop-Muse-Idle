import type { Container } from 'pixi.js';
import type { CornerHitPosition, MotionIntensity } from '../types/game';

export type CornerEffectKind = 'corner_hit' | 'lucky_corner' | 'jackpot' | 'near_corner';

export interface ManagedEffect {
  destroy: () => void;
  update: (deltaSeconds: number) => boolean;
}

export interface CornerEffectLayers {
  cornerGlowLayer: Container;
  ringLayer: Container;
  screenFlashLayer: Container;
  textLayer: Container;
}

export interface CornerEffectTrigger {
  corner: CornerHitPosition;
  kind: CornerEffectKind;
  motionIntensity: MotionIntensity;
  reward: number;
  stageHeight: number;
  stageInset: number;
  stageWidth: number;
  x: number;
  y: number;
}
