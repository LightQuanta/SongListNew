import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import vue from "@astrojs/vue";
import vueJsx from '@vitejs/plugin-vue-jsx';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), vue()],
  vite: {
    plugins: [vueJsx()]
  },
  devToolbar: {
    enable: false
  }
});