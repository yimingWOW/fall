import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true
      },
      protocolImports: true,
    })
  ],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  base: '/fall/',
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [
        'vite-plugin-node-polyfills/shims/buffer',
        'buffer',
        'events',
        'stream',
        'util',
        'crypto'
      ]
    }
  },
  resolve: {
    alias: {
      'stream': 'stream-browserify',
      'util': 'util/'
    }
  },
  optimizeDeps: {
    include: ['buffer', 'process']
  }
});