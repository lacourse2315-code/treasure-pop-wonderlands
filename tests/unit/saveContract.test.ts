import { describe, expect, it } from 'vitest';
import {
  createSaveEnvelope,
  validateSaveEnvelope,
  type SaveEnvelopeV1,
} from '../../src/domain/save/saveContract';
import type { ChildProfile, ProfileId } from '../../src/domain/profiles/profile';

const profile: ChildProfile = {
  profileId: 'profile_local_1' as ProfileId,
  displayName: 'Player',
  createdAtIso: '2026-09-06T00:00:00.000Z',
  lastUsedAtIso: '2026-09-06T00:00:00.000Z',
  saveSchemaVersion: 1,
};

const validSave: SaveEnvelopeV1 = createSaveEnvelope(profile, {}, 0, '2026-09-06T00:00:00.000Z');

describe('save contract', () => {
  it('accepts a valid V1 save envelope', () => {
    expect(validateSaveEnvelope(validSave)).toEqual({ valid: true, errors: [] });
  });

  it('rejects invalid play time and missing checksum', () => {
    const result = validateSaveEnvelope({ ...validSave, playTimeSeconds: -1, checksum: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});
