export type ProfileId = string & { readonly __profileId: unique symbol };

export interface ChildProfile {
  readonly profileId: ProfileId;
  readonly displayName: string;
  readonly createdAtIso: string;
}
