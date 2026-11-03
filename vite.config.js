import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [sveltekit()],
  // Les anciens ateliers peuvent conserver leurs installations locales.
  resolve: { dedupe: ['svelte', 'pixi.js'] },
  server: { fs: { allow: [fileURLToPath(new URL('.', import.meta.url))] } },
});
