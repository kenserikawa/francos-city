import Phaser from 'phaser';
import { touch } from './TouchPad';

export type Action = 'left' | 'right' | 'up' | 'down' | 'jump' | 'throw' | 'interact' | 'confirm';

const K = Phaser.Input.Keyboard.KeyCodes;

const BINDINGS: Record<Action, number[]> = {
  left: [K.LEFT, K.A],
  right: [K.RIGHT, K.D],
  up: [K.UP, K.W],
  down: [K.DOWN, K.S],
  jump: [K.Z, K.SPACE, K.K],
  throw: [K.X, K.J],
  interact: [K.UP, K.W, K.E],
  confirm: [K.Z, K.ENTER, K.SPACE],
};

/**
 * Acciones en vez de teclas: el resto del juego pregunta por "jump", no por la Z.
 * Junta el teclado y los controles táctiles (TouchPad); aquí entrará el mando cuando toque.
 */
export class Controls {
  private keys = new Map<Action, Phaser.Input.Keyboard.Key[]>();
  private down = new Set<Action>();
  private pressed = new Set<Action>();
  private lastUpdate = performance.now();

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    if (!kb) throw new Error('Teclado no disponible');
    for (const [action, codes] of Object.entries(BINDINGS) as [Action, number[]][]) {
      this.keys.set(action, codes.map((c) => kb.addKey(c)));
    }
  }

  /** Llamar una vez por frame, antes de consultar nada. */
  update() {
    const now = performance.now();
    this.pressed.clear();
    for (const [action, keys] of this.keys) {
      // timeDown evita perder pulsaciones más cortas que un frame
      if (keys.some((k) => k.timeDown > this.lastUpdate) || touch.pressedSince(action, this.lastUpdate)) this.pressed.add(action);
      if (keys.some((k) => k.isDown) || touch.isDown(action)) this.down.add(action);
      else this.down.delete(action);
    }
    this.lastUpdate = now;
  }

  isDown(action: Action) {
    return this.down.has(action);
  }

  justPressed(action: Action) {
    return this.pressed.has(action);
  }

  axisX(): -1 | 0 | 1 {
    return ((this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0)) as -1 | 0 | 1;
  }
}
