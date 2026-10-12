import Phaser from 'phaser';
import { Pixels, rng, type Color } from './pixels';
import { drawText, measureText, CAP_TOP, LINE_H } from './font';
import { GAME_W, GAME_H, WORLD_W, FACADE_BASE_Y } from '../config';

/*
 * Calle de los Francos Viejos, procedural. Capas: cielo (fijo), skyline lejano y medio (parallax),
 * fachadas + acera (scroll 1). Cada edificio es un estrato del barrio y tiene su contorno negro;
 * ventanas, carteles y cachivaches llevan el suyo propio.
 */

export const PARALLAX = { far: 0.15, mid: 0.45 };
export const BAR_X = 520; // centro del Bar Manolo
export const MARUJA_X = 394;
export const LAMP_XS = [170, 432, 762, 1034];

const BASE = FACADE_BASE_Y;
const layerWidth = (factor: number) => Math.ceil(GAME_W + (WORLD_W - GAME_W) * factor);

type Draw = (q: Pixels) => void;

function wall(p: Pixels, x: number, y: number, w: number, h: number, base: Color, dirt: Color, rand: () => number, density = 0.02) {
  p.rect(x, y, w, h, base);
  p.speckle(x, y, w, h, dirt, density, rand);
}

function centeredText(p: Pixels, text: string, cx: number, capTop: number, c: Color) {
  drawText(p, text, Math.round(cx - measureText(text) / 2), capTop - CAP_TOP, c);
}

function win(p: Pixels, x: number, y: number, w: number, h: number) {
  p.box(x, y, w, h, 'noche');
  p.rect(x + 2, y + 2, 2, Math.min(4, h - 4), 'pizarra');
}

const AZULEJO_TILE = [
  'cdccccdc',
  'dmdccdmd',
  'cdcddcdc',
  'ccdaadcc',
  'ccdaadcc',
  'cdcddcdc',
  'dmdccdmd',
  'cdccccdc',
];
const AZULEJO_MAP: Record<string, Color> = { c: 'cal', d: 'azulejo-oscuro', m: 'mostaza', a: 'azulejo' };

function azulejoBand(p: Pixels, x: number, y: number, w: number) {
  for (let i = 0; i < w; i += 8) p.pattern(x + i, y, AZULEJO_TILE.map((r) => r.slice(0, Math.min(8, w - i))), AZULEJO_MAP);
  p.hline(x, y - 1, w, 'tinta');
  p.hline(x, y + 8, w, 'tinta');
}

function celosia(p: Pixels, x: number, y: number, w: number, h: number) {
  p.box(x - 1, y - 1, w + 2, h + 2, 'cuero');
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const bar = (i + j) % 4 === 0 || (i - j + 400) % 4 === 0;
      p.px(x + i, y + j, bar ? 'cuero' : 'noche');
    }
  }
}

/** Arco de herradura con alfiz (el marco rectangular andalusí). */
function horseshoeArch(p: Pixels, x: number, y: number, w: number, h: number, fill: Color, frame: Color) {
  const r = Math.floor(w / 2) + 1;
  const cx = x + Math.floor(w / 2);
  p.rect(x - 4, y - 3, w + 8, h + 3, 'tinta');
  p.rect(x - 3, y - 2, w + 6, h + 2, frame);
  p.rect(x - 2, y - 1, w + 4, h + 1, 'cal');
  p.circle(cx, y + r, r + 1, 'tinta');
  p.circle(cx, y + r, r, fill);
  p.rect(x, y + r, w, h - r, fill);
  p.rect(x - 1, y + r, 1, h - r, 'tinta');
  p.rect(x + w, y + r, 1, h - r, 'tinta');
}

function lamp(p: Pixels, x: number) {
  p.part(x - 7, 82, 16, 80, (q) => {
    const c = 7;
    q.rect(c - 3, 71, 7, 5, 'sombra');
    q.rect(c - 2, 69, 5, 2, 'sombra');
    q.rect(c, 22, 2, 47, 'sombra');
    q.rect(c - 1, 36, 4, 2, 'sombra');
    q.rect(c - 1, 54, 4, 2, 'sombra');
    q.rect(c - 3, 20, 8, 2, 'sombra');
    q.rect(c - 2, 10, 6, 10, 'trigo');
    q.rect(c - 3, 10, 1, 10, 'sombra');
    q.rect(c + 4, 10, 1, 10, 'sombra');
    q.rect(c, 10, 2, 10, 'amarillo');
    q.rect(c - 4, 7, 10, 3, 'sombra');
    q.rect(c, 4, 2, 3, 'sombra');
  });
}

// ---------------------------------------------------------------- edificios (x0 = borde izquierdo)

