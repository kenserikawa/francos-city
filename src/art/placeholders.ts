import Phaser from 'phaser';
import { Pixels, rng, type Color } from './pixels';
import { buildSheet, buildTexture, type FrameSpec } from './sprites';
import { drawText, measureText, CAP_TOP } from './font';

/*
 * Placeholders procedurales con la dirección de arte del juego: piezas con contorno negro propio,
 * cabezas grandes, gestos raros. Sirven de referencia para el arte a mano y se sustituyen solos
 * en cuanto existe src/assets/sprites/<clave>.png.
 */

type Pt = [number, number];
const FRAME = 48;

// ---------------------------------------------------------------- caras (filas de caracteres)

const FACE_MAP: Record<string, Color> = {
  s: 'terracota', S: 'terracota-oscura', l: 'albaricoque', w: 'papel', K: 'tinta', v: 'vino', g: 'celeste-sucio',
};

type Mouth = 'smirk' | 'open' | 'flat';
type Eyes = 'open' | 'blink' | 'down' | 'squint';

/** Cara de Pablo de 3/4 (15×12): ceja escéptica, ojeras, nariz de bulbo, barba de tres días. */
function face3q(eyes: Eyes, mouth: Mouth): string[] {
  const rows = [
    '..ssssssssss...',
    '.ssssssssKKKs..',
    '.sKKKssssssss..',
    '.swwKsssswKss..',
    '.ssSSssssSSss..',
    '.sssssssssslSs.',
    '.sssssssssslsss',
    '.ssssssssssSSs.',
    '.SssssssssKs...',
    '.SssssKKKKss...',
    '..SsSsSsSss....',
    '...SSSSSSS.....',
  ];
  if (eyes === 'blink') rows[3] = '.sKKKssssKKss..';
  if (eyes === 'down') {
    rows[3] = '.swwwsssswwss..';
    rows[4] = '.ssKSssssKSss..';
  }
  if (mouth === 'open') {
    rows[8] = '.Ssssssssssss..';
    rows[10] = '..SsSsKvvKs....';
  }
  if (mouth === 'flat') rows[8] = '.Ssssssssssss..';
  return rows;
}

/** Cara de Pablo de perfil (12×11). */
function faceSide(eyes: Eyes, mouth: Mouth): string[] {
  const rows = [
    '..sssss.....',
    '.ssssssKKK..',
    '.ssssssswKs.',
    '.ssssssSSss.',
    '.sssssssssl.',
    '.ssssssssssl',
    '.sssssssssSS',
    '.SssssssSSs.',
    '.SsssssKKss.',
    '..SsSsSsss..',
    '...SSSSSS...',
  ];
  if (eyes === 'squint') rows[2] = '.ssssssKKKs.';
  if (mouth === 'open') {
    rows[8] = '.SssssKKKss.';
    rows[9] = '..SsSsKvKs..';
  }
  return rows;
}

// ---------------------------------------------------------------- piezas de Pablo

/** Pelo rizado: una nube de bultos con brillo arriba y rizos marcados. */
function curls(q: Pixels, main: [number, number, number, number], bumps: [number, number, number][]) {
  const [cx, cy, rx, ry] = main;
  q.ellipse(cx, cy, rx, ry, 'tierra');
  for (const [bx, by, r] of bumps) q.circle(bx, by, r, 'tierra');
  for (const [bx, by, r] of bumps) {
    q.rect(bx - 1, by - r + 1, 2, 1, 'cuero');
    q.px(bx + 1, by + 1, 'sombra');
  }
}

function backpack(p: Pixels, ox: number, x: number, y: number, side: 'left' | 'none') {
  p.part(ox, 0, FRAME, FRAME, (q) => {
    q.rect(x, y, 13, 18, 'amarillo');
    q.rect(x, y, 13, 2, 'trigo');
    if (side === 'left') {
      q.rect(x, y, 3, 18, 'mostaza');
      q.vline(x + 3, y, 18, 'tinta');
    }
    q.hline(x, y + 2, 13, 'tinta');
    q.rect(x + 3, y + 16, 10, 2, 'mostaza');
    // logo de la app: un rayo
    q.pattern(x + 7, y + 6, ['.K', 'KK', '.K', 'K.'], { K: 'tinta' });
  });
}

