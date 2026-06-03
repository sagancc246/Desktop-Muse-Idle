import { clampPositionToBounds, detectBounceCollision } from './cornerHitDetector';
import type { CornerCollisionResult } from './cornerHitDetector';

export interface BounceBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface ArenaBounds {
  width: number;
  height: number;
  inset: number;
}

export interface BounceStepResult {
  body: BounceBody;
  bounced: boolean;
  collision: CornerCollisionResult;
}

export interface BounceStepOptions {
  nearCornerDistance?: number;
}

export function createInitialBody(
  bounds: ArenaBounds,
  radius = 46,
  speed = 180,
): BounceBody {
  const diagonalSpeed = speed / Math.sqrt(2);

  return {
    x: bounds.width / 2,
    y: bounds.height / 2,
    vx: diagonalSpeed,
    vy: diagonalSpeed,
    radius,
  };
}

export function stepBounceBody(
  body: BounceBody,
  bounds: ArenaBounds,
  deltaSeconds: number,
  options: BounceStepOptions = {},
): BounceStepResult {
  const nextBody = {
    ...body,
    x: body.x + body.vx * deltaSeconds,
    y: body.y + body.vy * deltaSeconds,
  };
  const collision = detectBounceCollision({
    bounds,
    nearDistance: options.nearCornerDistance,
    nextX: nextBody.x,
    nextY: nextBody.y,
    previousBody: body,
  });
  const bounced = collision.hitXWall || collision.hitYWall;
  const clampedPosition = clampPositionToBounds(nextBody, collision);

  nextBody.x = clampedPosition.x;
  nextBody.y = clampedPosition.y;

  if (collision.hitXWall) {
    nextBody.vx *= -1;
  }

  if (collision.hitYWall) {
    nextBody.vy *= -1;
  }

  return { body: nextBody, bounced, collision };
}
