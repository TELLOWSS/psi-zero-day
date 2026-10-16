import {it,expect} from 'vitest';
import type {Hazard,Projectile} from '../src/domain/patrol-survivors';
import {createBossCombat,bossCombatDamage,tickBossCombat} from '../src/engine/survivors-boss-combat';
import {bossGameplayForStage} from '../src/engine/survivors-boss-gameplay';
import {tickGangform,gangformContact,hitGangformZone,gangformTarget} from '../src/engine/survivors-boss-gangform';
import {createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
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
 hitGangformZone(f.h,shot(a!.x,a!.y),a!,a!);expect(f.h.bossGameplay!.combatPhase).toBe('weak_point');
 expect(gangformTarget(f.h,a!.x,a!.y)).toMatchObject({x:b!.x,y:b!.y});
 hitGangformZone(f.h,shot(b!.x,b!.y),b!,b!);expect(f.h.bossGameplay!.combatPhase).toBe('burst');expect(f.h.bossGameplay!.burstRemaining).toBe(4.5);
 expect(gangformContact(f.h,a!)).toBe(false);expect(f.h.hp).toBe(1000);
 tickBossCombat(f.h,4.5);tickBossCombat(f.h,1.2);expect(f.h.bossGameplay!.gangform).toBeUndefined();
});
it('retries missed drop zones, rejects early/zero damage and leaves other stages unchanged',()=>{
 const f=fixture();expect(hitGangformZone(f.h,shot(700,300),f.h)).toBeUndefined();expose(f);
 const a=f.h.bossGameplay!.gangform!.zones[0]!;expect(hitGangformZone(f.h,shot(a.x,a.y,0),a)).toBeUndefined();
 tickBossCombat(f.h,12);expect(f.h.bossGameplay!.combatPhase).toBe('recovery');
 f.h.bossGameplay=createBossCombat(bossGameplayForStage('stage_01'));f.h.bossGameplay.combatPhase='pattern';expect(tickGangform(f.h,f.player,1)).toBe(false);
});
it('connects zone collision to the live engine without granting premature boss kills',()=>{
 const f=fixture();expose(f);const s=createInitialSurvivorsState('yoon',undefined,'stage_14'),e=new SurvivorsEngine(s,42);e.start();
 s.stageBossSpawned=true;s.hazards=[f.h];s.bossEncounter={bossId:f.h.id,phase:'combat',remaining:0};
 const a=f.h.bossGameplay!.gangform!.zones[0]!;s.player.x=a.x;s.player.y=a.y;s.projectiles=[shot(a.x,a.y)];e.update(1/60,{moveX:0,moveY:0});expect(a.hp).toBe(0);expect(s.stageBossNeutralized).not.toBe(true);
});
it('rejects stationary remote fire and the second point before the first is secured',()=>{
 const f=fixture();expose(f);const [a,b]=f.h.bossGameplay!.gangform!.zones;
 expect(Math.hypot(a!.x-b!.x,a!.y-b!.y)).toBeGreaterThan(152);
 expect(hitGangformZone(f.h,shot(a!.x,a!.y),a!,f.player)).toBeUndefined();
 expect(hitGangformZone(f.h,shot(b!.x,b!.y),b!,b!)).toBeUndefined();
 expect(a!.hp).toBe(60);expect(b!.hp).toBe(60);
 hitGangformZone(f.h,shot(a!.x,a!.y),a!,a!);
 expect(hitGangformZone(f.h,shot(b!.x,b!.y),b!,a!)).toBeUndefined();
 hitGangformZone(f.h,shot(b!.x,b!.y),b!,b!);
 expect(f.h.bossGameplay!.combatPhase).toBe('burst');
});
it('keeps edge targets separate and out of actual terrain footprints',()=>{
 const f=fixture();f.player.x=40;f.player.y=40;
 const terrain=[{id:'pillar',kind:'pillar' as const,x:160,y:40,width:100,height:100,hp:1,maxHp:1}];
 for(const dt of [1.2,3,1.2,.4])tickGangform(f.h,f.player,dt,terrain);
 const zones=f.h.bossGameplay!.gangform!.zones;expect(zones).toHaveLength(2);
 for(const z of zones){expect(z.x>=80&&z.x<=1320&&z.y>=80&&z.y<=820).toBe(true);expect(z.x>108&&z.x<312&&z.y<192).toBe(false);}
 expect(Math.hypot(zones[0]!.x-zones[1]!.x,zones[0]!.y-zones[1]!.y)).toBeGreaterThanOrEqual(200);
});