function shoe(p: Pixels, ox: number, ankle: Pt) {
  const [ax, ay] = ankle;
  p.part(ox, 0, FRAME, FRAME, (q) => {
    q.rect(ax - 2, ay, 7, 3, 'cal');
    q.rect(ax - 2, ay + 3, 7, 1, 'piedra');
    q.rect(ax, ay + 1, 3, 1, 'alarma');
  });
}

function leg(p: Pixels, ox: number, hip: Pt, ankle: Pt, pants: Color) {
  p.part(ox, 0, FRAME, FRAME, (q) => q.line(hip[0] - 1, hip[1], ankle[0] - 1, ankle[1] - 2, pants, 3));
  shoe(p, ox, ankle);
}

function hand(q: Pixels, x: number, y: number) {
  q.rect(x - 1, y - 1, 3, 3, 'terracota');
  q.px(x + 1, y + 1, 'terracota-oscura');
}

// ---------------------------------------------------------------- Pablo de 3/4 (quieto, hablando)

interface Pose3q {
  bob: number;
  eyes?: Eyes;
  mouth?: Mouth;
  phone?: 'low' | 'mid' | 'up';
  scroll?: boolean;
}

function drawPablo3q(p: Pixels, ox: number, pose: Pose3q) {
  const b = pose.bob;
  const phone = pose.phone ?? 'low';

  backpack(p, ox, 7, 14 + b, 'left');

  const farArm = () =>
    p.part(ox, 0, FRAME, FRAME, (q) => {
      const target: Pt = phone === 'low' ? [31, 31 + b] : phone === 'mid' ? [33, 26 + b] : [32, 23 + b];
      q.line(28, 23 + b, target[0] - 1, target[1] - 1, 'oliva', 3);
      hand(q, target[0], target[1]);
      const [px, py] = phone === 'low' ? [32, 28 + b] : [target[0] + 1, target[1] - 5];
      q.rect(px, py, 3, 5, 'noche');
      if (pose.scroll) q.px(px + 1, py + 2, 'celeste-sucio');
    });
  if (phone === 'low') farArm();

  leg(p, ox, [28, 33], [28, 43], 'noche');
  leg(p, ox, [21, 33], [20, 43], 'pizarra');

  // Cuello y sudadera
  p.part(ox, 0, FRAME, FRAME, (q) => {
    q.rect(24, 19 + b, 4, 3, 'terracota-oscura');
    q.rect(18, 22 + b, 12, 13 - b, 'oliva');
    q.rect(17, 31, 14, 4, 'oliva');
    q.rect(27, 22 + b, 3, 13 - b, 'oliva-oscuro');
    q.rect(19, 21 + b, 10, 2, 'oliva-oscuro');
    q.hline(20, 30, 8, 'tinta');
    q.vline(24, 23 + b, 7 - b, 'oliva-oscuro');
    q.rect(25, 24 + b, 2, 2, 'amarillo');
  });

  // Brazo cercano, colgando con desgana
  p.part(ox, 0, FRAME, FRAME, (q) => {
    q.line(15, 23 + b, 15, 29 + b, 'oliva', 3);
    q.vline(15, 24 + b, 4, 'olivo-claro');
    hand(q, 16, 32 + b);
  });

  // Pelo, oreja con auricular, cara, flequillo
  p.part(ox, 0, FRAME, FRAME, (q) =>
    curls(q, [23, 9 + b, 9, 6], [[15, 9 + b, 3], [16, 4 + b, 3], [21, 2 + b, 3], [27, 2 + b, 3], [31, 5 + b, 3], [14, 14 + b, 3], [24, 1 + b, 2]]),
  );
  p.part(ox, 0, FRAME, FRAME, (q) => {
    q.rect(17, 12 + b, 3, 4, 'terracota');
    q.px(18, 13 + b, 'terracota-oscura');
    q.px(18, 14 + b, 'papel');
  });
  p.part(ox, 0, FRAME, FRAME, (q) =>
    q.pattern(20, 8 + b, face3q(pose.eyes ?? 'open', pose.mouth ?? 'smirk'), FACE_MAP),
  );
  p.part(ox, 0, FRAME, FRAME, (q) => {
    for (const [cx, cy] of [[21, 6], [25, 5], [29, 6]] as Pt[]) {
      q.circle(cx, cy + b, 2, 'tierra');
      q.px(cx - 1, cy - 1 + b, 'cuero');
    }
  });

  if (phone !== 'low') farArm();
}

