import Phaser from 'phaser';

import {
  GAME_WIDTH,
  GAME_HEIGHT,
  DEBUG_PHYSICS,
  COLORS,
} from './config/constants.js';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: COLORS.BACKGROUND,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: DEBUG_PHYSICS,
    },
  },
  scene: [GameScene],
};

new Phaser.Game(config);
