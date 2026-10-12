import Phaser from 'phaser';
import { Pixels, rng, type Color } from './pixels';
import { drawText, measureText, CAP_TOP, LINE_H } from './font';
import { GAME_W, GAME_H, WORLD_W, FACADE_BASE_Y } from '../config';

/*
 * Calle de los Francos Viejos, procedural. Capas: cielo (fijo), skyline lejano y medio (parallax),
 * fachadas + acera (scroll 1). Cada edificio representa un estrato del barrio.
 */

export const PARALLAX = { far: 0.15, mid: 0.45 };
export const BAR_X = 520; // centro del Bar Manolo
export const MARUJA_X = 394;
export const LAMP_XS = [170, 432, 762, 1034];

const BASE = FACADE_BASE_Y;
const layerWidth = (factor: number) => Math.ceil(GAME_W + (WORLD_W - GAME_W) * factor);

type R = (x: number, y: number, w: number, h: number, c: Color) => void;

function wall(p: Pixels, x: number, y: number, w: number, h: number, base: Color, dirt: Color, light: Color, rand: () => number, density = 0.06) {
  p.rect(x, y, w, h, base);
  p.speckle(x, y, w, h, dirt, density, rand);
  p.speckle(x, y, w, h, light, density / 3, rand);
}

function centeredText(p: Pixels, text: string, cx: number, capTop: number, c: Color) {
  drawText(p, text, Math.round(cx - measureText(text) / 2), capTop - CAP_TOP, c);
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
}

function celosia(p: Pixels, x: number, y: number, w: number, h: number) {
  p.rect(x - 1, y - 1, w + 2, h + 2, 'tierra');
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
  p.rect(x - 4, y - 3, w + 8, h + 3, frame);
  p.rect(x - 3, y - 2, w + 6, h + 2, 'cal');
  p.circle(cx, y + r, r + 1, frame);
  p.circle(cx, y + r, r, fill);
  p.rect(x, y + r, w, h - r, fill);
  p.rect(x - 1, y + r, 1, 3, frame);
  p.rect(x + w, y + r, 1, 3, frame);
}

function lamp(p: Pixels, x: number) {
  p.rect(x - 3, 153, 7, 5, 'sombra');
  p.rect(x - 2, 151, 5, 2, 'sombra');
  p.rect(x, 104, 2, 47, 'sombra');
  p.rect(x - 1, 118, 4, 2, 'sombra');
  p.rect(x - 1, 136, 4, 2, 'sombra');
  p.rect(x - 3, 102, 8, 2, 'sombra');
  p.rect(x - 2, 92, 6, 10, 'trigo');
  p.rect(x - 3, 92, 1, 10, 'sombra');
  p.rect(x + 4, 92, 1, 10, 'sombra');
  p.rect(x + 0, 92, 2, 10, 'mostaza');
  p.rect(x - 4, 89, 10, 3, 'sombra');
  p.rect(x, 86, 2, 3, 'sombra');
}

// ---------------------------------------------------------------- edificios

