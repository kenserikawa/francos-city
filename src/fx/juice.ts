import Phaser from 'phaser';
import { PAL } from '../art/palette';
import { FONT_KEY } from '../art/font';

/*
 * La sensación "Metal Slug" sale de aquí, no de los frames: congelar el impacto, sacudir la cámara,
 * soltar polvo y papelotes.
 */

/** Congela física y animaciones unos milisegundos para que el golpe se sienta. */
export function hitStop(scene: Phaser.Scene, ms: number) {
  const world = scene.physics.world;
  if (world.isPaused) return;
  world.pause();
  scene.anims.pauseAll();
  scene.time.delayedCall(ms, () => {
    world.resume();
    scene.anims.resumeAll();
  });
}

export function shake(scene: Phaser.Scene, ms = 90, intensity = 0.012) {
  scene.cameras.main.shake(ms, intensity);
}

export interface Fx {
  dust(x: number, y: number, count?: number, dir?: number): void;
  paper(x: number, y: number, count?: number): void;
}

export function createFx(scene: Phaser.Scene, depth: number): Fx {
  const dust = scene.add.particles(0, 0, 'polvo', {
    lifespan: { min: 220, max: 420 },
    speed: { min: 6, max: 24 },
    angle: { min: 200, max: 340 },
    gravityY: -12,
    alpha: { start: 0.9, end: 0 },
    tint: [PAL.cal, PAL['arena-gris'], PAL.papel],
    frequency: -1,
  }).setDepth(depth);

  const paper = scene.add.particles(0, 0, 'px2', {
    lifespan: { min: 500, max: 900 },
    speed: { min: 40, max: 130 },
    angle: { min: 200, max: 340 },
    gravityY: 300,
    alpha: { start: 1, end: 0 },
    tint: [PAL.papel, PAL.cal, PAL.turquesa, PAL.alarma],
    frequency: -1,
  }).setDepth(depth);

  return {
    dust(x, y, count = 4, dir = 0) {
      if (dir) dust.setEmitterAngle(dir > 0 ? { min: 180, max: 230 } : { min: 310, max: 360 });
      else dust.setEmitterAngle({ min: 200, max: 340 });
      dust.explode(count, x, y);
    },
    paper(x, y, count = 16) {
      paper.explode(count, x, y);
    },
  };
}

/** Texto que sube y se apaga parpadeando ("-1 autenticidad"). Sin transparencias: se verían turbias. */
export function floatText(scene: Phaser.Scene, x: number, y: number, text: string, color: number, depth: number) {
  const shadow = scene.add.bitmapText(x + 1, y + 1, FONT_KEY, text).setOrigin(0.5, 1).setTint(PAL.tinta).setDepth(depth);
  const label = scene.add.bitmapText(x, y, FONT_KEY, text).setOrigin(0.5, 1).setTint(color).setDepth(depth);
  const parts = [shadow, label];
  scene.tweens.add({ targets: parts, y: '-=16', duration: 700, ease: 'Cubic.easeOut' });
  blinkOut(scene, parts, 700);
}

/** Parpadeo y desaparición, a la manera de los 16 bits. */
export function blinkOut(
  scene: Phaser.Scene,
  targets: (Phaser.GameObjects.GameObject & { setVisible(v: boolean): unknown; visible: boolean })[],
  delay = 0,
) {
  scene.time.delayedCall(delay, () => {
    scene.time.addEvent({ delay: 70, repeat: 7, callback: () => targets.forEach((t) => t.setVisible(!t.visible)) });
    scene.time.delayedCall(70 * 8 + 10, () => targets.forEach((t) => t.destroy()));
  });
}
