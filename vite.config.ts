import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  plugins: [react()],
  test: { environment: 'node', maxWorkers: 2, include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'] },
});
