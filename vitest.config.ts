import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'lancedb': path.resolve(__dirname, './tests/__mocks__/lancedb.ts')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
