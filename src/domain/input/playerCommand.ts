export type PlayerCommand =
  | 'move-up'
  | 'move-down'
  | 'move-left'
  | 'move-right'
  | 'primary-action'
  | 'back'
  | 'pause-menu';
export type CommandListener = (command: PlayerCommand) => void;
export type CommandStateListener = (command: PlayerCommand, active: boolean) => void;

export class PlayerCommandBus {
  private readonly listeners = new Set<CommandListener>();
  private readonly stateListeners = new Set<CommandStateListener>();

  public emit(command: PlayerCommand): void {
    for (const listener of this.listeners) listener(command);
    this.emitState(command, true);
    this.emitState(command, false);
  }

  public emitState(command: PlayerCommand, active: boolean): void {
    for (const listener of this.stateListeners) listener(command, active);
  }

  public subscribe(listener: CommandListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeState(listener: CommandStateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }
}
