import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'

const copyPdfWorker = {
  name: 'copy-pdf-worker',
  buildStart() {
    copyFileSync(
      'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
      'public/pdf.worker.min.js'
    );
  },
};

export default defineConfig({
  plugins: [react(), copyPdfWorker],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
