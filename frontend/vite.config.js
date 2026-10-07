import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  cacheDir: './.vite-cache',
  server: { host: '0.0.0.0', port: 5173, proxy: { '/api': 'http://localhost:8080' } },
  build: { outDir: resolve(import.meta.dirname, '../src/main/resources/static'), emptyOutDir: true }
});
