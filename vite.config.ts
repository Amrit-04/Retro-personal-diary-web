import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';

/**
 * Load the entry stylesheet without blocking first paint.
 *
 * The boot screens are styled by the critical CSS inlined in index.html, so the
 * desktop stylesheet is not needed for anything the user sees first — on a slow
 * connection it is 150 ms of render delay for nothing. Preload it, swap it in when
 * it lands, and keep a noscript link so it still loads without JavaScript.
 */
function nonBlockingStylesheet(): Plugin {
  return {
    name: 'diary-xp:non-blocking-stylesheet',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      return html.replace(
        /<link rel="stylesheet"([^>]*)>/g,
        (_, attrs) =>
          `<link rel="preload" as="style"${attrs} onload="this.rel='stylesheet'">` +
          `<noscript><link rel="stylesheet"${attrs}></noscript>`,
      );
    },
  };
}

export default defineConfig({
  // Modern browsers only: no polyfills, smallest possible output.
  plugins: [preact(), nonBlockingStylesheet()],
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
