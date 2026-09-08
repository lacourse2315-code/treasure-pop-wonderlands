import type { ContentReference } from '../../domain/content/contracts';

export interface ContentManifest {
  readonly schemaVersion: 1;
  readonly contentVersion: string;
  readonly references: readonly ContentReference[];
}