function bloqueObrero(p: Pixels, x0: number, w: number) {
  const rand = rng(11);
  const top = 8;
  const R = (x: number, y: number, ww: number, h: number, c: Color) => p.rect(x0 + x, y, ww, h, c);
  const part = (x: number, y: number, ww: number, h: number, d: Draw) => p.part(x0 + x, y, ww, h, d);

  wall(p, x0, top, w, BASE - top, 'hormigon', 'hormigon-oscuro', rand);
  R(0, top, w, 3, 'hormigon-oscuro');
  R(0, top + 3, w, 1, 'tinta');

  // Forjados y ventanas en serie, con la vida de cada piso asomando
  const floors: number[] = [];
  for (let fy = top + 6; fy < BASE - 40; fy += 20) floors.push(fy);
  floors.forEach((fy, fi) => {
    R(0, fy + 15, w, 3, 'piedra');
    R(0, fy + 18, w, 1, 'tinta');
    for (let wx = 6; wx + 12 < w - 30; wx += 22) {
      win(p, x0 + wx, fy + 3, 12, 11);
      const r = rand();
      if (r < 0.22) {
        R(wx - 2, fy + 14, 16, 1, 'tinta');
        const colors: Color[] = ['alarma', 'azulejo', 'amarillo', 'papel', 'rosa-influencer', 'oliva'];
        for (let i = 0; i < 4; i++) {
          const c = colors[Math.floor(rand() * colors.length)];
          part(wx - 1 + i * 4, fy + 14, 5, 5, (q) => q.rect(1, 1, 3, 2 + Math.floor(rand() * 2), c));
        }
      } else if (r < 0.3) {
        R(wx + 3, fy + 7, 1, 1, 'papel');
        R(wx + 6, fy + 7, 1, 1, 'papel');
      }
    }
    // Torre de aires acondicionados: uno por piso, apilados hasta el absurdo
    part(w - 28, fy + 2, 14, 12, (q) => {
      q.box(1, 1, 12, 9, 'cal');
      for (let y = 3; y < 9; y += 2) q.hline(3, y, 8, 'piedra');
    });
    if (fi > 0) R(w - 22, fy - 6, 1, 8, 'tinta');
  });
  for (let fx = 0; fx < w - 30; fx += 44) {
    R(fx, top + 4, 2, BASE - top - 34, 'piedra');
    R(fx + 2, top + 4, 1, BASE - top - 34, 'tinta');
  }

  // Parabólica descomunal
  part(w - 50, top + 30, 26, 24, (q) => {
    q.ellipse(12, 10, 10, 8, 'cal');
    q.ellipse(12, 10, 7, 5, 'arena-gris');
    q.line(12, 10, 20, 2, 'sombra');
    q.rect(19, 1, 3, 3, 'sombra');
    q.rect(11, 18, 3, 5, 'sombra');
  });

  // Planta baja: persiana con pintadas, "SE ALQUILA" y el portal de Pablo
  R(0, BASE - 32, w, 32, 'hormigon-oscuro');
  R(0, BASE - 33, w, 1, 'tinta');
  part(7, BASE - 29, 92, 30, (q) => {
    q.box(0, 0, 92, 30, 'piedra');
    for (let y = 2; y < 29; y += 2) q.hline(1, y, 90, 'hormigon');
    for (let i = 0; i < 7; i++) {
      const gx = 4 + Math.floor(rand() * 70), gy = 5 + Math.floor(rand() * 16);
      q.line(gx, gy, gx + 4 + Math.floor(rand() * 10), gy + Math.floor(rand() * 7) - 3, i % 2 ? 'rosa-influencer' : 'turquesa');
    }
  });
  part(26, BASE - 24, 52, 14, (q) => {
    q.box(1, 1, 50, 12, 'papel');
    centeredText(q, 'SE ALQUILA', 26, 4, 'alarma');
  });
  part(114, BASE - 32, 34, 32, (q) => {
    q.box(1, 1, 32, 31, 'cal');
    q.box(3, 3, 28, 29, 'noche');
    q.vline(16, 3, 29, 'tinta');
    q.rect(6, 6, 8, 10, 'pizarra');
  });
  part(150, BASE - 27, 12, 12, (q) => {
    q.box(1, 1, 10, 10, 'azulejo');
    centeredText(q, '3', 6, 3, 'cal');
  });
}

