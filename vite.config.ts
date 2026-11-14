import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { omegaPreviewLabEnabled } from './omega-preview-policy';

export default defineConfig({
  base: './',
  plugins: [react()],
  // Keep the unapproved playtest limited to this branch's Vercel preview.
  ...(omegaPreviewLabEnabled(process.env)
    ? { define: { 'import.meta.env.VITE_OMEGA_PROTOCOL_LAB': JSON.stringify('1') } }
    : {}),
  test: { environment: 'node', maxWorkers: 2, include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'] },
});
