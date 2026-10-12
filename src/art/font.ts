import Phaser from 'phaser';
import type { Pixels, Color } from './pixels';

/*
 * Fuente pixel propia, proporcional. Mayúsculas de 7 px, minúsculas de 5 px, descendentes de 2 px.
 * Cada glifo se define con filas de '#' y '.'; el número opcional `d` indica cuántas filas quedan
 * por debajo de la línea base (negativo para subir signos como el guion o las comillas).
 */

export const FONT_KEY = 'fuente';
const BASE = 9; // fila de la línea base dentro de la celda (deja 2 filas arriba para tildes de mayúsculas)
const CELL_H = 11;
export const LINE_H = 12;

type Def = string | [string, number];

const DEFS: Record<string, Def> = {
  A: '.##.|#..#|#..#|####|#..#|#..#|#..#',
  B: '###.|#..#|#..#|###.|#..#|#..#|###.',
  C: '.##.|#..#|#...|#...|#...|#..#|.##.',
  D: '###.|#..#|#..#|#..#|#..#|#..#|###.',
  E: '####|#...|#...|###.|#...|#...|####',
  F: '####|#...|#...|###.|#...|#...|#...',
  G: '.##.|#..#|#...|#.##|#..#|#..#|.###',
  H: '#..#|#..#|#..#|####|#..#|#..#|#..#',
  I: '###|.#.|.#.|.#.|.#.|.#.|###',
  J: '..##|...#|...#|...#|#..#|#..#|.##.',
  K: '#..#|#..#|#.#.|##..|#.#.|#..#|#..#',
  L: '#...|#...|#...|#...|#...|#...|####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
  N: '#..#|##.#|##.#|#.##|#.##|#..#|#..#',
  O: '.##.|#..#|#..#|#..#|#..#|#..#|.##.',
  P: '###.|#..#|#..#|###.|#...|#...|#...',
  Q: '.##.|#..#|#..#|#..#|#..#|#.#.|.#.#',
  R: '###.|#..#|#..#|###.|#.#.|#..#|#..#',
  S: '.###|#...|#...|.##.|...#|...#|###.',
  T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
  U: '#..#|#..#|#..#|#..#|#..#|#..#|.##.',
  V: '#...#|#...#|#...#|.#.#.|.#.#.|.#.#.|..#..',
  W: '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#',
  X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
  Z: '#####|....#|...#.|..#..|.#...|#....|#####',

  a: '.##.|...#|.###|#..#|.###',
  b: '#...|#...|###.|#..#|#..#|#..#|###.',
  c: '.##|#..|#..|#..|.##',
  d: '...#|...#|.###|#..#|#..#|#..#|.###',
  e: '.##.|#..#|####|#...|.###',
  f: '.##|#..|###|#..|#..|#..|#..',
  g: ['.###|#..#|#..#|#..#|.###|...#|.##.', 2],
  h: '#...|#...|###.|#..#|#..#|#..#|#..#',
  i: '#|.|#|#|#|#|#',
  j: ['.#|..|.#|.#|.#|.#|.#|.#|#.', 2],
  k: '#...|#...|#..#|#.#.|##..|#.#.|#..#',
  l: '#.|#.|#.|#.|#.|#.|.#',
  m: '##.#.|#.#.#|#.#.#|#.#.#|#.#.#',
  n: '###.|#..#|#..#|#..#|#..#',
  o: '.##.|#..#|#..#|#..#|.##.',
  p: ['###.|#..#|#..#|#..#|###.|#...|#...', 2],
  q: ['.###|#..#|#..#|#..#|.###|...#|...#', 2],
  r: '#.##|##..|#...|#...|#...',
  s: '.###|#...|.##.|...#|###.',
  t: '#..|###|#..|#..|#..|.##',
  u: '#..#|#..#|#..#|#..#|.###',
  v: '#...#|#...#|.#.#.|.#.#.|..#..',
  w: '#...#|#...#|#.#.#|#.#.#|.#.#.',
  x: '#..#|#..#|.##.|#..#|#..#',
  y: ['#..#|#..#|#..#|#..#|.###|...#|.##.', 2],
  z: '####|..#.|.#..|#...|####',
  'ı': '#|#|#|#|#',

  '0': '.##.|#..#|#..#|#.##|##.#|#..#|.##.',
  '1': '.#.|##.|.#.|.#.|.#.|.#.|###',
  '2': '.##.|#..#|...#|..#.|.#..|#...|####',
  '3': '###.|...#|...#|.##.|...#|...#|###.',
  '4': '..#.|.##.|#.#.|#.#.|####|..#.|..#.',
  '5': '####|#...|###.|...#|...#|#..#|.##.',
  '6': '.##.|#...|#...|###.|#..#|#..#|.##.',
  '7': '####|...#|...#|..#.|.#..|.#..|.#..',
  '8': '.##.|#..#|#..#|.##.|#..#|#..#|.##.',
  '9': '.##.|#..#|#..#|.###|...#|...#|.##.',

  ' ': '..',
  '.': '#',
  ',': ['.#|#.', 1],
  ':': '#|.|.|#',
  ';': ['.#|..|..|.#|#.', 1],
  '!': '#|#|#|#|#|.|#',
  '?': '.##.|#..#|...#|..#.|.#..|....|.#..',
  '¡': ['#|.|#|#|#|#|#', 2],
  '¿': ['..#.|....|..#.|.#..|#...|#..#|.##.', 2],
  "'": ['#|#', -5],
  '"': ['#.#|#.#', -5],
  '-': ['###', -2],
  '–': ['####', -2],
  '—': ['#####', -2],
  '(': ['.#|#.|#.|#.|#.|#.|#.|.#', 1],
  ')': ['#.|.#|.#|.#|.#|.#|.#|#.', 1],
  '/': '..#|..#|.#.|.#.|.#.|#..|#..',
  '+': ['.#.|###|.#.', -1],
  '=': ['###|...|###', -1],
  '%': '#...#|...#.|..#..|.#...|#...#',
  '€': '..###|.#...|####.|.#...|####.|.#...|..###',
  '*': ['#.#|.#.|#.#', -3],
  '_': ['####', 1],
  '«': ['.#.#|#.#.|.#.#', -1],
  '»': ['#.#.|.#.#|#.#.', -1],
  '…': '#.#.#',
  '·': ['#', -2],
  'º': ['.#.|#.#|.#.|...|###', -2],
  '→': '..#..|...#.|#####|...#.|..#..',
  '←': '..#..|.#...|#####|.#...|..#..',
  '↑': '..#..|.###.|#.#.#|..#..|..#..',
  '↓': '..#..|..#..|#.#.#|.###.|..#..',
};