// ---------------------------------------------------------------- Pablo de perfil (corre, salta, lanza)

interface PoseSide {
  bob: number;
  front: Pt;
  back: Pt;
  hand: Pt;
  armBehindHead?: boolean;
  holding?: boolean;
  hurt?: boolean;
}

function drawPabloSide(p: Pixels, ox: number, pose: PoseSide) {
  const b = pose.bob;

  leg(p, ox, [22, 33 + b], pose.back, 'noche');
  backpack(p, ox, 7, 15 + b, 'none');

  p.part(ox, 0, FRAME, FRAME, (q) => {
    q.rect(25, 19 + b, 4, 3, 'terracota-oscura');
    q.rect(19, 22 + b, 10, 12, 'oliva');
    q.rect(19, 22 + b, 3, 12, 'oliva-oscuro');
    q.rect(21, 21 + b, 7, 2, 'oliva-oscuro');
    q.vline(27, 23 + b, 8, 'olivo-claro');
    q.line(20, 22 + b, 22, 31 + b, 'tinta');
    q.rect(25, 26 + b, 1, 1, 'amarillo');
  });

  leg(p, ox, [26, 33 + b], pose.front, 'pizarra');

  const arm = () =>
    p.part(ox, 0, FRAME, FRAME, (q) => {
      const [hx, hy] = [pose.hand[0], pose.hand[1] + b];
      q.line(24, 23 + b, hx - 1, hy - 1, 'oliva', 3);
      hand(q, hx, hy);
      if (pose.holding) {
        q.rect(hx - 2, hy - 5, 5, 4, 'cuero');
        q.vline(hx, hy - 5, 4, 'trigo');
      }
    });
  if (pose.armBehindHead) arm();

  const puff = pose.hurt ? 1 : 0;
  p.part(ox, 0, FRAME, FRAME, (q) =>
    curls(q, [23, 9 + b, 8 + puff, 6 + puff], [[16, 8 + b, 3], [16, 13 + b, 2], [17, 4 + b, 3], [22, 2 + b - puff, 3], [28, 3 + b - puff, 3], [31, 6 + b, 2], [23, 1 + b - puff, 2]]),
  );
  p.part(ox, 0, FRAME, FRAME, (q) => q.pattern(23, 8 + b, faceSide(pose.hurt ? 'squint' : 'open', pose.hurt ? 'open' : 'smirk'), FACE_MAP));
  p.part(ox, 0, FRAME, FRAME, (q) => {
    q.rect(24, 12 + b, 3, 4, 'terracota');
    q.px(25, 13 + b, 'terracota-oscura');
    q.px(25, 14 + b, 'papel');
  });
  p.part(ox, 0, FRAME, FRAME, (q) => {
    for (const [cx, cy] of [[26, 7], [30, 8]] as Pt[]) {
      q.circle(cx, cy + b, 2, 'tierra');
      q.px(cx - 1, cy - 1 + b, 'cuero');
    }
  });

  if (!pose.armBehindHead) arm();
}

