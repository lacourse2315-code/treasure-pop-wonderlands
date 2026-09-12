import { createSaveEnvelope } from '../../domain/save/saveContract';
import type { ChildProfile } from '../../domain/profiles/profile';
import type { SaveService } from '../save/saveService';

export interface AvatarSelection {
  readonly skin: number;
  readonly hair: number;
  readonly outfit: number;
  readonly accessory: number;
}

export interface TechnicalProgress {
  readonly technicalInteractionsCompleted: number;
  readonly activatedTargetIds: readonly string[];
  readonly avatar: AvatarSelection;
  readonly storyStep: number;
  readonly currentZoneId: string;
  readonly companionIds: readonly string[];
  readonly rewardIds: readonly string[];
  readonly firstFragmentRecovered: boolean;
  readonly wonderWorldRestored: boolean;
}

const DEFAULT_AVATAR: AvatarSelection = { skin: 1, hair: 1, outfit: 1, accessory: 0 };
const EMPTY_PROGRESS: TechnicalProgress = {
  technicalInteractionsCompleted: 0,
  activatedTargetIds: [],
  avatar: DEFAULT_AVATAR,
  storyStep: 0,
  currentZoneId: 'prologue',
  companionIds: [],
  rewardIds: [],
  firstFragmentRecovered: false,
  wonderWorldRestored: false,
};

export class PlaySession {
  private progress: TechnicalProgress = EMPTY_PROGRESS;

  public constructor(
    public readonly profile: ChildProfile,
    private readonly saves: SaveService,
  ) {}

  public async load(): Promise<TechnicalProgress> {
    const loaded = await this.saves.load(this.profile.profileId);
    const payload = loaded.save?.payload;
    this.progress = {
      technicalInteractionsCompleted: numberOrZero(payload?.technicalInteractionsCompleted),
      activatedTargetIds: stringArray(payload?.activatedTargetIds),
      avatar: avatarOrDefault(payload?.avatar),
      storyStep: numberOrZero(payload?.storyStep),
      currentZoneId: stringOr(payload?.currentZoneId, 'prologue'),
      companionIds: stringArray(payload?.companionIds),
      rewardIds: stringArray(payload?.rewardIds),
      firstFragmentRecovered: payload?.firstFragmentRecovered === true,
      wonderWorldRestored: payload?.wonderWorldRestored === true,
    };
    return this.progress;
  }

  public getProgress(): TechnicalProgress {
    return this.progress;
  }

  public async completeInteraction(targetId: string): Promise<TechnicalProgress> {
    if (this.progress.activatedTargetIds.includes(targetId)) return this.progress;
    return this.commit({
      ...this.progress,
      technicalInteractionsCompleted: this.progress.technicalInteractionsCompleted + 1,
      activatedTargetIds: [...this.progress.activatedTargetIds, targetId],
    });
  }

  public setAvatar(avatar: AvatarSelection): Promise<TechnicalProgress> {
    return this.commit({ ...this.progress, avatar });
  }

  public setStoryLocation(storyStep: number, currentZoneId: string): Promise<TechnicalProgress> {
    return this.commit({ ...this.progress, storyStep, currentZoneId });
  }

  public award(rewardId: string): Promise<TechnicalProgress> {
    if (this.progress.rewardIds.includes(rewardId)) return Promise.resolve(this.progress);
    return this.commit({ ...this.progress, rewardIds: [...this.progress.rewardIds, rewardId] });
  }

  public addCompanion(companionId: string): Promise<TechnicalProgress> {
    if (this.progress.companionIds.includes(companionId)) return Promise.resolve(this.progress);
    return this.commit({ ...this.progress, companionIds: [...this.progress.companionIds, companionId] });
  }

  public recoverFirstFragment(): Promise<TechnicalProgress> {
    return this.commit({ ...this.progress, firstFragmentRecovered: true });
  }

  public restoreWonderWorld(): Promise<TechnicalProgress> {
    return this.commit({ ...this.progress, wonderWorldRestored: true, currentZoneId: 'wonder-world-restored' });
  }

  public autosave(): Promise<void> {
    return this.saves.save(
      this.profile.profileId,
      createSaveEnvelope(this.profile, { ...this.progress }),
    );
  }

  private async commit(next: TechnicalProgress): Promise<TechnicalProgress> {
    const previous = this.progress;
    this.progress = next;
    try {
      await this.autosave();
      return this.progress;
    } catch (error) {
      this.progress = previous;
      throw error;
    }
  }
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function stringArray(value: unknown): readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function avatarOrDefault(value: unknown): AvatarSelection {
  if (!value || typeof value !== 'object') return DEFAULT_AVATAR;
  const candidate = value as Partial<AvatarSelection>;
  return {
    skin: boundedInt(candidate.skin, 1, 4, DEFAULT_AVATAR.skin),
    hair: boundedInt(candidate.hair, 1, 4, DEFAULT_AVATAR.hair),
    outfit: boundedInt(candidate.outfit, 1, 4, DEFAULT_AVATAR.outfit),
    accessory: boundedInt(candidate.accessory, 0, 4, DEFAULT_AVATAR.accessory),
  };
}

function boundedInt(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
    ? value
    : fallback;
}
