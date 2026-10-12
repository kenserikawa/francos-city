#!/usr/bin/env python3
"""
Personajes provisionales al estilo de la referencia (LISA): cabezones, cuerpo corto, piernas mínimas,
manoplas redondas y contorno negro de 1 px alrededor de cada pieza, de modo que cabeza, brazos y
cuerpo quedan separados por una línea de tinta.

Escribe src/assets/sprites/<clave>.png + .json (formato Aseprite con tags), que el juego carga igual
que el arte exportado a mano. Con --preview guarda además una ampliación en la ruta indicada.

  python3 art/generador/personajes.py [--preview carpeta]

Cada pieza es una rejilla de letras (ver LEYENDA); '.' es transparente. Las piezas se contornean
por separado y se apilan de atrás adelante. Los rasgos de la cara van encima, sin contorno.
"""
import json
import sys
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
GPL = RAIZ / 'art/paleta/francos-city.gpl'
SALIDA = RAIZ / 'src/assets/sprites'

LEYENDA = {
    'k': 'tinta', 's': 'sombra', 'h': 'hormigon-oscuro', 'g': 'hormigon', 'i': 'piedra', 'j': 'arena-gris',
    'c': 'cal', 'w': 'papel',
    'v': 'vino', 'l': 'ladrillo', 'T': 'terracota-oscura', 't': 'terracota', 'a': 'albaricoque', 'm': 'melocoton',
    'r': 'alarma', 'y': 'amarillo',
    'd': 'tierra', 'U': 'cuero', 'o': 'ocre', 'Y': 'mostaza', 'u': 'trigo',
    'Q': 'oliva-oscuro', 'O': 'oliva', 'P': 'olivo-claro',
    'n': 'noche', 'p': 'pizarra', 'Z': 'azulejo-oscuro', 'z': 'azulejo', 'x': 'cielo-polvo', 'e': 'celeste-sucio',
    'q': 'turquesa', 'R': 'rosa-influencer', 'f': 'fosforito', 'F': 'fosforito-oscuro',
}


def cargar_paleta():
    pal = {}
    for linea in GPL.read_text().splitlines():
        partes = linea.split()
        if len(partes) >= 4 and all(p.isdigit() for p in partes[:3]):
            pal[partes[3]] = tuple(int(p) for p in partes[:3]) + (255,)
    return pal


PAL = cargar_paleta()


class Pieza:
    """Rejilla de píxeles. Con contorno, se rodea de tinta (vecinos en cruz: esquinas redondeadas)."""

    def __init__(self, filas, contorno=True):
        self.px = {}
        for y, fila in enumerate(filas):
            for x, ch in enumerate(fila):
                if ch not in '. ':
                    assert ch in LEYENDA, f'letra desconocida {ch!r}'
                    self.px[(x, y)] = ch
        if contorno:
            borde = {}
            for (x, y) in self.px:
                for v in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if v not in self.px:
                        borde[v] = 'k'
            self.px.update(borde)


def rasgos(filas, y0=0):
    """Detalles pintados encima sin contorno (ojos, boca, logos), empezando en la fila y0."""
    return Pieza([''] * y0 + filas, contorno=False)


def componer(w, h, capas):
    """capas: lista de (pieza, dx, dy) de atrás adelante."""
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    for pieza, dx, dy in capas:
        if pieza is None:
            continue
        for (x, y), ch in pieza.px.items():
            X, Y = x + dx, y + dy
            if 0 <= X < w and 0 <= Y < h:
                im.putpixel((X, Y), PAL[LEYENDA[ch]])
    return im


