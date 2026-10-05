import {describe,expect,it} from 'vitest';
import {PATROL_STAGE_IDS} from '../src/domain/patrol-survivors';
import {PATROL_STAGES,CHARACTER_PROFILES,createInitialSurvivorsState,SurvivorsEngine,WORLD_WIDTH,WORLD_HEIGHT} from '../src/engine/patrol-survivors-engine';
import {difficultyProfile,spawnPressure} from '../src/engine/survivors-difficulty';
import {operationPlan,operationProgress} from '../src/engine/survivors-operation';
import {stagesFromSave} from '../src/app/survivors-save';
import {characterGrowth,recordPatrolClear,validGrowthRecords} from '../src/domain/survivors-growth';
import {STAGE_ART} from '../src/ui/survivors-stage-art';
import sites from '../content/defense/site-profiles-v1.json';

describe('fifty authored patrol workfaces',()=>{
  it('has ordered unique IDs and preserves sequential legacy unlock recovery',()=>{
    expect(PATROL_STAGE_IDS).toHaveLength(50);
    expect(new Set(PATROL_STAGE_IDS).size).toBe(50);
    expect(new Set(Object.values(PATROL_STAGES).map(s=>s.name)).size).toBe(50);
    expect(stagesFromSave(['stage_20'],{stage_20:[true,false,false]})).toEqual(['stage_01','stage_20','stage_21']);
    expect(stagesFromSave(['stage_49'],{stage_49:[true,true,true]})).toEqual(['stage_01','stage_49','stage_50']);
    expect(stagesFromSave(['stage_50'],{stage_50:[true,true,true]})).toEqual(['stage_01','stage_50']);
  });
  it.each(PATROL_STAGE_IDS.slice(20))('%s has a real profile, distinct controls, feasible operation and boss',id=>{
    const stage=PATROL_STAGES[id],plan=operationPlan(stage);
    expect(sites.profiles.some(p=>p.id===stage.siteProfileId)).toBe(true);
    expect(CHARACTER_PROFILES[stage.narrative!.speaker]).toBeDefined();
    expect(stage.narrative!.success).not.toBe(stage.narrative!.residual);
    expect(STAGE_ART[id]!.detail).toBeGreaterThan(5);
    expect(plan.bossAt).toBeLessThan(180);
    expect(plan.zones).toBeLessThanOrEqual(stage.hazards.filter(h=>h.type!=='floodlight_tower'&&h.type!=='slurry_puddle').length);
    for(const h of stage.hazards){expect(h.x).toBeGreaterThan(80);expect(h.x).toBeLessThan(WORLD_WIDTH-80);expect(h.y).toBeGreaterThan(80);expect(h.y).toBeLessThan(WORLD_HEIGHT-80);expect(Math.hypot(h.x-700,h.y-450)).toBeGreaterThan(100);}
    const engine=new SurvivorsEngine(createInitialSurvivorsState('safety_monitor',undefined,id),42);engine.start();engine.state.gameTime=61;
    for(let i=0;i<100;i++)engine.update(1/60,{moveX:0,moveY:0});
    const boss=engine.state.hazards.find(h=>h.isStageBoss)!;
    expect(boss.type).toBe(stage.bossType);expect(boss.maxHp).toBe(Math.round(stage.bossHp*1.8));
    engine.state.gameTime=180;engine.state.stageBossNeutralized=true;engine.state.hazardsNeutralized=plan.controls;
    engine.state.operationControlledZones=stage.hazards.filter(h=>h.type!=='floodlight_tower'&&h.type!=='slurry_puddle').map(h=>h.id);
    expect(operationProgress(engine.state).complete).toBe(true);
  });
  it('extends pressure without negative intervals, unlimited crowds or changing early stages',()=>{
    expect(difficultyProfile(20).activeLimit).toBe(56);
    expect(difficultyProfile(50).activeLimit).toBe(66);
    expect(difficultyProfile(50).hpScale).toBeGreaterThan(difficultyProfile(20).hpScale);
    for(let n=1;n<=50;n++){expect(difficultyProfile(n).finalInterval).toBeGreaterThan(.35);expect(spawnPressure(n,180).interval).toBeGreaterThan(.25);expect(difficultyProfile(n).telegraphLimit).toBeLessThanOrEqual(4);}
    expect(difficultyProfile(500)).toEqual(difficultyProfile(50));
    expect(difficultyProfile(NaN)).toEqual(difficultyProfile(1));
  });
});

describe('character-specific growth memory',()=>{
  const state=()=>({...createInitialSurvivorsState('player'),phase:'victory' as const,starsEarned:[true,false,false] as [boolean,boolean,boolean]});
  it('attributes real victories and prevents replay farming, while improving earned goals',()=>{
    const s=state(),first=recordPatrolClear([],s);
    expect(characterGrowth(first,'player').clears).toBe(1);
    expect(characterGrowth(first,'kang_taesik').clears).toBe(0);
    expect(recordPatrolClear(first,s)).toEqual(first);
    s.starsEarned=[true,true,true];const improved=recordPatrolClear(first,s);
    expect(characterGrowth(improved,'player').controls).toBe(1);
    expect(first[0]!.stars).toEqual([true,false,false]);
    s.characterId='kang_taesik';expect(recordPatrolClear(improved,s)).toHaveLength(2);
  });
  it('does not write defeat, pause, choice or ready phases',()=>{
    for(const phase of ['defeat','ready','paused','levelup','playing'] as const)expect(recordPatrolClear([],{...state(),phase})).toEqual([]);
  });
  it('rejects malformed saves and does not invent a character for legacy global stars',()=>{
    expect(validGrowthRecords({stage_20:[true,true,true]})).toEqual([]);
    expect(validGrowthRecords([null,4,{characterId:'bad',stageId:'stage_50',stars:[true,true,true]},{characterId:'player',stageId:'stage_51',stars:[true,true,true]},{characterId:'player',stageId:'stage_50',stars:[false,true,true]}])).toEqual([]);
    expect(validGrowthRecords([{characterId:'player',stageId:'stage_01',stars:[true,'true',true]}])[0]!.stars).toEqual([true,false,true]);
  });
  it('tracks all five chapters and closes growth at fifty distinct clears',()=>{
    let records=validGrowthRecords([]);
    for(const stageId of PATROL_STAGE_IDS)records=recordPatrolClear(records,{...state(),stageId});
    const growth=characterGrowth(records,'player');
    expect(growth).toMatchObject({clears:50,highest:50,chapters:[10,10,10,10,10],next:0,storyTier:4});
    expect(characterGrowth(records.slice(0,10),'player').storyTier).toBe(1);
  });
});
