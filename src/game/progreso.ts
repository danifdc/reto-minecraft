/**
 * Progreso del alumno, guardado en el localStorage del navegador.
 * Si el navegador no permite guardar (modo privado, etc.), el juego funciona igual pero sin recordar nada.
 */

const CLAVE = 'cristal-del-amanecer:progreso';
const VERSION = 1;

export interface Progreso {
  version: number;
  /** Aspecto del héroe elegido (0 a 3). */
  aspecto: number;
  /** Último nivel abierto (índice). */
  nivel: number;
  /** Niveles ganados → cantidad de bloques de la mejor solución. */
  completados: Record<number, number>;
  /** Código armado en cada nivel (serialización de Blockly). */
  codigo: Record<number, object>;
  /** Se ingresó la contraseña de la Parte 2. */
  parte2: boolean;
  /** Ya se mostró la introducción de la historia. */
  prologo: boolean;
  /** Sonidos apagados. */
  silencio: boolean;
}

const nuevo = (): Progreso => ({
  version: VERSION, aspecto: 0, nivel: 0, completados: {}, codigo: {}, parte2: false, prologo: false, silencio: false,
});

export function cargarProgreso(): Progreso {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return nuevo();
    const datos = JSON.parse(crudo) as Partial<Progreso>;
    if (datos.version !== VERSION) return nuevo();
    return { ...nuevo(), ...datos };
  } catch {
    return nuevo();
  }
}

let pendiente = 0;
/** Guarda (agrupando cambios seguidos para no escribir en cada movimiento de un bloque). */
export function guardarProgreso(p: Progreso, inmediato = false) {
  const escribir = () => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(p));
    } catch {
      // Sin almacenamiento disponible: se sigue jugando sin guardar.
    }
  };
  clearTimeout(pendiente);
  if (inmediato) escribir();
  else pendiente = window.setTimeout(escribir, 300);
}

export function borrarProgreso(): Progreso {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Nada que hacer.
  }
  return nuevo();
}

/** Compara la contraseña ignorando mayúsculas, espacios y tildes. */
export function contrasenaCorrecta(texto: string, correcta: string): boolean {
  const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '').toLowerCase();
  return normal(texto) === normal(correcta);
}
