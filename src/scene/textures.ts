import type * as Phaser from 'phaser';
import { TILES } from '../engine/tiles';
import { PX, dibujar, lienzo, ruido, azar, type Paleta } from './pixel';
import { BIT, CHISPA, FRAGMENTO, HEROE, META, SOMBRI } from './sprites';

type Ctx = CanvasRenderingContext2D;

// ---------- Suelos base ----------
const cesped = (c: Ctx) => ruido(c, '#5DAE3E', [['#4E9A34', 0.15], ['#6CC24A', 0.1], ['#7BD458', 0.02]], 11);
const camino = (c: Ctx) => ruido(c, '#9C7A4E', [['#8A6A42', 0.2], ['#B08E5E', 0.1], ['#7A5C38', 0.05]], 12);
const pisoPiedra = (c: Ctx) => {
  ruido(c, '#8A8F98', [['#7B8089', 0.2], ['#9A9FA8', 0.1]], 13);
  c.fillStyle = '#767B84';
  c.fillRect(0, 0, PX, 1);
  c.fillRect(0, 0, 1, PX);
};
const arena = (c: Ctx) => ruido(c, '#E3D08C', [['#D6C07A', 0.2], ['#EEDDA0', 0.1]], 14);

function tablones(c: Ctx, base: string, linea: string, semilla: number, vertical = false) {
  ruido(c, base, [[linea, 0.05]], semilla);
  c.fillStyle = linea;
  const r = azar(semilla);
  for (let i = 3; i < PX; i += 4) {
    if (vertical) c.fillRect(i, 0, 1, PX);
    else c.fillRect(0, i, PX, 1);
    const corte = Math.floor(r() * PX);
    if (vertical) c.fillRect(i - 3, corte, 3, 1);
    else c.fillRect(corte, i - 3, 1, 3);
  }
}
const pisoMadera = (c: Ctx) => tablones(c, '#C08F55', '#9C703E', 21);

/** Dibuja un blob redondeado (copa de árbol, arbusto). */
function blob(c: Ctx, radio: number, base: string, oscuro: string, claro: string, semilla: number) {
  const r = azar(semilla);
  for (let y = 0; y < PX; y++) {
    for (let x = 0; x < PX; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      if (d > radio) continue;
      const v = r();
      c.fillStyle = d > radio - 1 ? oscuro : v < 0.2 ? oscuro : v < 0.35 ? claro : base;
      c.fillRect(x, y, 1, 1);
    }
  }
}

