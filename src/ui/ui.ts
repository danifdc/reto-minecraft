/** Acceso al DOM de la interfaz. El controlador del juego solo habla con la UI a través de este módulo. */

const $ = <T extends HTMLElement = HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Falta #${id} en index.html`);
  return el as T;
};

export const dom = {
  app: $('app'),
  niveles: $('niveles'),
  bateria: $('bateria'),
  btnInicio: $<HTMLButtonElement>('btn-inicio'),
  btnSonido: $<HTMLButtonElement>('btn-sonido'),
  misionIcono: $('mision-icono'),
  misionChip: $('mision-chip'),
  misionTexto: $('mision-texto'),
  misionHecho: $('mision-hecho'),
  escenario: $('escenario'),
  aviso: $('aviso'),
  btnEjecutar: $<HTMLButtonElement>('btn-ejecutar'),
  btnPaso: $<HTMLButtonElement>('btn-paso'),
  btnBorrar: $<HTMLButtonElement>('btn-borrar'),
  cabBloques: $('cab-bloques'),
  contador: $('contador'),
  blockly: $('blockly'),
  bloqueo: $('bloqueo'),
  candado: $('candado'),
  dialogo: $('dialogo'),

  portada: $('portada'),
  heroes: $('heroes'),
  btnJugar: $<HTMLButtonElement>('btn-jugar'),
  portadaProgreso: $('portada-progreso'),
  portadaEscena: $('portada-escena'),
  portadaCristal: $('portada-cristal'),
  btnBorrarProgreso: $<HTMLButtonElement>('btn-borrar-progreso'),

  pausa: $('pausa'),
  pausaBit: $('pausa-bit'),
  pausaTitulo: $('pausa-titulo'),
  pausaTexto: $('pausa-texto'),
  formClave: $<HTMLFormElement>('form-clave'),
  clave: $<HTMLInputElement>('clave'),
  claveError: $('clave-error'),
  btnPausaVolver: $<HTMLButtonElement>('btn-pausa-volver'),

  final: $('final'),
  finalEscena: $('final-escena'),
  finalResumen: $('final-resumen'),
  btnFinalInicio: $<HTMLButtonElement>('btn-final-inicio'),
};

export type Modo = 'editar' | 'auto' | 'pasos' | 'fin';

/** Texto de botón con el ícono separado (las fuentes pixel desalinean los símbolos). */
export function textoBoton(btn: HTMLElement, icono: string, texto: string) {
  const i = document.createElement('span');
  i.className = 'btn-ico';
  i.textContent = icono;
  const t = document.createElement('span');
  t.textContent = texto;
  btn.replaceChildren(i, t);
}

export function mostrarModo(modo: Modo, pasoOcupado = false) {
  const editando = modo === 'editar';
  textoBoton(dom.btnEjecutar, editando ? '▶' : '↺', editando ? 'Ejecutar' : 'Reiniciar');
  dom.btnEjecutar.classList.toggle('reiniciar', !editando);
  dom.btnPaso.disabled = modo === 'auto' || modo === 'fin' || pasoOcupado;
  dom.btnBorrar.disabled = !editando;
  dom.bloqueo.hidden = editando;
  dom.candado.hidden = editando;
  dom.contador.hidden = !editando;
}

export function mostrarMision(numero: number, titulo: string, texto: string, hecho: boolean) {
  dom.misionChip.textContent = `${numero}. ${titulo}`;
  dom.misionTexto.textContent = texto;
  dom.misionHecho.hidden = !hecho;
}

export interface EstadoNiveles {
  total: number;
  actual: number;
  hechos: Set<number>;
  inicioParte2: number;
  parte2: boolean;
}

export function mostrarNiveles(e: EstadoNiveles, ir: (n: number) => void) {
  const boton = (i: number) => {
    const b = document.createElement('button');
    b.className = 'nivel-btn';
    b.textContent = String(i + 1);
    const bloqueado = i >= e.inicioParte2 && !e.parte2;
    b.title = bloqueado ? `Nivel ${i + 1} (bloqueado: necesitas el código de recarga)` : `Nivel ${i + 1}`;
    b.classList.toggle('actual', i === e.actual);
    b.classList.toggle('hecho', e.hechos.has(i));
    b.classList.toggle('bloqueado', bloqueado);
    b.onclick = () => ir(i);
    return b;
  };
  const separador = document.createElement('span');
  separador.className = `separador-partes${e.parte2 ? ' abierto' : ''}`;
  separador.textContent = e.parte2 ? '⚡' : '🔒';
  separador.title = e.parte2 ? 'Parte 2 desbloqueada' : 'La Parte 2 se desbloquea con el código de tu profe';

  const items: HTMLElement[] = [];
  for (let i = 0; i < e.total; i++) {
    if (i === e.inicioParte2) items.push(separador);
    items.push(boton(i));
  }
  dom.niveles.replaceChildren(...items);
}

