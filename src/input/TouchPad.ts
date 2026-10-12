import Phaser from 'phaser';
import { GAME_H } from '../config';
import { css, PAL, type ColorName } from '../art/palette';
import { Pixels } from '../art/pixels';
import { drawText, measureText, LINE_H } from '../art/font';
import type { Action } from './Controls';

/*
 * Controles táctiles para móvil: botones DOM encima del canvas, pintados como pixel art con la paleta
 * y escalados al mismo tamaño de píxel que el juego. Controls los lee igual que el teclado.
 * Izquierda: cruceta ◀ ▶ (se puede deslizar el dedo de un lado a otro). Derecha: lanzar y saltar.
 * Tocar cualquier otro sitio de la pantalla cuenta como "confirm".
 */

type Icon = (p: Pixels, cx: number, cy: number) => void;

/** Botón con labio inferior de 2 px; pulsado, la cara baja y el labio desaparece. */
function drawButton(shape: 'pad' | 'round', w: number, h: number, face: ColorName, lip: ColorName, icon: Icon, pressed: boolean) {
  const p = new Pixels(w + 2, h + 4);
  const fill = (y: number, c: ColorName) => {
    if (shape === 'round') {
      p.ellipse(1 + (w - 1) / 2, y + (h - 1) / 2, (w - 1) / 2, (h - 1) / 2, c);
    } else {
      p.rect(3, y, w - 4, h, c);
      p.rect(2, y + 1, w - 2, h - 2, c);
      p.rect(1, y + 2, w, h - 4, c);
    }
  };
  const y = pressed ? 3 : 1;
  if (!pressed) fill(3, lip);
  fill(y, face);
  icon(p, 1 + Math.floor(w / 2), y + Math.floor(h / 2));
  p.outline(0, 0, w + 2, h + 4, 'tinta');
  return p.canvas.toDataURL();
}

/** Flecha maciza de 6 px de largo con sombra; `dir` es hacia dónde apunta. */
const arrow = (dir: 'left' | 'right' | 'up'): Icon => (p, cx, cy) => {
  for (const [c, dy] of [['sombra', 1], ['papel', 0]] as const) {
    for (let i = 0; i < 6; i++) {
      const half = 5 - i; // de la base a la punta
      if (dir === 'up') p.hline(cx - half, cy + 2 - i + dy, half * 2 + 1, c);
      else {
        const x = cx - 3 + i;
        p.vline(dir === 'right' ? x : 2 * cx - 1 - x, cy - half + dy, half * 2 + 1, c);
      }
    }
  }
};

/** Paquete en vuelo: la caja de reparto con líneas de velocidad. */
const packageIcon: Icon = (p, cx, cy) => {
  p.hline(cx - 10, cy - 2, 3, 'papel');
  p.hline(cx - 11, cy + 1, 4, 'papel');
  p.part(cx - 5, cy - 5, 13, 11, (q) => {
    q.rect(1, 1, 11, 9, 'cuero');
    q.rect(1, 1, 11, 3, 'ocre');
    q.vline(6, 1, 9, 'trigo');
  });
};

const fullscreenIcon: Icon = (p, cx, cy) => {
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = cx + sx * 3, y = cy + sy * 3;
    p.hline(sx < 0 ? x : x - 2, y, 3, 'papel');
    p.vline(x, sy < 0 ? y : y - 2, 3, 'papel');
  }
};

/** Texto con la fuente del juego y sombra, para los avisos fuera del canvas. */
function textImage(text: string, color: ColorName) {
  const p = new Pixels(measureText(text) + 1, LINE_H + 1);
  drawText(p, text, 0, 1, 'tinta');
  drawText(p, text, 0, 0, color);
  return p.canvas.toDataURL();
}

/** Móvil en vertical, de 14x22, con la pantalla encendida. */
function phoneImage() {
  const p = new Pixels(16, 24);
  p.part(0, 0, 16, 24, (q) => {
    q.rect(1, 1, 14, 22, 'hormigon-oscuro');
    q.rect(3, 3, 10, 15, 'celeste-sucio');
    q.rect(3, 3, 10, 2, 'turquesa');
    q.rect(6, 20, 4, 1, 'hormigon');
  });
  return p.canvas.toDataURL();
}