// ---------- Casillas ----------
const PINTORES: Record<string, (c: Ctx) => void> = {
  '.': cesped,
  ',': camino,
  _: pisoMadera,
  ':': pisoPiedra,
  s: arena,
  '+': (c) => {
    pisoMadera(c);
    c.fillStyle = '#7A5A30';
    c.fillRect(2, 2, 12, 12);
    c.fillStyle = '#B08850';
    c.fillRect(3, 3, 10, 10);
    c.fillStyle = '#C9A66B';
    c.fillRect(3, 3, 10, 1);
  },
  d: (c) => {
    pisoMadera(c);
    c.fillStyle = '#5A3A1C';
    c.fillRect(0, 0, 2, PX);
    c.fillRect(14, 0, 2, PX);
  },
  '=': (c) => {
    tablones(c, '#A0703A', '#7A5228', 22);
    c.fillStyle = '#5A3A1C';
    c.fillRect(0, 0, 1, PX);
    c.fillRect(15, 0, 1, PX);
  },
  '#': (c) => {
    ruido(c, '#7A7F88', [['#6E737C', 0.15], ['#8A8F98', 0.1]], 31);
    c.fillStyle = '#5E636B';
    for (let y = 0; y < PX; y += 4) {
      c.fillRect(0, y, PX, 1);
      const off = (y / 4) % 2 ? 4 : 0;
      for (let x = off; x < PX; x += 8) c.fillRect(x, y, 1, 4);
    }
  },
  M: (c) => tablones(c, '#8A5A32', '#6B4426', 32, true),
  C: (c) => {
    ruido(c, '#6B4A2B', [['#5A3D22', 0.2]], 33);
    for (let y = 2; y < PX; y += 4) {
      for (let x = 1; x < PX; x += 2) {
        c.fillStyle = (x + y) % 3 ? '#5DBB3F' : '#3E8A2A';
        c.fillRect(x, y, 1, 2);
      }
    }
  },
  V: (c) => {
    cesped(c);
    c.fillStyle = '#8A5A32';
    c.fillRect(0, 6, PX, 2);
    c.fillRect(0, 10, PX, 2);
    c.fillStyle = '#6B4426';
    c.fillRect(2, 3, 2, 11);
    c.fillRect(12, 3, 2, 11);
  },
  R: (c) => ruido(c, '#4A4E57', [['#3A3D45', 0.2], ['#5C616B', 0.12]], 34),
  D: (c) => {
    tablones(c, '#8B5A2B', '#6B4426', 35, true);
    c.fillStyle = '#4A2E14';
    c.fillRect(0, 0, PX, 1);
    c.fillRect(0, 15, PX, 1);
    c.fillRect(0, 0, 1, PX);
    c.fillRect(15, 0, 1, PX);
    c.fillStyle = '#F2C94C';
    c.fillRect(11, 7, 2, 2);
  },
  T: (c) => {
    cesped(c);
    blob(c, 7.6, '#2E7D32', '#1F5C24', '#3E9A42', 36);
  },
  A: (c) => {
    cesped(c);
    blob(c, 5.2, '#3E9A42', '#2E7D32', '#5DBB3F', 37);
  },
  P: (c) => {
    pisoPiedra(c);
    ruido(c, '#9A9EA6', [['#8A8E96', 0.25], ['#B0B4BB', 0.12]], 38);
    c.fillStyle = '#5E636B';
    c.fillRect(0, 0, PX, 1);
    c.fillRect(0, 15, PX, 1);
    c.fillRect(0, 0, 1, PX);
    c.fillRect(15, 0, 1, PX);
    c.fillRect(0, 7, PX, 1);
    c.fillRect(7, 0, 1, 7);
    c.fillRect(4, 8, 1, 7);
    c.fillRect(11, 8, 1, 7);
  },
  Z: (c) => {
    pisoPiedra(c);
    c.fillStyle = '#EEEEEE';
    for (let i = 1; i < 15; i++) {
      c.fillRect(i, i, 1, 1);
      c.fillRect(15 - i, i, 1, 1);
    }
    c.fillRect(1, 7, 14, 1);
    c.fillRect(7, 1, 1, 14);
  },
  '~': (c) => {
    ruido(c, '#3F76E4', [['#5B8EF0', 0.08], ['#335FC0', 0.06]], 41);
    c.fillStyle = '#8FB4FF';
    c.fillRect(2, 4, 4, 1);
    c.fillRect(9, 9, 4, 1);
    c.fillRect(4, 13, 3, 1);
  },
  '^': (c) => ruido(c, '#E8572A', [['#F2A03D', 0.14], ['#FFD25C', 0.04], ['#C0391F', 0.08]], 42),
  o: (c) => {
    c.fillStyle = '#3A2A1A';
    c.fillRect(0, 0, PX, PX);
    c.fillStyle = '#141414';
    c.fillRect(1, 1, 14, 14);
    c.fillStyle = '#050505';
    c.fillRect(3, 3, 10, 10);
  },
  X: (c) => ruido(c, '#1E222B', [], 1),
};

/** Color representativo de cada casilla rompible (para las partículas). */
export const COLOR_PARTICULA: Record<string, number> = {
  T: 0x2e7d32,
  A: 0x5dbb3f,
  P: 0x9a9ea6,
  Z: 0xeeeeee,
};

export const texTile = (tile: string) => `t:${tile}`;

function sprite([filas, paleta]: [string[], Paleta]) {
  const [canvas, ctx] = lienzo();
  dibujar(ctx, filas, paleta);
  return canvas;
}

/** Canvas del sprite de BIT, también lo usa la interfaz (ícono de la misión). */
export const canvasBit = () => sprite(BIT);

export function crearTexturas(scene: Phaser.Scene) {
  for (const tile of Object.keys(TILES)) {
    const pintor = PINTORES[tile];
    if (!pintor) throw new Error(`Falta la textura de la casilla "${tile}"`);
    const [canvas, ctx] = lienzo();
    pintor(ctx);
    scene.textures.addCanvas(texTile(tile), canvas);
  }
  scene.textures.addCanvas('bit', sprite(BIT));
  scene.textures.addCanvas('heroe', sprite(HEROE));
  scene.textures.addCanvas('sombri', sprite(SOMBRI));
  scene.textures.addCanvas('chispa', sprite(CHISPA));
  scene.textures.addCanvas('fragmento', sprite(FRAGMENTO));
  scene.textures.addCanvas('meta', sprite(META));

  const [px, pctx] = lienzo(2, 2);
  pctx.fillStyle = '#FFFFFF';
  pctx.fillRect(0, 0, 2, 2);
  scene.textures.addCanvas('px', px);
}