function pabloSheet(scene: Phaser.Scene) {
  const q = (ms: number, pose: Pose3q): FrameSpec => ({ ms, draw: (p, ox) => drawPablo3q(p, ox, pose) });
  const s = (ms: number, pose: PoseSide): FrameSpec => ({ ms, draw: (p, ox) => drawPabloSide(p, ox, pose) });
  const stand = { front: [29, 43] as Pt, back: [21, 43] as Pt };
  buildSheet(scene, 'pablo', FRAME, FRAME, {
    idle: [
      q(420, { bob: 0 }),
      q(420, { bob: 1 }),
      q(420, { bob: 0 }),
      q(300, { bob: 1 }),
      q(110, { bob: 1, eyes: 'blink' }),
      q(420, { bob: 0 }),
    ],
    aburrido: [
      q(140, { bob: 0, phone: 'mid' }),
      q(700, { bob: 0, phone: 'up', eyes: 'down', mouth: 'flat' }),
      q(500, { bob: 0, phone: 'up', eyes: 'down', mouth: 'flat', scroll: true }),
      q(700, { bob: 1, phone: 'up', eyes: 'blink', mouth: 'open' }),
      q(140, { bob: 0, phone: 'mid' }),
    ],
    run: [
      s(80, { bob: 0, front: [32, 43], back: [17, 41], hand: [20, 30] }),
      s(80, { bob: 1, front: [29, 43], back: [19, 39], hand: [21, 31] }),
      s(80, { bob: -1, front: [25, 43], back: [24, 37], hand: [25, 31] }),
      s(80, { bob: 0, front: [17, 41], back: [32, 43], hand: [30, 29] }),
      s(80, { bob: 1, front: [19, 39], back: [29, 43], hand: [29, 30] }),
      s(80, { bob: -1, front: [24, 37], back: [25, 43], hand: [25, 31] }),
    ],
    jump: [s(100, { bob: -1, front: [30, 39], back: [21, 41], hand: [30, 13] })],
    fall: [
      s(120, { bob: 0, front: [29, 42], back: [21, 43], hand: [33, 22] }),
      s(120, { bob: 0, front: [29, 43], back: [21, 42], hand: [33, 21] }),
    ],
    throw: [
      s(40, { bob: 0, ...stand, hand: [18, 15], armBehindHead: true, holding: true }),
      s(90, { bob: 0, ...stand, hand: [37, 22] }),
      s(90, { bob: 1, ...stand, hand: [33, 30] }),
    ],
    hurt: [s(200, { bob: 1, front: [27, 43], back: [21, 43], hand: [31, 12], hurt: true })],
    talk: [
      q(140, { bob: 0, mouth: 'open' }),
      q(140, { bob: 0, mouth: 'flat' }),
      q(140, { bob: 0, mouth: 'open' }),
      q(180, { bob: 0 }),
    ],
  });
}

// ---------------------------------------------------------------- Doña Maruja

interface MarujaPose {
  bob: number;
  wobble: number;
  mouthOpen?: boolean;
  pointing?: boolean;
}

