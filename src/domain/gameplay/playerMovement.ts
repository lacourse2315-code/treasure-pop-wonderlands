export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Bounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export function normalizeMovement(x: number, y: number): Point {
  const length = Math.hypot(x, y);
  if (length <= 1) return { x, y };
  return { x: x / length, y: y / length };
}

export function moveWithinBounds(
  position: Point,
  intent: Point,
  speed: number,
  deltaSeconds: number,
  bounds: Bounds,
): Point {
  const direction = normalizeMovement(intent.x, intent.y);
  return {
    x: clamp(position.x + direction.x * speed * deltaSeconds, bounds.minX, bounds.maxX),
    y: clamp(position.y + direction.y * speed * deltaSeconds, bounds.minY, bounds.maxY),
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
