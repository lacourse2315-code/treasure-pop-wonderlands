import { describe, expect, it } from 'vitest';
import { createInteractionTargetId, isInteractionInRange } from '../../src/domain/gameplay/interaction';
import { moveWithinBounds, normalizeMovement } from '../../src/domain/gameplay/playerMovement';
import { PlayerCommandBus } from '../../src/domain/input/playerCommand';
import { PlayerInputState } from '../../src/domain/input/playerInputState';
import { ProfileRegistry } from '../../src/domain/profiles/profileRegistry';

const bounds = { minX: 0, minY: 0, maxX: 100, maxY: 100 };

describe('PRD-04 pure gameplay foundation', () => {
  it('normalizes diagonal movement without accelerating it', () => {
    const direction = normalizeMovement(1, 1);
    expect(Math.hypot(direction.x, direction.y)).toBeCloseTo(1);
  });

  it('moves frame-independently and remains within world bounds', () => {
    expect(moveWithinBounds({ x: 50, y: 50 }, { x: 1, y: 0 }, 20, 0.5, bounds)).toEqual({
      x: 60,
      y: 50,
    });
    expect(moveWithinBounds({ x: 99, y: 50 }, { x: 1, y: 0 }, 20, 1, bounds).x).toBe(100);
  });

  it('distinguishes interaction range and uses stable target identity', () => {
    const target = {
      interactionTargetId: createInteractionTargetId('beacon-01'),
      position: { x: 10, y: 10 },
      range: 5,
    };
    expect(target.interactionTargetId).toBe('beacon-01');
    expect(isInteractionInRange({ x: 14, y: 10 }, target)).toBe(true);
    expect(isInteractionInRange({ x: 20, y: 10 }, target)).toBe(false);
  });

  it('tracks held movement, action, pause, release, and reset semantically', () => {
    const bus = new PlayerCommandBus();
    const input = new PlayerInputState(bus);
    bus.emitState('move-right', true);
    bus.emitState('move-up', true);
    expect(Math.hypot(input.movement().x, input.movement().y)).toBeCloseTo(1);
    bus.emitState('move-right', false);
    expect(input.movement()).toEqual({ x: 0, y: -1 });
    bus.emitState('primary-action', true);
    expect(input.consumePrimaryAction()).toBe(true);
    expect(input.consumePrimaryAction()).toBe(false);
    bus.emitState('pause-menu', true);
    expect(input.consumePause()).toBe(true);
    input.reset();
    expect(input.movement()).toEqual({ x: 0, y: 0 });
    input.destroy();
  });

  it('hydrates profile snapshots without cross-profile active-state contamination', () => {
    const registry = new ProfileRegistry();
    const first = registry.create('One', '2026-09-08T00:00:00.000Z');
    const second = registry.create('Two', '2026-09-08T00:00:01.000Z');
    registry.select(second.profileId, '2026-09-08T00:00:02.000Z');
    const restored = new ProfileRegistry(registry.snapshot());
    expect(restored.getActive()?.profileId).toBe(second.profileId);
    restored.select(first.profileId);
    expect(restored.getActive()?.profileId).toBe(first.profileId);
  });
});
