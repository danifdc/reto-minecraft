import { info } from '../../engine/tiles';
import type { Tema } from '../../engine/types';
import {
  PX, azar, empedrado, ladrillos, px, rect, ruido, tablas, type Ctx, type Region,
} from '../pixel';

/**
 * Arte del terreno en vista 3/4.
 *  - Casillas planas (suelo, agua...): 16×16.
 *  - Casillas altas (muros, árboles...): un "alto" de 16×ALTO_BLOQUE que se apoya en la base de la casilla
 *    y sobresale 4 px hacia arriba. Debajo siempre hay una casilla plana (lo que queda al romperlo).
 */

export const ALTO_BLOQUE = 20;
/** Altura de la cara superior de un cubo (el resto es la cara frontal). */
const TAPA = 12;

/** Casillas que se dibujan con volumen. */
export const ALTOS = new Set(['#', 'M', 'R', 'P', 'D', 'T', 'A', 'C', 'V', 'Z']);
/** Casillas animadas (2 cuadros). */
export const LIQUIDOS_ANIMADOS = new Set(['~', '^']);
/** Cantidad de variantes de textura por casilla plana (se elige según la posición). */
export const VARIANTES: Record<string, number> = { '.': 4, ',': 2, ':': 2, s: 2, '~': 2, '^': 2 };

export const TEMAS: Tema[] = ['aldea', 'bosque', 'rio', 'cueva', 'mina', 'volcan', 'torre'];

type Tonos = [base: string, oscuro: string, claro: string, extra: string];

interface Estilo {
  pasto: Tonos;
  piso: Tonos;
  muro: { tipo: 'ladrillo' | 'empedrado'; tonos: Tonos };
  /** Suelo exterior por defecto (bajo muros, vallas, cultivos). */
  sueloBase: '.' | ':';
  /** Color de fondo del escenario fuera del tablero. */
  fondo: number;
}

const PASTO: Tonos = ['#5DAE3E', '#4E9A34', '#6CC24A', '#7BD458'];
const PIEDRA_GRIS: Tonos = ['#8A8F98', '#7B8089', '#9A9FA8', '#6F747C'];

const ESTILOS: Record<Tema, Estilo> = {
  aldea: { pasto: PASTO, piso: PIEDRA_GRIS, muro: { tipo: 'ladrillo', tonos: ['#8C9099', '#7C8089', '#9CA0A8', '#5E636B'] }, sueloBase: '.', fondo: 0x2f5a23 },
  bosque: { pasto: ['#4C9634', '#3F832B', '#5AA83F', '#6BB84C'], piso: PIEDRA_GRIS, muro: { tipo: 'empedrado', tonos: ['#7A8075', '#6B7066', '#5F7A4A', '#3F443C'] }, sueloBase: '.', fondo: 0x234a1c },
  rio: { pasto: PASTO, piso: PIEDRA_GRIS, muro: { tipo: 'empedrado', tonos: ['#8A8F98', '#7B8089', '#9A9FA8', '#55595F'] }, sueloBase: '.', fondo: 0x2f5a23 },
  cueva: { pasto: ['#3E7A30', '#336A27', '#4A8A3A', '#5A9A48'], piso: ['#80858E', '#747982', '#8E939C', '#5E636B'], muro: { tipo: 'empedrado', tonos: ['#3E4249', '#353840', '#484C54', '#212328'] }, sueloBase: ':', fondo: 0x16181d },
  mina: { pasto: ['#3E7A30', '#336A27', '#4A8A3A', '#5A9A48'], piso: ['#A08F78', '#92816C', '#AE9E86', '#6E6052'], muro: { tipo: 'empedrado', tonos: ['#4A4239', '#3F3830', '#554C42', '#211D19'] }, sueloBase: ':', fondo: 0x1a1612 },
  volcan: { pasto: ['#5A6A30', '#4A5A27', '#6A7A3A', '#7A8A48'], piso: ['#857873', '#776B66', '#938680', '#5A4F4B'], muro: { tipo: 'empedrado', tonos: ['#2E2426', '#3A2E2F', '#262021', '#7A2416'] }, sueloBase: ':', fondo: 0x1c1012 },
  torre: { pasto: PASTO, piso: ['#9488B0', '#8679A2', '#A296BE', '#655A80'], muro: { tipo: 'ladrillo', tonos: ['#3A3050', '#322944', '#443A5C', '#1E1830'] }, sueloBase: ':', fondo: 0x171222 },
};

