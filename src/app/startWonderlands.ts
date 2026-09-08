import Phaser from 'phaser';
import { createGameConfig } from '../config/gameConfig';

export function startWonderlands(parent: string): Phaser.Game {
  return new Phaser.Game(createGameConfig(parent));
}
