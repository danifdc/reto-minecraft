import type { Cmd, LevelDef, TipoBloque } from './types';
import { World } from './world';

/** Comandos que se pueden armar con cada bloque (el desplegable cuenta como opciones del mismo bloque). */
const COMANDOS: Record<TipoBloque, Cmd[]> = {
  mover: [{ op: 'mover', dir: 'adelante' }, { op: 'mover', dir: 'atras' }],
  girar: [{ op: 'girar', dir: 'izquierda' }, { op: 'girar', dir: 'derecha' }],
  recoger: [{ op: 'recoger' }],
  romper: [{ op: 'romper' }],
  colocar: [{ op: 'colocar' }],
  atacar: [{ op: 'atacar' }],
};

export interface Solucion {
  /** Cantidad mínima de bloques para ganar (null si no hay solución dentro del límite). */
  bloques: number | null;
  programa: Cmd[];
  estados: number;
}

/**
 * Búsqueda en anchura: encuentra el programa más corto que gana el nivel usando solo sus bloques.
 * Las acciones sin efecto no cambian el estado y se descartan; las que fallan cortan esa rama.
 */
export function resolver(def: LevelDef, maxBloques = 30, maxEstados = 3_000_000): Solucion {
  const comandos = def.bloques.flatMap((b) => COMANDOS[b]);
  const inicio = new World(def);
  const vistos = new Set([inicio.clave()]);
  let frontera: { w: World; prog: Cmd[] }[] = [{ w: inicio, prog: [] }];

  for (let prof = 1; prof <= maxBloques && frontera.length; prof++) {
    const siguiente: typeof frontera = [];
    for (const { w, prog } of frontera) {
      for (const cmd of comandos) {
        const w2 = w.clonar();
        if (w2.exec(cmd).fallo) continue;
        const clave = w2.clave();
        if (vistos.has(clave)) continue;
        vistos.add(clave);
        const prog2 = [...prog, cmd];
        if (w2.resultado().gano) return { bloques: prof, programa: prog2, estados: vistos.size };
        siguiente.push({ w: w2, prog: prog2 });
      }
      if (vistos.size > maxEstados) return { bloques: null, programa: [], estados: vistos.size };
    }
    frontera = siguiente;
  }
  return { bloques: null, programa: [], estados: vistos.size };
}

const PALABRA: Record<string, string> = {
  'mover:adelante': 'adelante', 'mover:atras': 'atras', 'girar:izquierda': 'izq', 'girar:derecha': 'der',
};
/** Programa en el mismo formato de texto que `LevelDef.solucion`. */
export const programaATexto = (prog: Cmd[]) => prog.map((c) => PALABRA[`${c.op}:${'dir' in c ? c.dir : ''}`] ?? c.op).join(' ');
