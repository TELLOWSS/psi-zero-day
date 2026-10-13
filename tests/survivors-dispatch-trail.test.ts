import {expect,it,vi} from 'vitest';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {DispatchTrail} from '../src/ui/survivors-dispatch-trail';

const state=()=>{
 const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:['dispatch_drive'],equipped:['dispatch_drive']});
 s.phase='playing';s.player.x=0;s.player.y=0;return s;
};
const ctx=()=>({save:vi.fn(),restore:vi.fn(),translate:vi.fn(),rotate:vi.fn(),scale:vi.fn(),drawImage:vi.fn()} as unknown as CanvasRenderingContext2D);
const atlas={} as HTMLCanvasElement;
it('emits by actual distance, not idle time, without changing simulation state',()=>{
 const s=state(),trail=new DispatchTrail();trail.observe(s);
 s.gameTime=1;trail.observe(s);expect(trail.count).toBe(0);
 s.player.x=10;trail.observe(s);expect(trail.count).toBe(0);
 s.player.x=20;const before=JSON.stringify(s);trail.observe(s);expect(trail.count).toBe(1);expect(JSON.stringify(s)).toBe(before);
 s.gameTime=1.6;trail.observe(s);expect(trail.count).toBe(0);
});
it('keeps old origins and directions fixed when the actor turns',()=>{
 const s=state(),trail=new DispatchTrail();trail.observe(s);
 s.gameTime=.1;s.player.x=20;trail.observe(s);
 s.gameTime=.2;s.player.y=20;trail.observe(s);
 const c=ctx();trail.draw(c,s,atlas);
 expect(vi.mocked(c.translate).mock.calls).toEqual([[20,3],[20,23]]);
 expect(vi.mocked(c.rotate).mock.calls[0]![0]).toBe(0);
 expect(vi.mocked(c.rotate).mock.calls[1]![0]).toBeCloseTo(Math.PI/2);
 expect(c.drawImage).toHaveBeenCalled();
});
it('freezes on the simulation clock and does not emit during pause',()=>{
 const s=state(),trail=new DispatchTrail();trail.observe(s);s.gameTime=.1;s.player.x=20;trail.observe(s);
 s.phase='paused';trail.observe(s);const a=ctx(),b=ctx();trail.draw(a,s,atlas);trail.observe(s);trail.draw(b,s,atlas);
 expect(vi.mocked(a.drawImage).mock.calls).toEqual(vi.mocked(b.drawImage).mock.calls);expect(trail.count).toBe(1);
 s.phase='playing';s.player.x=40;trail.observe(s);expect(trail.count).toBe(1);
});
it('discards teleports and clears on unequip or a new run',()=>{
 const s=state(),trail=new DispatchTrail();trail.observe(s);s.gameTime=.1;s.player.x=500;trail.observe(s);expect(trail.count).toBe(0);
 s.gameTime=.2;s.player.x=520;trail.observe(s);expect(trail.count).toBe(1);
 s.premiumGear!.equipped=[];trail.observe(s);expect(trail.count).toBe(0);
 trail.observe(state());expect(trail.count).toBe(0);
});
it('caps dense movement and suppresses rendering for reduced motion or missing art',()=>{
 const s=state(),trail=new DispatchTrail();trail.observe(s,true);
 for(let i=1;i<=100;i++){s.gameTime=i*.02;s.player.x+=32;trail.observe(s,true);expect(trail.count).toBeLessThanOrEqual(3);}
 const c=ctx();trail.draw(c,s,atlas,true);trail.draw(c,s,undefined);expect(c.drawImage).not.toHaveBeenCalled();
});
