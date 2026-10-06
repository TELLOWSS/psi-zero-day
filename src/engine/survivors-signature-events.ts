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
}

export interface WaveSignatureEvent {
  id: SignatureEventId;
  wave: 2 | 3;
  at: number;
  title: string;
  detail: string;
  severity: 'amber' | 'red';
  spawns: readonly SignatureSpawn[];
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
        {type:'RUNAWAY_CART',x:24,y:250,variant:reinforced},
        {type:'RUNAWAY_CART',x:24,y:450},
        {type:'RUNAWAY_CART',x:24,y:650,variant:stageNumber>=31?'reinforced_cart':undefined},
      ];
    case 'gas_bloom':
      return [
        {type:'GAS_LEAK',x:480,y:330,variant:'pulse_gas'},
        {type:'GAS_LEAK',x:920,y:330,variant:'split_gas'},
        {type:'GAS_LEAK',x:700,y:640,variant:'pulse_gas'},
      ];
    case 'lifting_cross':
      return [
        {type:'FALLING_DEBRIS',x:470,y:315},
        {type:'FALLING_DEBRIS',x:700,y:450},
        {type:'FALLING_DEBRIS',x:930,y:585},
        {type:'RUNAWAY_CART',x:1376,y:450,variant:reinforced},
      ];
    case 'debris_corridor':
      return [
        {type:'FALLING_DEBRIS',x:410,y:350},
        {type:'FALLING_DEBRIS',x:600,y:410},
        {type:'FALLING_DEBRIS',x:800,y:490},
        {type:'FALLING_DEBRIS',x:990,y:550},
      ];
    case 'equipment_pincer':
      return [
        {type:'RUNAWAY_CART',x:24,y:360,variant:reinforced},
        {type:'RUNAWAY_CART',x:1376,y:540,variant:reinforced},
        {type:'GAS_LEAK',x:700,y:450,variant:'pulse_gas'},
        {type:'GAS_LEAK',x:700,y:700,variant:'split_gas'},
      ];
    case 'precollapse_signal':
      return [
        {type:'FALLING_DEBRIS',x:520,y:330},
        {type:'FALLING_DEBRIS',x:880,y:330},
        {type:'FALLING_DEBRIS',x:520,y:590},
        {type:'FALLING_DEBRIS',x:880,y:590},
        {type:'GAS_LEAK',x:700,y:450,variant:'pulse_gas'},
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
      spawns:eventSpawns(w2,stage.stageNumber),
    },
    {
      id:w3,wave:3,
      at:Math.min(timing.bossRevealAt-(compact?.45:4),timing.wave3At+(compact?.6:5)),
      title:w3Copy.title,detail:w3Copy.detail,severity:'red',
      spawns:eventSpawns(w3,stage.stageNumber),
    },
  ];
}
