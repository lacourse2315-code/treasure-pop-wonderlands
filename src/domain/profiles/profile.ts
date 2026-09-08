export type ProfileId = string & { readonly __profileId: unique symbol };

export interface ChildProfile {
  readonly profileId: ProfileId;
  readonly displayName: string;
  readonly createdAtIso: string;
  readonly lastUsedAtIso: string;
  readonly saveSchemaVersion: number;
}

export const MAX_LOCAL_PROFILES = 6;
export const MAX_PROFILE_NAME_LENGTH = 24;

export function validateProfileName(name: string): string | null {
  const normalized = name.trim();
  if (normalized.length === 0) return 'Profile name is required.';
  if (normalized.length > MAX_PROFILE_NAME_LENGTH)
    return `Profile name must be ${String(MAX_PROFILE_NAME_LENGTH)} characters or fewer.`;
  return null;
}

export function normalizeProfileName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function createProfileId(): ProfileId {
  return `profile_${crypto.randomUUID()}` as ProfileId;
}
