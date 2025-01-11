import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import inject from '@rollup/plugin-inject';

export default defineConfig({
  plugins: [
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
    react(),
  ],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  base: '/fall/',
  build: {
    rollupOptions: {
      plugins: [
        inject({
          Buffer: ['buffer', 'Buffer'],
        }),
      ],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      buffer: 'buffer', // 指向正确的 polyfill 路径
      stream: 'stream-browserify',
      util: 'util/',
    },
  },
  optimizeDeps: {
    include: ['buffer', 'stream', 'process', 'util'],
  },
});