function andalusiNuevo(p: Pixels, x0: number, w: number) {
  const rand = rng(23);
  const top = 56;
  const R = (x: number, y: number, ww: number, h: number, c: Color) => p.rect(x0 + x, y, ww, h, c);
  const part = (x: number, y: number, ww: number, h: number, d: Draw) => p.part(x0 + x, y, ww, h, d);

  wall(p, x0, top, w, BASE - top, 'cal', 'arena-gris', rand);
  for (let mx = 2; mx < w; mx += 10) R(mx, top - 5, 6, 5, 'cal');
  R(0, top, w, 1, 'tinta');
  // Una cúpula ridículamente pequeña
  part(57, top - 18, 16, 14, (q) => {
    q.ellipse(7, 9, 5, 4, 'azulejo');
    q.rect(2, 9, 11, 4, 'azulejo');
    q.rect(6, 1, 2, 4, 'mostaza');
    q.px(6, 7, 'celeste-sucio');
  });

  part(23, top + 5, 82, 28, (q) => {
    q.box(1, 1, 80, 26, 'turquesa');
    q.rect(2, 2, 78, 1, 'papel');
    centeredText(q, 'CENTRO DE', 41, 6, 'papel');
    centeredText(q, 'INTERPRETACIÓN', 41, 17, 'papel');
  });
  celosia(p, x0 + 6, top + 10, 12, 20);
  celosia(p, x0 + 110, top + 10, 12, 20);
  celosia(p, x0 + 12, top + 40, 12, 16);
  celosia(p, x0 + 104, top + 40, 12, 16);
  azulejoBand(p, x0, BASE - 34, w);

  // Arco de herradura gigantesco... para una puerta diminuta
  horseshoeArch(p, x0 + 46, BASE - 46, 36, 46, 'azulejo-oscuro', 'azulejo');
  part(56, BASE - 18, 16, 18, (q) => {
    q.box(1, 1, 14, 17, 'cuero');
    q.px(11, 9, 'mostaza');
  });
  for (let i = 0; i < 6; i++) R(50 + i * 5, BASE - 34, 2, 2, 'mostaza');

  // QR en los azulejos: escanea tu identidad
  part(91, BASE - 25, 16, 16, (q) => {
    q.box(1, 1, 14, 14, 'papel');
    const qr = rng(5);
    for (let j = 3; j < 13; j++) for (let i = 3; i < 13; i++) if (qr() < 0.45) q.px(i, j, 'tinta');
    q.box(2, 2, 4, 4, 'papel');
    q.box(10, 2, 4, 4, 'papel');
    q.box(2, 10, 4, 4, 'papel');
  });

  for (const px of [4, 114]) {
    part(px - 1, BASE - 16, 12, 17, (q) => {
      q.rect(2, 8, 8, 8, 'terracota');
      q.ellipse(6, 5, 5, 3, 'oliva');
    });
  }
}

function casaMaruja(p: Pixels, x0: number, w: number) {
  const rand = rng(37);
  const top = 40;
  const R = (x: number, y: number, ww: number, h: number, c: Color) => p.rect(x0 + x, y, ww, h, c);
  const part = (x: number, y: number, ww: number, h: number, d: Draw) => p.part(x0 + x, y, ww, h, d);

  wall(p, x0, top, w, BASE - top, 'albaricoque', 'terracota', rand, 0.03);
  for (const [px, py, pw, ph] of [[8, 66, 12, 8], [104, 98, 10, 6], [30, 124, 8, 5]]) {
    part(px - 1, py - 1, pw + 2, ph + 2, (q) => {
      q.rect(1, 1, pw, ph, 'ladrillo');
      for (let y = 2; y < ph + 1; y += 2) q.hline(1, y, pw, 'terracota-oscura');
    });
  }
  // Cornisa
  R(0, top, w, 6, 'arena-gris');
  R(0, top + 2, w, 1, 'cal');
  R(0, top + 6, w, 1, 'tinta');

  // Balcones de forja; el del medio, torcido
  const fy = top + 12;
  [14, 60, 106].forEach((wx, i) => {
    part(wx - 3, fy - 6, 22, 6, (q) => {
      q.rect(1, 3, 20, 3, 'arena-gris');
      q.rect(8, 1, 6, 2, 'arena-gris');
    });
    part(wx - 1, fy - 1, 18, 31, (q) => {
      q.box(1, 1, 16, 29, 'cal');
      q.box(3, 3, 12, 27, 'noche');
      q.vline(8, 3, 27, 'tinta');
      q.rect(4, 4, 2, 7, 'pizarra');
    });
    const tilt = i === 1 ? 3 : 0;
    part(wx - 6, fy + 18, 30, 14, (q) => {
      q.rect(1, 10, 28, 3, 'arena-gris');
      q.line(1, 1 + tilt, 28, 1, 'tinta');
      for (let x = 1; x < 29; x += 2) q.line(x, 2 + Math.round(tilt * (1 - x / 28)), x, 9, 'tinta');
    });
  });
  // Demasiadas macetas
  for (let i = 0; i < 6; i++) {
    part(6 + i * 5, fy + 21, 6, 8, (q) => {
      q.rect(1, 4, 4, 3, 'terracota');
      q.rect(1, 1, 4, 3, i % 2 ? 'oliva' : 'alarma');
    });
  }
  // Sábana de protesta colgada del balcón torcido
  part(104, fy + 30, 30, 22, (q) => {
    q.rect(1, 1, 28, 18, 'papel');
    for (let x = 1; x < 29; x += 4) q.rect(x, 19, 2, 2, 'papel');
    centeredText(q, 'NO AL', 15, 4, 'alarma');
    centeredText(q, 'PLAN', 15, 12, 'alarma');
  });
  // Jaula con canario
  part(86, fy + 2, 10, 14, (q) => {
    q.vline(5, 1, 2, 'tinta');
    q.ellipse(5, 7, 3, 4, 'mostaza');
    q.ellipse(5, 7, 2, 3, 'noche');
    q.rect(4, 7, 2, 2, 'amarillo');
    for (let x = 3; x < 8; x += 2) q.vline(x, 4, 7, 'mostaza');
  });

  // Portada barroca
  const dx = 50;
  part(dx - 9, BASE - 66, 44, 67, (q) => {
    q.rect(3, 16, 36, 50, 'arena-gris');
    q.rect(3, 16, 2, 50, 'cal');
    q.rect(37, 16, 2, 50, 'piedra');
    q.rect(7, 10, 28, 6, 'arena-gris');
    q.rect(17, 6, 8, 4, 'arena-gris');
    q.circle(21, 4, 2, 'cal');
  });
  part(dx - 1, BASE - 45, 26, 46, (q) => {
    q.box(1, 1, 24, 45, 'tierra');
    q.box(2, 2, 10, 43, 'cuero');
    q.box(14, 2, 10, 43, 'cuero');
    for (const y of [7, 21]) {
      q.box(4, y, 6, 9, 'tierra');
      q.box(16, y, 6, 9, 'tierra');
    }
    q.rect(11, 19, 4, 3, 'mostaza');
  });
  part(dx + 33, BASE - 46, 12, 12, (q) => {
    q.box(1, 1, 10, 10, 'azulejo');
    centeredText(q, '9', 6, 3, 'cal');
  });
}

