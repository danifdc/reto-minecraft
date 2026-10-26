# El Cristal del Amanecer

Juego web de programación por bloques (solo secuencias) para niños de 8 a 11 años, en español latinoamericano.
El plan completo (historia, 20 niveles, reglas de progresión, fases) está en `docs/PLAN.md`: léelo antes de cambiar niveles o mecánicas. Regla clave: máximo 1 bloque nuevo por nivel.
Nadie del equipo edita el código a mano: todos los cambios los hace Claude.

## Comandos
- `npm run dev`: servidor en http://localhost:5173
- `npm test`: tests del motor (vitest). Cada nivel debe ganar con su `solucion` y `ideal` debe coincidir.
- `npm run build`: chequeo de tipos y build en `dist/` (base relativa, lista para GitHub Pages).
- `node scripts/captura.mjs <url> <carpeta> [ancho] [alto]`: abre Chrome headless, ejecuta los pasos de la variable de entorno `PASOS` (JSON: eval, click, arrastrar, esperar, texto, foto) y guarda capturas. Úsalo para verificar cambios visuales. En dev existe `window.__debug` (cargar(n), ponerSolucion(n), ponerTexto("adelante der ..."), galeria(tema), sprites(), aspecto(n), editor, juego, escena). Para fotografiar solo el escenario usa {"foto":"x","clip":".escenario-marco"}.

## Stack (versiones nuevas: verificar APIs en node_modules antes de usarlas)
- **Vite 8 + TypeScript 7**, **Blockly 13** (`blockly/core`, renderer zelos, locale `blockly/msg/es`) y **Phaser 4**.
- Phaser 4 no tiene `generateTexture` ni `TextureManager.generate`: las texturas se dibujan en un `<canvas>` y se registran con `textures.addCanvas`. Las guías oficiales están en `node_modules/phaser/skills/*/SKILL.md`.
- Los medios de Blockly están copiados en `public/blockly-media/`.

## Arquitectura (`src/`)
- `engine/`: lógica pura, sin DOM.
  - `World.exec(cmd)` devuelve `{ events, fallo?, aviso? }`; `World.resultado()` se evalúa al terminar el programa.
  - `tiles.ts` tiene la leyenda de caracteres del mapa y la clase de cada casilla (suelo, sólido, rompible o líquido).
- `levels/`: datos de niveles (`LevelDef`), con dos capas del mismo tamaño: `terreno` y `objetos` (B=BIT, H=héroe, G=meta, *=chispa, F=fragmento, S=Sombri).
  - El héroe debe empezar al lado de BIT, preferentemente detrás y en la misma fila. Si queda justo arriba o abajo de BIT, los sprites se superponen por la vista 3/4.
  - `galeria.ts` es un mapa con todo el arte (solo dev: `__debug.galeria('volcan')`).
- `blocks/`: definición de bloques y `Editor`, que envuelve Blockly. El resto de la app no usa Blockly directamente.
- `scene/`: Phaser en **vista 3/4**.
  - Cada casilla tiene un suelo plano de 16×16 y, si es alta (`ALTOS` en `arte/terreno.ts`), un "alto" de 16×20 apoyado en la base que sobresale 4 px hacia arriba y proyecta sombra sobre la casilla de abajo.
  - La profundidad va por fila (`PROF.fila(y)`): lo de más abajo tapa a lo de arriba.
  - `arte/personajes.ts`: sprites como filas de caracteres más una paleta. BIT y el héroe tienen 3 vistas (frente, espalda, lado) × 2 cuadros de caminata; izquierda es `lado` con `flipX`. Hay 4 aspectos de héroe (`ASPECTOS`; `StageScene.aspecto` elige cuál).
  - `arte/terreno.ts`: pintores por casilla y por tema (`Tema`: aldea, bosque, rio, cueva, mina, volcan, torre). En el volcán el Sombri es de fuego.
  - `textures.ts`: registra las texturas con `addCanvas`. Las del terreno se generan por tema la primera vez que se usa.
  - `StageScene`:
    - `mostrar(world)` redibuja todo.
    - `animar(events)` anima los eventos.
    - `celebrar()` hace que el héroe recorra `world.recorrido`, con confeti.
  - `visor.ts` (solo dev: `__debug.sprites()`) muestra todos los cuadros de los personajes ampliados.
- `game/juego.ts`: controlador con los modos editar, auto, pasos y fin. El contador `corrida` invalida animaciones viejas al reiniciar.
- `ui/ui.ts`: todo el acceso al DOM.

## Convenciones
- La UI se diseña sobre 1920×1080. Toda medida CSS se escribe `calc(var(--u) * Npx)`; `--u` lo fija `main.ts`. No usar `transform: scale` en contenedores, porque rompe el arrastre de Blockly.
- Fuentes: *Jersey 10* (pixel, solo peso 400) para títulos y botones; *Nunito* para el texto.
- Los identificadores y comentarios van en español.
