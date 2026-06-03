import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');

          if (!normalizedId.includes('/node_modules/')) {
            return undefined;
          }

          if (
            normalizedId.includes('/node_modules/react/') ||
            normalizedId.includes('/node_modules/react-dom/') ||
            normalizedId.includes('/node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }

          if (
            normalizedId.includes('/node_modules/pixi.js/') ||
            normalizedId.includes('/node_modules/@pixi/')
          ) {
            return undefined;
          }

          if (normalizedId.includes('/node_modules/zustand/')) {
            return 'state-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
  plugins: [react()],
});