function bloqueObrero(p: Pixels, x0: number, w: number) {
  const rand = rng(11);
  const top = 8;
  const R: R = (x, y, ww, h, c) => p.rect(x0 + x, y, ww, h, c);
  wall(p, x0, top, w, BASE - top, 'hormigon', 'hormigon-oscuro', 'piedra', rand, 0.08);
  R(0, top, w, 3, 'hormigon-oscuro');
  R(30, top - 6, 1, 6, 'tinta');
  R(28, top - 6, 5, 1, 'tinta');
  p.circle(x0 + 140, top - 2, 2, 'cal');

  // Forjados y ventanas en serie
  for (let fy = top + 6; fy < BASE - 40; fy += 20) {
    R(0, fy + 15, w, 3, 'piedra');
    R(0, fy + 18, w, 1, 'hormigon-oscuro');
    for (let wx = 6; wx + 12 < w; wx += 22) {
      R(wx, fy + 3, 12, 10, 'hormigon-oscuro');
      R(wx + 1, fy + 4, 10, 8, 'noche');
      R(wx + 2, fy + 5, 3, 2, 'pizarra');
      const r = rand();
      if (r < 0.25) {
        R(wx - 1, fy + 13, 14, 1, 'tinta');
        const colors: Color[] = ['alarma', 'azulejo', 'mostaza', 'papel', 'rosa-influencer', 'oliva'];
        for (let i = 0; i < 4; i++) R(wx + i * 3, fy + 14, 2, 2 + Math.floor(rand() * 2), colors[Math.floor(rand() * colors.length)]);
      } else if (r < 0.45) {
        R(wx + 13, fy + 6, 6, 5, 'cal');
        R(wx + 14, fy + 7, 4, 3, 'piedra');
      }
    }
  }
  for (let fx = 0; fx < w; fx += 44) R(fx, top, 2, BASE - top - 30, 'piedra');

  // Planta baja: persiana con pintadas y el portal de Pablo
  R(0, BASE - 32, w, 32, 'hormigon-oscuro');
  R(8, BASE - 28, 90, 28, 'piedra');
  for (let y = BASE - 27; y < BASE; y += 2) R(8, y, 90, 1, 'hormigon');
  for (let i = 0; i < 7; i++) {
    const gx = 12 + Math.floor(rand() * 70), gy = BASE - 24 + Math.floor(rand() * 14);
    p.line(x0 + gx, gy, x0 + gx + 4 + Math.floor(rand() * 10), gy + Math.floor(rand() * 7) - 3, i % 2 ? 'rosa-influencer' : 'turquesa');
  }
  R(30, BASE - 22, 44, 11, 'papel');
  centeredText(p, 'SE ALQUILA', x0 + 52, BASE - 20, 'alarma');
  R(116, BASE - 30, 30, 30, 'cal');
  R(118, BASE - 28, 26, 28, 'noche');
  R(130, BASE - 28, 2, 28, 'hormigon-oscuro');
  R(120, BASE - 26, 9, 10, 'pizarra');
  R(150, BASE - 26, 9, 9, 'azulejo');
  centeredText(p, '3', x0 + 155, BASE - 25, 'cal');
}

function andalusiNuevo(p: Pixels, x0: number, w: number) {
  const rand = rng(23);
  const top = 56;
  const R: R = (x, y, ww, h, c) => p.rect(x0 + x, y, ww, h, c);
  wall(p, x0, top, w, BASE - top, 'cal', 'arena-gris', 'papel', rand, 0.05);
  for (let mx = 2; mx < w; mx += 10) R(mx, top - 5, 6, 5, 'cal');
  R(0, top, w, 1, 'arena-gris');
  R(0, top + 1, w, 1, 'papel');

  R(24, top + 6, 80, 26, 'papel');
  R(25, top + 7, 78, 24, 'turquesa');
  centeredText(p, 'CENTRO DE', x0 + 64, top + 10, 'papel');
  centeredText(p, 'INTERPRETACIÓN', x0 + 64, top + 21, 'papel');
  celosia(p, x0 + 6, top + 10, 12, 20);
  celosia(p, x0 + 110, top + 10, 12, 20);
  celosia(p, x0 + 20, top + 38, 14, 18);
  celosia(p, x0 + 94, top + 38, 14, 18);
  azulejoBand(p, x0, BASE - 32, w);
  horseshoeArch(p, x0 + 53, BASE - 22 - 6, 22, 28, 'cuero', 'azulejo-oscuro');
  for (let y = BASE - 16; y < BASE; y += 4) for (let x = 56; x < 74; x += 5) R(x, y, 1, 1, 'tierra');
  R(4, BASE - 8, 8, 8, 'terracota');
  R(3, BASE - 14, 10, 6, 'oliva');
  R(116, BASE - 8, 8, 8, 'terracota');
  R(115, BASE - 14, 10, 6, 'oliva');
}

