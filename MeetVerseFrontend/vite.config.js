import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@excalidraw') || id.includes('excalidraw')) {
              return 'excalidraw';
            }
            if (id.includes('livekit-client')) {
              return 'livekit';
            }
            if (id.includes('onnxruntime-web')) {
              return 'onnx';
            }
            if (id.includes('@microsoft/signalr')) {
              return 'signalr';
            }
            if (id.includes('framer-motion')) {
              return 'motion';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
})
