import { describe, expect, it } from 'vitest';
import {
  isValidContentId,
  validateContentReferences,
  type ContentKind,
  type ContentRegistryView,
} from '../../src/domain/content/contracts';

class Registry implements ContentRegistryView {
  public constructor(private readonly values: ReadonlySet<string>) {}

  public has(kind: ContentKind, id: string): boolean {
    return this.values.has(`${kind}:${id}`);
  }
}

describe('content contracts', () => {
  it('accepts canonical ids and rejects unstable ids', () => {
    expect(isValidContentId('realm_01')).toBe(true);
    expect(isValidContentId('Realm 01')).toBe(false);
  });

  it('reports a missing cross-content reference before runtime', () => {
    const issues = validateContentReferences(
      [
        {
          fromKind: 'quest',
          fromId: 'quest_find_star',
          field: 'rewardId',
          toKind: 'reward',
          toId: 'reward_star_hat',
        },
      ],
      new Registry(new Set()),
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('MISSING_REFERENCE');
  });
});
