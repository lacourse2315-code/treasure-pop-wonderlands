export const WORLD_DEPTH = {
  background: 0,
  distant: 100,
  ground: 200,
  groundDetail: 300,
  gameplayBase: 1000,
  foreground: 3000,
  effects: 4000,
} as const;

export function ySortDepth(y: number): number {
  return WORLD_DEPTH.gameplayBase + Math.round(y);
}