function muroMedianero(p: Pixels, x0: number, w: number) {
  wall(p, x0, 40, w, BASE - 40, 'hormigon', 'hormigon-oscuro', rng(41));
}

function edificioEnObras(p: Pixels, x0: number, w: number) {
  const rand = rng(53);
  const top = 22;
  const part = (x: number, y: number, ww: number, h: number, d: Draw) => p.part(x0 + x, y, ww, h, d);

  wall(p, x0, top, w, BASE - top, 'hormigon', 'hormigon-oscuro', rand);
  for (let fy = top + 8; fy < BASE - 30; fy += 24) for (let wx = 10; wx < w - 12; wx += 26) p.box(x0 + wx, fy, 12, 14, 'noche');
  p.dither(x0 + 4, top + 4, w - 8, 56, 'oliva-oscuro', 'oliva', 0.35);
  // Andamio: tubos y tablones, cada uno con su contorno
  for (let px = 4; px < w; px += 20) part(px - 1, top - 5, 3, BASE - top + 5, (q) => q.vline(1, 1, BASE - top + 3, 'mostaza'));
  for (let py = top + 2; py < BASE - 22; py += 24) part(-1, py - 1, w + 2, 4, (q) => q.rect(1, 1, w, 2, 'cuero'));

  // Lona del Plan
  part(18, top + 16, 124, 56, (q) => {
    q.box(1, 1, 122, 54, 'papel');
    q.rect(2, 2, 120, 52, 'turquesa');
    horseshoeArch(q, 9, 10, 8, 12, 'turquesa', 'papel');
    centeredText(q, 'PLAN DE', 68, 8, 'papel');
    centeredText(q, 'AUTENTICIDAD', 68, 8 + LINE_H, 'papel');
    centeredText(q, 'Recuperamos lo que', 62, 34, 'trigo');
    centeredText(q, 'siempre fuimos*', 62, 34 + LINE_H - 1, 'trigo');
  });

  // Valla de obra
  part(-1, BASE - 27, w + 2, 28, (q) => {
    q.box(0, 0, w + 2, 28, 'cal');
    for (let px = 32; px < w; px += 32) q.vline(px, 1, 26, 'tinta');
    q.rect(1, 2, w, 3, 'turquesa');
    centeredText(q, 'OBRA MUNICIPAL', 46, 10, 'turquesa');
    centeredText(q, 'Fin: próximamente', 104, 10, 'hormigon');
    for (let px = 1; px < w; px += 6) q.rect(px, 22, 3, 3, 'alarma');
  });
  // Retrete portátil
  part(132, BASE - 34, 18, 35, (q) => {
    q.box(1, 3, 16, 31, 'turquesa');
    q.rect(0, 1, 18, 3, 'turquesa');
    q.hline(0, 4, 18, 'tinta');
    q.box(4, 8, 10, 25, 'turquesa');
    centeredText(q, 'WC', 9, 11, 'papel');
  });
}

