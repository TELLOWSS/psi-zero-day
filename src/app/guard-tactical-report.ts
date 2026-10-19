import type {DefenseContent,DefenseRunState,DefenseTacticalReport} from '../domain/defense';

export function guardTacticalReport(content:DefenseContent,run:DefenseRunState):DefenseTacticalReport|null{
 if(!content.combatReportEnabled||!run.tacticalStats)return null;
 return {runId:run.runId,contentVersion:content.contentVersion,supportId:run.supportId,won:run.status==='WON',shield:run.shield,stats:run.tacticalStats,
  loadout:run.towers.map(({padId,towerId,levelId,targetMode})=>({padId,towerId,levelId,targetMode}))};
}

export function guardDebriefAdvice(run:DefenseRunState):string{
 const leaks=run.leakedByEnemy;
 if((leaks.VEILED??0)>0)return 'guard.review.advice.VEILED';
 if((leaks.ARMORED??0)+(leaks.BOSS??0)>0)return 'guard.review.advice.ARMORED';
 if((leaks.SWARM??0)>0)return 'guard.review.advice.SWARM';
 if((leaks.SWIFT??0)>0)return 'guard.review.advice.SWIFT';
 if(Object.values(leaks).some(n=>(n??0)>0))return 'guard.review.advice.NORMAL';
 return 'guard.review.advice.CLEAR';
}

/** Describe recorded observations, never infer a single cause or a win probability. */
export function guardFailureReview(report:DefenseTacticalReport){
 const leaks=report.stats.routeLeaks??[];
 const counts=new Map<string,number>();for(const leak of leaks)counts.set(leak.enemyId,(counts.get(leak.enemyId)??0)+1);
 const recentLeaks=[...leaks].reverse();
 const targetRisk=recentLeaks.find(e=>e.enemyId==='SWIFT'&&e.targetsAtLeak?.some(t=>t.targetMode==='STRONG'));
 return {leaks:[...counts].sort((a,b)=>b[1]-a[1]),sampleCount:leaks.length,
  adviceId:targetRisk?'guard.review.advice.targetSwift':'guard.review.advice.changeOne',
  targetEvidence:targetRisk??recentLeaks.find(e=>e.targetsAtLeak!==undefined)};
}
