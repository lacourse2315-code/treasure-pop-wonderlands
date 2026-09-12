import Phaser from 'phaser';
import { getRuntime } from '../../../application/runtime/runtimeBridge';
import { FOREST_POP_ZONES, type ForestActivity, type ForestZone } from '../../../data/wonderlands/forestPop';
import { WORLD_DEPTH } from '../../../domain/gameplay/worldDepth';

const WORLD_WIDTH = 1800;
const WORLD_HEIGHT = 1000;
const PROLOGUE_STEPS = [
  'Quelque chose ne va pas… ton Wonder World a perdu une partie de sa lumière.',
  'Pip surgit d’une étincelle : « Ouf ! Enfin quelqu’un qui peut me voir. Je suis Pip. Enfin… je crois. »',
  'Le Cœur de Wonderlands est brisé. Ses fragments ont été projetés dans les royaumes.',
  'La carte magique frémit. Un signal vert et doré vient de Forêt Pop.',
] as const;

export class PlayShellScene extends Phaser.Scene {
  private paused = true;
  private sceneRoot!: Phaser.GameObjects.Container;
  private title!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private pipText!: Phaser.GameObjects.Text;
  private actionLayer!: Phaser.GameObjects.Container;
  private currentZoneIndex = -1;
  private prologueIndex = 0;
  private resolving = false;
  private ambient: Phaser.GameObjects.GameObject[] = [];

  public constructor() { super({ key: 'PlayShellScene' }); }

