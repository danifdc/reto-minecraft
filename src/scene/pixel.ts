/** Utilidades para dibujar pixel art en canvas. 1 unidad = 1 píxel del arte (luego se escala ×4). */

export const PX = 16;

export type Ctx = CanvasRenderingContext2D;
export type Paleta = Record<string, string>;

export function lienzo(w = PX, h = PX): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

export function rect(c: Ctx, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

export const px = (c: Ctx, x: number, y: number, color: string) => rect(c, x, y, 1, 1, color);

/**
 * Dibuja un sprite descrito como filas de caracteres. Cada carácter es un color de la paleta;
 * el punto (.) es transparente.
 */
export function dibujar(c: Ctx, filas: string[], paleta: Paleta, ox = 0, oy = 0) {
  filas.forEach((fila, y) => {
    [...fila].forEach((ch, x) => {
      if (ch === '.' || ch === ' ') return;
      const color = paleta[ch];
      if (!color) throw new Error(`Color "${ch}" no está en la paleta`);
      px(c, ox + x, oy + y, color);
    });
  });
}

/** Generador pseudoaleatorio con semilla: las texturas salen siempre iguales. */
export function azar(semilla: number) {
  let s = (semilla * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}
export const TODO: Region = { x: 0, y: 0, w: PX, h: PX };

/** Rellena una región con un color base y salpica píxeles de otros colores. */
export function ruido(c: Ctx, base: string, motas: [string, number][], semilla: number, r: Region = TODO) {
  rect(c, r.x, r.y, r.w, r.h, base);
  const rnd = azar(semilla);
  for (let y = 0; y < r.h; y++) {
    for (let x = 0; x < r.w; x++) {
      const v = rnd();
      let acum = 0;
      for (const [color, prob] of motas) {
        acum += prob;
        if (v < acum) {
          px(c, r.x + x, r.y + y, color);
          break;
        }
      }
    }
  }
}

/**
 * Patrón de piedras irregulares (empedrado) con celdas de Voronoi que se repiten sin costuras.
 * `tonos` son los colores posibles de cada piedra; `junta` es el color entre piedras.
 */
export function empedrado(c: Ctx, tonos: string[], junta: string, semilla: number, r: Region = TODO, piedras = 7) {
  const rnd = azar(semilla);
  const semillas = Array.from({ length: piedras }, () => ({
    x: rnd() * r.w,
    y: rnd() * r.h,
    color: tonos[Math.floor(rnd() * tonos.length)],
  }));
  for (let y = 0; y < r.h; y++) {
    for (let x = 0; x < r.w; x++) {
      let d1 = Infinity;
      let d2 = Infinity;
      let mejor = semillas[0];
      for (const s of semillas) {
        // Distancia con "envoltura" para que la textura sea continua entre casillas.
        const dx = Math.min(Math.abs(x + 0.5 - s.x), r.w - Math.abs(x + 0.5 - s.x));
        const dy = Math.min(Math.abs(y + 0.5 - s.y), r.h - Math.abs(y + 0.5 - s.y));
        const d = Math.hypot(dx, dy);
        if (d < d1) {
          d2 = d1;
          d1 = d;
          mejor = s;
        } else if (d < d2) d2 = d;
      }
      px(c, r.x + x, r.y + y, d2 - d1 < 0.9 ? junta : mejor.color);
    }
  }
}

/** Ladrillos de 4 px de alto con juntas desplazadas en filas alternas. */
export function ladrillos(c: Ctx, base: string, motas: [string, number][], junta: string, semilla: number, r: Region = TODO) {
  ruido(c, base, motas, semilla, r);
  for (let y = 0; y < r.h; y += 4) {
    rect(c, r.x, r.y + y, r.w, 1, junta);
    const off = (y / 4) % 2 ? 4 : 0;
    for (let x = off; x < r.w; x += 8) rect(c, r.x + x, r.y + y, 1, Math.min(4, r.h - y), junta);
  }
}

/** Tablones horizontales de 4 px con cortes al azar. */
export function tablas(c: Ctx, base: string, motas: [string, number][], junta: string, semilla: number, r: Region = TODO) {
  ruido(c, base, motas, semilla, r);
  const rnd = azar(semilla + 7);
  for (let y = 3; y < r.h; y += 4) {
    rect(c, r.x, r.y + y, r.w, 1, junta);
    const corte = Math.floor(rnd() * r.w);
    rect(c, r.x + corte, r.y + y - 3, 1, 3, junta);
  }
}

/** Devuelve una copia del canvas reflejada horizontalmente. */
export function espejo(src: HTMLCanvasElement): HTMLCanvasElement {
  const [c, ctx] = lienzo(src.width, src.height);
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return c;
}
