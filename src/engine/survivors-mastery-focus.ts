import type {HazardType,PatrolStageDefinition} from '../domain/patrol-survivors';

export interface MasteryStageFocus {
 readonly type: HazardType;
 readonly label: string;
 readonly hint: string;
}
const FOCUS:readonly MasteryStageFocus[]=[
 {type:'RUNAWAY_CART',label:'장비 진입 차단',hint:'주행 경고와 돌진 방향을 읽고 지형 차폐를 활용'},
 {type:'GAS_LEAK',label:'가스 확산 격리',hint:'발생 구역에서 이탈하고 확산 반경을 먼저 확인'},
 {type:'FALLING_DEBRIS',label:'상부 낙하 회피',hint:'낙하 예고 지점을 보고 차폐에 의존하지 않고 우회'},
];
const INTRO_MIXES:readonly (readonly HazardType[])[]=[
 ['UNHELMETED','UNHELMETED','RUNAWAY_CART'],
 ['UNHELMETED','GAS_LEAK','GAS_LEAK','RUNAWAY_CART'],
 ['UNHELMETED','FALLING_DEBRIS','RUNAWAY_CART'],
 ['UNHELMETED','RUNAWAY_CART','RUNAWAY_CART','GAS_LEAK'],
 ['UNHELMETED','GAS_LEAK','FALLING_DEBRIS','RUNAWAY_CART'],
];
/** Exactly the same authored or introductory fallback composition used by regular modes. */
export function authoredStageHazardMix(stage:Pick<PatrolStageDefinition,'stageNumber'|'hazardMix'>):readonly HazardType[]{
 return stage.hazardMix??INTRO_MIXES[Math.max(0,Math.min(4,stage.stageNumber-1))]??['UNHELMETED'];
}
/** A deterministic specialization chosen only from existing authored hazards. */
export function masteryStageFocus(stage:Pick<PatrolStageDefinition,'stageNumber'|'hazardMix'>):MasteryStageFocus|null{
 const mix=authoredStageHazardMix(stage);
 const available=FOCUS.filter(entry=>mix.includes(entry.type));
 if(!available.length)return null;
 const chapter=Math.floor((stage.stageNumber-1)/10);
 return available[(stage.stageNumber+chapter)%available.length]!;
}