function casaMaruja(p: Pixels, x0: number, w: number) {
  const rand = rng(37);
  const top = 40;
  const R: R = (x, y, ww, h, c) => p.rect(x0 + x, y, ww, h, c);
  wall(p, x0, top, w, BASE - top, 'albaricoque', 'terracota', 'melocoton', rand, 0.07);
  for (const [px, py, pw, ph] of [[8, 60, 12, 8], [104, 92, 10, 6], [40, 120, 8, 5]]) {
    R(px, py, pw, ph, 'ladrillo');
    for (let y = py + 1; y < py + ph; y += 2) R(px, y, pw, 1, 'terracota-oscura');
  }
  // Cornisa
  R(0, top, w, 6, 'arena-gris');
  R(0, top + 6, w, 1, 'piedra');
  R(0, top + 2, w, 1, 'cal');
  // Una planta con balcones de forja
  const fy = top + 10;
  for (const wx of [14, 60, 106]) {
    R(wx - 2, fy - 3, 20, 3, 'arena-gris');
    R(wx + 6, fy - 5, 4, 2, 'arena-gris');
    R(wx, fy, 16, 28, 'cal');
    R(wx + 2, fy + 2, 12, 26, 'noche');
    R(wx + 7, fy + 2, 2, 26, 'cal');
    R(wx + 3, fy + 3, 2, 7, 'pizarra');
    R(wx - 5, fy + 28, 26, 2, 'arena-gris');
    R(wx - 5, fy + 19, 26, 1, 'tinta');
    for (let x = wx - 5; x < wx + 21; x += 2) R(x, fy + 20, 1, 8, 'tinta');
    p.circle(x0 + wx + 8, fy + 23, 2, 'tinta');
    p.px(x0 + wx + 8, fy + 23, 'albaricoque');
  }
  R(58, fy + 22, 4, 4, 'terracota');
  R(57, fy + 19, 6, 3, 'oliva');
  R(60, fy + 18, 1, 1, 'alarma');
  // Portada barroca
  const dx = 50;
  R(dx - 6, BASE - 50, 36, 50, 'arena-gris');
  R(dx - 6, BASE - 50, 2, 50, 'cal');
  R(dx + 28, BASE - 50, 2, 50, 'piedra');
  R(dx - 2, BASE - 56, 28, 6, 'arena-gris');
  R(dx + 8, BASE - 60, 8, 4, 'arena-gris');
  p.circle(x0 + dx + 12, BASE - 61, 2, 'cal');
  R(dx, BASE - 44, 24, 44, 'tierra');
  R(dx + 1, BASE - 43, 10, 43, 'cuero');
  R(dx + 13, BASE - 43, 10, 43, 'cuero');
  for (const y of [BASE - 38, BASE - 24]) {
    R(dx + 3, y, 6, 8, 'tierra');
    R(dx + 15, y, 6, 8, 'tierra');
  }
  R(dx + 10, BASE - 26, 4, 3, 'mostaza');
  R(dx + 34, BASE - 44, 10, 8, 'azulejo');
  centeredText(p, '9', x0 + dx + 39, BASE - 43, 'cal');
}

function muroMedianero(p: Pixels, x0: number, w: number) {
  wall(p, x0, 40, w, BASE - 40, 'hormigon', 'hormigon-oscuro', 'piedra', rng(41));
}

function edificioEnObras(p: Pixels, x0: number, w: number) {
  const rand = rng(53);
  const top = 22;
  const R: R = (x, y, ww, h, c) => p.rect(x0 + x, y, ww, h, c);
  wall(p, x0, top, w, BASE - top, 'hormigon', 'hormigon-oscuro', 'piedra', rand);
  for (let fy = top + 8; fy < BASE - 30; fy += 24) for (let wx = 10; wx < w - 12; wx += 26) R(wx, fy, 12, 14, 'noche');
  // Malla verde y andamio
  p.dither(x0 + 4, top + 4, w - 8, 60, 'oliva-oscuro', 'oliva', 0.35);
  for (let px = 4; px < w; px += 20) R(px, top - 4, 1, BASE - top + 4, 'mostaza');
  for (let py = top + 2; py < BASE - 20; py += 24) {
    R(0, py, w, 2, 'cuero');
    R(0, py + 2, w, 1, 'tierra');
  }
  // Lona del Plan
  const bx = 20, by = top + 18, bw = 120, bh = 54;
  R(bx, by, bw, bh, 'papel');
  R(bx + 1, by + 1, bw - 2, bh - 2, 'turquesa');
  horseshoeArch(p, x0 + bx + 8, by + 8, 8, 12, 'turquesa', 'papel');
  const tx = x0 + bx + 66;
  centeredText(p, 'PLAN DE', tx, by + 8, 'papel');
  centeredText(p, 'AUTENTICIDAD', tx, by + 8 + LINE_H, 'papel');
  centeredText(p, 'Recuperamos lo que', x0 + bx + bw / 2, by + 34, 'trigo');
  centeredText(p, 'siempre fuimos*', x0 + bx + bw / 2, by + 34 + LINE_H - 1, 'trigo');
  // Valla de obra
  R(0, BASE - 26, w, 26, 'cal');
  for (let px = 0; px < w; px += 32) R(px, BASE - 26, 1, 26, 'arena-gris');
  R(0, BASE - 24, w, 3, 'turquesa');
  centeredText(p, 'OBRA MUNICIPAL', x0 + 48, BASE - 17, 'turquesa');
  centeredText(p, 'Fin: próximamente', x0 + 118, BASE - 17, 'hormigon');
  for (let px = 0; px < w; px += 6) R(px, BASE - 5, 3, 3, 'alarma');
  for (let px = 3; px < w; px += 6) R(px, BASE - 5, 3, 3, 'papel');
}

