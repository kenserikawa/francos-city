# Francos City

Side-scroller satírico en pixel art sobre un barrio de Mayrit y el Plan de Autenticidad.
Diseño en [`foundation-doc.md`](foundation-doc.md). Arte en [`art/GUIA-DE-ESTILO.md`](art/GUIA-DE-ESTILO.md).

## Arrancar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # página estática en dist/
```

- `?calle` salta la portada.
- `?debug` muestra las cajas de física.

## Controles

| Acción | Teclas |
|---|---|
| Andar | ← → / A D |
| Saltar (mantén para saltar más) | Z / Espacio / K |
| Lanzar paquete | X / J |
| Confirmar | Z / Intro |

## Meter arte de Aseprite

Exporta a `src/assets/sprites/<clave>.png` + `<clave>.json` con los tags activados. El juego lo detecta
y sustituye el placeholder de esa clave. Detalles, tamaños y nombres de animación en la guía de estilo.
