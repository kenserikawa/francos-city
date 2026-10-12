# Francos City

Juego web estático (Phaser 4 + TypeScript + Vite). Sin backend: persistencia solo en `localStorage`.
Diseño y decisiones: `foundation-doc.md` (sección 20). Hitos: sección 19.

## Comandos

- `npm run dev` (puerto 5173; resérvalo con `ccres`), `npm run typecheck`, `npm run build`.
- Deploy: `.github/workflows/pages.yml` compila y publica `dist/` en GitHub Pages en cada push a `main`.
- `?calle` salta la portada; `?debug` activa el debug de Arcade. En dev, `window.game` es la instancia.

## Convenciones

- Resolución lógica 320x180, escalado entero. Todo el arte a 1:1, sin rotaciones libres ni escalados no enteros.
  Sin fundidos con alfa sobre texto con sombra: usar `blinkOut`.
- Colores siempre de `PAL` (`src/art/palette.ts`), que se lee de `art/paleta/francos-city.gpl` por nombre.
- Texto con la fuente bitmap propia (`src/art/font.ts`, clave `FONT_KEY`); cubre acentos, ñ, ¿¡ «» € y flechas.
- Sprites: el arte hecho a mano (`src/assets/sprites/<clave>.png|json`, exportado de Aseprite con tags) tiene
  prioridad; si no existe, `buildPlaceholders` genera uno procedural con la misma clave.
  Animaciones como `<clave>:<tag>`; resolver siempre con `animKey()` (aplica los fallbacks).
- El usuario diseña Pablo, Doña Maruja y el Bar Manolo; no sustituir su arte por arte generado.
  Los `pablo` y `maruja` actuales de `src/assets/sprites` son provisionales, generados con Stitch
  (colores ajustados a la paleta); el arte del usuario los reemplaza exportando con la misma clave.
- Textos del juego y comentarios en español.
- Git: el remoto es la cuenta personal (`git@github.com:kenserikawa/...`); la identidad la pone `includeIf`.
