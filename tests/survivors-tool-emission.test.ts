import {it,expect,vi} from 'vitest';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {radioToolOffset,RadioEmissionProjection} from '../src/ui/survivors-tool-emission';
import {actorTorsoPoint} from '../src/ui/survivors-rig-renderer';
import {SpriteMotionTracker,type SpritePose} from '../src/ui/survivors-sprite-motion';
import type {Projectile} from '../src/domain/patrol-survivors';
vi.mock('../src/ui/survivors-wearable-art',()=>({baseToolSocket:(id:string)=>id==='unsupported'?undefined:{x:6,y:-30,size:12}}));
const launch={projectileId:'radio-1',kind:'radio' as const,phase:'launch' as const,x:100,y:200,angle:0,radius:4};
const setup=()=>{
 const state=createInitialSurvivorsState('yoon',undefined,undefined,undefined,{owned:['voice_lens'],equipped:['voice_lens']});
 state.activePerks.radio_boost=1;state.activePerks.safety_drone=0;
 const pose=new SpriteMotionTracker().sample(state.player,0,0,0);
 const actor={naturalWidth:256,src:'unknown'} as HTMLImageElement;
 const projection=new RadioEmissionProjection();return{state,pose,actor,projection};
};
it('uses the carried belt tool and exact torso projection rather than a guessed universal height',()=>{
 const {state,pose,actor}=setup();
 for(let i=0;i<8;i++){
  const p:SpritePose={...pose,facing:i<4?1:-1,directionY:Math.sin(i*Math.PI/4),lean:.02,action:.5};
  expect(radioToolOffset(state,actor,74,p)).toEqual(actorTorsoPoint({x:6,y:-30},p,74,false));
 }
 expect(radioToolOffset(state,undefined,74,pose)).toBeUndefined();
 state.premiumGear!.equipped=[];expect(radioToolOffset(state,actor,74,pose)).toBeUndefined();
 state.premiumGear!.equipped=['voice_lens'];state.activePerks.extinguisher=3;
 expect(radioToolOffset(state,actor,74,pose)).toBeUndefined();
});
it('pins one launch projection across flight/contact without changing engine data or following later movement',()=>{
 const {state,projection}=setup();const shot={id:'radio-1',kind:'radio',x:100,y:200} as Projectile;
 state.projectiles=[shot];const before=JSON.stringify(state),input=JSON.stringify(launch);
 projection.observe(state,[launch],{x:6,y:-30});
 expect(projection.feedback(launch)).toMatchObject({x:106,y:170});
 expect(projection.flightOffset(shot)).toEqual({x:6,y:-30});
 projection.observe(state,[],{x:-8,y:-35});expect(projection.offset('radio-1')).toEqual({x:6,y:-30});
 expect(projection.feedback({...launch,phase:'impact',x:180})).toMatchObject({x:186,y:170});
 expect(JSON.stringify(state)).toBe(before);expect(JSON.stringify(launch)).toBe(input);
 expect(projection.feedback({...launch,worker:true})).toMatchObject({x:100,y:200});
 expect(projection.feedback({...launch,blocked:true})).toMatchObject({x:100,y:200});
});
it('retains terminal contact for its event tick, cleans inactive shots and resets on new run',()=>{
 const {state,projection}=setup();projection.observe(state,[launch],{x:6,y:-30});
 projection.observe(state,[{...launch,phase:'impact'}],undefined);expect(projection.size).toBe(1);
 projection.observe(state,[],undefined);expect(projection.size).toBe(0);
 projection.observe(state,[launch],{x:6,y:-30});projection.observe(setup().state,[],undefined);expect(projection.size).toBe(0);
});
it('bounds projection storage and never binds other weapons or fabricated missing-source offsets',()=>{
 const {state,projection}=setup();projection.observe(state,[launch],undefined);expect(projection.size).toBe(0);
 projection.observe(state,[{...launch,kind:'drone_laser'}],{x:1,y:2});expect(projection.size).toBe(0);
 projection.observe(state,Array.from({length:200},(_,i)=>({...launch,projectileId:String(i)})),{x:1,y:2});
 expect(projection.size).toBe(128);expect(projection.offset('199')).toBeUndefined();
});
