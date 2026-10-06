import {expect,it} from 'vitest';
import {createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import {equipmentAnimationTime} from '../src/ui/survivors-equipment-clock';

it('follows body movement while combat hit-stop holds the world clock and freezes on pause',()=>{
  const state=createInitialSurvivorsState(),engine=new SurvivorsEngine(state,42);
  engine.start();engine.update(1/60,{moveX:1,moveY:0});
  const world=state.gameTime,before=equipmentAnimationTime(state),x=state.player.x;
  state.hitStopTimer=.08;engine.update(1/60,{moveX:1,moveY:0});
  expect(state.gameTime).toBe(world);expect(state.player.x).toBeGreaterThan(x);
  expect(equipmentAnimationTime(state)).toBeGreaterThan(before);
  state.phase='paused';const frozen=equipmentAnimationTime(state);
  engine.update(1/60,{moveX:1,moveY:0});expect(equipmentAnimationTime(state)).toBe(frozen);
});
it('supports legacy saves and rejects malformed animation timestamps',()=>{
  const state=createInitialSurvivorsState();state.gameTime=12;
  expect(equipmentAnimationTime(state)).toBe(12);
  state.playerMotionTime=NaN;expect(equipmentAnimationTime(state)).toBe(12);
  state.gameTime=Infinity;expect(equipmentAnimationTime(state)).toBe(0);
});
