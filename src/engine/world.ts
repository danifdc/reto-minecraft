import {
  BORDE, PLACA, PUENTE, PUERTA_ABIERTA, PUERTA_CERRADA, info, sueloDebajo,
} from './tiles';
import {
  DIR_POR_NOMBRE, DX, DY,
  type Cmd, type Dir, type GameEvent, type Item, type LevelDef, type Pos, type Resultado, type StepResult,
} from './types';

const ITEM_POR_CHAR: Record<string, Item> = { '*': 'chispa', F: 'fragmento' };
const NOMBRE_ITEM: Record<Item, [string, string]> = {
  chispa: ['la chispa', 'las chispas'],
  fragmento: ['el fragmento', 'los fragmentos'],
};

const key = (p: Pos) => `${p.x},${p.y}`;

/** Estado de un nivel en juego. No sabe nada de gráficos: la escena anima los eventos que devuelve. */
export class World {
  readonly ancho: number;
  readonly alto: number;
  readonly tiles: string[][];
  readonly items = new Map<string, Item>();
  readonly sombris = new Set<string>();
  readonly meta: Pos;
  readonly heroe: Pos;
  bit: Pos;
  dir: Dir;
  /** Casillas que pisó BIT, en orden, empezando por la inicial. El héroe repite este recorrido al ganar. */
  readonly recorrido: Pos[];
  private readonly itemsIniciales: Record<Item, number> = { chispa: 0, fragmento: 0 };

  constructor(readonly def: LevelDef) {
    const { terreno, objetos } = def;
    this.alto = terreno.length;
    this.ancho = terreno[0].length;
    if (objetos.length !== this.alto) throw new Error(`"${def.titulo}": objetos y terreno tienen distinta cantidad de filas`);

    this.tiles = terreno.map((fila, y) => {
      if (fila.length !== this.ancho) throw new Error(`"${def.titulo}": la fila ${y} del terreno tiene otro largo`);
      return [...fila].map((c) => (info(c), c));
    });

    let bit: Pos | null = null;
    let meta: Pos | null = null;
    let heroe: Pos | null = null;
    objetos.forEach((fila, y) => {
      if (fila.length !== this.ancho) throw new Error(`"${def.titulo}": la fila ${y} de objetos tiene otro largo`);
      [...fila].forEach((c, x) => {
        const p = { x, y };
        if (c === 'B') bit = p;
        else if (c === 'G') meta = p;
        else if (c === 'H') heroe = p;
        else if (c === 'S') this.sombris.add(key(p));
        else if (ITEM_POR_CHAR[c]) {
          this.items.set(key(p), ITEM_POR_CHAR[c]);
          this.itemsIniciales[ITEM_POR_CHAR[c]]++;
        } else if (c !== '.') throw new Error(`"${def.titulo}": objeto desconocido "${c}"`);
      });
    });
    if (!bit || !meta || !heroe) throw new Error(`"${def.titulo}": faltan B, G o H en objetos`);
    this.bit = bit;
    this.meta = meta;
    this.heroe = heroe;
    this.dir = DIR_POR_NOMBRE[def.mira];
    this.recorrido = [{ ...this.bit }];
  }

  /** Copia independiente del estado (la usa el resolvedor para explorar programas). */
  clonar(): World {
    const w = Object.create(World.prototype) as World;
    return Object.assign(w, {
      def: this.def,
      ancho: this.ancho,
      alto: this.alto,
      tiles: this.tiles.map((f) => [...f]),
      items: new Map(this.items),
      sombris: new Set(this.sombris),
      meta: this.meta,
      heroe: this.heroe,
      bit: { ...this.bit },
      dir: this.dir,
      recorrido: [...this.recorrido],
      itemsIniciales: this.itemsIniciales,
    });
  }

  /** Clave que identifica el estado del juego (sin el recorrido). */
  clave(): string {
    return `${this.bit.x},${this.bit.y},${this.dir}|${this.tiles.map((f) => f.join('')).join('')}|${[...this.items.keys()].sort()}|${[...this.sombris].sort()}`;
  }

  /** Las 4 casillas de alrededor de p. */
  vecinos(p: Pos): string[] {
    return [0, 1, 2, 3].map((d) => this.tile({ x: p.x + DX[d], y: p.y + DY[d] }));
  }

  tile(p: Pos): string {
    if (p.x < 0 || p.y < 0 || p.x >= this.ancho || p.y >= this.alto) return BORDE;
    return this.tiles[p.y][p.x];
  }

  adelante(dir: Dir = this.dir): Pos {
    return { x: this.bit.x + DX[dir], y: this.bit.y + DY[dir] };
  }

