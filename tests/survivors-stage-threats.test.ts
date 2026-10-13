import {describe,it,expect} from 'vitest';
import {stageThreatFamily,stageThreatTraits} from '../src/engine/survivors-stage-threats';
import {updateHazardMotion} from '../src/engine/patrol-hazard-motion';
import {SurvivorsEngine,createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import type {Hazard,PlayerStats} from '../src/domain/patrol-survivors';
describe('stage-specific ordinary risks',()=>{
  it('changes family at every chapter boundary and preserves the first-stage tutorial',()=>{
    for(let stage=2;stage<=50;stage++)expect(stageThreatFamily(stage)).not.toBe(stageThreatFamily(stage-1));
    expect(stageThreatTraits('GAS_LEAK',1,90,30,.1)).toEqual({});
    expect(stageThreatTraits('GAS_LEAK',2,15,30,.1)).toEqual({});
    expect(stageThreatTraits('GAS_LEAK',2,45,30,.1)).toEqual({variant:'pulse_gas'});
    expect(stageThreatTraits('GAS_LEAK',4,45,20,.1)).toEqual({variant:'split_gas'});
    expect(stageThreatTraits('GAS_LEAK',5,45,20,.1)).toEqual({behavior:'crosswind'});
  });
  it('takes a side approach but never retargets after the charge warning',()=>{
    const h:Hazard={id:'cart_1',type:'RUNAWAY_CART',x:100,y:100,hp:60,maxHp:60,speed:180,radius:18,damage:22,expValue:7,behavior:'flanking_cart',motion:{phase:'approach',timer:0,directionX:0,directionY:0}};
    const player={x:700,y:100} as PlayerStats;
    updateHazardMotion(h,player,1/60,180);expect(h.y).not.toBe(100);
    h.x=500;h.y=100;updateHazardMotion(h,player,1/60,180);
    expect(h.motion!.phase).toBe('warning');
    const locked=[h.motion!.directionX,h.motion!.directionY];
    updateHazardMotion(h,{...player,y:600},.3,180);
    expect([h.motion!.directionX,h.motion!.directionY]).toEqual(locked);
    expect(h.motion!.timer).toBeGreaterThan(0);
  });
  it('integrates specialist spawns without altering authored signature hazards or bosses',()=>{
    const engine=new SurvivorsEngine(createInitialSurvivorsState('player',undefined,'stage_05'),20261008);
    engine.start();engine.state.gameTime=45;
    const spawn=engine as unknown as {spawnHazard(type:string,hp?:number,boss?:boolean,authored?:object):void};
    for(let i=0;i<20;i++)spawn.spawnHazard('GAS_LEAK');
    expect(engine.state.hazards.some(h=>h.behavior==='crosswind')).toBe(true);
    spawn.spawnHazard('GAS_LEAK',100,true);
    expect(engine.state.hazards.at(-1)!.behavior).toBeUndefined();
    spawn.spawnHazard('GAS_LEAK',undefined,false,{x:500,y:500,variant:'split_gas'});
    expect(engine.state.hazards.at(-1)!.behavior).toBeUndefined();
    expect(engine.state.hazards.at(-1)!.variant).toBe('split_gas');
  });
});
