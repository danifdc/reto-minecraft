import type { LevelDef } from '../engine/types';
import { NIVELES_PRUEBA } from './prueba';

// Mientras se diseñan los 20 niveles (Fase 4) se usan los de prueba: 2 en la parte 1 y 1 en la parte 2.
export const PARTE1: LevelDef[] = NIVELES_PRUEBA.slice(0, 2);
export const PARTE2: LevelDef[] = NIVELES_PRUEBA.slice(2);

export const NIVELES: LevelDef[] = [...PARTE1, ...PARTE2];
/** Índice del primer nivel de la parte 2 (bloqueada hasta ingresar la contraseña). */
export const INICIO_PARTE2 = PARTE1.length;

/** Contraseña que da el profesor para desbloquear la parte 2. */
export const CONTRASENA_PARTE2 = 'recargar';
