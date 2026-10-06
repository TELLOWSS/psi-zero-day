import {expect,it,vi} from 'vitest';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {EquipmentGroundContact,GROUND_MATERIALS} from '../src/ui/survivors-equipment-ground-contact';
import {STORE_ITEMS} from '../src/domain/survivors-store';
const atlas={naturalWidth:1774,naturalHeight:887} as HTMLImageElement;
const ctx=()=>({save:vi.fn(),restore:vi.fn(),drawImage:vi.fn()} as unknown as CanvasRenderingContext2D);
const event={projectileId:'p',kind:'tesla_bolt' as const,phase:'launch' as const,x:0,y:0,angle:0,radius:4};
it('covers all purchased gear with material identities',()=>{
 expect(Object.keys(GROUND_MATERIALS).sort()).toEqual(STORE_ITEMS.map(i=>i.id).sort());
 expect(new Set(Object.values(GROUND_MATERIALS)).size).toBe(3);
});
it('leaves idle ground empty after acquisition and does not mutate game state',()=>{
 const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:['shock_mantle'],equipped:['shock_mantle']});
 const layer=new EquipmentGroundContact();layer.observe(s,[]);expect(layer.count).toBe(1);
 s.gameTime=1;const before=JSON.stringify(s);layer.observe(s,[]);layer.draw(ctx(),s,atlas,false);
 expect(layer.count).toBe(0);expect(JSON.stringify(s)).toBe(before);
});
it('anchors a contact to its birth position, blends authored frames and expires',()=>{
 const s=createInitialSurvivorsState();s.activePerks.tesla_dome=1;s.player.x=0;s.player.y=0;
 const layer=new EquipmentGroundContact();layer.observe(s,[]);s.gameTime=1;layer.observe(s,[event]);
 s.gameTime=1.05;const a=ctx();layer.draw(a,s,atlas,false);expect(a.drawImage).toHaveBeenCalledTimes(2);
 s.player.x=300;s.player.y=400;const b=ctx();layer.draw(b,s,atlas,false);
 expect(vi.mocked(b.drawImage).mock.calls).toEqual(vi.mocked(a.drawImage).mock.calls);
 s.gameTime=2;layer.observe(s,[]);expect(layer.count).toBe(0);
});
it('suppresses normal, blocked and worker events and honors reduced motion',()=>{
 const s=createInitialSurvivorsState(),layer=new EquipmentGroundContact();layer.observe(s,[event]);expect(layer.count).toBe(0);
 s.activePerks.tesla_dome=1;layer.observe(s,[]);s.gameTime=1;
 layer.observe(s,[{...event,blocked:true},{...event,worker:true}]);expect(layer.count).toBe(0);
 layer.observe(s,[event]);const c=ctx();layer.draw(c,s,atlas,true);expect(c.drawImage).not.toHaveBeenCalled();
});
it('bounds dense event bursts and resets on a new run',()=>{
 const s=createInitialSurvivorsState();for(const id of ['tesla_dome','emf_barricade','hunter_swarm'] as const)s.activePerks[id]=1;
 const layer=new EquipmentGroundContact();layer.observe(s,[]);
 for(let i=0;i<20;i++){s.gameTime=i*.06;layer.observe(s,Array(100).fill(event),true);expect(layer.count).toBeLessThanOrEqual(4);}
 layer.observe(createInitialSurvivorsState(),[]);expect(layer.count).toBe(0);
});
