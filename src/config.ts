// Resolución lógica: todo el arte se dibuja a 1:1 sobre 320x180 y se escala por enteros.
export const GAME_W = 320;
export const GAME_H = 180;

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

export const DEBUG = new URLSearchParams(location.search).has('debug');

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
