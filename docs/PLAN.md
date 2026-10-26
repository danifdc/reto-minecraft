# El Cristal del Amanecer — Plan del juego

Juego web de programación por bloques (solo **secuencias**) para la clase 1 de una academia online de niños de 8 a 11 años.
Ambientado en un mundo de bloques (estilo Minecraft, sin marcas ni assets registrados). Español latinoamericano.

## Decisiones técnicas

- **Stack:** Vite 8 + TypeScript 7 · Blockly 13 (espacio de trabajo) · Phaser 4 (escenario) · publicado en GitHub Pages.
- **Fuentes:** *Jersey 10* (pixelada y legible) para títulos y botones, *Nunito* para los textos.
- **Gráficos:** pixel art 16×16 dibujado en código (sin archivos de imagen externos), escalado sin suavizado.
- **Sonido:** efectos de 8 bits sintetizados con WebAudio. Sin música. Botón para silenciar.
- **Pantalla:** lienzo fijo de 1920×1080 escalado para llenar la ventana (16:9, sin scroll). En móvil o tablet se muestra un aviso que bloquea el juego.
- **Progreso:** se guarda en `localStorage` (niveles completados, código de cada nivel, héroe elegido, si la parte 2 está desbloqueada).
- **Navegación:** se puede ir libremente a cualquier nivel desde la barra superior. Solo la parte 2 se bloquea con contraseña.
- **Contraseña de la parte 2:** `recargar` (sin distinguir mayúsculas y aceptando "recargár"). Una vez ingresada, queda recordada.

## Interfaz

1. **Portada:** título, botón JUGAR y selección del héroe (4 aspectos).
2. **Pantalla de juego:**
   - **Barra superior:** título, círculos de los niveles 1 a 10 · candado · 11 a 20 (todos clicables), batería de BIT y botón de sonido.
   - **Fila de misión:** ícono de BIT y texto de la misión.
   - **Columna izquierda (~48%):** escenario y botones `▶ Ejecutar` (cambia a `↺ Reiniciar` después de ejecutar) y `Paso a paso`.
   - **Columna derecha:** caja de bloques y espacio de trabajo de Blockly con el bloque `al iniciar` fijo, botón `Borrar todo` y contador "bloques usados / ideal".
3. **Durante la ejecución:** se resalta el bloque que se está ejecutando. En el modo paso a paso, cada clic ejecuta un bloque.

## Personajes

- **BIT:** robot ayudante programable, de diseño inspirado en el Agent de Minecraft Education (pequeño, gris claro, visor oscuro). Es el único que se programa.
- **Héroe:** el alumno elige su aspecto entre 4. Espera en su casilla de inicio y, al ganar, **recorre automáticamente el mismo camino que hizo BIT** (se reproduce la lista de casillas que BIT visitó) y celebra.
- **Sombris:** criaturas de la tormenta (tipo slime oscuro). Son estáticas y desaparecen con un `atacar`. En el volcán aparece una variante de fuego con el mismo comportamiento.

## Bloques (estilo MakeCode)

| Bloque | Efecto | Aparece en |
|---|---|---|
| `al iniciar` | Contenedor fijo del programa | Siempre |
| `mover [adelante ▾ / atrás]` | Avanza o retrocede 1 casilla sin girar | Niveles 1 y 2 |
| `girar [izquierda ▾ / derecha]` | Gira 90° sin moverse | Nivel 3 |
| `recoger` | Toma el objeto de la casilla actual | Nivel 5 |
| `romper adelante` | Rompe el bloque rompible de enfrente (árbol, arbusto, piedra) | Nivel 6 |
| `colocar bloque adelante` | Convierte el agua, la lava o el hoyo de enfrente en un puente | Nivel 8 |
| `atacar adelante` | Elimina al Sombri de enfrente | Nivel 12 |

La caja de bloques es **acumulativa**: cada nivel ofrece todos los bloques aprendidos hasta ese momento, así el alumno tiene que elegir.

## Reglas del mundo

- **Transitable:** césped, camino, arena, piso de piedra, placa de presión, puente colocado, puerta abierta.
- **Sólido (no se rompe):** muros, rocas grandes, casas, puerta cerrada. Si BIT choca con algo así, rebota, suena el choque y el intento **falla**.
- **Rompible:** árbol, arbusto, bloque de piedra, telaraña. Si BIT choca con algo así, también falla (hay que romperlo antes).
- **Agua, lava u hoyo:** BIT se frena al borde con el mensaje "¡BIT no puede entrar ahí!" y el intento falla. Nunca se muestra a BIT cayendo ni quemándose.
- **Sombri:** moverse hacia uno hace fallar el intento ("¡Un Sombri bloquea el camino!").
- **Placa de presión:** al pisarla se abre la puerta asociada.
- **Acciones sin efecto** (romper el aire, colocar sobre suelo, recoger donde no hay nada): no fallan, BIT hace un gesto de "nada" y aparece un aviso suave.
- **Victoria:** se evalúa **al terminar el programa**. BIT debe estar en la meta y haber recogido todos los objetos que pide el nivel.
- **Mensajes:** siempre en tono amable y con una pista ("Te faltó recoger la chispa 💡").

