import {describe,expect,it} from 'vitest';
import {PATROL_STAGES,SurvivorsEngine,createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {operationPlan,operationTiming} from '../src/engine/survivors-operation';
import {signatureEventPlan} from '../src/engine/survivors-signature-events';

describe('wave signature events',()=>{
  it('authors one Wave 2 and one Wave 3 event for all 50 stages',()=>{
    const ids=new Set<string>();
    const stages=Object.values(PATROL_STAGES);
    expect(stages).toHaveLength(50);
    for(const stage of stages){
      const timing=operationTiming(180);
      const plan=signatureEventPlan(stage,180);
      expect(plan).toHaveLength(2);
      expect(plan.map(event=>event.wave)).toEqual([2,3]);
      expect(plan[0]!.at).toBeGreaterThanOrEqual(timing.wave2At);
      expect(plan[0]!.at).toBeLessThan(timing.wave3At);
      expect(plan[1]!.at).toBeGreaterThanOrEqual(timing.wave3At);
      expect(plan[1]!.at).toBeLessThan(timing.bossRevealAt);
      for(const event of plan){
        ids.add(event.id);
        expect(event.warningLead).toBeGreaterThan(0);
        expect(event.reward).toBeGreaterThan(0);
        expect(event.spawns.length).toBeGreaterThanOrEqual(3);
        expect(event.spawns.length).toBeLessThanOrEqual(5);
        expect(event.spawns.every(spawn=>spawn.type!=='CRANE_BOSS')).toBe(true);
      }
    }
    expect(ids).toEqual(new Set([
      'cart_convoy','gas_bloom','lifting_cross',
      'debris_corridor','equipment_pincer','precollapse_signal',
    ]));
  });

  it('scales signature timings into the compact 60-second operation',()=>{
    const timing=operationTiming(60);
    const plan=signatureEventPlan(PATROL_STAGES.stage_01,60);
    expect(plan[0]!.at).toBeGreaterThan(timing.wave2At);
    expect(plan[0]!.at).toBeLessThan(timing.wave3At);
    expect(plan[1]!.at).toBeGreaterThan(timing.wave3At);
    expect(plan[1]!.at).toBeLessThan(timing.bossRevealAt);
  });

  it('executes each event once and never marks signature hazards as bosses',()=>{
    const engine=new SurvivorsEngine(createInitialSurvivorsState('safety_monitor',undefined,'stage_04'),73);
    const trigger=engine as unknown as {updateSignatureEvents():void};
    const plan=signatureEventPlan(engine.state.stage,engine.state.maxTime);
    engine.state.gameTime=plan[0]!.at-plan[0]!.warningLead;
    trigger.updateSignatureEvents();
    expect(engine.state.signatureEvent?.phase).toBe('warning');
    expect(engine.state.hazards).toHaveLength(0);
    const warningAudio=engine.drainAudioEvents().find(event=>event.type==='boss_alarm');
    expect(warningAudio?.x).toBeTypeOf('number');
    expect(warningAudio?.y).toBeTypeOf('number');

    engine.state.gameTime=plan[0]!.at;
    trigger.updateSignatureEvents();
    const afterWave2=engine.state.hazards.length;
    expect(afterWave2).toBe(plan[0]!.spawns.length);
    expect(engine.state.signatureEvent?.wave).toBe(2);
    expect(engine.state.signatureEvent?.phase).toBe('impact');
    expect(engine.state.hazards.every(h=>!h.isStageBoss)).toBe(true);
    expect(engine.state.hazards.every(h=>h.signatureEventId===`2:${plan[0]!.id}`)).toBe(true);

    trigger.updateSignatureEvents();
    expect(engine.state.hazards).toHaveLength(afterWave2);

    engine.state.gameTime=plan[1]!.at;
    trigger.updateSignatureEvents();
    expect(engine.state.hazards).toHaveLength(afterWave2+plan[1]!.spawns.length);
    expect(engine.state.signatureEvent?.wave).toBe(3);
    expect(engine.state.signatureEvent?.severity).toBe('red');
    expect(engine.state.signatureEvent?.phase).toBe('impact');
    expect(engine.state.hazards.every(h=>!h.isStageBoss&&h.type!=='CRANE_BOSS')).toBe(true);

    trigger.updateSignatureEvents();
    expect(engine.state.hazards).toHaveLength(afterWave2+plan[1]!.spawns.length);
  });

  it('releases pressure with a controlled reward only after every signature hazard is resolved',()=>{
    const engine=new SurvivorsEngine(createInitialSurvivorsState('safety_monitor',undefined,'stage_05'),117);
    const trigger=engine as unknown as {updateSignatureEvents():void};
    const event=signatureEventPlan(engine.state.stage,engine.state.maxTime)[0]!;
    engine.state.gameTime=event.at;
    trigger.updateSignatureEvents();
    engine.drainAudioEvents();
    const scoreBefore=engine.state.score,creditsBefore=engine.state.psiCredits;
    for(const hazard of engine.state.hazards.filter(h=>h.signatureEventId===`2:${event.id}`))hazard.hp=0;
    trigger.updateSignatureEvents();
    expect(engine.state.signatureEvent?.phase).toBe('resolved');
    expect(engine.state.signatureEvent?.reward).toBe(event.reward);
    expect(engine.state.score).toBe(scoreBefore+650);
    expect(engine.state.psiCredits).toBe(creditsBefore+event.reward);
    expect(engine.drainAudioEvents().some(audio=>audio.type==='control'&&audio.x!==undefined&&audio.y!==undefined)).toBe(true);
  });

  it('blocks an early boss reveal while a Wave 3 signature set piece is still live',()=>{
    const engine=new SurvivorsEngine(createInitialSurvivorsState('safety_monitor',undefined,'stage_04'),1337);
    engine.start();
    const plan=operationPlan(engine.state.stage,engine.state.maxTime);
    engine.state.gameTime=plan.revealAt;
    engine.state.hazardsNeutralized=plan.controls;
    engine.state.operationControlledZones=Array.from({length:plan.zones},(_,index)=>`zone-${index}`);
    engine.state.hazards.push({
      id:'signature-blocker',type:'GAS_LEAK',x:700,y:450,hp:1,maxHp:1,speed:0,radius:20,damage:0,expValue:0,
      signatureEventId:'3:precollapse_signal',
    });
    const internal=engine as unknown as {updateSpawns(dt:number):void};
    internal.updateSpawns(0);
    expect(engine.state.stageBossSpawned).not.toBe(true);

    engine.state.hazards[0]!.hp=0;
    internal.updateSpawns(0);
    expect(engine.state.stageBossSpawned).toBe(true);
    expect(engine.state.bossEncounter?.phase).toBe('arrival');
  });

  it('preserves authored set-piece placement instead of retargeting falling debris at spawn',()=>{
    const engine=new SurvivorsEngine(createInitialSurvivorsState('safety_monitor',undefined,'stage_04'),91);
    const trigger=engine as unknown as {updateSignatureEvents():void};
    const red=signatureEventPlan(engine.state.stage,engine.state.maxTime)[1]!;
    expect(red.id).toBe('debris_corridor');
    engine.state.gameTime=red.at;
    // Mark Wave 2 as already elapsed through a separate engine-level call.
    trigger.updateSignatureEvents();
    const authored=red.spawns.filter(spawn=>spawn.type==='FALLING_DEBRIS');
    for(const spawn of authored){
      expect(engine.state.hazards.some(h=>h.type==='FALLING_DEBRIS'&&h.x===spawn.x&&h.y===spawn.y)).toBe(true);
    }
  });
});