def exportar(clave, w, h, anims):
    """anims: lista de (tag, [(imagen, ms), ...]). Escribe PNG + JSON con el formato de Aseprite."""
    total = sum(len(fr) for _, fr in anims)
    hoja = Image.new('RGBA', (w * total, h), (0, 0, 0, 0))
    frames, tags, i = [], [], 0
    for tag, lista in anims:
        tags.append({'name': tag, 'from': i, 'to': i + len(lista) - 1, 'direction': 'forward'})
        for im, ms in lista:
            hoja.paste(im, (i * w, 0))
            rect = {'x': i * w, 'y': 0, 'w': w, 'h': h}
            frames.append({
                'filename': f'{tag} {i}', 'frame': rect, 'rotated': False, 'trimmed': False,
                'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h}, 'sourceSize': {'w': w, 'h': h},
                'duration': ms,
            })
            i += 1
    hoja.save(SALIDA / f'{clave}.png', optimize=True)
    meta = {'app': 'art/generador/personajes.py', 'image': f'{clave}.png', 'format': 'RGBA8888',
            'size': {'w': w * total, 'h': h}, 'scale': '1', 'frameTags': tags}
    (SALIDA / f'{clave}.json').write_text(json.dumps({'frames': frames, 'meta': meta}, indent=1) + '\n')
    return hoja


# ---------------------------------------------------------------------------------------------
# Pablo: repartidor con casco de bici, chaleco fosforito, mochila cúbica amarilla, bigote y nariz larga.
# Mira a la derecha en 3/4: la oreja y la mochila quedan a la izquierda.

PABLO_W, PABLO_H = 32, 38               # 2 px de aire para el casco al saltar

CABEZA = Pieza([
    ".......s..s.s........",
    ".....s.ss.sss.s......",
    "...ssssssssssssss....",
    "..ssssssssssssssss...",
    ".sshhssssssssssssss..",
    ".shsssssssssssssssss.",
    "ssssssssssssssssssss.",
    "ssssssssssmsssmmsmms.",
    "sssssssmmmmmmmmmmmmm.",
    "sssssammmmmmmmmmmmmm.",
    "sssmmsammmmmmmmmmmmm.",
    "ssmaaTammmmmmmmmmmmm.",
    "ssmaTmammmmmmmmmmmmm.",
    "ssmmaTammmmmmmmmmmmm.",
    ".ssmmmammmmmmmmmmmmm.",
    ".sssmaammmmmmmmmmmmm.",
    "..ssaammmmmmmmmmmmmm.",
    "...saammmmmmmmmmmmm..",
    "....aaammmmmmmmmmm...",
    "......aammmmmmmmm....",
])

# Rasgos sobre la cabeza (mismas coordenadas): nariz larga, bigote y perilla.
NARIZ = rasgos([
    ".............a",
    ".............a",
    ".............at",
    ".............att",
    "............attt",
    "............tTTt",
], y0=9)
BARBA = rasgos([
    "...........ssssss",
    "..........ssssssss",
    "",
    ".............ss",
    ".............s",
], y0=15)
CEJAS = {
    'normal': rasgos([".........sss.....sss"], y0=8),
    'arriba': rasgos([".........sss.....sss"], y0=7),
    'enfado': rasgos([".........ss.......ss",
                      "...........s.....s"], y0=8),
}
OJOS = {
    'normal': rasgos(["..........k......k",
                      "..........k......k",
                      ".........aa......aa"], y0=10),
    'cerrados': rasgos([".........kk......kk",
                        ".........aa......aa"], y0=11),
    'abajo': rasgos(["..........k......k",
                     "..........k......k"], y0=11),
    'susto': rasgos([".........ww......ww",
                     ".........kw......kw",
                     ".........ww......ww"], y0=10),
}
BOCA = {
    'normal': rasgos([]),
    'abierta': rasgos(["............kvvk"], y0=17),
    'grito': rasgos(["...........kvvvk",
                     "...........kvRvk",
                     "............kkk"], y0=17),
}

# Chaleco reflectante sobre la chaqueta azul: banda plateada y el bajo de la chaqueta asomando
TORSO = Pieza([
    "..fffffff..",
    ".fffffffff.",
    "fffffffffff",
    "fUfffffffff",
    "FUfffffffff",
    "cUccccccccc",
    "FUfffffffff",
    "FFfffffffff",
    "ZZZZZZZZZZZ",
])

