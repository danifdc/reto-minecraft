import type { Paleta } from '../pixel';

/**
 * Sprites de personajes y objetos, dibujados como filas de caracteres (16 de ancho).
 * Los personajes miden 16×20: se apoyan en la base de la casilla y sobresalen hacia arriba (vista 3/4).
 */

export type Vista = 'frente' | 'espalda' | 'lado';
/** Cuadros de caminata: 0 = parado / pierna A, 1 = pierna B. */
export type Cuadros = Record<Vista, [string[], string[]]>;

/** Reemplaza filas a partir de `desde` (para variantes de cuadros sin repetir todo el sprite). */
const con = (base: string[], desde: number, filas: string[]) => [
  ...base.slice(0, desde),
  ...filas,
  ...base.slice(desde + filas.length),
];

// ---------------------------------------------------------------- BIT (robot ayudante)

const BIT_FRENTE = [
  '.......y........',
  '.......a........',
  '..oooooooooooo..',
  '..owwwwwwwwwgo..',
  '..owkkkkkkkkgo..',
  '..owkEekkeEkgo..',
  '..owkeekkeekgo..',
  '..owkkkkkkkkgo..',
  '..ogggggggggso..',
  '..osssssssssso..',
  '...oooooooooo...',
  '...oggggggggo...',
  '..oswggrrggsso..',
  '..oswggrrggsso..',
  '..osggggggggso..',
  '..oossssssssoo..',
  '...oggo..oggo...',
  '...osso..osso...',
  '...oooo..oooo...',
  '................',
];

const BIT_ESPALDA = [
  '.......y........',
  '.......a........',
  '..oooooooooooo..',
  '..owwwwwwwwwgo..',
  '..owggggggggso..',
  '..owgsgsgsggso..',
  '..owgsgsgsggso..',
  '..owggggggggso..',
  '..ogggggggggso..',
  '..osssssssssso..',
  '...oooooooooo...',
  '...oggggggggo...',
  '..oswggggggsso..',
  '..oswggssggsso..',
  '..osggggggggso..',
  '..oossssssssoo..',
  '...oggo..oggo...',
  '...osso..osso...',
  '...oooo..oooo...',
  '................',
];

const BIT_LADO = [
  '.......y........',
  '.......a........',
  '..oooooooooooo..',
  '..owwwwwwwwwgo..',
  '..owggggkkkkko..',
  '..owggggkkkEeo..',
  '..owggggkkkeeo..',
  '..owggggkkkkko..',
  '..ogggggggggso..',
  '..osssssssssso..',
  '...oooooooooo...',
  '....oggggggo....',
  '....owggggro....',
  '....owgsgggo....',
  '....owgsgggo....',
  '....oossssoo....',
  '.....oggggo.....',
  '.....osggso.....',
  '.....oooooo.....',
  '................',
];

const PIERNAS_FRENTE_B = ['...oggo..oggo...', '...osso..oooo...', '...oooo.........'];
const PIERNAS_LADO_B = ['....oggooggo....', '...osso..osso...', '...oooo..oooo...'];

export const BIT: Cuadros = {
  frente: [BIT_FRENTE, con(BIT_FRENTE, 16, PIERNAS_FRENTE_B)],
  espalda: [BIT_ESPALDA, con(BIT_ESPALDA, 16, PIERNAS_FRENTE_B)],
  lado: [BIT_LADO, con(BIT_LADO, 16, PIERNAS_LADO_B)],
};

export const PALETA_BIT: Paleta = {
  o: '#2E333C', w: '#F2F4F7', g: '#C9CED6', s: '#959CA8', k: '#1F2633',
  e: '#5FD3F0', E: '#E8FBFF', r: '#E8572A', a: '#6B717C', y: '#F2C94C',
};

// ---------------------------------------------------------------- Héroe