const ACUTE = '.#|#.';
const TILDE = '.#.#|#.#.';
const DIAERESIS = '#..#';

const COMPOSED: Record<string, [string, string]> = {
  'á': ['a', ACUTE], 'é': ['e', ACUTE], 'í': ['ı', ACUTE], 'ó': ['o', ACUTE], 'ú': ['u', ACUTE],
  'Á': ['A', ACUTE], 'É': ['E', ACUTE], 'Í': ['I', ACUTE], 'Ó': ['O', ACUTE], 'Ú': ['U', ACUTE],
  'ñ': ['n', TILDE], 'Ñ': ['N', TILDE], 'ü': ['u', DIAERESIS], 'Ü': ['U', DIAERESIS],
};

/** Celda completa de un glifo: CELL_H filas × `w` columnas. */
interface Glyph { w: number; on: boolean[][] }

function place(def: Def): Glyph {
  const [src, d] = typeof def === 'string' ? [def, 0] : def;
  const rows = src.split('|');
  const w = Math.max(...rows.map((r) => r.length));
  const top = BASE - (rows.length - d);
  const on = Array.from({ length: CELL_H }, () => new Array<boolean>(w).fill(false));
  rows.forEach((r, j) => {
    for (let i = 0; i < r.length; i++) if (r[i] === '#') on[top + j][i] = true;
  });
  return { w, on };
}

