import Phaser from 'phaser';
import { DEPTH, FACADE_BASE_Y } from '../config';
import { PARALLAX, BAR_X } from '../art/street';
import { animKey } from '../art/sprites';

/** Cielo, skylines con parallax, fachadas y el Bar Manolo. Lo comparten la portada y la calle. */
export function addStreetBackdrop(scene: Phaser.Scene) {
  scene.add.image(0, 0, 'cielo').setOrigin(0).setScrollFactor(0).setDepth(DEPTH.sky);
  scene.add.image(0, 0, 'lejos').setOrigin(0).setScrollFactor(PARALLAX.far, 0).setDepth(DEPTH.far);
  scene.add.image(0, 0, 'medio').setOrigin(0).setScrollFactor(PARALLAX.mid, 0).setDepth(DEPTH.mid);
  scene.add.image(0, 0, 'calle').setOrigin(0).setDepth(DEPTH.street);
  const bar = scene.add.sprite(BAR_X, FACADE_BASE_Y, 'bar-manolo').setOrigin(0.5, 1).setDepth(DEPTH.facade);
  bar.play(animKey(scene, 'bar-manolo', 'original'));
  return { bar };
}
