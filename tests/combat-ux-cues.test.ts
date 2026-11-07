import {describe,it,expect} from 'vitest';
import {guardTacticalCue,watchBossTacticalCue} from '../src/ui/combat-ux-cues';
describe('Guard + Watch combat HUD: next-action guidance without simulation mutation',()=>{
 it('prioritizes urgent shield loss over generic enemy count',()=>{
  const a=guardTacticalCue({status:'RUNNING',paused:false,shield:3,enemyCount:9,mastery:true});
  expect(a.tone).toBe('critical');expect(a.headline).toContain('실드 3');
  expect(a.detail).toContain('긴급 정지');
 });
 it('clarifies pause, mastery targets, next-wave preparation and completion',()=>{
  expect(guardTacticalCue({status:'RUNNING',paused:true,shield:2,enemyCount:3,mastery:true}).tone).toBe('hold');
  const mastery=guardTacticalCue({status:'RUNNING',paused:false,shield:14,enemyCount:5,mastery:true});
  expect(mastery.tone).toBe('engaged');expect(mastery.headline).toContain('5개체');expect(mastery.detail).toContain('우선 차단');
  expect(guardTacticalCue({status:'INTERMISSION',paused:false,shield:14,enemyCount:0,mastery:false}).tone).toBe('planning');
  expect(guardTacticalCue({status:'WON',paused:false,shield:14,enemyCount:0,mastery:false}).tone).toBe('secured');
  expect(guardTacticalCue({status:'LOST',paused:false,shield:0,enemyCount:0,mastery:false}).tone).toBe('critical');
 });
 it('never invites the user to fire into a locked or unread boss core',()=>{
  for(const phase of ['arrival','pattern','weak_point','burst','recovery']){
   expect(watchBossTacticalCue('interlocked',phase).tone).not.toBe('attack');
  }
  expect(watchBossTacticalCue('exposed','weak_point')).toEqual({tone:'attack',label:'약점 개방 · 집중 공격'});
  expect(watchBossTacticalCue('exposed','burst').tone).toBe('attack');
  expect(watchBossTacticalCue('active','warning').tone).toBe('dodge');
  expect(watchBossTacticalCue('active','spent').tone).toBe('hold');
 });
});
