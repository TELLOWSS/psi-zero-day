/** The art-review branch gets an isolated preview lab; production never does. */
export function omegaPreviewLabEnabled(env: Record<string, string | undefined>): boolean {
  return env.VERCEL_ENV === 'preview'
    && env.VERCEL_GIT_COMMIT_REF === 'codex/omega-g5i-art-review-20261113';
}
