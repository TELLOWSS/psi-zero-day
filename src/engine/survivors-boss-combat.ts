import type { Hazard } from '../domain/patrol-survivors';
import type { BossGameplayDefinition, BossGameplayProgress } from '../domain/survivors-boss-gameplay';

export function createBossCombat(definition: BossGameplayDefinition): BossGameplayProgress {
  return {bossId:definition.bossId,patternId:definition.patternId,weakPointId:definition.weakPointId,
    combatPhase:'arrival',phaseIndex:1,signatureResolvedThisCycle:false,patternContact:false,
    burstRemaining:0,remaining:0,cycleCount:0};
}

export function resolveBossSignature(h: Hazard): void {
  const p=h.bossGameplay;if(!p||p.gangform||p.combatPhase!=='pattern')return;
  p.cycleCount++;
  p.signatureResolvedThisCycle=!p.patternContact;
  p.combatPhase=p.signatureResolvedThisCycle?'weak_point':'recovery';
  p.remaining=p.signatureResolvedThisCycle?2:1.2;
}

/** Returns true while the physical attack must remain stopped. */
export function tickBossCombat(h: Hazard, dt: number): boolean {
  const p=h.bossGameplay;if(!p)return false;
  if(p.combatPhase==='arrival'||p.combatPhase==='secured')return true;
  if(p.combatPhase==='pattern')return false;
  const elapsed=Math.max(0,dt);
  if(p.combatPhase==='burst'){
    p.burstRemaining=Math.max(0,p.burstRemaining-elapsed);
    if(p.burstRemaining===0){p.combatPhase='recovery';p.remaining=1.2;}
  }else{
    p.remaining=Math.max(0,p.remaining-elapsed);
    if(p.remaining===0){
      if(p.combatPhase==='weak_point'){p.combatPhase='recovery';p.remaining=1.2;}
      else{
        p.combatPhase='pattern';p.patternContact=false;p.signatureResolvedThisCycle=false;p.gangform=undefined;
        if(h.motion){h.motion.phase='approach';h.motion.timer=0;}
      }
    }
  }
  return true;
}

/** Passive equipment cannot resolve the signature or activate its weak point. */
export function bossCombatDamage(h: Hazard, amount: number, definition: BossGameplayDefinition, projectile=false): void {
  const p=h.bossGameplay;if(!p||!Number.isFinite(amount)||amount<=0)return;
  if(p.combatPhase==='weak_point'&&p.signatureResolvedThisCycle&&projectile){
    p.combatPhase='burst';p.remaining=0;p.burstRemaining=definition.burstWindowSeconds;
    return;
  }
  if(p.combatPhase!=='burst')return;
  h.hp=Math.max(0,h.hp-amount*2);
  if(h.hp===0){p.combatPhase='secured';p.burstRemaining=0;}
}
