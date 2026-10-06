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
  stageSkin: PatrolStageDefinition['theme'];
  workface: string;
  stageAccent: string;
  materialCue: 'metal' | 'concrete' | 'vapor' | 'electric';
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
export interface SignatureStageFusion {
  stageSkin: PatrolStageDefinition['theme'];
  workface: string;
  title: string;
  detail: string;
  accent: string;
  materialCue: 'metal' | 'concrete' | 'vapor' | 'electric';
}

export function signatureStageFusion(stage:Pick<PatrolStageDefinition,'theme'|'name'>,id:SignatureEventId):SignatureStageFusion {
  const table:Record<PatrolStageDefinition['theme'],{
    workface:string;accent:string;materialCue:SignatureStageFusion['materialCue'];
    titles:Record<SignatureEventId,string>;details:Record<SignatureEventId,string>;
  }>={
    surface_logistics:{
      workface:'지상 하역·차량 동선',accent:'#fb923c',materialCue:'metal',
      titles:{
        cart_convoy:'덤프트럭·운반차량 연속 진입',
        gas_bloom:'인화물·배기가스 확산',
        lifting_cross:'크레인 하역 동선 교차',
        debris_corridor:'하역 자재 낙하 회랑',
        equipment_pincer:'덤프트럭 양측 협공',
        precollapse_signal:'적치·가설구조 불안정 전조',
      },
      details:{
        cart_convoy:'차량 진입축을 비우고 측면 안전통로로 즉시 이탈하십시오.',
        gas_bloom:'인화물 주변과 차량 배기가스 체류 구역을 분리해 통제하십시오.',
        lifting_cross:'하역 차량과 양중 반경이 겹칩니다. 교차점부터 비우십시오.',
        debris_corridor:'적치·하역 자재의 연속 낙하선을 벗어나 통로를 확보하십시오.',
        equipment_pincer:'양측 차량 접근 사이의 중앙 통로를 먼저 확보하십시오.',
        precollapse_signal:'적치물과 가설 지지부의 연속 이상 신호입니다. 보스 진입 전 구역을 비우십시오.',
      }
    },
    deep_excavation:{
      workface:'굴착·흙막이 작업면',accent:'#d97706',materialCue:'concrete',
      titles:{
        cart_convoy:'굴착장비·토사운반차량 폭주',
        gas_bloom:'굴착부 유해가스 급확산',
        lifting_cross:'버킷·굴착재 양중 동선 교차',
        debris_corridor:'토사·파쇄물 낙하 회랑',
        equipment_pincer:'굴착장비 양측 압박',
        precollapse_signal:'흙막이·굴착면 붕괴 전조',
      },
      details:{
        cart_convoy:'굴착 장비의 직선 주행축을 읽고 흙막이 측 피난 공간을 확보하십시오.',
        gas_bloom:'저지대에 체류하는 유해가스를 피해 상부·측면 동선으로 이동하십시오.',
        lifting_cross:'버킷 이동과 토사 반출 동선이 겹칩니다. 교차 구간을 먼저 차단하십시오.',
        debris_corridor:'굴착면에서 이어지는 낙하선을 피해 안전 사면 쪽으로 이동하십시오.',
        equipment_pincer:'양측 굴착장비 사이에 갇히지 않도록 중앙을 빠르게 이탈하십시오.',
        precollapse_signal:'흙막이와 굴착면에서 연속 변위 신호가 감지됩니다. 즉시 붕괴 영향권을 비우십시오.',
      }
    },
    highrise_slab:{
      workface:'고층 슬래브·양중 작업면',accent:'#38bdf8',materialCue:'concrete',
      titles:{
        cart_convoy:'고층 자재운반 장비 연속 진입',
        gas_bloom:'용접·밀폐부 가스 확산',
        lifting_cross:'타워크레인 양중 동선 교차',
        debris_corridor:'슬래브 낙하물 회랑',
        equipment_pincer:'양중·운반장비 동시 압박',
        precollapse_signal:'슬래브·동바리 불안정 전조',
      },
      details:{
        cart_convoy:'슬래브 운반 동선에서 벗어나 개구부 반대측 안전통로를 확보하십시오.',
        gas_bloom:'용접·밀폐 작업구역의 가스 체류 범위를 피해 환기된 구간으로 이동하십시오.',
        lifting_cross:'타워크레인 인양물과 운반 동선이 교차합니다. 낙하 반경을 우선 비우십시오.',
        debris_corridor:'상부 작업에서 이어지는 낙하물 회랑을 읽고 외곽으로 빠져나가십시오.',
        equipment_pincer:'양중 반경과 자재운반 동선이 동시에 좁혀집니다. 교차 중심을 비우십시오.',
        precollapse_signal:'슬래브·동바리 지지계에서 연속 이상 신호가 감지됩니다. 보스 전 최종 대피선을 확보하십시오.',
      }
    },
    curing_chamber:{
      workface:'동절기 밀폐 양생구역',accent:'#7dd3fc',materialCue:'vapor',
      titles:{
        cart_convoy:'펌프카·반입장비 급진입',
        gas_bloom:'CO·연소가스 급확산',
        lifting_cross:'양생실 반입 동선 교차',
        debris_corridor:'천막·거푸집 잔재 낙하',
        equipment_pincer:'펌프카·연료 위험 동시 압박',
        precollapse_signal:'동결·가설구조 불안정 전조',
      },
      details:{
        cart_convoy:'미끄러운 바닥에서 급회전을 피하고 장비 주행축을 먼저 비우십시오.',
        gas_bloom:'밀폐 양생구역의 CO·연소가스 체류 범위를 벗어나 환기 방향으로 이동하십시오.',
        lifting_cross:'반입 장비와 양생 자재 동선이 겹칩니다. 미끄럼 구간을 피해 교차점을 통제하십시오.',
        debris_corridor:'천막·거푸집 잔재 낙하선을 피해 외곽 안전구역으로 이동하십시오.',
        equipment_pincer:'장비 접근과 연료·가스 위험이 동시에 좁혀집니다. 중앙 체류를 피하십시오.',
        precollapse_signal:'동결과 가설 지지부에서 연속 이상 신호가 감지됩니다. 즉시 밀폐구역을 비우십시오.',
      }
    },
    datacenter:{
      workface:'데이터센터 MEP·중량설비 구역',accent:'#a78bfa',materialCue:'electric',
      titles:{
        cart_convoy:'UPS 중량설비 반입 연속 진입',
        gas_bloom:'냉매·소화가스 다중 확산',
        lifting_cross:'설비 반입·양중 동선 교차',
        debris_corridor:'케이블트레이·천장재 낙하 회랑',
        equipment_pincer:'중량설비 양측 반입 압박',
        precollapse_signal:'천장·설비 지지구조 불안정 전조',
      },
      details:{
        cart_convoy:'중량 UPS 반입축을 비우고 전기실 접근 통로를 유지하십시오.',
        gas_bloom:'냉매·소화가스 체류 구역과 전기설비 접근 동선을 분리하십시오.',
        lifting_cross:'중량설비 반입과 양중 작업반경이 겹칩니다. 전원 격리 후 교차점을 비우십시오.',
        debris_corridor:'케이블트레이·천장재 낙하선을 피해 통전 설비 반대측으로 이동하십시오.',
        equipment_pincer:'양측 중량설비 반입 사이에서 빠져나와 전기실 통로를 확보하십시오.',
        precollapse_signal:'천장·설비 지지구조에서 연속 이상 신호가 감지됩니다. 전원 격리와 대피를 동시에 준비하십시오.',
      }
    },
  };
  const skin=table[stage.theme];
  const materialCue:SignatureStageFusion['materialCue'] =
    id==='gas_bloom' ? 'vapor'
    : id==='cart_convoy'||id==='equipment_pincer' ? 'metal'
    : stage.theme==='datacenter' ? 'electric'
    : 'concrete';
  return {stageSkin:stage.theme,workface:skin.workface,title:skin.titles[id],detail:skin.details[id],accent:skin.accent,materialCue};
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



const SIGNATURE_WORLD_WIDTH=1400;
const SIGNATURE_WORLD_HEIGHT=900;

function snapDatacenterAisle(y:number):number {
  if(y<450)return 270;
  if(y>450)return 630;
  return 450;
}

/** The same event keeps its mechanic while each workface changes the approach geometry. */
export function signatureEventSpawns(stage:PatrolStageDefinition,id:SignatureEventId):readonly SignatureSpawn[] {
  const base=eventSpawns(id,stage.stageNumber);
  const mirrorHighrise=stage.theme==='highrise_slab'&&stage.stageNumber%2===1;
  return base.map(spawn=>{
    let x=spawn.x,y=spawn.y,directionX=spawn.directionX,directionY=spawn.directionY;
    if(mirrorHighrise){
      x=SIGNATURE_WORLD_WIDTH-x;
      if(directionX!==undefined)directionX=-directionX;
    }
    if(stage.theme==='datacenter'){
      y=snapDatacenterAisle(y);
    } else if(spawn.type!=='RUNAWAY_CART'&&stage.theme==='deep_excavation'){
      x=SIGNATURE_WORLD_WIDTH/2+(x-SIGNATURE_WORLD_WIDTH/2)*.84;
      y=SIGNATURE_WORLD_HEIGHT/2+(y-SIGNATURE_WORLD_HEIGHT/2)*.78;
    } else if(spawn.type!=='RUNAWAY_CART'&&stage.theme==='curing_chamber'){
      x=SIGNATURE_WORLD_WIDTH/2+(x-SIGNATURE_WORLD_WIDTH/2)*.76;
      y=SIGNATURE_WORLD_HEIGHT/2+(y-SIGNATURE_WORLD_HEIGHT/2)*.70;
    }
    return {...spawn,x,y,directionX,directionY};
  });
}


/** Two authored beats per stage: a Wave 2 disruption and a Wave 3 pre-boss signature. */
export function signatureEventPlan(stage:PatrolStageDefinition,maxTime=180):readonly WaveSignatureEvent[] {
  const timing=operationTiming(maxTime);
  const compact=maxTime<=60;
  const offset=THEME_OFFSET[stage.theme]??0;
  const w2=W2[(stage.stageNumber+offset)%W2.length]!;
  const w3=W3[(stage.stageNumber+offset*2)%W3.length]!;
  const w2Fusion=signatureStageFusion(stage,w2),w3Fusion=signatureStageFusion(stage,w3);
  return [
    {
      id:w2,wave:2,
      at:timing.wave2At+(compact?4:12),
      title:w2Fusion.title,detail:w2Fusion.detail,severity:'amber',
      warningLead:compact?.85:1.15,reward:30,mechanic:signatureEventIdentity(w2).mechanic,
      stageSkin:w2Fusion.stageSkin,workface:w2Fusion.workface,stageAccent:w2Fusion.accent,materialCue:w2Fusion.materialCue,
      spawns:signatureEventSpawns(stage,w2),
    },
    {
      id:w3,wave:3,
      at:Math.min(timing.bossRevealAt-(compact?.45:4),timing.wave3At+(compact?.6:5)),
      title:w3Fusion.title,detail:w3Fusion.detail,severity:'red',
      warningLead:compact?.95:1.35,reward:50,mechanic:signatureEventIdentity(w3).mechanic,
      stageSkin:w3Fusion.stageSkin,workface:w3Fusion.workface,stageAccent:w3Fusion.accent,materialCue:w3Fusion.materialCue,
      spawns:signatureEventSpawns(stage,w3),
    },
  ];
}
