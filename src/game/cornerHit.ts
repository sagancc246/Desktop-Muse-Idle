import { cornerHitGracePx } from '../data/balance';
import type { ArenaBounds, BounceBody } from './bouncePhysics';

export function isCornerHit(
  body: BounceBody,
  bounds: ArenaBounds,
  _threshold: number,
): boolean {
  const minX = bounds.inset + body.radius;
  const maxX = bounds.width - bounds.inset - body.radius;
  const minY = bounds.inset + body.radius;
  const maxY = bounds.height - bounds.inset - body.radius;
  const isTouchingHorizontalEdge =
    body.x <= minX + cornerHitGracePx || body.x >= maxX - cornerHitGracePx;
  const isTouchingVerticalEdge =
    body.y <= minY + cornerHitGracePx || body.y >= maxY - cornerHitGracePx;

  return isTouchingHorizontalEdge && isTouchingVerticalEdge;
}
