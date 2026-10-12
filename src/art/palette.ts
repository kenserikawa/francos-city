import gpl from '../../art/paleta/francos-city.gpl?raw';

// La fuente de verdad es art/paleta/francos-city.gpl (la misma que se carga en Aseprite).
export const COLOR_NAMES = [
  'tinta', 'sombra', 'hormigon-oscuro', 'hormigon', 'piedra', 'arena-gris', 'cal', 'papel',
  'vino', 'ladrillo', 'terracota-oscura', 'terracota', 'albaricoque', 'melocoton', 'alarma', 'butano',
  'tierra', 'cuero', 'ocre', 'mostaza', 'trigo', 'oliva-oscuro', 'oliva', 'olivo-claro',
  'noche', 'pizarra', 'azulejo-oscuro', 'azulejo', 'cielo-polvo', 'celeste-sucio', 'turquesa', 'rosa-influencer',
] as const;

export type ColorName = (typeof COLOR_NAMES)[number];

function parseGpl(src: string): { name: string; rgb: number }[] {
  const entries: { name: string; rgb: number }[] = [];
  for (const line of src.split(/\r?\n/)) {
    const m = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s*(.*)$/);
    if (m) entries.push({ name: m[4].trim(), rgb: (+m[1] << 16) | (+m[2] << 8) | +m[3] });
  }
  return entries;
}

function buildPalette(): Record<ColorName, number> {
  const entries = parseGpl(gpl);
  const pal = {} as Record<ColorName, number>;
  COLOR_NAMES.forEach((name, i) => {
    const byName = entries.find((e) => e.name === name);
    const entry = byName ?? entries[i];
    if (!entry) throw new Error(`Paleta: falta el color "${name}" en francos-city.gpl`);
    if (!byName) console.warn(`Paleta: "${name}" no tiene nombre en el .gpl; uso la posición ${i}`);
    pal[name] = entry.rgb;
  });
  return pal;
}

export const PAL = buildPalette();

export const css = (rgb: number) => '#' + rgb.toString(16).padStart(6, '0');
