/** Acceso al DOM de la interfaz. El controlador del juego solo habla con la UI a través de este módulo. */

const $ = <T extends HTMLElement = HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Falta #${id} en index.html`);
  return el as T;
};

export const dom = {
  app: $('app'),
  niveles: $('niveles'),
  misionIcono: $('mision-icono'),
  misionChip: $('mision-chip'),
  misionTexto: $('mision-texto'),
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
};

export type Modo = 'editar' | 'auto' | 'pasos' | 'fin';

export function mostrarModo(modo: Modo, pasoOcupado = false) {
  const editando = modo === 'editar';
  dom.btnEjecutar.textContent = editando ? '▶ Ejecutar' : '↺ Reiniciar';
  dom.btnEjecutar.classList.toggle('reiniciar', !editando);
  dom.btnPaso.disabled = modo === 'auto' || modo === 'fin' || pasoOcupado;
  dom.btnBorrar.disabled = !editando;
  dom.bloqueo.hidden = editando;
  dom.candado.hidden = editando;
  dom.contador.hidden = !editando;
}

export function mostrarMision(numero: number, titulo: string, texto: string) {
  dom.misionChip.textContent = `${numero}. ${titulo}`;
  dom.misionTexto.textContent = texto;
}

export function mostrarNiveles(total: number, actual: number, hechos: Set<number>, ir: (n: number) => void) {
  dom.niveles.replaceChildren(
    ...Array.from({ length: total }, (_, i) => {
      const b = document.createElement('button');
      b.className = 'nivel-btn';
      b.textContent = String(i + 1);
      b.title = `Nivel ${i + 1}`;
      b.classList.toggle('actual', i === actual);
      b.classList.toggle('hecho', hechos.has(i));
      b.onclick = () => ir(i);
      return b;
    }),
  );
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
  tipo: 'gano' | 'perdio';
  icono: string;
  titulo: string;
  texto: string;
  extra?: string;
  botones: BotonDialogo[];
}) {
  const caja = dom.dialogo.querySelector('.dialogo')!;
  caja.className = `dialogo ${o.tipo}`;
  $('dialogo-icono').textContent = o.icono;
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
}

export function cerrarDialogo() {
  dom.dialogo.hidden = true;
}
