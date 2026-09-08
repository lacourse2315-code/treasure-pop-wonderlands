import type { ChildProfile, ProfileId } from '../profiles/profile';

export const CURRENT_SAVE_SCHEMA_VERSION = 1 as const;

export type SaveSlot = 'current' | 'previous' | 'lastKnownGood';

export interface SaveEnvelopeV1 {
  readonly schemaVersion: typeof CURRENT_SAVE_SCHEMA_VERSION;
  readonly contentVersion: string;
  readonly profile: ChildProfile;
  readonly playTimeSeconds: number;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly writtenAtIso: string;
  readonly checksum: string;
}

export interface SaveValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export interface SaveStorePort {
  read(profileId: ProfileId, slot: SaveSlot): Promise<SaveEnvelopeV1 | null>;
  write(profileId: ProfileId, slot: SaveSlot, save: SaveEnvelopeV1): Promise<void>;
}

export interface ParentSaveTransferPort {
  exportProfile(profileId: ProfileId): Promise<Blob>;
  importProfile(file: Blob): Promise<ProfileId>;
}

export function validateSaveEnvelope(value: SaveEnvelopeV1): SaveValidationResult {
  const errors: string[] = [];

  if (value.schemaVersion !== CURRENT_SAVE_SCHEMA_VERSION) {
    errors.push(`Unsupported save schema version: ${String(value.schemaVersion)}`);
  }
  if (value.profile.displayName.trim().length === 0) {
    errors.push('Profile display name must not be empty.');
  }
  if (!Number.isFinite(value.playTimeSeconds) || value.playTimeSeconds < 0) {
    errors.push('Play time must be a finite non-negative number.');
  }
  if (value.checksum.trim().length === 0) {
    errors.push('Checksum is required.');
  }

  return { valid: errors.length === 0, errors };
}