const HEROE_FRENTE = [
  '................',
  '...oooooooooo...',
  '...oHHHHHHHHo...',
  '...oHHHHHHHHo...',
  '...oHSSSSSSHo...',
  '...oSWkSSkWSo...',
  '...oSSSSSSSSo...',
  '...oSSSmmSSSo...',
  '...osSSSSSSso...',
  '....oooooooo....',
  '...oTTTTTTTTo...',
  '..oSTTTTTTTTSo..',
  '..oSTTttTTTTSo..',
  '..oSTTTTTTTTSo..',
  '...otTTTTTTto...',
  '...oPPPPPPPPo...',
  '...oPPPooPPPo...',
  '...oPPpoopPPo...',
  '...oBBBooBBBo...',
  '....ooo..ooo....',
];

const HEROE_ESPALDA = [
  '................',
  '...oooooooooo...',
  '...oHHHHHHHHo...',
  '...oHHHHHHHHo...',
  '...oHHHHHHHHo...',
  '...oHHHHHHHHo...',
  '...oHHHHHHHHo...',
  '...ohHHHHHHho...',
  '...osSSSSSSso...',
  '....oooooooo....',
  '...oTTTTTTTTo...',
  '..oSTTTTTTTTSo..',
  '..oSTTTTTTTTSo..',
  '..oSTTTTTTTTSo..',
  '...otTTTTTTto...',
  '...oPPPPPPPPo...',
  '...oPPPooPPPo...',
  '...oPPpoopPPo...',
  '...oBBBooBBBo...',
  '....ooo..ooo....',
];

const HEROE_LADO = [
  '................',
  '...oooooooooo...',
  '...oHHHHHHHHo...',
  '...oHHHHHHHHo...',
  '...oHHHHSSSSo...',
  '...oHHHSSSWko...',
  '...oHHSSSSSSo...',
  '...oHHSSSSmSo...',
  '...ohHSSSSSso...',
  '....oooooooo....',
  '.....oTTTTo.....',
  '.....oTttTo.....',
  '.....oTttTo.....',
  '.....oTSSTo.....',
  '.....otTTto.....',
  '.....oPPPPo.....',
  '.....oPPPPo.....',
  '.....oPppPo.....',
  '.....oBBBBBo....',
  '.....ooooooo....',
];

const H_PIERNAS_FRENTE_B = ['...oPPPooPPPo...', '...oBBBooPPPo...', '....ooo.oBBBo...', '.........ooo....'];
const H_PIERNAS_LADO_B = ['....oPPooPPo....', '...oPPo..oPPo...', '...oBBo..oBBBo..', '...ooo...ooooo..'];

/** Variante de pelo largo: reemplaza filas de la cabeza. */
const PELO_LARGO = {
  frente: (s: string[]) => con(s, 4, [
    '...oHSSSSSSHo...',
    '...oHWkSSkWHo...',
    '...oHSSSSSSHo...',
    '...oHSSmmSSHo...',
    '...oHsSSSSsHo...',
    '...oHooooooHo...',
    '...oHTTTTTTHo...',
    '..oSHTTTTTTHSo..',
  ]),
  espalda: (s: string[]) => con(s, 7, ['...oHHHHHHHHo...', '...oHHHHHHHHo...', '...ohHHHHHHho...']),
  lado: (s: string[]) => con(s, 9, ['...oHHooooooo...', '....oHoTTTTo....']),
};

function cuadrosHeroe(largo: boolean): Cuadros {
  const pelo = (v: Vista, s: string[]) => (largo ? PELO_LARGO[v](s) : s);
  return {
    frente: [pelo('frente', HEROE_FRENTE), pelo('frente', con(HEROE_FRENTE, 16, H_PIERNAS_FRENTE_B))],
    espalda: [pelo('espalda', HEROE_ESPALDA), pelo('espalda', con(HEROE_ESPALDA, 16, H_PIERNAS_FRENTE_B))],
    lado: [pelo('lado', HEROE_LADO), pelo('lado', con(HEROE_LADO, 16, H_PIERNAS_LADO_B))],
  };
}

export interface Aspecto {
  nombre: string;
  cuadros: Cuadros;
  paleta: Paleta;
}

const BASE_HEROE = { W: '#FFFFFF', k: '#2A1A10', o: '#1E1A22' };

