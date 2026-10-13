import {describe,it,expect} from 'vitest';
import {lateThreatVariant} from '../src/engine/survivors-late-threats';
import {isHazardContactActive,updateHazardMotion} from '../src/engine/patrol-hazard-motion';
import {createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import type {Hazard} from '../src/domain/patrol-survivors';
describe('late risk diversity without weapon penalties',()=>{
  it('splits a controlled source once into two bounded residual targets',()=>{
    const e=new SurvivorsEngine(createInitialSurvivorsState(),42);e.start();
    e.state.hazards=[{id:'source',type:'GAS_LEAK',variant:'split_gas',x:100,y:100,hp:0,maxHp:100,speed:50,radius:30,damage:5,expValue:6}];
    (e as unknown as {checkCollisions():void}).checkCollisions();
    expect(e.state.hazards).toHaveLength(2);expect(e.state.hazards.every(h=>h.variant===undefined&&h.hp>0)).toBe(true);
    e.state.hazards.forEach(h=>{h.hp=0;});(e as unknown as {checkCollisions():void}).checkCollisions();
    expect(e.state.hazards).toHaveLength(0);
  });
  it('introduces distinct types earlier on harder contracts and never changes workers',()=>{
    expect(lateThreatVariant('GAS_LEAK',89,'standard',.1)).toBeUndefined();
    expect(lateThreatVariant('GAS_LEAK',90,'standard',.1)).toBe('pulse_gas');
    expect(lateThreatVariant('GAS_LEAK',90,'standard',.5)).toBe('split_gas');
    expect(lateThreatVariant('RUNAWAY_CART',60,'extreme',.1)).toBe('reinforced_cart');
    expect(lateThreatVariant('UNHELMETED',180,'extreme',.1)).toBeUndefined();
  });
  it('allows escape throughout the warning and activates gas only after its warning',()=>{
    const h:Hazard={id:'pulse',type:'GAS_LEAK',variant:'pulse_gas',x:100,y:100,hp:100,maxHp:100,speed:0,radius:58,damage:10,expValue:6,motion:{phase:'warning',timer:1.25,directionX:0,directionY:0}};
    const p=createInitialSurvivorsState().player;
    expect(isHazardContactActive(h)).toBe(false);updateHazardMotion(h,p,1,0);expect(isHazardContactActive(h)).toBe(false);
    updateHazardMotion(h,p,.25,0);expect(isHazardContactActive(h)).toBe(true);
    updateHazardMotion(h,p,.65,0);expect(isHazardContactActive(h)).toBe(false);expect(h.x).toBe(100);
  });
});
