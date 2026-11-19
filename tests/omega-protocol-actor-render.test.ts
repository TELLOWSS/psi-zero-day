import {describe,it,expect} from 'vitest';
import {omegaFieldHeading,OMEGA_DIRECTIONS,drawOmegaProtocolActor} from '../src/ui/omega-protocol-actor-render';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';
describe('OMEGA PROCEDURAL actor QA (not approved AIRA art)',()=>{
 it('maps all eight user movement headings into distinct full-view poses',()=>{
  const vectors=[
   [1,0], [1,1], [0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1],
  ] as const;
  const actual=vectors.map(([x,y])=>omegaFieldHeading(x,y));
  expect(actual).toEqual([...OMEGA_DIRECTIONS]);
  expect(new Set(actual).size).toBe(8);
  expect(omegaFieldHeading(0,0)).toBe('S');
  expect(omegaFieldHeading(NaN,0)).toBe('S');
 });
 it('makes side and diagonal upper-body silhouettes legible without moving feet',()=>{
  const draw=(facingX:number,facingY:number)=>{
   const scales:Array<[number,number]>=[];
   const events:string[]=[];
   const ctx=new Proxy({},{
    get(_target,key){return (...args:unknown[])=>{
     events.push(String(key));
     if(key==='scale')scales.push(args as [number,number]);
    };},
    set(){return true;},
   }) as unknown as CanvasRenderingContext2D;
   drawOmegaProtocolActor(ctx,{facingX,facingY,moving:false,
    time:1,dashing:false,shooting:false});
   return {scales,events};
  };
  const east=draw(1,0),diagonal=draw(1,1),front=draw(0,1),west=draw(-1,0);
  expect(east.scales).toContainEqual([.73,1]);
  expect(diagonal.scales).toContainEqual([.88,1]);
  expect(front.scales).toContainEqual([1,1]);
  expect(west.scales).toContainEqual([-1,1]);
  expect(west.scales).toContainEqual([.73,1]);
  // The ankle and sole geometry must be drawn before upper-body scaling.
  const firstScale=east.events.indexOf('scale');
  const sole=east.events.indexOf('fillRect');
  expect(firstScale).toBeGreaterThan(sole);
 });
 it('uses actual player input for cosmetic facing without affecting saved combat upgrades',()=>{
  const s=new OmegaProtocolCombatSession(1001,50,false,{fieldTraversal:true});
  expect(s.facing).toEqual({x:0,y:1});
  s.update(1/60,{moveX:1,moveY:-1,triggerAction:false});
  expect(omegaFieldHeading(s.facing.x,s.facing.y)).toBe('NE');
  expect(s.moving).toBe(true);
  s.update(1/60,{moveX:0,moveY:0,triggerAction:false});
  expect(s.moving).toBe(false);
  expect(omegaFieldHeading(s.facing.x,s.facing.y)).toBe('NE');
  expect(s.run.owned).toEqual({});
 });
 it('keeps AIRA signature silhouette and actual gun VFX distinct across all eight headings',()=>{
  const inputs=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]] as const;
  const draw=(facingX:number,facingY:number,shooting=false)=>{
   const calls:Array<{method:string;args:unknown[]}>= [];
   const ctx=new Proxy({},{
    get(_t,key){return (...args:unknown[])=>calls.push({method:String(key),args});},
    set(){return true;},
   }) as unknown as CanvasRenderingContext2D;
   drawOmegaProtocolActor(ctx,{facingX,facingY,moving:true,
    time:1.25,dashing:false,shooting});
   return calls;
  };
  for(const [x,y] of inputs){
   const idle=draw(x,y),fire=draw(x,y,true);
   // 2 curved high-ponytail layers + magenta braid detail,
   // orange eyewear, white/black tactical jacket and independent radio.
   expect(idle.filter(v=>v.method==='bezierCurveTo').length).toBeGreaterThanOrEqual(6);
   // Front: two amber lenses. Side: one large lens, rear: no eye lens.
   const lens4=idle.filter(v=>v.method==='arc'&&v.args[2]===4).length;
   expect(lens4).toBe(x===0&&y===1?2:0);
   const muzzle=(records:typeof idle)=>
    records.filter(v=>v.method==='arc'&&v.args[2]===5.5).length;
   expect(muzzle(idle)).toBe(0);
   expect(muzzle(fire)).toBe(1);
   // No draw operation is allowed to mutate the engine/player position.
   expect(idle.some(v=>v.method==='drawImage')).toBe(false);
  }
 });
 it('visually advances the procedural terminal pose with frozen gameTime',()=>{
  const draw=(actionAge:number)=>{
   const calls:Array<{method:string;args:unknown[]}>= [];
   const ctx=new Proxy({},{
    get(_target,key){return (...args:unknown[])=>{
     calls.push({method:String(key),args});
    };},
    set(){return true;},
   }) as unknown as CanvasRenderingContext2D;
   drawOmegaProtocolActor(ctx,{
    facingX:1,facingY:0,moving:false,time:12,
    dashing:false,shooting:false,finished:true,actionAge,
   });
   return calls;
  };
  const first=draw(0),last=draw(.2),steady=draw(999);
  const completionRings=(calls:typeof first)=>
   calls.filter(c=>c.method==='arc'&&typeof c.args[2]==='number'&&
    (c.args[2] as number)>=30&&(c.args[2] as number)<=42);
  expect(completionRings(first).length).toBeGreaterThanOrEqual(1);
  expect(completionRings(last).length).toBeGreaterThanOrEqual(1);
  expect(completionRings(first).map(x=>x.args)).not.toEqual(
   completionRings(last).map(x=>x.args));
  expect(completionRings(last).map(x=>x.args)).toEqual(
   completionRings(steady).map(x=>x.args));
 });

});