# Casco de bici con rejillas, visera delante y cola detrás. Va sobre la cabeza (dx -1, dy -2).
CASCO = Pieza([
    "........wwwwwwww........",
    ".....wwwwwwwwwwwwww.....",
    "...wwwwwwsswwwwsswwww...",
    "..wwwwwsswwwwsswwwwssww.",
    ".wwwwwsswwwwsswwwwsswwww",
    "wwwwwwwwwwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwwwwwwjjhhh",
    "wwwwwwwwwwwwjjjjjjj.....",
    "wwwwwjjjjjjj............",
    ".jjj....................",
])
# Correa del casco: baja por delante de la oreja hasta la barbilla
CORREA = rasgos([
    "......s",
    "......s",
    "......s",
    "......s",
    "......s",
    "......s",
    "......s",
    ".......s",
    "........s",
    ".........s",
], y0=7)

MOCHILA = Pieza([
    "uuuuuuuuuuu",
    "yyyyyyyyyyY",
    "yyyyyyyyyyY",
    "yykyyyykyyY",
    "yyyyyyyyyyY",
    "ykyyyyyykyY",
    "yykkkkkkyyY",
    "yyyyyyyyyyY",
    "yyyyyyyyyyY",
    "yyyyyyyyyyY",
    "yyyyyyyyyyY",
    "YYYYYYYYYYo",
    "ooooooooooo",
])

BRAZOS = {
    'colgando': Pieza(["zz.", "zz.", "zz.", "Zz.", "mmm", "mmm"]),
    'lanza': Pieza(["zzzzmm", "ZZZzmm"]),
    'alto': Pieza(["...mm", "..zmm", ".zz..", "zz..."]),
    'movil': Pieza(["zz", "zz", "Zz"]),
}
MANO = Pieza(["mmm", "mmm"])
MOVIL = Pieza(["kkk", "kxk", "kek", "kkk"], contorno=False)
MUNON = Pieza(["hhh", "hhh", "hhh", "sss"])     # piernas: dos muñones, como los de Brad en LISA


def cara(cejas='normal', ojos='normal', boca='normal'):
    return [CORREA, BARBA, NARIZ, CEJAS[cejas], OJOS[ojos], BOCA[boca]]


def pablo(cuerpo_dy=0, cabeza_dy=0, piernas=((13, 0), (17, 0)), brazo='colgando', brazo_d=(0, 0),
          mano_trasera=(0, 0), mochila_dy=0, gesto=None):
    """Monta un frame. piernas: (x, alzado) de la trasera y la delantera; brazo_d desplaza el delantero."""
    capas = []
    base = PABLO_H - 2                      # última fila de los muñones
    cy = base - 12 - cuerpo_dy              # arriba del torso
    hy = cy - 18 + cabeza_dy                # arriba de la cabeza
    capas.append((MOCHILA, 2, cy - 7 + mochila_dy))
    capas.append((MANO, 10 + mano_trasera[0], cy + 6 + mano_trasera[1]))
    for x, alzado in piernas:               # trasera, luego delantera
        capas.append((MUNON, x, base - 3 - alzado))
    capas.append((TORSO, 11, cy))
    capas.append((CABEZA, 8, hy))
    capas += [(p, 8, hy) for p in cara(**(gesto or {}))]
    capas.append((CASCO, 7, hy - 2))
    bx, by = brazo_d
    if brazo == 'movil':
        capas.append((BRAZOS[brazo], 19 + bx, cy + 3 + by))
        capas.append((MOVIL, 21 + bx, cy + 3 + by))
        capas.append((MANO, 20 + bx, cy + 6 + by))
    elif brazo == 'alto':
        capas.append((BRAZOS[brazo], 21 + bx, cy + 1 + by))
    else:
        capas.append((BRAZOS[brazo], 20 + bx, cy + 3 + by))
    return componer(PABLO_W, PABLO_H, capas)


