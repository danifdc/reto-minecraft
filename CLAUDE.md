# El Cristal del Amanecer

Juego web de programación por bloques (solo secuencias) para niños de 8 a 11 años, en español latinoamericano.
El plan completo (historia, 20 niveles, reglas de progresión, fases) está en `docs/PLAN.md`: léelo antes de cambiar niveles o mecánicas. Regla clave: máximo 1 bloque nuevo por nivel.
Nadie del equipo edita el código a mano: todos los cambios los hace Claude.

## Comandos
- `npm run dev`: servidor en http://localhost:5173
- `npm test`: tests (vitest). Para cada nivel verifican que `solucion` gana, que `ideal` es el mínimo real (resolvedor `engine/solver.ts`, búsqueda en anchura) y las reglas de progresión de `docs/PLAN.md`. Si cambias un mapa, corre los tests: el resolvedor detecta atajos.
- `node scripts/jugar-todos.mjs [velocidad]`: juega los 20 niveles en la app real (necesita `npm run dev`). `node scripts/mosaico.mjs salida.png 1 10`: mosaico con las capturas de los niveles.
- Si un cambio de CSS no se ve en el navegador, el watcher de Vite puede haberse perdido la escritura (pasa con `sed -i` o `cat >>` rápidos). Hay que verificar con `curl -s http://localhost:5173/src/styles.css | grep ...` y hacer `touch src/styles.css`.
- `npm run build`: chequeo de tipos y build en `dist/` (base relativa).
- Publicación: cada push a `main` dispara `.github/workflows/publicar.yml` (tests, build y despliegue en https://danifdc.github.io/reto-minecraft/).
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
- `levels/index.ts`:
  - `PARTE1` y `PARTE2` (`parte1.ts`, `parte2.ts`): los 20 niveles definitivos. `prueba.ts` solo lo usan los tests de reglas del motor.
  - `INICIO_PARTE2` es el índice del primer nivel bloqueado.
  - `CONTRASENA_PARTE2 = 'recargar'`; se compara sin distinguir mayúsculas, tildes ni espacios.
- `game/juego.ts`: controlador.
  - Pantallas: portada → juego; pausa (BIT sin batería + contraseña); final.
  - Modos de nivel: editar, auto, pasos y fin. El contador `corrida` invalida animaciones viejas al reiniciar.
  - La batería baja con los niveles completados de la parte 1 y se llena con la contraseña.
- `game/progreso.ts`: progreso en `localStorage` (clave `cristal-del-amanecer:progreso`). Guarda el aspecto del héroe, el último nivel, los niveles completados (con su mejor cantidad de bloques), el código Blockly de cada nivel, si la parte 2 está abierta y si ya se vio el prólogo.
- `audio/sonidos.ts`: efectos de 8 bits sintetizados con WebAudio (sin archivos). `sonido.xxx()` se llama desde la escena (cada animación), el editor (encajar y borrar bloques; se silencia unos ms al cargar un nivel) y el controlador (ejecutar, ganar, perder, batería, contraseña). El botón 🔊 guarda `progreso.silencio`.
- Aviso para celulares: `#movil` en `index.html`, fuera de `#app`. Lo activa `main.ts` si la pantalla es táctil sin mouse o muy chica. En `scripts/captura.mjs` se prueba con `MOVIL=1`.
- `ui/ui.ts`: todo el acceso al DOM. `ui/arte.ts`: ilustraciones pixel art de la interfaz (portada, diálogos, pausa), reutilizando los sprites del juego.
- El Chrome de `scripts/captura.mjs` arranca siempre sin progreso guardado: empieza en la portada y hay que hacer clic en `#btn-jugar` y cerrar el prólogo (`.dialogo-botones .btn`), o usar `__debug.cargar(n)`.

## Convenciones
- La UI se diseña sobre 1920×1080. Toda medida CSS se escribe `calc(var(--u) * Npx)`; `--u` lo fija `main.ts`. No usar `transform: scale` en contenedores, porque rompe el arrastre de Blockly.
- Fuentes: *Jersey 10* (pixel, solo peso 400) para títulos y botones; *Nunito* para el texto.
- Los identificadores y comentarios van en español.
- Todos los botones de la interfaz se levantan un poco al pasar el mouse y se hunden al hacer clic (reglas al final de `styles.css`); los bloques de Blockly no.
