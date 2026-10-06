export type SignatureMasteryNoticeKind='perfect'|'armed'|'broken'|'zero_day';

export interface SignatureMasteryNotice {
  kind:SignatureMasteryNoticeKind;
  title:string;
  detail:string;
  chain:number;
  remaining:number;
}

export interface SignatureMasteryState {
  chain:number;
  best:number;
  perfectEvents:string[];
  finisherArmed:boolean;
  zeroDay:boolean;
  notice?:SignatureMasteryNotice;
}

export function createSignatureMasteryState():SignatureMasteryState {
  return {chain:0,best:0,perfectEvents:[],finisherArmed:false,zeroDay:false};
}

export function signatureMasterySuccess(
  state:SignatureMasteryState,
  eventId:string,
):SignatureMasteryState {
  const nextChain=Math.min(2,state.chain+1);
  const perfectEvents=state.perfectEvents.includes(eventId)?state.perfectEvents:[...state.perfectEvents,eventId];
  const finisherArmed=nextChain>=2;
  return {
    ...state,
    chain:nextChain,
    best:Math.max(state.best,nextChain),
    perfectEvents,
    finisherArmed,
    notice: finisherArmed
      ? {kind:'armed',title:'PERFECT ×2 · FINISHER ARMED',detail:'연속 완벽 대응 성공. 보스 약점 마무리 시 ZERO DAY CHAIN이 완성됩니다.',chain:2,remaining:3.4}
      : {kind:'perfect',title:'PERFECT RESPONSE',detail:'완벽 대응 1회. 다음 Signature까지 연속 성공을 이어가십시오.',chain:1,remaining:2.6},
  };
}

export function signatureMasteryBreak(state:SignatureMasteryState):SignatureMasteryState {
  if(state.chain<=0&&!state.finisherArmed)return state;
  return {
    ...state,
    chain:0,
    finisherArmed:false,
    notice:{kind:'broken',title:'CHAIN BROKEN',detail:'완벽 대응 연쇄가 끊겼습니다. 다음 Signature에서 다시 시작합니다.',chain:0,remaining:2.2},
  };
}

export function signatureMasteryBossFinish(state:SignatureMasteryState):SignatureMasteryState {
  if(!state.finisherArmed||state.chain<2)return state;
  return {
    ...state,
    chain:3,
    best:Math.max(state.best,3),
    finisherArmed:false,
    zeroDay:true,
    notice:{
      kind:'zero_day',
      title:'ZERO DAY CHAIN',
      detail:'PERFECT ×3 · Signature 2연속 완벽 대응과 보스 약점 피니시를 연결했습니다.',
      chain:3,
      remaining:4.2,
    },
  };
}