function drawMaruja(p: Pixels, ox: number, pose: MarujaPose) {
  const b = pose.bob;
  const P = (draw: (q: Pixels) => void) => p.part(ox, 0, FRAME, FRAME, draw);

  // Pantuflas de borla y piernecillas
  P((q) => q.rect(20, 41, 2, 4, 'melocoton'));
  P((q) => q.rect(25, 41, 2, 4, 'melocoton'));
  P((q) => {
    q.rect(17, 44, 6, 3, 'rosa-influencer');
    q.px(18, 44, 'papel');
  });
  P((q) => {
    q.rect(24, 44, 6, 3, 'rosa-influencer');
    q.px(25, 44, 'papel');
  });

  // Bata de flores, más ancha por abajo
  P((q) => {
    for (let y = 24 + b; y <= 42; y++) {
      const grow = Math.floor((y - 24) / 5);
      q.rect(19 - grow, y, 11 + grow * 2, 1, 'azulejo');
    }
    for (let y = 26 + b; y < 42; y += 3) {
      for (let x = 17 + (y % 2); x < 31; x += 3) q.px(x, y, (x + y) % 2 ? 'celeste-sucio' : 'rosa-influencer');
    }
    q.rect(21, 24 + b, 7, 2, 'cal');
    q.hline(18, 32, 13, 'azulejo-oscuro');
    q.hline(20, 36, 4, 'tinta');
  });

  // Brazo en jarras o señalando al cielo ("¡A medir!")
  P((q) => {
    if (pose.pointing) {
      q.line(19, 26 + b, 15, 19 + b, 'azulejo', 2);
      q.rect(14, 16 + b, 2, 3, 'albaricoque');
    } else {
      q.line(19, 26 + b, 15, 30 + b, 'azulejo', 2);
      q.line(15, 30 + b, 18, 33, 'azulejo', 2);
    }
  });

  // Moño torre (absurdamente alto) y cara con gafas de culo de vaso
  const w = pose.wobble;
  const roll = (cx: number, cy: number, rx: number, ry: number) =>
    P((q) => {
      q.ellipse(cx, cy, rx, ry, 'arena-gris');
      q.hline(cx - rx + 2, cy - ry + 1, rx, 'cal');
      q.hline(cx - rx + 2, cy + ry - 1, rx * 2 - 3, 'piedra');
    });
  roll(23, 14 + b, 6, 3);
  roll(23 + w, 10 + b, 5, 2);
  roll(23 + w, 6 + b, 4, 2);
  P((q) => {
    q.circle(24 + w, 2 + b, 2, 'arena-gris');
    q.px(23 + w, 1 + b, 'cal');
  });
  P((q) => q.rect(27 + w, 3 + b, 3, 1, 'alarma'));
  P((q) => {
    q.ellipse(24, 20 + b, 5, 4, 'albaricoque');
    q.rect(29, 20 + b, 2, 2, 'albaricoque');
    q.px(21, 22 + b, 'terracota');
    q.hline(24, 23 + b, 3, pose.mouthOpen ? 'tinta' : 'terracota-oscura');
    if (pose.mouthOpen) q.hline(24, 24 + b, 3, 'vino');
  });
  P((q) => {
    q.circle(22, 19 + b, 2, 'celeste-sucio');
    q.circle(27, 19 + b, 2, 'celeste-sucio');
    q.px(23, 19 + b, 'tinta');
    q.px(28, 19 + b, 'tinta');
    q.px(21, 18 + b, 'papel');
    q.px(26, 18 + b, 'papel');
  });

  // Brazo al carrito y carrito con barra de pan
  P((q) => {
    q.line(28, 26 + b, 32, 29, 'azulejo', 2);
    q.rect(32, 28, 2, 2, 'albaricoque');
  });
  P((q) => q.line(37, 28, 41, 19, 'ocre', 2));
  P((q) => {
    q.rect(33, 27, 10, 15, 'vino');
    for (let x = 35; x < 43; x += 3) q.vline(x, 27, 15, 'alarma');
    for (let y = 30; y < 42; y += 4) q.hline(33, y, 10, 'alarma');
    q.hline(33, 27, 10, 'tinta');
  });
  P((q) => q.vline(34, 22, 6, 'hormigon'));
  P((q) => q.circle(35, 44, 2, 'sombra'));
  P((q) => q.circle(41, 44, 2, 'sombra'));
}

function marujaSheet(scene: Phaser.Scene) {
  const f = (ms: number, pose: MarujaPose): FrameSpec => ({ ms, draw: (p, ox) => drawMaruja(p, ox, pose) });
  buildSheet(scene, 'maruja', FRAME, FRAME, {
    idle: [f(600, { bob: 0, wobble: 0 }), f(500, { bob: 1, wobble: 1 }), f(600, { bob: 0, wobble: 0 }), f(500, { bob: 1, wobble: -1 })],
    talk: [
      f(140, { bob: 0, wobble: 0, mouthOpen: true, pointing: true }),
      f(140, { bob: 0, wobble: 1, pointing: true }),
      f(140, { bob: 1, wobble: 0, mouthOpen: true }),
      f(180, { bob: 1, wobble: -1 }),
    ],
  });
}

// ---------------------------------------------------------------- Bar Manolo

export const BAR_W = 160;
export const BAR_H = 112;

