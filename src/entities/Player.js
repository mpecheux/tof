import Phaser from 'phaser';

import { ATTACK, COLORS, PLAYER } from '../config/constants.js';

export default class Player extends Phaser.GameObjects.Rectangle {
  constructor(scene) {
    super(
      scene,
      PLAYER.SPAWN_X,
      PLAYER.SPAWN_Y,
      PLAYER.WIDTH,
      PLAYER.HEIGHT,
      COLORS.PLAYER,
    );

    this.scene = scene;
    this.health = PLAYER.MAX_HEALTH ?? 100;
    this.state = 'idle';
    this.facing = 1;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setCollideWorldBounds(true);
    this.body.setAllowGravity(false);
  }

  move(directionX, directionY) {
    if (directionX !== 0 && directionY !== 0) {
      directionX *= Math.SQRT1_2;
      directionY *= Math.SQRT1_2;
    }

    if (directionX < 0) {
      this.facing = -1;
    } else if (directionX > 0) {
      this.facing = 1;
    }

    this.body.setVelocity(
      directionX * PLAYER.SPEED,
      directionY * PLAYER.SPEED,
    );

    if (this.state !== 'attack' && this.state !== 'hurt' && this.state !== 'dead') {
      this.state = directionX !== 0 || directionY !== 0 ? 'walk' : 'idle';
    }
  }

  attack() {
    if (this.state === 'attack') {
      return false;
    }

    this.state = 'attack';
    this.scene.time.delayedCall(ATTACK.DURATION, () => {
      if (this.active && this.state === 'attack') {
        this.state = 'idle';
      }
    });

    return true;
  }

  takeDamage(amount) {
    if (this.state === 'hurt') {
      return false;
    }

    this.health = Math.max(0, this.health - amount);
    this.state = this.health > 0 ? 'hurt' : 'dead';

    return true;
  }
}
