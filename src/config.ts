const params = new URLSearchParams(location.search);

/** Móvil o tablet: pantalla táctil como entrada principal. `?tactil` lo fuerza en escritorio. */
export const IS_TOUCH = params.has('tactil') || matchMedia('(pointer: coarse)').matches;

// Resolución lógica: todo el arte se dibuja a 1:1 con 180 px de alto.
// En escritorio, 320x180 escalado por enteros. En móvil el ancho sigue la proporción de la pantalla
// en horizontal (390x180 en un 19,5:9) para ocuparla entera; se calcula una vez, aunque se cargue en vertical.
export const GAME_H = 180;
export const GAME_W = IS_TOUCH ? landscapeWidth() : 320;

function landscapeWidth() {
  // La pantalla física y no la ventana: en vertical las barras del navegador falsean la proporción
  const long = Math.max(screen.width, screen.height);
  const short = Math.min(screen.width, screen.height);
  const w = Math.round((GAME_H * long) / short / 2) * 2;
  return Math.min(432, Math.max(320, w));
}

// Calle de los Francos Viejos
export const WORLD_W = 1280;
export const FACADE_BASE_Y = 150; // línea donde las fachadas tocan la acera
export const FLOOR_Y = 162; // donde pisan los pies de Pablo

export const GRAVITY = 900;

export const PLAYER = {
  runSpeed: 92,
  accelGround: 1100,
  accelAir: 650,
  decelGround: 1500,
  jumpVelocity: 310,
  jumpCut: 0.45, // al soltar el salto mientras sube, la velocidad se multiplica por esto
  maxFall: 380,
  coyoteMs: 90,
  jumpBufferMs: 110,
  throwCooldownMs: 260,
  maxPackages: 3,
};

export const DEBUG = params.has('debug');

export const DEPTH = {
  sky: -100,
  far: -90,
  mid: -80,
  street: -70,
  facade: -60,
  props: -10,
  npc: 0,
  player: 10,
  packages: 11,
  fx: 12,
  bubble: 50,
  hud: 100,
};
