import type {DefenseContent,DefenseEnemyId} from '../domain/defense';
/** Opt-in post-clear Guard challenge. Keep authored wave timing, enemy identity and previews stable. */
const HP_SCALE:Record<DefenseEnemyId,number>={NORMAL:1.26,SWIFT:1.22,ARMORED:1.33,SWARM:1.12,VEILED:1.3,BOSS:1.45};
const SPEED_SCALE:Record<DefenseEnemyId,number>={NORMAL:1,SWIFT:1.22,ARMORED:1.05,SWARM:1.08,VEILED:1.12,BOSS:1};
export function guardMasteryHp(hp:number,id:DefenseEnemyId,wave:number):number {
  return Math.ceil(hp*HP_SCALE[id]*(1+Math.min(.12,Math.max(0,wave-1)*.018)));
}
export function guardMasterySpeed(id:DefenseEnemyId):number {return SPEED_SCALE[id];}

/** Named, deterministic post-clear priority. Does not change the authored spawn schedule. */
export interface GuardMasteryWaveDirective {
  readonly enemy: DefenseEnemyId;
  readonly extraLeak: number;
  readonly advice: string;
}
const PRIORITY_ADVICE:Record<DefenseEnemyId,string>={
 NORMAL:'기본 위험 유입 구간에 저비용 방어선을 분산 배치',
 SWIFT:'빠른 통로의 사거리 겹침과 선제 타격을 우선 확보',
 ARMORED:'장갑 대응 화력과 방호 지원을 집중하고 순수 피해 활용',
 SWARM:'광역 공격과 경로 앞쪽 다중 타격을 확보',
 VEILED:'탐지탑의 연속 관측 범위를 먼저 확보',
 BOSS:'보스의 단계별 방호 타이밍에 맞춰 전술 지원 투입',
};
export function guardMasteryWaveDirective(content:DefenseContent,waveId:number):GuardMasteryWaveDirective|null {
 if(!content.scenario.id.startsWith('guard-gd-')||waveId<2)return null;
 const wave=content.waves.find(w=>w.id===waveId);
 const candidates=[...new Set((wave?.groups??[]).filter(g=>g.count>0&&g.enemy!=='BOSS').map(g=>g.enemy))];
 if(!candidates.length)return null;
 const stage=Number(content.scenario.id.match(/guard-gd-(\d+)/)?.[1]??1);
 const enemy=candidates[(stage+waveId-1)%candidates.length]!;
 return {enemy,extraLeak:enemy==='ARMORED'?2:1,advice:PRIORITY_ADVICE[enemy]};
}
