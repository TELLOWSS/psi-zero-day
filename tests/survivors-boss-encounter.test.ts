import {it,expect} from 'vitest';
import {SurvivorsEngine,createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
it.each(['stage_01','stage_03','stage_22','stage_35'] as const)('introduces %s, resolves its signature then permits a one-burst finish and pays once',stage=>{
 const s=createInitialSurvivorsState('yoon',undefined,stage),e=new SurvivorsEngine(s,42);e.start();s.gameTime=61;
 const tick=(frames=1)=>{for(let i=0;i<frames;i++)e.update(1/60,{moveX:0,moveY:0});};
 tick();const boss=s.hazards.find(h=>h.isStageBoss)!;
 expect(s.bossEncounter?.phase).toBe('arrival');expect(boss.bossEncounterManaged).toBe(true);
 expect(Math.abs(boss.x-s.player.x)).toBeLessThanOrEqual(240);
 const hp=boss.hp,time=s.gameTime;s.ultimateCharge=100;expect(e.triggerDirectorShout()).toBe(false);
 tick(120);expect(boss.hp).toBe(hp);expect(s.gameTime).toBe(time);
 tick(100);expect(s.bossEncounter?.phase).toBe('combat');
 const hit=()=>{s.projectiles=[{id:crypto.randomUUID(),kind:'radio',x:boss.x,y:boss.y,vx:0,vy:0,radius:10,damage:1e8,duration:1,pierce:1}];tick();};
 hit();expect(boss.hp).toBe(boss.maxHp);expect(s.stageBossNeutralized).not.toBe(true);
 // Finish the actual motion transition rather than faking control accounting.
 s.player.x=boss.x+200;s.player.y=boss.y;
 boss.motion!.phase=boss.type==='RUNAWAY_CART'||boss.type==='GAS_LEAK'?'charge':'fall';boss.motion!.timer=.001;tick(20);
 expect(boss.bossGameplay?.combatPhase).toBe('weak_point');
 hit();expect(boss.hp).toBe(boss.maxHp);expect(boss.bossGameplay?.combatPhase).toBe('burst');
 hit();tick(20);
 expect(s.stageBossNeutralized).toBe(true);expect(s.bossEncounter?.phase).toBe('secured');expect(s.phase).toBe('playing');
 const credits=s.psiCredits,playerHp=s.player.hp;tick(120);expect(s.psiCredits).toBe(credits);expect(s.player.hp).toBe(playerHp);
 tick(30);expect(s.phase).toBe('victory');expect(s.psiCredits).toBeGreaterThan(credits);
 const reward=s.psiCredits;tick(180);expect(s.psiCredits).toBe(reward);
});
