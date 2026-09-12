import { createSaveEnvelope } from '../../domain/save/saveContract';
import type { ChildProfile } from '../../domain/profiles/profile';
import type { SaveService } from '../save/saveService';

export interface TechnicalProgress {
  readonly technicalInteractionsCompleted: number;
  readonly activatedTargetIds: readonly string[];
}

const EMPTY_PROGRESS: TechnicalProgress = {
  technicalInteractionsCompleted: 0,
  activatedTargetIds: [],
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
    };
    return this.progress;
  }

  public getProgress(): TechnicalProgress {
    return this.progress;
  }

  public async completeInteraction(targetId: string): Promise<TechnicalProgress> {
    if (this.progress.activatedTargetIds.includes(targetId)) return this.progress;
    const previous = this.progress;
    this.progress = {
      technicalInteractionsCompleted: this.progress.technicalInteractionsCompleted + 1,
      activatedTargetIds: [...this.progress.activatedTargetIds, targetId],
    };
    try {
      await this.autosave();
      return this.progress;
    } catch (error) {
      this.progress = previous;
      throw error;
    }
  }

  public autosave(): Promise<void> {
    return this.saves.save(
      this.profile.profileId,
      createSaveEnvelope(this.profile, { ...this.progress }),
    );
  }
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function stringArray(value: unknown): readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
}
