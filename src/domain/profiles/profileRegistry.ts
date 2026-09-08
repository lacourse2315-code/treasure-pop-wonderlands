import { CURRENT_SAVE_SCHEMA_VERSION } from '../save/saveContract';
import {
  MAX_LOCAL_PROFILES,
  createProfileId,
  normalizeProfileName,
  validateProfileName,
  type ChildProfile,
  type ProfileId,
} from './profile';

export class ProfileRegistry {
  private readonly profiles = new Map<ProfileId, ChildProfile>();
  private activeProfileId: ProfileId | null = null;

  public list(): readonly ChildProfile[] {
    return [...this.profiles.values()];
  }
  public getActive(): ChildProfile | null {
    return this.activeProfileId ? (this.profiles.get(this.activeProfileId) ?? null) : null;
  }

  public create(displayName: string, nowIso = new Date().toISOString()): ChildProfile {
    const error = validateProfileName(displayName);
    if (error) throw new Error(error);
    if (this.profiles.size >= MAX_LOCAL_PROFILES)
      throw new Error(`Local profile limit (${String(MAX_LOCAL_PROFILES)}) reached.`);
    const profile: ChildProfile = {
      profileId: createProfileId(),
      displayName: normalizeProfileName(displayName),
      createdAtIso: nowIso,
      lastUsedAtIso: nowIso,
      saveSchemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    };
    this.profiles.set(profile.profileId, profile);
    this.activeProfileId ??= profile.profileId;
    return profile;
  }

  public rename(profileId: ProfileId, displayName: string): ChildProfile {
    const current = this.require(profileId);
    const error = validateProfileName(displayName);
    if (error) throw new Error(error);
    const updated = { ...current, displayName: normalizeProfileName(displayName) };
    this.profiles.set(profileId, updated);
    return updated;
  }

  public select(profileId: ProfileId, nowIso = new Date().toISOString()): ChildProfile {
    const current = this.require(profileId);
    const updated = { ...current, lastUsedAtIso: nowIso };
    this.profiles.set(profileId, updated);
    this.activeProfileId = profileId;
    return updated;
  }

  public remove(profileId: ProfileId): void {
    this.require(profileId);
    this.profiles.delete(profileId);
    if (this.activeProfileId === profileId)
      this.activeProfileId = this.profiles.keys().next().value ?? null;
  }

  private require(profileId: ProfileId): ChildProfile {
    const profile = this.profiles.get(profileId);
    if (!profile) throw new Error('Unknown profile.');
    return profile;
  }
}
