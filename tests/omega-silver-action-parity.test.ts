import {describe,expect,it} from 'vitest';
import {
 OMEGA_SILVER_HEADINGS,OMEGA_SILVER_ACTION_TARGET,
 OMEGA_SILVER_REVIEWED_ACTION_FRAMES,
 OMEGA_SILVER_PRIORITY_ACTIONS,OMEGA_SILVER_ALL_ACTIONS,
 omegaSilverActionStatus,
} from '../src/ui/omega-silver-action-parity';

describe('canonical silver AIRA art coverage must not borrow the older E study',()=>{
 it('requires 8 independently authored directions and all 160 painted keys',()=>{
  expect(OMEGA_SILVER_HEADINGS).toHaveLength(8);
  expect(OMEGA_SILVER_ALL_ACTIONS).toHaveLength(6);
  expect(OMEGA_SILVER_PRIORITY_ACTIONS).toHaveLength(4);
  expect(OMEGA_SILVER_HEADINGS.length*
    OMEGA_SILVER_PRIORITY_ACTIONS.reduce((s,a)=>s+OMEGA_SILVER_ACTION_TARGET[a],0))
   .toBe(120);
  expect(OMEGA_SILVER_HEADINGS.length*
    OMEGA_SILVER_ALL_ACTIONS.reduce((s,a)=>s+OMEGA_SILVER_ACTION_TARGET[a],0))
   .toBe(160);
 });
 it('reports ZERO approved silver action frames, even though E legacy studies exist',()=>{
  for(const heading of OMEGA_SILVER_HEADINGS)
   for(const action of OMEGA_SILVER_ALL_ACTIONS)
    expect(OMEGA_SILVER_REVIEWED_ACTION_FRAMES[heading][action]).toBe(0);
  expect(omegaSilverActionStatus()).toEqual({
   reviewedIndependentFrames:0,
   requiredPriorityFrames:120,
   requiredFullFrames:160,
   priorityFramesRemaining:120,
   totalFramesRemaining:160,
   reviewedDirectionsWithCompletePriority:0,
   complete:false,
   actionMasksApproved:false,
  });
 });
});
