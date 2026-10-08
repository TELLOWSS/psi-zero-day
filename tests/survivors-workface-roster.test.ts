import {describe,expect,it} from 'vitest';
import {WORKFACE_SPECIES,workfaceSpecies,workfaceSpeedScale,workfaceChargeScale} from '../src/engine/survivors-workface-roster';
import {PATROL_STAGES,createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import {updateHazardMotion} from '../src/engine/patrol-hazard-motion';
import type {Hazard} from '../src/domain/patrol-survivors';

describe('industrial workface population',()=>{
  it('covers all fifty stages with correct material families and uses all twelve assets',()=>{
    const seen=new Set();
    for(let n=1;n<=50;n++)for(const [type,start,end] of [['RUNAWAY_CART',0,4],['FALLING_DEBRIS',4,8],['GAS_LEAK',8,12]] as const){
      const species=workfaceSpecies(n,type)!;seen.add(species);
      expect(WORKFACE_SPECIES.indexOf(species)).toBeGreaterThanOrEqual(start);
      expect(WORKFACE_SPECIES.indexOf(species)).toBeLessThan(end);
    }
    expect(seen.size).toBe(12);
    expect(workfaceSpecies(1,'UNHELMETED')).toBeUndefined();
    expect(workfaceSpecies(50,'CRANE_BOSS')).toBeUndefined();
  });
  it('assigns identities during real seeded spawning across the campaign',()=>{
    for(const stage of Object.values(PATROL_STAGES)){
      const s=createInitialSurvivorsState();s.stage=stage;
      const engine=new SurvivorsEngine(s,42);engine.start();s.interactiveHazards=[];s.gameTime=90;
      s.player.maxHp=s.player.hp=100000;s.player.invincibleTime=999;
      for(let i=0;i<180;i++)engine.update(1/60,{moveX:0,moveY:0});
      expect(s.hazards.length).toBeGreaterThan(0);
      expect(s.hazards.some(h=>h.species!==undefined)).toBe(true);
      for(const h of s.hazards.filter(h=>!h.isStageBoss))expect(h.species).toBe(workfaceSpecies(stage.stageNumber,h.type));
    }
  });
  it('accelerates and brakes smoothly along the warned direction without tracking the player',()=>{
    const h:Hazard={id:'cart',type:'RUNAWAY_CART',species:'forklift',x:0,y:0,hp:10,maxHp:10,speed:180,radius:18,damage:1,expValue:1,motion:{phase:'charge',timer:1.05,directionX:1,directionY:0}};
    const player=createInitialSurvivorsState().player;
    expect(workfaceChargeScale(h)).toBeCloseTo(.35);
    h.motion!.timer=.65;expect(workfaceChargeScale(h)).toBe(1);
    h.motion!.timer=.01;expect(workfaceChargeScale(h)).toBeLessThan(.4);
    h.motion!.timer=1.05;
    for(let i=0;i<65;i++){player.y+=10;updateHazardMotion(h,player,1/60,h.speed);}
    expect(h.y).toBe(0);expect(h.x).toBeGreaterThan(200);expect(h.motion!.phase).toBe('cooldown');
    expect(workfaceChargeScale({...h,species:undefined})).toBe(1);
    expect(workfaceSpeedScale('excavator')).toBeLessThan(workfaceSpeedScale('forklift'));
  });
});