## Objetos e historia

- **Fragmentos del Cristal** (4 grandes): niveles 5, 10, 15 y 19. El nivel 20 reconstruye el cristal.
- **Chispas de luz:** objetos menores para practicar `recoger`.
- **Batería de BIT:** indicador en la barra superior. Baja con cada nivel completado de la parte 1. Al terminar el nivel 10 se agota (escena de la pausa). Al ingresar la contraseña se recarga con una animación.

## Historia: El Cristal del Amanecer

La Aldea Albor siempre estuvo iluminada por el **Cristal del Amanecer**. Una noche, la **Tormenta Sombría** lo partió en 4 fragmentos que quedaron repartidos por el mundo, y aparecieron los Sombris. El héroe y su robot **BIT** salen a recuperarlos. El héroe no puede abrirse paso solo, así que programa a BIT para que despeje el camino.

- **Parte 1, de la aldea al bosque y la cueva:** salir de casa, cruzar la aldea, el bosque y el río, y entrar a la cueva. Se recuperan los fragmentos 1 y 2.
- **Pausa:** en la cueva, la batería de BIT se agota. "Solo tu profesor conoce el código para recargarlo".
- **Parte 2, de las minas al volcán y la torre:** minas, lago subterráneo, ríos de lava, volcán y Torre de la Tormenta. Se recuperan los fragmentos 3 y 4 y se arma el cristal. El amanecer vuelve a la aldea.

## Niveles

Tablero de 10×10 casillas: las que no son del camino son decoración no transitable. Los bloques ideales son una estimación y se ajustan al diseñar cada mapa.

**Reglas de progresión (obligatorias al diseñar los mapas):**
- Cada nivel introduce **como máximo 1 bloque nuevo**, y el nivel que lo introduce lo necesita de forma obvia y sin distracciones.
- El nivel donde aparece un bloque nuevo es corto: pocos bloques y sin combinar con otros recién aprendidos.
- El "ideal" de un nivel no sube más de 3 respecto al anterior (la excepción son los niveles de repaso 4, 7, 9 y 11, que pueden ser un poco más largos).
- Los 3 niveles de `src/levels/prueba.ts` son solo para probar el motor y **no representan** la dificultad real: se reemplazan en la Fase 4.

**Reglas visuales (por la vista 3/4):**
- El héroe empieza **detrás de BIT y en la misma fila**: si está justo arriba o abajo, los sprites se superponen.
- Todos los árboles se pueden romper. Para los bordes del camino que no deben romperse, usar muros, rocas, vallas, cultivos o agua.
- La piedra rompible (`P`, clara y agrietada) debe verse distinta de los muros (`#`): no usar `P` como pared decorativa.

### Parte 1 — La aldea y el bosque

| # | Título | Escena | Objetivo y concepto | Bloques nuevos | Ideal |
|---|---|---|---|---|---|
| 1 | Despierta, BIT | Dentro de la casa del héroe | Llegar a la placa de presión para abrir la puerta. Primera secuencia. | mover adelante | 3 |
| 2 | Marcha atrás | Patio de la casa | BIT quedó mirando hacia la casa: retroceder hasta el portón. Las opciones del desplegable. | mover atrás | 4 |
| 3 | La esquina del pozo | Calle de la aldea | Camino en L: el giro cambia hacia dónde mira BIT, no lo mueve. | girar | 6 |
| 4 | Zigzag en el huerto | Huerto de la aldea | Zigzag entre cultivos sin pisarlos. Giros a ambos lados. | — | 7 |
| 5 | El primer fragmento | Plaza de la aldea | Recoger el Fragmento 1 y llegar a la salida. | recoger | 8 |
| 6 | El bosque cerrado | Entrada del bosque | Árboles caídos bloquean el sendero: romperlos. | romper adelante | 7 |
| 7 | Chispas entre los árboles | Interior del bosque | Romper arbustos, girar y recoger 2 chispas. Combinar todo. | — | 11 |
| 8 | El río | Orilla del río | Construir un puente de 2 bloques para cruzar. | colocar bloque adelante | 7 |
| 9 | Rumbo a la cueva | Río y colinas | Puente, romper rocas, girar y recoger 1 chispa. | — | 13 |
| 10 | El corazón de la cueva | Cueva con cristales | Recoger el Fragmento 2. **Al ganar, BIT se queda sin batería** y aparece la pantalla de pausa. | — | 15 |

