import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In development the API is proxied under the same origin, so the refresh cookie
// (Path=/api/auth, SameSite=Strict) is first-party and no CORS round-trips are needed.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:4000', changeOrigin: true },
    },
  },
});
