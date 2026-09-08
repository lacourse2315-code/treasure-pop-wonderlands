import { describe, expect, it } from 'vitest';
import { MAX_LOCAL_PROFILES, MAX_PROFILE_NAME_LENGTH } from '../../src/domain/profiles/profile';
import { ProfileRegistry } from '../../src/domain/profiles/profileRegistry';

describe('profile registry', () => {
  it('creates unique profiles and selects the first profile', () => { const registry = new ProfileRegistry(); const a = registry.create('Alex'); const b = registry.create('Sam'); expect(a.profileId).not.toBe(b.profileId); expect(registry.getActive()?.profileId).toBe(a.profileId); });
  it('validates names', () => { const registry = new ProfileRegistry(); expect(() => registry.create('   ')).toThrow(); expect(() => registry.create('x'.repeat(MAX_PROFILE_NAME_LENGTH + 1))).toThrow(); });
  it('renames and selects profiles', () => { const registry = new ProfileRegistry(); const a = registry.create('Alex'); const b = registry.create('Sam'); expect(registry.rename(a.profileId, '  Alex Jr  ').displayName).toBe('Alex Jr'); expect(registry.select(b.profileId).profileId).toBe(b.profileId); });
  it('enforces the local profile limit', () => { const registry = new ProfileRegistry(); for (let index = 0; index < MAX_LOCAL_PROFILES; index += 1) registry.create(`P${index}`); expect(() => registry.create('extra')).toThrow(); });
  it('removes profiles deterministically', () => { const registry = new ProfileRegistry(); const a = registry.create('A'); registry.create('B'); registry.remove(a.profileId); expect(registry.list().some((profile) => profile.profileId === a.profileId)).toBe(false); expect(registry.getActive()?.displayName).toBe('B'); });
});
