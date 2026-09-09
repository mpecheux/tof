import Phaser from 'phaser';

class BootScene extends Phaser.Scene {
  create() {
    this.add.text(20,20, 'Hello Phaser!', { color: '#ffffff'});
  }
}

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#222222',
  scene: [BootScene]
};

new Phaser.Game(config);