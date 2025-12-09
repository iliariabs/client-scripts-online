import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/client-scripts-online/',
  assetsInclude: ['**/*.wasm'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined, 
      },
    },
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        format: 'es',
      },
    },
  },
})