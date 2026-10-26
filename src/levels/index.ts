import type { LevelDef } from '../engine/types';
import { PARTE1 } from './parte1';
import { PARTE2 } from './parte2';

export { PARTE1, PARTE2 };

export const NIVELES: LevelDef[] = [...PARTE1, ...PARTE2];
/** Índice del primer nivel de la parte 2 (bloqueada hasta ingresar la contraseña). */
export const INICIO_PARTE2 = PARTE1.length;

/** Contraseña que da el profesor para desbloquear la parte 2. */
export const CONTRASENA_PARTE2 = 'recargar';
