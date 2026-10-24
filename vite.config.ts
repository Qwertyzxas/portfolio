import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base works both for username.github.io and username.github.io/repo-name
  base: './',
  // Explicit IPv4: on Windows "localhost" may bind to ::1 only, which some browsers (Opera) can't reach
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1000,
  },
});
