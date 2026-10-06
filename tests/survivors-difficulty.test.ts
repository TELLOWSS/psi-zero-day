import { describe, expect, it } from 'vitest';
import { difficultyProfile, selectStageHazard, spawnPressure, waveDirector } from '../src/engine/survivors-difficulty';
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
  it('locks three distinct combat acts instead of one continuous pressure curve', () => {
    const opening=waveDirector(10,180);
    const wave2Surge=waveDirector(50,180);
    const wave2Recovery=waveDirector(62,180);
    const wave3=waveDirector(112,180);
    const bossPrelude=waveDirector(125,180);
    expect(opening.wave).toBe(1);expect(opening.key).toBe('scan_build');
    expect(wave2Surge.wave).toBe(2);expect(wave2Surge.surge).toBe(true);
    expect(wave2Recovery.wave).toBe(2);expect(wave2Recovery.recovery).toBe(true);
    expect(wave3.wave).toBe(3);expect(wave3.surge).toBe(true);
    expect(bossPrelude.wave).toBe(3);expect(bossPrelude.bossPrelude).toBe(true);
    expect(spawnPressure(20,50).interval).toBeLessThan(spawnPressure(20,10).interval);
    expect(spawnPressure(20,62).interval).toBeGreaterThan(spawnPressure(20,50).interval);
    expect(spawnPressure(20,112).activeLimit).toBeGreaterThan(spawnPressure(20,50).activeLimit);
    expect(spawnPressure(20,125).interval).toBeGreaterThan(spawnPressure(20,112).interval);
  });
  it('introduces map-specific hazards and reserves crane bosses for authored events', () => {
    for(const stage of Object.values(PATROL_STAGES)) {
      expect(selectStageHazard(stage,0,.9)).toBe('UNHELMETED');
      for(let r=0;r<1;r+=.1) expect(selectStageHazard(stage,170,r)).not.toBe('CRANE_BOSS');
    }
    expect(selectStageHazard(PATROL_STAGES.stage_02,40,.5)).toBe('GAS_LEAK');
    expect(selectStageHazard(PATROL_STAGES.stage_02,40,.5,180,.1)).toBe('UNHELMETED');
    expect(selectStageHazard(PATROL_STAGES.stage_02,50,0,180,.1)).toBe('GAS_LEAK');
    expect(selectStageHazard(PATROL_STAGES.stage_02,115,0,180,.1)).toBe('GAS_LEAK');
  });
  it.each(Object.keys(PATROL_STAGES))('%s bounds uncaught spawn pressure and emits one boss', id => {
    const e=new SurvivorsEngine(createInitialSurvivorsState('safety_monitor',undefined,id as keyof typeof PATROL_STAGES),42);
    // Isolate spawn scheduling from combat/XP; no human win-rate claim.
    const scheduler=e as unknown as {updateSpawns(dt:number):void};
    for(let t=0;t<180;t+=1/60) { e.state.gameTime=t; scheduler.updateSpawns(1/60); }
    expect(e.state.hazards.filter(h=>h.isStageBoss)).toHaveLength(1);
    const timeline=Array.from({length:181},(_,time)=>spawnPressure(e.state.stage.stageNumber,time,e.state.difficulty,e.state.maxTime));
    const peakActive=Math.max(...timeline.map(p=>p.activeLimit));
    const peakTelegraphs=Math.max(...timeline.map(p=>p.telegraphLimit));
    expect(e.state.hazards.length).toBeLessThanOrEqual(peakActive+1);
    expect(e.state.hazards.filter(h=>h.type==='RUNAWAY_CART'||h.type==='FALLING_DEBRIS').length)
      .toBeLessThanOrEqual(peakTelegraphs+1);
    expect(e.state.hazards.find(h=>h.isStageBoss)!.maxHp).toBe(Math.round(e.state.stage.bossHp*1.8));
  });
});
