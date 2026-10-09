import {describe,it,expect} from 'vitest';
import {SurvivorsPinballEngine,PINBALL_BUMPERS} from '../src/engine/survivors-pinball-engine';
const idle={left:false,right:false,assist:false};
const hit=(e:SurvivorsPinballEngine,i:number)=>{const b=PINBALL_BUMPERS[i]!;Object.assign(e.state,{x:b.x,y:b.y+b.r+10,vx:0,vy:-200});e.update(.001,idle);};
describe('manual skill, real multiball rush and unrewarded practice',()=>{
 it('varies launch velocity with bounded strength and preserves the default trajectory',()=>{
  const low=new SurvivorsPinballEngine(),high=new SurvivorsPinballEngine(),normal=new SurvivorsPinballEngine(),invalid=new SurvivorsPinballEngine();low.launch(-1);high.launch(2);normal.launch();invalid.launch(NaN);expect(high.state.vy).toBeLessThan(low.state.vy);expect(high.state.vx).toBeLessThan(low.state.vx);expect(normal.state.vy).toBe(-1080);expect(invalid.state.vy).toBe(normal.state.vy);
 });
 it('keeps paddles stationary without input and rewards a timely manual contact once',()=>{
  const e=new SurvivorsPinballEngine();e.launch();e.update(.1,idle);expect(e.state.leftAngle).toBe(.35);expect(e.state.rightAngle).toBe(Math.PI-.35);
  Object.assign(e.state,{x:245,y:743,vx:0,vy:100});e.update(1/240,{...idle,left:true});expect(e.state.perfects).toBe(1);expect(e.state.score).toBe(250);
  Object.assign(e.state,{x:245,y:743,vx:0,vy:100});e.update(1/240,{...idle,left:true});expect(e.state.perfects).toBe(1);
  const automatic=new SurvivorsPinballEngine();automatic.launch();Object.assign(automatic.state,{x:245,y:690,vx:0,vy:650});automatic.update(.04,{...idle,assist:true});expect(automatic.state.perfects).toBe(0);
 });
 it('awards skillshot only for the first matching bumper in the launch window',()=>{
  const e=new SurvivorsPinballEngine();e.launch();hit(e,0);expect(e.state.score).toBe(600);expect(e.state.callout).toBe('skillshot');
  const missed=new SurvivorsPinballEngine();missed.launch();hit(missed,1);expect(missed.state.score).toBe(100);
 });
 it('creates three moving balls, a rush jackpot and spends only the original chance',()=>{
  const e=new SurvivorsPinballEngine();e.launch();[0,1,2].forEach(i=>hit(e,i));expect(e.state.extraBalls).toHaveLength(2);expect(e.state.rushTime).toBeGreaterThan(9);expect(e.state.ball).toBe(1);
  const positions=e.state.extraBalls.map(b=>[b.x,b.y]);e.update(.1,idle);expect(e.state.extraBalls.map(b=>[b.x,b.y])).not.toEqual(positions);
  for(let i=0;i<2;i++)e.update(.1,idle);[0,1,2].forEach(i=>hit(e,i));expect(e.state.jackpots).toBeGreaterThanOrEqual(1);expect(e.state.effects.some(f=>f.kind==='jackpot')).toBe(true);
  e.state.y=870;e.update(.001,idle);expect(e.state.phase).toBe('playing');expect(e.state.ball).toBe(1);
  e.state.remaining=.001;e.update(.01,idle);expect(e.state.phase).toBe('between');expect(e.state.extraBalls).toHaveLength(0);
 });
 it('removes extra balls when rush expires while retaining the main ball',()=>{
  const e=new SurvivorsPinballEngine();e.launch();e.state.rushTime=.005;e.state.extraBalls=[{x:300,y:550,vx:0,vy:0}];e.update(.01,idle);
  expect(e.state.rushTime).toBe(0);expect(e.state.extraBalls).toHaveLength(0);expect(e.state.phase).toBe('playing');
 });
 it('gives side-panel rebound, limits nudges and locks paddles after repeated shaking',()=>{
  const e=new SurvivorsPinballEngine();e.launch();Object.assign(e.state,{x:135,y:513,vx:-500,vy:0});e.update(.001,idle);expect(e.state.score).toBe(50);expect(e.state.vx).toBeGreaterThan(0);
  const n=new SurvivorsPinballEngine();n.launch();expect(n.nudge()).toBe(true);expect(n.state.nudgesLeft).toBe(2);expect(n.state.score).toBe(0);
  expect(n.nudge()).toBe(false);expect(n.state.tiltTime).toBe(1.5);n.update(.01,{...idle,left:true});expect(n.state.leftAngle).toBe(.35);
  n.state.tiltTime=0;n.state.nudgeCooldown=0;expect(n.nudge()).toBe(true);n.state.nudgeCooldown=0;expect(n.nudge()).toBe(true);expect(n.state.nudgesLeft).toBe(0);expect(n.nudge()).toBe(false);
 });
 it('never earns or settles PSI in practice even with skillshots and crane rush',()=>{
  const e=new SurvivorsPinballEngine('practice');e.launch();[0,1,2].forEach(i=>hit(e,i));expect(e.state.score).toBeGreaterThan(1000);expect(e.state.earned).toBe(0);expect(e.finish()).toBe(0);expect(e.finish()).toBe(0);
 });
});
