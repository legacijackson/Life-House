import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'client/src/**/*.{test,spec}.{js,ts,tsx}',
      'server/**/*.{test,spec}.{js,ts,tsx}',
      'shared/**/*.{test,spec}.{js,ts,tsx}'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'client/src/**/*.{js,ts,tsx}',
        'server/**/*.{js,ts,tsx}',
        'shared/**/*.{js,ts,tsx}'
      ],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.{js,ts,tsx}',
        '**/*.spec.{js,ts,tsx}',
        'cypress/',
        'migrations/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@shared': resolve(__dirname, './shared'),
      '@server': resolve(__dirname, './server')
    }
  }
});