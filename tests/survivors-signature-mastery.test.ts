import {describe,expect,it} from 'vitest';
import {createInitialSurvivorsState,PATROL_STAGES,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import {signatureEventPlan,type WaveSignatureEvent} from '../src/engine/survivors-signature-events';
import {
  createSignatureMasteryState,
  signatureMasteryBossFinish,
  signatureMasteryBreak,
  signatureMasterySuccess,
} from '../src/engine/survivors-signature-mastery';

describe('signature mastery chain',()=>{
  it('requires two perfect signatures before a boss finisher can complete ZERO DAY CHAIN',()=>{
    const start=createSignatureMasteryState();
    const one=signatureMasterySuccess(start,'cart_convoy');
    expect(one.chain).toBe(1);
    expect(one.finisherArmed).toBe(false);
    expect(one.notice?.kind).toBe('perfect');

    const two=signatureMasterySuccess(one,'precollapse_signal');
    expect(two.chain).toBe(2);
    expect(two.best).toBe(2);
    expect(two.finisherArmed).toBe(true);
    expect(two.notice?.title).toContain('PERFECT ×2');

    const premature=signatureMasteryBossFinish(one);
    expect(premature.zeroDay).toBe(false);
    expect(premature.chain).toBe(1);

    const zeroDay=signatureMasteryBossFinish(two);
    expect(zeroDay.chain).toBe(3);
    expect(zeroDay.best).toBe(3);
    expect(zeroDay.zeroDay).toBe(true);
    expect(zeroDay.finisherArmed).toBe(false);
    expect(zeroDay.notice?.title).toBe('ZERO DAY CHAIN');
  });

  it('breaks an active mastery chain without penalizing ordinary run state',()=>{
    const chained=signatureMasterySuccess(createSignatureMasteryState(),'lifting_cross');
    const broken=signatureMasteryBreak(chained);
    expect(broken.chain).toBe(0);
    expect(broken.best).toBe(1);
    expect(broken.finisherArmed).toBe(false);
    expect(broken.zeroDay).toBe(false);
    expect(broken.notice?.kind).toBe('broken');
  });

  it('chains real signature counterplay success and resets when the next event misses its condition',()=>{
    const stage=PATROL_STAGES.stage_01;
    const engine=new SurvivorsEngine(createInitialSurvivorsState('safety_monitor',undefined,stage.id),4401);
    const plan=signatureEventPlan(stage,180);
    const internal=engine as unknown as {
      applySignatureCounterplay(event:WaveSignatureEvent,key:string,centroid:{x:number;y:number}):boolean;
      signatureEventStartedAt:Map<string,number>;
      signatureEventsFailed:Set<string>;
    };

    const first=plan[0]!,firstKey=`${first.wave}:${first.id}`;
    internal.signatureEventStartedAt.set(firstKey,engine.state.gameTime);
    expect(internal.applySignatureCounterplay(first,firstKey,{x:700,y:450})).toBe(true);
    expect(engine.state.signatureMastery?.chain).toBe(1);

    const second=plan[1]!,secondKey=`${second.wave}:${second.id}`;
    internal.signatureEventStartedAt.set(secondKey,engine.state.gameTime);
    expect(internal.applySignatureCounterplay(second,secondKey,{x:700,y:450})).toBe(true);
    expect(engine.state.signatureMastery?.chain).toBe(2);
    expect(engine.state.signatureMastery?.finisherArmed).toBe(true);

    internal.signatureEventsFailed.add(secondKey);
    const replayKey=`${secondKey}:retry`;
    internal.signatureEventStartedAt.set(replayKey,engine.state.gameTime);
    internal.signatureEventsFailed.add(replayKey);
    expect(internal.applySignatureCounterplay(second,replayKey,{x:700,y:450})).toBe(false);
    expect(engine.state.signatureMastery?.chain).toBe(0);
    expect(engine.state.signatureMastery?.best).toBe(2);
  });

  it('completes PERFECT ×3 only when an armed chain ends the boss through a weak point',()=>{
    const state=createInitialSurvivorsState('safety_monitor',undefined,'stage_03');
    state.phase='playing';
    state.signatureMastery={
      chain:2,best:2,perfectEvents:['cart_convoy','debris_corridor'],
      finisherArmed:true,zeroDay:false,
    };
    state.hazards.push({
      id:'mastery-boss',type:'CRANE_BOSS',x:700,y:450,hp:10,maxHp:10,speed:0,radius:32,damage:0,expValue:0,
      isStageBoss:true,weakPointExposed:true,weakPointTimer:5,
    });
    state.projectiles.push({
      id:'mastery-shot',x:700,y:450,vx:0,vy:0,radius:20,damage:20,duration:1,pierce:1,kind:'radio',
    });
    const engine=new SurvivorsEngine(state,4402);
    const internal=engine as unknown as {checkCollisions():void};
    internal.checkCollisions();

    expect(engine.state.stageBossNeutralized).toBe(true);
    expect(engine.state.signatureMastery?.chain).toBe(3);
    expect(engine.state.signatureMastery?.zeroDay).toBe(true);
    expect(engine.state.signatureMastery?.notice?.kind).toBe('zero_day');
    expect(engine.state.psiCredits).toBeGreaterThanOrEqual(75);
    expect(engine.state.timeDilation).toBe(.12);
    expect(engine.state.timeDilationTimer).toBeGreaterThanOrEqual(1.25);
    expect(engine.state.lastKilledEvents?.some(event=>event.boss&&event.mastery)).toBe(true);
  });

  it('does not award ZERO DAY CHAIN for an ordinary boss last hit',()=>{
    const state=createInitialSurvivorsState('safety_monitor',undefined,'stage_03');
    state.phase='playing';
    state.signatureMastery={
      chain:2,best:2,perfectEvents:['cart_convoy','debris_corridor'],
      finisherArmed:true,zeroDay:false,
    };
    state.hazards.push({
      id:'plain-boss',type:'CRANE_BOSS',x:700,y:450,hp:10,maxHp:10,speed:0,radius:32,damage:0,expValue:0,
      isStageBoss:true,
    });
    state.projectiles.push({
      id:'plain-shot',x:700,y:450,vx:0,vy:0,radius:20,damage:20,duration:1,pierce:1,kind:'radio',
    });
    const engine=new SurvivorsEngine(state,4403);
    const internal=engine as unknown as {checkCollisions():void};
    internal.checkCollisions();

    expect(engine.state.stageBossNeutralized).toBe(true);
    expect(engine.state.signatureMastery?.chain).toBe(2);
    expect(engine.state.signatureMastery?.zeroDay).toBe(false);
    expect(engine.state.lastKilledEvents?.some(event=>event.mastery)).toBe(false);
  });
});
