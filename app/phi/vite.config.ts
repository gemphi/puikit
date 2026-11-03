import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import type { Plugin } from 'vite';

/** /<key>/<file> serves app/<key>/public/<file>: each app keeps its config and art in its own folder. */
const appFiles = (): Plugin => ({
  name: 'phi-app-files',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = decodeURIComponent((req.url ?? '').split('?')[0]);
      const m = url.match(/^\/([\w-]+)\/(.+)$/);
      const file = m && path.resolve(__dirname, '..', m[1], 'public', m[2]);
      if (!file || !file.startsWith(path.resolve(__dirname, '..')) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return next();
      res.setHeader('content-type', ({ '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' } as Record<string, string>)[path.extname(file)] ?? 'application/octet-stream');
      fs.createReadStream(file).pipe(res);
    });
  },
});

export default defineConfig({
  plugins: [react(), appFiles()],
  define: { 'import.meta.env.VITE_PHI_HOST': JSON.stringify('1') },
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
  server: { port: 3100, fs: { allow: ['../..'] } },
  build: { outDir: 'dist' },
});
