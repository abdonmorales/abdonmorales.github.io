import { defineConfig } from 'astro/config';
// https://astro.build/config
export default defineConfig({
  output: 'static',
  build: {
    assets: 'assets',
    inlineStylesheets: 'auto'
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
  compressHTML: true
});