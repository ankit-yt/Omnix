import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss(),],
  build: {
    rollupOptions: {
      input: {
        content: 'src/content.tsx', // Our entry point
      },
      output: {
        entryFileNames: '[name].js', // Prevents Vite from adding random hashes
        format: 'iife', // Immediately Invoked Function Expression for content scripts
      },
    },
    cssCodeSplit: false, // Bundle all CSS into one file
  },
});