export const fondoTema = (tema: Tema) => ESTILOS[tema].fondo;

/** Casilla plana que hay debajo de una casilla alta. */
export function sueloBajo(tile: string, tema: Tema): string {
  if (tile === 'D') return 'd';
  const t = info(tile);
  if (t.clase === 'rompible' && t.alRomper) return t.alRomper;
  return ESTILOS[tema].sueloBase;
}

// ---------------------------------------------------------------- utilidades de color

function ajustar(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)));
  return `#${c.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`;
}
const oscuro = (hex: string, f = 0.25) => ajustar(hex, -f);
const tonosOscuros = (t: Tonos, f = 0.28): Tonos => t.map((c) => oscuro(c, f)) as Tonos;

const motas = (t: Tonos, a = 0.16, b = 0.1, c = 0.02): [string, number][] => [[t[1], a], [t[2], b], [t[3], c]];

// ---------------------------------------------------------------- casillas planas

const MADERA: Tonos = ['#C08F55', '#B07F48', '#CC9B60', '#8E6538'];
const TIERRA: Tonos = ['#9C7A4E', '#8A6A42', '#B08E5E', '#7A5C38'];
const ARENA: Tonos = ['#E3D08C', '#D6C07A', '#EEDDA0', '#C9B06A'];

function pasto(c: Ctx, e: Estilo, v: number) {
  ruido(c, e.pasto[0], motas(e.pasto, 0.16, 0.1, 0.02), 11 + v * 101);
  const r = azar(50 + v);
  if (v === 1) {
    // Matas de pasto.
    for (let i = 0; i < 4; i++) {
      const x = 1 + Math.floor(r() * 13);
      const y = 2 + Math.floor(r() * 12);
      px(c, x, y, e.pasto[3]);
      px(c, x, y + 1, e.pasto[2]);
      px(c, x + 1, y + 1, e.pasto[1]);
    }
  } else if (v === 2) {
    // Flores.
    const colores = ['#E8574A', '#F2C94C', '#F4F1E8', '#8FB4FF'];
    for (let i = 0; i < 2; i++) {
      const x = 2 + Math.floor(r() * 11);
      const y = 2 + Math.floor(r() * 11);
      const col = colores[Math.floor(r() * colores.length)];
      px(c, x, y - 1, col);
      px(c, x - 1, y, col);
      px(c, x + 1, y, col);
      px(c, x, y + 1, col);
      px(c, x, y, '#F2C94C');
    }
  } else if (v === 3) {
    // Piedrita.
    const x = 3 + Math.floor(r() * 9);
    const y = 3 + Math.floor(r() * 9);
    rect(c, x, y, 2, 1, '#9A9FA8');
    px(c, x, y + 1, '#6F747C');
    px(c, x + 1, y + 1, '#7B8089');
  }
}

function piso(c: Ctx, t: Tonos, v: number, r: Region = { x: 0, y: 0, w: PX, h: PX }) {
  ruido(c, t[0], [[t[1], 0.18], [t[2], 0.1]], 13 + v * 31, r);
  // Losas en aparejo: juntas cada 8 px desplazadas.
  rect(c, r.x, r.y, r.w, 1, t[3]);
  rect(c, r.x, r.y + 8, r.w, 1, t[3]);
  rect(c, r.x, r.y, 1, 8, t[3]);
  rect(c, r.x + 8, r.y + 8, 1, 8, t[3]);
  if (v === 1) {
    px(c, r.x + 4, r.y + 3, t[3]);
    px(c, r.x + 5, r.y + 4, t[3]);
    px(c, r.x + 5, r.y + 5, t[3]);
  }
}

const pisoMadera = (c: Ctx) => tablas(c, MADERA[0], [[MADERA[1], 0.12], [MADERA[2], 0.08]], MADERA[3], 21);

/** Suelo "interior" del tema: madera en la aldea, piso de piedra en el resto. */
const pisoInterior = (c: Ctx, tema: Tema, e: Estilo) => (tema === 'aldea' ? pisoMadera(c) : piso(c, e.piso, 0));

