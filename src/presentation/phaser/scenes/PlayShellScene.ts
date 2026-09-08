import Phaser from 'phaser';
import { getRuntime } from '../../../application/runtime/runtimeBridge';
import {
  createInteractionTargetId,
  isInteractionInRange,
} from '../../../domain/gameplay/interaction';
import { moveWithinBounds, type Point } from '../../../domain/gameplay/playerMovement';

const WORLD_WIDTH = 1800;
const WORLD_HEIGHT = 1000;
const PLAYER_SPEED = 280;
const PLAYER_RADIUS = 24;
const TARGET = {
  interactionTargetId: createInteractionTargetId('technical-beacon-01'),
  position: { x: 430, y: 360 },
  range: 105,
};
const OBSTACLE = new Phaser.Geom.Rectangle(700, 260, 220, 260);

export class PlayShellScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Arc;
  private beacon!: Phaser.GameObjects.Rectangle;
  private position: Point = { x: 260, y: 360 };
  private paused = true;

  public constructor() {
    super({ key: 'PlayShellScene' });
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#182335');
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x182335);
    this.add.rectangle(
      OBSTACLE.centerX,
      OBSTACLE.centerY,
      OBSTACLE.width,
      OBSTACLE.height,
      0x5f6875,
    );
    this.beacon = this.add.rectangle(TARGET.position.x, TARGET.position.y, 64, 64, 0xf4c95d);
    this.player = this.add.circle(this.position.x, this.position.y, PLAYER_RADIUS, 0x62d4ff);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    document.documentElement.dataset.playShell = 'ready';
    document.documentElement.dataset.playerX = String(this.position.x);
    document.documentElement.dataset.playerY = String(this.position.y);
    window.addEventListener('blur', this.onUnsafeVisibility);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('blur', this.onUnsafeVisibility);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    });
  }

  public override update(_time: number, delta: number): void {
    const runtime = getRuntime();
    const session = runtime.getSession();
    if (!session) {
      this.setPaused(true);
      return;
    }
    if (runtime.input.consumePause()) {
      this.setPaused(!this.paused);
      window.dispatchEvent(new CustomEvent('wonderlands:pause-changed', { detail: this.paused }));
    }
    if (this.paused) return;

    const intent = runtime.input.movement();
    const next = moveWithinBounds(this.position, intent, PLAYER_SPEED, delta / 1000, {
      minX: PLAYER_RADIUS,
      minY: PLAYER_RADIUS,
      maxX: WORLD_WIDTH - PLAYER_RADIUS,
      maxY: WORLD_HEIGHT - PLAYER_RADIUS,
    });
    if (!this.collides(next)) this.position = next;
    this.player.setPosition(this.position.x, this.position.y);
    document.documentElement.dataset.playerX = this.position.x.toFixed(1);
    document.documentElement.dataset.playerY = this.position.y.toFixed(1);

    const inRange = isInteractionInRange(this.position, TARGET);
    document.documentElement.dataset.interactionRange = inRange ? 'in-range' : 'out-of-range';
    this.beacon.setStrokeStyle(inRange ? 6 : 2, inRange ? 0xffffff : 0x87909d);
    if (runtime.input.consumePrimaryAction() && inRange) {
      void session.completeInteraction(TARGET.interactionTargetId).then((progress) => {
        document.documentElement.dataset.interactionState = 'triggered';
        document.documentElement.dataset.technicalInteractions = String(
          progress.technicalInteractionsCompleted,
        );
        window.dispatchEvent(new CustomEvent('wonderlands:progress-changed'));
      });
    }
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    getRuntime().input.reset();
    document.documentElement.dataset.gamePaused = String(paused);
  }

  public resumePlay(): void {
    this.setPaused(false);
  }

  private collides(point: Point): boolean {
    return Phaser.Geom.Rectangle.Contains(
      new Phaser.Geom.Rectangle(
        OBSTACLE.x - PLAYER_RADIUS,
        OBSTACLE.y - PLAYER_RADIUS,
        OBSTACLE.width + PLAYER_RADIUS * 2,
        OBSTACLE.height + PLAYER_RADIUS * 2,
      ),
      point.x,
      point.y,
    );
  }

  private readonly onUnsafeVisibility = (): void => this.pauseForSafety();
  private readonly onVisibilityChange = (): void => {
    if (document.hidden) this.pauseForSafety();
  };

  private pauseForSafety(): void {
    if (!getRuntime().getSession()) return;
    this.setPaused(true);
    window.dispatchEvent(new CustomEvent('wonderlands:pause-changed', { detail: true }));
  }
}
