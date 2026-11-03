import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $crash: './crash/src',
      $instantanees: './instantanees/src',
      $revelation: './revelation/src',
      $slots: './slots/src',
    },
  },
};
