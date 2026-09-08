import Phaser from 'phaser';
import { BootScene } from '../presentation/phaser/scenes/BootScene';
import { PlayShellScene } from '../presentation/phaser/scenes/PlayShellScene';

export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#10131a',
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    scene: [BootScene, PlayShellScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
    audio: {
      disableWebAudio: false,
    },
  };
}
