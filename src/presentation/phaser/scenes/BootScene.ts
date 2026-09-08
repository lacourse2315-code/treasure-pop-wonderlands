import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super({ key: 'BootScene' });
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#10131a');
    document.documentElement.dataset.wonderlandsBoot = 'ready';
    document.documentElement.dataset.phaserVersion = Phaser.VERSION;
  }
}
