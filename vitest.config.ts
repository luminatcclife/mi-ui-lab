import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // jsdom: DOMPurify y DOMParser necesitan un DOM; fake-indexeddb se carga en los tests de db
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
