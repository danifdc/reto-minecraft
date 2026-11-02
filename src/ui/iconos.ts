/**
 * Íconos de la interfaz: Pixelarticons (https://pixelarticons.com, licencia MIT), en pixel art como el resto.
 * Se importan los SVG del paquete como texto (Vite, `?raw`) y solo los que están acá terminan en el juego.
 * Usan `currentColor` y miden 1em: toman el color y el tamaño del texto donde se ponen.
 *
 * En `index.html` se escriben como `<i data-icono="casa"></i>` (los completa `ponerIconos`); en los textos de los
 * diálogos y botones, como `{casa}` (ver `textoConIconos`).
 */
import atras from 'pixelarticons/svg/arrow-left.svg?raw';
import candado from 'pixelarticons/svg/lock.svg?raw';
import casa from 'pixelarticons/svg/home.svg?raw';
import check from 'pixelarticons/svg/check.svg?raw';
import estrella from 'pixelarticons/svg/star.svg?raw';
import papelera from 'pixelarticons/svg/trash.svg?raw';
import rayo from 'pixelarticons/svg/zap.svg?raw';
import reiniciar from 'pixelarticons/svg/reload.svg?raw';
import silencio from 'pixelarticons/svg/volume-x.svg?raw';
import sonido from 'pixelarticons/svg/volume-3.svg?raw';

/*
 * Dibujados acá sobre la misma grilla de 24, en columnas de 2 (Pixelarticons no los trae así):
 * play relleno y "paso" (play con una barra, para ejecutar de a un bloque).
 */
const play = '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">'
  + '<path d="M5 4h2v16H5zM7 5h2v14H7zM9 6h2v12H9zM11 7h2v10h-2zM13 8h2v8h-2zM15 9h2v6h-2zM17 10h2v4h-2z"/></svg>';
const paso = '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">'
  + '<path d="M3 5h2v14H3zM5 6h2v12H5zM7 7h2v10H7zM9 8h2v8H9zM11 9h2v6h-2zM13 10h2v4h-2zM17 5h3v14h-3z"/></svg>';

const SVG = { atras, candado, casa, check, estrella, papelera, paso, play, rayo, reiniciar, silencio, sonido };

export type NombreIcono = keyof typeof SVG;

export const esIcono = (nombre: string): nombre is NombreIcono => Object.hasOwn(SVG, nombre);

/** El ícono como elemento <svg> (1em, del color del texto). La clase `ico-<nombre>` permite darle un color propio. */
export function icono(nombre: NombreIcono): SVGSVGElement {
  // Los SVG son del paquete o de este archivo (no de lo que escribe el alumno): se pueden interpretar como HTML.
  const plantilla = document.createElement('template');
  plantilla.innerHTML = SVG[nombre].trim();
  const svg = plantilla.content.firstElementChild as SVGSVGElement;
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('ico', `ico-${nombre}`);
  return svg;
}

/** Texto con íconos: cada `{nombre}` se reemplaza por su ícono; el resto queda como texto. */
export function textoConIconos(texto: string): Node[] {
  return texto.split(/(\{[a-z]+\})/).filter(Boolean).map((parte) => {
    const nombre = parte.slice(1, -1);
    return parte.startsWith('{') && esIcono(nombre) ? icono(nombre) : document.createTextNode(parte);
  });
}

/** Completa los `<i data-icono="…">` (y cualquier elemento con `data-icono`) de la página con su ícono. */
export function ponerIconos(raiz: ParentNode = document) {
  raiz.querySelectorAll<HTMLElement>('[data-icono]').forEach((el) => {
    const nombre = el.dataset.icono ?? '';
    if (esIcono(nombre)) el.replaceChildren(icono(nombre));
  });
}
