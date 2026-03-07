import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => ({
  root: '.',
  base: './',
  build: {
    outDir: '../dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        app: './index.html'
      }
    }
  },
  plugins: [
    mode === 'wechat' ? viteSingleFile() : false
  ].filter(Boolean),
  server: {
    port: 3000,
    host: 'localhost'
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}));
