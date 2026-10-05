import { describe, expect, it } from 'vitest';
import { industrialHazardCell, industrialContactCell, drawIndustrialContact } from '../src/ui/survivors-industrial-art';
import { createInitialSurvivorsState, SurvivorsEngine } from '../src/engine/patrol-survivors-engine';
import type { HazardType } from '../src/domain/patrol-survivors';

describe('industrial art identity', () => {
  it('distinguishes reinforced frames and twin vapor cores without random skins', () => {
    expect(industrialHazardCell({type:'RUNAWAY_CART'},'handover')).toBe(0);
    expect(industrialHazardCell({type:'RUNAWAY_CART'},'datacenter-v1.png')).toBe(2);
    expect(industrialHazardCell({type:'RUNAWAY_CART',variant:'reinforced_cart'},'datacenter')).toBe(1);
    expect(industrialHazardCell({type:'GAS_LEAK'},'deepworks')).toBe(4);
    expect(industrialHazardCell({type:'GAS_LEAK',variant:'split_gas'},'deepworks')).toBe(5);
    expect(industrialHazardCell({type:'FALLING_DEBRIS'},'skydeck')).toBe(3);
    expect(industrialHazardCell({type:'UNHELMETED'},'plant')).toBeNull();
    expect(industrialHazardCell({type:'CRANE_BOSS'},'plant')).toBeNull();
  });
  it('keeps people and unattributed contacts out of material destruction', () => {
    expect(industrialContactCell('UNHELMETED',true)).toBeNull();
    expect(industrialContactCell(undefined,true)).toBeNull();
    expect(industrialContactCell('RUNAWAY_CART',false)).toBe(0);
    expect(industrialContactCell('FALLING_DEBRIS',true)).toBe(4);
    expect(industrialContactCell('GAS_LEAK',true)).toBe(5);
    const e={projectileId:'p',kind:'radio' as const,phase:'impact' as const,x:0,y:0,angle:0,radius:10,actorKind:'RUNAWAY_CART' as const};
    const ctx={} as CanvasRenderingContext2D,atlas={naturalWidth:1536} as HTMLImageElement;
    expect(drawIndustrialContact(ctx,atlas,e,0,.18,true,false)).toBe(false);
    expect(drawIndustrialContact(ctx,atlas,{...e,worker:true},0,.18,false,false)).toBe(false);
    expect(drawIndustrialContact(ctx,atlas,{...e,phase:'launch'},0,.18,false,false)).toBe(false);
  });
  it.each<HazardType>(['RUNAWAY_CART','GAS_LEAK','FALLING_DEBRIS','CRANE_BOSS','UNHELMETED'])('receives %s identity from confirmed engine contact', type => {
    const state=createInitialSurvivorsState();state.phase='playing';state.player.critRate=0;state.interactiveHazards=[];
    const x=state.player.x+80,y=state.player.y;
    state.hazards=[{id:'material',type,x,y,hp:10000,maxHp:10000,speed:0,radius:20,damage:0,expValue:0}];
    state.projectiles=[{id:'contact',kind:'radio',x,y,vx:0,vy:0,radius:10,damage:1,duration:1,pierce:1}];
    const engine=new SurvivorsEngine(state);engine.update(1/60,{moveX:0,moveY:0});
    const hit=engine.drainProjectileFeedback().find(e=>e.projectileId==='contact'&&e.phase==='impact');
    expect(hit).toMatchObject({actorKind:type,worker:type==='UNHELMETED'});
  });
});
