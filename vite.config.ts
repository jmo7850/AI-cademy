import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  // Inline the mascot images (under 40 kB each) so the build also works as a single self-contained file.
  build: { assetsInlineLimit: 40 * 1024 },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
