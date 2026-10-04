import { describe, expect, it } from 'vitest';
import { difficultyProfile, selectStageHazard, spawnPressure } from '../src/engine/survivors-difficulty';
import { PATROL_STAGES, createInitialSurvivorsState, SurvivorsEngine } from '../src/engine/patrol-survivors-engine';

describe('map difficulty progression', () => {
  it('ramps all twenty maps gradually while bounding crowding', () => {
    for (let n=1; n<=20; n++) {
      const p=difficultyProfile(n);
      expect(p.finalInterval).toBeGreaterThan(.48);
      expect(p.activeLimit).toBeLessThanOrEqual(56);
      expect(spawnPressure(n,170).interval).toBeLessThan(spawnPressure(n,10).interval);
      if(n>1) expect(p.openingInterval).toBeLessThan(difficultyProfile(n-1).openingInterval);
    }
  });
  it('creates boss and wave recovery windows without changing warning duration', () => {
    for (const t of [60,95,140]) {
      expect(spawnPressure(20,t).recovery).toBe(true);
      expect(spawnPressure(20,t).interval).toBeGreaterThan(spawnPressure(20,t-1).interval);
    }
  });
  it('introduces map-specific hazards and reserves crane bosses for authored events', () => {
    for(const stage of Object.values(PATROL_STAGES)) {
      expect(selectStageHazard(stage,0,.9)).toBe('UNHELMETED');
      for(let r=0;r<1;r+=.1) expect(selectStageHazard(stage,170,r)).not.toBe('CRANE_BOSS');
    }
    expect(selectStageHazard(PATROL_STAGES.stage_02,40,.5)).toBe('GAS_LEAK');
  });
  it.each(Object.keys(PATROL_STAGES))('%s bounds uncaught spawn pressure and emits one boss', id => {
    const e=new SurvivorsEngine(createInitialSurvivorsState('safety_monitor',undefined,id as keyof typeof PATROL_STAGES),42);
    // Isolate spawn scheduling from combat/XP; no human win-rate claim.
    const scheduler=e as unknown as {updateSpawns(dt:number):void};
    for(let t=0;t<180;t+=1/60) { e.state.gameTime=t; scheduler.updateSpawns(1/60); }
    expect(e.state.hazards.filter(h=>h.isStageBoss)).toHaveLength(1);
    expect(e.state.hazards.length).toBeLessThanOrEqual(difficultyProfile(e.state.stage.stageNumber).activeLimit+1);
    expect(e.state.hazards.filter(h=>h.type==='RUNAWAY_CART'||h.type==='FALLING_DEBRIS').length)
      .toBeLessThanOrEqual(difficultyProfile(e.state.stage.stageNumber).telegraphLimit+1);
    expect(e.state.hazards.find(h=>h.isStageBoss)!.maxHp).toBe(Math.round(e.state.stage.bossHp*1.8));
  });
});
