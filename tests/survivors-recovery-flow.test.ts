import {expect,it,vi} from 'vitest';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {RecoveryFlow} from '../src/ui/survivors-recovery-flow';
import {SpriteMotionTracker} from '../src/ui/survivors-sprite-motion';
import {premiumBodySocket} from '../src/ui/survivors-wearable-art';
import {isDirectionalActor,directionalSocket} from '../src/ui/survivors-directional-art';
vi.mock('../src/ui/survivors-wearable-art',()=>({premiumBodySocket:vi.fn(()=>({x:6,y:-30,size:12}))}));
vi.mock('../src/ui/survivors-directional-art',()=>({isDirectionalActor:vi.fn(()=>false),directionalSocket:vi.fn()}));
const setup=()=>{
 const state=createInitialSurvivorsState('yoon',undefined,undefined,undefined,{owned:['recovery_cell'],equipped:['recovery_cell']});
 state.phase='playing';
 const flow=new RecoveryFlow(),pose=new SpriteMotionTracker().sample(state.player,0,0,0);
 const actor={image:{src:'unknown',naturalWidth:256} as HTMLImageElement,height:74,pose};
 const atlas={naturalWidth:1536,naturalHeight:1024} as HTMLImageElement;
 const ctx=()=>({save:vi.fn(),restore:vi.fn(),translate:vi.fn(),drawImage:vi.fn()} as unknown as CanvasRenderingContext2D);
 return {state,flow,actor,atlas,ctx};
};
it('requires actual recovery, limits cadence and never mutates game state',()=>{
 const {state,flow}=setup();state.player.hp-=20;flow.observe(state);expect(flow.count).toBe(0);
 state.premiumGear!.recoveryAmount=.01;const before=JSON.stringify(state);flow.observe(state);expect(flow.count).toBe(1);expect(JSON.stringify(state)).toBe(before);
 state.gameTime=.9;flow.observe(state);expect(flow.count).toBe(0);
 state.gameTime=1.4;flow.observe(state);expect(flow.count).toBe(1);
 state.gameTime=2.3;state.premiumGear!.recoveryAmount=0;flow.observe(state);expect(flow.count).toBe(0);
});
it('freezes on pause, clears on unequip/new run and follows the torso socket',()=>{
 const {state,flow,actor,atlas,ctx}=setup();state.premiumGear!.recoveryAmount=.01;flow.observe(state);
 state.gameTime=.2;state.phase='paused';flow.observe(state);const a=ctx(),b=ctx();
 flow.draw(a,state,atlas,false,false,actor);flow.observe(state);flow.draw(b,state,atlas,false,false,actor);
 expect(vi.mocked(a.drawImage).mock.calls).toEqual(vi.mocked(b.drawImage).mock.calls);
 const c=ctx();state.player.x+=50;flow.draw(c,state,atlas,false,false,actor);
 expect(vi.mocked(c.translate).mock.calls[0]![0]-vi.mocked(a.translate).mock.calls[0]![0]).toBe(50);
 state.premiumGear!.equipped=[];flow.observe(state);expect(flow.count).toBe(0);
 flow.observe(setup().state);expect(flow.count).toBe(0);
});
it('bounds busy stamps, preserves legacy ownership on missing art/reduced motion',()=>{
 const {state,flow,actor,atlas,ctx}=setup();state.premiumGear!.recoveryAmount=.01;flow.observe(state);state.gameTime=.2;
 const normal=ctx(),busy=ctx();expect(flow.draw(normal,state,atlas,false,false,actor)).toBe(true);expect(normal.drawImage).toHaveBeenCalledTimes(2);
 flow.draw(busy,state,atlas,false,true,actor);expect(busy.drawImage).toHaveBeenCalledTimes(1);
 expect(flow.draw(ctx(),state,undefined,false,false,actor)).toBe(false);
 expect(flow.draw(ctx(),state,atlas,true,false,actor)).toBe(false);
 expect(flow.draw(ctx(),state,atlas,false,false)).toBe(false);
});
it('owns intentionally hidden rear chest effects without resurrecting the legacy stamp',()=>{
 const {state,flow,actor,atlas,ctx}=setup();state.premiumGear!.recoveryAmount=.01;flow.observe(state);
 vi.mocked(premiumBodySocket).mockReturnValueOnce(undefined);
 vi.mocked(isDirectionalActor).mockReturnValueOnce(true);
 vi.mocked(directionalSocket).mockReturnValueOnce({x:0,y:-30,size:12,rear:true});
 const hidden=ctx();expect(flow.draw(hidden,state,atlas,false,false,actor)).toBe(true);
 expect(hidden.drawImage).not.toHaveBeenCalled();
 vi.mocked(premiumBodySocket).mockReturnValueOnce(undefined);
 expect(flow.draw(ctx(),state,atlas,false,false,actor)).toBe(false);
});
it('has six bounded changing transparent recovery drawings and a dissipating tail',async()=>{
 const {data,info}=await sharp('public/assets/survivors/recovery-cell-flow-v1.png').raw().toBuffer({resolveWithObject:true});
 expect([info.width,info.height,info.channels]).toEqual([1536,1024,4]);
 const hashes=new Set<string>(),counts:number[]=[];
 for(let f=0;f<6;f++){
  const frame=Buffer.alloc(512*512*4);let count=0;
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
   const offset=((Math.floor(f/3)*512+y)*info.width+f%3*512+x)*4,alpha=data[offset+3]!;
   data.copy(frame,(y*512+x)*4,offset,offset+4);
   if(alpha>32){count++;expect(x>=32&&x<480&&y>=32&&y<480).toBe(true);}
   if((x<16||x>=496)&&(y<16||y>=496))expect(alpha).toBeLessThanOrEqual(1);
  }
  counts.push(count);hashes.add(createHash('sha256').update(frame).digest('hex'));
 }
 expect(hashes.size).toBe(6);expect(counts[2]).toBeGreaterThan(counts[0]!);expect(counts[5]).toBeLessThan(counts[2]!*.35);
});
