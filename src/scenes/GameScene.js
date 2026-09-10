import Phaser from 'phaser';
import Player from '../entities/Player.js';

import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GROUND_HEIGHT,
  GROUND_Y,
  ARENA,
  PLAYER,
  COLORS,
  ENEMY,
  ATTACK
} from '../config/constants.js';

/**
 * Scène principale du prototype (Version 0).
 *
 * Périmètre actuel : arène 2.5D, joueur rectangle déplacé sur deux axes,
 * attaque temporaire et ennemi immobile.
 * Les étapes suivantes (attaque, ennemi, victoire/défaite) viendront enrichir
 * cette même scène.
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    const playerVerticalMargin =
      PLAYER.HEIGHT * PLAYER.BOTTOM_MARGIN_RATIO;
    const playerTopLimit =
      ARENA.TOP + playerVerticalMargin - PLAYER.HEIGHT;
    const playerBottomLimit = ARENA.BOTTOM - playerVerticalMargin;

    // Le joueur et l'ennemi restent dans la zone de déplacement brawler.
    this.physics.world.setBounds(
      0,
      playerTopLimit,
      GAME_WIDTH,
      playerBottomLimit - playerTopLimit,
    );

    this.createGround();
    this.createArena();
    this.createPlayer();
    this.createAttackHitBox();
    this.createControls();
    this.createEnemy();

    this.physics.add.collider(this.player, this.enemy);

    // Direction du regard (1 = droite, -1 = gauche), utilisée plus tard
    // pour orienter la hitbox d'attaque.
    this.facing = 1;

    this.add
      .text(16, 16, 'Deplacement : Q / D / Z / S ou fleches   -   Attaque : L', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#8d93a8',
      })
      .setScrollFactor(0);

      this.physics.add.overlap(
        this.attackHitBox,
        this.enemy,
        this.handleAttackHit,
        null,
        this);

  }

  createGround() {
    this.ground = this.add.rectangle(
      GAME_WIDTH / 2,
      GROUND_Y,
      GAME_WIDTH,
      GROUND_HEIGHT,
      COLORS.GROUND,
    );

    // `true` => corps statique : le sol ne bouge pas et n'est pas soumis à la gravité.
    this.physics.add.existing(this.ground, true);
  }

  createArena() {
    this.arena = this.add.rectangle(
      GAME_WIDTH / 2,
      (ARENA.TOP + ARENA.BOTTOM) / 2,
      GAME_WIDTH,
      ARENA.BOTTOM - ARENA.TOP,
      COLORS.ARENA,
    );

    this.arena.setStrokeStyle(2, COLORS.GROUND, 0.8);
  }

  createPlayer() {
    this.player = new Player(this);
  }

  createAttackHitBox() {
    this.attackHitBox = this.add.rectangle(
      this.player.x,
      this.player.y,
      ATTACK.WIDTH,
      ATTACK.HEIGHT,
      COLORS.ATTACK,
    );    
    this.physics.add.existing(this.attackHitBox);
    this.attackHitBox.body.enable = false;
    this.attackHitBox.body.setAllowGravity(false);
    this.attackHitBox.setVisible(false);
  }

  createEnemy() {
    this.enemy = this.add.rectangle(
        ENEMY.SPAWN_X,
        ENEMY.SPAWN_Y,
        ENEMY.WIDTH,
        ENEMY.HEIGHT,
        COLORS.ENEMY
    )

    this.physics.add.existing(this.enemy);
    this.enemy.body.setCollideWorldBounds(true);
    this.enemy.health = ENEMY.MAX_HEALTH;
  }

  createControls() {
    const keyboard = this.input.keyboard;

    this.cursors = keyboard.createCursorKeys();
    // Touches AZERTY : Q/D pour gauche/droite et Z/S pour haut/bas.
    this.keys = keyboard.addKeys('Q,D,Z,S');

    this.attackKey = keyboard.addKey('L');
  }

  update() {
    this.updateMovement();

    if (this.player.state === 'attack') {
      this.updateAttackHitBox();
    }

    if (Phaser.Input.Keyboard.JustDown(this.attackKey) 
      && this.player.attack()) {
      this.startAttack();
    }
  }

  updateMovement() {
    const left = this.cursors.left.isDown || this.keys.Q.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.Z.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;

    let directionX = 0;
    let directionY = 0;

    if (left && !right) {
      directionX = -1;
      this.facing = -1;
    } else if (right && !left) {
      directionX = 1;
      this.facing = 1;
    }

    if (up && !down) {
      directionY = -1;
    } else if (down && !up) {
      directionY = 1;
    }

    this.player.move(directionX, directionY);
  }

  updateAttackHitBox() {
    this.attackHitBox.setPosition(
      this.player.x + ATTACK.OFFSET_X * this.facing,
      this.player.y,
    );
  }

  startAttack() {
    this.enemy.wasHit = false;
    this.attackHitBox.body.enable = true;
    this.attackHitBox.setVisible(true);

    this.updateAttackHitBox();

    this.time.delayedCall(ATTACK.DURATION, () => {
      this.attackHitBox.body.enable = false;
      this.attackHitBox.setVisible(false);
    });
  }

  handleAttackHit(attackHitbox, enemy) {
    if (!enemy.active || enemy.wasHit) {
      return;
    }
    enemy.wasHit = true;
    enemy.health -= ATTACK.DAMAGE;

    if (enemy.health <= 0) {
      enemy.destroy();
    }
  }

}
