import {describe,it,expect} from 'vitest';
import {createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import {absorbPremiumDamage,tickPremiumGear,premiumHazardSpeed} from '../src/engine/survivors-premium-gear';
import {STORE_ITEMS,storeEffects} from '../src/domain/survivors-store';
import type {Hazard} from '../src/domain/patrol-survivors';
const stateWith=(...equipped:string[])=>createInitialSurvivorsState('yoon',undefined,'stage_01','extreme',{owned:equipped,equipped});
const threat=(state:ReturnType<typeof stateWith>,type:Hazard['type']='GAS_LEAK'):Hazard=>({id:'risk',type,x:state.player.x,y:state.player.y,hp:99999,maxHp:99999,damage:30,radius:20,speed:0,expValue:1});
describe('premium equipment intervention in difficult patrols',()=>{
  it('absorbs a burst, passes overflow and only restores after depletion cadence',()=>{
    const state=stateWith('shock_mantle');state.phase='playing';
    expect(absorbPremiumDamage(state,30)).toBe(0);
    expect(state.premiumGear!.shield).toBe(15);
    expect(absorbPremiumDamage(state,30)).toBe(15);
    expect(state.premiumGear!.shieldCooldown).toBe(18);
    state.phase='paused';tickPremiumGear(state,18);
    expect(state.premiumGear!.shield).toBe(0);
    state.phase='playing';tickPremiumGear(state,17.9);
    expect(state.premiumGear!.shield).toBe(0);
    tickPremiumGear(state,.11);expect(state.premiumGear!.shield).toBe(45);
  });
  it('uses real collision damage in extreme rather than a presentation-only shield',()=>{
    const plain=stateWith(),protectedState=stateWith('shock_mantle');
    for(const state of [plain,protectedState]){
      const engine=new SurvivorsEngine(state,42);engine.start();state.hazards=[threat(state)];
      state.interactiveHazards=[];engine.update(1/60,{moveX:0,moveY:0});
    }
    expect(plain.player.hp).toBe(70);
    expect(protectedState.player.hp).toBe(120);
    expect(protectedState.premiumGear!.shield).toBe(15);
  });
  it('suppresses physical risk approach without changing people or warning clocks',()=>{
    const state=stateWith('inspection_wing');
    expect(premiumHazardSpeed(state,threat(state))).toBe(.8);
    expect(premiumHazardSpeed(state,threat(state,'RUNAWAY_CART'))).toBe(.8);
    expect(premiumHazardSpeed(state,threat(state,'UNHELMETED'))).toBe(1);
    const far=threat(state);far.x+=181;expect(premiumHazardSpeed(state,far)).toBe(1);
  });
  it('grants tactical stock and caps automatic shout charge while respecting pause',()=>{
    const state=stateWith('barrier_forge','predictive_watch','rescue_wing');
    // The same tactics slot is sanitized to one equipped item.
    expect(state.fieldTactics!.lineCharges).toBe(5);
    expect(state.fieldTactics!.supportCharges).toBe(2);
    const watch=stateWith('predictive_watch');watch.phase='playing';
    expect(watch.fieldTactics!.supportCharges).toBe(4);
    watch.ultimateCharge=99;tickPremiumGear(watch,2);expect(watch.ultimateCharge).toBe(100);
    watch.ultimateCharge=0;watch.phase='paused';tickPremiumGear(watch,20);expect(watch.ultimateCharge).toBe(0);
  });
  it('keeps all artwork cells unique and combines protection cadence deterministically',()=>{
    expect(STORE_ITEMS).toHaveLength(16);
    expect(new Set(STORE_ITEMS.map(i=>i.art)).size).toBe(16);
    const effects=storeEffects({owned:['shock_mantle','rescue_wing'],equipped:['shock_mantle','rescue_wing']});
    expect(effects.shield).toBe(60);expect(effects.shieldPeriod).toBe(18);
  });
});
