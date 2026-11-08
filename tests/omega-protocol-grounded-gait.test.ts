import {describe,it,expect} from 'vitest';
import {OmegaGroundedGait} from '../src/ui/omega-protocol-grounded-gait';
import {drawOmegaProtocolActor} from '../src/ui/omega-protocol-actor-render';
import {omegaSpriteFrameForView} from '../src/ui/omega-protocol-art-slot';

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
 it('holds idle while a joystick pushes against solid cover',()=>{
  const track=new OmegaGroundedGait();
  track.advance({x:100,y:300},0,1);
  const running=track.advance({x:104,y:300},1/60,1);
  expect(running.active).toBe(true);
  const blocked=track.advance({x:104,y:300},2/60,1);
  expect(blocked.active).toBe(false);
  expect(blocked.phase).toBe(running.phase);
  expect(blocked.distanceTravelled).toBe(running.distanceTravelled);
  const again=track.advance({x:104,y:300},3/60,1);
  expect(again.active).toBe(false);
  const future=omegaSpriteFrameForView({...base,gait:again});
  expect(future.frame).toBe(0); // no fake foot cycling behind a wall
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
  const stopped=track.advance({x:102,y:250},2/60,1);
  expect(omegaSpriteFrameForView({...base,gait:stopped}).frame).toBe(0);
 });
});