def hoja_pablo():
    idle = [(pablo(), 700), (pablo(cabeza_dy=1, mochila_dy=1), 500)]
    run = [
        (pablo(piernas=((12, 1), (18, 0)), brazo_d=(1, -1), mano_trasera=(-1, 0), mochila_dy=1), 95),
        (pablo(cuerpo_dy=1, piernas=((13, 0), (17, 1))), 95),
        (pablo(piernas=((12, 0), (18, 1)), brazo_d=(-1, 0), mano_trasera=(1, -1), mochila_dy=1), 95),
        (pablo(cuerpo_dy=1, piernas=((13, 1), (17, 0))), 95),
    ]
    movil = {'brazo': 'movil'}
    return [
        ('idle', idle),
        ('aburrido', [(pablo(**movil, gesto={'ojos': 'abajo'}), 500),
                      (pablo(**movil, gesto={'ojos': 'abajo', 'cejas': 'arriba'}), 250),
                      (pablo(**movil, cabeza_dy=1, gesto={'ojos': 'cerrados', 'boca': 'abierta'}), 900)]),
        ('run', run),
        ('jump', [(pablo(cuerpo_dy=2, piernas=((13, 2), (17, 1)), brazo='alto', gesto={'boca': 'abierta'}), 100)]),
        ('throw', [(pablo(brazo='lanza', gesto={'cejas': 'enfado', 'boca': 'abierta'}), 220)]),
        ('hurt', [(pablo(cabeza_dy=-1, brazo='alto', gesto={'ojos': 'susto', 'cejas': 'arriba', 'boca': 'grito'}), 300)]),
        ('talk', [(pablo(gesto={'boca': 'abierta'}), 160), (pablo(), 160)]),
    ]


# ---------------------------------------------------------------------------------------------
# Doña Maruja: rulos, gafas de culo de vaso, nariz larga con lunar, bata de flores y carrito.
# Mira a la derecha; el carrito queda detrás, a la izquierda.

MARUJA_W, MARUJA_H = 32, 36

M_CABEZA = Pieza([
    "....jjjjjjjjjjjj.....",
    "..jjjjjjjjjjjjjjjj...",
    ".jjjjjjjjjjjjjjjjjj..",
    ".jjiijjjjjjjjjjjjjjj.",
    "jjiijjjjjjmmmmmmmjjjj",
    "jjijjjjmmmmmmmmmmmmjj",
    "jjjjjmmmmmmmmmmmmmmmj",
    "jjjimmmmmmmmmmmmmmmm.",
    "jjimmmmmmmmmmmmmmmmm.",
    "jjmaamammmmmmmmmmmmm.",
    "jjmaTmammmmmmmmmmmmm.",
    "jjmmaammmmmmmmmmmmmm.",
    ".jmmmammmmmmmmmmmmmm.",
    ".jjmmammmmmmmmmmmmmm.",
    "..jammmmmmmmmmmmmmm..",
    "...aammmmmmmmmmmmmm..",
    "....aaammmmmmmmmmm...",
    "......aaaaaaaaaaa....",
])
RULO = [Pieza(["RRRRR", "RvRvR", "RRRRR"]), Pieza(["xxxxx", "xpxpx", "xxxxx"])]
M_GAFAS = rasgos([
    ".........kkkk...kkk",
    "........keeeek.keeek",
    "......kkkeeeekkkeeek",
    "........keeeek.keeek",
    ".........kkkk...kkk",
], y0=6)
M_OJOS = {
    'normal': rasgos(["..........k......k"], y0=8),
    'cerrados': rasgos([".........kk......kk"], y0=8),
}
M_NARIZ = rasgos([
    ".............at",
    ".............att",
    "............atttt",
    "............ttTT.T",
], y0=10)
M_BOCA = {
    'normal': rasgos(["............lrrl"], y0=16),
    'abierta': rasgos(["............rrrr", "............rvvr", "............rrrr"], y0=15),
}
M_PENDIENTE = Pieza(["yy", "yy"])
M_CUERPO = Pieza([
    "...qqqqqqqq...",
    "..qqqqqqqqqq..",
    ".qqRqqqqqqRqq.",
    "qqRwRqqqqRwRqq",
    "qqqRqqqRqqRqqq",
    "ZqqqqqRwRqqqqq",
    "ZqqRqqqRqqqRqq",
    "ZqRwRqqqqqRwRq",
    "ZZqRqqqRqqqRqq",
    "ZZZZZZZZZZZZZZ",
])
M_BRAZOS = {
    'colgando': Pieza(["qq.", "qq.", "qq.", "Zq.", "mmm", "mmm"]),
    'gesto': Pieza(["qqq.mm", "Zqqmmm"]),
    'senala': Pieza(["qqqqmmm.", "ZZZqmmmmm", "....mm..."]),
}
M_MANO = Pieza(["mmm", "mmm"])
M_PIERNA = Pieza(["uu", "uu", "uo"])
M_ZAPATILLA = Pieza(["ZZZw", "ZZZZ"])
CARRITO = Pieza([
    "rOOrOOrO",
    "rrrrrrrr",
    "rOOrOOrO",
    "rOOrOOrO",
    "rrrrrrrr",
    "rOOrOOrO",
    "rOOrOOrO",
    "rrrrrrrr",
    "rOOrOOrO",
    "QQQQQQQQ",
])
ASA = Pieza(["gg", ".g", ".g", ".g", ".g", ".g", ".g"])
RUEDA = Pieza([".k.", "kgk", ".k."])


