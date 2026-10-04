import {describe,it,expect} from 'vitest';
import {createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import {earnedTacticalSupply,resourceProfile} from '../src/engine/survivors-resources';
import {recommendedStoreItem} from '../src/domain/survivors-store';
import {applyTacticalItem} from '../src/engine/survivors-items';
const idle={moveX:0,moveY:0};
describe('scarce emergency resources and preflight equipment',()=>{
  it('requires both controls and elapsed cooldown and keeps earned eligibility pending',()=>{
    const state=createInitialSurvivorsState('yoon',undefined,'stage_01','extreme');state.gameTime=20;state.hazardsNeutralized=31;
    expect(earnedTacticalSupply(state,false)).toBeNull();state.hazardsNeutralized=32;
    expect(earnedTacticalSupply(state,false)).toBe('record_beacon');
    state.hazardsNeutralized=100;state.gameTime=49;
    expect(earnedTacticalSupply(state,false)).toBeNull();state.gameTime=50;
    expect(earnedTacticalSupply(state,false)).toBe('radio_battery');
    expect(earnedTacticalSupply(state,false)).toBeNull();
    expect(state.supplyGate!.nextControl).toBe(132);
  });
  it('preserves designated boss rewards without advancing the regular cycle',()=>{
    const state=createInitialSurvivorsState();state.hazardsNeutralized=1;
    expect(earnedTacticalSupply(state,true)).toBe('control_kit');
    expect(state.supplyGate!.cycle).toBe(0);
  });
  it('charges from normal controls and records at lower rates without reducing experience',()=>{
    const state=createInitialSurvivorsState();const engine=new SurvivorsEngine(state,4);engine.start();state.interactiveHazards=[];
    state.hazards=[{id:'controlled',type:'GAS_LEAK',x:40,y:40,hp:0,maxHp:1,speed:0,radius:10,damage:10,expValue:3}];
    engine.update(1/60,idle);expect(state.ultimateCharge).toBe(1);
    state.drops=[{id:'log',x:state.player.x,y:state.player.y,exp:3}];engine.update(1/60,idle);
    expect(state.currentExp).toBe(3);expect(state.ultimateCharge).toBeCloseTo(1.15);
  });
  it('does not refill shout from its own mass control or record vacuum',()=>{
    const state=createInitialSurvivorsState();const engine=new SurvivorsEngine(state,4);engine.start();state.interactiveHazards=[];
    state.hazards=[{id:'risk',type:'GAS_LEAK',x:40,y:40,hp:5,maxHp:5,speed:0,radius:10,damage:10,expValue:3}];
    state.drops=[{id:'record',x:state.player.x,y:state.player.y,exp:3}];state.ultimateCharge=100;
    expect(engine.triggerDirectorShout()).toBe(true);engine.update(1/60,idle);
    expect(state.hazardsNeutralized).toBe(1);expect(state.ultimateCharge).toBe(0);expect(state.currentExp).toBeGreaterThanOrEqual(3);
  });
  it('reduces battery charge on tougher contracts without removing utility',()=>{
    for(const difficulty of ['story','standard','hard','extreme'] as const){
      const state=createInitialSurvivorsState('yoon',undefined,'stage_01',difficulty);
      applyTacticalItem(state,'radio_battery');expect(state.ultimateCharge).toBe(resourceProfile(difficulty).batteryCharge);
    }
  });
  it('prefers a useful owned empty-slot item and never silently replaces a chosen loadout',()=>{
    expect(recommendedStoreItem({owned:['inspection_wing'],equipped:[]},'extreme').id).toBe('inspection_wing');
    expect(recommendedStoreItem({owned:['shock_mantle'],equipped:['shock_mantle']},'extreme').id).toBe('inspection_wing');
    expect(recommendedStoreItem({owned:[],equipped:[]},'standard').id).toBe('relay_core');
  });
});
