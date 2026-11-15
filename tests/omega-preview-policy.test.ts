import { describe, expect, it } from 'vitest';
import { omegaPreviewLabEnabled } from '../omega-preview-policy';

describe('Omega art review preview scope', () => {
  const branch = 'codex/omega-g5i-art-review-20261113';
  it('enables the lab only for the designated Vercel preview branch', () => {
    expect(omegaPreviewLabEnabled({ VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: branch })).toBe(true);
    expect(omegaPreviewLabEnabled({ VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: branch })).toBe(false);
    expect(omegaPreviewLabEnabled({ VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'main' })).toBe(false);
    expect(omegaPreviewLabEnabled({ VERCEL_ENV: 'preview' })).toBe(false);
    expect(omegaPreviewLabEnabled({})).toBe(false);
  });
});
