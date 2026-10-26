# El Cristal del Amanecer

Juego web de programación por bloques (solo secuencias) para niños de 8 a 11 años, en español latinoamericano.
El plan completo (historia, 20 niveles, reglas de progresión, fases) está en `docs/PLAN.md`: léelo antes de cambiar niveles o mecánicas. Regla clave: máximo 1 bloque nuevo por nivel.
Nadie del equipo edita el código a mano: todos los cambios los hace Claude.

## Comandos
- `npm run dev`: servidor en http://localhost:5173
- `npm test`: tests del motor (vitest). Cada nivel debe ganar con su `solucion` y `ideal` debe coincidir.
- `npm run build`: chequeo de tipos y build en `dist/` (base relativa, lista para GitHub Pages).
- `node scripts/captura.mjs <url> <carpeta> [ancho] [alto]`: abre Chrome headless, ejecuta los pasos de la variable de entorno `PASOS` (JSON: eval, click, arrastrar, esperar, texto, foto) y guarda capturas. Úsalo para verificar cambios visuales. En dev existe `window.__debug` (cargar(n), ponerSolucion(n), ponerTexto("adelante der ..."), editor, juego, escena).

## Stack (versiones nuevas: verificar APIs en node_modules antes de usarlas)
- **Vite 8 + TypeScript 7**, **Blockly 13** (`blockly/core`, renderer zelos, locale `blockly/msg/es`) y **Phaser 4**.
- Phaser 4 no tiene `generateTexture` ni `TextureManager.generate`: las texturas se dibujan en un `<canvas>` y se registran con `textures.addCanvas`. Las guías oficiales están en `node_modules/phaser/skills/*/SKILL.md`.
- Los medios de Blockly están copiados en `public/blockly-media/`.

## Arquitectura (`src/`)
- `engine/`: lógica pura, sin DOM.
  - `World.exec(cmd)` devuelve `{ events, fallo?, aviso? }`; `World.resultado()` se evalúa al terminar el programa.
  - `tiles.ts` tiene la leyenda de caracteres del mapa y la clase de cada casilla (suelo, sólido, rompible o líquido).
- `levels/`: datos de niveles (`LevelDef`), con dos capas del mismo tamaño: `terreno` y `objetos` (B=BIT, H=héroe, G=meta, *=chispa, F=fragmento, S=Sombri). El héroe debe empezar al lado de BIT.
- `blocks/`: definición de bloques y `Editor`, que envuelve Blockly. El resto de la app no usa Blockly directamente.
- `scene/`: Phaser. `StageScene.mostrar(world)` redibuja, `animar(events)` anima eventos y `celebrar()` hace que el héroe recorra `world.recorrido`. Los sprites son filas de caracteres más una paleta (`sprites.ts`); las casillas se pintan con funciones (`textures.ts`).
- `game/juego.ts`: controlador con los modos editar, auto, pasos y fin. El contador `corrida` invalida animaciones viejas al reiniciar.
- `ui/ui.ts`: todo el acceso al DOM.

## Convenciones
- La UI se diseña sobre 1920×1080. Toda medida CSS se escribe `calc(var(--u) * Npx)`; `--u` lo fija `main.ts`. No usar `transform: scale` en contenedores, porque rompe el arrastre de Blockly.
- Fuentes: *Jersey 10* (pixel, solo peso 400) para títulos y botones; *Nunito* para el texto.
- Los identificadores y comentarios van en español.
