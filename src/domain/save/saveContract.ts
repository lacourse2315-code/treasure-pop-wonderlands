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
  deleteProfile(profileId: ProfileId): Promise<void>;
}
export interface ParentSaveTransferPort {
  exportProfile(profileId: ProfileId): Promise<Blob>;
  importProfile(file: Blob): Promise<ProfileId>;
}

export function computeSaveChecksum(value: Omit<SaveEnvelopeV1, 'checksum'>): string {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function validateSaveEnvelope(
  value: unknown,
  expectedProfileId?: ProfileId,
): SaveValidationResult {
  const errors: string[] = [];
  if (!value || typeof value !== 'object')
    return { valid: false, errors: ['Save envelope must be an object.'] };
  const candidate = value as Partial<SaveEnvelopeV1> & { schemaVersion?: unknown };
  if (candidate.schemaVersion !== CURRENT_SAVE_SCHEMA_VERSION)
    errors.push(`Unsupported save schema version: ${String(candidate.schemaVersion)}`);
  if (
    !candidate.profile ||
    typeof candidate.profile !== 'object' ||
    typeof candidate.profile.profileId !== 'string' ||
    typeof candidate.profile.displayName !== 'string' ||
    candidate.profile.displayName.trim().length === 0
  )
    errors.push('Profile is invalid.');
  if (expectedProfileId && candidate.profile?.profileId !== expectedProfileId)
    errors.push('Save belongs to a different profile.');
  if (!Number.isFinite(candidate.playTimeSeconds) || (candidate.playTimeSeconds ?? -1) < 0)
    errors.push('Play time must be a finite non-negative number.');
  if (
    !candidate.payload ||
    typeof candidate.payload !== 'object' ||
    Array.isArray(candidate.payload)
  )
    errors.push('Payload must be an object.');
  if (
    typeof candidate.writtenAtIso !== 'string' ||
    Number.isNaN(Date.parse(candidate.writtenAtIso))
  )
    errors.push('Written timestamp is invalid.');
  if (typeof candidate.contentVersion !== 'string' || candidate.contentVersion.trim().length === 0)
    errors.push('Content version is required.');
  if (typeof candidate.checksum !== 'string' || candidate.checksum.trim().length === 0)
    errors.push('Checksum is required.');
  if (errors.length === 0) {
    const { checksum, ...withoutChecksum } = candidate as SaveEnvelopeV1;
    if (computeSaveChecksum(withoutChecksum) !== checksum) errors.push('Checksum mismatch.');
  }
  return { valid: errors.length === 0, errors };
}

export function createSaveEnvelope(
  profile: ChildProfile,
  payload: Readonly<Record<string, unknown>>,
  playTimeSeconds = 0,
  writtenAtIso = new Date().toISOString(),
): SaveEnvelopeV1 {
  const withoutChecksum = {
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    contentVersion: '0.0.0-prd03',
    profile,
    playTimeSeconds,
    payload,
    writtenAtIso,
  } as const;
  return { ...withoutChecksum, checksum: computeSaveChecksum(withoutChecksum) };
}
