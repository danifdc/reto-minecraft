# El Cristal del Amanecer

Juego de programación por bloques para niños de 8 a 11 años, ambientado en un mundo de bloques.
El alumno programa a **BIT**, un robot ayudante, para abrir el camino de su héroe y recuperar los
fragmentos del Cristal del Amanecer.

**Jugar:** https://danifdc.github.io/reto-minecraft/

- 20 niveles en 2 partes. La Parte 2 se desbloquea con un código que da el profesor.
- Solo secuencias: `mover`, `girar`, `recoger`, `romper`, `colocar bloque` y `atacar`.
- El progreso y el código de cada nivel se guardan en el navegador del alumno.
- Pensado para computadora (en celulares muestra un aviso).

## Desarrollo

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # verifica que los 20 niveles tengan solución y que el "ideal" sea el mínimo
npm run build   # versión para publicar, en dist/
```

Cada push a `main` corre los tests y publica automáticamente en GitHub Pages.
El plan del juego está en [docs/PLAN.md](docs/PLAN.md) y las notas técnicas en [CLAUDE.md](CLAUDE.md).

Hecho con Vite, TypeScript, [Blockly](https://developers.google.com/blockly) y [Phaser](https://phaser.io).
Sin relación con Minecraft ni Microsoft: el arte es original.
