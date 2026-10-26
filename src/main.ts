import './styles.css';
import { Editor } from './blocks/editor';
import { Juego } from './game/juego';
import { NIVELES } from './levels';
import { canvasBit } from './scene/textures';
import { crearEscenario } from './scene/StageScene';
import { dom } from './ui/ui';

const ANCHO = 1920;
const ALTO = 1080;

async function iniciar() {
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
  juego = new Juego(NIVELES, editor, escena);
  juego.cargar(0);

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
