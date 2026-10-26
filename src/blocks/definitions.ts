import * as Blockly from 'blockly/core';
import type { Cmd, TipoBloque } from '../engine/types';

export const COLOR_INICIO = '#5C9F38';
export const COLOR_BIT = '#D83B01';

const def = (json: object) => json;

// Bloques al estilo MakeCode / Minecraft Education.
const BLOQUES = [
  def({
    type: 'al_iniciar',
    message0: 'al iniciar %1 %2',
    args0: [{ type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }],
    colour: COLOR_INICIO,
  }),
  def({
    type: 'mover',
    message0: 'mover %1',
    args0: [{ type: 'field_dropdown', name: 'DIR', options: [['adelante', 'adelante'], ['atrás', 'atras']] }],
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_BIT,
  }),
  def({
    type: 'girar',
    message0: 'girar %1',
    args0: [{ type: 'field_dropdown', name: 'DIR', options: [['izquierda ⟲', 'izquierda'], ['derecha ⟳', 'derecha']] }],
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_BIT,
  }),
  ...(
    [
      ['romper', 'romper adelante'],
      ['colocar', 'colocar bloque adelante'],
      ['atacar', 'atacar adelante'],
      ['recoger', 'recoger'],
    ] as const
  ).map(([type, texto]) => def({
    type,
    message0: texto,
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_BIT,
  })),
];

let registrados = false;
export function registrarBloques() {
  if (registrados) return;
  Blockly.common.defineBlocksWithJsonArray(BLOQUES);
  registrados = true;
}

/** Traduce un bloque del espacio de trabajo a un comando del motor. */
export function bloqueACmd(block: Blockly.Block): Cmd | null {
  switch (block.type as TipoBloque) {
    case 'mover':
      return { op: 'mover', dir: block.getFieldValue('DIR') };
    case 'girar':
      return { op: 'girar', dir: block.getFieldValue('DIR') };
    case 'romper':
    case 'colocar':
    case 'atacar':
    case 'recoger':
      return { op: block.type } as Cmd;
    default:
      return null;
  }
}
