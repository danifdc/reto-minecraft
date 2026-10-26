import { describe, expect, it } from 'vitest';
import { parseSolucion } from '../engine/parse';
import { programaATexto, resolver } from '../engine/solver';
import { World } from '../engine/world';
import { INICIO_PARTE2, NIVELES, PARTE1, PARTE2 } from '.';

/** Niveles de repaso: pueden subir más de 3 bloques respecto al anterior (índices desde 0). */
const REPASO = new Set([3, 6, 8, 10]);

describe('estructura', () => {
  it('hay 10 niveles en cada parte', () => {
    expect(PARTE1).toHaveLength(10);
    expect(PARTE2).toHaveLength(10);
    expect(INICIO_PARTE2).toBe(10);
  });
});

describe.each(NIVELES.map((def, i) => [i + 1, def] as const))('nivel %i', (n, def) => {
  const i = n - 1;
  const anterior = NIVELES[i - 1];

  it(`"${def.titulo}": la solución de referencia gana`, () => {
    const w = new World(def);
    for (const cmd of parseSolucion(def.solucion)) expect(w.exec(cmd).fallo).toBeUndefined();
    expect(w.resultado().gano).toBe(true);
  });

  it('"ideal" coincide con la solución de referencia', () => {
    expect(parseSolucion(def.solucion)).toHaveLength(def.ideal);
  });

  it('"ideal" es el mínimo posible (sin atajos)', () => {
    const r = resolver(def, def.ideal);
    expect(r.bloques, `mínimo encontrado: ${programaATexto(r.programa)}`).toBe(def.ideal);
  });

  it('el héroe empieza al lado de BIT, en la misma fila', () => {
    const w = new World(def);
    expect(w.heroe.y).toBe(w.bit.y);
    expect(Math.abs(w.heroe.x - w.bit.x)).toBe(1);
  });

  it('la caja de bloques suma como máximo 1 bloque nuevo', () => {
    const antes = new Set(anterior?.bloques ?? []);
    for (const b of antes) expect(def.bloques).toContain(b);
    expect(def.bloques.filter((b) => !antes.has(b)).length).toBeLessThanOrEqual(1);
  });

  it('el bloque nuevo se usa en la solución', () => {
    const nuevo = def.bloques.find((b) => !anterior?.bloques.includes(b));
    if (!nuevo) return;
    const usados = parseSolucion(def.solucion).map((c) => c.op);
    expect(usados).toContain(nuevo);
  });

  it('la dificultad sube como máximo 3 bloques (salvo repasos)', () => {
    if (!anterior || REPASO.has(i)) return;
    expect(def.ideal).toBeLessThanOrEqual(anterior.ideal + 3);
  });
});

describe('historia', () => {
  it('los 4 fragmentos están en los niveles 5, 10, 15 y 19', () => {
    const conFragmento = NIVELES.map((d, i) => (d.objetos.join('').includes('F') ? i + 1 : 0)).filter(Boolean);
    expect(conFragmento).toEqual([5, 10, 15, 19]);
  });

  it('el nivel 2 enseña «mover atrás»', () => {
    expect(NIVELES[1].solucion).toContain('atras');
  });
});
