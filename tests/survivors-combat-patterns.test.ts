import { describe, expect, it } from 'vitest';
import type { Hazard } from '../src/domain/patrol-survivors';
import { isHazardContactActive, updateHazardMotion } from '../src/engine/patrol-hazard-motion';
import { createInitialSurvivorsState, SurvivorsEngine } from '../src/engine/patrol-survivors-engine';

function cart(): Hazard {
  return {id:'cart',type:'RUNAWAY_CART',x:500,y:450,hp:100,maxHp:100,speed:180,radius:18,damage:22,expValue:7,
    motion:{phase:'approach',timer:0,directionX:0,directionY:0}};
}
function fall(): Hazard {
  return {...cart(),id:'fall',type:'FALLING_DEBRIS',x:700,radius:38,
    motion:{phase:'warning',timer:1.25,directionX:0,directionY:0}};
}
function engine(h: Hazard) {
  const e = new SurvivorsEngine(createInitialSurvivorsState('player'), 1);
  e.start(); e.state.interactiveHazards = [];
  for (const key of Object.keys(e.state.activePerks) as Array<keyof typeof e.state.activePerks>) e.state.activePerks[key] = 0;
  e.state.hazards = [h];
  return e;
}

describe('readable construction combat patterns', () => {
  it('locks cart direction during warning and lets a sideways dodge avoid pursuit', () => {
    const player = createInitialSurvivorsState('player').player;
    const h=cart(); updateHazardMotion(h,player,1/60,h.speed);
    expect(h.motion?.phase).toBe('warning');
    expect(h.x).toBe(500);
    player.y=650;
    updateHazardMotion(h,player,0.91,h.speed);
    expect(h.motion?.phase).toBe('charge');
    updateHazardMotion(h,player,0.5,h.speed);
    expect(h.y).toBe(450);
    expect(h.x).toBeCloseTo(689);
    updateHazardMotion(h,player,0.6,h.speed);
    expect(h.motion?.phase).toBe('cooldown');
    const x=h.x;
    updateHazardMotion(h,player,0.5,h.speed);expect(h.x).toBe(x);
  });
  it('gives designated equipment a longer warning', () => {
    const h=cart(); h.isStageBoss=true;
    updateHazardMotion(h,createInitialSurvivorsState('player').player,1/60,h.speed);
    expect(h.motion?.timer).toBe(1.2);
  });
  it('only enables falling contact during the marked impact window', () => {
    const h=fall(); const player=createInitialSurvivorsState('player').player;
    expect(isHazardContactActive(h)).toBe(false);
    updateHazardMotion(h,player,1.26,h.speed);
    expect(isHazardContactActive(h)).toBe(true);
    player.x=900;updateHazardMotion(h,player,0.66,h.speed);
    expect(h.x).toBe(700);expect(isHazardContactActive(h)).toBe(false);
  });
  it('does not damage during warning and pauses the countdown with the session', () => {
    const e=engine(fall()); const hp=e.state.player.hp;
    e.update(0.2,{moveX:0,moveY:0});expect(e.state.player.hp).toBe(hp);
    const timer=e.state.hazards[0]!.motion!.timer;
    e.setPaused(true);e.update(0.2,{moveX:0,moveY:0});
    expect(e.state.hazards[0]!.motion!.timer).toBe(timer);
    e.setPaused(false);
    for(let i=0;i<70;i++) e.update(1/60,{moveX:0,moveY:0});
    expect(e.state.player.hp).toBeLessThan(hp);
  });
  it('removes avoided debris without free score, drops, or control count', () => {
    const h=fall(); h.motion!.phase='spent';h.motion!.timer=0.01;
    const e=engine(h);e.update(1/60,{moveX:0,moveY:0});
    expect(e.state.hazards).toHaveLength(0);expect(e.state.score).toBe(0);
    expect(e.state.drops).toHaveLength(0);expect(e.state.hazardsNeutralized).toBe(0);
  });
  it('keeps emergency control effective during a falling warning', () => {
    const e=engine(fall());e.state.ultimateCharge=100;
    expect(e.triggerDirectorShout()).toBe(true);
    for(let i=0;i<180;i++)e.update(1/60,{moveX:0,moveY:0});
    expect(e.state.hazardsNeutralized).toBeGreaterThan(0);
  });
  it('ends charges at the map boundary instead of hiding equipment outside play', () => {
    const h=cart();h.x=1390;h.motion={phase:'charge',timer:1,directionX:1,directionY:0};
    const e=engine(h);e.update(0.1,{moveX:0,moveY:0});
    expect(h.x).toBe(1380);expect(h.motion.phase).toBe('cooldown');
  });
});
