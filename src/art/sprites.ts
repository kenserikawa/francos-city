import Phaser from 'phaser';
import { Pixels, type Color } from './pixels';

/*
 * Arte hecho a mano: exporta desde Aseprite a src/assets/sprites/<clave>.png + <clave>.json.
 * Vite los descubre al compilar; si no existen, el juego usa los placeholders procedurales
 * con la misma clave y los mismos nombres de animación. Ver art/GUIA-DE-ESTILO.md.
 */

interface AsepriteFrame {
  filename?: string;
  duration: number;
}

export interface AsepriteJson {
  frames: AsepriteFrame[] | Record<string, AsepriteFrame>;
  meta: { frameTags?: { name: string; from: number; to: number; direction?: string }[] };
}

const pngs = import.meta.glob<string>('../assets/sprites/*.png', { eager: true, query: '?url', import: 'default' });
const jsons = import.meta.glob<AsepriteJson>('../assets/sprites/*.json', { eager: true, import: 'default' });

export interface UserSprite {
  key: string;
  png: string;
  json?: AsepriteJson;
}

export const userSprites: UserSprite[] = Object.entries(pngs).map(([path, png]) => ({
  key: path.split('/').pop()!.replace(/\.png$/, ''),
  png,
  json: jsons[path.replace(/\.png$/, '.json')],
}));

const LOOPING = new Set(['idle', 'run', 'walk', 'fall', 'talk']);

// Si falta una animación, se usa la primera de su lista que exista (y al final idle/original).
const FALLBACK: Record<string, string[]> = {
  run: ['walk'],
  jump: ['fall'],
  fall: ['jump'],
  protegido: ['original'],
  memoria: ['original'],
  cerrado: ['original'],
};

export function animKey(scene: Phaser.Scene, key: string, name: string): string {
  for (const n of [name, ...(FALLBACK[name] ?? []), 'idle', 'original']) {
    if (scene.anims.exists(`${key}:${n}`)) return `${key}:${n}`;
  }
  return `${key}:${name}`;
}

/** Animaciones a partir de las etiquetas (tags) de Aseprite, con la duración de cada frame. */
export function createAnimsFromAseprite(scene: Phaser.Scene, key: string, json: AsepriteJson) {
  const list = Array.isArray(json.frames) ? json.frames : Object.values(json.frames);
  const names = Array.isArray(json.frames) ? json.frames.map((f) => f.filename!) : Object.keys(json.frames);
  const tags = json.meta.frameTags?.length ? json.meta.frameTags : [{ name: 'idle', from: 0, to: list.length - 1 }];
  for (const tag of tags) {
    const frames: Phaser.Types.Animations.AnimationFrame[] = [];
    for (let i = tag.from; i <= tag.to; i++) frames.push({ key, frame: names[i], duration: list[i].duration });
    const direction = 'direction' in tag ? tag.direction : 'forward';
    if (direction === 'reverse') frames.reverse();
    scene.anims.create({
      key: `${key}:${tag.name}`,
      frames,
      repeat: LOOPING.has(tag.name) ? -1 : 0,
      yoyo: direction === 'pingpong',
    });
  }
}

/** Un PNG suelto sin JSON: una única animación estática. */
export function createStaticAnim(scene: Phaser.Scene, key: string) {
  scene.anims.create({ key: `${key}:idle`, frames: [{ key }] });
}

export interface FrameSpec {
  draw: (p: Pixels, ox: number, oy: number) => void;
  ms: number;
}

/**
 * Hoja de sprites procedural: dibuja cada frame, le pone contorno y registra frames y animaciones
 * con las mismas claves que tendría el arte exportado de Aseprite.
 */
export function buildSheet(
  scene: Phaser.Scene,
  key: string,
  fw: number,
  fh: number,
  anims: Record<string, FrameSpec[]>,
  outline?: Color,
) {
  const total = Object.values(anims).reduce((n, frames) => n + frames.length, 0);
  const p = new Pixels(fw * total, fh);
  const layout: { anim: string; name: string; ox: number; ms: number }[] = [];
  let i = 0;
  for (const [anim, frames] of Object.entries(anims)) {
    frames.forEach((spec, j) => {
      const ox = i * fw;
      spec.draw(p, ox, 0);
      if (outline !== undefined) p.outline(ox, 0, fw, fh, outline);
      layout.push({ anim, name: `${anim}-${j}`, ox, ms: spec.ms });
      i++;
    });
  }
  const tex = scene.textures.addCanvas(key, p.canvas);
  if (!tex) throw new Error(`No se pudo crear la textura ${key}`);
  for (const f of layout) tex.add(f.name, 0, f.ox, 0, fw, fh);
  for (const anim of Object.keys(anims)) {
    scene.anims.create({
      key: `${key}:${anim}`,
      frames: layout.filter((f) => f.anim === anim).map((f) => ({ key, frame: f.name, duration: f.ms })),
      repeat: LOOPING.has(anim) ? -1 : 0,
    });
  }
}

/** Textura simple de un solo frame dibujada por código. */
export function buildTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (p: Pixels) => void) {
  const p = new Pixels(w, h);
  draw(p);
  if (!scene.textures.addCanvas(key, p.canvas)) throw new Error(`No se pudo crear la textura ${key}`);
}
