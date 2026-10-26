import { describe, expect, it } from 'vitest';
import { NIVELES_PRUEBA as NIVELES } from '../levels/prueba';
import { parseSolucion } from './parse';
import type { LevelDef } from './types';
import { World } from './world';

function jugar(def: LevelDef, solucion: string) {
  const w = new World(def);
  for (const cmd of parseSolucion(solucion)) {
    const r = w.exec(cmd);
    if (r.fallo) return { w, fallo: r.fallo, resultado: null };
  }
  return { w, fallo: null, resultado: w.resultado() };
}

describe('niveles', () => {
  NIVELES.forEach((def, i) => {
    it(`${i + 1}. ${def.titulo}: la solución de referencia gana`, () => {
      const { fallo, resultado } = jugar(def, def.solucion);
      expect(fallo).toBeNull();
      expect(resultado?.gano).toBe(true);
    });

    it(`${i + 1}. ${def.titulo}: "ideal" coincide con la solución`, () => {
      expect(parseSolucion(def.solucion).length).toBe(def.ideal);
    });

    it(`${i + 1}. ${def.titulo}: el héroe empieza al lado de BIT`, () => {
      const w = new World(def);
      expect(Math.abs(w.heroe.x - w.bit.x) + Math.abs(w.heroe.y - w.bit.y)).toBe(1);
    });
  });
});

describe('reglas', () => {
  const [casa, bosque, rio] = NIVELES;

  it('la puerta cerrada bloquea hasta pisar la placa', () => {
    const w = new World(casa);
    w.dir = 1;
    w.bit = { x: 6, y: 4 };
    expect(w.exec({ op: 'mover', dir: 'adelante' }).fallo).toMatch(/puerta cerrada/);
  });

  it('chocar con un árbol falla y sugiere romperlo', () => {
    const { fallo } = jugar(bosque, 'adelante adelante adelante der adelante adelante adelante');
    expect(fallo).toMatch(/árbol.*romperlo/);
  });

  it('llegar a la meta sin la chispa no gana', () => {
    const { resultado } = jugar(bosque, bosque.solucion.replace('recoger ', ''));
    expect(resultado?.gano).toBe(false);
    expect(resultado?.mensaje).toMatch(/chispa/);
  });

  it('no se puede entrar al agua', () => {
    const { fallo } = jugar(rio, 'atras atras der der adelante');
    expect(fallo).toMatch(/agua/);
  });

  it('el Sombri bloquea hasta ser atacado', () => {
    const { fallo } = jugar(rio, 'atras atras der der colocar adelante colocar adelante adelante');
    expect(fallo).toMatch(/Sombri/);
  });

  it('acciones sin efecto solo avisan', () => {
    const w = new World(rio);
    expect(w.exec({ op: 'romper' })).toMatchObject({ aviso: expect.any(String) });
    expect(w.exec({ op: 'recoger' }).fallo).toBeUndefined();
  });

  it('el recorrido guarda cada casilla pisada', () => {
    const { w } = jugar(casa, casa.solucion);
    expect(w.recorrido).toHaveLength(7);
    expect(w.recorrido.at(-1)).toEqual(w.meta);
  });
});
