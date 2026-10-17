import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: process.env.PHI_BASE || '/',
  resolve: {
    alias: {
      'puijs': path.resolve(__dirname, '../../src'),
      '@pui/tokens': path.resolve(__dirname, '../../src/tokens'),
      '@pui/styles': path.resolve(__dirname, '../../src/styles'),
      '@pui/components': path.resolve(__dirname, '../../src'),
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, './node_modules/react/jsx-runtime'),
      'lucide-react': path.resolve(__dirname, './node_modules/lucide-react'),
    },
    dedupe: ['react', 'react-dom', 'lucide-react'],
  },
  css: { preprocessorOptions: { scss: { api: 'modern-compiler' } } },
  server: {
    port: 3002,
  },
});