  public create(): void {
    this.cameras.main.setBackgroundColor('#101d2a');
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.sceneRoot = this.add.container(0, 0);
    this.actionLayer = this.add.container(0, 0).setDepth(WORLD_DEPTH.effects + 20);
    this.title = this.add.text(900, 95, '', titleStyle()).setOrigin(0.5).setDepth(WORLD_DEPTH.effects + 30);
    this.subtitle = this.add.text(900, 150, '', subtitleStyle()).setOrigin(0.5).setDepth(WORLD_DEPTH.effects + 30);
    this.pipText = this.add.text(900, 850, '', pipStyle()).setOrigin(0.5).setDepth(WORLD_DEPTH.effects + 30);
    document.documentElement.dataset.playShell = 'ready';
    document.documentElement.dataset.wonderWorld = 'vertical-slice';
    document.documentElement.dataset.clickTapFirst = 'ready';
    document.documentElement.dataset.gamePaused = 'true';
    window.addEventListener('blur', this.onUnsafeVisibility);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('blur', this.onUnsafeVisibility);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    });
    this.renderIdleWonderWorld();
  }

  public override update(time: number): void {
    this.ambient.forEach((item, index) => {
      if ('setAlpha' in item && typeof item.setAlpha === 'function') item.setAlpha(0.35 + (Math.sin(time / 420 + index) + 1) * 0.24);
    });
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    getRuntime().input.reset();
    document.documentElement.dataset.gamePaused = String(paused);
  }

  public resumePlay(): void { this.setPaused(false); }

  public togglePause(): void {
    this.setPaused(!this.paused);
    window.dispatchEvent(new CustomEvent('wonderlands:pause-changed', { detail: this.paused }));
  }

  public syncAdventureFromSave(): void {
    const progress = getRuntime().getSession()?.getProgress();
    if (!progress) return;
    if (progress.wonderWorldRestored) { this.renderRestoredWonderWorld(); return; }
    if (progress.firstFragmentRecovered) { this.renderFragmentReturn(); return; }
    const zoneIndex = FOREST_POP_ZONES.findIndex((zone) => zone.id === progress.currentZoneId);
    if (zoneIndex >= 0) { this.currentZoneIndex = zoneIndex; this.renderZone(FOREST_POP_ZONES[zoneIndex]); return; }
    if (progress.storyStep >= 5) { this.renderMagicMap(); return; }
    this.prologueIndex = Math.max(0, Math.min(PROLOGUE_STEPS.length - 1, progress.storyStep - 1));
    this.renderPrologue();
  }

  private renderIdleWonderWorld(): void {
    this.clearScene(); this.drawDiorama([0x142f48, 0x315c68, 0x55796c, 0xd4b76f], false);
    this.title.setText('TREASURE POP — WONDERLANDS'); this.subtitle.setText('Crée un profil pour commencer'); this.pipText.setText('');
  }

  private renderPrologue(): void {
    this.clearScene(); this.drawDiorama([0x172a43, 0x394b68, 0x48685d, 0xb38b62], false);
    this.drawBrokenHeart(); this.drawPip(520, 625, this.prologueIndex >= 1); this.drawHero(1170, 650);
    this.title.setText('WONDER WORLD'); this.subtitle.setText('Le commencement'); this.pipText.setText(PROLOGUE_STEPS[this.prologueIndex]);
    this.createActionButton(900, 730, this.prologueIndex === PROLOGUE_STEPS.length - 1 ? 'OUVRIR LA CARTE' : 'CONTINUER', () => void this.advancePrologue());
    document.documentElement.dataset.adventureStage = `prologue-${String(this.prologueIndex + 1)}`;
  }

  private async advancePrologue(): Promise<void> {
    if (this.resolving) return; this.resolving = true;
    const session = getRuntime().getSession(); if (!session) return;
    if (this.prologueIndex < PROLOGUE_STEPS.length - 1) {
      this.prologueIndex += 1; await session.setStoryLocation(this.prologueIndex + 1, 'prologue'); this.resolving = false; this.renderPrologue(); return;
    }
    await session.setStoryLocation(5, 'magic-map'); this.resolving = false; this.renderMagicMap();
  }

  private renderMagicMap(): void {
    this.clearScene(); this.drawDiorama([0x12182d, 0x2f3158, 0x4f4d6d, 0x9c795f], false);
    this.title.setText('CARTE MAGIQUE FRACTURÉE'); this.subtitle.setText('Un seul royaume répond encore');
    this.pipText.setText('Pip : « La forêt nous appelle. Et je vote pour qu’on évite les morceaux de carte qui mordent. »');
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8; const x = 900 + Math.cos(angle) * 300; const y = 465 + Math.sin(angle) * 190; const available = index === 0;
      const shard = this.add.polygon(x, y, [0, -55, 75, -25, 62, 48, 0, 65, -70, 35, -62, -28], available ? 0x68d889 : 0x3a4058, 0.95).setStrokeStyle(4, available ? 0xffe69a : 0x777b91, 0.9).setDepth(WORLD_DEPTH.effects + 2);
      if (available) {
        shard.setInteractive({ useHandCursor: true }).on('pointerdown', () => void this.enterForest());
        this.add.text(x, y, 'FORÊT\nPOP', { fontFamily: 'system-ui', fontSize: '25px', fontStyle: 'bold', align: 'center', color: '#ffffff' }).setOrigin(0.5).setDepth(WORLD_DEPTH.effects + 3);
      } else this.add.text(x, y, '?', { fontFamily: 'system-ui', fontSize: '34px', fontStyle: 'bold', color: '#aeb3c4' }).setOrigin(0.5).setDepth(WORLD_DEPTH.effects + 3);
    }
    document.documentElement.dataset.adventureStage = 'magic-map';
  }

  private async enterForest(): Promise<void> {
    if (this.resolving) return; this.resolving = true; const session = getRuntime().getSession(); if (!session) return;
    this.currentZoneIndex = 0; await session.setStoryLocation(10, FOREST_POP_ZONES[0].id); this.resolving = false; this.renderZone(FOREST_POP_ZONES[0]);
  }

  private renderZone(zone: ForestZone): void {
    this.clearScene(); this.drawDiorama(zone.palette, true); this.drawHero(420, 680); this.drawPip(575, 610, true); this.drawZoneLandmark(zone.id);
    this.title.setText(zone.title.toUpperCase()); this.subtitle.setText(zone.subtitle); this.pipText.setText(zone.story);
    const completed = getRuntime().getSession()?.getProgress().activatedTargetIds ?? [];
    zone.activities.forEach((activity, index) => this.createActivityNode(activity, 1150 + (index % 2) * 240, 390 + Math.floor(index / 2) * 190, completed.includes(activity.id)));
    document.documentElement.dataset.adventureStage = zone.id; document.documentElement.dataset.zoneActivities = String(zone.activities.length);
    if (zone.activities.every((activity) => completed.includes(activity.id) || activity.optional)) {
      if (zone.id === 'heart-tree') this.createActionButton(1450, 760, 'RESTAURER L’ARBRE-CŒUR', () => void this.finishForest());
      else this.createActionButton(1450, 760, 'SUIVRE LE SENTIER', () => void this.advanceZone());
    }
  }

  private createActivityNode(activity: ForestActivity, x: number, y: number, completed: boolean): void {
    const color = completed ? 0x6bd99a : activity.optional ? 0xb78ae8 : 0xffcf69; const node = this.add.container(x, y).setDepth(WORLD_DEPTH.effects + 5);
    const shadow = this.add.ellipse(0, 35, 170, 42, 0x071b20, 0.28); const plate = this.add.polygon(0, 0, [0, -62, 76, -28, 68, 38, 0, 66, -72, 34, -78, -25], color, 0.96).setStrokeStyle(4, 0xffffff, 0.7);
    const icon = this.add.text(0, -10, activityIcon(activity.kind), { fontFamily: 'system-ui', fontSize: '32px', color: '#17313a' }).setOrigin(0.5);
    const label = this.add.text(0, 92, completed ? `${activity.title}\n✓ TERMINÉ` : activity.title, { fontFamily: 'system-ui', fontSize: '20px', fontStyle: 'bold', align: 'center', color: '#ffffff', stroke: '#17313a', strokeThickness: 5, wordWrap: { width: 210 } }).setOrigin(0.5);
    node.add([shadow, plate, icon, label]); if (!completed) node.setSize(180, 180).setInteractive({ useHandCursor: true }).on('pointerdown', () => void this.resolveActivity(activity));
  }

  private async resolveActivity(activity: ForestActivity): Promise<void> {
    if (this.paused || this.resolving) return; const session = getRuntime().getSession(); if (!session) return; this.resolving = true;
    document.documentElement.dataset.lastInputMode = 'click-tap'; document.documentElement.dataset.interactionState = 'resolving';
    this.pipText.setText(`${activity.prompt}\nPip : « Essaie. Je te laisse chercher avant de faire mon génie. »`); await this.delay(520);
    const before = session.getProgress().activatedTargetIds.includes(activity.id); const progress = await session.completeInteraction(activity.id); await session.award(activity.reward); if (activity.id === 'moki-rescue') await session.addCompanion('moki');
    document.documentElement.dataset.interactionState = 'triggered'; document.documentElement.dataset.technicalInteractions = String(progress.technicalInteractionsCompleted);
    window.dispatchEvent(new CustomEvent('wonderlands:progress-changed')); window.dispatchEvent(new CustomEvent('wonderlands:interaction-resolved', { detail: { targetId: activity.id, alreadyCompleted: before, technicalInteractionsCompleted: progress.technicalInteractionsCompleted } }));
    this.flashReward(activity.reward); this.resolving = false; const zone = FOREST_POP_ZONES[this.currentZoneIndex]; if (zone) this.time.delayedCall(850, () => this.renderZone(zone));
  }

  private async advanceZone(): Promise<void> {
    if (this.resolving) return; const session = getRuntime().getSession(); if (!session) return; const nextIndex = this.currentZoneIndex + 1; if (nextIndex >= FOREST_POP_ZONES.length) return;
    this.resolving = true; this.currentZoneIndex = nextIndex; const next = FOREST_POP_ZONES[nextIndex]; await session.setStoryLocation(10 + nextIndex, next.id); this.resolving = false; this.renderZone(next);
  }

  private async finishForest(): Promise<void> {
    if (this.resolving) return; const session = getRuntime().getSession(); if (!session) return; this.resolving = true; await session.recoverFirstFragment(); await session.setStoryLocation(30, 'forest-restored'); this.resolving = false; this.renderForestRestored();
  }

  private renderForestRestored(): void {
    this.clearScene(); this.drawDiorama([0x12394a, 0x31825f, 0x77c96e, 0xffdc7b], true); this.drawHeartTree(1040, 540, true); this.drawHero(600, 680); this.drawPip(760, 610, true);
    this.title.setText('FORÊT POP RESTAURÉE'); this.subtitle.setText('Sylva est libre'); this.pipText.setText('Le premier fragment du Cœur pulse dans tes mains. Au loin, une silhouette observe… puis disparaît.');
    this.createActionButton(1380, 735, 'RETOUR AU WONDER WORLD', () => this.renderFragmentReturn()); document.documentElement.dataset.adventureStage = 'forest-restored';
  }

  private renderFragmentReturn(): void {
    this.clearScene(); this.drawDiorama([0x172a43, 0x455f7b, 0x628f72, 0xe3c879], false); this.drawBrokenHeart(true); this.drawHero(1180, 680); this.drawPip(1010, 610, true);
    this.title.setText('LE PREMIER FRAGMENT'); this.subtitle.setText('Le Wonder World recommence à respirer'); this.pipText.setText('Pip : « Tu as vu ça ?! Une partie du monde vient de se réveiller. Et Moki a déjà choisi ton jardin comme maison. »');
    this.createActionButton(900, 740, 'PLACER LE FRAGMENT', () => void this.restoreHome()); document.documentElement.dataset.adventureStage = 'fragment-return';
  }

  private async restoreHome(): Promise<void> {
    if (this.resolving) return; const session = getRuntime().getSession(); if (!session) return; this.resolving = true; await session.restoreWonderWorld(); await session.setStoryLocation(40, 'wonder-world-restored'); this.resolving = false; this.renderRestoredWonderWorld();
  }

  private renderRestoredWonderWorld(): void {
    this.clearScene(); this.drawDiorama([0x22628a, 0x5d9e8a, 0x82c977, 0xffdd82], true); this.drawBrokenHeart(true); this.drawHero(1120, 680); this.drawPip(950, 610, true); this.drawMoki(760, 680);
    this.title.setText('WONDER WORLD — RÉVEILLÉ'); this.subtitle.setText('1 fragment retrouvé · Forêt Pop sauvée'); this.pipText.setText('La carte brille un peu plus fort. D’autres royaumes attendent… mais notre aventure s’arrête ici pour cette Vertical Slice.');
    document.documentElement.dataset.adventureStage = 'vertical-slice-complete'; document.documentElement.dataset.firstFragment = 'recovered'; document.documentElement.dataset.wonderWorldRestored = 'true';
  }

  private clearScene(): void { this.sceneRoot.removeAll(true); this.actionLayer.removeAll(true); this.ambient.forEach((item) => item.destroy()); this.ambient = []; }

  private drawDiorama(palette: readonly [number, number, number, number], alive: boolean): void {
    const [sky, distant, ground, glow] = palette; const background = this.add.graphics().setDepth(WORLD_DEPTH.background); background.fillGradientStyle(sky, sky, distant, distant, 1); background.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    const back = this.add.graphics().setDepth(WORLD_DEPTH.distant); back.fillStyle(distant, 0.85); back.fillPoints([{ x: 0, y: 470 }, { x: 220, y: 300 }, { x: 440, y: 430 }, { x: 720, y: 245 }, { x: 980, y: 420 }, { x: 1260, y: 280 }, { x: 1510, y: 405 }, { x: 1800, y: 260 }, { x: 1800, y: 720 }, { x: 0, y: 720 }], true);
    const floor = this.add.graphics().setDepth(WORLD_DEPTH.ground); floor.fillStyle(ground, 1); floor.fillEllipse(900, 760, 1960, 720); floor.fillStyle(glow, 0.35); floor.fillEllipse(930, 760, 1250, 230); this.sceneRoot.add([background, back, floor]);
    for (let index = 0; index < 18; index += 1) { const x = 80 + ((index * 149) % 1660); const y = 220 + ((index * 97) % 560); const mote = this.add.star(x, y, 4, 2, 6, glow, alive ? 0.78 : 0.38).setDepth(WORLD_DEPTH.effects); this.ambient.push(mote); }
  }

  private drawZoneLandmark(zoneId: string): void {
    if (zoneId === 'heart-tree') { this.drawHeartTree(900, 560, false); return; }
    const g = this.add.graphics().setDepth(WORLD_DEPTH.groundDetail + 5);
    if (zoneId === 'gurgle-river') { g.fillStyle(0x5cc7d9, 0.9).fillRoundedRect(610, 545, 690, 180, 90); g.lineStyle(7, 0xc8f7f3, 0.65).strokeRoundedRect(650, 580, 590, 80, 40); }
    else if (zoneId === 'flower-ruins') { g.fillStyle(0xa7988a, 1).fillRoundedRect(720, 430, 360, 300, 28); g.fillStyle(0x342f4d, 1).fillTriangle(900, 505, 805, 690, 995, 690); }
    else for (let index = 0; index < 6; index += 1) { const x = 700 + index * 110; const height = 210 + (index % 3) * 65; g.fillStyle(index % 2 === 0 ? 0x345e46 : 0x477b50, 1).fillRoundedRect(x, 690 - height, 62, height, 28); g.fillStyle(0x7acb73, 0.95).fillCircle(x + 30, 690 - height, 72); }
    this.sceneRoot.add(g);
  }

  private drawBrokenHeart(restoring = false): void {
    const g = this.add.graphics().setDepth(WORLD_DEPTH.effects + 4); g.fillStyle(restoring ? 0xffcf69 : 0x6f7893, 0.95); g.fillCircle(900, 430, 86); g.fillTriangle(815, 430, 985, 430, 900, 585); g.lineStyle(15, restoring ? 0xffffff : 0x2e3447, 0.95); g.beginPath().moveTo(905, 350).lineTo(865, 430).lineTo(930, 470).lineTo(890, 555).strokePath(); this.sceneRoot.add(g);
  }

  private drawHeartTree(x: number, y: number, restored: boolean): void {
    const g = this.add.graphics().setDepth(WORLD_DEPTH.groundDetail + 6); g.fillStyle(0x68483d, 1).fillRoundedRect(x - 75, y - 20, 150, 330, 65); g.fillStyle(restored ? 0x65d279 : 0x644b72, 1);
    for (let index = 0; index < 7; index += 1) { const angle = (Math.PI * 2 * index) / 7; g.fillCircle(x + Math.cos(angle) * 125, y - 90 + Math.sin(angle) * 90, 100); }
    g.fillStyle(restored ? 0xffd66e : 0xa95f8d, 0.95).fillCircle(x, y - 75, 48); this.sceneRoot.add(g);
  }

  private drawHero(x: number, y: number): void {
    const avatar = getRuntime().getSession()?.getProgress().avatar; const skinColors = [0xf5d0b5, 0xd99b73, 0xa96949, 0x6d4434]; const outfitColors = [0x4e8fc8, 0x8c5bc8, 0x3f9b72, 0xd47a54]; const g = this.add.graphics().setDepth(WORLD_DEPTH.effects + 8);
    g.fillStyle(0x071b20, 0.25).fillEllipse(x, y + 38, 105, 28); g.fillStyle(outfitColors[(avatar?.outfit ?? 1) - 1] ?? outfitColors[0], 1).fillRoundedRect(x - 43, y - 48, 86, 100, 30); g.fillStyle(skinColors[(avatar?.skin ?? 1) - 1] ?? skinColors[0], 1).fillCircle(x, y - 92, 43); g.fillStyle(0x352d36, 1).fillEllipse(x, y - 120, 88, 42); g.fillStyle(0xffffff, 1).fillCircle(x - 14, y - 92, 7).fillCircle(x + 14, y - 92, 7); g.fillStyle(0x26313d, 1).fillCircle(x - 14, y - 92, 3).fillCircle(x + 14, y - 92, 3); this.sceneRoot.add(g);
  }

  private drawPip(x: number, y: number, awake: boolean): void {
    const g = this.add.graphics().setDepth(WORLD_DEPTH.effects + 9); g.fillStyle(0x14222d, 0.25).fillEllipse(x, y + 28, 88, 22); g.fillStyle(awake ? 0xffd96f : 0x8893a2, 1).fillCircle(x, y - 25, 43); g.fillStyle(awake ? 0xffefaa : 0xaab1bb, 1).fillTriangle(x - 38, y - 52, x - 62, y - 92, x - 10, y - 65).fillTriangle(x + 38, y - 52, x + 62, y - 92, x + 10, y - 65); g.fillStyle(0x26313d, 1).fillCircle(x - 13, y - 30, 5).fillCircle(x + 13, y - 30, 5); this.sceneRoot.add(g);
  }

  private drawMoki(x: number, y: number): void { const g = this.add.graphics().setDepth(WORLD_DEPTH.effects + 8); g.fillStyle(0x3f704f, 1).fillEllipse(x, y - 20, 88, 74); g.fillStyle(0x8bcf70, 1).fillCircle(x - 25, y - 62, 28).fillCircle(x + 25, y - 62, 28); g.fillStyle(0xffe98c, 1).fillCircle(x - 14, y - 30, 6).fillCircle(x + 14, y - 30, 6); this.sceneRoot.add(g); }

  private createActionButton(x: number, y: number, label: string, action: () => void): void {
    const button = this.add.container(x, y).setDepth(WORLD_DEPTH.effects + 40); const plate = this.add.graphics(); plate.fillStyle(0x6656c8, 0.96).fillRoundedRect(-175, -36, 350, 72, 26); plate.lineStyle(4, 0xffffff, 0.8).strokeRoundedRect(-175, -36, 350, 72, 26); const text = this.add.text(0, 0, label, { fontFamily: 'system-ui', fontSize: '22px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5); button.add([plate, text]).setSize(350, 72).setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (!this.paused) action(); }); this.actionLayer.add(button);
  }

  private flashReward(reward: string): void {
    const panel = this.add.container(900, 300).setDepth(WORLD_DEPTH.effects + 80); const g = this.add.graphics(); g.fillStyle(0x182c3b, 0.94).fillRoundedRect(-300, -65, 600, 130, 30); g.lineStyle(5, 0xffd66e, 0.9).strokeRoundedRect(-300, -65, 600, 130, 30); const text = this.add.text(0, 0, `RÉCOMPENSE\n${reward}`, { fontFamily: 'system-ui', fontSize: '24px', fontStyle: 'bold', align: 'center', color: '#fff4bd' }).setOrigin(0.5); panel.add([g, text]); this.tweens.add({ targets: panel, y: 270, alpha: 0, delay: 520, duration: 320, onComplete: () => panel.destroy(true) });
  }

  private delay(milliseconds: number): Promise<void> { return new Promise((resolve) => this.time.delayedCall(milliseconds, resolve)); }
  private readonly onUnsafeVisibility = (): void => this.setPaused(true);
  private readonly onVisibilityChange = (): void => { if (document.hidden) this.setPaused(true); };
}

function titleStyle(): Phaser.Types.GameObjects.Text.TextStyle { return { fontFamily: 'system-ui, sans-serif', fontSize: '42px', fontStyle: 'bold', color: '#ffffff', stroke: '#172f3d', strokeThickness: 9, align: 'center' }; }
function subtitleStyle(): Phaser.Types.GameObjects.Text.TextStyle { return { fontFamily: 'system-ui, sans-serif', fontSize: '23px', fontStyle: 'bold', color: '#fff2b5', stroke: '#172f3d', strokeThickness: 6, align: 'center' }; }
function pipStyle(): Phaser.Types.GameObjects.Text.TextStyle { return { fontFamily: 'system-ui, sans-serif', fontSize: '22px', color: '#ffffff', backgroundColor: '#173642dd', padding: { x: 18, y: 12 }, align: 'center', wordWrap: { width: 1050 } }; }
function activityIcon(kind: ForestActivity['kind']): string { const icons: Record<ForestActivity['kind'], string> = { search: '◇', puzzle: '✦', repair: '⚙', tracks: '⌁', memory: '◈', sequence: '⋯', creature: '♥', environment: '◎', secret: '★', finale: '✹' }; return icons[kind]; }
