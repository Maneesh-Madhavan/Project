import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'render-spa-fallback',
      closeBundle() {
        const distPath = resolve(__dirname, 'dist');
        const indexPath = resolve(distPath, 'index.html');
        const fallbackPath = resolve(distPath, '200.html');

        if (existsSync(indexPath)) {
          copyFileSync(indexPath, fallbackPath);
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