function agua(c: Ctx, f: number) {
  ruido(c, '#3A6FD8', [['#4A82E8', 0.1], ['#2F5FC0', 0.08]], 41 + f);
  for (let i = 0; i < 4; i++) {
    const x = (i * 5 + f * 3) % 14;
    rect(c, x, i * 4 + 1, 3, 1, '#8FB4FF');
    px(c, x + 3, i * 4 + 2, '#6E9AF5');
  }
}

function lava(c: Ctx, f: number) {
  ruido(c, '#E8572A', [['#F2A03D', 0.16], ['#C0391F', 0.1], ['#FFD25C', 0.04]], 42 + f * 17);
  const r = azar(90 + f);
  for (let i = 0; i < 3; i++) {
    const x = 1 + Math.floor(r() * 13);
    const y = 1 + Math.floor(r() * 13);
    rect(c, x, y, 2, 2, '#FFD25C');
    px(c, x, y, '#FFF3C4');
  }
}

export function pintarSuelo(c: Ctx, tile: string, tema: Tema, v: number) {
  const e = ESTILOS[tema];
  switch (tile) {
    case '.':
      return pasto(c, e, v);
    case ',': {
      ruido(c, TIERRA[0], motas(TIERRA, 0.2, 0.1, 0.05), 12 + v * 7);
      if (v === 1) {
        rect(c, 4, 9, 2, 1, '#B5B0A8');
        px(c, 11, 4, '#B5B0A8');
      }
      return;
    }
    case '_':
      return pisoMadera(c);
    case ':':
      return piso(c, e.piso, v);
    case 's':
      ruido(c, ARENA[0], motas(ARENA, 0.2, 0.1, 0.03), 14 + v * 5);
      return;
    case '+': {
      pisoInterior(c, tema, e);
      const madera = tema === 'aldea';
      const [base, borde, luz] = madera ? ['#B08850', '#6E4E28', '#D2AE72'] : ['#9AA0A8', '#5E636B', '#C3C8CF'];
      rect(c, 2, 3, 12, 11, borde);
      rect(c, 3, 4, 10, 9, base);
      rect(c, 3, 4, 10, 1, luz);
      rect(c, 3, 12, 10, 1, oscuro(base));
      return;
    }
    case 'd': {
      pisoInterior(c, tema, e);
      rect(c, 0, 0, PX, 2, 'rgba(0,0,0,0.35)');
      rect(c, 0, 0, 2, PX, 'rgba(0,0,0,0.2)');
      rect(c, 14, 0, 2, PX, 'rgba(0,0,0,0.2)');
      return;
    }
    case '=': {
      tablas(c, '#A0703A', [['#8E6232', 0.12], ['#B07E46', 0.08]], '#6E4A24', 22);
      rect(c, 0, 0, PX, 1, '#5A3A1C');
      rect(c, 0, 15, PX, 1, '#5A3A1C');
      for (const [x, y] of [[0, 0], [14, 0], [0, 14], [14, 14]]) rect(c, x, y, 2, 2, '#4A2E14');
      return;
    }
    case '~':
      return agua(c, v);
    case '^':
      return lava(c, v);
    case 'o': {
      rect(c, 0, 0, PX, PX, '#3A2A1A');
      rect(c, 1, 0, 14, 4, '#6B4A2B');
      rect(c, 1, 1, 14, 1, '#7E5A36');
      rect(c, 1, 4, 14, 11, '#1A120C');
      rect(c, 3, 7, 10, 7, '#0A0705');
      return;
    }
    default:
      throw new Error(`No hay suelo para la casilla "${tile}"`);
  }
}

// ---------------------------------------------------------------- casillas altas

type Pintor = (c: Ctx, r: Region) => void;

/** Cubo en vista 3/4: tapa arriba (16×12) y cara frontal (16×8), con bordes de luz y sombra. */
function cubo(c: Ctx, tapa: Pintor, frente: Pintor) {
  tapa(c, { x: 0, y: 0, w: PX, h: TAPA });
  frente(c, { x: 0, y: TAPA, w: PX, h: ALTO_BLOQUE - TAPA });
  rect(c, 0, 0, PX, 1, 'rgba(255,255,255,0.18)');
  rect(c, 0, TAPA, PX, 1, 'rgba(0,0,0,0.25)');
  rect(c, 0, ALTO_BLOQUE - 1, PX, 1, 'rgba(0,0,0,0.35)');
}