function ruinaNeoclasica(p: Pixels, x0: number, w: number) {
  const rand = rng(67);
  const R: R = (x, y, ww, h, c) => p.rect(x0 + x, y, ww, h, c);
  // Muro trasero roto
  for (let x = 0; x < w; x++) {
    const h = 34 + Math.floor(Math.sin(x * 0.13) * 6 + rand() * 4);
    R(x, BASE - 10 - h, 1, h, 'piedra');
  }
  p.speckle(x0, BASE - 50, w, 40, 'hormigon', 0.08, rand);
  R(0, BASE - 10, w, 10, 'arena-gris');
  R(0, BASE - 10, w, 1, 'cal');
  R(0, BASE - 2, w, 2, 'piedra');
  // Columnas, alguna partida
  const heights = [70, 70, 70, 44, 58];
  heights.forEach((h, i) => {
    const cx = 10 + i * 28;
    const ctop = BASE - 10 - h;
    R(cx, ctop, 9, h, 'arena-gris');
    R(cx, ctop, 1, h, 'cal');
    for (let fx = cx + 2; fx < cx + 9; fx += 2) R(fx, ctop, 1, h, 'piedra');
    if (h === 70) {
      R(cx - 2, ctop - 4, 13, 4, 'cal');
      R(cx - 2, ctop - 1, 13, 1, 'piedra');
    } else {
      for (let fx = 0; fx < 9; fx++) R(cx + fx, ctop - (fx % 3), 1, fx % 3, 'arena-gris');
    }
  });
  // Arquitrabe y frontón partido
  const archTop = BASE - 10 - 70 - 12;
  R(6, archTop, 72, 8, 'arena-gris');
  R(6, archTop + 7, 72, 1, 'piedra');
  R(6, archTop, 72, 1, 'cal');
  for (let i = 0; i < 18; i++) R(6 + i * 2, archTop - 1 - i, 36 - i * 2 + 30, 1, i < 10 ? 'arena-gris' : 'piedra');
  // Vegetación
  for (let i = 0; i < 40; i++) {
    const vx = Math.floor(rand() * w), vy = BASE - 12 - Math.floor(rand() * 6);
    p.px(x0 + vx, vy, rand() < 0.5 ? 'oliva' : 'olivo-claro');
  }
  R(80, BASE - 30, 4, 4, 'oliva');
  R(82, BASE - 33, 2, 3, 'olivo-claro');
  // Cinta y cartel
  for (let x = 0; x < w; x += 4) R(x, BASE - 22, 2, 2, x % 8 ? 'papel' : 'alarma');
  R(88, BASE - 46, 62, 30, 'papel');
  R(88, BASE - 46, 62, 2, 'rosa-influencer');
  R(117, BASE - 16, 2, 16, 'hormigon');
  centeredText(p, 'PRÓXIMAMENTE', x0 + 119, BASE - 42, 'rosa-influencer');
  centeredText(p, 'Experiencia', x0 + 119, BASE - 32, 'tinta');
  centeredText(p, 'inmersiva', x0 + 119, BASE - 24, 'tinta');
}

