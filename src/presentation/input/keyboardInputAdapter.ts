import type { PlayerCommandBus, PlayerCommand } from '../../domain/input/playerCommand';

const KEY_COMMANDS: Readonly<Record<string, PlayerCommand>> = {
  ArrowUp: 'move-up',
  KeyW: 'move-up',
  ArrowDown: 'move-down',
  KeyS: 'move-down',
  ArrowLeft: 'move-left',
  KeyA: 'move-left',
  ArrowRight: 'move-right',
  KeyD: 'move-right',
  KeyE: 'primary-action',
  Space: 'primary-action',
  Enter: 'primary-action',
  Escape: 'pause-menu',
  KeyP: 'pause-menu',
};

export class KeyboardInputAdapter {
  private readonly onKeyDown = (event: KeyboardEvent): void => this.handle(event, true);
  private readonly onKeyUp = (event: KeyboardEvent): void => this.handle(event, false);
  private readonly onBlur = (): void => this.reset();
  private readonly pressed = new Set<PlayerCommand>();

  public constructor(
    private readonly bus: PlayerCommandBus,
    private readonly target: Window = window,
  ) {}

  public start(): void {
    this.target.addEventListener('keydown', this.onKeyDown);
    this.target.addEventListener('keyup', this.onKeyUp);
    this.target.addEventListener('blur', this.onBlur);
  }

  public stop(): void {
    this.reset();
    this.target.removeEventListener('keydown', this.onKeyDown);
    this.target.removeEventListener('keyup', this.onKeyUp);
    this.target.removeEventListener('blur', this.onBlur);
  }

  private handle(event: KeyboardEvent, active: boolean): void {
    const command = KEY_COMMANDS[event.code];
    if (!command) return;
    event.preventDefault();
    if (active && !this.pressed.has(command)) {
      this.pressed.add(command);
      this.bus.emitState(command, true);
    } else if (!active && this.pressed.delete(command)) this.bus.emitState(command, false);
  }

  private reset(): void {
    for (const command of this.pressed) this.bus.emitState(command, false);
    this.pressed.clear();
  }
}
