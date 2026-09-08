export type PlayerCommand =
  'move-up' | 'move-down' | 'move-left' | 'move-right' | 'primary-action' | 'back' | 'pause-menu';
export type CommandListener = (command: PlayerCommand) => void;

export class PlayerCommandBus {
  private readonly listeners = new Set<CommandListener>();
  public emit(command: PlayerCommand): void {
    for (const listener of this.listeners) listener(command);
  }
  public subscribe(listener: CommandListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
