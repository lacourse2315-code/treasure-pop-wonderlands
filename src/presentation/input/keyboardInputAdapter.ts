import type { PlayerCommandBus, PlayerCommand } from '../../domain/input/playerCommand';

const KEY_COMMANDS: Readonly<Record<string, PlayerCommand>> = {
  ArrowUp: 'move-up', KeyW: 'move-up', ArrowDown: 'move-down', KeyS: 'move-down', ArrowLeft: 'move-left', KeyA: 'move-left', ArrowRight: 'move-right', KeyD: 'move-right', Space: 'primary-action', Enter: 'primary-action', Escape: 'back', KeyP: 'pause-menu',
};

export class KeyboardInputAdapter {
  private readonly onKeyDown = (event: KeyboardEvent): void => { const command = KEY_COMMANDS[event.code]; if (command) { event.preventDefault(); this.bus.emit(command); } };
  public constructor(private readonly bus: PlayerCommandBus, private readonly target: Window = window) {}
  public start(): void { this.target.addEventListener('keydown', this.onKeyDown); }
  public stop(): void { this.target.removeEventListener('keydown', this.onKeyDown); }
}
