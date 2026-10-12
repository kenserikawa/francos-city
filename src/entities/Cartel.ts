import Phaser from 'phaser';
import { DEPTH } from '../config';

/** Cartel del Plan de Autenticidad: dos paquetazos y al suelo. */
export class Cartel extends Phaser.Physics.Arcade.Image {
  declare body: Phaser.Physics.Arcade.StaticBody;
  private hp = 2;
  broken = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'cartel');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setOrigin(0.5, 1).setDepth(DEPTH.props);
    this.refreshBody();
  }

  hit(): 'damaged' | 'broken' {
    this.hp--;
    this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(60, () => this.clearTint().setTintMode(Phaser.TintModes.MULTIPLY));
    if (this.hp > 0) {
      this.scene.tweens.add({ targets: this, angle: { from: 9, to: 0 }, duration: 320, ease: 'Elastic.easeOut' });
      return 'damaged';
    }
    this.broken = true;
    this.setTexture('cartel-roto');
    this.disableBody(false, false);
    return 'broken';
  }
}
