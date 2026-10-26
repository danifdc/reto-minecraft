import * as Phaser from 'phaser';
import type { Dir, GameEvent, Pos } from '../engine/types';
import type { World } from '../engine/world';
import type { Vista } from './arte/personajes';
import { ALTOS, COLORES_ROTURA, LIQUIDOS_ANIMADOS, fondoTema, sueloBajo } from './arte/terreno';
import { PX } from './pixel';
import {
  asegurarTema, crearTexturas, texAlto, texBit, texGrieta, texHeroe, texMeta, texSombri, texSuelo, variante,
} from './textures';

/** Tamaño lógico de una casilla en píxeles del escenario. */
const T = 64;
/** Escala de los píxeles del arte (16 px → 64). */
const S = T / PX;
/** Espacio arriba del tablero para que se vea lo que sobresale de la primera fila (vista 3/4). */
const MARGEN_SUP = 24;
export const ANCHO_JUEGO = 640;
export const ALTO_JUEGO = 640 + MARGEN_SUP;

/** Profundidad de dibujo: cada fila tapa a la anterior (vista 3/4). */
const PROF = {
  suelo: 0,
  sombraBloque: 1,
  brilloMeta: 2,
  fila: (y: number) => 10 + y * 10,
  alto: 1,
  objeto: 3,
  sombri: 4,
  heroe: 5,
  bit: 6,
  efecto: 10000,
};

type Img = Phaser.GameObjects.Image;
type Obj = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Depth;

interface Celda {
  suelo: Img;
  alto?: Img;
  /** Casilla que representa el alto (árbol, piedra...). */
  altoTile?: string;
  /** Sombra que proyecta el bloque sobre la casilla de abajo. */
  sombra?: Img;
}

const key = (p: Pos) => `${p.x},${p.y}`;

/** Un personaje: contenedor (posición en el suelo) con su sombra y el sprite que respira encima. */
class Personaje {
  readonly cont: Phaser.GameObjects.Container;
  readonly spr: Img;
  private vista: Vista = 'frente';
  private cuadro = 0;

  constructor(
    scene: Phaser.Scene,
    pie: Pos,
    private readonly textura: (v: Vista, f: number) => string,
    private readonly capa: number,
  ) {
    const sombra = scene.add.image(0, -2, 'sombra').setScale(S);
    this.spr = scene.add.image(0, 0, textura('frente', 0)).setOrigin(0.5, 1).setScale(S);
    this.cont = scene.add.container(pie.x, pie.y, [sombra, this.spr]);
  }

  fila(y: number) {
    this.cont.setDepth(PROF.fila(y) + this.capa);
  }

  mirar(dir: Dir) {
    this.vista = dir === 0 ? 'espalda' : dir === 2 ? 'frente' : 'lado';
    this.spr.setFlipX(dir === 3);
    this.actualizar();
  }

  paso(cuadro: number) {
    if (cuadro === this.cuadro) return;
    this.cuadro = cuadro;
    this.actualizar();
  }

  private actualizar() {
    this.spr.setTexture(this.textura(this.vista, this.cuadro));
  }
}

const dirEntre = (a: Pos, b: Pos): Dir => (b.x > a.x ? 1 : b.x < a.x ? 3 : b.y > a.y ? 2 : 0);

export class StageScene extends Phaser.Scene {
  private world!: World;
  private celdas: Celda[][] = [];
  private cosas = new Map<string, Img[]>();
  private bit!: Personaje;
  private heroe!: Personaje;
  private meta!: Img;
  /** Todo lo que pertenece al nivel actual (se destruye al redibujar). */
  private objetos: Phaser.GameObjects.GameObject[] = [];
  /** Resolutores de las animaciones en curso: al cancelar se resuelven todos para no dejar promesas colgadas. */
  private pendientes = new Set<() => void>();
  private cuadroAmbiente = 0;
  velocidad = 1;
  /** Aspecto del héroe elegido por el alumno (0 a 3). */
  aspecto = 0;

  constructor(private readonly alListo: () => void) {
    super('escenario');
  }

  create() {
    crearTexturas(this);
    this.alListo();
  }

  // ---------------------------------------------------------------- posiciones

