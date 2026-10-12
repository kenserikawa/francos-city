import Phaser from 'phaser';
import { GAME_W, GAME_H, WORLD_W, DEPTH, IS_TOUCH } from '../config';
import { PAL } from '../art/palette';
import { measureText } from '../art/font';
import { Controls } from '../input/Controls';
import { touch } from '../input/TouchPad';
import { label } from '../ui/text';
import { addStreetBackdrop } from './backdrop';

export class TitleScene extends Phaser.Scene {
  private controls!: Controls;
  private leaving = false;

  constructor() {
    super('title');
  }

  create() {
    this.leaving = false;
    this.controls = new Controls(this);
    touch.setVisible(false);
    addStreetBackdrop(this);

    // La calle pasa despacio por detrás, ida y vuelta
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, GAME_H);
    cam.scrollX = 120;
    this.tweens.add({ targets: cam, scrollX: WORLD_W - GAME_W, duration: 60000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.rectangle(0, 34, GAME_W, 74, PAL.tinta, 0.72).setOrigin(0).setScrollFactor(0).setDepth(DEPTH.hud);

    const title = 'FRANCOS CITY';
    const scale = 3;
    const tx = Math.round((GAME_W - measureText(title) * scale) / 2);
    label(this, tx, 30, title, 'terracota', { scale, shadow: 'tinta', scroll: 0, depth: DEPTH.hud });
    label(this, tx, 30 - scale, title, 'papel', { scale, shadow: null, scroll: 0, depth: DEPTH.hud });
    label(this, GAME_W / 2, 66, 'El Plan de Autenticidad', 'trigo', { origin: [0.5, 0], scroll: 0, depth: DEPTH.hud });

    const prompt = label(this, GAME_W / 2, 86, IS_TOUCH ? 'Toca la pantalla' : 'Pulsa Z o Intro', 'papel', { origin: [0.5, 0], scroll: 0, depth: DEPTH.hud });
    this.time.addEvent({ delay: 530, loop: true, callback: () => prompt.setVisible(!prompt.visible) });

    label(this, GAME_W - 4, GAME_H - 3, 'prototipo · hito 1', 'cal', { origin: [1, 1], scroll: 0, depth: DEPTH.hud });

    cam.fadeIn(500, 14, 11, 13);
  }

  update() {
    this.controls.update();
    if (!this.leaving && this.controls.justPressed('confirm')) {
      this.leaving = true;
      this.cameras.main.fadeOut(400, 14, 11, 13);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('street'));
    }
  }
}
