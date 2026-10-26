import type { Editor, PasoPrograma } from '../blocks/editor';
import type { LevelDef } from '../engine/types';
import { World } from '../engine/world';
import type { StageScene } from '../scene/StageScene';
import {
  cerrarDialogo, dom, mostrarAviso, mostrarContador, mostrarDialogo, mostrarMision, mostrarModo, mostrarNiveles,
  ocultarAviso, type Modo,
} from '../ui/ui';

/**
 * Controlador: une el editor de bloques, el motor (World) y la escena.
 *
 * Modos:
 *  - editar: se puede tocar el código.
 *  - auto:   se ejecuta todo el programa solo (botón Ejecutar).
 *  - pasos:  cada clic en "Paso a paso" ejecuta un bloque.
 *  - fin:    terminó (ganó o falló); hay que reiniciar para volver a editar.
 */
export class Juego {
  private nivel = 0;
  private world!: World;
  private modo: Modo = 'editar';
  private programa: PasoPrograma[] = [];
  private indice = 0;
  private pasoOcupado = false;
  /** Se incrementa al reiniciar: las animaciones de una corrida anterior dejan de tener efecto. */
  private corrida = 0;
  private readonly hechos = new Set<number>();

  constructor(
    private readonly niveles: LevelDef[],
    private readonly editor: Editor,
    private readonly escena: StageScene,
  ) {
    dom.btnEjecutar.onclick = () => (this.modo === 'editar' ? this.ejecutar() : this.reiniciar());
    dom.btnPaso.onclick = () => this.paso();
    dom.btnBorrar.onclick = () => this.editor.borrarTodo();
  }

  private get def() {
    return this.niveles[this.nivel];
  }

  /** Lo llama el editor cada vez que cambia el código. */
  alCambiarCodigo() {
    if (!this.niveles.length) return;
    mostrarContador(this.editor.programa().length, this.def.ideal);
  }

  cargar(n: number) {
    this.nivel = n;
    cerrarDialogo();
    mostrarMision(n + 1, this.def.titulo, this.def.mision);
    this.dibujarNiveles();
    this.editor.cargarNivel(this.def.bloques);
    this.reiniciar();
    dom.cabBloques.style.width = `${this.editor.anchoCajaBloques()}px`;
  }

  private dibujarNiveles() {
    mostrarNiveles(this.niveles.length, this.nivel, this.hechos, (n) => this.cargar(n));
  }

  private setModo(modo: Modo) {
    this.modo = modo;
    mostrarModo(modo, this.pasoOcupado);
  }

  reiniciar() {
    this.corrida++;
    this.pasoOcupado = false;
    this.world = new World(this.def);
    this.escena.mostrar(this.world);
    this.editor.resaltar(null);
    ocultarAviso();
    this.setModo('editar');
  }

  /** Lee el programa y deja el mundo en su estado inicial. Devuelve false si no hay bloques. */
  private preparar(): boolean {
    this.programa = this.editor.programa();
    if (this.programa.length === 0) {
      mostrarAviso('Arrastra bloques dentro de «al iniciar» para darle instrucciones a BIT.');
      return false;
    }
    this.indice = 0;
    this.world = new World(this.def);
    this.escena.mostrar(this.world);
    return true;
  }

  private async ejecutar() {
    if (!this.preparar()) return;
    this.setModo('auto');
    const id = this.corrida;
    while (this.indice < this.programa.length) {
      if (!(await this.ejecutarSiguiente(id))) return;
    }
    await this.terminar(id);
  }

  private async paso() {
    if (this.modo === 'editar') {
      if (!this.preparar()) return;
      this.setModo('pasos');
    }
    if (this.modo !== 'pasos' || this.pasoOcupado) return;
    const id = this.corrida;
    this.pasoOcupado = true;
    mostrarModo(this.modo, true);
    const sigue = await this.ejecutarSiguiente(id);
    if (id !== this.corrida) return;
    this.pasoOcupado = false;
    mostrarModo(this.modo);
    if (sigue && this.indice >= this.programa.length) await this.terminar(id);
  }

  /** Ejecuta y anima un bloque. Devuelve false si el intento terminó (falló o se reinició). */
  private async ejecutarSiguiente(id: number): Promise<boolean> {
    const { cmd, id: bloque } = this.programa[this.indice++];
    this.editor.resaltar(bloque);
    const r = this.world.exec(cmd);
    await this.escena.animar(r.events);
    if (id !== this.corrida) return false;
    if (r.aviso) mostrarAviso(r.aviso);
    if (r.fallo) {
      this.setModo('fin');
      this.dialogoFallo(r.fallo);
      return false;
    }
    return true;
  }

  private async terminar(id: number) {
    this.setModo('fin');
    this.editor.resaltar(null);
    const res = this.world.resultado();
    if (!res.gano) {
      this.dialogoFallo(res.mensaje);
      return;
    }
    this.hechos.add(this.nivel);
    this.dibujarNiveles();
    await this.escena.celebrar();
    if (id !== this.corrida) return;

    const usados = this.programa.length;
    const { ideal } = this.def;
    const extra = usados <= ideal
      ? `¡Usaste ${usados} bloques: la solución ideal! ⭐`
      : `Usaste ${usados} bloques. La solución ideal usa ${ideal}. ¿Te animas a mejorarla?`;
    const haySiguiente = this.nivel + 1 < this.niveles.length;
    mostrarDialogo({
      tipo: 'gano',
      icono: '🎉',
      titulo: res.mensaje,
      texto: haySiguiente ? 'BIT abrió el camino y el héroe pudo avanzar.' : '¡Completaste todos los niveles de prueba!',
      extra,
      botones: [
        { texto: 'Quedarme aquí', secundario: true, accion: () => {} },
        ...(haySiguiente ? [{ texto: 'Siguiente nivel ▶', accion: () => this.cargar(this.nivel + 1) }] : []),
      ],
    });
  }

  private dialogoFallo(mensaje: string) {
    mostrarDialogo({
      tipo: 'perdio',
      icono: '🤖',
      titulo: '¡Casi!',
      texto: mensaje,
      extra: 'El bloque resaltado en el código es donde BIT se detuvo.',
      botones: [
        { texto: 'Ver mi código', secundario: true, accion: () => {} },
        { texto: '↺ Intentar de nuevo', accion: () => this.reiniciar() },
      ],
    });
  }
}
