import { describe, expect, it } from 'vitest';
import {
  CURRENT_SAVE_SCHEMA_VERSION,
  validateSaveEnvelope,
  type SaveEnvelopeV1,
} from '../../src/domain/save/saveContract';
import type { ProfileId } from '../../src/domain/profiles/profile';

const validSave: SaveEnvelopeV1 = {
  schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
  contentVersion: '0.0.0-prd02',
  profile: {
    profileId: 'profile_local_1' as ProfileId,
    displayName: 'Player',
    createdAtIso: '2026-09-06T00:00:00.000Z',
  },
  playTimeSeconds: 0,
  payload: {},
  writtenAtIso: '2026-09-06T00:00:00.000Z',
  checksum: 'foundation-test-checksum',
};

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