/** Muestra la carga de la batería de BIT (0 a 5 rayitas). */
export function mostrarBateria(carga: number) {
  const segmentos = dom.bateria.querySelectorAll('i');
  segmentos.forEach((s, i) => s.classList.toggle('lleno', i < carga));
  dom.bateria.classList.toggle('baja', carga <= 1);
  dom.bateria.title = `Batería de BIT: ${carga * 20}%`;
}

export function mostrarContador(usados: number, ideal: number) {
  dom.contador.textContent = `Bloques: ${usados} · Ideal: ${ideal}`;
}

let avisoTimer = 0;
export function mostrarAviso(texto: string) {
  dom.aviso.textContent = texto;
  dom.aviso.hidden = false;
  clearTimeout(avisoTimer);
  avisoTimer = window.setTimeout(() => (dom.aviso.hidden = true), 2600);
}
export function ocultarAviso() {
  clearTimeout(avisoTimer);
  dom.aviso.hidden = true;
}

export interface BotonDialogo {
  texto: string;
  secundario?: boolean;
  accion: () => void;
}

export function mostrarDialogo(o: {
  tipo: 'gano' | 'perdio' | 'historia';
  icono: Node;
  titulo: string;
  texto: string;
  extra?: string;
  botones: BotonDialogo[];
}) {
  const caja = dom.dialogo.querySelector('.dialogo')!;
  caja.className = `dialogo ${o.tipo}`;
  $('dialogo-icono').replaceChildren(o.icono);
  $('dialogo-titulo').textContent = o.titulo;
  $('dialogo-texto').textContent = o.texto;
  $('dialogo-extra').textContent = o.extra ?? '';
  $('dialogo-botones').replaceChildren(
    ...o.botones.map((b) => {
      const el = document.createElement('button');
      el.className = `btn ${b.secundario ? 'btn-secundario' : 'btn-ejecutar'}`;
      el.textContent = b.texto;
      el.onclick = () => {
        cerrarDialogo();
        b.accion();
      };
      return el;
    }),
  );
  dom.dialogo.hidden = false;
  (dom.dialogo.querySelector('.dialogo-botones .btn:last-child') as HTMLElement | null)?.focus();
}

export function cerrarDialogo() {
  dom.dialogo.hidden = true;
}

// ---------------------------------------------------------------- pantallas

export function mostrarPantalla(cual: 'juego' | 'portada' | 'pausa' | 'final') {
  dom.portada.hidden = cual !== 'portada';
  dom.pausa.hidden = cual !== 'pausa';
  dom.final.hidden = cual !== 'final';
}

export function mostrarHeroes(retratos: HTMLCanvasElement[], nombres: string[], elegido: number, elegir: (n: number) => void) {
  dom.heroes.replaceChildren(
    ...retratos.map((r, i) => {
      const b = document.createElement('button');
      b.className = `heroe-carta${i === elegido ? ' elegido' : ''}`;
      b.title = nombres[i];
      b.setAttribute('aria-pressed', String(i === elegido));
      b.append(r);
      b.onclick = () => elegir(i);
      return b;
    }),
  );
}

export function mostrarPausa(o: { titulo: string; texto: string; bit: HTMLCanvasElement }) {
  dom.pausaTitulo.textContent = o.titulo;
  dom.pausaTexto.textContent = o.texto;
  dom.pausaBit.replaceChildren(o.bit);
  dom.clave.value = '';
  dom.claveError.hidden = true;
  mostrarPantalla('pausa');
  dom.clave.focus();
}

export function claveIncorrecta() {
  dom.claveError.hidden = false;
  dom.formClave.classList.remove('sacudir');
  void dom.formClave.offsetWidth; // reinicia la animación
  dom.formClave.classList.add('sacudir');
  dom.clave.select();
}
