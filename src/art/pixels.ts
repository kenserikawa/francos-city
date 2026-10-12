import { css, PAL, type ColorName } from './palette';

export type Color = ColorName | number;

const rgbOf = (c: Color) => (typeof c === 'number' ? c : PAL[c]);

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Generador pseudoaleatorio determinista (mulberry32): el arte procedural sale igual en cada carga. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lienzo para dibujar pixel art por código con los colores de la paleta. */
export class Pixels {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  constructor(readonly width: number, readonly height: number) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D no disponible');
    ctx.imageSmoothingEnabled = false;
    this.ctx = ctx;
  }

  rect(x: number, y: number, w: number, h: number, c: Color) {
    if (w <= 0 || h <= 0) return;
    this.ctx.fillStyle = css(rgbOf(c));
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  px(x: number, y: number, c: Color) {
    this.rect(x, y, 1, 1, c);
  }

  hline(x: number, y: number, w: number, c: Color) {
    this.rect(x, y, w, 1, c);
  }

  vline(x: number, y: number, h: number, c: Color) {
    this.rect(x, y, 1, h, c);
  }

  clear(x: number, y: number, w: number, h: number) {
    this.ctx.clearRect(x, y, w, h);
  }

  /** Línea de Bresenham con trazo cuadrado de `size` píxeles. */
  line(x0: number, y0: number, x1: number, y1: number, c: Color, size = 1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.rect(x0, y0, size, size, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  circle(cx: number, cy: number, r: number, c: Color) {
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y) + 0.5);
      this.rect(cx - half, cy + y, half * 2 + 1, 1, c);
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: Color) {
    for (let y = -ry; y <= ry; y++) {
      const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))) + 0.5);
      this.rect(cx - half, cy + y, half * 2 + 1, 1, c);
    }
  }

  /** Rectángulo con borde de 1 px (tinta por defecto): ventanas, carteles, puertas. */
  box(x: number, y: number, w: number, h: number, fill: Color, border: Color = 'tinta') {
    this.rect(x, y, w, h, border);
    this.rect(x + 1, y + 1, w - 2, h - 2, fill);
  }

  /**
   * Pieza con contorno propio: se dibuja en una capa aparte, se le pone contorno y se pega encima.
   * Componer piezas así da las líneas interiores que separan pelo, cara, mochila, brazos...
   */
  part(x: number, y: number, w: number, h: number, draw: (q: Pixels) => void, outline: Color = 'tinta') {
    const q = new Pixels(w, h);
    draw(q);
    q.outline(0, 0, w, h, outline);
    this.ctx.drawImage(q.canvas, x, y);
  }

  /** Estampa un dibujo hecho con caracteres; los que no estén en `map` son transparentes. */
  pattern(x: number, y: number, rows: string[], map: Record<string, Color>) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const c = map[row[i]];
        if (c !== undefined) this.px(x + i, y + j, c);
      }
    });
  }

  /** Rellena con tramado ordenado (Bayer 4x4): `t` es la proporción de `b` entre 0 y 1. */
  dither(x: number, y: number, w: number, h: number, a: Color, b: Color, t: number) {
    this.mapRegion(x, y, w, h, (px, py) => {
      const threshold = (BAYER4[(py & 3) * 4 + (px & 3)] + 0.5) / 16;
      return t > threshold ? rgbOf(b) : rgbOf(a);
    });
  }

  /** Puntos sueltos al azar: suciedad, desconchones, textura de pared. */
  speckle(x: number, y: number, w: number, h: number, c: Color, density: number, rand: () => number) {
    const n = Math.round(w * h * density);
    for (let i = 0; i < n; i++) this.px(x + Math.floor(rand() * w), y + Math.floor(rand() * h), c);
  }

  /** Contorno de 1 px: cada píxel transparente que toca uno opaco (4 vecinos) se pinta de `c`. */
  outline(x: number, y: number, w: number, h: number, c: Color) {
    const img = this.ctx.getImageData(x, y, w, h);
    const d = img.data;
    const opaque = (i: number, j: number) => i >= 0 && j >= 0 && i < w && j < h && d[(j * w + i) * 4 + 3] > 0;
    const rgb = rgbOf(c);
    const marks: number[] = [];
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        if (opaque(i, j)) continue;
        if (opaque(i - 1, j) || opaque(i + 1, j) || opaque(i, j - 1) || opaque(i, j + 1)) marks.push(j * w + i);
      }
    }
    for (const k of marks) {
      d[k * 4] = (rgb >> 16) & 255;
      d[k * 4 + 1] = (rgb >> 8) & 255;
      d[k * 4 + 2] = rgb & 255;
      d[k * 4 + 3] = 255;
    }
    this.ctx.putImageData(img, x, y);
  }

  private mapRegion(x: number, y: number, w: number, h: number, fn: (px: number, py: number) => number) {
    if (w <= 0 || h <= 0) return;
    const img = this.ctx.createImageData(w, h);
    const d = img.data;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const rgb = fn(x + i, y + j);
        const k = (j * w + i) * 4;
        d[k] = (rgb >> 16) & 255;
        d[k + 1] = (rgb >> 8) & 255;
        d[k + 2] = rgb & 255;
        d[k + 3] = 255;
      }
    }
    this.ctx.putImageData(img, x, y);
  }
}
