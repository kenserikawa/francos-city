# Francos City — Guía de estilo y de arte

Todo lo que necesitas para dibujar en Aseprite y ver tu arte dentro del juego en segundos.

## Listón visual

**LISA: The Painful**, no Metal Slug. Pocas animaciones, siluetas muy claras, paleta con carácter
y composición de escena. La sensación de acción (golpes, polvo, temblores) la pone el código.

- Silueta antes que detalle: si a tamaño 1:1 no se reconoce al personaje en negro, falta forma, no píxeles.
- Pocos frames bien elegidos > muchos frames correctos.
- Gestos raros y expresivos: el humor sale de las poses.
- Contorno de 1 px en `tinta` (no negro puro). Luz desde arriba a la izquierda.

## Resolución

- El juego mide **320×180** y se escala por enteros (×4 = 1280×720, ×6 = 1920×1080).
- Dibuja siempre a 1:1. Nada de suavizado, rotaciones libres ni escalados no enteros.
- Referencia de tamaño: Pablo mide ~40 px y una puerta de planta baja ~46 px.

## Paleta

`art/paleta/francos-city.gpl`: 32 colores en 4 rampas (neutros/hormigón, cálidos, ocres/olivas, azules).

- **Cargarla en Aseprite:** en el panel de paleta, menú ☰ → *Load Palette* → elige el `.gpl`.
- Usa solo esos colores. El juego lee este mismo fichero: si retocas un color, cambia también el arte procedural.
- No renombres ni borres colores; el código los busca por nombre.
- Colores con intención: `butano` es la mochila de Pablo; `turquesa` es la marca del Plan de Autenticidad;
  `rosa-influencer`, el mundo de los Espectadores.

## Cómo entra tu arte en el juego

1. Dibuja en Aseprite. Guarda los `.aseprite` en `art/fuentes/`.
2. Exporta a `src/assets/sprites/<clave>.png` + `<clave>.json` (la clave es el nombre del fichero).
3. Con `npm run dev` abierto, la página se recarga y el juego usa tu arte en lugar del placeholder.

Lo que no hayas dibujado sigue siendo placeholder: puedes entregar a Pablo solo con `idle` y `run`
y el resto de animaciones caerán en esas.

**Exportar en Aseprite:** *File → Export Sprite Sheet*

- *Layout:* By Rows o Packed (da igual).
- *Sprite:* todas las capas y frames. *Borders:* sin *Trim* (deja el lienzo entero).
- *Output:* marca *Output File* → `src/assets/sprites/pablo.png`; marca *JSON Data* → `pablo.json`,
  formato *Array* o *Hash*. En *Meta*, marca **Tags**.

**Desde terminal** (si tienes Aseprite en el PATH):

```bash
aseprite -b art/fuentes/pablo.aseprite \
  --sheet src/assets/sprites/pablo.png \
  --data src/assets/sprites/pablo.json \
  --format json-array --list-tags
```

**Etiquetas (tags) = animaciones.** Los nombres van en minúsculas y exactos. La duración de cada frame
en Aseprite es la que usa el juego. Si el tag está en *Ping-pong*, se respeta.
`idle`, `run`, `fall` y `talk` se repiten en bucle; el resto se reproducen una vez.

**Plantillas:** en `art/plantillas/` están los placeholders exportados. En Aseprite, *File → Import
Sprite Sheet*, tipo *Horizontal Strip*, con el tamaño de frame indicado abajo: tendrás los frames ya
separados, con las proporciones y el punto de apoyo correctos, para dibujar encima.

## Encargos actuales

### Pablo — `pablo`

- Lienzo de **48×48** por frame. Mira a la **derecha** (el juego lo voltea).
- **Pies en la última fila**, centrados en x = 24. Mide ~40 px.
- Repartidor de una app de mensajería: la mochila cúbica es su silueta.

| Tag | Frames sugeridos | Duración | Notas |
|---|---|---|---|
| `idle` | 2–4 | 300–450 ms | respiración, peso |
| `run` | 6 | ~80 ms | ciclo completo |
| `jump` | 1–2 | — | subiendo |
| `fall` | 1–2 | ~120 ms | cayendo |
| `throw` | 3 | 40 / 90 / 90 ms | el paquete sale en el **2.º frame** |
| `hurt` | 1 | — | para el hito 3 |
| `talk` | 2 | ~160 ms | para el hito 2 |

Orden de la plantilla `pablo-placeholder.png` (17 frames de 48×48): idle×2, run×6, jump×1, fall×2, throw×3, hurt×1, talk×2.

La caja de colisión es de 12×34 px centrada abajo: no hace falta que el dibujo encaje exacto, pero que el cuerpo esté ahí.

### Doña Maruja — `maruja`

- Lienzo de **48×48**, pies en la última fila, centrada en x = 24. Mira a la **derecha**. Mide ~32 px.
- Bata, carrito de la compra, pelo recogido. Es la voz de "antes esto era un barrio".
- Tags: `idle` (2 frames, ~600 ms) y `talk` (2–4 frames, ~140 ms).
- Plantilla: `maruja-placeholder.png`, 6 frames de 48×48 (idle×2, talk×4).

### Bar Manolo — `bar-manolo`

- Lienzo de **160×112**. La base de la fachada en la última fila; se coloca centrado en la calle.
- Dos plantas: la taberna abajo (rótulo, toldo, escaparate, puerta de ~46 px) y una planta de viviendas.
- Tag `original` (1 frame). Más adelante el bar cambia según tus decisiones; serán tags nuevos
  en el mismo fichero: `protegido`, `memoria` (Espacio de Memoria Curada) y `cerrado`.
- Plantilla: `bar-manolo-placeholder.png`.

## Lo que hace el código (no hace falta dibujarlo)

Fachadas del resto de la calle, cielo y skyline, farolas, carteles del Plan, paquetes, partículas,
textos y placas. Todo con esta misma paleta. Si quieres sustituir alguno, se puede hacer igual que con
los personajes: dímelo y le doy una clave.