/** Los 4 aspectos que el alumno puede elegir para su héroe. */
export const ASPECTOS: Aspecto[] = [
  {
    nombre: 'Explorador',
    cuadros: cuadrosHeroe(false),
    paleta: {
      ...BASE_HEROE, H: '#5A3720', h: '#432714', S: '#E7B48A', s: '#C99268', m: '#A0503C',
      T: '#2BB5A3', t: '#1E8577', P: '#3A4FB0', p: '#2C3C88', B: '#3B3B44',
    },
  },
  {
    nombre: 'Exploradora',
    cuadros: cuadrosHeroe(true),
    paleta: {
      ...BASE_HEROE, H: '#C2552B', h: '#99401C', S: '#F2C8A2', s: '#D9A982', m: '#B5523E',
      T: '#F2A03D', t: '#C97E22', P: '#6A4A9A', p: '#523878', B: '#5A3A22',
    },
  },
  {
    nombre: 'Aventurero',
    cuadros: cuadrosHeroe(false),
    paleta: {
      ...BASE_HEROE, H: '#211C1C', h: '#141010', S: '#9A6644', s: '#7A4E32', m: '#5A2E22',
      T: '#8E44AD', t: '#6C3483', P: '#2E3A4F', p: '#202A3A', B: '#E8E8E8',
    },
  },
  {
    nombre: 'Aventurera',
    cuadros: cuadrosHeroe(true),
    paleta: {
      ...BASE_HEROE, H: '#E8C55A', h: '#C4A23E', S: '#F7D6B8', s: '#DDB596', m: '#C0584A',
      T: '#4CAF50', t: '#357A38', P: '#7A5230', p: '#5C3D22', B: '#C0392B',
    },
  },
];

// ---------------------------------------------------------------- Sombri (criatura de la tormenta)

export const SOMBRI = [
  '................',
  '................',
  '................',
  '......oooo......',
  '....oovvvvoo....',
  '...ovvvvvvlvo...',
  '..ovvvvvvvvlvo..',
  '..ovvggvvggvvo..',
  '..ovvgGvvgGvvo..',
  '..ovvvvvvvvvvo..',
  '.ovvvvvmmvvvvvo.',
  '.ovlvvvvvvvvlvo.',
  '.ovvvvvvvvvvvvo.',
  '..oddddddddddo..',
  '...oooooooooo...',
  '................',
];

export const PALETAS_SOMBRI: Record<'sombra' | 'fuego', Paleta> = {
  sombra: { o: '#140A22', v: '#4B2C78', l: '#7A55B8', d: '#33195A', g: '#FF4FD8', G: '#FFD6F6', m: '#1A0F2A' },
  fuego: { o: '#2A0A05', v: '#C0391F', l: '#F2A03D', d: '#8A2414', g: '#FFE45C', G: '#FFFFFF', m: '#2A0A05' },
};

// ---------------------------------------------------------------- Objetos

export const CHISPA = [
  '................',
  '................',
  '.......y........',
  '.......y........',
  '......yoy.......',
  '......yoy.......',
  '..yyyyoWoyyyy...',
  '...yyoWWWoyy....',
  '..yyyyoWoyyyy...',
  '......yoy.......',
  '......yoy.......',
  '.......y........',
  '.......y........',
  '................',
  '................',
  '................',
];
export const PALETA_CHISPA: Paleta = { y: '#F2C94C', o: '#FFE89A', W: '#FFFFFF' };

export const FRAGMENTO = [
  '................',
  '.......o........',
  '......olo.......',
  '.....ollwo......',
  '....ollwwlo.....',
  '...olllwwllo....',
  '..ollllwlllco...',
  '..olllllllcco...',
  '...ollllccco....',
  '....olllcco.....',
  '.....olcco......',
  '......oco.......',
  '.......o........',
  '................',
  '................',
  '................',
];
export const PALETA_FRAGMENTO: Paleta = { o: '#1F6E66', l: '#4FD1C5', c: '#2A9D8F', w: '#E6FFFB' };
