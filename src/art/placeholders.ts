import Phaser from 'phaser';
import { Pixels, rng } from './pixels';
import { buildSheet, buildTexture, type FrameSpec } from './sprites';
import { drawText, measureText, CAP_TOP } from './font';

/*
 * Placeholders procedurales. Sirven para jugar y para fijar proporciones, no son el arte final:
 * en cuanto exista src/assets/sprites/<clave>.png, el juego usa ese y se olvida de estos.
 */

type Pt = [number, number];

interface PabloPose {
  bob: number;
  front: Pt; // tobillo de la pierna delantera
  back: Pt; // tobillo de la pierna trasera
  hand: Pt; // mano del brazo delantero
  armBehindHead?: boolean;
  holding?: boolean;
  mouth?: 'open';
  hurt?: boolean;
}

function leg(p: Pixels, hip: Pt, ankle: Pt, pants: 'pizarra' | 'noche') {
  p.line(hip[0] - 1, hip[1], ankle[0] - 1, ankle[1] - 2, pants, 3);
  p.rect(ankle[0] - 1, ankle[1], 5, 1, 'cal');
  p.rect(ankle[0] - 1, ankle[1] + 1, 5, 1, 'piedra');
}

function drawPablo(p: Pixels, ox: number, oy: number, pose: PabloPose) {
  const b = pose.bob;
  const at = (x: number, y: number): Pt => [ox + x, oy + y];
  const R = (x: number, y: number, w: number, h: number, c: Parameters<Pixels['rect']>[4]) => p.rect(ox + x, oy + y, w, h, c);

  leg(p, at(22, 31 + b), at(pose.back[0], pose.back[1]), 'noche');

  // Mochila de reparto: la silueta de Pablo
  R(11, 15 + b, 10, 14, 'butano');
  R(11, 15 + b, 10, 2, 'albaricoque');
  R(19, 17 + b, 2, 12, 'terracota');
  R(12, 22 + b, 7, 1, 'papel');

  // Torso: sudadera
  R(20, 18 + b, 8, 13, 'oliva');
  R(20, 18 + b, 2, 13, 'oliva-oscuro');
  R(20, 29 + b, 8, 2, 'oliva-oscuro');
  R(27, 19 + b, 1, 9, 'olivo-claro');
  R(24, 21 + b, 2, 2, 'butano');
  p.line(ox + 21, oy + 19 + b, ox + 22, oy + 27 + b, 'tierra');

  leg(p, at(25, 31 + b), at(pose.front[0], pose.front[1]), 'pizarra');

  const arm = () => {
    const [hx, hy] = [ox + pose.hand[0], oy + pose.hand[1] + b];
    p.line(ox + 25, oy + 20 + b, hx, hy, 'oliva', 2);
    p.rect(hx, hy, 2, 2, 'terracota');
    if (pose.holding) {
      p.rect(hx - 1, hy - 3, 4, 3, 'cuero');
      p.px(hx + 1, hy - 3, 'trigo');
    }
  };
  if (pose.armBehindHead) arm();

  // Cabeza
  R(24, 17 + b, 3, 2, 'terracota-oscura');
  R(22, 8 + b, 8, 9, 'terracota');
  R(23, 16 + b, 6, 1, 'terracota-oscura');
  R(22, 7 + b, 8, 3, 'sombra');
  R(22, 10 + b, 3, 3, 'sombra');
  R(29, 10 + b, 1, 1, 'sombra');
  R(25, 12 + b, 1, 2, 'terracota-oscura');
  R(30, 13 + b, 1, 1, 'terracota');
  if (pose.hurt) {
    R(27, 12 + b, 2, 1, 'tinta');
    R(27, 14 + b, 2, 2, 'tinta');
  } else {
    R(27, 11 + b, 2, 1, 'sombra');
    R(28, 12 + b, 1, 1, 'tinta');
    if (pose.mouth === 'open') R(27, 15 + b, 2, 1, 'tinta');
    else R(27, 15 + b, 2, 1, 'terracota-oscura');
  }

  if (!pose.armBehindHead) arm();
}

