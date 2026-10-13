import {expect,it} from 'vitest';
import {droneEmissionOrigin} from '../src/domain/survivors-drone-origin';
import {SurvivorsEngine,createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
it('preserves the existing orbit in every direction for ordinary and evolved drones',()=>{
 const player={x:123,y:456},before={...player};
 for(const evolved of [false,true])for(let i=0;i<(evolved?3:1);i++)for(let direction=0;direction<8;direction++){
  const angle=direction*Math.PI/4,phase=angle+(evolved?i*Math.PI*2/3:0),radius=evolved?85:65;
  const pose=droneEmissionOrigin(player,angle,evolved,i);
  expect(pose.x).toBeCloseTo(player.x+Math.cos(phase)*radius);
  expect(pose.y).toBeCloseTo(player.y+Math.sin(phase)*radius);
 }
 expect(player).toEqual(before);
});
it.each([false,true])('real engine launch receipts agree with the shared visible drone origin (evolved=%s)',evolved=>{
 const state=createInitialSurvivorsState();state.phase='playing';state.interactiveHazards=[];
 state.activePerks.safety_drone=5;state.activePerks.hunter_swarm=evolved?1:0;
 state.hazards=[{id:'target',type:'RUNAWAY_CART',x:state.player.x+120,y:state.player.y,hp:100000,maxHp:100000,speed:0,radius:20,damage:0,expValue:0}];
 const engine=new SurvivorsEngine(state);engine.update(1/60,{moveX:0,moveY:0});
 const events=engine.drainProjectileFeedback().filter(event=>event.phase==='launch'&&event.kind===(evolved?'hunter_beam':'drone_laser'));
 expect(events).toHaveLength(evolved?3:1);
 for(const [index,event] of events.entries()){
  const origin=droneEmissionOrigin(state.player,state.droneAngle??0,evolved,index);
  expect(event.x).toBeCloseTo(origin.x);expect(event.y).toBeCloseTo(origin.y);
 }
});