/** Una grúa que no se ve baja un arco de herradura sobre la obra: la autenticidad, instalada. */
function arcoColgante(p: Pixels, x: number) {
  p.vline(x, 0, 6, 'tinta');
  p.part(x - 9, 4, 19, 22, (q) => {
    q.rect(1, 1, 17, 20, 'azulejo');
    q.circle(9, 11, 6, 'noche');
    q.rect(4, 11, 11, 10, 'noche');
    q.hline(1, 1, 17, 'azulejo-oscuro');
  });
}

function ruinaNeoclasica(p: Pixels, x0: number, w: number) {
  const rand = rng(67);
  const R = (x: number, y: number, ww: number, h: number, c: Color) => p.rect(x0 + x, y, ww, h, c);
  const part = (x: number, y: number, ww: number, h: number, d: Draw) => p.part(x0 + x, y, ww, h, d);

  // Muro trasero roto
  for (let x = 0; x < w; x++) {
    const h = 34 + Math.floor(Math.sin(x * 0.13) * 6 + rand() * 4);
    R(x, BASE - 10 - h, 1, h, 'piedra');
  }
  p.speckle(x0, BASE - 50, w, 40, 'hormigon', 0.03, rand);
  R(0, BASE - 10, w, 10, 'arena-gris');
  R(0, BASE - 11, w, 1, 'tinta');

  // Columnas, alguna partida
  [70, 70, 70, 44, 58].forEach((h, i) => {
    const cx = 10 + i * 28;
    const ctop = BASE - 10 - h;
    part(cx - 3, ctop - 5, 16, h + 6, (q) => {
      q.rect(3, 5, 9, h, 'arena-gris');
      q.rect(3, 5, 1, h, 'cal');
      for (let fx = 5; fx < 12; fx += 2) q.vline(fx, 5, h, 'piedra');
      if (h === 70) {
        q.rect(1, 1, 13, 4, 'cal');
        q.hline(1, 4, 13, 'tinta');
      } else {
        for (let fx = 0; fx < 9; fx++) q.rect(3 + fx, 5 - (fx % 3), 1, fx % 3, 'arena-gris');
      }
    });
  });
  // Arquitrabe y frontón partido
  const archTop = BASE - 10 - 70 - 12;
  part(5, archTop - 20, 74, 30, (q) => {
    q.rect(1, 20, 72, 8, 'arena-gris');
    q.hline(1, 20, 72, 'cal');
    q.hline(1, 27, 72, 'piedra');
    for (let i = 0; i < 18; i++) q.rect(1 + i * 2, 19 - i, 66 - i * 2, 1, i < 10 ? 'arena-gris' : 'piedra');
  });
  // Vegetación
  for (let i = 0; i < 40; i++) p.px(x0 + Math.floor(rand() * w), BASE - 12 - Math.floor(rand() * 6), rand() < 0.5 ? 'oliva' : 'olivo-claro');

  // Taquilla para ver piedras
  part(64, BASE - 32, 26, 33, (q) => {
    q.box(1, 1, 24, 32, 'rosa-influencer');
    q.box(4, 8, 18, 10, 'noche');
    centeredText(q, 'TAQUILLA', 13, 3, 'papel');
    centeredText(q, '25€', 13, 22, 'papel');
  });
  // Cinta y cartel
  for (let x = 0; x < w; x += 4) R(x, BASE - 22, 2, 2, x % 8 ? 'papel' : 'alarma');
  part(91, BASE - 48, 66, 49, (q) => {
    q.rect(31, 30, 2, 18, 'hormigon');
    q.box(1, 1, 62, 30, 'papel');
    q.rect(2, 2, 60, 2, 'rosa-influencer');
    centeredText(q, 'PRÓXIMAMENTE', 32, 6, 'rosa-influencer');
    centeredText(q, 'Experiencia', 32, 15, 'tinta');
    centeredText(q, 'inmersiva', 32, 23, 'tinta');
  });
}

