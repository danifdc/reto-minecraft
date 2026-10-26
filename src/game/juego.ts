import type { Editor, PasoPrograma } from '../blocks/editor';
import type { LevelDef } from '../engine/types';
import { World } from '../engine/world';
import { CONTRASENA_PARTE2, INICIO_PARTE2 } from '../levels';
import { ASPECTOS } from '../scene/arte/personajes';
import type { StageScene } from '../scene/StageScene';
import * as arte from '../ui/arte';
import {
  cerrarDialogo, claveIncorrecta, dom, mostrarAviso, mostrarBateria, mostrarContador, mostrarDialogo, mostrarHeroes,
  mostrarMision, mostrarModo, mostrarNiveles, mostrarPantalla, mostrarPausa, ocultarAviso, textoBoton, type Modo,
} from '../ui/ui';
import { setSilencio, sonido } from '../audio/sonidos';
import { borrarProgreso, contrasenaCorrecta, guardarProgreso, type Progreso } from './progreso';

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Controlador: une el editor de bloques, el motor (World), la escena y las pantallas.
 *
 * Modos dentro de un nivel:
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
  /** Nivel al que se quería ir cuando apareció el pedido de contraseña. */
  private destinoParte2 = INICIO_PARTE2;

  constructor(
    private readonly niveles: LevelDef[],
    private readonly editor: Editor,
    private readonly escena: StageScene,
    private progreso: Progreso,
  ) {
    dom.btnEjecutar.onclick = () => (this.modo === 'editar' ? this.ejecutar() : this.reiniciar());
    dom.btnPaso.onclick = () => this.paso();
    dom.btnBorrar.onclick = () => this.editor.borrarTodo();
    dom.btnInicio.onclick = () => this.irAPortada();
    dom.btnJugar.onclick = () => this.jugar();
    dom.btnBorrarProgreso.onclick = () => this.confirmarBorrado();
    dom.formClave.onsubmit = (e) => {
      e.preventDefault();
      this.probarClave();
    };
    dom.btnPausaVolver.onclick = () => mostrarPantalla('juego');
    dom.btnFinalInicio.onclick = () => this.irAPortada();
    this.escena.aspecto = progreso.aspecto;
    setSilencio(progreso.silencio);
    this.dibujarBotonSonido();
    dom.btnSonido.onclick = () => {
      this.progreso.silencio = !this.progreso.silencio;
      setSilencio(this.progreso.silencio);
      this.guardar();
      this.dibujarBotonSonido();
    };
  }

  private dibujarBotonSonido() {
    const apagado = this.progreso.silencio;
    dom.btnSonido.textContent = apagado ? '🔇' : '🔊';
    dom.btnSonido.title = apagado ? 'Activar sonidos' : 'Silenciar sonidos';
    dom.btnSonido.classList.toggle('apagado', apagado);
  }

  private get def() {
    return this.niveles[this.nivel];
  }

  private get hechos() {
    return new Set(Object.keys(this.progreso.completados).map(Number));
  }

  private guardar(inmediato = false) {
    guardarProgreso(this.progreso, inmediato);
  }

  // ---------------------------------------------------------------- portada

  /** Arranque: deja cargado el último nivel (detrás) y muestra la portada. */
  iniciar() {
    const n = this.progreso.nivel;
    this.cargar(n < this.niveles.length && (n < INICIO_PARTE2 || this.progreso.parte2) ? n : 0);
    this.irAPortada();
  }

  irAPortada() {
    cerrarDialogo();
    this.reiniciar();
    this.dibujarPortada();
    mostrarPantalla('portada');
  }

  private dibujarPortada() {
    const { aspecto } = this.progreso;
    mostrarHeroes(
      ASPECTOS.map((_, i) => arte.retratoHeroe(i, 5)),
      ASPECTOS.map((a) => a.nombre),
      aspecto,
      (n) => this.elegirHeroe(n),
    );
    dom.portadaEscena.replaceChildren(arte.escenaPortada(aspecto, 9));
    dom.portadaCristal.replaceChildren(arte.fragmento(7));
    const hechos = this.hechos.size;
    const empezado = hechos > 0 || this.progreso.nivel > 0;
    textoBoton(dom.btnJugar, '▶', empezado ? 'Continuar' : 'Jugar');
    dom.portadaProgreso.textContent = empezado ? `Llevas ${hechos} de ${this.niveles.length} misiones` : '';
    dom.btnBorrarProgreso.hidden = !empezado;
  }

  private elegirHeroe(n: number) {
    sonido.seleccionarHeroe();
    this.progreso.aspecto = n;
    this.escena.aspecto = n;
    this.guardar();
    this.dibujarPortada();
  }

  private jugar() {
    sonido.jugar();
    mostrarPantalla('juego');
    const n = this.progreso.nivel;
    this.cargar(n >= INICIO_PARTE2 && !this.progreso.parte2 ? 0 : n);
    if (!this.progreso.prologo) this.mostrarPrologo();
  }

  private mostrarPrologo() {
    this.progreso.prologo = true;
    this.guardar();
    mostrarDialogo({
      tipo: 'historia',
      icono: arte.duo(this.progreso.aspecto, 5),
      titulo: 'El Cristal del Amanecer',
      texto: 'La Aldea Albor siempre estuvo iluminada por el Cristal del Amanecer. Pero una noche, la Tormenta Sombría lo partió en 4 fragmentos y los escondió por todo el mundo.',
      extra: 'Tu héroe no puede abrirse paso solo… ¡pero tiene a BIT! Programa a BIT con bloques para despejar el camino y recuperar los fragmentos.',
      botones: [{ texto: '¡Vamos!', accion: () => {} }],
    });
  }

  private confirmarBorrado() {
    mostrarDialogo({
      tipo: 'perdio',
      icono: arte.bit(4, true),
      titulo: '¿Borrar tu progreso?',
      texto: 'Se borrarán los niveles completados y el código que armaste. Esto no se puede deshacer.',
      botones: [
        { texto: 'Cancelar', secundario: true, accion: () => {} },
        {
          texto: 'Sí, borrar',
          accion: () => {
            this.progreso = borrarProgreso();
            setSilencio(false);
            this.dibujarBotonSonido();
            this.escena.aspecto = 0;
            this.dibujarPortada();
          },
        },
      ],
    });
  }

  // ---------------------------------------------------------------- niveles

  /** Lo llama el editor cada vez que cambia el código: actualiza el contador y guarda el código del nivel. */
  alCambiarCodigo() {
    if (!this.niveles.length) return;
    mostrarContador(this.editor.programa().length, this.def.ideal);
    this.progreso.codigo[this.nivel] = this.editor.guardar();
    this.guardar();
  }

  cargar(n: number) {
    if (n >= INICIO_PARTE2 && !this.progreso.parte2) {
      this.pedirClave(n);
      return;
    }
    this.nivel = n;
    this.progreso.nivel = n;
    this.guardar();
    cerrarDialogo();
    mostrarPantalla('juego');
    this.dibujarEstado();
    this.editor.cargarNivel(this.def.bloques, this.progreso.codigo[n]);
    this.reiniciar();
    dom.cabBloques.style.width = `${this.editor.anchoCajaBloques()}px`;
  }

  /** Barra de niveles, misión y batería. */
  private dibujarEstado() {
    const mejor = this.progreso.completados[this.nivel];
    mostrarMision(this.nivel + 1, this.def.titulo, this.def.mision, mejor !== undefined);
    dom.misionHecho.title = mejor !== undefined ? `Lo resolviste con ${mejor} bloques` : '';
    mostrarNiveles(
      { total: this.niveles.length, actual: this.nivel, hechos: this.hechos, inicioParte2: INICIO_PARTE2, parte2: this.progreso.parte2 },
      (i) => this.cargar(i),
    );
    mostrarBateria(this.cargaBateria());
  }

  /** En la parte 1 la batería baja con cada nivel completado; con la contraseña queda llena. */
  private cargaBateria(): number {
    if (this.progreso.parte2) return 5;
    const hechosParte1 = [...this.hechos].filter((i) => i < INICIO_PARTE2).length;
    return Math.max(1, 5 - Math.floor((4 * hechosParte1) / INICIO_PARTE2));
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
    sonido.ejecutar();
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
      sonido.ejecutar();
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
    const usados = this.programa.length;
    const antes = this.progreso.completados[this.nivel];
    this.progreso.completados[this.nivel] = antes === undefined ? usados : Math.min(antes, usados);
    this.guardar(true);
    this.dibujarEstado();
    sonido.ganar();
    await this.escena.celebrar();
    if (id !== this.corrida) return;

    const { ideal } = this.def;
    const extra = usados <= ideal
      ? `¡Usaste ${usados} bloques: la solución ideal! ⭐`
      : `Usaste ${usados} bloques. La solución ideal usa ${ideal}. ¿Te animas a mejorarla?`;
    const ultimo = this.nivel === this.niveles.length - 1;
    const finParte1 = this.nivel === INICIO_PARTE2 - 1 && !this.progreso.parte2;
    const siguiente = ultimo
      ? { texto: 'Continuar ▶', accion: () => { sonido.siguiente(); this.mostrarFinal(); } }
      : finParte1
        ? { texto: 'Continuar ▶', accion: () => { sonido.siguiente(); this.terminarParte1(); } }
        : { texto: 'Siguiente nivel ▶', accion: () => { sonido.siguiente(); this.cargar(this.nivel + 1); } };
    mostrarDialogo({
      tipo: 'gano',
      icono: arte.duo(this.progreso.aspecto, 4),
      titulo: res.mensaje,
      texto: 'BIT abrió el camino y tu héroe pudo avanzar.',
      extra,
      botones: [{ texto: 'Quedarme aquí', secundario: true, accion: () => {} }, siguiente],
    });
  }

  private dialogoFallo(mensaje: string) {
    sonido.perder();
    mostrarDialogo({
      tipo: 'perdio',
      icono: arte.bit(4),
      titulo: '¡Casi!',
      texto: mensaje,
      extra: 'El bloque resaltado en el código es donde BIT se detuvo.',
      botones: [
        { texto: 'Ver mi código', secundario: true, accion: () => {} },
        { texto: '↺ Intentar de nuevo', accion: () => this.reiniciar() },
      ],
    });
  }

  // ---------------------------------------------------------------- pausa y contraseña

  /** Al terminar la parte 1, la batería de BIT se agota y hay que esperar al profe. */
  private async terminarParte1() {
    sonido.sinBateria();
    for (let c = this.cargaBateria(); c >= 0; c--) {
      mostrarBateria(c);
      await esperar(250);
    }
    mostrarPausa({
      titulo: '¡BIT se quedó sin batería!',
      texto: '¡Completaste la Parte 1! Ahora vuelve a la clase con tu profe. Cuando te dé el código de recarga, escríbelo aquí para continuar la aventura.',
      bit: arte.bit(9, true),
    });
    this.destinoParte2 = INICIO_PARTE2;
  }

  private pedirClave(destino: number) {
    this.destinoParte2 = destino;
    mostrarPausa({
      titulo: 'La Parte 2 está bloqueada',
      texto: 'BIT necesita recargar su batería para seguir.\nEscribe el código de recarga que te dará tu profe.',
      bit: arte.bit(9, true),
    });
  }

  desbloquearParte2() {
    this.progreso.parte2 = true;
    this.guardar(true);
  }

  private async probarClave() {
    if (!contrasenaCorrecta(dom.clave.value, CONTRASENA_PARTE2)) {
      sonido.claveMal();
      claveIncorrecta();
      return;
    }
    this.desbloquearParte2();
    sonido.recargar();
    // BIT se enciende y la batería se llena rayita por rayita.
    dom.pausaBit.replaceChildren(arte.bit(9));
    const grande = dom.pausa.querySelector('.bateria-grande')!;
    grande.classList.remove('vacia');
    const segmentos = grande.querySelectorAll('i');
    for (const s of segmentos) {
      s.classList.add('lleno');
      await esperar(220);
    }
    dom.pausaTitulo.textContent = '¡BIT tiene energía al máximo!';
    await esperar(900);
    segmentos.forEach((s) => s.classList.remove('lleno'));
    grande.classList.add('vacia');
    this.cargar(this.destinoParte2);
  }

  // ---------------------------------------------------------------- final

  private mostrarFinal() {
    const escena = document.createElement('div');
    escena.className = 'final-dibujo';
    escena.append(arte.fragmento(8), arte.duo(this.progreso.aspecto, 8));
    dom.finalEscena.replaceChildren(escena);
    const hechos = this.hechos.size;
    const total = this.niveles.length;
    dom.finalResumen.textContent = hechos === total
      ? `¡Completaste las ${total} misiones! ⭐`
      : `Completaste ${hechos} de ${total} misiones. Puedes volver a las que te faltan desde la barra de niveles.`;
    mostrarPantalla('final');
  }
}
