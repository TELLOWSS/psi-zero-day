/** Exact isolated branches only. No production, main or broad QA wildcard. */
const previewOnlyBranches=new Set([
 'codex/omega-g5i-art-review-20261113',
 'qa/omega-m12g5o-integrated-eight-heading-east-action-20261114',
]);
export function omegaPreviewLabEnabled(env:Record<string,string|undefined>):boolean {
 return env.VERCEL_ENV==='preview'&&previewOnlyBranches.has(env.VERCEL_GIT_COMMIT_REF??'');
}
