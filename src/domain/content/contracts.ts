export type ContentId = string & { readonly __contentId: unique symbol };

export type ContentKind =
  'realm' | 'zone' | 'quest' | 'npc' | 'reward' | 'companion' | 'item' | 'asset' | 'localization';

export interface ContentReference {
  readonly fromKind: ContentKind;
  readonly fromId: string;
  readonly field: string;
  readonly toKind: ContentKind;
  readonly toId: string;
}

export interface ContentRegistryView {
  has(kind: ContentKind, id: string): boolean;
}

export interface ContentValidationIssue {
  readonly code: 'INVALID_ID' | 'MISSING_REFERENCE';
  readonly message: string;
  readonly reference?: ContentReference;
}

export function isValidContentId(value: string): boolean {
  return /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(value);
}

export function validateContentReferences(
  references: readonly ContentReference[],
  registry: ContentRegistryView,
): readonly ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];

  for (const reference of references) {
    if (!isValidContentId(reference.fromId) || !isValidContentId(reference.toId)) {
      issues.push({
        code: 'INVALID_ID',
        message: `Invalid content id in ${reference.fromKind}:${reference.fromId}.${reference.field}`,
        reference,
      });
      continue;
    }

    if (!registry.has(reference.toKind, reference.toId)) {
      issues.push({
        code: 'MISSING_REFERENCE',
        message: `${reference.fromKind}:${reference.fromId}.${reference.field} references missing ${reference.toKind}:${reference.toId}`,
        reference,
      });
    }
  }

  return issues;
}
