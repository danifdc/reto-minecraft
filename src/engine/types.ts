/** 0 = arriba (norte), 1 = derecha (este), 2 = abajo (sur), 3 = izquierda (oeste). */
export type Dir = 0 | 1 | 2 | 3;

export const DX = [0, 1, 0, -1] as const;
export const DY = [-1, 0, 1, 0] as const;

export const DIR_POR_NOMBRE = { arriba: 0, derecha: 1, abajo: 2, izquierda: 3 } as const;
export type NombreDir = keyof typeof DIR_POR_NOMBRE;

export interface Pos {
  x: number;
  y: number;
}

/** Instrucción que ejecuta BIT. Corresponde 1 a 1 con un bloque de Blockly. */
export type Cmd =
  | { op: 'mover'; dir: 'adelante' | 'atras' }
  | { op: 'girar'; dir: 'izquierda' | 'derecha' }
  | { op: 'romper' }
  | { op: 'colocar' }
  | { op: 'atacar' }
  | { op: 'recoger' };

export type TipoBloque = 'mover' | 'girar' | 'romper' | 'colocar' | 'atacar' | 'recoger';

export type Tema = 'aldea' | 'bosque' | 'rio' | 'cueva' | 'mina' | 'volcan' | 'torre';

export interface LevelDef {
  titulo: string;
  mision: string;
  tema: Tema;
  /** Filas del terreno (ver leyenda en tiles.ts). Todas del mismo largo. */
  terreno: string[];
  /** Filas de objetos, mismo tamaño que el terreno: B=BIT, H=héroe, G=meta, *=chispa, F=fragmento, S=Sombri. */
  objetos: string[];
  /** Hacia dónde mira BIT al empezar. */
  mira: NombreDir;
  /** Bloques disponibles en la caja de bloques, en orden. */
  bloques: TipoBloque[];
  /** Cantidad de bloques de la solución ideal. */
  ideal: number;
  /**
   * Solución de referencia (la valida el test). Palabras separadas por espacio:
   * adelante atras izq der romper colocar atacar recoger
   */
  solucion: string;
}

export type Item = 'chispa' | 'fragmento';

/** Lo que pasó al ejecutar un comando. La escena lo anima en orden. */
export type GameEvent =
  | { t: 'move'; from: Pos; to: Pos }
  | { t: 'turn'; from: Dir; to: Dir }
  | { t: 'bump'; from: Pos; at: Pos }
  | { t: 'edge'; from: Pos; at: Pos }
  | { t: 'tile'; at: Pos; tile: string; anim: 'break' | 'place' | 'open' }
  | { t: 'attack'; from: Pos; at: Pos; hit: boolean }
  | { t: 'collect'; at: Pos; item: Item }
  | { t: 'noop'; at: Pos };

export interface StepResult {
  events: GameEvent[];
  /** Si existe, el intento terminó con error y este es el mensaje para el alumno. */
  fallo?: string;
  /** Aviso suave: la acción no tuvo efecto, pero el programa sigue. */
  aviso?: string;
}

export interface Resultado {
  gano: boolean;
  mensaje: string;
}
