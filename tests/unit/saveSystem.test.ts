import { describe, expect, it } from 'vitest';
import {
  createSaveEnvelope,
  validateSaveEnvelope,
  type SaveEnvelopeV1,
  type SaveSlot,
  type SaveStorePort,
} from '../../src/domain/save/saveContract';
import type { ChildProfile, ProfileId } from '../../src/domain/profiles/profile';
import { SaveService } from '../../src/application/save/saveService';

const profile = (id: string): ChildProfile => ({
  profileId: id as ProfileId,
  displayName: id,
  createdAtIso: '2026-09-08T00:00:00.000Z',
  lastUsedAtIso: '2026-09-08T00:00:00.000Z',
  saveSchemaVersion: 1,
});
class MemoryStore implements SaveStorePort {
  private values = new Map<string, SaveEnvelopeV1>();
  read(id: ProfileId, slot: SaveSlot): Promise<SaveEnvelopeV1 | null> {
    return Promise.resolve(this.values.get(`${id}:${slot}`) ?? null);
  }
  write(id: ProfileId, slot: SaveSlot, save: SaveEnvelopeV1): Promise<void> {
    this.values.set(`${id}:${slot}`, save);
    return Promise.resolve();
  }
  deleteProfile(id: ProfileId): Promise<void> {
    for (const slot of ['current', 'previous', 'lastKnownGood'] as const)
      this.values.delete(`${id}:${slot}`);
    return Promise.resolve();
  }
  corrupt(id: ProfileId, slot: SaveSlot): void {
    const save = this.values.get(`${id}:${slot}`);
    if (save) this.values.set(`${id}:${slot}`, { ...save, checksum: 'corrupt' });
  }
}

describe('save system', () => {
  it('accepts V1 and rejects missing/future versions and invalid payloads', () => {
    const save = createSaveEnvelope(profile('a'), { value: 1 });
    expect(validateSaveEnvelope(save).valid).toBe(true);
    expect(validateSaveEnvelope({ ...save, schemaVersion: 2 }).valid).toBe(false);
    expect(validateSaveEnvelope({ ...save, schemaVersion: undefined }).valid).toBe(false);
    expect(validateSaveEnvelope({ ...save, payload: [] }).valid).toBe(false);
  });
  it('rejects cross-profile restoration', () => {
    const save = createSaveEnvelope(profile('a'), {});
    expect(validateSaveEnvelope(save, 'b' as ProfileId).valid).toBe(false);
  });
  it('keeps profiles isolated', async () => {
    const store = new MemoryStore();
    const service = new SaveService(store);
    await service.save(profile('a').profileId, createSaveEnvelope(profile('a'), { value: 1 }));
    await service.save(profile('b').profileId, createSaveEnvelope(profile('b'), { value: 9 }));
    expect((await service.load('a' as ProfileId)).save?.payload.value).toBe(1);
    expect((await service.load('b' as ProfileId)).save?.payload.value).toBe(9);
  });
  it('recovers previous save when current is corrupt', async () => {
    const store = new MemoryStore();
    const service = new SaveService(store);
    const p = profile('a');
    await service.save(
      p.profileId,
      createSaveEnvelope(p, { value: 1 }, 0, '2026-09-08T00:00:00.000Z'),
    );
    await service.save(
      p.profileId,
      createSaveEnvelope(p, { value: 2 }, 0, '2026-09-08T00:01:00.000Z'),
    );
    store.corrupt(p.profileId, 'current');
    const loaded = await service.load(p.profileId);
    expect(loaded.recoveredFrom).toBe('previous');
    expect(loaded.save?.payload.value).toBe(1);
  });
});
