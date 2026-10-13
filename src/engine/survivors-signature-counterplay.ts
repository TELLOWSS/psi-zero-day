import type {SignatureEventId} from './survivors-signature-events';

export type SignatureCounterplayKind =
  | 'boss_weakpoint'
  | 'cooldown_rush'
  | 'instant_counter'
  | 'dash_reset'
  | 'ultimate_surge'
  | 'boss_prereveal';

export interface SignatureCounterplayProfile {
  id: SignatureEventId;
  kind: SignatureCounterplayKind;
  title: string;
  detail: string;
  condition: string;
  noContact: boolean;
  maxClearSeconds?: number;
  value: number;
  duration?: number;
}

const PROFILES:Record<SignatureEventId,SignatureCounterplayProfile>={
  cart_convoy:{
    id:'cart_convoy',kind:'boss_weakpoint',title:'PERFECT EVADE · 제동계 약점 포착',
    detail:'폭주 동선을 무피격으로 읽었습니다. 다음 보스의 약점이 선공개됩니다.',
    condition:'접촉 0회로 폭주 동선 통과',
    noContact:true,value:4.0,
  },
  gas_bloom:{
    id:'gas_bloom',kind:'cooldown_rush',title:'AIR CONTROL · 대응속도 가속',
    detail:'확산 구역을 신속히 통제했습니다. 모든 장비 재사용 주기가 일시 가속됩니다.',
    condition:'7.5초 이내 확산원 통제',
    noContact:false,maxClearSeconds:7.5,value:.25,duration:8,
  },
  lifting_cross:{
    id:'lifting_cross',kind:'instant_counter',title:'TIMING BREAK · 즉시 반격',
    detail:'교차 양중 타이밍을 정확히 읽었습니다. 통제 충격파가 즉시 발동합니다.',
    condition:'접촉 0회 · 6.5초 이내 통제',
    noContact:true,maxClearSeconds:6.5,value:240,
  },
  debris_corridor:{
    id:'debris_corridor',kind:'dash_reset',title:'CLEAN EXIT · 긴급기동 복구',
    detail:'낙하물 회랑을 무피격으로 통과했습니다. 대시가 즉시 복구되고 짧은 보호시간을 얻습니다.',
    condition:'낙하물 접촉 0회로 회랑 통과',
    noContact:true,value:.75,
  },
  equipment_pincer:{
    id:'equipment_pincer',kind:'ultimate_surge',title:'PINCER BREAK · 지휘 게이지 급충전',
    detail:'양측 협공을 끊어냈습니다. 소장 샤우팅 게이지가 크게 충전됩니다.',
    condition:'접촉 0회 · 7.5초 이내 협공 해제',
    noContact:true,maxClearSeconds:7.5,value:35,
  },
  precollapse_signal:{
    id:'precollapse_signal',kind:'boss_prereveal',title:'ZERO DAMAGE READ · 보스 핵심 선공개',
    detail:'붕괴 전조를 무피격으로 판독했습니다. 보스 등장 즉시 핵심 약점이 장시간 노출됩니다.',
    condition:'붕괴 전조 접촉 0회',
    noContact:true,value:7.5,
  },
};

export function signatureCounterplayProfile(id:SignatureEventId):SignatureCounterplayProfile {
  return PROFILES[id];
}

export function signatureCounterplayQualified(
  id:SignatureEventId,
  contactFailed:boolean,
  clearSeconds:number,
):boolean {
  const profile=signatureCounterplayProfile(id);
  if(profile.noContact&&contactFailed)return false;
  if(profile.maxClearSeconds!==undefined&&clearSeconds>profile.maxClearSeconds)return false;
  return true;
}