function pisoTuristico(p: Pixels, x0: number, w: number) {
  const top = 44;
  const R = (x: number, y: number, ww: number, h: number, c: Color) => p.rect(x0 + x, y, ww, h, c);
  const part = (x: number, y: number, ww: number, h: number, d: Draw) => p.part(x0 + x, y, ww, h, d);

  // Limpísimo: ni una mancha
  R(0, top, w, BASE - top, 'papel');
  for (let x = 16; x < w; x += 24) R(x, top, 1, BASE - top, 'cal');
  R(0, top, w, 2, 'cal');
  for (const wx of [8, 52, 96]) {
    part(wx - 1, top + 9, 34, 36, (q) => {
      q.box(1, 1, 32, 34, 'azulejo-oscuro');
      q.line(5, 31, 21, 5, 'celeste-sucio');
      q.line(11, 31, 27, 5, 'azulejo');
    });
  }
  // Puerta de cristal, muro de cajetines y montaña de maletas
  part(13, BASE - 45, 26, 46, (q) => {
    q.box(1, 1, 24, 45, 'azulejo-oscuro');
    q.line(5, 41, 17, 5, 'azulejo');
  });
  for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) part(41 + i * 5, BASE - 46 + j * 6, 6, 7, (q) => q.box(1, 1, 4, 5, 'hormigon-oscuro'));
  const suitcases: [number, number, number, number, Color][] = [
    [64, BASE - 14, 12, 14, 'rosa-influencer'],
    [76, BASE - 18, 10, 18, 'turquesa'],
    [66, BASE - 26, 14, 12, 'amarillo'],
    [70, BASE - 34, 9, 8, 'alarma'],
  ];
  for (const [sx, sy, sw, sh, c] of suitcases) {
    part(sx - 1, sy - 4, sw + 2, sh + 5, (q) => {
      q.rect(1, 4, sw, sh, c);
      q.rect(Math.floor(sw / 2) - 1, 1, 4, 3, 'sombra');
      q.hline(1, 6, sw, 'tinta');
    });
  }
  // Neón
  part(85, BASE - 45, 50, 28, (q) => {
    q.box(1, 1, 48, 26, 'noche');
    centeredText(q, 'VIVE COMO', 25, 5, 'rosa-influencer');
    centeredText(q, 'UN LOCAL', 25, 16, 'rosa-influencer');
  });
  part(110, BASE - 18, 18, 19, (q) => {
    q.rect(3, 8, 12, 10, 'hormigon-oscuro');
    q.circle(9, 5, 4, 'olivo-claro');
    q.rect(8, 7, 2, 2, 'cuero');
  });
}

function herreriano(p: Pixels, x0: number, w: number) {
  const rand = rng(83);
  const R = (x: number, y: number, ww: number, h: number, c: Color) => p.rect(x0 + x, y, ww, h, c);
  const part = (x: number, y: number, ww: number, h: number, d: Draw) => p.part(x0 + x, y, ww, h, d);

  // Torre con un chapitel absurdamente alto
  const tx = 12, tw = 40, ttop = 58;
  wall(p, x0 + tx, ttop, tw, BASE - ttop, 'piedra', 'hormigon', rand);
  part(tx - 1, 0, tw + 2, ttop + 1, (q) => {
    for (let y = 6; y <= ttop; y++) {
      const half = Math.round(((y - 6) / (ttop - 6)) * (tw / 2));
      q.rect(1 + tw / 2 - half, y, half * 2, 1, (y >> 2) % 3 ? 'pizarra' : 'azulejo-oscuro');
    }
    q.rect(tw / 2, 3, 2, 4, 'tinta');
    q.circle(tw / 2 + 1, 2, 2, 'mostaza');
  });
  part(tx + 13, ttop + 13, 14, 20, (q) => q.box(1, 1, 12, 18, 'noche'));

  // Cuerpo principal de sillería
  const btop = 60;
  wall(p, x0 + tx + tw, btop, w - tx - tw, BASE - btop, 'piedra', 'hormigon', rand, 0.015);
  for (let y = btop + 6; y < BASE; y += 6) {
    R(tx + tw, y, w - tx - tw, 1, 'hormigon');
    for (let x = tx + tw + ((y / 6) % 2 ? 0 : 6); x < w; x += 12) R(x, y - 5, 1, 5, 'hormigon');
  }
  R(tx + tw, btop - 8, w - tx - tw, 8, 'pizarra');
  R(tx + tw, btop - 8, w - tx - tw, 1, 'azulejo-oscuro');
  R(tx + tw, btop, w - tx - tw, 1, 'tinta');
  for (let x = tx + tw + 14; x < w - 10; x += 34) {
    part(x - 1, btop - 15, 12, 10, (q) => {
      q.rect(1, 1, 10, 8, 'pizarra');
      q.box(3, 3, 6, 6, 'noche');
    });
  }
  for (let wy = btop + 10; wy < BASE - 50; wy += 28) {
    for (let wx = tx + tw + 12; wx < w - 12; wx += 26) {
      part(wx - 2, wy - 2, 14, 18, (q) => {
        q.box(1, 1, 12, 16, 'arena-gris');
        q.box(2, 2, 10, 14, 'noche');
      });
    }
  }
  // Portada con bolas herrerianas como sandías
  const dx = 120;
  part(dx - 9, BASE - 62, 44, 63, (q) => {
    q.rect(5, 14, 34, 48, 'arena-gris');
    for (let i = 0; i < 8; i++) q.rect(5 + i * 2, 12 - i, 34 - i * 4, 1, 'arena-gris');
  });
  for (const bx of [dx - 6, dx + 27]) part(bx - 1, BASE - 66, 9, 9, (q) => q.circle(4, 4, 3, 'arena-gris'));
  part(dx - 1, BASE - 43, 28, 44, (q) => {
    q.box(1, 1, 26, 43, 'tierra');
    q.vline(13, 1, 43, 'tinta');
  });
  part(dx + 39, BASE - 41, 66, 26, (q) => {
    q.box(1, 1, 64, 24, 'cal');
    centeredText(q, 'JUNTA MUNICIPAL', 33, 5, 'tinta');
    centeredText(q, 'DE FRANCOS', 33, 15, 'tinta');
  });
}

