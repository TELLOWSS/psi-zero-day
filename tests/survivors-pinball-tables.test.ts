import {describe,it,expect} from 'vitest';
import {PATROL_STAGE_IDS} from '../src/domain/patrol-survivors';
import {PINBALL_TABLE_IDS,PINBALL_TABLES,pinballTableProgress,nextPinballTable} from '../src/domain/survivors-pinball-tables';
import {availablePinballChoice} from '../src/domain/survivors-recreation';
import {SurvivorsPinballEngine} from '../src/engine/survivors-pinball-engine';
import {PinballSite} from '../src/engine/survivors-pinball-site';
const idle={left:false,right:false,assist:false};
describe('ten industrial tables and exact five-stage blocks',()=>{
 it('has ten distinct physical layouts and exact milestone blocks',()=>{
  expect(PINBALL_TABLE_IDS).toHaveLength(11);expect(new Set(PINBALL_TABLE_IDS.map(id=>JSON.stringify(PINBALL_TABLES[id].bumper))).size).toBe(11);
  for(const id of PINBALL_TABLE_IDS.slice(1)){const end=PINBALL_TABLES[id].unlock;expect(pinballTableProgress(id,PATROL_STAGE_IDS.slice(0,end)).unlocked).toBe(true);expect(pinballTableProgress(id,PATROL_STAGE_IDS.filter((_,i)=>i!==end-1)).missing).toHaveLength(1);expect(pinballTableProgress(id,Array(50).fill(PATROL_STAGE_IDS[end-2])).unlocked).toBe(false);}
  expect(nextPinballTable(PATROL_STAGE_IDS.slice(0,5))).toBe('cargo');expect(nextPinballTable(PATROL_STAGE_IDS)).toBeUndefined();
 });
 it('migrates old themes only after the matching real block is complete',()=>{
  expect(availablePinballChoice({theme:'harbor'},50,[]).theme).toBe('factory');expect(availablePinballChoice({theme:'harbor'},10,PATROL_STAGE_IDS.slice(0,10)).theme).toBe('cargo');expect(availablePinballChoice({theme:'steelworks'},15,PATROL_STAGE_IDS.slice(0,15)).theme).toBe('foundry');
  expect(new SurvivorsPinballEngine('practice',{table:'zeroday',clears:50}).site.id).toBe('factory');
 });
 for(const id of PINBALL_TABLE_IDS.slice(1))it(id+' fires only from actual manual perfect contact; shots really damage targets',()=>{
  const e=new SurvivorsPinballEngine('practice',{table:id,clears:50,completedStages:PATROL_STAGE_IDS});e.launch();Object.assign(e.state,{x:245,y:743,vx:0,vy:100});e.update(1/240,{...idle,left:true});expect(e.state.perfects).toBe(1);expect(e.site.shots.length).toBeGreaterThan(0);
  const hp=e.site.hp.reduce((a,b)=>a+b,0);for(let i=0;i<240;i++)e.site.update(1/240,()=>{},[],()=>{});expect(e.site.hp.reduce((a,b)=>a+b,0)).toBeLessThan(hp);expect(e.state.earned).toBe(0);
  const assisted=new SurvivorsPinballEngine('practice',{table:id,clears:50,completedStages:PATROL_STAGE_IDS});assisted.launch();Object.assign(assisted.state,{x:245,y:690,vx:0,vy:650});assisted.update(.04,{...idle,assist:true});expect(assisted.site.shots).toHaveLength(0);
 });
 it('requires ordered relays; wrong hits bounce without damage, chain links damage actual adjacent nodes',()=>{
  const site=new PinballSite('power'),t=site.layout.targets[1]!;site.ball({x:t.x,y:t.y+29,vx:0,vy:-200},.001,()=>{},[],()=>{});expect(site.hp[1]).toBe(2);
  site.active=8;site.hp[0]=1;site.fire({x:180,y:240,vx:0,vy:0});for(let i=0;i<15;i++)site.update(.004,()=>{},[],()=>{});expect(site.hp[0]).toBe(0);expect(site.hp[1]).toBe(1);
 });
 it('captures a tower ball, holds both feet of its trajectory and releases a real high-speed drop',()=>{
  const e=new SurvivorsPinballEngine('practice',{table:'tower',clears:50,completedStages:PATROL_STAGE_IDS});e.launch();Object.assign(e.state,{x:300,y:210,vx:80,vy:100});e.update(.001,idle);e.update(.1,idle);expect(e.state.x).toBe(300);expect(e.state.y).toBe(210);expect(e.state.vy).toBe(0);
  for(let i=0;i<4;i++)e.update(.1,idle);expect(e.site.capture).toBe(0);expect(e.state.vy).toBeGreaterThan(900);expect(e.site.hp).toEqual([2,3,2]);for(let i=0;i<4;i++)e.update(.1,idle);expect(e.site.hp.every((hp,i)=>hp<e.site.layout.targets[i]!.hp)).toBe(true);
 });
 it('switches real water and rail guide capsules; crane adds balls and demolition chains a collapse',()=>{
  for(const id of ['water','rail'] as const){const site=new PinballSite(id),before=JSON.stringify(site.rails);site.active=8;site.hp[0]=1;const target=site.layout.targets[0]!;site.fire({x:target.x,y:target.y+50,vx:0,vy:0});site.update(.05,()=>{},[],()=>{});expect(JSON.stringify(site.rails)).not.toBe(before);}
  const crane=new PinballSite('cargo'),balls:import('../src/engine/survivors-pinball-engine').PinballBall[]=[];for(let i=0;i<2;i++){crane.laneCooldown[0]=0;crane.ball({x:450,y:230,vx:0,vy:0},.001,()=>{},balls,()=>{});}expect(balls).toHaveLength(2);expect(crane.active).toBe(8);
  const site=new PinballSite('demolition');site.active=8;site.hp[0]=1;site.fire({x:200,y:240,vx:0,vy:0});site.update(.05,()=>{},[],()=>{});expect(site.hp.slice(0,2)).toEqual([0,0]);expect(site.fragments.length).toBe(8);
 });
 for(const id of PINBALL_TABLE_IDS)for(const fps of [30,60,120])it(id+' bounded natural physics at '+fps+' FPS and practice pays zero',()=>{
  const e=new SurvivorsPinballEngine('practice',{table:id,clears:50,completedStages:PATROL_STAGE_IDS});for(let attempt=0;attempt<3;attempt++){e.launch();for(let i=0;i<fps*31&&e.state.phase==='playing';i++){e.update(1/fps,{...idle,assist:true});for(const b of [e.state,...e.state.extraBalls]){expect(Number.isFinite(b.x+b.y+b.vx+b.vy)).toBe(true);expect(Math.hypot(b.vx,b.vy)).toBeLessThanOrEqual(1300.01);}expect(e.state.extraBalls.length).toBeLessThanOrEqual(4);expect(e.site.shots.length).toBeLessThanOrEqual(16);}}expect(e.state.phase).toBe('finished');expect(e.finish()).toBe(0);
 });
});
it('requires alternating conveyor lanes and fires foundry fans only while powered',()=>{
 const site=new PinballSite('conveyor');const enter=(i:number)=>{site.laneCooldown[i]=0;const lane=site.layout.lanes[i]!;site.ball({x:lane.x,y:lane.y,vx:0,vy:0},.001,()=>{},[],()=>{});};enter(0);enter(0);expect(site.charge).toBe(1);enter(1);enter(0);expect(site.active).toBe(8);
 const furnace=new PinballSite('foundry');furnace.fire({x:300,y:600,vx:0,vy:0});expect(furnace.shots).toHaveLength(1);furnace.active=8;furnace.fire({x:300,y:600,vx:0,vy:0});expect(furnace.shots).toHaveLength(4);
});
it('tunnel shots pierce aligned rocks and Zero Day destruction changes the physical phase',()=>{
 const tunnel=new PinballSite('tunnel');tunnel.active=8;tunnel.fire({x:300,y:600,vx:0,vy:0});
 // Explicit aligned path fixture for the authored two-rock column.
 Object.assign(tunnel.shots[0]!,{vx:0,vy:-1100});for(let i=0;i<120;i++)tunnel.update(.004,()=>{},[],()=>{});expect(tunnel.hp[3]).toBe(0);expect(tunnel.hp[1]).toBeLessThan(3);
 const site=new PinballSite('zeroday');site.hp[0]=1;site.fire({x:210,y:240,vx:0,vy:0});site.update(.05,()=>{},[],()=>{});expect(site.phase).toBe(1);
});
it('preserves crane capture when a surviving extra ball becomes the primary ball',()=>{
 const site=new PinballSite('tower'),extra={x:300,y:210,vx:0,vy:0},main={x:0,y:0,vx:0,vy:0};site.ball(extra,.001,()=>{},[],()=>{});site.rebindBall(extra,main);Object.assign(main,extra);expect(site.hold(main)).toBe(true);site.update(.5,()=>{},[],()=>{});expect(main.vy).toBe(1100);
});
it('keeps crane balls when a generic bumper rush expires and caps combined balls at five',()=>{
 const e=new SurvivorsPinballEngine('practice',{table:'cargo',clears:50,completedStages:PATROL_STAGE_IDS});e.launch();e.state.rushTime=.005;e.state.extraBalls=[{x:180,y:570,vx:0,vy:0,source:'site'},{x:380,y:570,vx:0,vy:0,source:'rush'}];e.update(.01,idle);expect(e.state.extraBalls).toHaveLength(1);expect(e.state.extraBalls[0]?.source).toBe('site');
 e.state.extraBalls=Array.from({length:4},(_,i)=>({x:130+i*80,y:600,vx:0,vy:0,source:'site' as const}));e.state.lit=[true,true,false];const b=e.site.layout.bumper[2]!;Object.assign(e.state,{x:b.x,y:b.y+b.r+10,vx:0,vy:-200});e.update(.001,idle);expect(e.state.extraBalls).toHaveLength(4);
});
it('retains new crane balls triggered by an extra ball during a physics step',()=>{
 const e=new SurvivorsPinballEngine('practice',{table:'cargo',clears:50,completedStages:PATROL_STAGE_IDS});e.launch();Object.assign(e.state,{x:300,y:650,vx:0,vy:0});e.site.charge=1;e.state.extraBalls=[{x:450,y:230,vx:0,vy:0,source:'site'}];e.update(.001,idle);expect(e.site.activations).toBe(1);expect(e.state.extraBalls).toHaveLength(3);
});
it('rebuilds destroyed targets during a special so powered shots never wait for the whole special to end',()=>{
 const site=new PinballSite('foundry');site.hp.fill(1);site.active=8;for(let i=0;i<3;i++){const target=site.layout.targets[i]!;site.fire({x:target.x,y:target.y+50,vx:0,vy:0});site.update(.06,()=>{},[],()=>{});}expect(site.hp.every(hp=>hp===0)).toBe(true);expect(site.reloadTime).toBeGreaterThan(0);site.update(1.3,()=>{},[],()=>{});expect(site.active).toBeGreaterThan(0);expect(site.hp).toEqual(site.layout.targets.map(t=>t.hp));site.fire({x:300,y:600,vx:0,vy:0});expect(site.shots.length).toBeGreaterThanOrEqual(3);
});
it('conveyor plates share a physical shot line so the press penetration damages more than one plate',()=>{
 const site=new PinballSite('conveyor');site.fire({x:300,y:600,vx:0,vy:0});for(let i=0;i<110;i++)site.update(.004,()=>{},[],()=>{});expect(site.hp.slice(0,2)).toEqual([1,1]);
});
