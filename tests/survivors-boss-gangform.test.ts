import {it,expect} from 'vitest';
import type {Hazard,Projectile} from '../src/domain/patrol-survivors';
import {createBossCombat,bossCombatDamage,tickBossCombat} from '../src/engine/survivors-boss-combat';
import {bossGameplayForStage} from '../src/engine/survivors-boss-gameplay';
import {tickGangform,gangformContact,hitGangformZone,gangformTarget} from '../src/engine/survivors-boss-gangform';
import {createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import {GangformMomentDirection} from '../src/ui/survivors-gangform-moment-direction';
function fixture(){
 const definition=bossGameplayForStage('stage_14'),player=createInitialSurvivorsState().player;
 const h:Hazard={id:'gangform',type:'CRANE_BOSS',x:700,y:300,hp:1000,maxHp:1000,speed:60,radius:34,damage:30,expValue:1,isStageBoss:true,bossEncounterManaged:true,bossGameplay:createBossCombat(definition),motion:{phase:'approach',timer:0,directionX:0,directionY:0}};
 h.bossGameplay!.combatPhase='pattern';return {h,player,definition};
}
const shot=(x:number,y:number,damage=60):Projectile=>({id:'shot',kind:'drone_laser',x,y,vx:0,vy:0,radius:7,damage,duration:1,pierce:1});
function expose(f:ReturnType<typeof fixture>){for(const dt of [1.2,3,1.2,.4])tickGangform(f.h,f.player,dt);}
it('runs a real swing followed by two locked falling zones, never exposing from body DPS',()=>{
 const f=fixture();tickGangform(f.h,f.player,1.2);expect(f.h.bossGameplay!.gangform!.step).toBe('pendulum');
 tickGangform(f.h,f.player,.75);expect(f.h.x).toBe(810);expect(gangformContact(f.h,{x:810,y:300})).toBe(true);
 tickGangform(f.h,f.player,2.25);const zones=f.h.bossGameplay!.gangform!.zones.map(z=>({...z}));
 tickGangform(f.h,{...f.player,x:100,y:100},1.2);expect(f.h.bossGameplay!.gangform!.zones).toEqual(zones);
 expect(gangformContact(f.h,zones[0]!)).toBe(true);bossCombatDamage(f.h,1e8,f.definition,true);expect(f.h.hp).toBe(1000);
 tickGangform(f.h,f.player,.4);expect(f.h.bossGameplay!.combatPhase).toBe('weak_point');
 bossCombatDamage(f.h,1e8,f.definition,true);expect(f.h.bossGameplay!.combatPhase).toBe('weak_point');
});
it('requires two distinct spatial points, redirects drone aim and opens exactly 4.5 seconds',()=>{
 const f=fixture();expose(f);const [a,b]=f.h.bossGameplay!.gangform!.zones;
 expect(gangformTarget(f.h,a!.x,a!.y)).toMatchObject({x:a!.x,y:a!.y});
 expect(hitGangformZone(f.h,shot(f.h.x,f.h.y),f.h)).toBeUndefined();
 hitGangformZone(f.h,shot(a!.x,a!.y),a!);expect(f.h.bossGameplay!.combatPhase).toBe('weak_point');
 expect(gangformTarget(f.h,a!.x,a!.y)).toMatchObject({x:b!.x,y:b!.y});
 hitGangformZone(f.h,shot(b!.x,b!.y),b!);expect(f.h.bossGameplay!.combatPhase).toBe('burst');expect(f.h.bossGameplay!.burstRemaining).toBe(4.5);
 expect(gangformContact(f.h,a!)).toBe(false);expect(f.h.hp).toBe(1000);
 tickBossCombat(f.h,4.5);tickBossCombat(f.h,1.2);expect(f.h.bossGameplay!.gangform).toBeUndefined();
});
it('retries missed drop zones, rejects early/zero damage and leaves other stages unchanged',()=>{
 const f=fixture();expect(hitGangformZone(f.h,shot(700,300),f.h)).toBeUndefined();expose(f);
 const a=f.h.bossGameplay!.gangform!.zones[0]!;expect(hitGangformZone(f.h,shot(a.x,a.y,0),a)).toBeUndefined();
 tickBossCombat(f.h,8);expect(f.h.bossGameplay!.combatPhase).toBe('recovery');
 f.h.bossGameplay=createBossCombat(bossGameplayForStage('stage_01'));f.h.bossGameplay.combatPhase='pattern';expect(tickGangform(f.h,f.player,1)).toBe(false);
});
it('connects zone collision to the live engine without granting premature boss kills',()=>{
 const f=fixture();expose(f);const s=createInitialSurvivorsState('yoon',undefined,'stage_14'),e=new SurvivorsEngine(s,42);e.start();
 s.stageBossSpawned=true;s.hazards=[f.h];s.bossEncounter={bossId:f.h.id,phase:'combat',remaining:0};
 const a=f.h.bossGameplay!.gangform!.zones[0]!;s.projectiles=[shot(a.x,a.y)];e.update(1/60,{moveX:0,moveY:0});expect(a.hp).toBe(0);expect(s.stageBossNeutralized).not.toBe(true);
});

it('ST14 real engine phases create exactly one actor radio and cue per causal signal',()=>{
 const f=fixture(),direction=new GangformMomentDirection();
 const cue=()=>direction.observe('stage_14','combat',[f.h],'lim_junho');
 tickGangform(f.h,f.player,.1);
 const warning=cue();
 expect(warning).toMatchObject({kind:'swing_warning'});
 expect(warning?.radio).toContain('갱폼이');
 expect(cue()).toBeNull();
 tickGangform(f.h,f.player,1.1);
 expect(cue()?.kind).toBe('swing');
 tickGangform(f.h,f.player,3);
 const debrisWarning=cue();
 expect(debrisWarning).toMatchObject({kind:'debris_warning'});
 expect(debrisWarning?.radio).toContain('두 군데');
 tickGangform(f.h,f.player,1.2);
 const debris=cue();
 expect(debris).toMatchObject({kind:'debris_impact',sfx:'impact_concrete'});
 expect(debris?.radio).toContain('떨어졌어요');
 tickGangform(f.h,f.player,.4);
 const exposed=cue();
 expect(exposed).toMatchObject({kind:'zone_exposure'});
 expect(exposed?.radio).toContain('두 지점을');
 const [a,b]=f.h.bossGameplay!.gangform!.zones;
 hitGangformZone(f.h,shot(a!.x,a!.y),a!);
 const one=cue();
 expect(one).toMatchObject({kind:'zone_secured'});
 expect(one?.radio).toContain('하나');
 hitGangformZone(f.h,shot(b!.x,b!.y),b!);
 const burst=cue();
 expect(burst).toMatchObject({kind:'burst',label:'핵심부 개방 · 4.5초'});
 expect(burst?.radio).toContain('지금');
 expect(f.h.bossGameplay!.burstRemaining).toBe(4.5);
 expect(cue()).toBeNull();
});
