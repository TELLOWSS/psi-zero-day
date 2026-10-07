import {it,expect,vi} from 'vitest';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {carriedTool,drawCarriedEquipment} from '../src/ui/survivors-carried-equipment';
import {baseToolSocket,WEARABLE_PROFILES} from '../src/ui/survivors-wearable-art';
import {SpriteMotionTracker} from '../src/ui/survivors-sprite-motion';
import {applyActorTorsoTransform} from '../src/ui/survivors-rig-renderer';
vi.mock('../src/ui/survivors-equipment-art',async original=>({...await original<typeof import('../src/ui/survivors-equipment-art')>(),drawEquipment:vi.fn(()=>true)}));
import {drawEquipment} from '../src/ui/survivors-equipment-art';
const actor={src:'/assets/player-map.webp',naturalWidth:600,naturalHeight:1400} as HTMLImageElement;
const context=()=>({save:vi.fn(),restore:vi.fn(),scale:vi.fn(),transform:vi.fn(),translate:vi.fn(),rotate:vi.fn()}) as unknown as CanvasRenderingContext2D;
it('animates the carried item on body time during hit-stop and remains still for reduced motion',()=>{
 const state=createInitialSurvivorsState('player'),pose={...new SpriteMotionTracker().sample(state.player,0,0,0),action:1};
 const ctx=context();state.activePerks.radio_boost=1;state.gameTime=0;state.playerMotionTime=0;
 drawCarriedEquipment(ctx,state,actor,74,pose,undefined,undefined);
 state.playerMotionTime=.1;drawCarriedEquipment(ctx,state,actor,74,pose,undefined,undefined);
 expect(vi.mocked(ctx.rotate).mock.calls.at(-1)![0]).toBeLessThan(0);
 drawCarriedEquipment(ctx,state,actor,74,pose,undefined,undefined,true);
 expect(vi.mocked(ctx.rotate).mock.calls.at(-1)![0]).toBe(0);
 expect(state.gameTime).toBe(0);
});
it('selects actual evolutions rather than showing level-five as an evolution',()=>{
 const s=createInitialSurvivorsState();s.activePerks.radio_boost=5;
 expect(carriedTool(s)).toEqual({id:'radio_boost',level:5,left:false});
 s.activePerks.satellite_broadcast=1;expect(carriedTool(s)?.id).toBe('satellite_broadcast');
 s.activePerks.cryo_blizzard=1;expect(carriedTool(s)).toEqual({id:'cryo_blizzard',level:5,left:true});
 for(const key of Object.keys(s.activePerks))s.activePerks[key as keyof typeof s.activePerks]=0;expect(carriedTool(s)).toBeUndefined();
});
it('keeps belt mounts inside every authored body profile including legacy aliases',()=>{
 for(const id of Object.keys(WEARABLE_PROFILES))for(const left of [true,false]){
  const socket=baseToolSocket(id,actor,74,left)!;
  expect(Math.abs(socket.x)).toBeLessThan(15);expect(socket.y).toBeLessThan(-27);expect(socket.y).toBeGreaterThan(-43);
  expect(socket.size).toBeLessThan(14);
 }
 expect(baseToolSocket('unknown',actor,74,false)).toBeUndefined();
});
it('shares the wearable torso pose without modifying the game or drawing a ground duplicate',()=>{
 const s=createInitialSurvivorsState(),base=new SpriteMotionTracker().sample(s.player,0,0,0);
 const pose={...base,facing:-1 as const,lean:.03,gaitBlend:1,action:1};
 const expected=context();applyActorTorsoTransform(expected,pose,74,true);
 const c=context(),before=JSON.stringify(s);vi.mocked(drawEquipment).mockClear();drawCarriedEquipment(c,s,actor,74,pose,undefined,undefined);
 expect(vi.mocked(c.scale).mock.calls).toEqual(vi.mocked(expected.scale).mock.calls);
 expect(vi.mocked(c.transform).mock.calls).toEqual(vi.mocked(expected.transform).mock.calls);
 expect(drawEquipment).toHaveBeenCalledTimes(1);expect(JSON.stringify(s)).toBe(before);
 expect(c.save).toHaveBeenCalledTimes(1);expect(c.restore).toHaveBeenCalledTimes(1);
});