// ---------------------------------------------------------------- capas

function skyTexture(scene: Phaser.Scene) {
  const p = new Pixels(GAME_W, GAME_H);
  // Degradado por tramado en escalones de 25 %: azul polvoriento arriba, trigo hacia el horizonte
  const bands: [number, number, Color, Color, number][] = [
    [0, 18, 'cielo-polvo', 'cielo-polvo', 0],
    [18, 6, 'cielo-polvo', 'celeste-sucio', 0.25],
    [24, 6, 'cielo-polvo', 'celeste-sucio', 0.5],
    [30, 6, 'cielo-polvo', 'celeste-sucio', 0.75],
    [36, 18, 'celeste-sucio', 'celeste-sucio', 0],
    [54, 6, 'celeste-sucio', 'trigo', 0.25],
    [60, 6, 'celeste-sucio', 'trigo', 0.5],
    [66, 6, 'celeste-sucio', 'trigo', 0.75],
    [72, 40, 'trigo', 'trigo', 0],
    [112, 68, 'trigo', 'albaricoque', 0.3],
  ];
  for (const [y, h, a, b, t] of bands) p.dither(0, y, GAME_W, h, a, b, t);
  p.circle(232, 50, 11, 'papel');
  scene.textures.addCanvas('cielo', p.canvas);
}

function farTexture(scene: Phaser.Scene) {
  const w = layerWidth(PARALLAX.far);
  const p = new Pixels(w, GAME_H);
  const rand = rng(101);
  const c: Color = 'cielo-polvo';
  let x = 0;
  let n = 0;
  while (x < w) {
    const kind = rand();
    const bw = 14 + Math.floor(rand() * 30);
    const top = 34 + Math.floor(rand() * 28);
    p.rect(x, top, bw, GAME_H - top, c);
    if (n === 3) {
      // Grúa cargando una cúpula
      p.rect(x + 6, top - 56, 2, 56, c);
      p.rect(x - 14, top - 56, 44, 2, c);
      p.vline(x + 26, top - 54, 12, c);
      p.ellipse(x + 26, top - 38, 6, 4, c);
      p.rect(x + 20, top - 38, 13, 3, c);
    } else if (kind < 0.18) {
      p.circle(x + Math.floor(bw / 2), top, Math.floor(bw / 2) - 2, c);
    } else if (kind < 0.32) {
      p.rect(x + 3, top - 30, 6, 30, c);
      p.rect(x + 2, top - 34, 8, 4, c);
      p.rect(x + 5, top - 38, 2, 4, c);
    } else if (kind < 0.42) {
      for (let i = 0; i < 10; i++) p.rect(x + 10 - i, top - 24 + i * 2, 2 + i * 2, 2, c);
      p.circle(x + 11, top - 26, 1, c);
    } else if (kind < 0.52) {
      // Bloque brutalista coronado con cúpula
      p.ellipse(x + Math.floor(bw / 2), top, Math.max(4, Math.floor(bw / 3)), 5, c);
    }
    x += bw + Math.floor(rand() * 6);
    n++;
  }
  scene.textures.addCanvas('lejos', p.canvas);
}

