import './styles.css';
import { Editor } from './blocks/editor';
import { Juego } from './game/juego';
import { cargarProgreso } from './game/progreso';
import { NIVELES } from './levels';
import { canvasBit, canvasFragmento } from './scene/textures';
import { crearEscenario } from './scene/StageScene';
import { dom } from './ui/ui';

const ANCHO = 1920;
const ALTO = 1080;

/** Celulares y tablets: pantalla táctil sin mouse, o pantalla muy chica. */
function esDispositivoMovil(): boolean {
  const tactilSinMouse = matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
  return tactilSinMouse || Math.min(screen.width, screen.height) < 600;
}

function avisoMovil() {
  if (!esDispositivoMovil()) return;
  const aviso = document.getElementById('movil')!;
  document.getElementById('movil-bit')!.append(canvasBit());
  aviso.hidden = false;
  document.getElementById('btn-movil-igual')!.onclick = () => (aviso.hidden = true);
}

/** El fragmento del Cristal como ícono de la pestaña (recortado y ampliado para que llene el ícono). */
function favicon() {
  const fuente = canvasFragmento();
  const datos = fuente.getContext('2d')!.getImageData(0, 0, fuente.width, fuente.height);
  let x0 = fuente.width, y0 = fuente.height, x1 = -1, y1 = -1;
  for (let y = 0; y < fuente.height; y++) {
    for (let x = 0; x < fuente.width; x++) {
      if (datos.data[(y * fuente.width + x) * 4 + 3] === 0) continue;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x);
      y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
  }
  const ancho = x1 - x0 + 1;
  const alto = y1 - y0 + 1;
  const tam = 32;
  const escala = Math.max(1, Math.floor(tam / Math.max(ancho, alto)));
  const c = document.createElement('canvas');
  c.width = c.height = tam;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(fuente, x0, y0, ancho, alto, Math.floor((tam - ancho * escala) / 2), Math.floor((tam - alto * escala) / 2), ancho * escala, alto * escala);
  document.querySelector<HTMLLinkElement>('link[rel=icon]')!.href = c.toDataURL();
}

async function iniciar() {
  avisoMovil();
  favicon();
  dom.misionIcono.append(canvasBit());

  let juego: Juego | null = null;
  const editor = new Editor(dom.blockly, () => juego?.alCambiarCodigo());

  // Escala toda la app para que entre en la ventana manteniendo 16:9.
  const ajustar = () => {
    const u = Math.min(window.innerWidth / ANCHO, window.innerHeight / ALTO);
    document.documentElement.style.setProperty('--u', String(u));
    editor.escalar(u);
    dom.cabBloques.style.width = `${editor.anchoCajaBloques()}px`;
  };
  ajustar();
  window.addEventListener('resize', ajustar);

  const escena = await crearEscenario(dom.escenario);
  juego = new Juego(NIVELES, editor, escena, cargarProgreso());
  juego.iniciar();
  // Ya está todo dibujado: se muestra la app (index.html la oculta mientras carga).
  document.body.classList.add('listo');

  if (import.meta.env.DEV) {
    // Ganchos para las pruebas automáticas (scripts/captura.mjs). No existen en la versión publicada.
    const { parseSolucion } = await import('./engine/parse');
    const { GALERIA } = await import('./levels/galeria');
    const { World } = await import('./engine/world');
    Object.assign(window, {
      __debug: {
        juego,
        editor,
        escena,
        cargar: (n: number) => juego!.cargar(n),
        desbloquear: () => juego!.desbloquearParte2(),
        ponerSolucion: (n: number) => editor.ponerPrograma(parseSolucion(NIVELES[n].solucion)),
        ponerTexto: (t: string) => editor.ponerPrograma(parseSolucion(t)),
        galeria: (tema: string) => escena.mostrar(new World({ ...GALERIA, tema } as typeof GALERIA)),
        sprites: () => import('./scene/visor').then((m) => m.mostrarVisor()),
        aspecto: (n: number) => {
          escena.aspecto = n;
          juego!.reiniciar();
        },
      },
    });
  }
}

iniciar();