function drawBarManolo(p: Pixels, ox: number) {
  const rand = rng(7);
  const P = (draw: (q: Pixels) => void) => p.part(ox, 0, BAR_W, BAR_H, draw);

  // Silueta del edificio: tejado, chimenea torcida y fachada
  P((q) => {
    q.rect(112, 0, 8, 4, 'ladrillo');
    q.rect(114, 4, 8, 4, 'ladrillo');
    q.rect(0, 8, 160, 7, 'terracota-oscura');
    for (let x = 0; x < 160; x += 4) q.vline(x, 9, 6, 'ladrillo');
    q.hline(0, 8, 160, 'terracota');
    q.rect(0, 15, 160, 2, 'tierra');
    q.rect(2, 17, 156, 95, 'mostaza');
    q.speckle(2, 17, 156, 39, 'ocre', 0.025, rand);
    q.hline(2, 55, 156, 'tinta');
  });
  // Antena de tele torcida
  P((q) => {
    q.line(30, 8, 34, 1, 'sombra');
    q.hline(29, 2, 9, 'sombra');
    q.hline(31, 4, 6, 'sombra');
  });
  // Desconchones
  for (const [x, y, w, h] of [[8, 40, 9, 6], [140, 22, 8, 5]]) {
    P((q) => {
      q.rect(x, y, w, h, 'ladrillo');
      for (let j = y + 1; j < y + h; j += 2) q.hline(x, j, w, 'terracota-oscura');
    });
  }

  // Planta de arriba: balcones con contraventanas y unos calzoncillos tendidos
  for (const wx of [22, 70, 118]) {
    P((q) => {
      q.box(wx - 5, 23, 5, 23, 'oliva');
      q.box(wx + 16, 23, 5, 23, 'oliva');
      for (let y = 25; y < 45; y += 2) {
        q.hline(wx - 4, y, 3, 'oliva-oscuro');
        q.hline(wx + 17, y, 3, 'oliva-oscuro');
      }
    });
    P((q) => {
      q.box(wx, 21, 16, 26, 'cal');
      q.box(wx + 2, 23, 12, 24, 'noche');
      q.vline(wx + 8, 23, 24, 'tinta');
      q.rect(wx + 3, 24, 2, 6, 'pizarra');
    });
    P((q) => {
      q.rect(wx - 6, 46, 28, 3, 'arena-gris');
      q.hline(wx - 6, 37, 28, 'tinta');
      for (let x = wx - 6; x < wx + 22; x += 3) q.vline(x, 38, 8, 'tinta');
    });
  }
  P((q) => {
    q.hline(64, 31, 34, 'tinta');
    q.rect(72, 32, 8, 6, 'rosa-influencer');
    q.rect(72, 36, 3, 3, 'rosa-influencer');
    q.rect(77, 36, 3, 3, 'rosa-influencer');
    q.px(75, 34, 'papel');
    q.rect(84, 32, 4, 7, 'papel');
  });

  // Planta baja: la taberna
  P((q) => q.rect(2, 56, 156, 56, 'vino'));

  // Rótulo con la O caída
  P((q) => {
    q.box(8, 58, 84, 14, 'ladrillo');
    q.hline(9, 59, 82, 'papel');
    const label = 'BAR MANOL';
    const lx = 8 + Math.floor((84 - measureText('BAR MANOLO')) / 2);
    drawText(q, label, lx, 62 - CAP_TOP, 'trigo');
    drawText(q, 'O', lx + measureText(label) + 2, 64 - CAP_TOP, 'trigo');
  });

  // Toldo de rayas con un gato durmiendo encima
  P((q) => {
    for (let x = 6; x < 94; x++) q.vline(x, 74, 6, Math.floor((x - 6) / 4) % 2 ? 'cal' : 'oliva');
    for (let x = 6; x < 94; x += 4) q.rect(x, 80, 2, 1, 'oliva');
  });
  P((q) => {
    q.ellipse(70, 71, 5, 2, 'cuero');
    q.rect(74, 68, 3, 3, 'cuero');
    q.px(74, 67, 'cuero');
    q.px(76, 67, 'cuero');
    q.hline(66, 72, 6, 'tierra');
  });

  // Escaparate: jamones colgando, oferta y un parroquiano de toda la vida
  P((q) => {
    q.box(8, 82, 84, 23, 'trigo');
    q.rect(9, 83, 82, 2, 'mostaza');
    q.rect(9, 99, 82, 5, 'cuero');
    q.hline(9, 99, 82, 'tinta');
  });
  for (const jx of [12, 24]) {
    P((q) => {
      q.vline(jx + 2, 83, 3, 'tinta');
      q.ellipse(jx + 2, 91, 3, 5, 'vino');
      q.rect(jx + 1, 86, 2, 2, 'cal');
      q.px(jx + 1, 92, 'terracota');
    });
  }
  P((q) => drawText(q, 'CAÑA+TAPA 2€', 34, 87 - CAP_TOP, 'vino'));
  P((q) => {
    q.rect(80, 95, 8, 4, 'sombra');
    q.circle(84, 93, 2, 'sombra');
  });

  // Puerta
  P((q) => {
    q.box(101, 62, 26, 50, 'cuero');
    q.box(105, 66, 18, 17, 'trigo');
    q.vline(113, 66, 17, 'tinta');
    q.box(105, 86, 18, 23, 'tierra');
    q.rect(121, 88, 2, 3, 'mostaza');
  });

  // Pizarra: "AQUÍ NO HAY BRUNCH"
  P((q) => {
    q.box(130, 74, 27, 31, 'cuero');
    q.rect(131, 75, 25, 29, 'sombra');
    drawText(q, 'AQUÍ', 133, 78 - CAP_TOP, 'cal');
    drawText(q, 'NO HAY', 133, 87 - CAP_TOP, 'cal');
    drawText(q, 'BRUNCH', 133, 96 - CAP_TOP, 'cal');
  });

  // Zócalo de azulejo
  P((q) => {
    q.rect(2, 106, 99, 6, 'azulejo');
    for (let x = 3; x < 100; x += 3) q.px(x, 108, 'cal');
    q.rect(127, 106, 31, 6, 'azulejo');
    for (let x = 128; x < 157; x += 3) q.px(x, 108, 'cal');
  });
}

