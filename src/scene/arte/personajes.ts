import type { Paleta } from '../pixel';

/**
 * Sprites de personajes y objetos, dibujados como filas de caracteres (16 de ancho).
 * Los personajes miden 16×20: se apoyan en la base de la casilla y sobresalen hacia arriba (vista 3/4).
 */

export type Vista = 'frente' | 'espalda' | 'lado';
/** Cuadros: 0 = parado, 1 y 2 = un paso con cada pie (al caminar: 1, 0, 2, 0). */
export type Cuadros = Record<Vista, [string[], string[], string[]]>;

/** Reemplaza filas a partir de `desde` (para variantes de cuadros sin repetir todo el sprite). */
const con = (base: string[], desde: number, filas: string[]) => [
  ...base.slice(0, desde),
  ...filas,
  ...base.slice(desde + filas.length),
];

// ---------------------------------------------------------------- BIT (robot ayudante)

/*
 * BIT usa el diseño del Agente del proyecto "Simulador de Minecraft Education" (dibujado por el usuario): cabeza con un
 * panel más oscuro arriba, ojos blancos a los costados, luz roja en el pecho, brazos largos marrones y piernas cortas.
 * Mide 10×15 dentro del lienzo de 16×20 y apoya los pies en la última fila.
 */

const BIT_FRENTE = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '...oooooooo.....',
  '...oLLLLLLo.....',
  '...oLGGGGLo.....',
  '...oLGGGGLo.....',
  '...oWoLLoWo.....',
  '...oWoLLoWo.....',
  '...oGGLLGGo.....',
  '..oooooooooo....',
  '..oBoDRRDoBo....',
  '..oBoDrrDoBo....',
  '..oBoDDDDoBo....',
  '..oboGGGGobo....',
  '..ooGGooGGoo....',
  '...oLLooLLo.....',
  '...oooooooo.....',
];

const BIT_ESPALDA = con(BIT_FRENTE, 7, [
  '...oLGGGGLo.....',
  '...oLGGGGLo.....',
  '...oLGGGGLo.....',
  '...oLGGGGLo.....',
  '...oLLLLLLo.....',
  '..oooooooooo....',
  '..oBoDDDDoBo....',
  '..oBoDGGDoBo....',
]);

/** Mirando a la derecha (a la izquierda se dibuja reflejado). La nariz sobresale de la cabeza. */
const BIT_LADO = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '....oooooooo....',
  '....oLLLLLLo....',
  '....oLGGGGLo....',
  '....oLGGGGLo....',
  '....oLLLLWoLo...',
  '....oLLLLWoLo...',
  '....oGGGLLLo....',
  '....oooooooo....',
  '.....oDBBRo.....',
  '.....oDBBro.....',
  '.....oDbbDo.....',
  '.....oGGGGo.....',
  '......oGGo......',
  '......oLLo......',
  '......oooo......',
];

// Cuadros de caminata: de frente y de espalda sube un pie y después el otro; de costado, las piernas se abren.
const PIE_IZQUIERDO = ['...oooooLLo.....', '.......oooo.....'];
const PIE_DERECHO = ['...oLLooooo.....', '....oooo........'];
const PIERNAS_ABIERTAS = ['....oGo..oGo....', '....oLo..oLo....', '....ooo..ooo....'];

/** De frente y de espalda el dibujo (columnas 2 a 11) queda un pixel a la izquierda del centro: se corre uno a la derecha. */
const centrado = (filas: string[]) => filas.map((fila) => '.' + fila.slice(0, -1));

export const BIT: Cuadros = {
  frente: [BIT_FRENTE, con(BIT_FRENTE, 18, PIE_IZQUIERDO), con(BIT_FRENTE, 18, PIE_DERECHO)].map(centrado) as Cuadros['frente'],
  espalda: [BIT_ESPALDA, con(BIT_ESPALDA, 18, PIE_DERECHO), con(BIT_ESPALDA, 18, PIE_IZQUIERDO)].map(centrado) as Cuadros['espalda'],
  lado: [BIT_LADO, con(BIT_LADO, 17, PIERNAS_ABIERTAS), con(BIT_LADO, 17, PIERNAS_ABIERTAS)],
};

export const PALETA_BIT: Paleta = {
  o: '#262626', L: '#E2E2E2', G: '#C0C0C0', D: '#969696',
  W: '#FFFFFF', B: '#B98545', b: '#7A5230', R: '#E22222', r: '#A01818',
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

const H_PIE_IZQUIERDO = ['...oPPPooPPPo...', '...oBBBooPPPo...', '....ooo.oBBBo...', '.........ooo....'];
const H_PIE_DERECHO = ['...oPPPooPPPo...', '...oPPPooBBBo...', '...oBBBo.ooo....', '....ooo.........'];
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
  /** Los 3 cuadros de una vista: parado y un paso con cada pie (con el pelo largo si corresponde). */
  const cuadros = (v: Vista, base: string[], paso1: string[], paso2: string[]): [string[], string[], string[]] => {
    const pelo = (filas: string[]) => (largo ? PELO_LARGO[v](filas) : filas);
    return [pelo(base), pelo(con(base, 16, paso1)), pelo(con(base, 16, paso2))];
  };
  return {
    frente: cuadros('frente', HEROE_FRENTE, H_PIE_IZQUIERDO, H_PIE_DERECHO),
    espalda: cuadros('espalda', HEROE_ESPALDA, H_PIE_DERECHO, H_PIE_IZQUIERDO),
    lado: cuadros('lado', HEROE_LADO, H_PIERNAS_LADO_B, H_PIERNAS_LADO_B),
  };
}

export interface Aspecto {
  nombre: string;
  cuadros: Cuadros;
  paleta: Paleta;
}

/** El contorno es el mismo de BIT (PALETA_BIT.o): todos los personajes comparten el mismo "negro". */
const BASE_HEROE = { W: '#FFFFFF', k: '#2A1A10', o: '#262626' };

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