function midTexture(scene: Phaser.Scene) {
  const w = layerWidth(PARALLAX.mid);
  const p = new Pixels(w, GAME_H);
  const rand = rng(202);
  let x = 0;
  let n = 0;
  while (x < w) {
    const bw = 26 + Math.floor(rand() * 40);
    const top = 48 + Math.floor(rand() * 28);
    p.rect(x, top, bw, GAME_H - top, 'azulejo');
    p.rect(x, top, bw, 1, 'cielo-polvo');
    for (let wy = top + 4; wy < GAME_H - 4; wy += 7) {
      for (let wx = x + 3; wx < x + bw - 3; wx += 6) p.rect(wx, wy, 2, 3, rand() < 0.15 ? 'trigo' : 'azulejo-oscuro');
    }
    if (n % 5 === 2) {
      // Valla publicitaria en la azotea
      const label = n % 2 ? 'AUTÉNTICO' : 'SE VENDE';
      const bwid = measureText(label) + 6;
      p.vline(x + 6, top - 6, 6, 'azulejo-oscuro');
      p.vline(x + bwid - 4, top - 6, 6, 'azulejo-oscuro');
      p.box(x + 2, top - 18, bwid, 13, 'papel', 'azulejo-oscuro');
      drawText(p, label, x + 5, top - 16 - CAP_TOP + 1, 'alarma');
    } else if (rand() < 0.3) {
      p.ellipse(x + Math.floor(bw / 2), top, Math.floor(bw / 4), 4, 'azulejo');
    } else if (rand() < 0.4) {
      p.rect(x + bw - 8, top - 10, 1, 10, 'azulejo-oscuro');
      p.rect(x + bw - 11, top - 10, 7, 1, 'azulejo-oscuro');
    }
    x += bw + 1 + Math.floor(rand() * 4);
    n++;
  }
  p.outline(0, 0, w, GAME_H, 'noche');
  scene.textures.addCanvas('medio', p.canvas);
}

function streetTexture(scene: Phaser.Scene) {
  const p = new Pixels(WORLD_W, GAME_H);
  const rand = rng(303);
  const plan: [(p: Pixels, x0: number, w: number) => void, number, number][] = [
    [bloqueObrero, 0, 176],
    [andalusiNuevo, 176, 128],
    [casaMaruja, 304, 136],
    [muroMedianero, 440, 160],
    [edificioEnObras, 600, 160],
    [ruinaNeoclasica, 760, 144],
    [pisoTuristico, 904, 136],
    [herreriano, 1040, 240],
  ];
  // Cada edificio en su capa: su silueta recibe contorno negro antes de pegarse a la calle
  for (const [draw, x0, w] of plan) {
    const layer = new Pixels(WORLD_W, GAME_H);
    draw(layer, x0, w);
    layer.outline(Math.max(0, x0 - 1), 0, Math.min(WORLD_W, x0 + w + 1) - Math.max(0, x0 - 1), BASE, 'tinta');
    p.ctx.drawImage(layer.canvas, 0, 0);
  }
  arcoColgante(p, 712);

  // Acera, bordillo y calzada
  p.rect(0, BASE, WORLD_W, 16, 'arena-gris');
  p.rect(0, BASE, WORLD_W, 1, 'tinta');
  p.dither(0, BASE + 1, WORLD_W, 2, 'hormigon', 'arena-gris', 0.5);
  p.rect(0, BASE + 8, WORLD_W, 1, 'piedra');
  for (let x = 0; x < WORLD_W; x += 16) {
    p.rect(x, BASE + 3, 1, 5, 'piedra');
    p.rect(x + 8, BASE + 9, 1, 7, 'piedra');
  }
  p.speckle(0, BASE + 3, WORLD_W, 13, 'piedra', 0.02, rand);
  p.rect(0, BASE + 16, WORLD_W, 1, 'cal');
  p.rect(0, BASE + 17, WORLD_W, 1, 'tinta');
  p.rect(0, BASE + 18, WORLD_W, GAME_H - BASE - 18, 'hormigon-oscuro');
  p.speckle(0, BASE + 19, WORLD_W, GAME_H - BASE - 19, 'hormigon', 0.04, rand);
  for (const mx of [260, 700, 1120]) p.box(mx, BASE + 23, 18, 3, 'sombra');
  for (const lx of LAMP_XS) lamp(p, lx);
  scene.textures.addCanvas('calle', p.canvas);
}

/** Placa de calle de cerámica, al estilo de las de Madrid. */
function plateTexture(scene: Phaser.Scene) {
  const w = 120, h = 32;
  const p = new Pixels(w, h);
  p.box(0, 0, w, h, 'azulejo-oscuro');
  p.rect(2, 2, w - 4, h - 4, 'papel');
  p.rect(3, 3, w - 6, h - 6, 'cal');
  p.rect(4, 4, w - 8, h - 8, 'papel');
  for (let x = 2; x < w - 2; x += 4) {
    p.px(x, 1, 'azulejo');
    p.px(x, h - 2, 'azulejo');
  }
  horseshoeArch(p, 12, 10, 8, 13, 'azulejo', 'azulejo-oscuro');
  centeredText(p, 'CALLE DE LOS', 70, 7, 'azulejo-oscuro');
  centeredText(p, 'FRANCOS VIEJOS', 70, 18, 'azulejo-oscuro');
  scene.textures.addCanvas('placa-calle', p.canvas);
}

export function buildStreet(scene: Phaser.Scene) {
  skyTexture(scene);
  farTexture(scene);
  midTexture(scene);
  streetTexture(scene);
  plateTexture(scene);
}
