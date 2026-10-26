import { ASPECTOS, BIT, FRAGMENTO, PALETA_BIT, PALETA_FRAGMENTO } from '../scene/arte/personajes';
import { pintarSuelo } from '../scene/arte/terreno';
import { PX, azar, dibujar, lienzo, rect, ruido, type Paleta } from '../scene/pixel';

/** Ilustraciones pixel art para la interfaz (portada, diálogos, pausa). Se muestran escaladas con CSS. */

/** Canvas con estilo pixelado y tamaño en unidades de la app (--u). */
function aDom(canvas: HTMLCanvasElement, escala: number): HTMLCanvasElement {
  canvas.style.width = `calc(var(--u) * ${canvas.width * escala}px)`;
  canvas.style.height = `calc(var(--u) * ${canvas.height * escala}px)`;
  canvas.style.imageRendering = 'pixelated';
  return canvas;
}

const heroe = (aspecto: number) => ASPECTOS[aspecto].cuadros.frente[0];
const BIT_APAGADO: Paleta = { ...PALETA_BIT, e: '#3A4150', E: '#4A5262', r: '#5A3A30', y: '#6B717C' };

/** Isla flotante de pasto con el héroe y BIT (portada). */
export function escenaPortada(aspecto: number, escala: number): HTMLCanvasElement {
  const [c, ctx] = lienzo(64, 58);
  // Superficie de pasto (vista desde arriba) con algunas flores.
  for (let x = 4; x < 60; x += PX) {
    const [t, tctx] = lienzo(PX, PX);
    pintarSuelo(tctx, '.', 'aldea', x === 20 ? 2 : x === 36 ? 1 : 0);
    ctx.drawImage(t, 0, 0, Math.min(PX, 60 - x), PX, x, 22, Math.min(PX, 60 - x), PX);
  }
  rect(ctx, 4, 22, 56, 1, '#7BD458');
  // Cara frontal: borde de pasto y tierra.
  ruido(ctx, '#7A5A36', [['#6B4A2B', 0.25], ['#8A6A42', 0.12], ['#9A9FA8', 0.04]], 5, { x: 4, y: 38, w: 56, h: 9 });
  rect(ctx, 4, 38, 56, 2, '#3E8A2A');
  for (let x = 5; x < 60; x += 3) rect(ctx, x, 40, 1, 1 + (x % 2), '#3E8A2A');
  // Parte de abajo de la isla, que se va angostando.
  const r = azar(9);
  for (let y = 47; y < 58; y++) {
    const inset = 4 + Math.floor((y - 46) * 2.2 + r() * 2);
    if (inset >= 30) break;
    ruido(ctx, '#5A4030', [['#4A3020', 0.3], ['#6B7078', 0.12]], y, { x: inset, y, w: 64 - inset * 2, h: 1 });
  }
  // Sombras de los personajes y personajes.
  rect(ctx, 16, 33, 10, 2, 'rgba(0,0,0,0.25)');
  rect(ctx, 37, 34, 10, 2, 'rgba(0,0,0,0.25)');
  dibujar(ctx, heroe(aspecto), ASPECTOS[aspecto].paleta, 13, 14);
  dibujar(ctx, BIT.frente[0], PALETA_BIT, 34, 15);
  return aDom(c, escala);
}

/** Héroe y BIT lado a lado (diálogo de victoria, pantalla final). */
export function duo(aspecto: number, escala: number): HTMLCanvasElement {
  const [c, ctx] = lienzo(34, 20);
  dibujar(ctx, heroe(aspecto), ASPECTOS[aspecto].paleta, 0, 0);
  dibujar(ctx, BIT.frente[0], PALETA_BIT, 18, 0);
  return aDom(c, escala);
}

export function bit(escala: number, apagado = false): HTMLCanvasElement {
  const [c, ctx] = lienzo(PX, 20);
  dibujar(ctx, BIT.frente[0], apagado ? BIT_APAGADO : PALETA_BIT);
  return aDom(c, escala);
}

export function retratoHeroe(aspecto: number, escala: number): HTMLCanvasElement {
  const [c, ctx] = lienzo(PX, 20);
  dibujar(ctx, heroe(aspecto), ASPECTOS[aspecto].paleta);
  return aDom(c, escala);
}

export function fragmento(escala: number): HTMLCanvasElement {
  const [c, ctx] = lienzo(PX, PX);
  dibujar(ctx, FRAGMENTO, PALETA_FRAGMENTO);
  return aDom(c, escala);
}