function barSheet(scene: Phaser.Scene) {
  buildSheet(scene, 'bar-manolo', BAR_W, BAR_H, {
    original: [{ ms: 1000, draw: (p, ox) => drawBarManolo(p, ox) }],
  });
}

// ---------------------------------------------------------------- objetos

function propTextures(scene: Phaser.Scene) {
  buildTexture(scene, 'paquete', 9, 9, (p) => {
    p.part(0, 0, 9, 9, (q) => {
      q.rect(1, 1, 7, 7, 'cuero');
      q.rect(1, 1, 7, 2, 'ocre');
      q.vline(4, 1, 7, 'trigo');
      q.hline(1, 3, 7, 'tinta');
    });
  });

  buildTexture(scene, 'cartel', 28, 38, (p) => {
    p.part(0, 0, 28, 38, (q) => {
      q.rect(12, 15, 3, 20, 'hormigon');
      q.rect(9, 34, 9, 3, 'hormigon-oscuro');
    });
    p.part(0, 0, 28, 38, (q) => {
      q.box(1, 1, 26, 15, 'papel');
      q.rect(2, 2, 24, 3, 'turquesa');
      q.hline(2, 5, 24, 'tinta');
      drawText(q, 'PLAN', 1 + Math.floor((26 - measureText('PLAN')) / 2), 8 - CAP_TOP, 'turquesa');
    });
  });
  buildTexture(scene, 'cartel-roto', 28, 38, (p) => {
    p.part(0, 0, 28, 38, (q) => {
      q.rect(12, 27, 3, 8, 'hormigon');
      q.px(13, 26, 'hormigon');
      q.rect(9, 34, 9, 3, 'hormigon-oscuro');
    });
    p.part(0, 0, 28, 38, (q) => {
      q.rect(15, 28, 5, 3, 'papel');
      q.px(19, 31, 'papel');
    });
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
