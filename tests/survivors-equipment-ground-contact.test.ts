import {expect,it,vi} from 'vitest';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {EquipmentGroundContact,GROUND_MATERIALS} from '../src/ui/survivors-equipment-ground-contact';
import {STORE_ITEMS} from '../src/domain/survivors-store';
import {placeControlLine} from '../src/engine/survivors-field-tactics';
const atlas={naturalWidth:1774,naturalHeight:887} as HTMLImageElement;
const ctx=()=>({save:vi.fn(),restore:vi.fn(),drawImage:vi.fn()} as unknown as CanvasRenderingContext2D);
const event={projectileId:'p',kind:'tesla_bolt' as const,phase:'launch' as const,x:0,y:0,angle:0,radius:4};
it('draws coincident same-material acquisition once without merging distinct materials',()=>{
 const ids=['voice_lens','extraction_pack','rescue_wing','relay_core'];
 const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:ids,equipped:ids});
 const layer=new EquipmentGroundContact();layer.observe(s,[]);s.gameTime=.1;
 const c=ctx();layer.draw(c,s,atlas,false,true);
 expect(c.drawImage).toHaveBeenCalledTimes(2);
 expect(layer.count).toBe(4);
});
it('keeps authored silhouettes above nearby generic glow without dimming remote or unloaded contacts',()=>{
 const ids=['shock_mantle','inspection_wing'];
 const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:ids,equipped:ids});
 s.player.x=0;s.player.y=0;
 const layer=new EquipmentGroundContact(),shock={} as HTMLCanvasElement;
 layer.observe(s,[]);s.gameTime=.4;layer.observe(s,[{...event,kind:'drone_laser',phase:'impact',x:200}]);
 const c=ctx(),records:{image:CanvasImageSource;alpha:number;x:number}[]=[];
 vi.mocked(c.drawImage).mockImplementation((image,...args)=>{records.push({image,alpha:c.globalAlpha,x:(args[4] as number)+(args[6] as number)/2});});
 layer.draw(c,s,atlas,false,true,shock);
 expect(records.at(-1)!.image).toBe(shock);
 expect(records.find(record=>record.image===atlas&&record.x<50)!.alpha).toBeLessThan(.2);
 expect(records.find(record=>record.image===atlas&&record.x>150)!.alpha).toBeCloseTo(.42);
 const fallback=ctx(),alphas:number[]=[];
 vi.mocked(fallback.drawImage).mockImplementation(()=>{alphas.push(fallback.globalAlpha);});
 layer.draw(fallback,s,atlas,false,true);
 expect(Math.max(...alphas)).toBeCloseTo(.42);
 expect(alphas.every(alpha=>alpha>.2)).toBe(true);
});
it('retains both authored identities during mass equip without exceeding busy draw budget',()=>{
 const equipped=['shock_mantle','barrier_forge','inspection_wing','broadcast_crown','sync_gauntlet','extraction_pack'] as const;
 const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:[...equipped],equipped:[...equipped]});
 const layer=new EquipmentGroundContact(),shock={} as HTMLCanvasElement,barrier={} as HTMLCanvasElement;
 layer.observe(s,[],true);expect(layer.count).toBe(4);
 s.gameTime=.4;const c=ctx();layer.draw(c,s,atlas,false,true,shock,barrier);
 const images=vi.mocked(c.drawImage).mock.calls.map(call=>call[0]);
 expect(images).toHaveLength(3);expect(images).toContain(shock);expect(images).toContain(barrier);expect(images).toContain(atlas);
 s.gameTime=.9;const expired=ctx();layer.draw(expired,s,atlas,false,true,shock,barrier);
 expect(expired.drawImage).not.toHaveBeenCalled();
 layer.observe(s,[],true);expect(layer.count).toBe(0);
});
it('sequences acquisition by identity, freezes on game time and cancels pending unequipped effects',()=>{
 const ids=['voice_lens','barrier_forge','shock_mantle'];
 const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:ids,equipped:ids});
 const layer=new EquipmentGroundContact(),shock={} as HTMLCanvasElement,barrier={} as HTMLCanvasElement;
 const before=JSON.stringify(s);layer.observe(s,[]);expect(JSON.stringify(s)).toBe(before);
 const first=ctx();layer.draw(first,s,atlas,false,true,shock,barrier);
 expect(vi.mocked(first.drawImage).mock.calls.map(call=>call[0])).toEqual([shock]);
 const paused=ctx();layer.observe(s,[]);layer.draw(paused,s,atlas,false,true,shock,barrier);
 expect(vi.mocked(paused.drawImage).mock.calls).toEqual(vi.mocked(first.drawImage).mock.calls);
 s.gameTime=.2;const second=ctx();layer.draw(second,s,atlas,false,true,shock,barrier);
 const images=vi.mocked(second.drawImage).mock.calls.map(call=>call[0]);
 expect(images).toContain(shock);expect(images).toContain(barrier);expect(images).not.toContain(atlas);
 s.premiumGear!.equipped=['shock_mantle'];layer.observe(s,[]);
 s.gameTime=.4;const cancelled=ctx();layer.draw(cancelled,s,atlas,false,true,shock,barrier);
 expect(vi.mocked(cancelled.drawImage).mock.calls.map(call=>call[0])).not.toContain(atlas);
 layer.observe(createInitialSurvivorsState(),[]);expect(layer.count).toBe(0);
});
it('keeps mantle discharge independent of companion cooldown and legacy atlas loading',()=>{
 const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:['shock_mantle'],equipped:['shock_mantle']});
 s.player.x=0;s.player.y=0;
 const layer=new EquipmentGroundContact(),shock={} as HTMLCanvasElement;
 layer.observe(s,[]);s.gameTime=1;
 layer.observe(s,[{...event,kind:'drone_laser',phase:'impact'},{...event,phase:'impact'}]);
 expect(layer.count).toBe(2);
 layer.observe(s,[{...event,phase:'impact'},{...event,kind:'drone_laser',phase:'impact'}]);
 expect(layer.count).toBe(2);
 s.gameTime=1.08;const normal=ctx();layer.draw(normal,s,undefined,false,false,shock);
 expect(normal.drawImage).toHaveBeenCalledTimes(2);
 expect(vi.mocked(normal.drawImage).mock.calls.every(call=>call[0]===shock)).toBe(true);
 const busy=ctx();layer.draw(busy,s,undefined,false,true,shock);
 expect(busy.drawImage).toHaveBeenCalledTimes(1);
 expect(busy.save).toHaveBeenCalledTimes(1);expect(busy.restore).toHaveBeenCalledTimes(1);
 const missing=ctx();layer.draw(missing,s,undefined,false);
 expect(missing.drawImage).not.toHaveBeenCalled();
 s.gameTime=2;
 layer.observe(s,[{...event,phase:'impact'},{...event,kind:'drone_laser',phase:'impact'}]);
 expect(layer.count).toBe(2);
});
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
it('suppresses ordinary launch, blocked and worker events and honors reduced motion',()=>{
 const s=createInitialSurvivorsState(),layer=new EquipmentGroundContact();layer.observe(s,[event]);expect(layer.count).toBe(0);
 s.activePerks.tesla_dome=1;layer.observe(s,[]);s.gameTime=1;
 layer.observe(s,[{...event,blocked:true},{...event,worker:true}]);expect(layer.count).toBe(0);
 layer.observe(s,[event]);const c=ctx();layer.draw(c,s,atlas,true);expect(c.drawImage).not.toHaveBeenCalled();
});
it('gives ordinary confirmed hits a small contact but never reacts to unrelated equipped armor or remote hits',()=>{
 const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:['shock_mantle'],equipped:['shock_mantle']});
 s.player.x=0;s.player.y=0;const layer=new EquipmentGroundContact();layer.observe(s,[]);s.gameTime=1;
 layer.observe(s,[{...event,kind:'drone_laser'}]);expect(layer.count).toBe(0);
 layer.observe(s,[{...event,kind:'drone_laser',phase:'impact',x:700}]);expect(layer.count).toBe(0);
 layer.observe(s,[{...event,kind:'drone_laser',phase:'impact',x:60}]);expect(layer.count).toBe(1);
 const c=ctx();layer.draw(c,s,atlas,false);expect(c.drawImage).toHaveBeenCalledTimes(1);
 s.gameTime=2;layer.observe(s,[]);expect(layer.count).toBe(0);
});
it('places companion launch light under the emitting drone instead of teleporting it to the actor',()=>{
 const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:['inspection_wing'],equipped:['inspection_wing']});
 s.player.x=0;s.player.y=0;const layer=new EquipmentGroundContact();layer.observe(s,[]);s.gameTime=1;
 layer.observe(s,[{...event,kind:'drone_laser',x:40,y:10}]);expect(layer.count).toBe(1);
 const c=ctx();layer.draw(c,s,atlas,false);const call=vi.mocked(c.drawImage).mock.calls[0]!;
 expect(call[5]!+(call[7] as number)/2).toBeCloseTo(40);expect(call[6]!+(call[8] as number)/2).toBeCloseTo(13);
});
it('bounds dense event bursts and resets on a new run',()=>{
 const s=createInitialSurvivorsState();for(const id of ['tesla_dome','emf_barricade','hunter_swarm'] as const)s.activePerks[id]=1;
 const layer=new EquipmentGroundContact();layer.observe(s,[]);
 for(let i=0;i<20;i++){s.gameTime=i*.06;layer.observe(s,Array(100).fill(event),true);expect(layer.count).toBeLessThanOrEqual(4);}
 layer.observe(createInitialSurvivorsState(),[]);expect(layer.count).toBe(0);
});
it('uses the independent shock sequence only for mantle acquisition and tesla feedback',()=>{
 const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:['shock_mantle'],equipped:['shock_mantle']});
 s.player.x=0;s.player.y=0;
 const shock={} as HTMLCanvasElement,layer=new EquipmentGroundContact();
 layer.observe(s,[]);const a=ctx();layer.draw(a,s,atlas,false,false,shock);
 expect(vi.mocked(a.drawImage).mock.calls[0]![0]).toBe(shock);
 s.gameTime=1;layer.observe(s,[{...event,phase:'impact'}]);
 const b=ctx();layer.draw(b,s,atlas,false,false,shock);expect(vi.mocked(b.drawImage).mock.calls[0]![0]).toBe(shock);
 s.gameTime=2;layer.observe(s,[{...event,phase:'impact',kind:'drone_laser'}]);
 const c=ctx();layer.draw(c,s,atlas,false,false,shock);expect(vi.mocked(c.drawImage).mock.calls[0]![0]).toBe(atlas);
 s.gameTime=3;layer.observe(s,[]);expect(layer.count).toBe(0);
});
it('animates each real barrier deployment once at its world origin without changing tactics',()=>{
 const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:['barrier_forge'],equipped:['barrier_forge']});
 const layer=new EquipmentGroundContact(),barrier={} as HTMLCanvasElement;
 layer.observe(s,[]);s.gameTime=1;layer.observe(s,[]);expect(layer.count).toBe(0);
 s.phase='playing';s.player.x=40;s.player.y=75;expect(placeControlLine(s)).toBe(true);
 const before=JSON.stringify(s);layer.observe(s,[]);expect(JSON.stringify(s)).toBe(before);expect(layer.count).toBe(1);
 const a=ctx();layer.draw(a,s,atlas,false,false,undefined,barrier);
 const independent=ctx();layer.draw(independent,s,undefined,false,false,undefined,barrier);
 expect(independent.drawImage).toHaveBeenCalledTimes(1);
 expect(vi.mocked(independent.drawImage).mock.calls[0]![0]).toBe(barrier);
 const call=vi.mocked(a.drawImage).mock.calls[0]!;expect(call[0]).toBe(barrier);
 expect((call[5] as number)+(call[7] as number)/2).toBeCloseTo(40);
 expect((call[6] as number)+(call[8] as number)/2).toBeCloseTo(75);
 s.gameTime=1.2;s.player.x=500;layer.observe(s,[]);expect(layer.count).toBe(1);
 s.gameTime=2;layer.observe(s,[]);expect(layer.count).toBe(0);
 s.fieldTactics!.lineCooldown=0;expect(placeControlLine(s)).toBe(true);layer.observe(s,[]);expect(layer.count).toBe(1);
});
it('does not grant ordinary control lines a premium sequence or replay old lines on equip',()=>{
 const s=createInitialSurvivorsState(),layer=new EquipmentGroundContact();s.phase='playing';
 expect(placeControlLine(s)).toBe(true);layer.observe(s,[]);expect(layer.count).toBe(0);
 s.premiumGear!.equipped=['barrier_forge'];s.gameTime=1;layer.observe(s,[]);expect(layer.count).toBe(1);
 s.gameTime=2;layer.observe(s,[]);expect(layer.count).toBe(0);
 layer.observe(createInitialSurvivorsState(),[]);expect(layer.count).toBe(0);
});
