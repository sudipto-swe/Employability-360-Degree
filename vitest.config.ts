import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';

// Load .env variables so tests have access to them (e.g. NEXT_PUBLIC_APP_URL)
dotenv.config({ path: '.env' });

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Use describe, it, expect globally
    environment: 'jsdom',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts', 'src/app/**/*.ts', 'src/app/**/*.tsx'],
      exclude: ['src/lib/types/**', 'src/**/*.d.ts'],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 75,
        statements: 75,
      }
    },
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}', 'tests/integration/**/*.{test,spec}.{ts,tsx}', 'tests/components/**/*.{test,spec}.{ts,tsx}'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
