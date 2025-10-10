import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'drizzle/',
        '*.config.*',
        '**/*.d.ts',
        'app/**',
      ],
    },
    // Use projects to define different test environments
    projects: [
      {
        name: 'node',
        test: {
          include: ['lib/**/*.test.{ts,tsx}'],
          environment: 'node',
        },
      },
      {
        name: 'jsdom',
        test: {
          include: [
            'app/**/*.test.{ts,tsx}',
            '**/*.component.test.{ts,tsx}',
            '**/*.ui.test.{ts,tsx}',
          ],
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
