import { ASPECTOS, BIT, PALETA_BIT, type Cuadros, type Vista } from './arte/personajes';
import { dibujar, espejo, lienzo, PX, type Paleta } from './pixel';

/** Solo desarrollo: muestra todos los cuadros de los personajes en grande para revisar el arte. */
export function mostrarVisor() {
  const caja = document.createElement('div');
  caja.style.cssText = 'position:fixed;inset:0;z-index:999;background:#1E222B;display:flex;flex-direction:column;gap:12px;padding:16px;overflow:auto';
  const fila = (cuadros: Cuadros, paleta: Paleta) => {
    const f = document.createElement('div');
    f.style.cssText = 'display:flex;gap:12px';
    for (const vista of ['frente', 'espalda', 'lado'] as Vista[]) {
      cuadros[vista].forEach((filas, i) => {
        const [c, ctx] = lienzo(PX, filas.length);
        dibujar(ctx, filas, paleta);
        const lienzos = vista === 'lado' && i === 0 ? [c, espejo(c)] : [c];
        for (const l of lienzos) {
          l.style.cssText = `width:${PX * 6}px;height:${filas.length * 6}px;image-rendering:pixelated;background:#5DAE3E`;
          f.append(l);
        }
      });
    }
    caja.append(f);
  };
  fila(BIT, PALETA_BIT);
  ASPECTOS.forEach((a) => fila(a.cuadros, a.paleta));
  document.body.append(caja);
}
