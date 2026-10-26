import * as Phaser from 'phaser';
import type { GameEvent, Pos } from '../engine/types';
import type { World } from '../engine/world';
import { PX } from './pixel';
import { COLOR_PARTICULA, crearTexturas, texTile } from './textures';

/** Tamaño lógico de una casilla en píxeles del escenario. */
const T = 64;
/** Escala de los sprites de 16 px para llenar una casilla. */
const S = T / PX;
/** Tamaño lógico del lienzo de Phaser (tablero de 10×10). */
export const LADO = 640;

const PROF = { suelo: 0, meta: 1, cosa: 2, heroe: 3, bit: 4, efecto: 10 };

type Img = Phaser.GameObjects.Image;

const key = (p: Pos) => `${p.x},${p.y}`;

export class StageScene extends Phaser.Scene {
  private world!: World;
  private tablero!: Phaser.GameObjects.Container;
  private suelo: Img[][] = [];
  private cosas = new Map<string, Img>();
  private bit!: Img;
  private heroe!: Img;
  /** Resolutores de las animaciones en curso: al cancelar se resuelven todos para no dejar promesas colgadas. */
  private pendientes = new Set<() => void>();
  velocidad = 1;

  constructor(private readonly alListo: () => void) {
    super('escenario');
  }

  create() {
    crearTexturas(this);
    this.alListo();
  }

  private centro(p: Pos) {
    return { x: p.x * T + T / 2, y: p.y * T + T / 2 };
  }

  private imagen(p: Pos, textura: string, prof: number): Img {
    const c = this.centro(p);
    const img = this.add.image(c.x, c.y, textura).setScale(S).setDepth(prof);
    this.tablero.add(img);
    return img;
  }

