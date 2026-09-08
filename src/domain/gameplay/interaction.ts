import type { Point } from './playerMovement';

export type InteractionTargetId = string & { readonly __interactionTargetId: unique symbol };

export interface InteractionTarget {
  readonly interactionTargetId: InteractionTargetId;
  readonly position: Point;
  readonly range: number;
}

export function isInteractionInRange(player: Point, target: InteractionTarget): boolean {
  return Math.hypot(player.x - target.position.x, player.y - target.position.y) <= target.range;
}

export function createInteractionTargetId(value: string): InteractionTargetId {
  if (!/^[a-z0-9][a-z0-9-]*$/u.test(value)) throw new Error('Interaction target ID is invalid.');
  return value as InteractionTargetId;
}
