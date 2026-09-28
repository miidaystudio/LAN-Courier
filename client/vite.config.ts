import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendPort = process.env.BACKEND_PORT || '5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/ws': {
        target: `ws://localhost:${backendPort}`,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (_err) => {
            // Suppress transient proxy connection resets during hot reloads
          });
          proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
            socket.on('error', (_err) => {
              // Suppress socket resets
            });
          });
        },
      },
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err) => {
            // Suppress proxy errors when backend is initializing
          });
        },
      },
    },
  },
});