function pisoTuristico(p: Pixels, x0: number, w: number) {
  const top = 44;
  const R: R = (x, y, ww, h, c) => p.rect(x0 + x, y, ww, h, c);
  // Limpísimo: ni una mancha
  R(0, top, w, BASE - top, 'papel');
  for (let x = 16; x < w; x += 24) R(x, top, 1, BASE - top, 'cal');
  R(0, top, w, 2, 'cal');
  for (const wx of [8, 52, 96]) {
    R(wx, top + 10, 32, 34, 'hormigon-oscuro');
    R(wx + 1, top + 11, 30, 32, 'azulejo-oscuro');
    p.line(x0 + wx + 4, top + 40, x0 + wx + 20, top + 14, 'celeste-sucio');
    p.line(x0 + wx + 10, top + 40, x0 + wx + 26, top + 14, 'azulejo');
  }
  // Puerta de cristal y cajetines de llaves
  R(14, BASE - 44, 24, 44, 'hormigon-oscuro');
  R(15, BASE - 43, 22, 43, 'azulejo-oscuro');
  p.line(x0 + 18, BASE - 4, x0 + 30, BASE - 40, 'azulejo');
  for (let i = 0; i < 6; i++) R(42 + (i % 3) * 4, BASE - 30 + Math.floor(i / 3) * 5, 3, 4, 'tinta');
  // Neón
  R(66, BASE - 44, 62, 26, 'noche');
  centeredText(p, 'VIVE COMO', x0 + 97, BASE - 40, 'rosa-influencer');
  centeredText(p, 'UN LOCAL', x0 + 97, BASE - 29, 'rosa-influencer');
  R(80, BASE - 12, 14, 12, 'hormigon-oscuro');
  p.circle(x0 + 87, BASE - 18, 5, 'olivo-claro');
  R(86, BASE - 14, 2, 4, 'cuero');
}

function herreriano(p: Pixels, x0: number, w: number) {
  const rand = rng(83);
  const R: R = (x, y, ww, h, c) => p.rect(x0 + x, y, ww, h, c);
  // Torre con chapitel de pizarra
  const tx = 12, tw = 40, ttop = 50;
  wall(p, x0 + tx, ttop, tw, BASE - ttop, 'piedra', 'hormigon', 'arena-gris', rand);
  for (let i = 0; i <= 20; i++) R(tx + i, ttop - 2 - i * 2, tw - i * 2, 2, i % 3 ? 'pizarra' : 'azulejo-oscuro');
  R(tx + 19, ttop - 46, 2, 4, 'tinta');
  p.circle(x0 + tx + 20, ttop - 46, 2, 'mostaza');
  R(tx + 14, ttop + 14, 12, 18, 'noche');
  R(tx + 14, ttop + 14, 12, 1, 'arena-gris');
  // Cuerpo principal de sillería
  const btop = 60;
  wall(p, x0 + tx + tw, btop, w - tx - tw, BASE - btop, 'piedra', 'hormigon', 'arena-gris', rand, 0.04);
  for (let y = btop + 6; y < BASE; y += 6) {
    R(tx + tw, y, w - tx - tw, 1, 'hormigon');
    for (let x = tx + tw + ((y / 6) % 2 ? 0 : 6); x < w; x += 12) R(x, y - 5, 1, 5, 'hormigon');
  }
  R(tx + tw, btop - 8, w - tx - tw, 8, 'pizarra');
  R(tx + tw, btop - 8, w - tx - tw, 1, 'azulejo-oscuro');
  for (let x = tx + tw + 14; x < w - 10; x += 34) {
    R(x, btop - 14, 10, 8, 'pizarra');
    R(x + 3, btop - 12, 4, 5, 'noche');
  }
  for (let wy = btop + 10; wy < BASE - 50; wy += 28) {
    for (let wx = tx + tw + 12; wx < w - 12; wx += 26) {
      R(wx - 1, wy - 1, 12, 16, 'arena-gris');
      R(wx, wy, 10, 14, 'noche');
    }
  }
  // Portada con bolas herrerianas
  const dx = 120;
  R(dx - 4, BASE - 48, 34, 48, 'arena-gris');
  for (let i = 0; i < 8; i++) R(dx - 4 + i * 2, BASE - 50 - i, 34 - i * 4, 1, 'arena-gris');
  p.circle(x0 + dx - 3, BASE - 52, 2, 'arena-gris');
  p.circle(x0 + dx + 29, BASE - 52, 2, 'arena-gris');
  R(dx, BASE - 42, 26, 42, 'tierra');
  R(dx + 12, BASE - 42, 2, 42, 'sombra');
  R(dx + 40, BASE - 40, 64, 24, 'arena-gris');
  R(dx + 41, BASE - 39, 62, 22, 'cal');
  centeredText(p, 'JUNTA MUNICIPAL', x0 + dx + 72, BASE - 37, 'tinta');
  centeredText(p, 'DE FRANCOS', x0 + dx + 72, BASE - 27, 'tinta');
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
  while (x < w) {
    const kind = rand();
    const bw = 14 + Math.floor(rand() * 30);
    const top = 34 + Math.floor(rand() * 28);
    p.rect(x, top, bw, GAME_H - top, c);
    if (kind < 0.18) {
      p.circle(x + Math.floor(bw / 2), top, Math.floor(bw / 2) - 2, c);
    } else if (kind < 0.32) {
      p.rect(x + 3, top - 30, 6, 30, c);
      p.rect(x + 2, top - 34, 8, 4, c);
      p.rect(x + 5, top - 38, 2, 4, c);
    } else if (kind < 0.42) {
      for (let i = 0; i < 10; i++) p.rect(x + 10 - i, top - 24 + i * 2, 2 + i * 2, 2, c);
      p.circle(x + 11, top - 26, 1, c);
    } else if (kind < 0.52) {
      p.rect(x + 6, top - 52, 1, 52, c);
      p.rect(x - 8, top - 50, 34, 1, c);
      p.rect(x + 20, top - 50, 1, 12, c);
    }
    x += bw + Math.floor(rand() * 6);
  }
  scene.textures.addCanvas('lejos', p.canvas);
}

