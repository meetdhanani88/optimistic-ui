import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // For development, use source files for better HMR
      // For production builds, this will use the built dist via package.json exports
      '@meetdhanani/optimistic-ui': path.resolve(__dirname, '../../packages/react-query/src'),
      '@meetdhanani/optimistic-ui-core': path.resolve(__dirname, '../../packages/core/src'),
    },
  },
  optimizeDeps: {
    include: ['@meetdhanani/optimistic-ui', '@meetdhanani/optimistic-ui-core'],
  },
  server: {
    fs: {
      allow: ['..'], // Allow accessing parent directories
    },
  },
});

