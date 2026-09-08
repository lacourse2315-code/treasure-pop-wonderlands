import type { PlayerCommandBus, PlayerCommand } from '../../domain/input/playerCommand';

export class TouchInputAdapter {
  public constructor(
    private readonly bus: PlayerCommandBus,
    private readonly root: ParentNode = document,
  ) {}
  public start(): void {
    this.root.addEventListener('pointerup', this.onPointerUp as EventListener);
  }
  public stop(): void {
    this.root.removeEventListener('pointerup', this.onPointerUp as EventListener);
  }
  private readonly onPointerUp = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch') return;
    const target = (event.target as Element | null)?.closest<HTMLElement>('[data-player-command]');
    const command = target?.dataset.playerCommand as PlayerCommand | undefined;
    if (command) this.bus.emit(command);
  };
}