function pabloSheet(scene: Phaser.Scene) {
  const f = (ms: number, pose: PabloPose): FrameSpec => ({ ms, draw: (p, ox, oy) => drawPablo(p, ox, oy, pose) });
  const stand: Pick<PabloPose, 'front' | 'back'> = { front: [26, 45], back: [21, 45] };
  buildSheet(scene, 'pablo', 48, 48, {
    idle: [f(420, { bob: 0, ...stand, hand: [26, 27] }), f(420, { bob: 1, ...stand, hand: [26, 27] })],
    run: [
      f(80, { bob: 0, front: [30, 45], back: [18, 44], hand: [22, 26] }),
      f(80, { bob: 1, front: [27, 45], back: [20, 42], hand: [23, 26] }),
      f(80, { bob: -1, front: [24, 45], back: [24, 40], hand: [26, 27] }),
      f(80, { bob: 0, front: [18, 44], back: [30, 45], hand: [29, 26] }),
      f(80, { bob: 1, front: [20, 42], back: [27, 45], hand: [28, 26] }),
      f(80, { bob: -1, front: [24, 40], back: [24, 45], hand: [26, 27] }),
    ],
    jump: [f(100, { bob: -1, front: [28, 41], back: [21, 43], hand: [29, 13] })],
    fall: [
      f(120, { bob: 0, front: [27, 44], back: [21, 45], hand: [31, 21] }),
      f(120, { bob: 0, front: [27, 45], back: [21, 44], hand: [31, 20] }),
    ],
    throw: [
      f(40, { bob: 0, front: [28, 45], back: [20, 45], hand: [20, 13], armBehindHead: true, holding: true }),
      f(90, { bob: 0, front: [28, 45], back: [20, 45], hand: [34, 19] }),
      f(90, { bob: 1, front: [28, 45], back: [20, 45], hand: [31, 26] }),
    ],
    hurt: [f(200, { bob: 1, front: [25, 45], back: [20, 45], hand: [30, 14], hurt: true })],
    talk: [
      f(160, { bob: 0, ...stand, hand: [26, 27], mouth: 'open' }),
      f(160, { bob: 0, ...stand, hand: [26, 27] }),
    ],
  }, 'tinta');
}

function drawMaruja(p: Pixels, ox: number, oy: number, bob: number, mouthOpen: boolean) {
  const R = (x: number, y: number, w: number, h: number, c: Parameters<Pixels['rect']>[4]) => p.rect(ox + x, oy + y, w, h, c);

  // Carrito de la compra
  R(31, 31, 7, 12, 'vino');
  R(33, 31, 1, 12, 'alarma');
  R(36, 31, 1, 12, 'alarma');
  R(31, 35, 7, 1, 'alarma');
  R(31, 39, 7, 1, 'ladrillo');
  R(30, 27, 1, 17, 'hormigon');
  p.circle(ox + 34, oy + 44, 2, 'sombra');
  R(34, 44, 1, 1, 'piedra');

  // Piernas y zapatos
  R(21, 42, 2, 3, 'melocoton');
  R(25, 42, 2, 3, 'melocoton');
  R(20, 45, 4, 2, 'tierra');
  R(24, 45, 4, 2, 'tierra');

  // Bata de flores
  R(20, 27 + bob, 9, 8, 'azulejo');
  R(19, 34, 11, 8, 'azulejo');
  R(19, 34, 2, 8, 'azulejo-oscuro');
  R(20, 27 + bob, 2, 7, 'azulejo-oscuro');
  for (let y = 28; y < 41; y += 3) for (let x = 21 + (y % 2); x < 29; x += 3) R(x, y, 1, 1, 'celeste-sucio');
  R(25, 36, 3, 2, 'azulejo-oscuro');

  // Brazo al asa del carrito
  p.line(ox + 26, oy + 28 + bob, ox + 29, oy + 30, 'azulejo', 2);
  R(29, 29, 2, 2, 'albaricoque');

  // Cabeza, un poco adelantada
  R(22, 19 + bob, 7, 8, 'albaricoque');
  R(23, 26 + bob, 5, 1, 'terracota');
  R(21, 17 + bob, 8, 3, 'cal');
  R(21, 20 + bob, 2, 4, 'cal');
  R(21, 14 + bob, 4, 3, 'arena-gris');
  R(25, 21 + bob, 4, 1, 'hormigon-oscuro');
  R(27, 22 + bob, 1, 1, 'tinta');
  R(29, 23 + bob, 1, 1, 'albaricoque');
  R(26, 24 + bob, 1, 1, 'terracota');
  R(26, 25 + bob, 2, 1, mouthOpen ? 'tinta' : 'terracota-oscura');
}

