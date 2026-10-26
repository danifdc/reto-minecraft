import type { Cmd } from './types';

const PALABRAS: Record<string, Cmd> = {
  adelante: { op: 'mover', dir: 'adelante' },
  atras: { op: 'mover', dir: 'atras' },
  izq: { op: 'girar', dir: 'izquierda' },
  der: { op: 'girar', dir: 'derecha' },
  romper: { op: 'romper' },
  colocar: { op: 'colocar' },
  atacar: { op: 'atacar' },
  recoger: { op: 'recoger' },
};

/** Convierte "adelante adelante der recoger" en comandos. Se usa para las soluciones de referencia. */
export function parseSolucion(texto: string): Cmd[] {
  return texto.trim().split(/\s+/).filter(Boolean).map((w) => {
    const cmd = PALABRAS[w];
    if (!cmd) throw new Error(`Palabra desconocida en la solución: "${w}"`);
    return cmd;
  });
}
