import {
  assistedCornerHitEnabled,
  cornerHitAssistZonePx,
  cornerHitGracePx,
  nearCornerDistance,
  strictCornerHitEnabled,
} from '../data/balance';
import type { CornerHitPosition } from '../types/game';
import type { ArenaBounds, BounceBody } from './bouncePhysics';

export interface StageCollisionLimits {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
}

export interface WallCollisionResult extends StageCollisionLimits {
  cornerId: CornerHitPosition | null;
  hitBottom: boolean;
  hitLeft: boolean;
  hitRight: boolean;
  hitTop: boolean;
  hitXWall: boolean;
  hitYWall: boolean;
  nextX: number;
  nextY: number;
}

export interface CornerCollisionResult extends WallCollisionResult {
  isAssistedCornerHit: boolean;
  isCornerHit: boolean;
  isNearCorner: boolean;
  nearCornerId: CornerHitPosition | null;
}

interface DetectWallCollisionParams {
  bounds: ArenaBounds;
  cornerZonePx?: number;
  gracePx?: number;
  nearDistance?: number;
  nextX: number;
  nextY: number;
  previousBody: BounceBody;
}

interface DetectNearCornerParams {
  collision: WallCollisionResult;
  nearDistance?: number;
}

export function getCollisionLimits(bounds: ArenaBounds, radius: number): StageCollisionLimits {
  return {
    maxX: bounds.width - bounds.inset - radius,
    maxY: bounds.height - bounds.inset - radius,
    minX: bounds.inset + radius,
    minY: bounds.inset + radius,
  };
}

export function getCornerId(
  hitLeft: boolean,
  hitRight: boolean,
  hitTop: boolean,
  hitBottom: boolean,
): CornerHitPosition | null {
  if (hitLeft && hitTop) {
    return 'top_left';
  }

  if (hitRight && hitTop) {
    return 'top_right';
  }

  if (hitLeft && hitBottom) {
    return 'bottom_left';
  }

  if (hitRight && hitBottom) {
    return 'bottom_right';
  }

  return null;
}

export function detectWallCollision({
  bounds,
  gracePx = cornerHitGracePx,
  nextX,
  nextY,
  previousBody,
}: DetectWallCollisionParams): WallCollisionResult {
  const { maxX, maxY, minX, minY } = getCollisionLimits(bounds, previousBody.radius);
  const tolerance = Math.min(Math.max(gracePx, 0), 0.001);
  const movingLeft = previousBody.vx < 0;
  const movingRight = previousBody.vx > 0;
  const movingUp = previousBody.vy < 0;
  const movingDown = previousBody.vy > 0;
  const hitLeft =
    nextX <= minX + tolerance || (movingLeft && previousBody.x >= minX && nextX <= minX);
  const hitRight =
    nextX >= maxX - tolerance || (movingRight && previousBody.x <= maxX && nextX >= maxX);
  const hitTop =
    nextY <= minY + tolerance || (movingUp && previousBody.y >= minY && nextY <= minY);
  const hitBottom =
    nextY >= maxY - tolerance || (movingDown && previousBody.y <= maxY && nextY >= maxY);
  const hitXWall = hitLeft || hitRight;
  const hitYWall = hitTop || hitBottom;

  return {
    cornerId: getCornerId(hitLeft, hitRight, hitTop, hitBottom),
    hitBottom,
    hitLeft,
    hitRight,
    hitTop,
    hitXWall,
    hitYWall,
    maxX,
    maxY,
    minX,
    minY,
    nextX,
    nextY,
  };
}

export function detectCornerHit(collision: WallCollisionResult, cornerZonePx = cornerHitAssistZonePx) {
  const strictCornerHit = strictCornerHitEnabled && collision.hitXWall && collision.hitYWall;
  const safeCornerZonePx = Math.max(0, cornerZonePx);
  const nearTop = collision.nextY <= collision.minY + safeCornerZonePx;
  const nearBottom = collision.nextY >= collision.maxY - safeCornerZonePx;
  const nearLeft = collision.nextX <= collision.minX + safeCornerZonePx;
  const nearRight = collision.nextX >= collision.maxX - safeCornerZonePx;
  const assistedCornerHit =
    assistedCornerHitEnabled &&
    ((collision.hitXWall && (nearTop || nearBottom)) ||
      (collision.hitYWall && (nearLeft || nearRight)));
  const isCornerHit = strictCornerHit || assistedCornerHit;

  return {
    cornerId: isCornerHit
      ? getCornerId(
          collision.hitLeft || nearLeft,
          collision.hitRight || nearRight,
          collision.hitTop || nearTop,
          collision.hitBottom || nearBottom,
        )
      : null,
    isAssistedCornerHit: !strictCornerHit && assistedCornerHit,
    isCornerHit,
  };
}

export function detectNearCorner({
  collision,
  nearDistance = nearCornerDistance,
}: DetectNearCornerParams) {
  if (collision.hitXWall === collision.hitYWall) {
    return {
      isNearCorner: false,
      nearCornerId: null,
    };
  }

  if (collision.hitXWall) {
    const nearTop = collision.nextY <= collision.minY + nearDistance;
    const nearBottom = collision.nextY >= collision.maxY - nearDistance;

    return {
      isNearCorner: nearTop || nearBottom,
      nearCornerId: getCornerId(collision.hitLeft, collision.hitRight, nearTop, nearBottom),
    };
  }

  const nearLeft = collision.nextX <= collision.minX + nearDistance;
  const nearRight = collision.nextX >= collision.maxX - nearDistance;

  return {
    isNearCorner: nearLeft || nearRight,
    nearCornerId: getCornerId(nearLeft, nearRight, collision.hitTop, collision.hitBottom),
  };
}

export function detectBounceCollision(params: DetectWallCollisionParams): CornerCollisionResult {
  const collision = detectWallCollision(params);
  const cornerHit = detectCornerHit(collision, params.cornerZonePx);
  if (cornerHit.isCornerHit) {
    return {
      ...collision,
      ...cornerHit,
      isNearCorner: false,
      nearCornerId: null,
    };
  }
  const nearCorner = detectNearCorner({
    collision,
    nearDistance: params.nearDistance,
  });

  return {
    ...collision,
    ...cornerHit,
    ...nearCorner,
  };
}

export function clampPositionToBounds(
  position: { x: number; y: number },
  limits: StageCollisionLimits,
) {
  return {
    x: Math.min(Math.max(position.x, limits.minX), limits.maxX),
    y: Math.min(Math.max(position.y, limits.minY), limits.maxY),
  };
}
