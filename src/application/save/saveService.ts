import { validateSaveEnvelope, type SaveEnvelopeV1, type SaveStorePort } from '../../domain/save/saveContract';
import type { ProfileId } from '../../domain/profiles/profile';

export class SaveService {
  public constructor(private readonly store: SaveStorePort) {}

  public async save(profileId: ProfileId, next: SaveEnvelopeV1): Promise<void> {
    if (!validateSaveEnvelope(next, profileId).valid) throw new Error('Cannot save an invalid envelope.');
    const current = await this.store.read(profileId, 'current');
    const lastKnownGood = await this.store.read(profileId, 'lastKnownGood');
    if (current) await this.store.write(profileId, 'previous', current);
    if (current && !lastKnownGood) await this.store.write(profileId, 'lastKnownGood', current);
    await this.store.write(profileId, 'current', next);
    const verified = await this.store.read(profileId, 'current');
    if (!verified || !validateSaveEnvelope(verified, profileId).valid) throw new Error('Save verification failed after write.');
    await this.store.write(profileId, 'lastKnownGood', verified);
  }

  public async load(profileId: ProfileId): Promise<{ save: SaveEnvelopeV1 | null; recoveredFrom: 'current' | 'previous' | 'lastKnownGood' | null }> {
    for (const slot of ['current', 'previous', 'lastKnownGood'] as const) {
      const candidate = await this.store.read(profileId, slot);
      if (candidate && validateSaveEnvelope(candidate, profileId).valid) return { save: candidate, recoveredFrom: slot };
    }
    return { save: null, recoveredFrom: null };
  }

  public deleteProfile(profileId: ProfileId): Promise<void> { return this.store.deleteProfile(profileId); }
}
