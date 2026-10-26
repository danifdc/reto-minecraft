import type * as Phaser from 'phaser';
import { TILES } from '../engine/tiles';
import type { Tema } from '../engine/types';
import {
  ASPECTOS, BIT, CHISPA, FRAGMENTO, PALETAS_SOMBRI, PALETA_BIT, PALETA_CHISPA, PALETA_FRAGMENTO, SOMBRI,
  type Cuadros, type Vista,
} from './arte/personajes';
import { ALTOS, ALTO_BLOQUE, VARIANTES, pintarAlto, pintarSuelo } from './arte/terreno';
import { PX, dibujar, lienzo, px, rect, type Ctx, type Paleta } from './pixel';

// ---------------------------------------------------------------- claves de textura

export const texSuelo = (tema: Tema, tile: string, v: number) => `s:${tema}:${tile}:${v}`;
export const texAlto = (tema: Tema, tile: string) => `a:${tema}:${tile}`;
export const texBit = (vista: Vista, cuadro: number) => `bit:${vista}:${cuadro}`;
export const texHeroe = (aspecto: number, vista: Vista, cuadro: number) => `h${aspecto}:${vista}:${cuadro}`;
export const texSombri = (tipo: 'sombra' | 'fuego') => `sombri:${tipo}`;
export const texMeta = (cuadro: number) => `meta:${cuadro}`;
export const texGrieta = (n: number) => `grieta:${n}`;

/** Variante de textura para la casilla (x, y): siempre la misma para la misma posición. */
export function variante(tile: string, x: number, y: number): number {
  const n = VARIANTES[tile] ?? 1;
  if (n === 1) return 0;
  const h = ((x * 73856093) ^ (y * 19349663)) >>> 0;
  // Pasto: la mayoría liso; flores y matas de vez en cuando.
  if (tile === '.') {
    const r = h % 100;
    return r < 55 ? 0 : r < 78 ? 1 : r < 92 ? 2 : 3;
  }
  return h % n;
}

// ---------------------------------------------------------------- sprites

function validar(nombre: string, filas: string[], ancho: number) {
  filas.forEach((f, i) => {
    if (f.length !== ancho) throw new Error(`Sprite "${nombre}", fila ${i}: mide ${f.length} y debería medir ${ancho}`);
  });
}

function sprite(nombre: string, filas: string[], paleta: Paleta): HTMLCanvasElement {
  validar(nombre, filas, PX);
  const [canvas, ctx] = lienzo(PX, filas.length);
  dibujar(ctx, filas, paleta);
  return canvas;
}

/** Canvas de BIT de frente, para la interfaz (ícono de la misión). */
export const canvasBit = () => sprite('bit', BIT.frente[0], PALETA_BIT);

/** Canvas del héroe de frente, para la interfaz (selección de personaje). */
export const canvasHeroe = (aspecto: number) => sprite(`heroe${aspecto}`, ASPECTOS[aspecto].cuadros.frente[0], ASPECTOS[aspecto].paleta);

function agregar(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement) {
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, canvas);
}

function agregarCuadros(scene: Phaser.Scene, nombre: string, cuadros: Cuadros, paleta: Paleta, clave: (v: Vista, f: number) => string) {
  for (const vista of ['frente', 'espalda', 'lado'] as Vista[]) {
    cuadros[vista].forEach((filas, f) => agregar(scene, clave(vista, f), sprite(`${nombre}:${vista}:${f}`, filas, paleta)));
  }
}

// ---------------------------------------------------------------- efectos

function pintar(w: number, h: number, fn: (c: Ctx) => void): HTMLCanvasElement {
  const [canvas, ctx] = lienzo(w, h);
  fn(ctx);
  return canvas;
}

/** Bandera de la meta, con un rombo celeste (el Cristal). Dos cuadros para que flamee. */
function bandera(cuadro: number) {
  return pintar(PX, 24, (c) => {
    rect(c, 4, 1, 2, 20, '#5A3A22');
    rect(c, 4, 1, 1, 20, '#7A5230');
    rect(c, 3, 0, 4, 2, '#F2C94C');
    const largos = cuadro === 0 ? [7, 8, 9, 9, 9, 9, 8, 7] : [8, 9, 9, 8, 8, 9, 9, 8];
    largos.forEach((l, i) => {
      rect(c, 6, 2 + i, l, 1, i === 7 ? '#B8912A' : '#F2C94C');
      px(c, 5 + l, 2 + i, '#B8912A');
    });
    // Emblema: el Cristal del Amanecer.
    const cx = 10;
    px(c, cx, 3, '#4FD1C5');
    rect(c, cx - 1, 4, 3, 1, '#4FD1C5');
    rect(c, cx - 2, 5, 5, 1, '#4FD1C5');
    px(c, cx, 5, '#E6FFFB');
    rect(c, cx - 1, 6, 3, 1, '#2A9D8F');
    px(c, cx, 7, '#2A9D8F');
    // Base de piedra.
    rect(c, 2, 20, 6, 2, '#8A8F98');
    rect(c, 1, 22, 8, 2, '#6F747C');
    rect(c, 2, 20, 6, 1, '#B0B4BB');
  });
}

