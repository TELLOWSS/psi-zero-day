import type { Hazard, HazardType, PatrolStageDefinition } from '../domain/patrol-survivors';
import { operationTiming } from './survivors-operation';

export type SignatureEventId =
  | 'cart_convoy'
  | 'gas_bloom'
  | 'lifting_cross'
  | 'debris_corridor'
  | 'equipment_pincer'
  | 'precollapse_signal';

export interface SignatureSpawn {
  type: HazardType;
  x: number;
  y: number;
  variant?: Hazard['variant'];
  speedScale?: number;
  hpScale?: number;
  radiusScale?: number;
  warningTimer?: number;
  directionX?: number;
  directionY?: number;
}

export interface WaveSignatureEvent {
  id: SignatureEventId;
  wave: 2 | 3;
  at: number;
  title: string;
  detail: string;
  severity: 'amber' | 'red';
  warningLead: number;
  reward: number;
  mechanic: string;
  spawns: readonly SignatureSpawn[];
}

export interface SignatureEventIdentity {
  mechanic: string;
  accent: string;
  cameraPressure: number;
  impactActor: HazardType;
}

export function signatureEventIdentity(id:SignatureEventId):SignatureEventIdentity {
  switch(id){
    case 'cart_convoy': return {mechanic:'SPEED CHECK',accent:'#fb923c',cameraPressure:.86,impactActor:'RUNAWAY_CART'};
    case 'gas_bloom': return {mechanic:'AIR CONTROL',accent:'#22c55e',cameraPressure:.56,impactActor:'GAS_LEAK'};
    case 'lifting_cross': return {mechanic:'CROSSING TIMING',accent:'#facc15',cameraPressure:.74,impactActor:'FALLING_DEBRIS'};
    case 'debris_corridor': return {mechanic:'CORRIDOR ESCAPE',accent:'#f97316',cameraPressure:.88,impactActor:'FALLING_DEBRIS'};
    case 'equipment_pincer': return {mechanic:'PINCER BREAK',accent:'#ef4444',cameraPressure:.94,impactActor:'RUNAWAY_CART'};
    case 'precollapse_signal': return {mechanic:'COLLAPSE PRELUDE',accent:'#dc2626',cameraPressure:1,impactActor:'FALLING_DEBRIS'};
  }
}

const W2: readonly SignatureEventId[] = ['cart_convoy','gas_bloom','lifting_cross'];
const W3: readonly SignatureEventId[] = ['debris_corridor','equipment_pincer','precollapse_signal'];

const THEME_OFFSET: Record<PatrolStageDefinition['theme'], number> = {
  surface_logistics: 0,
  deep_excavation: 1,
  highrise_slab: 2,
  curing_chamber: 1,
  datacenter: 1,
};

