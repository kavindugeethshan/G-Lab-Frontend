import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxy = {
  target: 'http://localhost:3001',
  bypass: (req) => {
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return '/index.html';
    }
    return null;
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/users': apiProxy,
      '/products': apiProxy,
      '/cart': apiProxy,
      '/order': apiProxy,
      '/payments': apiProxy,
      '/admin': apiProxy,
      '/ai': apiProxy,
    },
  },
});
