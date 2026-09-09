import { describe, expect, it } from 'vitest';
import { WORLD_DEPTH, ySortDepth } from '../../src/domain/gameplay/worldDepth';

describe('Wonder World depth foundation', () => {
  it('keeps presentation layers in deterministic order', () => {
    expect(WORLD_DEPTH.background).toBeLessThan(WORLD_DEPTH.distant);
    expect(WORLD_DEPTH.distant).toBeLessThan(WORLD_DEPTH.ground);
    expect(WORLD_DEPTH.ground).toBeLessThan(WORLD_DEPTH.groundDetail);
    expect(WORLD_DEPTH.groundDetail).toBeLessThan(WORLD_DEPTH.gameplayBase);
    expect(ySortDepth(900)).toBeLessThan(WORLD_DEPTH.foreground);
    expect(WORLD_DEPTH.foreground).toBeLessThan(WORLD_DEPTH.effects);
  });

  it('sorts lower world objects in front of higher world objects', () => {
    expect(ySortDepth(500)).toBeGreaterThan(ySortDepth(300));
  });
});