function marujaSheet(scene: Phaser.Scene) {
  const f = (ms: number, bob: number, mouth: boolean): FrameSpec => ({ ms, draw: (p, ox, oy) => drawMaruja(p, ox, oy, bob, mouth) });
  buildSheet(scene, 'maruja', 48, 48, {
    idle: [f(600, 0, false), f(600, 1, false)],
    talk: [f(140, 0, true), f(140, 0, false), f(140, 1, true), f(180, 1, false)],
  }, 'tinta');
}

export const BAR_W = 160;
export const BAR_H = 112;

function drawBarManolo(p: Pixels, ox: number) {
  const rand = rng(7);
  // La planta baja empieza en y=56: las coordenadas de abajo están escritas relativas a 92 y se desplazan.
  const G = -36;
  const R = (x: number, y: number, w: number, h: number, c: Parameters<Pixels['rect']>[4]) => p.rect(ox + x, y, w, h, c);
  const RG = (x: number, y: number, w: number, h: number, c: Parameters<Pixels['rect']>[4]) => R(x, y + G, w, h, c);

  // Tejado, alero y chimenea
  R(116, 0, 10, 10, 'ladrillo');
  R(115, 0, 12, 2, 'hormigon-oscuro');
  R(0, 8, 160, 7, 'terracota-oscura');
  for (let x = 0; x < 160; x += 4) R(x, 8, 1, 7, 'ladrillo');
  R(0, 8, 160, 1, 'terracota');
  R(0, 15, 160, 2, 'tierra');

  // Fachada de mortero con desconchones
  R(2, 17, 156, 39, 'mostaza');
  p.speckle(ox + 2, 17, 156, 39, 'ocre', 0.07, rand);
  p.speckle(ox + 2, 17, 156, 39, 'trigo', 0.03, rand);
  for (const [px, py, pw, ph] of [[8, 40, 9, 6], [140, 22, 8, 5], [60, 18, 6, 4]]) {
    R(px, py, pw, ph, 'ladrillo');
    for (let y = py + 1; y < py + ph; y += 2) R(px, y, pw, 1, 'terracota-oscura');
  }
  R(2, 54, 156, 1, 'ocre');
  R(2, 55, 156, 1, 'trigo');

  // Balcones: una planta, tres huecos
  for (const fy of [18]) {
    for (const wx of [22, 70, 118]) {
      R(wx - 4, fy + 6, 4, 22, 'oliva');
      R(wx + 16, fy + 6, 4, 22, 'oliva');
      for (let y = fy + 7; y < fy + 28; y += 2) {
        R(wx - 4, y, 4, 1, 'oliva-oscuro');
        R(wx + 16, y, 4, 1, 'oliva-oscuro');
      }
      R(wx, fy + 4, 16, 24, 'cal');
      R(wx + 2, fy + 6, 12, 22, 'noche');
      R(wx + 7, fy + 6, 2, 22, 'cal');
      R(wx + 3, fy + 7, 2, 6, 'pizarra');
      R(wx - 6, fy + 28, 28, 2, 'arena-gris');
      R(wx - 6, fy + 20, 28, 1, 'tinta');
      for (let x = wx - 6; x < wx + 22; x += 3) R(x, fy + 21, 1, 7, 'tinta');
    }
  }
  R(18, 35, 3, 3, 'terracota');
  R(18, 33, 3, 2, 'oliva');
  R(131, 35, 3, 3, 'terracota');
  R(131, 33, 3, 1, 'alarma');

  // Planta baja: la taberna
  RG(2, 92, 156, 52, 'vino');
  RG(2, 92, 156, 2, 'ladrillo');

  // Rótulo
  const label = 'BAR MANOLO';
  RG(8, 94, 84, 13, 'papel');
  RG(9, 95, 82, 11, 'ladrillo');
  drawText(p, label, ox + 8 + Math.floor((84 - measureText(label)) / 2), 97 + G - CAP_TOP, 'trigo');

  // Toldo de rayas
  for (let x = 6; x < 94; x++) RG(x, 108, 1, 7, Math.floor((x - 6) / 4) % 2 ? 'cal' : 'oliva');
  for (let x = 6; x < 94; x += 4) RG(x, 115, 2, 1, 'oliva');

  // Escaparate con luz cálida
  RG(8, 117, 84, 23, 'tierra');
  RG(10, 118, 80, 21, 'trigo');
  RG(10, 118, 80, 2, 'mostaza');
  for (let x = 14; x < 86; x += 5) RG(x, 120, 2, 4, x % 3 ? 'oliva-oscuro' : 'tierra');
  RG(10, 124, 80, 1, 'cuero');
  RG(72, 127, 6, 7, 'sombra');
  RG(73, 124, 4, 4, 'sombra');
  RG(10, 134, 80, 5, 'cuero');
  RG(10, 134, 80, 1, 'ocre');
  drawText(p, 'CAÑA+TAPA 2€', ox + 14, 126 + G - CAP_TOP, 'vino');

  // Puerta
  RG(102, 98, 24, 46, 'tierra');
  RG(104, 100, 20, 44, 'cuero');
  RG(106, 102, 16, 16, 'trigo');
  RG(113, 102, 2, 16, 'cuero');
  RG(106, 122, 16, 20, 'tierra');
  RG(120, 124, 2, 3, 'mostaza');

  // Pizarra con el menú
  RG(132, 112, 20, 22, 'cuero');
  RG(133, 113, 18, 20, 'sombra');
  const chalk = rng(3);
  for (let y = 116; y < 131; y += 3) RG(135, y, 4 + Math.floor(chalk() * 10), 1, 'cal');

  // Zócalo de azulejo
  RG(2, 140, 100, 4, 'azulejo');
  for (let x = 3; x < 102; x += 3) RG(x, 141, 1, 1, 'cal');
  RG(126, 140, 32, 4, 'azulejo');
  for (let x = 127; x < 158; x += 3) RG(x, 141, 1, 1, 'cal');
}