  exec(cmd: Cmd): StepResult {
    switch (cmd.op) {
      case 'mover':
        return this.mover(cmd.dir === 'adelante' ? this.dir : (((this.dir + 2) % 4) as Dir));
      case 'girar': {
        const from = this.dir;
        this.dir = ((this.dir + (cmd.dir === 'derecha' ? 1 : 3)) % 4) as Dir;
        return { events: [{ t: 'turn', from, to: this.dir }] };
      }
      case 'romper':
        return this.romper();
      case 'colocar':
        return this.colocar();
      case 'atacar':
        return this.atacar();
      case 'recoger':
        return this.recoger();
    }
  }

  private mover(dir: Dir): StepResult {
    const from = { ...this.bit };
    const at = this.adelante(dir);
    const tile = this.tile(at);
    const { clase, nombre } = info(tile);

    if (this.sombris.has(key(at))) {
      return { events: [{ t: 'bump', from, at }], fallo: '¡Un Sombri bloquea el camino! BIT no puede pasar.' };
    }
    if (clase === 'solido' || clase === 'rompible') {
      const extra = clase === 'rompible' ? ' Podrías romperlo primero.' : '';
      return { events: [{ t: 'bump', from, at }], fallo: `¡Ups! BIT chocó con ${nombre}.${extra}` };
    }
    if (clase === 'liquido') {
      return { events: [{ t: 'edge', from, at }], fallo: `¡Cuidado! BIT no puede entrar en ${nombre}.` };
    }

    this.bit = at;
    this.recorrido.push({ ...at });
    const events: GameEvent[] = [{ t: 'move', from, to: at }];
    if (tile === PLACA) events.push(...this.abrirPuertas());
    return { events };
  }

  private abrirPuertas(): GameEvent[] {
    const events: GameEvent[] = [];
    this.tiles.forEach((fila, y) => fila.forEach((c, x) => {
      if (c === PUERTA_CERRADA) {
        fila[x] = PUERTA_ABIERTA;
        events.push({ t: 'tile', at: { x, y }, tile: PUERTA_ABIERTA, anim: 'open' });
      }
    }));
    return events;
  }

  private romper(): StepResult {
    const at = this.adelante();
    const t = info(this.tile(at));
    if (t.clase !== 'rompible' || !t.alRomper) {
      return { events: [{ t: 'noop', at: this.bit }], aviso: 'No hay nada para romper adelante de BIT.' };
    }
    const nuevo = sueloDebajo(this.tile(at), this.vecinos(at)) ?? t.alRomper;
    this.tiles[at.y][at.x] = nuevo;
    return { events: [{ t: 'tile', at, tile: nuevo, anim: 'break' }] };
  }

  private colocar(): StepResult {
    const at = this.adelante();
    if (info(this.tile(at)).clase !== 'liquido') {
      return { events: [{ t: 'noop', at: this.bit }], aviso: 'Ahí no hace falta un bloque: no hay agua, lava ni hoyo.' };
    }
    this.tiles[at.y][at.x] = PUENTE;
    return { events: [{ t: 'tile', at, tile: PUENTE, anim: 'place' }] };
  }

  private atacar(): StepResult {
    const from = { ...this.bit };
    const at = this.adelante();
    const hit = this.sombris.delete(key(at));
    return {
      events: [{ t: 'attack', from, at, hit }],
      aviso: hit ? undefined : 'No hay ningún Sombri adelante de BIT.',
    };
  }

  private recoger(): StepResult {
    const item = this.items.get(key(this.bit));
    if (!item) return { events: [{ t: 'noop', at: this.bit }], aviso: 'Aquí no hay nada para recoger.' };
    this.items.delete(key(this.bit));
    return { events: [{ t: 'collect', at: { ...this.bit }, item }] };
  }

  /** Se evalúa al terminar el programa. */
  resultado(): Resultado {
    const enMeta = this.bit.x === this.meta.x && this.bit.y === this.meta.y;
    const faltan = (['fragmento', 'chispa'] as Item[]).filter((it) => [...this.items.values()].includes(it));

    if (!enMeta) {
      return { gano: false, mensaje: 'BIT no llegó a la meta. ¡Revisa tu código y vuelve a intentarlo!' };
    }
    if (faltan.length > 0) {
      const it = faltan[0];
      const nombre = this.itemsIniciales[it] > 1 ? NOMBRE_ITEM[it][1] : NOMBRE_ITEM[it][0];
      return { gano: false, mensaje: `BIT llegó a la meta, pero te faltó recoger ${nombre}.` };
    }
    return { gano: true, mensaje: '¡Misión cumplida!' };
  }
}
