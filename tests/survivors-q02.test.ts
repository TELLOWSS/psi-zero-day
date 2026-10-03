import { expect, it } from 'vitest';
import { SurvivorsEngine, createInitialSurvivorsState } from '../src/engine/patrol-survivors-engine';
import { sweptCircle } from '../src/engine/survivors-simulation';
const idle = {moveX: 0, moveY: 0};
it('same seed and scheduled input produce identical state at 30/60/120Hz', () => {
  const run = (hz: number) => {
    const e = new SurvivorsEngine(createInitialSurvivorsState(), 42);e.start();
    for (let second = 0; second < 8; second++) for (let i = 0; i < hz; i++) e.update(1/hz, {moveX: second % 2 ? -1 : 1, moveY: 0});
    return e.state;
  };
  expect(run(30)).toEqual(run(60)); expect(run(120)).toEqual(run(60));
});
it('swept collision catches a small target between high-speed projectile endpoints', () => {
  expect(sweptCircle(0, 0, 100, 0, 50, 0, 2)).toBe(true);
  expect(sweptCircle(0, 0, 100, 0, 50, 5, 2)).toBe(false);
  const e = new SurvivorsEngine(); e.start(); e.state.player.critRate = 0;
  e.state.hazards.push({id:'target',type:'UNHELMETED',x:500,y:400,hp:100,maxHp:100,speed:0,radius:2,damage:0,expValue:0});
  e.state.projectiles.push({id:'fast',kind:'radio',x:450,y:400,vx:6000,vy:0,radius:2,damage:10,duration:1,pierce:1});
  e.update(1/60,idle); expect(e.state.hazards.find(h=>h.id==='target')?.hp).toBe(90);
});
it('area damage and pierce cadence match at all render rates; terminal defeat beats time victory', () => {
  const run=(hz:number)=>{const e=new SurvivorsEngine();e.start();e.state.player.critRate=0;
    e.state.hazards.push({id:'target',type:'UNHELMETED',x:100,y:100,hp:1000,maxHp:1000,speed:0,radius:10,damage:0,expValue:0});
    e.state.projectiles.push({id:'area',kind:'extinguisher',x:100,y:100,vx:0,vy:0,radius:100,damage:1,duration:1,pierce:5});
    for(let i=0;i<hz/2;i++)e.update(1/hz,idle);return e.state.hazards.find(h=>h.id==='target')?.hp;};
  expect(run(30)).toBe(995);expect(run(60)).toBe(995);expect(run(120)).toBe(995);
  const e=new SurvivorsEngine(); e.start();e.state.maxTime=1/60;e.state.player.hp=1;
  e.state.hazards.push({id:'fatal',type:'CRANE_BOSS',x:e.state.player.x,y:e.state.player.y,hp:9999,maxHp:9999,speed:0,radius:30,damage:999,expValue:0});
  e.update(1/60,idle);expect(e.state.phase).toBe('defeat');
});
it('foreground stall catch-up is bounded and pause clears fractional backlog',()=>{
 const e=new SurvivorsEngine();e.start();e.update(10,idle);expect(e.state.gameTime).toBeCloseTo(0.25);
 e.update(1/120,idle);e.setPaused(true);e.setPaused(false);const before=e.state.gameTime;e.update(1/120,idle);expect(e.state.gameTime).toBe(before);
});
