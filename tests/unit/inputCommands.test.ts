import { describe, expect, it } from 'vitest';
import { PlayerCommandBus } from '../../src/domain/input/playerCommand';

describe('semantic player commands', () => {
  it('delivers semantic commands without Phaser', () => { const bus = new PlayerCommandBus(); const received: string[] = []; bus.subscribe((command) => received.push(command)); bus.emit('move-left'); bus.emit('primary-action'); expect(received).toEqual(['move-left', 'primary-action']); });
});