function eventSpawns(id:SignatureEventId, stageNumber:number):readonly SignatureSpawn[] {
  const reinforced=stageNumber>=16?'reinforced_cart':undefined;
  switch(id){
    case 'cart_convoy':
      return [
        {type:'RUNAWAY_CART',x:24,y:250,variant:reinforced,speedScale:1.48,hpScale:.9,warningTimer:.52,directionX:1,directionY:0},
        {type:'RUNAWAY_CART',x:24,y:450,speedScale:1.58,hpScale:.9,warningTimer:.72,directionX:1,directionY:0},
        {type:'RUNAWAY_CART',x:24,y:650,variant:stageNumber>=31?'reinforced_cart':undefined,speedScale:1.68,hpScale:.9,warningTimer:.92,directionX:1,directionY:0},
      ];
    case 'gas_bloom':
      return [
        {type:'GAS_LEAK',x:480,y:330,variant:'pulse_gas',speedScale:.28,hpScale:.8,radiusScale:1.38,warningTimer:.38},
        {type:'GAS_LEAK',x:920,y:330,variant:'split_gas',speedScale:.22,hpScale:.85,radiusScale:3.35},
        {type:'GAS_LEAK',x:700,y:640,variant:'pulse_gas',speedScale:.24,hpScale:.8,radiusScale:1.48,warningTimer:.58},
      ];
    case 'lifting_cross':
      return [
        {type:'FALLING_DEBRIS',x:470,y:315,hpScale:.72,radiusScale:1.08,warningTimer:.66},
        {type:'FALLING_DEBRIS',x:700,y:450,hpScale:.72,radiusScale:1.08,warningTimer:.94},
        {type:'FALLING_DEBRIS',x:930,y:585,hpScale:.72,radiusScale:1.08,warningTimer:1.22},
        {type:'RUNAWAY_CART',x:1376,y:450,variant:reinforced,speedScale:1.18,hpScale:.86,warningTimer:.82,directionX:-1,directionY:0},
      ];
    case 'debris_corridor':
      return [
        {type:'FALLING_DEBRIS',x:410,y:350,hpScale:.66,radiusScale:1.16,warningTimer:.48},
        {type:'FALLING_DEBRIS',x:600,y:410,hpScale:.66,radiusScale:1.16,warningTimer:.72},
        {type:'FALLING_DEBRIS',x:800,y:490,hpScale:.66,radiusScale:1.16,warningTimer:.96},
        {type:'FALLING_DEBRIS',x:990,y:550,hpScale:.66,radiusScale:1.16,warningTimer:1.20},
      ];
    case 'equipment_pincer':
      return [
        {type:'RUNAWAY_CART',x:24,y:360,variant:reinforced,speedScale:1.34,hpScale:.92,warningTimer:.58,directionX:1,directionY:0},
        {type:'RUNAWAY_CART',x:1376,y:540,variant:reinforced,speedScale:1.34,hpScale:.92,warningTimer:.58,directionX:-1,directionY:0},
        {type:'GAS_LEAK',x:700,y:450,variant:'pulse_gas',speedScale:.2,hpScale:.8,radiusScale:1.55,warningTimer:.42},
        {type:'GAS_LEAK',x:700,y:700,variant:'split_gas',speedScale:.18,hpScale:.82,radiusScale:3.2},
      ];
    case 'precollapse_signal':
      return [
        {type:'FALLING_DEBRIS',x:520,y:330,hpScale:.62,radiusScale:1.24,warningTimer:1.55},
        {type:'FALLING_DEBRIS',x:880,y:330,hpScale:.62,radiusScale:1.24,warningTimer:1.32},
        {type:'FALLING_DEBRIS',x:520,y:590,hpScale:.62,radiusScale:1.24,warningTimer:1.09},
        {type:'FALLING_DEBRIS',x:880,y:590,hpScale:.62,radiusScale:1.24,warningTimer:.86},
        {type:'GAS_LEAK',x:700,y:450,variant:'pulse_gas',speedScale:.12,hpScale:.72,radiusScale:1.78,warningTimer:.72},
      ];
  }
}

function copy(id:SignatureEventId):Pick<WaveSignatureEvent,'title'|'detail'> {
  switch(id){
    case 'cart_convoy': return {title:'폭주 운반장비 연속 진입',detail:'한 방향에 머물지 말고 측면 탈출로를 확보하십시오.'};
    case 'gas_bloom': return {title:'가스 확산 다중 발생',detail:'확산 중심을 비우고 분리된 잔류 위험까지 순서대로 통제하십시오.'};
    case 'lifting_cross': return {title:'양중 동선 교차',detail:'낙하 예고선과 운반장비 진입축이 겹칩니다. 빈 공간을 먼저 읽으십시오.'};
    case 'debris_corridor': return {title:'낙하물 회랑 형성',detail:'연속 낙하 예고가 전장을 가릅니다. 회랑 바깥으로 빠르게 이동하십시오.'};
    case 'equipment_pincer': return {title:'중장비 동시 진입',detail:'양측 장비 압박과 중앙 확산 위험이 동시에 접근합니다.'};
    case 'precollapse_signal': return {title:'구조 불안정 전조',detail:'보스 출현 전 연속 낙하 신호가 감지됩니다. 전장을 비우고 최종 대응을 준비하십시오.'};
  }
}

/** Two authored beats per stage: a Wave 2 disruption and a Wave 3 pre-boss signature. */
export function signatureEventPlan(stage:PatrolStageDefinition,maxTime=180):readonly WaveSignatureEvent[] {
  const timing=operationTiming(maxTime);
  const compact=maxTime<=60;
  const offset=THEME_OFFSET[stage.theme]??0;
  const w2=W2[(stage.stageNumber+offset)%W2.length]!;
  const w3=W3[(stage.stageNumber+offset*2)%W3.length]!;
  const w2Copy=copy(w2),w3Copy=copy(w3);
  return [
    {
      id:w2,wave:2,
      at:timing.wave2At+(compact?4:12),
      title:w2Copy.title,detail:w2Copy.detail,severity:'amber',
      warningLead:compact?.85:1.15,reward:30,mechanic:signatureEventIdentity(w2).mechanic,
      spawns:eventSpawns(w2,stage.stageNumber),
    },
    {
      id:w3,wave:3,
      at:Math.min(timing.bossRevealAt-(compact?.45:4),timing.wave3At+(compact?.6:5)),
      title:w3Copy.title,detail:w3Copy.detail,severity:'red',
      warningLead:compact?.95:1.35,reward:50,mechanic:signatureEventIdentity(w3).mechanic,
      spawns:eventSpawns(w3,stage.stageNumber),
    },
  ];
}
