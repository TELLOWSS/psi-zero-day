import {describe,it,expect} from 'vitest';
import {OmegaGroundedGait} from '../src/ui/omega-protocol-grounded-gait';
import {drawOmegaProtocolActor} from '../src/ui/omega-protocol-actor-render';
import {omegaSpriteFrameForView} from '../src/ui/omega-protocol-art-slot';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';

const base={facingX:1,facingY:0,moving:true,time:8,dashing:false,shooting:false};
describe('OMEGA combat character moves feet from actual post-collision Watch position',()=>{
 it('world-locks a stance sole while physically running and lifts on swing',()=>{
  const track=new OmegaGroundedGait();
  track.advance({x:100,y:300},0,1);
  let oldGroundX:number|null=null;
  let stance=0,swing=0;
  for(let i=1;i<=300;i++){
   const world={x:100+2*i,y:300};
   const gait=track.advance(world,i/60,1);
   expect(gait.active).toBe(true);
   expect(Number.isFinite(gait.left.x)).toBe(true);
   expect(Number.isFinite(gait.left.y)).toBe(true);
   if(gait.left.planted){
    const x=world.x-.22*world.y+gait.left.x;
    if(oldGroundX!==null)expect(x).toBeCloseTo(oldGroundX,7);
    oldGroundX=x;stance++;
   }else{
    oldGroundX=null;swing++;
   }
  }
  expect(stance).toBeGreaterThan(150);
  expect(swing).toBeGreaterThan(50);
 });
 it('keeps ankle reach plausible and emits only true one-shot plant events',()=>{
  const track=new OmegaGroundedGait();
  track.advance({x:100,y:300},0,1);
  let plantedEvents=0,heldEvents=0,maxReach=0;
  for(let i=1;i<=300;i++){
   const position={x:100+i*2,y:300};
   const sample=track.advance(position,i/60,1);
   if(sample.active){
    maxReach=Math.max(maxReach,Math.abs(sample.left.x),Math.abs(sample.right.x));
   }
   if(sample.left.landed||sample.right.landed){
    plantedEvents++;
    const hold=track.advance(position,i/60+1/120,1);
    if(hold.left.landed||hold.right.landed)heldEvents++;
    expect(hold.phase).toBe(sample.phase);
   }
  }
  // Source operator has ~33-unit visible ankle/knee reach; the previous
  // 64-unit stride let one planted foot drift 37 world units behind her.
  expect(maxReach).toBeLessThan(33);
  expect(plantedEvents).toBeGreaterThan(10);
  expect(heldEvents).toBe(0);
 });
 it('locks world stance and bounds visible foot reach in all eight directions',()=>{
  const vectors=[
   [1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1],
  ] as const;
  for(const [dx,dy] of vectors){
   const track=new OmegaGroundedGait();
   track.advance({x:700,y:450},0,1);
   let previous:{x:number;y:number}|null=null;
   let landings=0,maxRadius=0;
   for(let i=1;i<=180;i++){
    const world={x:700+2*dx*i,y:450+2*dy*i};
    const pose=track.advance(world,i/60,1);
    expect(pose.active).toBe(true);
    maxRadius=Math.max(maxRadius,
     Math.hypot(pose.left.x,pose.left.y),Math.hypot(pose.right.x,pose.right.y));
    if(pose.left.landed||pose.right.landed)landings++;
    if(pose.left.planted){
     const planted={x:world.x-.22*world.y+pose.left.x,y:.78*world.y+pose.left.y};
     if(previous)expect(Math.hypot(planted.x-previous.x,planted.y-previous.y))
      .toBeLessThan(1e-5);
     previous=planted;
    }else previous=null;
   }
   expect(maxRadius).toBeLessThan(33);
   expect(landings).toBeGreaterThan(10);
  }
 });
 it('holds idle while a joystick pushes against solid cover',()=>{
  const track=new OmegaGroundedGait();
  track.advance({x:100,y:300},0,1);
  const running=track.advance({x:104,y:300},1/60,1);
  expect(running.active).toBe(true);
  const blocked=track.advance({x:104,y:300},2/60,1);
  // 120Hz renderer may observe a zero-displacement render between two
  // 60Hz physics steps: keep the last POSE but never advance it.
  expect(blocked.active).toBe(true);
  expect(blocked.phase).toBe(running.phase);
  expect(blocked.distanceTravelled).toBe(running.distanceTravelled);
  const again=track.advance({x:104,y:300},3/60,1);
  expect(again.phase).toBe(running.phase);
  const wallStop=track.advance({x:104,y:300},.15,1);
  expect(wallStop.active).toBe(false);
  const future=omegaSpriteFrameForView({...base,gait:wallStop});
  expect(future.frame).toBe(0); // prolonged wall contact returns to idle
 });
 it('is distance-driven and independent of 30fps/60fps visual render cadence',()=>{
  const sixty=new OmegaGroundedGait(),thirty=new OmegaGroundedGait();
  sixty.advance({x:100,y:200},0,1);
  thirty.advance({x:100,y:200},0,1);
  let pose60=sixty.advance({x:100,y:200},0,1);
  let pose30=thirty.advance({x:100,y:200},0,1);
  for(let i=1;i<=240;i++)pose60=sixty.advance({x:100+2*i,y:200},i/60,1);
  for(let i=1;i<=120;i++)pose30=thirty.advance({x:100+4*i,y:200},i/30,1);
  expect(pose60.distanceTravelled).toBeCloseTo(480);
  expect(pose30.distanceTravelled).toBeCloseTo(480);
  expect(pose60.phase).toBeCloseTo(pose30.phase,8);
  expect(omegaSpriteFrameForView({...base,gait:pose60}).frame).toBe(
   omegaSpriteFrameForView({...base,gait:pose30}).frame);
 });
 it('rejects teleports and stale frame times, clears stance on dash and room changes',()=>{
  const track=new OmegaGroundedGait();
  track.advance({x:100,y:200},0,1);
  track.advance({x:104,y:200},.016,1);
  const dash=track.advance({x:115,y:200},.032,1,true);
  expect(dash.active).toBe(false);
  const restart=track.advance({x:116,y:200},.048,1);
  expect(restart.active).toBe(true);
  expect(Math.abs(restart.left.x)).toBeLessThan(25);
  const teleport=track.advance({x:1200,y:200},.064,1);
  expect(teleport.phase).toBe(0);
  expect(teleport.active).toBe(false);
  const next=track.advance({x:150,y:450},.08,2);
  expect(next.phase).toBe(0);
  expect(next.active).toBe(false);
  expect(track.advance({x:NaN,y:20},.1,2).active).toBe(false);
  expect(track.advance({x:150,y:450},.1,2).active).toBe(false);
 });
 it('uses the real field/Watch collision correction so pushing against cargo cannot animate running',()=>{
  const session=new OmegaProtocolCombatSession(20261108,10,false,{fieldTraversal:true});
  const plan=session.field?.plan;
  expect(plan).toBeDefined();
  const cargo=plan!.obstacles.find(o=>o.kind==='container')!;
  session.engine.state.hazards=[]; // combat bypass ONLY for isolated collision test
  const player=session.engine.state.player;
  player.x=cargo.x-21;player.y=cargo.y+cargo.height/2;
  const track=new OmegaGroundedGait();
  track.advance(player,session.engine.state.gameTime,session.plan.wave);
  for(let i=0;i<12;i++){
   session.update(1/60,{moveX:1,moveY:0,triggerAction:false});
   const pose=track.advance(player,session.engine.state.gameTime,session.plan.wave,
    Boolean(player.isDashing));
   expect(player.x).toBeLessThanOrEqual(cargo.x-21+1e-3);
   expect(pose.active).toBe(false);
  }
  // Outside the obstacle's physical height, the same actual input may move.
  player.y=cargo.y-50;
  const away=new OmegaGroundedGait();
  away.advance(player,session.engine.state.gameTime,session.plan.wave);
  session.update(1/60,{moveX:1,moveY:0,triggerAction:false});
  const pose=away.advance(player,session.engine.state.gameTime,session.plan.wave);
  expect(pose.active).toBe(true);
 });
 it('the renderer consumes grounded foot positions without moving collision state',()=>{
  const calls:Array<{name:string;args:unknown[]}>= [];
  const ctx=new Proxy({},{
   get(_target,key){return (...args:unknown[])=>calls.push({name:String(key),args});},
   set(){return true},
  }) as unknown as CanvasRenderingContext2D;
  const track=new OmegaGroundedGait();
  track.advance({x:100,y:250},0,1);
  const gait=track.advance({x:102,y:250},1/60,1);
  drawOmegaProtocolActor(ctx,{...base,gait});
  expect(calls.filter(c=>c.name==='lineTo').length).toBeGreaterThan(10);
  expect(calls.filter(c=>c.name==='drawImage')).toHaveLength(0);
  const held=track.advance({x:102,y:250},2/60,1);
  expect(held.phase).toBe(gait.phase);
  const stopped=track.advance({x:102,y:250},.2,1);
  expect(stopped.active).toBe(false);
  expect(omegaSpriteFrameForView({...base,gait:stopped}).frame).toBe(0);
 });
});
