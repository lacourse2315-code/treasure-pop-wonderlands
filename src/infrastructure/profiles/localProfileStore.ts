import type { ProfileRegistrySnapshot } from '../../domain/profiles/profileRegistry';

const STORAGE_KEY = 'wonderlands.profile-registry.v1';

export class LocalProfileStore {
  public load(): ProfileRegistrySnapshot | undefined {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ProfileRegistrySnapshot) : undefined;
    } catch {
      return undefined;
    }
  }

  public save(snapshot: ProfileRegistrySnapshot): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }
}
