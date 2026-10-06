import {describe,expect,it} from 'vitest';
import {PATROL_STAGES,SurvivorsEngine,createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {operationPlan,operationTiming} from '../src/engine/survivors-operation';
import {signatureEventIdentity,signatureEventPlan,signatureEventSpawns,signatureStageFusion,type SignatureEventId} from '../src/engine/survivors-signature-events';

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
        expect(event.stageSkin).toBe(stage.theme);
        expect(event.workface.length).toBeGreaterThan(4);
        expect(event.stageAccent).toMatch(/^#/);
        expect(['metal','concrete','vapor','electric']).toContain(event.materialCue);
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

  it('fuses every signature with five distinct construction workfaces',()=>{
    const representatives=[
      PATROL_STAGES.stage_01,
      PATROL_STAGES.stage_02,
      PATROL_STAGES.stage_03,
      PATROL_STAGES.stage_04,
      PATROL_STAGES.stage_05,
    ];
    const ids:SignatureEventId[]=['cart_convoy','gas_bloom','lifting_cross','debris_corridor','equipment_pincer','precollapse_signal'];
    expect(new Set(representatives.map(stage=>stage.theme)).size).toBe(5);
    for(const id of ids){
      const fused=representatives.map(stage=>signatureStageFusion(stage,id));
      expect(new Set(fused.map(row=>row.title)).size).toBe(5);
      expect(new Set(fused.map(row=>row.workface)).size).toBe(5);
      expect(new Set(fused.map(row=>row.accent)).size).toBe(5);
      expect(fused.every(row=>row.detail.length>20)).toBe(true);
    }
    expect(signatureStageFusion(PATROL_STAGES.stage_01,'cart_convoy').title).toContain('덤프트럭');
    expect(signatureStageFusion(PATROL_STAGES.stage_02,'precollapse_signal').title).toContain('흙막이');
    expect(signatureStageFusion(PATROL_STAGES.stage_03,'lifting_cross').title).toContain('타워크레인');
    expect(signatureStageFusion(PATROL_STAGES.stage_04,'gas_bloom').title).toContain('CO');
    expect(signatureStageFusion(PATROL_STAGES.stage_05,'cart_convoy').title).toContain('UPS');
  });

  it('adapts material sound cues to the incident inside each workface',()=>{
    expect(signatureStageFusion(PATROL_STAGES.stage_01,'cart_convoy').materialCue).toBe('metal');
    expect(signatureStageFusion(PATROL_STAGES.stage_01,'gas_bloom').materialCue).toBe('vapor');
    expect(signatureStageFusion(PATROL_STAGES.stage_03,'lifting_cross').materialCue).toBe('concrete');
    expect(signatureStageFusion(PATROL_STAGES.stage_05,'lifting_cross').materialCue).toBe('electric');
    expect(signatureStageFusion(PATROL_STAGES.stage_05,'equipment_pincer').materialCue).toBe('metal');
  });

  it('changes signature approach geometry by construction workface',()=>{
    const highrise=signatureEventSpawns(PATROL_STAGES.stage_07,'cart_convoy');
    expect(highrise.every(spawn=>spawn.x>1300)).toBe(true);
    expect(highrise.every(spawn=>spawn.directionX===-1)).toBe(true);

    const datacenter=signatureEventSpawns(PATROL_STAGES.stage_09,'gas_bloom');
    expect(datacenter.every(spawn=>[270,450,630].includes(spawn.y))).toBe(true);

    const curing=signatureEventSpawns(PATROL_STAGES.stage_04,'debris_corridor');
    const curingY=curing.map(spawn=>spawn.y);
    expect(Math.max(...curingY)-Math.min(...curingY)).toBeLessThan(160);

    const excavation=signatureEventSpawns(PATROL_STAGES.stage_02,'gas_bloom');
    const excavationX=excavation.map(spawn=>spawn.x);
    expect(Math.max(...excavationX)-Math.min(...excavationX)).toBeLessThan(400);

    for(const stage of Object.values(PATROL_STAGES)){
      for(const id of ['cart_convoy','gas_bloom','lifting_cross','debris_corridor','equipment_pincer','precollapse_signal'] as SignatureEventId[]){
        for(const spawn of signatureEventSpawns(stage,id)){
          expect(spawn.x).toBeGreaterThanOrEqual(0);expect(spawn.x).toBeLessThanOrEqual(1400);
          expect(spawn.y).toBeGreaterThanOrEqual(0);expect(spawn.y).toBeLessThanOrEqual(900);
        }
      }
    }
  });

  it('locks six different gameplay identities rather than six cosmetic labels',()=>{
    const ids:SignatureEventId[]=['cart_convoy','gas_bloom','lifting_cross','debris_corridor','equipment_pincer','precollapse_signal'];
    const identities=ids.map(id=>signatureEventIdentity(id));
    expect(new Set(identities.map(row=>row.mechanic)).size).toBe(6);
    expect(new Set(identities.map(row=>row.accent)).size).toBe(6);
    expect(signatureEventIdentity('precollapse_signal').cameraPressure)
      .toBeGreaterThan(signatureEventIdentity('gas_bloom').cameraPressure);
  });

  it('authors distinct hazard physics for speed, space, timing, pincer and collapse play',()=>{
    const all=Object.values(PATROL_STAGES).flatMap(stage=>signatureEventPlan(stage,180));
    const event=(id:SignatureEventId)=>all.find(row=>row.id===id)!;

    const convoy=event('cart_convoy');
    expect(convoy.spawns.every(spawn=>spawn.type==='RUNAWAY_CART')).toBe(true);
    expect(convoy.spawns.every(spawn=>(spawn.speedScale??0)>1.4)).toBe(true);
    expect(convoy.spawns.every(spawn=>spawn.directionX===1&&spawn.directionY===0)).toBe(true);
    expect(new Set(convoy.spawns.map(spawn=>spawn.warningTimer)).size).toBe(3);

    const gas=event('gas_bloom');
    expect(gas.spawns.every(spawn=>spawn.type==='GAS_LEAK')).toBe(true);
    expect(gas.spawns.every(spawn=>(spawn.speedScale??1)<.3)).toBe(true);
    expect(gas.spawns.every(spawn=>(spawn.radiusScale??1)>1.3)).toBe(true);

    const cross=event('lifting_cross');
    const crossDebris=cross.spawns.filter(spawn=>spawn.type==='FALLING_DEBRIS');
    expect(crossDebris.map(spawn=>spawn.warningTimer)).toEqual([.66,.94,1.22]);
    expect(cross.spawns.find(spawn=>spawn.type==='RUNAWAY_CART')?.directionX).toBe(-1);

    const corridor=event('debris_corridor');
    expect(corridor.spawns.map(spawn=>spawn.warningTimer)).toEqual([.48,.72,.96,1.2]);
    expect(corridor.spawns.every(spawn=>(spawn.radiusScale??1)>1)).toBe(true);

    const pincer=event('equipment_pincer');
    const carts=pincer.spawns.filter(spawn=>spawn.type==='RUNAWAY_CART');
    expect(carts.map(spawn=>spawn.directionX)).toEqual([1,-1]);
    expect(pincer.spawns.filter(spawn=>spawn.type==='GAS_LEAK').every(spawn=>(spawn.radiusScale??1)>1.5)).toBe(true);

    const collapse=event('precollapse_signal');
    const collapseDebris=collapse.spawns.filter(spawn=>spawn.type==='FALLING_DEBRIS');
    expect(collapseDebris[0]!.warningTimer).toBeGreaterThan(collapseDebris.at(-1)!.warningTimer!);
    expect(collapse.spawns.find(spawn=>spawn.type==='GAS_LEAK')!.radiusScale).toBeGreaterThan(1.7);
  });

  it('materializes authored physics into live hazards',()=>{
    const stage=Object.values(PATROL_STAGES).find(row=>signatureEventPlan(row,180).some(event=>event.id==='cart_convoy'))!;
    const engine=new SurvivorsEngine(createInitialSurvivorsState('safety_monitor',undefined,stage.id),2048);
    const trigger=engine as unknown as {updateSignatureEvents():void};
    const convoy=signatureEventPlan(stage,engine.state.maxTime).find(event=>event.id==='cart_convoy')!;
    engine.state.gameTime=convoy.at;
    trigger.updateSignatureEvents();
    const carts=engine.state.hazards.filter(h=>h.signatureEventId===`2:cart_convoy`);
    expect(carts).toHaveLength(3);
    expect(carts.every(h=>h.motion?.phase==='warning')).toBe(true);
    expect(carts.every(h=>h.motion?.directionX===1&&h.motion?.directionY===0)).toBe(true);
    expect(new Set(carts.map(h=>h.motion?.timer)).size).toBe(3);
    expect(carts.every(h=>h.speed>180)).toBe(true);
    expect(engine.state.signatureEvent?.mechanic).toBe('SPEED CHECK');
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
    expect(engine.state.signatureEvent?.mechanic).toBe(plan[0]!.mechanic);
    expect(engine.state.signatureEvent?.workface).toBe(plan[0]!.workface);
    expect(engine.state.signatureEvent?.stageSkin).toBe(engine.state.stage.theme);
    expect(engine.state.signatureEvent?.materialCue).toBe(plan[0]!.materialCue);
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
