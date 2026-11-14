import {describe,expect,it} from 'vitest';
import {omegaPreviewLabEnabled} from '../omega-preview-policy';

describe('Omega artist preview isolated branch safety',()=>{
 const old='codex/omega-g5i-art-review-20261113';
 const next='qa/omega-m12g5o-integrated-eight-heading-east-action-20261114';
 it('enables exactly both approved named development preview branches',()=>{
  for(const branch of [old,next]){
   expect(omegaPreviewLabEnabled({VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:branch})).toBe(true);
   expect(omegaPreviewLabEnabled({VERCEL_ENV:'production',VERCEL_GIT_COMMIT_REF:branch})).toBe(false);
   expect(omegaPreviewLabEnabled({VERCEL_ENV:'development',VERCEL_GIT_COMMIT_REF:branch})).toBe(false);
  }
 });
 it('rejects main, near-misses, unrelated branches and missing provider context',()=>{
  for(const branch of ['main','master','qa/','qa/omega-m12g5n-recover-28-original-candidates-20261114',
   'qa/omega-m12g5o-integrated-eight-heading-east-action-20261114-shadow',
   'qa/omega-m12g5o-integrated-eight-heading-east-action-20261114/extra']){
   expect(omegaPreviewLabEnabled({VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:branch})).toBe(false);
  }
  expect(omegaPreviewLabEnabled({VERCEL_ENV:'preview'})).toBe(false);
  expect(omegaPreviewLabEnabled({})).toBe(false);
 });
});
