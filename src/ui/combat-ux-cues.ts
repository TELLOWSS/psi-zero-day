/** HUD copy resolves to decisions, not redundant score labels. Pure and save-free. */
export type GuardTacticalTone='critical'|'hold'|'engaged'|'planning'|'secured';
export interface GuardTacticalSignal {readonly tone:GuardTacticalTone;readonly headline:string;readonly detail:string;}
export function guardTacticalCue(input:{status:string;paused:boolean;shield:number;enemyCount:number;mastery:boolean}):GuardTacticalSignal{
 if(input.status==='LOST')return {tone:'critical',headline:'방호 종료 · 재정비',detail:'위험 유출 기록을 확인하고 타워 배치를 다시 검토하세요.'};
 if(input.status==='WON')return {tone:'secured',headline:'작전 완료 · 방호 성공',detail:'웨이브별 결과와 실드 손실을 검토하세요.'};
 if(input.paused)return {tone:'hold',headline:'전술 일시정지 · 배치 점검',detail:'타워 재배치와 표적 우선순위를 확인한 뒤 재개하세요.'};
 if(input.status==='RUNNING'&&input.shield<=3)return {tone:'critical',headline:'방호선 위기 · 실드 '+Math.max(0,input.shield),detail:'유출 위험이 높습니다. 즉시 표적과 긴급 정지 수단을 확인하세요.'};
 if(input.status==='RUNNING'&&input.enemyCount>0)return {tone:'engaged',headline:'위험 '+input.enemyCount+'개체 접근',detail:input.mastery?'우선 차단 유형과 실드 추가 손실을 확인하세요.':'타워 표적과 대응 동선을 확인하세요.'};
 if(input.status==='RUNNING')return {tone:'engaged',headline:'현재 웨이브 진행 중',detail:'다음 위험 출현에 대비해 배치 상태를 확인하세요.'};
 if(input.status==='INTERMISSION')return {tone:'planning',headline:'웨이브 사이 · 다음 위험 대비',detail:'장비를 보강하고 다음 웨이브의 위험 유형을 확인하세요.'};
 return {tone:'planning',headline:'작전 준비 · 장비 배치',detail:'지원 대원과 타워를 확인한 뒤 시작하세요.'};
}
export type WatchBossTacticalTone='dodge'|'attack'|'hold';
export interface WatchBossTacticalSignal {readonly tone:WatchBossTacticalTone;readonly label:string;}
export function watchBossTacticalCue(core:'active'|'interlocked'|'exposed',phase:string|undefined):WatchBossTacticalSignal{
 // A damage-gated boss core is never advertised as an attack opportunity.
 if(core==='interlocked')return phase==='recovery'||phase==='burst'?{tone:'hold',label:'다음 경고 대기'}:{tone:'dodge',label:'경고 확인 · 회피'};
 if(core==='exposed')return {tone:'attack',label:'약점 개방 · 집중 공격'};
 if(phase==='warning'||phase==='charge'||phase==='fall'||phase==='pattern')return {tone:'dodge',label:'공격 예고 · 회피'};
 return {tone:'hold',label:'보스 동선 확인'};
}