function compose(base: Glyph, accentSrc: string): Glyph {
  const acc = accentSrc.split('|');
  const aw = Math.max(...acc.map((r) => r.length));
  const w = Math.max(base.w, aw);
  const bx = Math.floor((w - base.w) / 2);
  const ax = Math.floor((w - aw) / 2);
  const on = Array.from({ length: CELL_H }, () => new Array<boolean>(w).fill(false));
  base.on.forEach((row, j) => row.forEach((v, i) => { if (v) on[j][bx + i] = true; }));
  const baseTop = base.on.findIndex((row) => row.some(Boolean));
  // Minúsculas: un píxel de aire entre tilde y letra. Mayúsculas: pegada (no hay más sitio).
  const lowercase = baseTop >= BASE - 5;
  const bottom = baseTop - (lowercase ? 2 : 1);
  acc.forEach((r, j) => {
    const y = bottom - (acc.length - 1) + j;
    for (let i = 0; i < r.length; i++) if (r[i] === '#') on[y][ax + i] = true;
  });
  return { w, on };
}

const GLYPHS = new Map<string, Glyph>();
for (const [ch, def] of Object.entries(DEFS)) GLYPHS.set(ch, place(def));
for (const [ch, [base, acc]] of Object.entries(COMPOSED)) GLYPHS.set(ch, compose(GLYPHS.get(base)!, acc));

const glyphFor = (ch: string) => GLYPHS.get(ch) ?? GLYPHS.get('?')!;

export function measureText(text: string): number {
  let w = 0;
  for (const ch of text) w += glyphFor(ch).w + 1;
  return Math.max(0, w - 1);
}

/** Dibuja texto directamente sobre un lienzo procedural (rótulos, carteles). `y` es la parte alta de la celda. */
export function drawText(px: Pixels, text: string, x: number, y: number, color: Color) {
  let cx = x;
  for (const ch of text) {
    const g = glyphFor(ch);
    g.on.forEach((row, j) => row.forEach((v, i) => { if (v) px.px(cx + i, y + j, color); }));
    cx += g.w + 1;
  }
}

/** Alto real de una línea de mayúsculas, útil para centrar rótulos: la celda empieza 2 filas por encima. */
export const CAP_TOP = BASE - 7;

/** Genera la textura de la fuente (glifos en blanco, para teñir) y la registra como BitmapFont. */
export function registerFont(scene: Phaser.Scene) {
  if (scene.cache.bitmapFont.exists(FONT_KEY)) return;
  const entries = [...GLYPHS.entries()];
  const width = entries.reduce((sum, [, g]) => sum + g.w + 1, 0);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = CELL_H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';

  let x = 0;
  const chars: string[] = [];
  for (const [ch, g] of entries) {
    g.on.forEach((row, j) => row.forEach((v, i) => { if (v) ctx.fillRect(x + i, j, 1, 1); }));
    chars.push(`<char id="${ch.codePointAt(0)}" x="${x}" y="0" width="${g.w}" height="${CELL_H}" xoffset="0" yoffset="0" xadvance="${g.w + 1}"/>`);
    x += g.w + 1;
  }

  const xml = new DOMParser().parseFromString(
    `<font><info face="${FONT_KEY}" size="${CELL_H}"/><common lineHeight="${LINE_H}" base="${BASE}"/>` +
      `<chars count="${chars.length}">${chars.join('')}</chars></font>`,
    'application/xml',
  );
  const texture = scene.textures.addCanvas(FONT_KEY, canvas);
  if (!texture) throw new Error('No se pudo crear la textura de la fuente');
  const data = Phaser.GameObjects.BitmapText.ParseXMLBitmapFont(xml, texture.get(), 0, 0);
  scene.cache.bitmapFont.add(FONT_KEY, { data, texture: FONT_KEY, frame: null });
}
