import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import manifest from './src/manifest.json';

// Fix manifest paths for proper building
manifest.background.service_worker = 'src/background.ts';
manifest.content_scripts[0].js = ['src/content-script.ts'];

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  }
});