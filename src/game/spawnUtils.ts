import type { ArenaBounds } from './bouncePhysics';

export interface SpawnPosition {
  radius?: number;
  x: number;
  y: number;
}

interface FindSafeCloneSpawnPositionParams {
  activeMuses: readonly SpawnPosition[];
  bounds: ArenaBounds;
  cloneRadius: number;
  maxAttempts: number;
  minDistance: number;
  sourcePosition: SpawnPosition;
  wallPadding: number;
}

function distanceBetween(first: SpawnPosition, second: SpawnPosition): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function clampPositionToStage(
  position: SpawnPosition,
  bounds: ArenaBounds,
  padding: number,
  radius = 0,
): SpawnPosition {
  const edgePadding = bounds.inset + padding + radius;

  return {
    ...position,
    x: Math.min(Math.max(position.x, edgePadding), bounds.width - edgePadding),
    y: Math.min(Math.max(position.y, edgePadding), bounds.height - edgePadding),
  };
}

export function isOverlappingAnyMuse(
  position: SpawnPosition,
  activeMuses: readonly SpawnPosition[],
  minDistance: number,
): boolean {
  return activeMuses.some((musePosition) => {
    const visibleSeparation = (position.radius ?? 0) + (musePosition.radius ?? 0) + 8;
    return distanceBetween(position, musePosition) < Math.max(minDistance, visibleSeparation);
  });
}

export function findSafeCloneSpawnPosition({
  activeMuses,
  bounds,
  cloneRadius,
  maxAttempts,
  minDistance,
  sourcePosition,
  wallPadding,
}: FindSafeCloneSpawnPositionParams): SpawnPosition {
  const isSafe = (position: SpawnPosition) =>
    !isOverlappingAnyMuse(position, activeMuses, minDistance);
  const clampCandidate = (position: SpawnPosition) =>
    clampPositionToStage(position, bounds, wallPadding, cloneRadius);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = minDistance + cloneRadius + Math.random() * minDistance * 1.75;
    const candidate = clampCandidate({
      radius: cloneRadius,
      x: sourcePosition.x + Math.cos(angle) * distance,
      y: sourcePosition.y + Math.sin(angle) * distance,
    });

    if (isSafe(candidate)) {
      return candidate;
    }
  }

  const center = { radius: cloneRadius, x: bounds.width / 2, y: bounds.height / 2 };
  const awayX = sourcePosition.x - center.x;
  const awayY = sourcePosition.y - center.y;
  const awayLength = Math.hypot(awayX, awayY) || 1;
  const fallbackDistance = minDistance + cloneRadius * 2;
  const candidates = [
    {
      radius: cloneRadius,
      x: sourcePosition.x - (awayX / awayLength) * fallbackDistance,
      y: sourcePosition.y - (awayY / awayLength) * fallbackDistance,
    },
    center,
    { radius: cloneRadius, x: center.x - bounds.width * 0.22, y: center.y - bounds.height * 0.22 },
    { radius: cloneRadius, x: center.x + bounds.width * 0.22, y: center.y - bounds.height * 0.22 },
    { radius: cloneRadius, x: center.x - bounds.width * 0.22, y: center.y + bounds.height * 0.22 },
    { radius: cloneRadius, x: center.x + bounds.width * 0.22, y: center.y + bounds.height * 0.22 },
  ].map(clampCandidate);

  const safeFallback = candidates.find(isSafe);
  if (safeFallback) {
    return safeFallback;
  }

  return candidates.reduce((best, candidate) => {
    const nearestDistance = Math.min(
      ...activeMuses.map((activeMuse) => distanceBetween(candidate, activeMuse)),
    );
    const bestNearestDistance = Math.min(
      ...activeMuses.map((activeMuse) => distanceBetween(best, activeMuse)),
    );

    return nearestDistance > bestNearestDistance ? candidate : best;
  });
}
