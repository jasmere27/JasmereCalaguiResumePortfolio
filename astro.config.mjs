import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://jasmerecalagui.pages.dev',
  vite: {
    plugins: [tailwindcss()],
  },
  compressHTML: true,
});
