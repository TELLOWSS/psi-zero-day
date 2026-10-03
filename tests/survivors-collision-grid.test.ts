import { describe, expect, it, vi } from 'vitest';
import type { Hazard, Projectile } from '../src/domain/patrol-survivors';
import { SurvivorsCollisionGrid } from '../src/engine/survivors-collision-grid';
import { seededRandom, sweptCircle } from '../src/engine/survivors-simulation';
import { createInitialSurvivorsState, SurvivorsEngine } from '../src/engine/patrol-survivors-engine';

const hazard=(id:string,x:number,y:number,radius=12):Hazard=>({id,type:'UNHELMETED',x,y,radius,hp:1000,maxHp:1000,speed:0,damage:0,expValue:1});
const projectile=(id:string,x:number,y:number):Projectile=>({id,kind:'radio',x,y,vx:0,vy:0,radius:20,damage:10,duration:2,pierce:5});
function cleanEngine() {
  const e=new SurvivorsEngine(createInitialSurvivorsState(),42);e.start();e.state.player.critRate=0;e.state.interactiveHazards=[];
  for(const key of Object.keys(e.state.activePerks) as Array<keyof typeof e.state.activePerks>) e.state.activePerks[key]=0;
  return e;
}
describe('shooting collision broad phase and directed pierce',()=>{
  it('contains every exact swept hit across random paths, negative coordinates and large risks',()=>{
    const random=seededRandom(72);
    const hazards=Array.from({length:200},(_,i)=>hazard(String(i),random()*1600-100,random()*1100-100,random()*80+1));
    hazards.push(hazard('large',700,450,500));
    const grid=new SurvivorsCollisionGrid(hazards);
    for(let i=0;i<200;i++) {
      const ax=random()*1600-100,ay=random()*1100-100,bx=random()*1600-100,by=random()*1100-100,radius=random()*100;
      const exact=hazards.filter(h=>sweptCircle(ax,ay,bx,by,h.x,h.y,h.radius+radius));
      const candidates=grid.candidates(ax,ay,bx,by,radius);
      expect(exact.every(h=>candidates.includes(h))).toBe(true);
      expect(candidates.filter(h=>sweptCircle(ax,ay,bx,by,h.x,h.y,h.radius+radius))).toEqual(exact);
    }
  });
  it('reduces local candidates below 20% of a 400-risk full scan and deduplicates cell edges',()=>{
    const hazards=Array.from({length:400},(_,i)=>hazard(String(i),(i%20)*70,Math.floor(i/20)*45));
    const candidates=new SurvivorsCollisionGrid(hazards).candidates(600,350,680,390,20);
    expect(candidates.length).toBeLessThan(hazards.length*0.2);
    expect(new Set(candidates).size).toBe(candidates.length);
    const indices=candidates.map(h=>hazards.indexOf(h));expect(indices).toEqual([...indices].sort((a,b)=>a-b));
  });
  it('preserves complete engine outcomes compared with a full scan under crowd load',()=>{
    const run=()=>{
      const e=cleanEngine();
      e.state.hazards=Array.from({length:160},(_,i)=>hazard(String(i),300+(i%10)*35,200+Math.floor(i/10)*35));
      e.state.projectiles=Array.from({length:80},(_,i)=>({...projectile(String(i),250,200+i*20),vx:600}));
      for(let i=0;i<30;i++)e.update(1/60,{moveX:0,moveY:0});return e.state;
    };
    const optimized=run();
    const spy=vi.spyOn(SurvivorsCollisionGrid.prototype,'candidates').mockImplementation(function(this:SurvivorsCollisionGrid){
      return (this as unknown as {hazards:Hazard[]}).hazards;
    });
    try {expect(run()).toEqual(optimized);}finally{spy.mockRestore();}
  });
  it('a directed signal hits an overlapping risk once and retains pierce for a different risk',()=>{
    const e=cleanEngine();e.state.hazards=[hazard('first',100,100)];
    const p=projectile('signal',100,100);e.state.projectiles=[p];
    for(let i=0;i<6;i++)e.update(1/60,{moveX:0,moveY:0});
    expect(e.state.hazards[0]!.hp).toBe(990);expect(p.pierce).toBe(4);
    e.state.hazards.push(hazard('second',100,100));e.update(1/60,{moveX:0,moveY:0});
    expect(e.state.hazards[1]!.hp).toBe(990);expect(p.pierce).toBe(3);
  });
  it('continuous spray retains its established repeated damage cadence',()=>{
    const e=cleanEngine();e.state.hazards=[hazard('target',100,100)];
    e.state.projectiles=[{...projectile('spray',100,100),kind:'extinguisher',damage:1}];
    for(let i=0;i<6;i++)e.update(1/60,{moveX:0,moveY:0});
    expect(e.state.hazards[0]!.hp).toBe(995);
  });
  it('auto aim skips controlled targets and debris recovery',()=>{
    const e=cleanEngine();e.state.activePerks.radio_boost=1;
    e.state.hazards=[{...hazard('controlled',701,450),hp:0}, {...hazard('spent',702,450),type:'FALLING_DEBRIS',motion:{phase:'spent',timer:0.4,directionX:0,directionY:0}},hazard('live',700,550)];
    e.update(1/60,{moveX:0,moveY:0});
    const shot=e.state.projectiles.find(p=>p.kind==='radio')!;
    expect(shot.vx).toBeCloseTo(0);expect(shot.vy).toBeGreaterThan(0);
  });
});
