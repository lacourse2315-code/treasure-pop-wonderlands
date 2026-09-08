import { describe, expect, it } from 'vitest';
import { PlaySession } from '../../src/application/play/playSession';
import { createSaveEnvelope, type SaveEnvelopeV1, type SaveStorePort } from '../../src/domain/save/saveContract';
import { ProfileRegistry } from '../../src/domain/profiles/profileRegistry';
import type { ProfileId } from '../../src/domain/profiles/profile';
import { SaveService } from '../../src/application/save/saveService';

class MemoryStore implements SaveStorePort {
  public readonly values = new Map<string, SaveEnvelopeV1>();
  public writes = 0;
  public read(profileId: ProfileId, slot: string): Promise<SaveEnvelopeV1 | null> {
    return Promise.resolve(this.values.get(`${profileId}:${slot}`) ?? null);
  }
  public write(profileId: ProfileId, slot: string, save: SaveEnvelopeV1): Promise<void> {
    this.writes += 1;
    this.values.set(`${profileId}:${slot}`, save);
    return Promise.resolve();
  }
  public deleteProfile(): Promise<void> {
    return Promise.resolve();
  }
}

describe('PRD-04 play session persistence', () => {
  it('autosaves technical progression only after a new persistent interaction', async () => {
    const profile = new ProfileRegistry().create('Player');
    const store = new MemoryStore();
    const session = new PlaySession(profile, new SaveService(store));
    await session.load();
    await session.completeInteraction('target-a');
    const writesAfterFirst = store.writes;
    await session.completeInteraction('target-a');
    expect(session.getProgress().technicalInteractionsCompleted).toBe(1);
    expect(store.writes).toBe(writesAfterFirst);
  });

  it('reloads persisted progression for the correct profile', async () => {
    const registry = new ProfileRegistry();
    const profile = registry.create('Player');
    const other = registry.create('Other');
    const store = new MemoryStore();
    const service = new SaveService(store);
    await service.save(profile.profileId, createSaveEnvelope(profile, { technicalInteractionsCompleted: 3, activatedTargetIds: ['a'] }));
    const first = new PlaySession(profile, service);
    const second = new PlaySession(other, service);
    expect((await first.load()).technicalInteractionsCompleted).toBe(3);
    expect((await second.load()).technicalInteractionsCompleted).toBe(0);
  });
});
