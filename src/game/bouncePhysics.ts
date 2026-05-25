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
): BounceStepResult {
  const nextBody = {
    ...body,
    x: body.x + body.vx * deltaSeconds,
    y: body.y + body.vy * deltaSeconds,
  };
  const minX = bounds.inset + body.radius;
  const maxX = bounds.width - bounds.inset - body.radius;
  const minY = bounds.inset + body.radius;
  const maxY = bounds.height - bounds.inset - body.radius;
  let bounced = false;

  if (nextBody.x <= minX || nextBody.x >= maxX) {
    nextBody.x = Math.min(Math.max(nextBody.x, minX), maxX);
    nextBody.vx *= -1;
    bounced = true;
  }

  if (nextBody.y <= minY || nextBody.y >= maxY) {
    nextBody.y = Math.min(Math.max(nextBody.y, minY), maxY);
    nextBody.vy *= -1;
    bounced = true;
  }

  return { body: nextBody, bounced };
}
