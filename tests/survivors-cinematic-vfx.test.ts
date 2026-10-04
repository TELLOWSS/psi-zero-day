import {describe,it,expect,vi} from 'vitest';
import {cinematicLook,drawCinematicFlight,drawCinematicContact,drawPremiumProtocol,drawDroneEmission} from '../src/ui/survivors-cinematic-vfx';
import {ProjectileFeedbackLayer} from '../src/ui/survivors-projectile-feedback';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import type {Projectile,ProjectileKind} from '../src/domain/patrol-survivors';
const atlas={naturalWidth:1448,naturalHeight:1086} as HTMLImageElement;
const context=()=>({save:vi.fn(),restore:vi.fn(),translate:vi.fn(),rotate:vi.fn(),drawImage:vi.fn(),beginPath:vi.fn(),ellipse:vi.fn(),arc:vi.fn(),stroke:vi.fn()}) as unknown as CanvasRenderingContext2D;
const shot=(kind:ProjectileKind):Projectile=>({id:'p',kind,x:50,y:60,vx:100,vy:0,radius:4,damage:12,duration:.2,pierce:1});
describe('premium and high-tier cinematic presentation',()=>{
  it('passes actual paid communication and tempo ownership into flight identity',()=>{
    expect(cinematicLook('drone_laser',5,['broadcast_crown'])).toMatchObject({palette:'gold',premium:true,tier:3,flightCell:4,impactCell:8});
    expect(cinematicLook('radio',2,['command_array']).palette).toBe('cyan');
    expect(cinematicLook('hunter_beam',5,['sync_gauntlet']).palette).toBe('violet');
    expect(cinematicLook('hunter_beam',5).premium).toBe(false);
  });
  it('makes premium and max tiers materially wider while preserving the projectile',()=>{
    const p=Object.freeze(shot('drone_laser')),ctx=context();
    const draw=(lv:number,gear:string[],reduced=false,busy=false)=>{
      vi.mocked(ctx.drawImage).mockClear();expect(drawCinematicFlight(ctx,p,cinematicLook(p.kind,lv,gear),atlas,reduced,busy)).toBe(true);
      return vi.mocked(ctx.drawImage).mock.calls[0]!.slice(-2) as number[];
    };
    const basic=draw(1,[]),max=draw(5,[]),premium=draw(5,['broadcast_crown']),quiet=draw(5,['broadcast_crown'],true),busy=draw(5,['broadcast_crown'],false,true);
    expect(max[0]).toBeGreaterThan(basic[0]!);expect(premium[1]).toBeGreaterThan(max[1]!);
    expect(quiet[0]).toBeLessThan(premium[0]!);expect(busy[1]).toBeLessThan(premium[1]!);
    expect(p).toEqual(shot('drone_laser'));expect(vi.mocked(ctx.save).mock.calls.length).toBe(vi.mocked(ctx.restore).mock.calls.length);
  });
  it('only adds hit blossoms to confirmed non-worker events and respects reduced motion',()=>{
    const ctx=context(),look=cinematicLook('radio',5,['broadcast_crown']);
    const event={projectileId:'p',kind:'radio' as const,phase:'impact' as const,x:4,y:8,angle:0,radius:5};
    drawCinematicContact(ctx,{...event,worker:true},0,.2,look,atlas,false,false);expect(ctx.drawImage).not.toHaveBeenCalled();
    drawCinematicContact(ctx,event,0,.2,look,atlas,true,false);expect(ctx.drawImage).not.toHaveBeenCalled();
    drawCinematicContact(ctx,event,0,.2,look,atlas,false,false);expect(ctx.drawImage).toHaveBeenCalledOnce();
  });
  it('adds equipment presence and rotor emissions without changing gameplay state',()=>{
    const state=createInitialSurvivorsState('yoon',undefined,undefined,undefined,{owned:['broadcast_crown','shock_mantle','dispatch_drive'],equipped:['broadcast_crown','shock_mantle','dispatch_drive']});
    const snapshot=JSON.stringify(state),ctx=context();
    drawPremiumProtocol(ctx,state,atlas,false,1);drawDroneEmission(ctx,atlas,10,20,true,2,false);
    expect(ctx.drawImage).toHaveBeenCalled();expect(JSON.stringify(state)).toBe(snapshot);
    expect(vi.mocked(ctx.save).mock.calls.length).toBe(vi.mocked(ctx.restore).mock.calls.length);
  });
  it('uses the equipped gold material for an engine impact and replaces the old wire response',()=>{
    const layer=new ProjectileFeedbackLayer(),ctx=context();
    layer.ingest([{projectileId:'actual-event',kind:'hunter_beam',phase:'impact',x:10,y:20,angle:1,radius:3}]);
    layer.draw(ctx,false,false,{atlas,equipped:['broadcast_crown'],levels:{hunter_beam:5}});
    const args=vi.mocked(ctx.drawImage).mock.calls[0]!;
    expect(args[1]).toBe(0);expect(args[2]).toBe(724); // Gold impact cell 8.
    expect(vi.mocked(ctx.drawImage).mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(vi.mocked(ctx.save).mock.calls.length).toBe(vi.mocked(ctx.restore).mock.calls.length);
  });
  it('keeps the existing renderer when the raster asset is not loaded and cones on the ground pass',()=>{
    const ctx=context();expect(drawCinematicFlight(ctx,shot('radio'),cinematicLook('radio',1),undefined,false,false)).toBe(false);
    expect(drawCinematicFlight(ctx,shot('cone_trap'),cinematicLook('cone_trap',5),atlas,false,false)).toBe(false);
  });
});
