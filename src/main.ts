import './styles.css';
import { Editor } from './blocks/editor';
import { Juego } from './game/juego';
import { cargarProgreso } from './game/progreso';
import { NIVELES } from './levels';
import { canvasBit } from './scene/textures';
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

/** BIT como ícono de la pestaña. */
function favicon() {
  const c = document.createElement('canvas');
  c.width = c.height = 20;
  c.getContext('2d')!.drawImage(canvasBit(), 2, 0);
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