  private centro(p: Pos) {
    return { x: p.x * T + T / 2, y: p.y * T + T / 2 };
  }

  /** Punto donde apoyan los pies de un personaje en la casilla. */
  private pie(p: Pos) {
    return { x: p.x * T + T / 2, y: (p.y + 1) * T - 8 };
  }

  private nuevo<O extends Obj>(o: O, prof: number): O {
    o.setDepth(prof);
    this.objetos.push(o);
    return o;
  }

  // ---------------------------------------------------------------- dibujo del nivel

  /** Dibuja el nivel desde cero en su estado actual. */
  mostrar(world: World) {
    this.cancelar();
    for (const o of this.objetos) o.destroy();
    this.objetos = [];
    this.cosas.clear();
    this.world = world;
    const tema = world.def.tema;
    asegurarTema(this, tema);

    this.celdas = world.tiles.map((fila, y) => fila.map((tile, x) => this.crearCelda({ x, y }, tile)));
    world.tiles.forEach((fila, y) => fila.forEach((_, x) => this.actualizarSombra({ x, y })));

    // Meta: brillo dorado en el suelo y bandera.
    const m = this.pie(world.meta);
    const brillo = this.nuevo(this.add.image(m.x, m.y - 6, 'brillo'), PROF.brilloMeta)
      .setScale(3.2, 1.6).setTint(0xf2c94c).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.8);
    const mc = this.centro(world.meta);
    const marco = this.nuevo(this.add.image(mc.x, mc.y, 'marco-meta').setScale(S), PROF.brilloMeta);
    this.tweens.add({ targets: [brillo, marco], alpha: 0.35, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.meta = this.nuevo(this.add.image(m.x - 8, m.y + 4, texMeta(0)).setOrigin(0.5, 1).setScale(S), PROF.fila(world.meta.y) + PROF.objeto);

    world.items.forEach((item, k) => {
      const [x, y] = k.split(',').map(Number);
      const c = this.centro({ x, y });
      const prof = PROF.fila(y) + PROF.objeto;
      const sombra = this.nuevo(this.add.image(c.x, c.y + 22, 'sombra').setScale(S * 0.7), prof - 0.5);
      const glow = this.nuevo(this.add.image(c.x, c.y - 4, 'brillo'), prof - 0.2)
        .setScale(2.4).setTint(item === 'chispa' ? 0xf2c94c : 0x4fd1c5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6);
      const img = this.nuevo(this.add.image(c.x, c.y - 4, item).setScale(S), prof);
      this.tweens.add({ targets: [img, glow], y: c.y - 14, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: glow, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });
      this.cosas.set(k, [img, glow, sombra]);
    });

    const tipoSombri = tema === 'volcan' ? 'fuego' : 'sombra';
    world.sombris.forEach((k) => {
      const [x, y] = k.split(',').map(Number);
      const c = this.centro({ x, y });
      const img = this.nuevo(this.add.image(c.x, (y + 1) * T - 4, texSombri(tipoSombri)).setOrigin(0.5, 1).setScale(S), PROF.fila(y) + PROF.sombri);
      this.tweens.add({ targets: img, scaleY: S * 0.88, scaleX: S * 1.06, duration: 520 + x * 13, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.cosas.set(k, [img]);
    });

    this.heroe = this.crearPersonaje(world.heroe, (v, f) => texHeroe(this.aspecto, v, f), PROF.heroe, 0);
    this.heroe.mirar(dirEntre(world.heroe, world.bit));
    this.bit = this.crearPersonaje(world.bit, texBit, PROF.bit, 300);
    this.bit.mirar(world.dir);

    // Agua, lava y bandera se animan con dos cuadros.
    this.time.addEvent({ delay: 450, loop: true, callback: () => this.animarAmbiente() });

    const cam = this.cameras.main;
    cam.setBackgroundColor(fondoTema(tema));
    cam.setZoom(Math.min(ANCHO_JUEGO / (world.ancho * T), (ALTO_JUEGO - MARGEN_SUP) / (world.alto * T)));
    cam.centerOn((world.ancho * T) / 2, (world.alto * T - MARGEN_SUP) / 2);
  }

  private crearCelda(p: Pos, tile: string): Celda {
    const tema = this.world.def.tema;
    const c = this.centro(p);
    const plano = ALTOS.has(tile) ? sueloBajo(tile, tema) : tile;
    const suelo = this.nuevo(this.add.image(c.x, c.y, texSuelo(tema, plano, variante(plano, p.x, p.y))).setScale(S), PROF.suelo);
    suelo.setData('tile', plano);
    const celda: Celda = { suelo };
    if (ALTOS.has(tile)) {
      celda.altoTile = tile;
      celda.alto =this.nuevo(this.add.image(c.x, (p.y + 1) * T, texAlto(tema, tile)).setOrigin(0.5, 1).setScale(S), PROF.fila(p.y) + PROF.alto);
    }
    return celda;
  }

  /** Sombra que un bloque alto proyecta sobre la casilla de abajo (si esa casilla es plana). */
  private actualizarSombra(p: Pos) {
    const celda = this.celdas[p.y][p.x];
    celda.sombra?.destroy();
    celda.sombra = undefined;
    const tile = this.world.tiles[p.y][p.x];
    const abajo = this.celdas[p.y + 1]?.[p.x];
    if (!celda.alto || tile === 'Z' || !abajo || abajo.alto) return;
    const c = this.centro(p);
    celda.sombra = this.nuevo(this.add.image(c.x, (p.y + 1) * T, 'sombra-bloque').setOrigin(0.5, 0).setScale(S), PROF.sombraBloque);
  }

  private crearPersonaje(p: Pos, textura: (v: Vista, f: number) => string, capa: number, desfase: number) {
    const pj = new Personaje(this, this.pie(p), textura, capa);
    pj.fila(p.y);
    this.objetos.push(pj.cont);
    // Respiración: sube y baja suavemente mientras espera.
    this.tweens.add({ targets: pj.spr, y: -4, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: desfase });
    return pj;
  }

  private animarAmbiente() {
    this.cuadroAmbiente = 1 - this.cuadroAmbiente;
    const tema = this.world.def.tema;
    for (const fila of this.celdas) {
      for (const { suelo } of fila) {
        const tile = suelo.getData('tile') as string;
        if (LIQUIDOS_ANIMADOS.has(tile)) suelo.setTexture(texSuelo(tema, tile, this.cuadroAmbiente));
      }
    }
    this.meta?.setTexture(texMeta(this.cuadroAmbiente));
  }

  private ponerSuelo(p: Pos, tile: string) {
    const suelo = this.celdas[p.y][p.x].suelo;
    suelo.setTexture(texSuelo(this.world.def.tema, tile, variante(tile, p.x, p.y)));
    suelo.setData('tile', tile);
  }

  // ---------------------------------------------------------------- control de animaciones

  /** Detiene todas las animaciones (al reiniciar). */
  cancelar() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    for (const fin of [...this.pendientes]) fin();
  }

  private tw(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((resolve) => {
      const fin = () => {
        this.pendientes.delete(fin);
        resolve();
      };
      this.pendientes.add(fin);
      this.tweens.add({ ...config, duration: (config.duration ?? 300) / this.velocidad, onComplete: fin });
    });
  }

  private esperar(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const fin = () => {
        this.pendientes.delete(fin);
        resolve();
      };
      this.pendientes.add(fin);
      this.time.delayedCall(ms / this.velocidad, fin);
    });
  }

