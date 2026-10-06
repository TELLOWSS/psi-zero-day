import {expect,it} from 'vitest';
import {SurvivorsEngine,createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {bossGameplayForStage} from '../src/engine/survivors-boss-gameplay';
import {PATROL_STAGE_IDS} from '../src/domain/patrol-survivors';
const input={moveX:1,moveY:0};
it.each(PATROL_STAGE_IDS)('uses approved intro timing and holds simulation for %s',stage=>{
 const s=createInitialSurvivorsState('yoon',undefined,stage),e=new SurvivorsEngine(s,42);e.start();s.gameTime=1000;
 e.update(1/60,input);const intro=bossGameplayForStage(stage).intro;
 expect(s.bossEncounter?.remaining).toBe(intro.firstPlaySeconds);expect(s.bossAlertTimer).toBe(intro.firstPlaySeconds);
 const time=s.gameTime,x=s.player.x,hp=s.player.hp;
 const frames=Math.round(intro.firstPlaySeconds*60);
 for(let i=0;i<frames-1;i++)e.update(1/60,input);
 expect(s.bossEncounter?.phase).toBe('arrival');expect(s.gameTime).toBe(time);expect(s.player.x).toBe(x);expect(s.player.hp).toBe(hp);
 e.update(2/60,input);expect(s.bossEncounter?.phase).toBe('combat');expect(e.skipBossIntro()).toBe(false);
});
it('only permits replays after approved time, rejects pause and cannot pay rewards',()=>{
 for(const replay of [false,true]){
  const s=createInitialSurvivorsState('yoon',undefined,'stage_01'),e=new SurvivorsEngine(s,42,replay);e.start();s.gameTime=1000;e.update(1/60,input);
  const boss=s.hazards.find(h=>h.isStageBoss)!,credits=s.psiCredits;
  expect(e.skipBossIntro()).toBe(false);
  for(let i=0;i<20;i++)e.update(1/60,input);expect(e.canSkipBossIntro()).toBe(false);
  e.update(1/60,input);expect(e.canSkipBossIntro()).toBe(replay);
  e.setPaused(true);expect(e.skipBossIntro()).toBe(false);
  const remaining=s.bossEncounter!.remaining;e.update(1,input);expect(s.bossEncounter!.remaining).toBe(remaining);
  e.setPaused(false);expect(e.skipBossIntro()).toBe(replay);
  if(replay){expect(s.bossEncounter?.phase).toBe('combat');expect(boss.bossGameplay?.combatPhase).toBe('pattern');expect(s.bossAlertTimer).toBe(0);expect(e.skipBossIntro()).toBe(false);}
  expect(s.psiCredits).toBe(credits);expect(s.stageBossNeutralized).not.toBe(true);
 }
});