function crearEfectos(scene: Phaser.Scene) {
  agregar(scene, 'px', pintar(2, 2, (c) => rect(c, 0, 0, 2, 2, '#FFFFFF')));

  agregar(scene, 'sombra', pintar(12, 4, (c) => {
    rect(c, 2, 0, 8, 4, 'rgba(0,0,0,0.3)');
    rect(c, 0, 1, 12, 2, 'rgba(0,0,0,0.3)');
  }));

  agregar(scene, 'sombra-bloque', pintar(PX, 4, (c) => {
    [0.32, 0.18, 0.08, 0.03].forEach((a, y) => rect(c, 0, y, PX, 1, `rgba(0,0,0,${a})`));
  }));

  // Brillo suave (se usa con mezcla aditiva) para objetos y la meta.
  agregar(scene, 'brillo', pintar(32, 32, (c) => {
    const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
  }));

  // Grietas progresivas sobre un bloque (mismo tamaño que un alto).
  const GRIETAS: [number, number][][] = [
    [[7, 4], [8, 5], [8, 6], [7, 7]],
    [[9, 8], [10, 9], [5, 6], [4, 7], [4, 8], [11, 3], [12, 2]],
    [[3, 12], [4, 13], [11, 12], [12, 14], [6, 10], [7, 11], [9, 14], [2, 3], [13, 6]],
  ];
  for (let n = 0; n < 3; n++) {
    agregar(scene, texGrieta(n), pintar(PX, ALTO_BLOQUE, (c) => {
      for (let k = 0; k <= n; k++) for (const [x, y] of GRIETAS[k]) px(c, x, y, 'rgba(20,16,12,0.85)');
    }));
  }

  // Tajo del ataque: media luna blanca apuntando hacia arriba (se rota según la dirección).
  agregar(scene, 'tajo', pintar(PX, PX, (c) => {
    for (let a = 200; a <= 340; a += 4) {
      const rad = (a * Math.PI) / 180;
      for (const r of [5, 6, 7]) {
        px(c, Math.round(8 + Math.cos(rad) * r), Math.round(10 + Math.sin(rad) * r), r === 7 ? 'rgba(255,255,255,0.6)' : '#FFFFFF');
      }
    }
  }));

  // Globito con "?" cuando una acción no tiene efecto.
  agregar(scene, 'duda', pintar(12, 13, (c) => dibujar(c, [
    '.oooooooooo.',
    'oWWWWWWWWWWo',
    'oWWWkkkkWWWo',
    'oWWkkWWkkWWo',
    'oWWWWWWkkWWo',
    'oWWWWWkkWWWo',
    'oWWWWkkWWWWo',
    'oWWWWWWWWWWo',
    'oWWWWkkWWWWo',
    'oWWWWWWWWWWo',
    '.oooooooooo.',
    '....ooo.....',
    '.....o......',
  ], { o: '#1E222B', W: '#FFFFFF', k: '#1E222B' })));

  agregar(scene, 'estrella', pintar(5, 5, (c) => {
    rect(c, 2, 0, 1, 5, '#FFE45C');
    rect(c, 0, 2, 5, 1, '#FFE45C');
    px(c, 2, 2, '#FFFFFF');
  }));

  // Marco dorado que señala la casilla de la meta.
  agregar(scene, 'marco-meta', pintar(PX, PX, (c) => {
    const oro = '#F2C94C';
    rect(c, 0, 0, PX, 1, oro);
    rect(c, 0, 15, PX, 1, oro);
    rect(c, 0, 0, 1, PX, oro);
    rect(c, 15, 0, 1, PX, oro);
    for (const [x, y] of [[1, 1], [12, 1], [1, 12], [12, 12]]) {
      rect(c, x, y, 3, 3, '#FFE89A');
    }
  }));

  agregar(scene, texMeta(0), bandera(0));
  agregar(scene, texMeta(1), bandera(1));
}

// ---------------------------------------------------------------- registro

/** Personajes, objetos y efectos (no dependen del tema). Se llama una vez al crear la escena. */
export function crearTexturas(scene: Phaser.Scene) {
  agregarCuadros(scene, 'bit', BIT, PALETA_BIT, texBit);
  ASPECTOS.forEach((a, i) => agregarCuadros(scene, `heroe${i}`, a.cuadros, a.paleta, (v, f) => texHeroe(i, v, f)));
  agregar(scene, texSombri('sombra'), sprite('sombri', SOMBRI, PALETAS_SOMBRI.sombra));
  agregar(scene, texSombri('fuego'), sprite('sombri-fuego', SOMBRI, PALETAS_SOMBRI.fuego));
  agregar(scene, 'chispa', sprite('chispa', CHISPA, PALETA_CHISPA));
  agregar(scene, 'fragmento', sprite('fragmento', FRAGMENTO, PALETA_FRAGMENTO));
  crearEfectos(scene);
}

/** Texturas de terreno de un tema. Se generan la primera vez que se usa el tema. */
export function asegurarTema(scene: Phaser.Scene, tema: Tema) {
  if (scene.textures.exists(texSuelo(tema, '.', 0))) return;
  for (const tile of Object.keys(TILES)) {
    if (tile === 'X') continue;
    if (ALTOS.has(tile)) {
      agregar(scene, texAlto(tema, tile), pintar(PX, ALTO_BLOQUE, (c) => pintarAlto(c, tile, tema)));
    } else {
      for (let v = 0; v < (VARIANTES[tile] ?? 1); v++) {
        agregar(scene, texSuelo(tema, tile, v), pintar(PX, PX, (c) => pintarSuelo(c, tile, tema, v)));
      }
    }
  }
}
