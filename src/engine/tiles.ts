/**
 * Catálogo de casillas del terreno.
 *
 * Leyenda de los mapas (`terreno` de cada nivel):
 *   Transitables:  . césped   , camino   _ piso de madera   : piso de piedra   s arena
 *                  + placa de presión   d puerta abierta   = puente
 *   Sólidas:       # muro de piedra   M pared de madera   C cultivo   V valla   R roca dura   D puerta cerrada
 *   Rompibles:     T árbol   A arbusto   P piedra   Z telaraña
 *   Líquidos:      ~ agua   ^ lava   o hoyo   (con "colocar bloque" se convierten en puente)
 */

export type Clase = 'suelo' | 'solido' | 'rompible' | 'liquido';

export interface TileInfo {
  clase: Clase;
  /** Nombre con artículo, para los mensajes: "BIT chocó con un árbol". */
  nombre: string;
  /** Para rompibles: en qué se convierte al romperse. */
  alRomper?: string;
}

export const TILES: Record<string, TileInfo> = {
  '.': { clase: 'suelo', nombre: 'el césped' },
  ',': { clase: 'suelo', nombre: 'el camino' },
  _: { clase: 'suelo', nombre: 'el piso' },
  ':': { clase: 'suelo', nombre: 'el piso de piedra' },
  s: { clase: 'suelo', nombre: 'la arena' },
  '+': { clase: 'suelo', nombre: 'la placa de presión' },
  d: { clase: 'suelo', nombre: 'la puerta abierta' },
  '=': { clase: 'suelo', nombre: 'el puente' },

  '#': { clase: 'solido', nombre: 'un muro de piedra' },
  M: { clase: 'solido', nombre: 'una pared' },
  C: { clase: 'solido', nombre: 'los cultivos' },
  V: { clase: 'solido', nombre: 'una valla' },
  R: { clase: 'solido', nombre: 'una roca muy dura' },
  D: { clase: 'solido', nombre: 'la puerta cerrada' },

  T: { clase: 'rompible', nombre: 'un árbol', alRomper: '.' },
  A: { clase: 'rompible', nombre: 'un arbusto', alRomper: '.' },
  P: { clase: 'rompible', nombre: 'una piedra', alRomper: ':' },
  Z: { clase: 'rompible', nombre: 'una telaraña', alRomper: ':' },

  '~': { clase: 'liquido', nombre: 'el agua' },
  '^': { clase: 'liquido', nombre: 'la lava' },
  o: { clase: 'liquido', nombre: 'el hoyo' },
};

/** Casilla fuera del mapa. */
export const BORDE = 'X';
TILES[BORDE] = { clase: 'solido', nombre: 'el borde del mundo' };

export const PUENTE = '=';
export const PLACA = '+';
export const PUERTA_CERRADA = 'D';
export const PUERTA_ABIERTA = 'd';

export function info(tile: string): TileInfo {
  const t = TILES[tile];
  if (!t) throw new Error(`Casilla desconocida: "${tile}"`);
  return t;
}
