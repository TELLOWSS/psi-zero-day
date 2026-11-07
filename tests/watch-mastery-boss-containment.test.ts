import {describe,it,expect} from 'vitest';
import {createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import type {StageHazardObject} from '../src/domain/patrol-survivors';

const tickPressure=(engine:SurvivorsEngine,seconds:number)=>{
 const tick=engine as unknown as {updateStageHazards:(dt:number)=>void};
 for(let i=0;i<Math.ceil(seconds*60);i++)tick.updateStageHazards(1/60);
};
const startCombat=(difficulty:'mastery'|'extreme')=>{
 const state=createInitialSurvivorsState('yoon',undefined,'stage_50',difficulty,{owned:['shock_mantle'],equipped:['shock_mantle']});
 state.phase='playing';
 state.bossEncounter={bossId:'scripted-stage-boss',phase:'arrival',remaining:0};
 const engine=new SurvivorsEngine(state,53);
 (engine as unknown as {beginBossCombat:()=>void}).beginBossCombat();
 return {state,engine};
};
const lock=(items:StageHazardObject[])=>items.find(h=>h.id==='mastery-boss-50-lock');

describe('Watch final boss mastery positional containment',()=>{
 it('spawns only for mastery with a visible grace window and no tracking during warning',()=>{
   const veteran=startCombat('mastery'),normal=startCombat('extreme');
   expect(lock(normal.state.interactiveHazards)).toBeUndefined();
   const zone=lock(veteran.state.interactiveHazards)!;
   expect(zone.state).toBe('warning');expect(zone.timer).toBe(2.2);
   const first={x:zone.x,y:zone.y};
   veteran.state.player.x=Math.min(1300,first.x+240);
   veteran.state.player.y=Math.min(830,first.y+200);
   tickPressure(veteran.engine,1.5);
   expect({x:zone.x,y:zone.y}).toEqual(first);
   expect(veteran.state.masteryBossPressure?.exposures).toBe(0);
   tickPressure(veteran.engine,.75);
   expect(veteran.state.masteryBossPressure?.avoided).toBe(1);
   expect(veteran.state.masteryBossPressure?.exposures).toBe(0);
 });
 it('stillness consumes real shield, while moving or dashing avoids an avoidable boss hit',()=>{
   const {state,engine}=startCombat('mastery');
   const zone=lock(state.interactiveHazards)!;
   zone.x=state.player.x;zone.y=state.player.y;
   const oldShield=state.premiumGear!.shield;
   tickPressure(engine,2.25);
   expect(state.masteryBossPressure?.exposures).toBe(1);
   expect(state.premiumGear!.shield).toBeLessThan(oldShield);
   expect(state.player.hp).toBe(state.player.maxHp);
   // The next telegraph is re-aimed only once at a fresh point.
   tickPressure(engine,5.6);
   expect(zone.state).toBe('warning');
   expect(state.masteryBossPressure?.warnings).toBe(2);
   state.player.isDashing=true;
   tickPressure(engine,2.25);
   expect(state.masteryBossPressure?.avoided).toBe(1);
   expect(state.masteryBossPressure?.exposures).toBe(1);
   expect(state.masteryBossPressure?.streak).toBe(0);
 });
});
