import Phaser from 'phaser';
import { GAME_W, GAME_H, GRAVITY, DEBUG } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { StreetScene } from './scenes/StreetScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0e0b0d',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: Phaser.Scale.MAX_ZOOM,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: GRAVITY }, debug: DEBUG },
  },
  scene: [BootScene, TitleScene, StreetScene],
});

// Escalado siempre entero: el mayor múltiplo de 320x180 que quepa en la ventana
window.addEventListener('resize', () => game.scale.setMaxZoom());

// Acceso desde la consola durante el desarrollo
if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;
