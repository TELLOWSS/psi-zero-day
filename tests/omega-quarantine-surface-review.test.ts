import {describe,expect,it} from 'vitest';
import {omegaSurfaceReviewRequested} from '../src/ui/omega-quarantine-surface-review';

describe('quarantine concrete review',()=>{
 it('requires development and both explicit review flags',()=>{
  const q='?omegaLab=1&omegaSurfaceReview=1';
  expect(omegaSurfaceReviewRequested(q,true)).toBe(true);
  expect(omegaSurfaceReviewRequested(q,false)).toBe(false);
  expect(omegaSurfaceReviewRequested('?omegaSurfaceReview=1',true)).toBe(false);
  expect(omegaSurfaceReviewRequested('?omegaLab=1',true)).toBe(false);
 });
});
