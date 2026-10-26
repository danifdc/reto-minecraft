/** Utilidades para dibujar pixel art de 16×16 en canvas. */

export const PX = 16;

export type Paleta = Record<string, string>;

export function lienzo(w = PX, h = PX): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

/**
 * Dibuja un sprite descrito como filas de caracteres. Cada carácter es un color de la paleta;
 * el punto (.) es transparente.
 */
export function dibujar(ctx: CanvasRenderingContext2D, filas: string[], paleta: Paleta, ox = 0, oy = 0) {
  filas.forEach((fila, y) => {
    [...fila].forEach((ch, x) => {
      if (ch === '.' || ch === ' ') return;
      const color = paleta[ch];
      if (!color) throw new Error(`Color "${ch}" no está en la paleta`);
      ctx.fillStyle = color;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    });
  });
}

/** Generador pseudoaleatorio con semilla: las texturas salen siempre iguales. */
export function azar(semilla: number) {
  let s = semilla >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/** Rellena con un color base y salpica píxeles de otros colores (textura "con ruido"). */
export function ruido(ctx: CanvasRenderingContext2D, base: string, motas: [string, number][], semilla: number) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, PX, PX);
  const r = azar(semilla);
  for (let y = 0; y < PX; y++) {
    for (let x = 0; x < PX; x++) {
      const v = r();
      let acum = 0;
      for (const [color, prob] of motas) {
        acum += prob;
        if (v < acum) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
          break;
        }
      }
    }
  }
}