function barSheet(scene: Phaser.Scene) {
  buildSheet(scene, 'bar-manolo', BAR_W, BAR_H, {
    original: [{ ms: 1000, draw: (p, ox) => drawBarManolo(p, ox) }],
  });
}

function propTextures(scene: Phaser.Scene) {
  buildTexture(scene, 'paquete', 7, 7, (p) => {
    p.rect(1, 1, 5, 5, 'cuero');
    p.rect(1, 1, 5, 1, 'ocre');
    p.rect(3, 1, 1, 5, 'trigo');
    p.outline(0, 0, 7, 7, 'tinta');
  });

  const board = (p: Pixels) => {
    p.rect(1, 1, 24, 13, 'papel');
    p.rect(1, 1, 24, 3, 'turquesa');
    drawText(p, 'PLAN', 1 + Math.floor((24 - measureText('PLAN')) / 2), 6 - CAP_TOP, 'turquesa');
  };
  buildTexture(scene, 'cartel', 26, 37, (p) => {
    p.rect(12, 14, 2, 21, 'hormigon');
    p.rect(9, 33, 8, 2, 'hormigon-oscuro');
    board(p);
    p.outline(0, 0, 26, 37, 'tinta');
  });
  buildTexture(scene, 'cartel-roto', 26, 37, (p) => {
    p.rect(12, 26, 2, 9, 'hormigon');
    p.px(13, 25, 'hormigon');
    p.rect(9, 33, 8, 2, 'hormigon-oscuro');
    p.rect(14, 27, 4, 3, 'papel');
    p.px(17, 30, 'papel');
    p.outline(0, 0, 26, 37, 'tinta');
  });

  // Partículas: blancas para teñirlas al emitir
  buildTexture(scene, 'px2', 2, 2, (p) => p.rect(0, 0, 2, 2, 0xffffff));
  buildTexture(scene, 'polvo', 3, 3, (p) => {
    p.rect(1, 0, 1, 3, 0xffffff);
    p.rect(0, 1, 3, 1, 0xffffff);
  });
}

/** Crea los placeholders de todo lo que no tenga arte hecho a mano. */
export function buildPlaceholders(scene: Phaser.Scene, provided: Set<string>) {
  if (!provided.has('pablo')) pabloSheet(scene);
  if (!provided.has('maruja')) marujaSheet(scene);
  if (!provided.has('bar-manolo')) barSheet(scene);
  propTextures(scene);
}
