import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * lib/datasets.ts loads the start-up data files with dynamic imports, which on their own only start once the app's
 * code has downloaded and begun to run. This adds a modulepreload link for each of them to index.html, so the browser
 * fetches the code and those data files side by side from the first moment. The list is read from datasets.ts itself,
 * so files other pages load on demand (stores, shows, places, role index…) are never fetched up front.
 */
const preloadDatasets = (): Plugin => {
  const source = readFileSync(path.resolve(__dirname, 'src/lib/datasets.ts'), 'utf8');
  const files = new Set([...source.matchAll(/import\('\.\.\/data\/([\w-]+)\.json'\)/g)].map((m) => m[1]));
  return {
    name: 'phiegg-preload-datasets',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        if (!ctx.bundle) return;
        const base = process.env.PHI_BASE || '/';
        return Object.values(ctx.bundle)
          .filter((c) => c.type === 'chunk' && c.isDynamicEntry && files.has(path.basename(c.facadeModuleId ?? '', '.json')))
          .map((c) => ({ tag: 'link', attrs: { rel: 'modulepreload', href: base + c.fileName }, injectTo: 'head' as const }));
      },
    },
  };
};

export default defineConfig({
  plugins: [react(), preloadDatasets()],
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
  server: { port: 3101, fs: { allow: ['../..'] } },
  // es2022 for lib/datasets.ts's top-level await (the data files load as their own parallel chunks before the app
  // runs); every browser we serve has had it since 2021.
  build: { outDir: 'dist', target: 'es2022' },
  esbuild: { target: 'es2022' },
  optimizeDeps: { esbuildOptions: { target: 'es2022' } },
  // Emit JSON as JSON.parse('…'): the engine parses that far faster than the same data as a JavaScript literal.
  json: { stringify: true },
});
