import type { ArenaBounds, BounceBody } from './bouncePhysics';

export function isCornerHit(
  body: BounceBody,
  bounds: ArenaBounds,
  threshold: number,
): boolean {
  const minX = bounds.inset + body.radius;
  const maxX = bounds.width - bounds.inset - body.radius;
  const minY = bounds.inset + body.radius;
  const maxY = bounds.height - bounds.inset - body.radius;
  const isNearHorizontalEdge = body.x <= minX + threshold || body.x >= maxX - threshold;
  const isNearVerticalEdge = body.y <= minY + threshold || body.y >= maxY - threshold;

  return isNearHorizontalEdge && isNearVerticalEdge;
}
