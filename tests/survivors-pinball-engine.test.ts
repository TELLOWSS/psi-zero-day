import {describe,it,expect} from 'vitest';
import {SurvivorsPinballEngine,PINBALL_BUMPERS} from '../src/engine/survivors-pinball-engine';
const idle={left:false,right:false,assist:false};
describe('factory pinball physics and three-ball reward',()=>{
 it('waits for approaching contact and gives a timed assisted stroke instead of holding early',()=>{
  const early=new SurvivorsPinballEngine();early.launch();early.state.x=245;early.state.y=600;early.state.vx=0;early.state.vy=200;
  early.update(.01,{...idle,assist:true});expect(early.state.leftAngle).toBe(.35);
  const assisted=new SurvivorsPinballEngine(),unassisted=new SurvivorsPinballEngine();
  for(const e of [assisted,unassisted]){e.launch();e.state.x=245;e.state.y=690;e.state.vx=0;e.state.vy=650;}
  assisted.update(.04,{...idle,assist:true});unassisted.update(.04,idle);
  expect(assisted.state.vy).toBeLessThan(-300);expect(assisted.state.vy).toBeLessThan(unassisted.state.vy);
 });
 it('avoids long lower-table loops at 30, 60 and 120fps without placing balls or adding points',()=>{
  const outcomes=[];
  for(const fps of [30,60,120]){const e=new SurvivorsPinballEngine();let steps=0,low=0,longest=0;
   while(e.state.phase!=='finished'&&steps++<fps*100){if(e.state.phase==='ready'||e.state.phase==='between'){e.launch();low=0;}
    e.update(1/fps,{...idle,assist:true});e.drainSounds();low=e.state.y>640?low+1/fps:0;longest=Math.max(longest,low);}
   expect(e.state.phase).toBe('finished');expect(longest).toBeLessThan(4);expect(e.state.hits).toBeGreaterThan(10);
   outcomes.push({hits:e.state.hits,score:e.state.score});
  }
  expect(outcomes[0]).toEqual(outcomes[1]);expect(outcomes[1]).toEqual(outcomes[2]);
 });
 it('emits physical contact sounds once and drains them without replaying old events',()=>{
  const e=new SurvivorsPinballEngine();e.launch();e.state.x=300;e.state.y=550;e.state.vx=0;e.state.vy=0;
  e.update(.02,{left:true,right:true,assist:false});
  expect(e.drainSounds().filter(s=>s.kind==='flipper')).toHaveLength(2);
  e.update(.02,{left:true,right:true,assist:false});expect(e.drainSounds().filter(s=>s.kind==='flipper')).toHaveLength(0);
  const b=PINBALL_BUMPERS[2];e.state.x=b.x;e.state.y=b.y+b.r+10;e.state.vy=-200;e.update(.001,idle);
  expect(e.drainSounds().some(s=>s.kind==='metal'&&s.x===b.x)).toBe(true);expect(e.drainSounds()).toEqual([]);
 });
 it('leaves a passable gap above upper bumpers instead of trapping the ball between colliders',()=>{
  const e=new SurvivorsPinballEngine();e.launch();e.state.x=204;e.state.y=152;e.state.vx=240;e.state.vy=0;
  for(let i=0;i<60;i++)e.update(1/120,idle);
  expect(Math.hypot(e.state.x-204,e.state.y-152)).toBeGreaterThan(25);
  expect(e.state.hits).toBeLessThan(4);
 });
 it('allows exactly three balls, keeps rewards and refuses a fourth launch',()=>{
  const e=new SurvivorsPinballEngine();expect(e.state.earned).toBe(0);
  for(let n=1;n<=3;n++){expect(e.launch()).toBe(true);expect(e.launch()).toBe(false);expect(e.state.ball).toBe(n);
   e.state.remaining=.001;e.update(.01,idle);expect(e.state.phase).toBe(n<3?'between':'finished');}
  expect(e.launch()).toBe(false);expect(e.finish()).toBe(100);
 });
 it('protects an early drain once per ball and then counts it as a lost ball',()=>{
  const e=new SurvivorsPinballEngine();e.launch();e.state.y=870;e.update(.01,idle);
  expect(e.state.saves).toBe(1);expect(e.state.phase).toBe('playing');
  e.state.y=870;e.update(.01,idle);expect(e.state.phase).toBe('between');
  e.launch();e.state.y=870;e.update(.01,idle);expect(e.state.saves).toBe(2);
 });
 it('reflects a fast ball without tunnelling and counts one collision only once',()=>{
  const e=new SurvivorsPinballEngine();e.launch();const b=PINBALL_BUMPERS[2];
  e.state.x=b.x;e.state.y=b.y+75;e.state.vx=0;e.state.vy=-1200;e.update(.05,idle);
  expect(e.state.vy).toBeGreaterThan(0);expect(e.state.hits).toBe(1);
  expect(Math.hypot(e.state.x-b.x,e.state.y-b.y)).toBeGreaterThanOrEqual(b.r+11);
  e.update(.01,idle);expect(e.state.hits).toBe(1);
 });
 it('transfers upward paddle motion instead of applying a fake unconditional kick',()=>{
  const moving=new SurvivorsPinballEngine(),resting=new SurvivorsPinballEngine();
  for(const e of [moving,resting]){e.launch();e.state.x=245;e.state.y=743;e.state.vx=0;e.state.vy=100;}
  moving.update(1/240,{...idle,left:true});resting.update(1/240,idle);
  expect(moving.state.vy).toBeLessThan(resting.state.vy-100);
 });
 it('lights three real bumpers for a crane chain and caps the wallet reward',()=>{
  const e=new SurvivorsPinballEngine();e.launch();
  for(let cycle=0;cycle<8;cycle++)for(const b of PINBALL_BUMPERS){
   e.state.x=b.x;e.state.y=b.y+b.r+10;e.state.vx=0;e.state.vy=-200;e.update(.001,idle);
   for(let t=0;t<20;t++){e.state.x=300;e.state.y=550;e.state.vx=0;e.state.vy=0;e.update(.01,idle);}
  }
  expect(e.state.score).toBeGreaterThan(6000);expect(e.state.earned).toBe(400);
  expect(e.state.lit).toEqual([false,false,false]);
  const earned=e.finish();e.update(1,{left:true,right:true,assist:true});expect(e.finish()).toBe(earned);
 });
 it('completes a natural assisted three-ball session with finite bounded physics',()=>{
  const e=new SurvivorsPinballEngine();let steps=0;
  while(e.state.phase!=='finished'&&steps++<12000){if(e.state.phase==='ready'||e.state.phase==='between')e.launch();e.update(1/120,{...idle,assist:true});
   expect([e.state.x,e.state.y,e.state.vx,e.state.vy].every(Number.isFinite)).toBe(true);
  }
  expect(e.state.phase).toBe('finished');expect(e.state.ball).toBe(3);expect(e.state.hits).toBeGreaterThan(3);
  expect(e.state.earned).toBeGreaterThanOrEqual(100);expect(e.state.earned).toBeLessThanOrEqual(400);
 });
 it('ignores invalid time and does not spend waiting time between balls',()=>{
  const e=new SurvivorsPinballEngine();e.launch();const before=JSON.stringify(e.state);
  for(const dt of [NaN,Infinity,0,-1])e.update(dt,idle);expect(JSON.stringify(e.state)).toBe(before);
  e.state.remaining=.001;e.update(.01,idle);const waiting=JSON.stringify(e.state);e.update(.1,idle);expect(JSON.stringify(e.state)).toBe(waiting);
 });
});