def maruja(ojos='normal', boca='normal', brazo='colgando', cabeza_dy=0):
    base = MARUJA_H - 3
    cy = base - 3 - 10 + 1                  # arriba de la bata
    hy = cy - 16 + cabeza_dy
    capas = [(ASA, 9, cy - 4), (CARRITO, 1, cy + 2), (RUEDA, 2, base - 1), (RUEDA, 6, base - 1)]
    capas.append((M_MANO, 9, cy + 3))       # la mano de atrás agarra el asa
    for x in (14, 19):
        capas.append((M_PIERNA, x, base - 3))
        capas.append((M_ZAPATILLA, x, base))
    capas.append((M_CUERPO, 10, cy))
    capas.append((M_CABEZA, 8, hy))
    # Rulos: tres detrás y dos delante, alternando rosa y azul
    capas += [(RULO[i % 2], 9 + 5 * i, hy - 2) for i in range(3)]
    capas += [(RULO[(i + 1) % 2], 11 + 6 * i, hy + 1) for i in range(2)]
    capas += [(p, 8, hy) for p in (M_NARIZ, M_GAFAS, M_OJOS[ojos], M_BOCA[boca])]
    capas.append((M_PENDIENTE, 10, hy + 13))
    if brazo == 'senala':
        capas.append((M_BRAZOS[brazo], 21, cy + 2))
    elif brazo == 'gesto':
        capas.append((M_BRAZOS[brazo], 21, cy + 3))
    else:
        capas.append((M_BRAZOS[brazo], 21, cy + 2))
    return componer(MARUJA_W, MARUJA_H, capas)


def hoja_maruja():
    return [
        ('idle', [(maruja(), 1800), (maruja(ojos='cerrados'), 140)]),
        ('talk', [(maruja(boca='abierta', brazo='gesto'), 180), (maruja(brazo='gesto', cabeza_dy=1), 180)]),
        ('senala', [(maruja(boca='abierta', brazo='senala'), 400)]),
    ]


# ---------------------------------------------------------------------------------------------


def ampliar(hoja, ruta, escala=8, fondo=(200, 32, 32, 255)):
    bg = Image.new('RGBA', hoja.size, fondo)
    bg.alpha_composite(hoja)
    bg.resize((hoja.width * escala, hoja.height * escala), Image.NEAREST).save(ruta)


def main():
    preview = None
    if '--preview' in sys.argv:
        preview = Path(sys.argv[sys.argv.index('--preview') + 1])
    hojas = {
        'pablo': exportar('pablo', PABLO_W, PABLO_H, hoja_pablo()),
        'maruja': exportar('maruja', MARUJA_W, MARUJA_H, hoja_maruja()),
    }
    for clave, hoja in hojas.items():
        print(f'{clave}: {hoja.width}x{hoja.height}')
        if preview:
            ampliar(hoja, preview / f'{clave}.png')


if __name__ == '__main__':
    main()
