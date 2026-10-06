import {expect,it,vi} from 'vitest';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {drawPremiumGear} from '../src/ui/survivors-premium-render';
import {drawProp} from '../src/ui/survivors-equipment-art';
import {STORE_ITEMS} from '../src/domain/survivors-store';
import {SpriteMotionTracker} from '../src/ui/survivors-sprite-motion';
import {premiumBodySocket} from '../src/ui/survivors-wearable-art';
vi.mock('../src/ui/survivors-equipment-art',()=>({drawEquipment:vi.fn(),drawProp:vi.fn()}));
const actor={src:'/assets/player-map.webp',naturalWidth:600,naturalHeight:1400} as HTMLImageElement;
const atlas={naturalWidth:900,naturalHeight:1500} as HTMLImageElement;
const context=()=>new Proxy({} as CanvasRenderingContext2D,{get(target,key){if(!Reflect.has(target,key))Reflect.set(target,key,vi.fn());return Reflect.get(target,key);}});
it('keeps ordinary purchases in the actor-specific animated torso frame',()=>{
  const state=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:['sync_gauntlet'],equipped:['sync_gauntlet']});
  const pose=new SpriteMotionTracker().sample(state.player,0,0,0),socket=premiumBodySocket('player',actor,74,'tempo')!;
  const ctx=context();vi.mocked(drawProp).mockClear();
  drawPremiumGear(ctx,state,atlas,false,0,atlas,{}, {actor,height:74,pose:{...pose,facing:-1,lean:.03,action:1},premiumAtlas:atlas});
  expect(ctx.translate).toHaveBeenCalledWith(state.player.x,state.player.y);expect(ctx.scale).toHaveBeenCalledWith(-1,1);
  expect(vi.mocked(drawProp).mock.calls[0]!.slice(1)).toEqual([atlas,9,socket.x,socket.y+socket.size/2,socket.size]);
  expect(vi.mocked(ctx.save).mock.calls.length).toBe(vi.mocked(ctx.restore).mock.calls.length);
});
it('docks rescue companions instead of orbiting without a gameplay action',()=>{
  const state=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:['rescue_wing'],equipped:['rescue_wing']});
  const pose=new SpriteMotionTracker().sample(state.player,0,0,0);
  const sample=(time:number,facing:1|-1)=>{
    state.gameTime=time;vi.mocked(drawProp).mockClear();
    drawPremiumGear(context(),state,atlas,false,0,atlas,{}, {actor,height:74,pose:{...pose,facing},premiumAtlas:atlas});
    return vi.mocked(drawProp).mock.calls[0]!;
  };
  const first=sample(1,1),later=sample(20,1),left=sample(20,-1);
  expect(later.slice(3)).toEqual(first.slice(3));
  expect(left[3]-state.player.x).toBe(-(first[3]-state.player.x));expect(left[4]).toBe(first[4]);
  expect(first[5]).toBe(14);expect(first[2]).toBe(14);
});
it('uses sixteen unique item cells rather than category-level substitutions',()=>{
  const cells=[];
  for(const item of STORE_ITEMS){
    const state=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:[item.id],equipped:[item.id]});
    const pose=new SpriteMotionTracker().sample(state.player,0,0,0);
    vi.mocked(drawProp).mockClear();
    drawPremiumGear(context(),state,atlas,false,0,atlas,{}, {actor,height:74,pose,premiumAtlas:atlas});
    expect(drawProp).toHaveBeenCalledWith(expect.anything(),atlas,item.art,expect.any(Number),expect.any(Number),expect.any(Number));
    cells.push(vi.mocked(drawProp).mock.calls[0]![2]);
  }
  expect(new Set(cells).size).toBe(16);
});