### Parte 2 — Las profundidades y el volcán (requiere la contraseña)

| # | Título | Escena | Objetivo y concepto | Bloques nuevos | Ideal |
|---|---|---|---|---|---|
| 11 | ¡BIT recargado! | Entrada a las minas | Repaso: romper piedra, girar y llegar a la meta. | — | 9 |
| 12 | Sombris en la mina | Túnel de la mina | Un Sombri bloquea el túnel: atacarlo. | atacar adelante | 6 |
| 13 | Túneles oscuros | Galerías con telarañas | Atacar, romper telarañas y recoger 2 chispas. | — | 13 |
| 14 | El lago subterráneo | Lago dentro de la cueva | Puente de 3 bloques y un Sombri del otro lado. | — | 10 |
| 15 | El tercer fragmento | Fondo de la mina | Recoger el Fragmento 3 combinando todo. | — | 15 |
| 16 | Ríos de lava | Base del volcán | Puentes sobre lava en zigzag. | — | 13 |
| 17 | La puerta del volcán | Entrada del volcán | Pisar una placa de presión para abrir la puerta. Recuerda al nivel 1. | — | 14 |
| 18 | Camino de ceniza | Laderas del volcán | Secuencia larga: romper, colocar, atacar y girar. | — | 17 |
| 19 | El cuarto fragmento | Cima del volcán | Recoger el Fragmento 4, custodiado por Sombris de fuego. | — | 17 |
| 20 | La Torre de la Tormenta | Torre en las nubes | Llegar al altar con todo el recorrido. **Escena final:** se arma el cristal y amanece. | — | 20 |

### Textos de misión (borrador; se ajustan con cada mapa)

1. "¡La puerta está cerrada! Programa a BIT para que llegue a la placa de presión y la abra."
2. "BIT quedó mirando hacia la casa. ¿Sabías que puede moverse hacia atrás sin darse vuelta? Llévalo hasta el portón."
3. "El camino dobla en la esquina del pozo. `girar` cambia hacia dónde mira BIT, pero no lo mueve."
4. "¡Cuidado con los cultivos! Guía a BIT por el sendero del huerto sin pisarlos."
5. "¡Allí brilla el primer fragmento del Cristal! Lleva a BIT hasta él, usa `recoger` y sigue hasta la salida de la aldea."
6. "La tormenta tumbó árboles en el sendero. Usa `romper adelante` para abrir paso."
7. "El bosque está lleno de chispas de luz. Recoge las 2 y llega al claro."
8. "BIT no sabe nadar. Usa `colocar bloque adelante` para construir un puente sobre el río."
9. "La cueva está cerca. Cruza el arroyo, rompe las rocas y recoge la chispa del camino."
10. "El segundo fragmento brilla en el corazón de la cueva… pero la batería de BIT está casi vacía. ¡Rápido!"
11. "¡BIT tiene energía al máximo! Entremos a las minas."
12. "Un Sombri bloquea el túnel. Usa `atacar adelante` para despejar el camino."
13. "Túneles oscuros, telarañas y Sombris. Recoge las 2 chispas para iluminar la salida."
14. "Un lago subterráneo nos corta el paso. Construye un puente y cuidado con lo que espera del otro lado."
15. "El tercer fragmento está en lo más profundo de la mina. Usa todo lo que aprendiste."
16. "¡Ríos de lava! Construye puentes con cuidado para llegar a la base del volcán."
17. "La puerta del volcán se abre con una placa de presión, igual que la de tu casa. ¿Te acuerdas?"
18. "El camino de ceniza es largo. Planifica cada paso de BIT antes de ejecutar."
19. "Sombris de fuego custodian el cuarto fragmento. ¡Tú puedes!"
20. "La Torre de la Tormenta. Lleva a BIT hasta el altar para devolver el Cristal del Amanecer a su lugar."

## Fases de desarrollo

1. ✅ **Base jugable:** proyecto Vite+TS, layout 16:9, Blockly con todos los bloques, motor de ejecución (paso a paso y resaltado), escenario Phaser con gráficos provisionales y 3 niveles de prueba.
2. ✅ **Arte y animación:** vista 3/4 con pixel art por tema (7 temas), BIT, 4 aspectos de héroe, Sombris (normal y de fuego), animaciones, partículas y recorrido del héroe con confeti.
3. **Estructura del juego:** portada, selección de héroe, barra de niveles, contraseña, batería, localStorage y pantallas de victoria, error, pausa y final.
4. **Los 20 niveles:** mapas definitivos, textos y prueba de que cada nivel tiene solución.
5. **Sonido y pulido:** efectos, aviso en móvil, ajustes finales y publicación en GitHub Pages.