  /** Dibuja el nivel desde cero en su estado actual. */
  mostrar(world: World) {
    this.cancelar();
    this.tablero?.destroy();
    this.tablero = this.add.container(0, 0);
    this.world = world;
    this.cosas.clear();

    this.suelo = world.tiles.map((fila, y) => fila.map((tile, x) => this.imagen({ x, y }, texTile(tile), PROF.suelo)));

    const meta = this.centro(world.meta);
    const brillo = this.add.rectangle(meta.x, meta.y, T - 6, T - 6).setStrokeStyle(5, 0xf2c94c).setDepth(PROF.meta);
    this.tablero.add(brillo);
    this.tweens.add({ targets: brillo, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });
    this.imagen(world.meta, 'meta', PROF.meta);

    world.items.forEach((item, k) => {
      const [x, y] = k.split(',').map(Number);
      const img = this.imagen({ x, y }, item, PROF.cosa);
      this.tweens.add({ targets: img, y: img.y - 4, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.cosas.set(k, img);
    });
    world.sombris.forEach((k) => {
      const [x, y] = k.split(',').map(Number);
      const img = this.imagen({ x, y }, 'sombri', PROF.cosa);
      this.tweens.add({ targets: img, scaleY: S * 0.9, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.cosas.set(k, img);
    });

    this.heroe = this.imagen(world.heroe, 'heroe', PROF.heroe);
    this.bit = this.imagen(world.bit, 'bit', PROF.bit).setAngle(world.dir * 90);

    const cam = this.cameras.main;
    cam.setZoom(Math.min(LADO / (world.ancho * T), LADO / (world.alto * T)));
    cam.centerOn((world.ancho * T) / 2, (world.alto * T) / 2);
  }

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

  async animar(eventos: GameEvent[]) {
    for (const e of eventos) await this.evento(e);
  }

  private async evento(e: GameEvent) {
    switch (e.t) {
      case 'move': {
        const c = this.centro(e.to);
        await this.tw({ targets: this.bit, x: c.x, y: c.y, duration: 320, ease: 'Sine.easeInOut' });
        break;
      }
      case 'turn': {
        const delta = (e.to - e.from + 4) % 4 === 1 ? 90 : -90;
        await this.tw({ targets: this.bit, angle: this.bit.angle + delta, duration: 240, ease: 'Sine.easeInOut' });
        break;
      }
      case 'bump': {
        await this.empujon(e.from, e.at, 0.3, () => {
          this.cameras.main.shake(160, 0.008);
          this.destello(e.at);
        });
        break;
      }
      case 'edge': {
        await this.empujon(e.from, e.at, 0.22, async () => {
          await this.tw({ targets: this.bit, angle: this.bit.angle + 12, duration: 70, yoyo: true, repeat: 2 });
        });
        break;
      }
      case 'tile':
        await this.cambiarCasilla(e.at, e.tile, e.anim);
        break;
      case 'attack': {
        await this.empujon(e.from, e.at, 0.4, async () => {
          if (!e.hit) return;
          const img = this.cosas.get(key(e.at));
          this.cosas.delete(key(e.at));
          if (!img) return;
          this.tweens.killTweensOf(img);
          img.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
          this.particulas(e.at, 0x6e48a8, 14);
          await this.tw({ targets: img, scale: 0, alpha: 0, angle: 90, duration: 260 });
          img.destroy();
        });
        break;
      }
      case 'collect': {
        const img = this.cosas.get(key(e.at));
        this.cosas.delete(key(e.at));
        if (!img) break;
        this.tweens.killTweensOf(img);
        this.particulas(e.at, e.item === 'chispa' ? 0xf2c94c : 0x4fd1c5, 12);
        await this.tw({ targets: img, y: img.y - 40, scale: S * 1.4, alpha: 0, duration: 380, ease: 'Sine.easeOut' });
        img.destroy();
        break;
      }
      case 'noop': {
        const c = this.centro(e.at);
        const txt = this.add.text(c.x, c.y - T * 0.6, '?', {
          fontFamily: 'Nunito, sans-serif', fontSize: '44px', fontStyle: '900', color: '#FFFFFF', stroke: '#1E222B', strokeThickness: 8,
        }).setOrigin(0.5).setDepth(PROF.efecto);
        this.tablero.add(txt);
        await this.tw({ targets: txt, y: txt.y - 24, alpha: 0, duration: 650, ease: 'Sine.easeOut' });
        txt.destroy();
        break;
      }
    }
  }

  /** BIT se inclina hacia `at` una fracción de casilla, ejecuta `enElGolpe` y vuelve. */
  private async empujon(from: Pos, at: Pos, fraccion: number, enElGolpe: () => void | Promise<void>) {
    const a = this.centro(from);
    const b = this.centro(at);
    await this.tw({
      targets: this.bit, x: a.x + (b.x - a.x) * fraccion, y: a.y + (b.y - a.y) * fraccion, duration: 120, ease: 'Quad.easeOut',
    });
    await enElGolpe();
    await this.tw({ targets: this.bit, x: a.x, y: a.y, duration: 160, ease: 'Quad.easeIn' });
  }

  private destello(p: Pos) {
    const img = this.suelo[p.y]?.[p.x];
    if (!img) return;
    img.setTint(0xff6b6b);
    this.time.delayedCall(220, () => img.clearTint());
  }

  private async cambiarCasilla(p: Pos, tile: string, anim: 'break' | 'place' | 'open') {
    const img = this.suelo[p.y][p.x];
    const antes = img.texture.key.slice(2);
    if (anim === 'break') {
      await this.tw({ targets: img, x: img.x + 4, duration: 40, yoyo: true, repeat: 3 });
      this.particulas(p, COLOR_PARTICULA[antes] ?? 0xffffff, 16);
      img.setTexture(texTile(tile));
      await this.esperar(120);
    } else if (anim === 'place') {
      img.setTexture(texTile(tile)).setScale(S * 1.35).setAlpha(0.2);
      await this.tw({ targets: img, scale: S, alpha: 1, duration: 260, ease: 'Back.easeOut' });
    } else {
      img.setTexture(texTile(tile));
      await this.tw({ targets: img, scale: S * 1.1, duration: 120, yoyo: true });
    }
  }

  private particulas(p: Pos, color: number, n: number) {
    const c = this.centro(p);
    for (let i = 0; i < n; i++) {
      const pt = this.add.image(c.x, c.y, 'px').setTint(color).setScale(3 + Math.random() * 3).setDepth(PROF.efecto);
      this.tablero.add(pt);
      const ang = Math.random() * Math.PI * 2;
      const d = 18 + Math.random() * 28;
      this.tweens.add({
        targets: pt, x: c.x + Math.cos(ang) * d, y: c.y + Math.sin(ang) * d, alpha: 0,
        duration: (380 + Math.random() * 200) / this.velocidad, ease: 'Quad.easeOut',
        onComplete: () => pt.destroy(),
      });
    }
  }

  /** El héroe recorre el camino de BIT y ambos festejan. */
  async celebrar() {
    const camino = [this.world.heroe, ...this.world.recorrido];
    // El héroe se detiene una casilla antes que BIT para no quedar encima.
    for (let i = 1; i < camino.length - 1; i++) {
      const c = this.centro(camino[i]);
      await this.tw({ targets: this.heroe, x: c.x, y: c.y, duration: 170 });
    }
    await this.tw({ targets: [this.heroe, this.bit], y: '-=14', duration: 160, yoyo: true, repeat: 2, ease: 'Quad.easeOut' });
  }
}

/** Crea el juego de Phaser dentro de `parent` y espera a que la escena esté lista. */
export function crearEscenario(parent: HTMLElement): Promise<StageScene> {
  return new Promise((resolve) => {
    const scene: StageScene = new StageScene(() => resolve(scene));
    new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: LADO,
      height: LADO,
      pixelArt: true,
      backgroundColor: '#1E222B',
      banner: false,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene,
    });
  });
}