  // ---------------------------------------------------------------- eventos

  async animar(eventos: GameEvent[]) {
    for (const e of eventos) await this.evento(e);
  }

  private async evento(e: GameEvent) {
    switch (e.t) {
      case 'move':
        this.polvo(e.from);
        await this.caminar(this.bit, e.from, e.to, 340);
        break;
      case 'turn':
        this.bit.mirar(e.to);
        await this.tw({ targets: this.bit.cont, y: this.bit.cont.y - 8, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
        break;
      case 'bump':
        await this.empujon(e.from, e.at, 0.32, () => {
          this.cameras.main.shake(180, 0.008);
          this.destello(e.at);
          this.mareo();
        });
        break;
      case 'edge': {
        const liquido = this.world.tiles[e.at.y][e.at.x];
        await this.empujon(e.from, e.at, 0.25, async () => {
          this.salpicar(e.at, liquido === '^' ? [0xf2a03d, 0xffd25c, 0x555555] : liquido === '~' ? [0x8fb4ff, 0xffffff, 0x3a6fd8] : [0x6b4a2b, 0x3a2a1a]);
          await this.tw({ targets: this.bit.spr, angle: 12, duration: 70, yoyo: true, repeat: 2 });
          this.bit.spr.setAngle(0);
        });
        break;
      }
      case 'tile':
        if (e.anim === 'break') await this.romper(e.at, e.tile);
        else if (e.anim === 'place') await this.colocar(e.at, e.tile);
        else await this.abrir(e.at, e.tile);
        break;
      case 'attack':
        await this.empujon(e.from, e.at, 0.42, async () => {
          this.tajo(e.from, e.at);
          if (e.hit) await this.vencerSombri(e.at);
        });
        break;
      case 'collect':
        await this.recoger(e.at, e.item === 'chispa' ? [0xf2c94c, 0xffffff] : [0x4fd1c5, 0xe6fffb]);
        break;
      case 'noop':
        await this.pregunta(e.at);
        break;
    }
  }

  /** Mueve un personaje una casilla alternando los cuadros de caminata. */
  private async caminar(pj: Personaje, from: Pos, to: Pos, duracion: number) {
    pj.fila(Math.max(from.y, to.y));
    const destino = this.pie(to);
    await this.tw({
      targets: pj.cont,
      x: destino.x,
      y: destino.y,
      duration: duracion,
      ease: 'Linear',
      onUpdate: (tween: Phaser.Tweens.Tween) => pj.paso(Math.floor(tween.progress * 4) % 2),
    });
    pj.paso(0);
    pj.fila(to.y);
  }

  /** BIT se inclina hacia `at` una fracción de casilla, ejecuta `enElGolpe` y vuelve. */
  private async empujon(from: Pos, at: Pos, fraccion: number, enElGolpe: () => void | Promise<void>) {
    const a = this.pie(from);
    const b = this.pie(at);
    await this.tw({
      targets: this.bit.cont, x: a.x + (b.x - a.x) * fraccion, y: a.y + (b.y - a.y) * fraccion, duration: 120, ease: 'Quad.easeOut',
    });
    await enElGolpe();
    await this.tw({ targets: this.bit.cont, x: a.x, y: a.y, duration: 160, ease: 'Quad.easeIn' });
  }

  private destello(p: Pos) {
    const celda = this.celdas[p.y]?.[p.x];
    const img = this.cosas.get(key(p))?.[0] ?? celda?.alto ?? celda?.suelo;
    if (!img) return;
    img.setTint(0xff6b6b);
    this.time.delayedCall(240, () => img.clearTint());
  }

  /** Estrellitas girando sobre la cabeza de BIT después de chocar. */
  private mareo() {
    const { x, y } = this.bit.cont;
    for (let i = 0; i < 3; i++) {
      const est = this.nuevo(this.add.image(x, y - 76, 'estrella').setScale(S), PROF.efecto);
      const fase = (i / 3) * Math.PI * 2;
      const obj = { t: 0 };
      this.tweens.add({
        targets: obj, t: 1, duration: 900,
        onUpdate: () => {
          const a = fase + obj.t * Math.PI * 4;
          est.setPosition(x + Math.cos(a) * 22, y - 76 + Math.sin(a) * 7).setAlpha(1 - obj.t * 0.8);
        },
        onComplete: () => est.destroy(),
      });
    }
  }

  private async romper(p: Pos, nuevo: string) {
    const celda = this.celdas[p.y][p.x];
    const { alto, altoTile } = celda;
    if (alto) {
      const grieta = this.nuevo(this.add.image(alto.x, alto.y, texGrieta(0)).setOrigin(0.5, 1).setScale(S), alto.depth + 0.1);
      for (let n = 0; n < 3; n++) {
        grieta.setTexture(texGrieta(n));
        await this.tw({ targets: [alto, grieta], x: alto.x + (n % 2 ? -4 : 4), duration: 60, yoyo: true });
      }
      grieta.destroy();
      alto.destroy();
      celda.alto = undefined;
    }
    this.particulas(p, COLORES_ROTURA[altoTile ?? ''] ?? [0xffffff], 18, 40);
    this.ponerSuelo(p, nuevo);
    this.actualizarSombra(p);
    if (p.y > 0) this.actualizarSombra({ x: p.x, y: p.y - 1 });
    await this.esperar(120);
  }

  private async colocar(p: Pos, nuevo: string) {
    const c = this.centro(p);
    const tema = this.world.def.tema;
    const liquido = this.celdas[p.y][p.x].suelo.getData('tile') as string;
    const bloque = this.nuevo(this.add.image(c.x, c.y - 48, texSuelo(tema, nuevo, 0)).setScale(S).setAlpha(0), PROF.fila(p.y) + PROF.alto);
    await this.tw({ targets: bloque, y: c.y, alpha: 1, duration: 240, ease: 'Quad.easeIn' });
    this.ponerSuelo(p, nuevo);
    bloque.destroy();
    this.salpicar(p, liquido === '^' ? [0xf2a03d, 0xffd25c] : liquido === '~' ? [0x8fb4ff, 0xffffff] : [0x9c7a4e, 0x6b4a2b]);
    this.cameras.main.shake(90, 0.003);
    await this.esperar(100);
  }

  private async abrir(p: Pos, nuevo: string) {
    const celda = this.celdas[p.y][p.x];
    const puerta = celda.alto;
    if (puerta) {
      await this.tw({ targets: puerta, scaleX: 0.4, alpha: 0, duration: 260, ease: 'Quad.easeIn' });
      puerta.destroy();
      celda.alto = undefined;
    }
    this.ponerSuelo(p, nuevo);
    this.actualizarSombra(p);
    if (p.y > 0) this.actualizarSombra({ x: p.x, y: p.y - 1 });
    this.particulas(p, [0xf2c94c, 0xffffff], 10, 30);
  }

  /** Media luna blanca en la casilla atacada, orientada según hacia dónde mira BIT. */
  private tajo(from: Pos, at: Pos) {
    const c = this.centro(at);
    const angulo = [0, 90, 180, 270][dirEntre(from, at)];
    const img = this.nuevo(this.add.image(c.x, c.y, 'tajo').setScale(S * 0.8).setAngle(angulo), PROF.efecto);
    this.tweens.add({ targets: img, scale: S * 1.3, alpha: 0, angle: angulo + 40, duration: 220, onComplete: () => img.destroy() });
  }

  private async vencerSombri(p: Pos) {
    const [img] = this.cosas.get(key(p)) ?? [];
    this.cosas.delete(key(p));
    if (!img) return;
    this.tweens.killTweensOf(img);
    img.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    await this.esperar(80);
    this.particulas(p, [0x4b2c78, 0x7a55b8, 0xff4fd8, 0x1a0f2a], 22, 46);
    await this.tw({ targets: img, scaleX: 0, scaleY: S * 1.4, alpha: 0, duration: 220, ease: 'Back.easeIn' });
    img.destroy();
  }

  private async recoger(p: Pos, colores: number[]) {
    const objs = this.cosas.get(key(p)) ?? [];
    this.cosas.delete(key(p));
    const [img, ...resto] = objs;
    resto.forEach((o) => o.destroy());
    if (!img) return;
    this.tweens.killTweensOf(img);
    this.particulas(p, colores, 14, 36);
    await this.tw({ targets: img, y: img.y - 56, scale: S * 1.5, alpha: 0, angle: 180, duration: 420, ease: 'Sine.easeOut' });
    img.destroy();
  }

  private async pregunta(p: Pos) {
    const c = this.pie(p);
    const globo = this.nuevo(this.add.image(c.x + 26, c.y - 84, 'duda').setOrigin(0.3, 1).setScale(0), PROF.efecto);
    await this.tw({ targets: globo, scale: S * 0.9, duration: 160, ease: 'Back.easeOut' });
    await this.tw({ targets: globo, angle: 8, duration: 120, yoyo: true, repeat: 1 });
    await this.tw({ targets: globo, alpha: 0, y: globo.y - 12, duration: 300, delay: 250 });
    globo.destroy();
  }

  // ---------------------------------------------------------------- partículas

  private particulas(p: Pos, colores: number[], n: number, alcance: number) {
    const c = this.centro(p);
    for (let i = 0; i < n; i++) {
      const tam = 3 + Math.random() * 4;
      const pt = this.nuevo(this.add.image(c.x, c.y, 'px').setTint(colores[i % colores.length]).setScale(tam), PROF.efecto);
      const ang = Math.random() * Math.PI * 2;
      const d = alcance * (0.5 + Math.random() * 0.6);
      this.tweens.add({
        targets: pt,
        x: c.x + Math.cos(ang) * d,
        y: c.y + Math.sin(ang) * d - 10,
        alpha: 0,
        scale: tam * 0.5,
        duration: (380 + Math.random() * 260) / this.velocidad,
        ease: 'Quad.easeOut',
        onComplete: () => pt.destroy(),
      });
    }
  }

  /** Gotas que saltan hacia arriba y caen (agua, lava). */
  private salpicar(p: Pos, colores: number[]) {
    const c = this.centro(p);
    for (let i = 0; i < 12; i++) {
      const pt = this.nuevo(this.add.image(c.x + (Math.random() - 0.5) * 40, c.y, 'px').setTint(colores[i % colores.length]).setScale(4), PROF.efecto);
      const alto = 30 + Math.random() * 30;
      this.tweens.add({ targets: pt, y: pt.y - alto, duration: 220, ease: 'Quad.easeOut', yoyo: true, onComplete: () => pt.destroy() });
      this.tweens.add({ targets: pt, x: pt.x + (Math.random() - 0.5) * 30, alpha: 0, duration: 440 });
    }
  }

  /** Nubecita de polvo detrás de un personaje al empezar a caminar. */
  private polvo(p: Pos) {
    const c = this.pie(p);
    for (let i = 0; i < 4; i++) {
      const pt = this.nuevo(this.add.image(c.x + (i - 1.5) * 10, c.y - 4, 'px').setTint(0xd8d0c0).setScale(4).setAlpha(0.7), PROF.fila(p.y));
      this.tweens.add({ targets: pt, y: pt.y - 10, scale: 7, alpha: 0, duration: 380, onComplete: () => pt.destroy() });
    }
  }

  private confeti() {
    const colores = [0xf2c94c, 0x4fd1c5, 0xe8574a, 0x5dbb3f, 0x8fb4ff, 0xffffff];
    const cam = this.cameras.main;
    const v = cam.worldView;
    for (let i = 0; i < 70; i++) {
      const x = v.x + Math.random() * v.width;
      const pt = this.nuevo(this.add.image(x, v.y - 20 - Math.random() * 120, 'px').setTint(colores[i % colores.length]).setScale(4, 6), PROF.efecto);
      this.tweens.add({
        targets: pt,
        y: v.y + v.height * (0.6 + Math.random() * 0.5),
        x: x + (Math.random() - 0.5) * 120,
        angle: Math.random() * 720,
        alpha: 0,
        duration: 1600 + Math.random() * 1000,
        ease: 'Sine.easeIn',
        onComplete: () => pt.destroy(),
      });
    }
  }

  // ---------------------------------------------------------------- victoria

  /** El héroe recorre el camino de BIT y ambos festejan. */
  async celebrar() {
    const camino = [this.world.heroe, ...this.world.recorrido];
    // El héroe se detiene una casilla antes que BIT para no quedar encima.
    for (let i = 1; i < camino.length - 1; i++) {
      this.heroe.mirar(dirEntre(camino[i - 1], camino[i]));
      await this.caminar(this.heroe, camino[i - 1], camino[i], 200);
    }
    this.heroe.mirar(2);
    this.bit.mirar(2);
    this.confeti();
    await this.tw({ targets: [this.heroe.cont, this.bit.cont], y: '-=18', duration: 170, yoyo: true, repeat: 2, ease: 'Quad.easeOut' });
  }
}

/** Crea el juego de Phaser dentro de `parent` y espera a que la escena esté lista. */
export function crearEscenario(parent: HTMLElement): Promise<StageScene> {
  return new Promise((resolve) => {
    const scene: StageScene = new StageScene(() => resolve(scene));
    new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: ANCHO_JUEGO,
      height: ALTO_JUEGO,
      pixelArt: true,
      backgroundColor: '#1E222B',
      banner: false,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene,
    });
  });
}
