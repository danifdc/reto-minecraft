import type { LevelDef } from '../engine/types';

/** Mapa con todas las casillas y objetos, para revisar el arte (solo en desarrollo: __debug.galeria(tema)). */
export const GALERIA: LevelDef = {
  titulo: 'Galería',
  tema: 'aldea',
  mision: 'Galería de arte',
  mira: 'abajo',
  bloques: ['mover'],
  ideal: 1,
  solucion: 'adelante',
  terreno: [
    '..........',
    '.#.M.R.P.D',
    '..........',
    '.T.A.C.V.Z',
    '..........',
    ',,__::ss++',
    'dd==~~^^oo',
    '##########',
    '#TTT...PP#',
    '#TTT,:,PP#',
  ],
  objetos: [
    '..........',
    '..........',
    'BH..*.F.S.',
    '..........',
    '........G.',
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
  ],
};
