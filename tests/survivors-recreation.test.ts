import {SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import {describe,it,expect} from 'vitest';
import {completedPatrolStages,stageClearReward,availablePinballChoice,pinballRewardBudget} from '../src/domain/survivors-recreation';
import {SurvivorsPinballEngine,PINBALL_BUMPERS} from '../src/engine/survivors-pinball-engine';
const idle={left:false,right:false,assist:false};
const hit=(e:SurvivorsPinballEngine,i:number)=>{const b=PINBALL_BUMPERS[i]!;Object.assign(e.state,{x:b.x,y:b.y+b.r+10,vx:0,vy:-200});e.update(.001,idle);};
describe('stage rewards and pinball progression',()=>{
 it('applies a successful wallet receipt once through the engine and never on defeat',()=>{
  const e=new SurvivorsEngine();expect(e.applyStageClearReward(true)).toBeNull();Object.assign(e.state,{phase:'victory',psiCredits:10,starsEarned:[true,false,false]});expect(e.applyStageClearReward(true)?.total).toBe(650);expect(e.state.psiCredits).toBe(660);expect(e.applyStageClearReward(true)).toBeNull();expect(e.state.psiCredits).toBe(660);
  const failed=new SurvivorsEngine();failed.state.phase='defeat';expect(failed.applyStageClearReward(true)).toBeNull();expect(failed.state.psiCredits).toBe(0);
 });
 it('grows stage pay, caps late-stage awards, distinguishes first clears and rewards mastery',()=>{
  expect(stageClearReward('stage_01','standard',true,3)).toEqual({clear:200,first:400,mastery:150,total:750});
  expect(stageClearReward('stage_02','hard',false,1)).toEqual({clear:375,first:0,mastery:50,total:425});
  expect(stageClearReward('stage_50','extreme',true,99)).toEqual({clear:2400,first:4000,mastery:150,total:6550});
 });
 it('counts distinct completed stages across legacy and current records, not repeat clears or unlocked stages',()=>{
  expect(completedPatrolStages({stage_01:[true],stage_02:[false,true]},[{characterId:'player',stageId:'stage_01',stars:[true,false,false]}],['stage_01','stage_03','bad'])).toEqual(['stage_01','stage_03']);
  expect(completedPatrolStages(null,null,null)).toEqual([]);
 });
 it('rejects locked and corrupt choices and unlocks independent backgrounds/rules at milestones',()=>{
  expect(availablePinballChoice({theme:'steelworks',rule:'precision'},1)).toEqual({theme:'factory',rule:'classic'});
  expect(availablePinballChoice({theme:'harbor',rule:'rhythm'},1)).toEqual({theme:'harbor',rule:'rhythm'});
  expect(availablePinballChoice({theme:'steelworks',rule:'rush'},3)).toEqual({theme:'steelworks',rule:'rush'});
  expect(availablePinballChoice({theme:'harbor',rule:'precision'},5)).toEqual({theme:'harbor',rule:'precision'});
 });
 it('grows pinball credits within limits and keeps every practice rule unrewarded',()=>{
  expect(pinballRewardBudget(NaN)).toEqual({base:100,cap:400});expect(pinballRewardBudget(50)).toEqual({base:300,cap:1200});
  const e=new SurvivorsPinballEngine('bonus',{clears:3});e.launch();expect(e.state.earned).toBe(160);
  for(const rule of ['classic','rhythm','rush','precision'] as const){const practice=new SurvivorsPinballEngine('practice',{rule,clears:50});practice.launch();[0,1,2].forEach(i=>hit(practice,i));expect(practice.state.score).toBeGreaterThan(0);expect(practice.finish()).toBe(0);}
 });
 it('rush rules start real three-ball action after two lamps and extend its duration',()=>{
  const rush=new SurvivorsPinballEngine('bonus',{rule:'rush',clears:3});rush.launch();hit(rush,0);hit(rush,1);expect(rush.state.extraBalls).toHaveLength(2);expect(rush.state.rushTime).toBe(12);
  const classic=new SurvivorsPinballEngine();classic.launch();hit(classic,0);hit(classic,1);expect(classic.state.extraBalls).toHaveLength(0);
 });
 it('rhythm widens the skill window and precision pays more for real timed contact',()=>{
  const rhythm=new SurvivorsPinballEngine('bonus',{rule:'rhythm',clears:1});rhythm.launch();rhythm.state.elapsed=3;hit(rhythm,0);expect(rhythm.state.skillTarget).toBe(0);expect(rhythm.state.calloutPoints).toBe(500);
  const precision=new SurvivorsPinballEngine('bonus',{rule:'precision',clears:5});precision.launch();Object.assign(precision.state,{x:245,y:743,vx:0,vy:100});precision.update(1/240,{...idle,left:true});expect(precision.state.score).toBe(500);expect(precision.state.calloutPoints).toBe(500);
 });
});
