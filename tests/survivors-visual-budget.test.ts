import {describe,it,expect} from 'vitest';
import {survivorsVisualBudget} from '../src/ui/survivors-visual-budget';
describe('presentation budget under combat pressure',()=>{
 it('respects both user choice and automatic slowdown',()=>{
  expect(survivorsVisualBudget('vivid','low',0,0,false).flights).toBe(10);
  expect(survivorsVisualBudget('smooth','high',0,0,false).detailBusy).toBe(true);
  expect(survivorsVisualBudget('vivid','high',0,0,false).flights).toBe(42);
 });
 it('reduces ornaments around dense hazards while retaining feedback slots',()=>{
  const crowded=survivorsVisualBudget('vivid','high',46,0,false);
  expect(crowded.flights).toBe(12);expect(crowded.feedbackLimit).toBe(6);
  expect(crowded.presenceStrength).toBeLessThan(1);
 });
 it('removes moving ornament flights for reduced motion',()=>{
  expect(survivorsVisualBudget('vivid','high',0,100,true).flights).toBe(0);
 });
});
