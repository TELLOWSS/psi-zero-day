import {it,expect,vi} from 'vitest';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {drawPremiumGear} from '../src/ui/survivors-premium-render';
import {drawPremiumProtocol} from '../src/ui/survivors-cinematic-vfx';
import {SpriteMotionTracker} from '../src/ui/survivors-sprite-motion';
const setup=()=>{
 const state=createInitialSurvivorsState('yoon');
 const pose=new SpriteMotionTracker().sample(state.player,0,0,0);
 const image={src:'unknown',naturalWidth:256,naturalHeight:256} as HTMLImageElement;
 const stamps:Array<{args:unknown[];alpha:number}>=[];
 const ctx={save:vi.fn(),restore:vi.fn(),translate:vi.fn(),beginPath:vi.fn(),moveTo:vi.fn(),lineTo:vi.fn(),
  stroke:vi.fn(),ellipse:vi.fn(),arc:vi.fn(),globalAlpha:1,
  drawImage(this:{globalAlpha:number},...args:unknown[]){stamps.push({args,alpha:this.globalAlpha});}} as unknown as CanvasRenderingContext2D;
 return{state,ctx,stamps,actor:{actor:image,height:74,pose,vfxAtlas:image}};
};
it('keeps idle shielding compact and reserves strength for actual feedback without changing state',()=>{
 const {state,ctx,stamps,actor}=setup();
 state.premiumGear!.equipped=['shock_mantle'];state.premiumGear!.effects.shield=20;state.premiumGear!.shield=20;
 const before=JSON.stringify(state);
 drawPremiumGear(ctx,state,undefined,false,0,undefined,{},actor);
 expect(stamps[0]!.args.slice(-2)).toEqual([42,58]);expect(stamps[0]!.alpha).toBe(.1);
 expect(JSON.stringify(state)).toBe(before);
 state.premiumGear!.feedback=.45;
 drawPremiumGear(ctx,state,undefined,false,0,undefined,{},actor);
 expect(stamps[1]!.args.slice(-2)).toEqual([62,76]);expect(stamps[1]!.alpha).toBe(.7);
 drawPremiumGear(ctx,state,undefined,true,0,undefined,{},actor);expect(stamps[2]!.alpha).toBe(.24);
 state.premiumGear!.shield=0;drawPremiumGear(ctx,state,undefined,false,0,undefined,{},actor);
 expect(stamps).toHaveLength(3);
});
it('has one shield owner across the real gear and protocol passes',()=>{
 const {state,ctx,stamps,actor}=setup();
 state.premiumGear!.equipped=['shock_mantle'];state.premiumGear!.effects.shield=20;
 state.premiumGear!.shield=20;state.premiumGear!.feedback=.45;
 const before=JSON.stringify(state);
 drawPremiumGear(ctx,state,undefined,false,0,undefined,{},actor);
 drawPremiumProtocol(ctx,state,actor.vfxAtlas,false);
 expect(stamps).toHaveLength(1);expect(stamps[0]!.args.slice(-2)).toEqual([62,76]);
 expect(JSON.stringify(state)).toBe(before);
});
it('shows affected targets but never paints the large follower radius',()=>{
 const {state,ctx}=setup();state.premiumGear!.equipped=['inspection_wing'];state.premiumGear!.effects.suppression=.2;
 state.hazards=[{id:'cart',type:'RUNAWAY_CART',x:state.player.x+60,y:state.player.y,hp:10,maxHp:10,radius:20,speed:10,damage:1,expValue:1}];
 drawPremiumGear(ctx,state,undefined,false);
 expect(ctx.arc).not.toHaveBeenCalled();expect(ctx.lineTo).toHaveBeenCalledTimes(1);expect(ctx.ellipse).toHaveBeenCalledTimes(1);
 state.hazards[0]!.x+=400;vi.mocked(ctx.lineTo).mockClear();drawPremiumGear(ctx,state,undefined,false);
 expect(ctx.lineTo).not.toHaveBeenCalled();
});
it('bounds crowded inspection marks without changing suppression or painting radial links',()=>{
 const {state,ctx}=setup();state.premiumGear!.equipped=['inspection_wing'];state.premiumGear!.effects.suppression=.2;
 state.hazards=Array.from({length:46},(_,i)=>({id:`cart-${i}`,type:'RUNAWAY_CART' as const,x:state.player.x+60,y:state.player.y+i,hp:10,maxHp:10,radius:20,speed:10,damage:1,expValue:1}));
 const before=JSON.stringify(state);drawPremiumGear(ctx,state,undefined,false);
 expect(ctx.lineTo).not.toHaveBeenCalled();expect(ctx.ellipse).toHaveBeenCalledTimes(8);expect(JSON.stringify(state)).toBe(before);
});
it('limits normal inspection links and keeps reduced motion target markers',()=>{
 const {state,ctx}=setup();state.premiumGear!.equipped=['inspection_wing'];state.premiumGear!.effects.suppression=.2;
 state.hazards=Array.from({length:20},(_,i)=>({id:`cart-${i}`,type:'RUNAWAY_CART' as const,x:state.player.x+60,y:state.player.y+i,hp:10,maxHp:10,radius:20,speed:10,damage:1,expValue:1}));
 drawPremiumGear(ctx,state,undefined,false);expect(ctx.lineTo).toHaveBeenCalledTimes(3);expect(ctx.ellipse).toHaveBeenCalledTimes(16);
 vi.mocked(ctx.lineTo).mockClear();vi.mocked(ctx.ellipse).mockClear();drawPremiumGear(ctx,state,undefined,true);
 expect(ctx.lineTo).not.toHaveBeenCalled();expect(ctx.ellipse).toHaveBeenCalledTimes(16);
});