const STYLE = `
:root { --s: 2; }
.tp { position: fixed; inset: 0; z-index: 10; pointer-events: none; }
.tp[hidden] { display: none; }
.tp img { display: block; image-rendering: pixelated; pointer-events: none; }
.tp-ctl { position: absolute; pointer-events: auto; touch-action: none; opacity: .8; }
.tp-pad { left: 0; bottom: 0; display: flex; gap: calc(var(--s) * 2px);
  padding: calc(var(--s) * 6px); padding-left: calc(var(--s) * 6px + env(safe-area-inset-left)); }
.tp-throw { right: calc(var(--s) * 30px + env(safe-area-inset-right)); bottom: 0; padding: calc(var(--s) * 4px); }
.tp-jump { right: env(safe-area-inset-right); bottom: calc(var(--s) * 9px); padding: calc(var(--s) * 4px); }
.tp-fs { position: fixed; top: 0; right: env(safe-area-inset-right); z-index: 11; padding: calc(var(--s) * 3px); opacity: .7; }
.tp-fs[hidden] { display: none; }
.tp-fs img { display: block; image-rendering: pixelated; }
.tp-gira { position: fixed; inset: 0; z-index: 20; display: none; flex-direction: column; align-items: center;
  justify-content: center; gap: 24px; background: ${css(PAL.tinta)}; }
.tp-gira img { image-rendering: pixelated; }
.tp-gira .tp-movil { width: 64px; animation: tp-gira 1.6s steps(1) infinite; }
@keyframes tp-gira { 50% { transform: rotate(-90deg); } }
@media (orientation: portrait) { .tp-gira { display: flex; } }
`;

/** Imagen pixel art escalada con la variable --s (px CSS por píxel del juego). */
function pixelImg(src: string, w: number) {
  const img = document.createElement('img');
  img.src = src;
  img.style.width = `calc(var(--s) * ${w}px)`;
  img.draggable = false;
  return img;
}

class TouchPad {
  private held = new Map<Action, number>();
  private pressedAt = new Map<Action, number>();
  private root?: HTMLDivElement;

  isDown(action: Action) {
    return (this.held.get(action) ?? 0) > 0;
  }

  /** Si la acción se pulsó después de `time` (performance.now), aunque ya se haya soltado. */
  pressedSince(action: Action, time: number) {
    return (this.pressedAt.get(action) ?? -1) > time;
  }

  setVisible(visible: boolean) {
    if (!this.root) return;
    this.root.hidden = !visible;
    if (!visible) this.held.clear();
  }

