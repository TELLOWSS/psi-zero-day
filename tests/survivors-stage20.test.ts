import { describe, expect, it } from 'vitest';
import { STAGE_IDS, stagesFromSave } from '../src/app/survivors-save';
import { PATROL_STAGES, CHARACTER_PROFILES, createInitialSurvivorsState, SurvivorsEngine } from '../src/engine/patrol-survivors-engine';
import sites from '../content/defense/site-profiles-v1.json';
import {operationTiming} from '../src/engine/survivors-operation';

describe('twenty-stage connected campaign', () => {
  it('recovers expansion unlocks from completion records without unlocking uncompleted missions', () => {
    expect(stagesFromSave(['stage_01','stage_10'], {stage_10:[true,false,false]})).toEqual(['stage_01','stage_10','stage_11']);
    expect(stagesFromSave(['stage_19'], {stage_19:[true,true,false]})).toEqual(['stage_01','stage_19','stage_20']);
    expect(stagesFromSave(['stage_20'], {stage_20:[true,true,true]})).toEqual(['stage_01','stage_20','stage_21']);
    expect(stagesFromSave([], {stage_10:[false,true,true]})).toEqual(['stage_01']);
    expect(STAGE_IDS).toHaveLength(50);
  });
  it.each(STAGE_IDS.slice(10,20))('%s has a valid speaker, profile, objectives and real boss', id => {
    const stage=PATROL_STAGES[id];
    expect(CHARACTER_PROFILES[stage.narrative!.speaker]).toBeDefined();
    expect(sites.profiles.some(p=>p.id===stage.siteProfileId)).toBe(true);
    expect(stage.narrative!.success).not.toBe(stage.narrative!.residual);
    expect(stage.hazards).toHaveLength(4);
    expect(stage.starChallenges.map(c=>c.targetValue).every(v=>v>0)).toBe(true);
    const e=new SurvivorsEngine(createInitialSurvivorsState('safety_monitor',undefined,id),42);e.start();e.state.gameTime=operationTiming(e.state.maxTime).bossAt;
    e.update(1/60,{moveX:0,moveY:0});
    for(let i=0;i<Math.ceil(e.state.bossEncounter!.introDuration!*60)+2;i++) e.update(1/60,{moveX:0,moveY:0});
    const boss=e.state.hazards.find(h=>h.isStageBoss)!;
    expect(boss.type).toBe(stage.bossType);expect(boss.maxHp).toBe(Math.round(stage.bossHp*1.15));
    boss.hp=0;e.update(1/60,{moveX:0,moveY:0});
    expect(e.drainAudioEvents().some(a=>a.type==='control'&&a.outcome==='boss'&&a.actorKind===stage.bossType)).toBe(true);
  });
});
