import Phaser from 'phaser';
import { getRuntime } from '../../../application/runtime/runtimeBridge';
import {
  createInteractionTargetId,
  isInteractionInRange,
  type InteractionTargetId,
} from '../../../domain/gameplay/interaction';
import { moveWithinBounds, type Point } from '../../../domain/gameplay/playerMovement';
import { WORLD_DEPTH, ySortDepth } from '../../../domain/gameplay/worldDepth';

const WORLD_WIDTH = 1800;
const WORLD_HEIGHT = 1000;
const PLAYER_SPEED = 280;
const AUTO_MOVE_SPEED = 520;
const PLAYER_RADIUS = 24;
const AUTO_MOVE_RANGE_MARGIN = 12;
const TARGET = {
  interactionTargetId: createInteractionTargetId('technical-beacon-01'),
  position: { x: 430, y: 360 },
  range: 105,
};
const OBSTACLE = new Phaser.Geom.Rectangle(700, 260, 220, 260);

export class PlayShellScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private beacon!: Phaser.GameObjects.Container;
  private beaconHalo!: Phaser.GameObjects.Ellipse;
  private beaconPrompt!: Phaser.GameObjects.Text;
  private position: Point = { x: 260, y: 360 };
  private paused = true;
  private ambient: Phaser.GameObjects.Arc[] = [];
  private pendingInteractionTargetId: InteractionTargetId | null = null;
  private autoMoveDestination: Point | null = null;
  private interactionResolutionInFlight = false;
  private interactionResolutionCount = 0;

  public constructor() {
    super({ key: 'PlayShellScene' });
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#8ed8e8');
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.createWonderWorld();
    this.createBeacon();
    this.createPlayer();
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    document.documentElement.dataset.playShell = 'ready';
    document.documentElement.dataset.wonderWorld = 'visual-prototype-ready';
    document.documentElement.dataset.clickTapFirst = 'ready';
    document.documentElement.dataset.playerX = String(this.position.x);
    document.documentElement.dataset.playerY = String(this.position.y);
    document.documentElement.dataset.autoMove = 'idle';
    document.documentElement.dataset.interactionState = 'idle';
    document.documentElement.dataset.interactionResolutions = '0';
    window.addEventListener('blur', this.onUnsafeVisibility);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('blur', this.onUnsafeVisibility);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    });
  }

  public override update(time: number, delta: number): void {
    const runtime = getRuntime();
    const session = runtime.getSession();
    this.animateAmbient(time);
    if (!session) {
      this.setPaused(true);
      return;
    }
    if (runtime.input.consumePause()) this.togglePause();
    if (this.paused) return;

    if (this.autoMoveDestination) this.advanceAutoMove(delta);
    else this.advanceOptionalKeyboardMovement(delta);

    const inRange = isInteractionInRange(this.position, TARGET);
    document.documentElement.dataset.interactionRange = inRange ? 'in-range' : 'out-of-range';
    this.beaconHalo.setAlpha(inRange ? 0.6 : 0.28).setScale(1 + Math.sin(time / 180) * 0.08);
    this.beacon.setScale(1 + Math.sin(time / 220) * (inRange ? 0.035 : 0.018));
    this.beaconPrompt.setAlpha(0.72 + (Math.sin(time / 420) + 1) * 0.12);

    if (this.pendingInteractionTargetId && inRange && !this.interactionResolutionInFlight) {
      this.autoMoveDestination = null;
      document.documentElement.dataset.autoMove = 'idle';
      this.resolvePendingInteraction();
      return;
    }

    if (
      runtime.input.consumePrimaryAction() &&
      inRange &&
      !this.pendingInteractionTargetId &&
      !this.interactionResolutionInFlight
    ) {
      this.pendingInteractionTargetId = TARGET.interactionTargetId;
      this.resolvePendingInteraction();
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

  public togglePause(): void {
    this.setPaused(!this.paused);
    window.dispatchEvent(new CustomEvent('wonderlands:pause-changed', { detail: this.paused }));
  }

  private requestTargetInteraction(): void {
    if (this.paused || !getRuntime().getSession() || this.interactionResolutionInFlight) {
      return;
    }
    document.documentElement.dataset.lastInputMode = 'click-tap';
    this.pendingInteractionTargetId = TARGET.interactionTargetId;
    document.documentElement.dataset.pendingInteractionTarget =
      TARGET.interactionTargetId;

    if (isInteractionInRange(this.position, TARGET)) {
      this.resolvePendingInteraction();
      return;
    }

    this.autoMoveDestination = this.createApproachPoint(TARGET.position, TARGET.range);
    document.documentElement.dataset.autoMove = 'active';
    document.documentElement.dataset.interactionState = 'pending';
  }

  private resolvePendingInteraction(): void {
    const session = getRuntime().getSession();
    const targetId = this.pendingInteractionTargetId;
    if (!session || !targetId || this.interactionResolutionInFlight) {
      return;
    }
    if (
      targetId !== TARGET.interactionTargetId ||
      !isInteractionInRange(this.position, TARGET)
    ) {
      return;
    }

    const alreadyCompleted = session.getProgress().activatedTargetIds.includes(targetId);
    this.pendingInteractionTargetId = null;
    this.autoMoveDestination = null;
    this.interactionResolutionInFlight = true;
    document.documentElement.dataset.autoMove = 'idle';
    document.documentElement.dataset.interactionState = 'resolving';
    document.documentElement.dataset.pendingInteractionTarget = '';
    this.beaconPrompt.setText('DISCOVERING…');

    void session
      .completeInteraction(targetId)
      .then((progress) => {
        this.interactionResolutionCount += 1;
        document.documentElement.dataset.interactionState = 'triggered';
        document.documentElement.dataset.interactionResolutions = String(
          this.interactionResolutionCount,
        );
        document.documentElement.dataset.technicalInteractions = String(
          progress.technicalInteractionsCompleted,
        );
        this.beaconPrompt.setText(alreadyCompleted ? 'DISCOVERED' : 'DISCOVERED!');
        window.dispatchEvent(new CustomEvent('wonderlands:progress-changed'));
        window.dispatchEvent(
          new CustomEvent('wonderlands:interaction-resolved', {
            detail: {
              targetId,
              alreadyCompleted,
              technicalInteractionsCompleted: progress.technicalInteractionsCompleted,
            },
          }),
        );
      })
      .catch(() => {
        document.documentElement.dataset.interactionState = 'save-error';
        this.beaconPrompt.setText('TRY AGAIN');
        window.dispatchEvent(new CustomEvent('wonderlands:interaction-save-error'));
      })
      .finally(() => {
        this.interactionResolutionInFlight = false;
      });
  }

  private createApproachPoint(target: Point, range: number): Point {
    const dx = this.position.x - target.x;
    const dy = this.position.y - target.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= range || distance === 0) return { ...this.position };
    const desiredDistance = Math.max(0, range - AUTO_MOVE_RANGE_MARGIN);
    return {
      x: target.x + (dx / distance) * desiredDistance,
      y: target.y + (dy / distance) * desiredDistance,
    };
  }

  private advanceAutoMove(delta: number): void {
    const destination = this.autoMoveDestination;
    if (!destination) return;
    const dx = destination.x - this.position.x;
    const dy = destination.y - this.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 1) {
      this.position = { ...destination };
      this.autoMoveDestination = null;
      this.syncPlayerPosition();
      return;
    }

    const stepDistance = Math.min(
      AUTO_MOVE_SPEED * (delta / 1000),
      distance,
    );
    const intent = { x: dx / distance, y: dy / distance };
    const next = moveWithinBounds(this.position, intent, stepDistance, 1, {
      minX: PLAYER_RADIUS,
      minY: PLAYER_RADIUS,
      maxX: WORLD_WIDTH - PLAYER_RADIUS,
      maxY: WORLD_HEIGHT - PLAYER_RADIUS,
    });

    if (!this.collides(next)) {
      this.position = next;
      if (stepDistance === distance) this.autoMoveDestination = null;
    } else {
      this.autoMoveDestination = null;
      document.documentElement.dataset.autoMove = 'blocked';
      document.documentElement.dataset.interactionState = 'movement-blocked';
    }
    this.syncPlayerPosition();
  }

  private advanceOptionalKeyboardMovement(delta: number): void {
    const intent = getRuntime().input.movement();
    const next = moveWithinBounds(this.position, intent, PLAYER_SPEED, delta / 1000, {
      minX: PLAYER_RADIUS,
      minY: PLAYER_RADIUS,
      maxX: WORLD_WIDTH - PLAYER_RADIUS,
      maxY: WORLD_HEIGHT - PLAYER_RADIUS,
    });
    if (!this.collides(next)) this.position = next;
    this.syncPlayerPosition();
  }

  private syncPlayerPosition(): void {
    this.player.setPosition(this.position.x, this.position.y).setDepth(ySortDepth(this.position.y));
    this.playerShadow
      .setPosition(this.position.x, this.position.y + 22)
      .setDepth(ySortDepth(this.position.y) - 1);
    document.documentElement.dataset.playerX = this.position.x.toFixed(1);
    document.documentElement.dataset.playerY = this.position.y.toFixed(1);
  }

  private createWonderWorld(): void {
    this.add
      .rectangle(900, 500, WORLD_WIDTH, WORLD_HEIGHT, 0x9bdff0)
      .setDepth(WORLD_DEPTH.background);
    this.add.ellipse(900, 225, 1680, 430, 0xbfe9a1).setDepth(WORLD_DEPTH.distant);
    this.add.ellipse(900, 575, 1660, 760, 0x78c97a).setDepth(WORLD_DEPTH.ground);
    this.add.ellipse(880, 590, 1220, 530, 0x8edb7e).setDepth(WORLD_DEPTH.ground + 1);
    this.add.ellipse(930, 570, 980, 210, 0xe8d79a).setDepth(WORLD_DEPTH.groundDetail);
    this.add.ellipse(930, 570, 830, 135, 0xf3e5ad).setDepth(WORLD_DEPTH.groundDetail + 1);
    this.add.ellipse(1420, 650, 410, 235, 0x58bad4).setDepth(WORLD_DEPTH.groundDetail + 2);
    this.add.ellipse(1420, 640, 345, 165, 0x80d8e7).setDepth(WORLD_DEPTH.groundDetail + 3);
    this.add
      .ellipse(1420, 630, 240, 80, 0xb7f0ef)
      .setAlpha(0.5)
      .setDepth(WORLD_DEPTH.groundDetail + 4);

    this.createRuin(OBSTACLE.centerX, OBSTACLE.centerY + 80);
    const trees: [number, number, number][] = [
      [170, 260, 1.05],
      [1080, 260, 0.92],
      [1230, 410, 1.08],
      [1560, 410, 0.9],
      [260, 700, 1.12],
      [560, 760, 0.86],
      [1160, 790, 1.08],
      [1600, 760, 1.15],
    ];
    trees.forEach(([x, y, scale]) => this.createTree(x, y, scale));
    const rocks: [number, number, number][] = [
      [340, 245, 0.8],
      [1040, 530, 0.7],
      [1310, 300, 0.85],
      [1510, 820, 1],
    ];
    rocks.forEach(([x, y, scale]) => this.createRock(x, y, scale));

    for (let index = 0; index < 14; index += 1) {
      const x = 220 + ((index * 137) % 1320);
      const y = 190 + ((index * 83) % 650);
      const mote = this.add.circle(x, y, 3 + (index % 3), 0xfff3a6, 0.75);
      mote.setDepth(WORLD_DEPTH.effects);
      this.ambient.push(mote);
    }
    this.add
      .text(900, 82, 'WONDER WORLD', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#4d6f72',
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setDepth(WORLD_DEPTH.effects);
  }

  private createTree(x: number, y: number, scale: number): void {
    this.add.ellipse(x, y + 10, 92 * scale, 28 * scale, 0x2f654d, 0.28).setDepth(ySortDepth(y) - 2);
    const tree = this.add.container(x, y).setDepth(ySortDepth(y));
    tree.add(this.add.rectangle(0, -48 * scale, 22 * scale, 95 * scale, 0x8d6546));
    tree.add(this.add.circle(-22 * scale, -105 * scale, 46 * scale, 0x4fae65));
    tree.add(this.add.circle(22 * scale, -112 * scale, 52 * scale, 0x5fc875));
    tree.add(this.add.circle(0, -145 * scale, 48 * scale, 0x78d982));
    tree.add(this.add.circle(-8 * scale, -128 * scale, 18 * scale, 0xb7ed91, 0.7));
  }

  private createRock(x: number, y: number, scale: number): void {
    this.add.ellipse(x, y + 7, 74 * scale, 22 * scale, 0x315e55, 0.24).setDepth(ySortDepth(y) - 2);
    this.add.ellipse(x, y - 13, 70 * scale, 48 * scale, 0x839c91).setDepth(ySortDepth(y));
    this.add.ellipse(x - 10, y - 24, 35 * scale, 17 * scale, 0xb6c9ae).setDepth(ySortDepth(y) + 1);
  }

  private createRuin(x: number, y: number): void {
    const depth = ySortDepth(y);
    this.add.ellipse(x, y + 18, 270, 58, 0x315e55, 0.3).setDepth(depth - 2);
    const ruin = this.add.container(x, y).setDepth(depth);
    ruin.add(this.add.rectangle(-78, -92, 54, 180, 0xb7aa8c));
    ruin.add(this.add.rectangle(78, -92, 54, 180, 0xb7aa8c));
    ruin.add(this.add.rectangle(0, -170, 210, 42, 0xc9bea1));
    ruin.add(this.add.rectangle(58, -206, 70, 35, 0x8f927f));
    ruin.add(this.add.circle(-78, -190, 16, 0x79d8b4, 0.8));
    ruin.add(this.add.circle(78, -190, 11, 0x79d8b4, 0.55));
  }

  private createPlayer(): void {
    this.playerShadow = this.add.ellipse(
      this.position.x,
      this.position.y + 22,
      58,
      20,
      0x315e55,
      0.35,
    );
    this.playerShadow.setDepth(ySortDepth(this.position.y) - 1);
    this.player = this.add
      .container(this.position.x, this.position.y)
      .setDepth(ySortDepth(this.position.y));
    this.player.add(this.add.circle(0, -28, 19, 0xf6c7a8));
    this.player.add(this.add.ellipse(0, 3, 42, 55, 0x6957c8));
    this.player.add(this.add.ellipse(0, 8, 28, 40, 0x8b79e5));
    this.player.add(this.add.circle(-7, -31, 2.5, 0x263b4d));
    this.player.add(this.add.circle(7, -31, 2.5, 0x263b4d));
    this.player.add(this.add.triangle(0, -48, -19, 8, 19, 8, 0, -22, 0x4f3b72));
  }

  private createBeacon(): void {
    const depth = ySortDepth(TARGET.position.y);
    this.beaconHalo = this.add.ellipse(
      TARGET.position.x,
      TARGET.position.y,
      132,
      82,
      0xfff0a0,
      0.28,
    );
    this.beaconHalo.setDepth(depth - 1);
    this.beacon = this.add.container(TARGET.position.x, TARGET.position.y).setDepth(depth);
    this.beacon.add(this.add.ellipse(0, 16, 70, 22, 0x315e55, 0.28));
    this.beacon.add(this.add.circle(0, -10, 27, 0xf4c95d));
    this.beacon.add(this.add.circle(-7, -18, 9, 0xfff3ad));
    this.beacon.add(this.add.star(0, -10, 4, 8, 18, 0xffffff, 0.75));
    this.beacon.setSize(120, 120).setInteractive({ useHandCursor: true });
    this.beacon.on('pointerdown', () => this.requestTargetInteraction());
    this.beaconPrompt = this.add
      .text(TARGET.position.x, TARGET.position.y - 78, 'CLICK / TAP', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#fffbe5',
        stroke: '#725a17',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true });
    this.beaconPrompt.on('pointerdown', () => this.requestTargetInteraction());
  }

  private animateAmbient(time: number): void {
    this.ambient.forEach((mote, index) => {
      mote.y += Math.sin(time / 700 + index) * 0.08;
      mote.setAlpha(0.45 + (Math.sin(time / 500 + index * 0.7) + 1) * 0.2);
    });
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