function superficieMuro(c: Ctx, e: Estilo, r: Region, semilla: number, oscurecer = 0) {
  const t = oscurecer ? tonosOscuros(e.muro.tonos, oscurecer) : e.muro.tonos;
  if (e.muro.tipo === 'ladrillo') ladrillos(c, t[0], [[t[1], 0.15], [t[2], 0.1]], t[3], semilla, r);
  else empedrado(c, [t[0], t[1], t[2]], t[3], semilla, r, 6);
}

function hojas(c: Ctx, r: Region, base: Tonos, semilla: number) {
  ruido(c, base[0], [[base[1], 0.22], [base[2], 0.14], [base[3], 0.04]], semilla, r);
}

const HOJAS: Tonos = ['#2E7D32', '#1F5C24', '#3E9A42', '#5DBB3F'];
const HOJAS_BOSQUE: Tonos = ['#25692A', '#18491C', '#327F36', '#4CA046'];
const MADERA_MURO: Tonos = ['#9A6A3C', '#8A5A32', '#AA7A48', '#6B4426'];

/** Recorta las esquinas para que el follaje se vea redondeado. */
function redondear(c: Ctx, r: Region) {
  for (const [x, y] of [[r.x, r.y], [r.x + r.w - 1, r.y], [r.x, r.y + r.h - 1], [r.x + r.w - 1, r.y + r.h - 1]]) c.clearRect(x, y, 1, 1);
}

