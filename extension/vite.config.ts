import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    cssCodeSplit: false, // Don't split CSS
    lib: {
      entry: 'src/embed.tsx', // We will create this entry file next
      name: 'OmnixWidget',
      fileName: () => 'widget.js',
      formats: ['iife'], // Creates a self-executing script suitable for browsers
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true, 
      },
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});