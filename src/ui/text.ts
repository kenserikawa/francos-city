import Phaser from 'phaser';
import { FONT_KEY } from '../art/font';
import { PAL, type ColorName } from '../art/palette';

type Tint = ColorName | number;
const tint = (c: Tint) => (typeof c === 'number' ? c : PAL[c]);

export interface LabelOptions {
  scale?: number;
  origin?: [number, number];
  shadow?: Tint | null;
  depth?: number;
  scroll?: number;
  maxWidth?: number;
  align?: 0 | 1 | 2;
}

/** Texto en la fuente del juego con sombra dura de 1 px (escalada si el texto lo está). */
export function label(scene: Phaser.Scene, x: number, y: number, text: string, color: Tint, opts: LabelOptions = {}) {
  const scale = opts.scale ?? 1;
  const [ox, oy] = opts.origin ?? [0, 0];
  const make = (dx: number, dy: number, c: Tint) => {
    const t = scene.add.bitmapText(0, 0, FONT_KEY, text).setScale(scale).setTint(tint(c));
    if (opts.maxWidth) t.setMaxWidth(opts.maxWidth);
    if (opts.align === 1) t.setCenterAlign();
    else if (opts.align === 2) t.setRightAlign();
    // Origen a mano y en píxeles enteros: con medio píxel, el escalado se come columnas de los glifos
    t.setPosition(dx - Math.round(t.width * ox), dy - Math.round(t.height * oy));
    return t;
  };
  const parts: Phaser.GameObjects.BitmapText[] = [];
  const shadow = opts.shadow === undefined ? 'tinta' : opts.shadow;
  if (shadow !== null) parts.push(make(scale, scale, shadow));
  parts.push(make(0, 0, color));
  const c = scene.add.container(Math.round(x), Math.round(y), parts);
  if (opts.depth !== undefined) c.setDepth(opts.depth);
  if (opts.scroll !== undefined) c.setScrollFactor(opts.scroll);
  return c;
}

/** Bocadillo de diálogo: papel, borde de tinta y piquito apuntando abajo. */
export function speechBubble(scene: Phaser.Scene, x: number, bottomY: number, text: string, maxWidth = 112) {
  const t = scene.add.bitmapText(0, 0, FONT_KEY, text).setMaxWidth(maxWidth).setTint(PAL.tinta);
  const padX = 4;
  const w = Math.ceil(t.width) + padX * 2;
  // La celda de la fuente deja 2 filas libres arriba: se compensan para centrar en vertical.
  const h = Math.ceil(t.height) + 3;
  const g = scene.add.graphics();
  g.fillStyle(PAL.tinta);
  g.fillRect(-1, -1, w + 2, h + 2);
  g.fillStyle(PAL.papel);
  g.fillRect(0, 0, w, h);
  const tx = Math.floor(w / 2);
  g.fillStyle(PAL.tinta);
  g.fillRect(tx - 3, h + 1, 7, 1);
  g.fillRect(tx - 2, h + 2, 5, 1);
  g.fillRect(tx - 1, h + 3, 3, 1);
  g.fillStyle(PAL.papel);
  g.fillRect(tx - 2, h, 5, 1);
  g.fillRect(tx - 1, h + 1, 3, 1);
  g.fillRect(tx, h + 2, 1, 1);
  t.setPosition(padX, -1);
  const c = scene.add.container(Math.round(x - w / 2), Math.round(bottomY - h - 4), [g, t]);
  return c;
}
