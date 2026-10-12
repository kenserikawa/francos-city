# Francos City

Juego web estático (Phaser 4 + TypeScript + Vite). Sin backend: persistencia solo en `localStorage`.
Diseño y decisiones: `foundation-doc.md` (sección 20). Hitos: sección 19.

## Comandos

- `npm run dev` (puerto 5173; resérvalo con `ccres`), `npm run typecheck`, `npm run build`.
- Deploy: `.github/workflows/pages.yml` compila y publica `dist/` en GitHub Pages en cada push a `main`.
- `?calle` salta la portada; `?debug` activa el debug de Arcade; `?tactil` fuerza el modo móvil en escritorio. En dev, `window.game` es la instancia.

## Convenciones

- Móvil (`IS_TOUCH`, puntero `coarse`): ancho lógico según la proporción de la pantalla en horizontal (hasta 432x180),
  escalado FIT a pantalla completa y controles DOM de `src/input/TouchPad.ts`, que `Controls` lee como el teclado.
  Usar siempre `GAME_W` (no 320) para maquetar el HUD.
- Resolución lógica 320x180 en escritorio, escalado entero. Todo el arte a 1:1, sin rotaciones libres ni escalados no enteros.
  Sin fundidos con alfa sobre texto con sombra: usar `blinkOut`.
- Colores siempre de `PAL` (`src/art/palette.ts`), que se lee de `art/paleta/francos-city.gpl` por nombre.
- Texto con la fuente bitmap propia (`src/art/font.ts`, clave `FONT_KEY`); cubre acentos, ñ, ¿¡ «» € y flechas.
- Sprites: el arte hecho a mano (`src/assets/sprites/<clave>.png|json`, exportado de Aseprite con tags) tiene
  prioridad; si no existe, `buildPlaceholders` genera uno procedural con la misma clave.
  Animaciones como `<clave>:<tag>`; resolver siempre con `animKey()` (aplica los fallbacks).
- El usuario diseña Pablo, Doña Maruja y el Bar Manolo; no sustituir su arte por arte generado.
  Los `pablo` y `maruja` actuales de `src/assets/sprites` son provisionales: los genera
  `art/generador/personajes.py` (rejillas de letras con la paleta; `python3 art/generador/personajes.py`).
  El arte del usuario los reemplaza exportando con la misma clave; entonces no volver a ejecutar el generador.
- Estilo de personajes: el de los secundarios de LISA. Cabeza enorme (más de la mitad de la altura),
  cuerpo corto, piernas como dos muñones (las de Brad), manoplas redondas, nariz larga y ojos de punto,
  contorno negro de 1 px alrededor de cada pieza (cabeza, brazos, cuerpo) y una sombra plana por material.
  Los dos brazos se ven siempre; en 3/4, el cercano va por delante de lo que se lleve a la espalda.
- Textos del juego y comentarios en español.
- Git: el remoto es la cuenta personal (`git@github.com:kenserikawa/...`); la identidad la pone `includeIf`.
