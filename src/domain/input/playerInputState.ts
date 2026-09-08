import type { PlayerCommand, PlayerCommandBus } from './playerCommand';

const MOVEMENT_COMMANDS = new Set<PlayerCommand>([
  'move-up',
  'move-down',
  'move-left',
  'move-right',
]);

export class PlayerInputState {
  private readonly active = new Set<PlayerCommand>();
  private primaryActionQueued = false;
  private pauseQueued = false;
  private readonly unsubscribe: () => void;

  public constructor(bus: PlayerCommandBus) {
    this.unsubscribe = bus.subscribeState((command, active) => {
      if (MOVEMENT_COMMANDS.has(command)) {
        if (active) this.active.add(command);
        else this.active.delete(command);
      } else if (active && command === 'primary-action') this.primaryActionQueued = true;
      else if (active && (command === 'pause-menu' || command === 'back')) this.pauseQueued = true;
    });
  }

  public movement(): Readonly<{ x: number; y: number }> {
    const x = Number(this.active.has('move-right')) - Number(this.active.has('move-left'));
    const y = Number(this.active.has('move-down')) - Number(this.active.has('move-up'));
    const length = Math.hypot(x, y);
    return length > 1 ? { x: x / length, y: y / length } : { x, y };
  }

  public consumePrimaryAction(): boolean {
    const queued = this.primaryActionQueued;
    this.primaryActionQueued = false;
    return queued;
  }

  public consumePause(): boolean {
    const queued = this.pauseQueued;
    this.pauseQueued = false;
    return queued;
  }

  public reset(): void {
    this.active.clear();
    this.primaryActionQueued = false;
    this.pauseQueued = false;
  }

  public destroy(): void {
    this.unsubscribe();
    this.reset();
  }
}
