import { SaveService } from '../save/saveService';
import { PlaySession } from '../play/playSession';
import { PlayerCommandBus } from '../../domain/input/playerCommand';
import { PlayerInputState } from '../../domain/input/playerInputState';
import { ProfileRegistry } from '../../domain/profiles/profileRegistry';
import { LocalProfileStore } from '../../infrastructure/profiles/localProfileStore';
import { IndexedDbSaveStore } from '../../infrastructure/save/indexedDbSaveStore';

export class WonderlandsRuntime {
  public readonly bus = new PlayerCommandBus();
  public readonly input = new PlayerInputState(this.bus);
  public readonly saves = new SaveService(new IndexedDbSaveStore());
  private readonly profileStore = new LocalProfileStore();
  public readonly profiles = new ProfileRegistry(this.profileStore.load());
  private session: PlaySession | null = null;

  public persistProfiles(): void {
    this.profileStore.save(this.profiles.snapshot());
  }

  public async startActiveSession(): Promise<PlaySession | null> {
    const profile = this.profiles.getActive();
    if (!profile) return null;
    this.input.reset();
    this.session = new PlaySession(profile, this.saves);
    await this.session.load();
    return this.session;
  }

  public getSession(): PlaySession | null {
    return this.session;
  }

  public clearSession(): void {
    this.input.reset();
    this.session = null;
  }
}

let runtime: WonderlandsRuntime | null = null;

export function installRuntime(next: WonderlandsRuntime): void {
  runtime = next;
}

export function getRuntime(): WonderlandsRuntime {
  if (!runtime) throw new Error('Wonderlands runtime has not been installed.');
  return runtime;
}
