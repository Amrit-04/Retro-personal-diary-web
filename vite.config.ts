import { defineConfig } from 'vite';

export default defineConfig({
  // Modern browsers only: no polyfills, smallest possible output.
  build: {
    target: 'es2020',
    modulePreload: { polyfill: false },
    cssMinify: true,
    reportCompressedSize: true,
  },
  esbuild: {
    legalComments: 'none',
  },
});