  mount(game: Phaser.Game) {
    if (this.root) return;
    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.append(style);

    const root = (this.root = document.createElement('div'));
    root.className = 'tp';
    root.hidden = true;

    // Cruceta: un solo control para poder deslizar entre izquierda y derecha sin levantar el dedo
    const pad = document.createElement('div');
    pad.className = 'tp-ctl tp-pad';
    const sides = (['left', 'right'] as const).map((dir) => {
      const art = [false, true].map((pressed) => drawButton('pad', 24, 22, 'hormigon-oscuro', 'sombra', arrow(dir), pressed));
      const img = pixelImg(art[0], 26);
      pad.append(img);
      return { dir, img, art };
    });
    let padPointer: number | null = null;
    let padDir: Action | null = null;
    const setDir = (dir: Action | null) => {
      if (dir === padDir) return;
      if (padDir) this.release(padDir);
      if (dir) this.press(dir);
      padDir = dir;
      for (const s of sides) s.img.src = s.art[s.dir === dir ? 1 : 0];
    };
    const dirAt = (e: PointerEvent): Action => {
      const r = pad.getBoundingClientRect();
      return e.clientX < r.left + r.width / 2 ? 'left' : 'right';
    };
    pad.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (padPointer !== null) return;
      padPointer = e.pointerId;
      pad.setPointerCapture(e.pointerId);
      setDir(dirAt(e));
    });
    pad.addEventListener('pointermove', (e) => {
      if (e.pointerId === padPointer) setDir(dirAt(e));
    });
    const padEnd = (e: PointerEvent) => {
      if (e.pointerId !== padPointer) return;
      padPointer = null;
      setDir(null);
    };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) pad.addEventListener(type, padEnd);
    root.append(pad);

    const throwBtn = this.actionButton('tp-throw', ['throw'], 'amarillo', 'mostaza', packageIcon);
    const jumpBtn = this.actionButton('tp-jump', ['jump', 'confirm'], 'terracota', 'terracota-oscura', arrow('up'));
    root.append(throwBtn, jumpBtn);
    document.body.append(root);

    // Tocar fuera de los botones: confirmar (empezar en la portada, pasar diálogos más adelante)
    window.addEventListener('pointerdown', () => this.tap('confirm'));
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('blur', () => this.held.clear());

    this.mountFullscreen();
    this.mountRotateNotice();

    // Mismo tamaño de píxel que el juego, con un mínimo para que los botones se puedan pulsar con el pulgar
    const fit = () => {
      const s = Math.max(2, game.canvas.getBoundingClientRect().height / GAME_H);
      document.documentElement.style.setProperty('--s', s.toFixed(3));
    };
    new ResizeObserver(fit).observe(game.canvas);
    fit();
  }

  private actionButton(className: string, actions: Action[], face: ColorName, lip: ColorName, icon: Icon) {
    const btn = document.createElement('div');
    btn.className = `tp-ctl ${className}`;
    const art = [false, true].map((pressed) => drawButton('round', 25, 25, face, lip, icon, pressed));
    const img = pixelImg(art[0], 27);
    btn.append(img);
    let pointer: number | null = null;
    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (pointer !== null) return;
      pointer = e.pointerId;
      btn.setPointerCapture(e.pointerId);
      actions.forEach((a) => this.press(a));
      img.src = art[1];
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      pointer = null;
      actions.forEach((a) => this.release(a));
      img.src = art[0];
    };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) btn.addEventListener(type, end);
    return btn;
  }

  /** Pantalla completa y horizontal al primer toque (Android); botón para volver si se sale. */
  private mountFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenEnabled || !el.requestFullscreen) return;
    const enter = () => {
      el.requestFullscreen({ navigationUI: 'hide' })
        .then(() => (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape'))
        .catch(() => {});
    };
    // pointerup y no pointerdown: con el dedo, solo el primero cuenta como gesto del usuario
    window.addEventListener('pointerup', enter, { once: true });

    const btn = document.createElement('div');
    btn.className = 'tp-fs';
    const img = pixelImg(drawButton('pad', 13, 13, 'sombra', 'tinta', fullscreenIcon, false), 15);
    btn.append(img);
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    btn.addEventListener('click', enter);
    const sync = () => (btn.hidden = !!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    sync();
    document.body.append(btn);
  }

  private mountRotateNotice() {
    const notice = document.createElement('div');
    notice.className = 'tp-gira';
    const phone = pixelImg(phoneImage(), 16);
    phone.className = 'tp-movil';
    phone.style.width = '64px';
    const text = document.createElement('img');
    const src = textImage('Gira el móvil', 'papel');
    text.src = src;
    text.style.width = `${(measureText('Gira el móvil') + 1) * 3}px`;
    notice.append(phone, text);
    document.body.append(notice);
  }

  private press(action: Action) {
    this.held.set(action, (this.held.get(action) ?? 0) + 1);
    this.pressedAt.set(action, performance.now());
  }

  private release(action: Action) {
    this.held.set(action, Math.max(0, (this.held.get(action) ?? 0) - 1));
  }

  private tap(action: Action) {
    this.pressedAt.set(action, performance.now());
  }
}

/** Estado táctil compartido por todas las escenas. */
export const touch = new TouchPad();
