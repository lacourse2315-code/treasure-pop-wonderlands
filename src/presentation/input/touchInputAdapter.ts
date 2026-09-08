import type { PlayerCommandBus, PlayerCommand } from '../../domain/input/playerCommand';

export class TouchInputAdapter {
  private readonly activePointers = new Map<number, PlayerCommand>();

  public constructor(
    private readonly bus: PlayerCommandBus,
    private readonly root: ParentNode = document,
  ) {}

  public start(): void {
    this.root.addEventListener('pointerdown', this.onPointerDown as EventListener);
    this.root.addEventListener('pointerup', this.onPointerEnd as EventListener);
    this.root.addEventListener('pointercancel', this.onPointerEnd as EventListener);
  }

  public stop(): void {
    this.reset();
    this.root.removeEventListener('pointerdown', this.onPointerDown as EventListener);
    this.root.removeEventListener('pointerup', this.onPointerEnd as EventListener);
    this.root.removeEventListener('pointercancel', this.onPointerEnd as EventListener);
  }

  public reset(): void {
    for (const command of this.activePointers.values()) this.bus.emitState(command, false);
    this.activePointers.clear();
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch') return;
    const command = this.commandFrom(event);
    if (!command) return;
    event.preventDefault();
    this.activePointers.set(event.pointerId, command);
    this.bus.emitState(command, true);
  };

  private readonly onPointerEnd = (event: PointerEvent): void => {
    const command = this.activePointers.get(event.pointerId);
    if (!command) return;
    event.preventDefault();
    this.activePointers.delete(event.pointerId);
    this.bus.emitState(command, false);
  };

  private commandFrom(event: PointerEvent): PlayerCommand | undefined {
    const target = (event.target as Element | null)?.closest<HTMLElement>('[data-player-command]');
    return target?.dataset.playerCommand as PlayerCommand | undefined;
  }
}
