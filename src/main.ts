import Phaser from 'phaser';
import { GAME_W, GAME_H, GRAVITY, DEBUG, IS_TOUCH } from './config';
import { touch } from './input/TouchPad';
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
  // Escritorio: escalado siempre entero. Móvil: ocupar la pantalla (el ancho lógico ya sigue su proporción).
  scale: IS_TOUCH
    ? { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
    : { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.CENTER_BOTH, zoom: Phaser.Scale.MAX_ZOOM },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: GRAVITY }, debug: DEBUG },
  },
  scene: [BootScene, TitleScene, StreetScene],
});

if (IS_TOUCH) {
  touch.mount(game);
  // En vertical se muestra «Gira el móvil» y el juego se queda congelado
  const portrait = matchMedia('(orientation: portrait)');
  const sync = () => (portrait.matches ? game.pause() : game.resume());
  portrait.addEventListener('change', sync);
  game.events.once(Phaser.Core.Events.READY, sync);
} else {
  // El mayor múltiplo de 320x180 que quepa en la ventana
  window.addEventListener('resize', () => game.scale.setMaxZoom());
}

// Acceso desde la consola durante el desarrollo
if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;