function midTexture(scene: Phaser.Scene) {
  const w = layerWidth(PARALLAX.mid);
  const p = new Pixels(w, GAME_H);
  const rand = rng(202);
  let x = 0;
  while (x < w) {
    const bw = 26 + Math.floor(rand() * 40);
    const top = 48 + Math.floor(rand() * 28);
    p.rect(x, top, bw, GAME_H - top, 'azulejo');
    p.rect(x, top, bw, 1, 'cielo-polvo');
    for (let wy = top + 4; wy < GAME_H - 4; wy += 7) {
      for (let wx = x + 3; wx < x + bw - 3; wx += 6) p.rect(wx, wy, 2, 3, rand() < 0.15 ? 'trigo' : 'azulejo-oscuro');
    }
    const extra = rand();
    if (extra < 0.25) {
      p.rect(x + 4, top - 6, 8, 6, 'azulejo');
      p.rect(x + 5, top - 8, 6, 2, 'azulejo-oscuro');
    } else if (extra < 0.4) {
      p.rect(x + bw - 8, top - 10, 1, 10, 'azulejo-oscuro');
      p.rect(x + bw - 11, top - 10, 7, 1, 'azulejo-oscuro');
    }
    x += bw + 1 + Math.floor(rand() * 4);
  }
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
  for (const [draw, x0, w] of plan) draw(p, x0, w);

  // Acera, bordillo y calzada
  p.rect(0, BASE, WORLD_W, 16, 'arena-gris');
  p.dither(0, BASE, WORLD_W, 3, 'hormigon', 'arena-gris', 0.5);
  p.rect(0, BASE + 8, WORLD_W, 1, 'piedra');
  for (let x = 0; x < WORLD_W; x += 16) {
    p.rect(x, BASE + 3, 1, 5, 'piedra');
    p.rect(x + 8, BASE + 9, 1, 7, 'piedra');
  }
  p.speckle(0, BASE + 3, WORLD_W, 13, 'piedra', 0.04, rand);
  p.speckle(0, BASE + 3, WORLD_W, 13, 'cal', 0.03, rand);
  p.rect(0, BASE + 16, WORLD_W, 1, 'cal');
  p.rect(0, BASE + 17, WORLD_W, 1, 'piedra');
  p.rect(0, BASE + 18, WORLD_W, GAME_H - BASE - 18, 'hormigon-oscuro');
  p.speckle(0, BASE + 19, WORLD_W, GAME_H - BASE - 19, 'hormigon', 0.06, rand);
  p.speckle(0, BASE + 19, WORLD_W, GAME_H - BASE - 19, 'sombra', 0.05, rand);
  for (const mx of [260, 700, 1120]) {
    p.rect(mx, BASE + 23, 18, 3, 'sombra');
    p.rect(mx + 2, BASE + 24, 14, 1, 'hormigon');
  }
  for (const lx of LAMP_XS) lamp(p, lx);
  scene.textures.addCanvas('calle', p.canvas);
}

/** Placa de calle de cerámica, al estilo de las de Madrid. */
function plateTexture(scene: Phaser.Scene) {
  const w = 120, h = 32;
  const p = new Pixels(w, h);
  p.rect(0, 0, w, h, 'azulejo-oscuro');
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
