import * as Blockly from 'blockly/core';
import * as Es from 'blockly/msg/es';
import type { Cmd, TipoBloque } from '../engine/types';
import { bloqueACmd, registrarBloques } from './definitions';

export interface PasoPrograma {
  cmd: Cmd;
  /** id del bloque de Blockly, para resaltarlo mientras se ejecuta. */
  id: string;
}

/** Tamaño de los bloques cuando la app mide 1920 px de ancho. */
const ESCALA_BASE = 1.15;

const TEMA = Blockly.Theme.defineTheme('cristal', {
  name: 'cristal',
  base: Blockly.Themes.Classic,
  componentStyles: {
    workspaceBackgroundColour: '#2B313D',
    flyoutBackgroundColour: '#232833',
    flyoutOpacity: 1,
    scrollbarColour: '#566074',
    scrollbarOpacity: 0.6,
    insertionMarkerColour: '#FFFFFF',
    insertionMarkerOpacity: 0.35,
    selectedGlowColour: '#F2C94C',
    selectedGlowOpacity: 0.6,
  },
  fontStyle: { family: 'Nunito, sans-serif', weight: '800', size: 13 },
});

/** Opciones del menú contextual que no aportan nada en este juego y pueden confundir. */
const MENU_QUITAR = [
  'blockComment', 'blockInline', 'blockCollapseExpand', 'blockDisable', 'blockHelp',
  'collapseWorkspace', 'expandWorkspace', 'blockNavigationHint', 'workspaceNavigationHint',
];

let localeListo = false;
function prepararBlockly() {
  if (localeListo) return;
  Blockly.setLocale(Es as unknown as Record<string, string>);
  registrarBloques();
  for (const id of MENU_QUITAR) {
    if (Blockly.ContextMenuRegistry.registry.getItem(id)) Blockly.ContextMenuRegistry.registry.unregister(id);
  }
  localeListo = true;
}

const toolbox = (bloques: TipoBloque[]) => ({
  kind: 'flyoutToolbox',
  contents: bloques.map((type) => ({ kind: 'block', type, gap: 18 })),
});

/** Envoltorio de Blockly: el resto de la app no toca la API de Blockly directamente. */
export class Editor {
  readonly ws: Blockly.WorkspaceSvg;

  constructor(div: HTMLElement, private readonly alCambiar: () => void) {
    prepararBlockly();
    this.ws = Blockly.inject(div, {
      toolbox: toolbox(['mover']),
      renderer: 'zelos',
      theme: TEMA,
      media: './blockly-media/',
      sounds: false,
      trashcan: false,
      comments: false,
      disable: false,
      collapse: false,
      maxInstances: { al_iniciar: 1 },
      move: { scrollbars: true, drag: true, wheel: true },
      zoom: { controls: false, wheel: false, startScale: ESCALA_BASE },
      grid: { spacing: 40, length: 3, colour: '#3A4252', snap: false },
    });
    // Los bloques sueltos (no conectados a "al iniciar") se ven deshabilitados y no se ejecutan.
    this.ws.addChangeListener(Blockly.Events.disableOrphans);
    this.ws.addChangeListener((e) => {
      if (!e.isUiEvent) this.alCambiar();
    });
    new ResizeObserver(() => Blockly.svgResize(this.ws)).observe(div);
  }

  /** Prepara el espacio de trabajo para un nivel: caja de bloques del nivel y solo "al iniciar". */
  cargarNivel(bloques: TipoBloque[]) {
    this.ws.updateToolbox(toolbox(bloques));
    this.ws.clear();
    const inicio = this.ws.newBlock('al_iniciar');
    inicio.setDeletable(false);
    inicio.initSvg();
    inicio.render();
    inicio.moveBy(30, 30);
    this.ws.scroll(0, 0);
    this.ws.clearUndo();
    this.alCambiar();
  }

  /** Borra todos los bloques menos "al iniciar". */
  borrarTodo() {
    Blockly.Events.setGroup(true);
    for (const b of this.ws.getTopBlocks(false)) {
      if (b.type === 'al_iniciar') b.getInputTargetBlock('DO')?.dispose(false);
      else b.dispose(false);
    }
    Blockly.Events.setGroup(false);
  }

  /** Reemplaza el programa por estos comandos (lo usan las pruebas automáticas). */
  ponerPrograma(cmds: Cmd[]) {
    let cadena: Blockly.serialization.blocks.State | undefined;
    for (const c of [...cmds].reverse()) {
      cadena = {
        type: c.op,
        ...('dir' in c ? { fields: { DIR: c.dir } } : {}),
        ...(cadena ? { next: { block: cadena } } : {}),
      };
    }
    const inicio = this.ws.getBlocksByType('al_iniciar', false)[0];
    inicio.getInputTargetBlock('DO')?.dispose(false);
    if (!cadena) return;
    const primero = Blockly.serialization.blocks.append(cadena, this.ws);
    inicio.getInput('DO')!.connection!.connect(primero.previousConnection!);
  }

  programa(): PasoPrograma[] {
    const inicio = this.ws.getBlocksByType('al_iniciar', false)[0];
    const pasos: PasoPrograma[] = [];
    for (let b = inicio?.getInputTargetBlock('DO'); b; b = b.getNextBlock()) {
      const cmd = bloqueACmd(b);
      if (cmd && b.isEnabled()) pasos.push({ cmd, id: b.id });
    }
    return pasos;
  }

  /** Resalta el bloque que se está ejecutando y desplaza la vista si quedó fuera. */
  resaltar(id: string | null) {
    this.ws.highlightBlock(id);
    const bloque = id ? this.ws.getBlockById(id) : null;
    if (bloque) this.ws.scrollBoundsIntoView(bloque.getBoundingRectangleWithoutChildren(), 40);
  }

  /** Ancho de la columna de bloques disponibles, en píxeles de pantalla. */
  anchoCajaBloques(): number {
    return this.ws.getFlyout()?.getWidth() ?? 0;
  }

  /** `u` = ancho real de la app / 1920. */
  escalar(u: number) {
    this.ws.setScale(ESCALA_BASE * u);
    Blockly.svgResize(this.ws);
  }
}
