import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas para que funcione en GitHub Pages bajo cualquier nombre de repositorio.
  base: './',
  build: {
    chunkSizeWarningLimit: 2500,
  },
});
