import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: process.env.PHI_BASE || '/',
  resolve: {
    alias: {
      '@phi-kit': path.resolve(__dirname, '../phi-kit/src'),
      '@pui/components': path.resolve(__dirname, '../../src/components'),
      '@pui/providers': path.resolve(__dirname, '../../src/providers'),
      '@pui/styles': path.resolve(__dirname, '../../src/styles'),
      '@pui/tokens': path.resolve(__dirname, '../../src/tokens'),
      '@pui/hooks': path.resolve(__dirname, '../../src/hooks'),
      '@pui/services': path.resolve(__dirname, '../../src/services'),
      '@pui/store': path.resolve(__dirname, '../../src/store'),
      '@pui/api': path.resolve(__dirname, '../../src/api'),
      '@pui/types': path.resolve(__dirname, '../../src/types'),
      '@pui': path.resolve(__dirname, '../../src'),
      'next/link': path.resolve(__dirname, '../uaia/src/mocks/Link.tsx'),
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, './node_modules/react/jsx-runtime'),
      'lucide-react': path.resolve(__dirname, './node_modules/lucide-react'),
    },
    dedupe: ['react', 'react-dom', 'lucide-react'],
  },
  css: { preprocessorOptions: { scss: { api: 'modern-compiler' } } },
  server: { port: 3112 },
  build: { outDir: 'dist' },
});