export function pintarAlto(c: Ctx, tile: string, tema: Tema) {
  const e = ESTILOS[tema];
  switch (tile) {
    case '#':
      return cubo(c, (c, r) => superficieMuro(c, e, r, 31), (c, r) => superficieMuro(c, e, r, 32, 0.3));
    case 'M':
      return cubo(
        c,
        (c, r) => tablas(c, MADERA_MURO[0], [[MADERA_MURO[1], 0.12], [MADERA_MURO[2], 0.08]], MADERA_MURO[3], 33, r),
        (c, r) => tablas(c, oscuro(MADERA_MURO[0]), [[oscuro(MADERA_MURO[1]), 0.12]], oscuro(MADERA_MURO[3]), 34, r),
      );
    case 'R':
      return cubo(
        c,
        (c, r) => ruido(c, '#3A3D45', [['#2C2E34', 0.25], ['#4C5059', 0.15], ['#5E636B', 0.04]], 35, r),
        (c, r) => ruido(c, '#2A2C32', [['#1E2024', 0.25], ['#383B42', 0.15]], 36, r),
      );
    case 'P': {
      // Piedra rompible: más clara que los muros y con grietas, para que se distinga.
      const t: Tonos = ['#A7ABB2', '#989CA4', '#B8BCC2', '#6E737B'];
      cubo(c, (c, r) => empedrado(c, [t[0], t[1], t[2]], t[3], 37, r, 5), (c, r) => empedrado(c, tonosOscuros(t).slice(0, 3), oscuro(t[3]), 38, r, 4));
      for (const [x, y] of [[6, 3], [7, 4], [7, 5], [8, 6], [11, 8], [10, 9]]) px(c, x, y, '#5E636B');
      return;
    }
    case 'D': {
      cubo(
        c,
        (c, r) => {
          rect(c, r.x, r.y, r.w, r.h, '#5A3A1C');
          tablas(c, '#9A6A3C', [['#8A5A32', 0.1]], '#7A4E28', 39, { x: 2, y: 1, w: 12, h: r.h - 2 });
          rect(c, 7, 1, 2, r.h - 2, '#5A3A1C');
          rect(c, 10, 5, 2, 2, '#F2C94C');
          px(c, 10, 5, '#FFF3C4');
        },
        (c, r) => {
          rect(c, r.x, r.y, r.w, r.h, '#4A2E14');
          rect(c, 2, r.y + 1, 12, r.h - 2, '#6B4426');
          rect(c, 7, r.y + 1, 2, r.h - 2, '#4A2E14');
        },
      );
      return;
    }
    case 'T': {
      // Árbol: copa (tapa + frente) y tronco abajo.
      const base = tema === 'bosque' ? HOJAS_BOSQUE : HOJAS;
      const tapa = { x: 0, y: 0, w: PX, h: 10 };
      const frente = { x: 0, y: 10, w: PX, h: 5 };
      hojas(c, tapa, base, 36);
      hojas(c, frente, tonosOscuros(base, 0.25), 37);
      rect(c, 0, 0, PX, 1, 'rgba(255,255,255,0.15)');
      rect(c, 0, 10, PX, 1, 'rgba(0,0,0,0.2)');
      redondear(c, { x: 0, y: 0, w: PX, h: 15 });
      rect(c, 6, 15, 4, 5, '#6B4426');
      rect(c, 6, 15, 1, 5, '#8A5A32');
      rect(c, 9, 15, 1, 5, '#4A2E14');
      return;
    }
    case 'A': {
      // Arbusto: bola de hojas más chica, sin tronco.
      const tapa = { x: 2, y: 5, w: 12, h: 8 };
      const frente = { x: 2, y: 13, w: 12, h: 4 };
      hojas(c, tapa, ['#3E9A42', '#2E7D32', '#5DBB3F', '#7BD458'], 40);
      hojas(c, frente, ['#2E7D32', '#1F5C24', '#3E9A42', '#3E9A42'], 41);
      redondear(c, { x: 2, y: 5, w: 12, h: 12 });
      for (const [x, y] of [[5, 7], [10, 9], [7, 11]]) px(c, x, y, '#E8574A');
      return;
    }
    case 'C': {
      // Cultivo: tierra arada con brotes que sobresalen.
      ruido(c, '#6B4A2B', [['#5A3D22', 0.2]], 33, { x: 0, y: 4, w: PX, h: 16 });
      for (let y = 6; y < ALTO_BLOQUE; y += 5) {
        rect(c, 0, y + 2, PX, 1, '#4A3018');
        for (let x = 1; x < PX; x += 3) {
          rect(c, x, y - 2, 1, 4, '#5DBB3F');
          px(c, x + 1, y - 1, '#3E8A2A');
          px(c, x, y - 2, '#C9D84A');
        }
      }
      return;
    }
    case 'V': {
      // Valla de madera.
      const madera = '#8A5A32';
      for (const x of [1, 12]) {
        rect(c, x, 4, 3, 16, madera);
        rect(c, x, 4, 3, 1, '#AA7A48');
        rect(c, x + 2, 5, 1, 15, '#6B4426');
      }
      rect(c, 0, 9, PX, 2, madera);
      rect(c, 0, 9, PX, 1, '#AA7A48');
      rect(c, 0, 15, PX, 2, madera);
      rect(c, 0, 15, PX, 1, '#AA7A48');
      return;
    }
    case 'Z': {
      // Telaraña (sin volumen, pero se dibuja encima del suelo).
      const hilo = 'rgba(240,240,240,0.85)';
      for (let i = 1; i < 15; i++) {
        px(c, i, i + 4, hilo);
        px(c, 15 - i, i + 4, hilo);
      }
      rect(c, 1, 11, 14, 1, hilo);
      rect(c, 7, 5, 1, 14, hilo);
      for (const s of [3, 5]) {
        rect(c, 7 - s, 11 - s, s * 2 + 1, 1, hilo);
        rect(c, 7 - s, 11 + s, s * 2 + 1, 1, hilo);
        rect(c, 7 - s, 11 - s, 1, s * 2 + 1, hilo);
        rect(c, 7 + s, 11 - s, 1, s * 2 + 1, hilo);
      }
      return;
    }
    default:
      throw new Error(`No hay arte alto para la casilla "${tile}"`);
  }
}

/** Color representativo de cada casilla rompible (para las partículas al romperla). */
export const COLORES_ROTURA: Record<string, number[]> = {
  T: [0x2e7d32, 0x3e9a42, 0x6b4426],
  A: [0x3e9a42, 0x5dbb3f, 0xe8574a],
  P: [0xa7abb2, 0x6e737b, 0xb8bcc2],
  Z: [0xeeeeee, 0xcccccc],
};
