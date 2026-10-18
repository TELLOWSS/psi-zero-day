import {useEffect,useState} from 'react';
import type {FlagMap} from '../domain';
import {episode02OpeningEvents,episode02Messages} from '../content/episode02';
import './episode02-cinema.css';

/** EP02 opening slice: a separate resumable player, never mutating the EP01 engine/save. */
interface Node {node_id:string;type:string;text_id:string;next_node_id?:string;speaker_role_id?:string;choice_ids?:string[]}
interface Choice {choice_id:string;text_id:string;next_node_id:string;requirements?:readonly {kind:string;flag_id?:string;equals?:string}[];effects?:{flags?:Record<string,string|boolean>}}
interface Event {event_id:string;entry_node_id:string;dialogue:readonly Node[];choices:readonly Choice[]}
interface Progress {scene:0|1|2;node:string;flags:Record<string,string|boolean>}
const events=episode02OpeningEvents as unknown as readonly Event[];
const content=episode02Messages as Readonly<Record<string,string>>;
const key='psi.zero-day.ep02.opening.v1';
const start=():Progress=>({scene:0,node:events[0]?.entry_node_id||'situation',flags:{}});
function read():Progress{
 try{
  const raw=localStorage.getItem(key);if(!raw)return start();
  const p=JSON.parse(raw) as Progress;
  if(![0,1,2].includes(p.scene)||!p.flags||typeof p.flags!=='object')return start();
  if(p.scene<2&&!events[p.scene]?.dialogue.some(n=>n.node_id===p.node))return start();
  return p;
 }catch{return start();}
}
export function ep02Options(event:Event,node:Node,flags:Record<string,string|boolean>):readonly Choice[]{
 return event.choices.filter(c=>node.choice_ids?.includes(c.choice_id)
   &&(c.requirements||[]).every(r=>r.kind!=='flag'||flags[r.flag_id||'']===r.equals));
}
function dayOneEcho(flags:FlagMap):string{
 if(flags.stopwork_culture_result==='reporting_silenced')return '어제 입을 다물었던 사람은, 오늘도 신호보다 먼저 주변을 살핀다.';
 if(flags.instruction_chain_result==='condition_loss_unresolved')return '어제 끝내 정리하지 못한 재개 조건이 새 공정의 시작을 따라왔다.';
 if(flags.record_result==='document_sync_required')return '서로 다른 기록이 남았다. 오늘 현장에는 하나의 기준이 필요하다.';
 return '어제 멈춘 현장은 다시 움직인다. 그러나 어제의 판단은 지워지지 않았다.';
}
function speaker(role?:string):string{
 return ({choi:'최민석 · 신호수',lee:'이재훈 · 공사팀',kang:'강태식 · 형틀반',player:'안전관리자'} as Record<string,string>)[role||'']||'현장 기록';
}
export function Episode02Cinema({onExit,carryover}:{onExit:()=>void;carryover:FlagMap}){
 const [p,setP]=useState(read);
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(p))}catch{}},[p]);
 const event=events[p.scene];const node=event?.dialogue.find(n=>n.node_id===p.node);
 const options=event&&node?ep02Options(event,node,p.flags):[];
 const complete=p.scene===2;
 const advance=()=>{
  if(!event||!node||node.type==='CHOICE')return;
  if(node.type==='END'||!node.next_node_id){
   if(p.scene===0)setP({...p,scene:1,node:events[1]?.entry_node_id||'resolve'});
   else setP({...p,scene:2,node:'end'});
  }else setP({...p,node:node.next_node_id});
 };
 const choose=(choice:Choice)=>{
  setP({...p,node:choice.next_node_id,flags:{...p.flags,...(choice.effects?.flags||{})}});
 };
 const sceneTitle=p.scene===0?'첫 양중, 첫 신호':p.scene===1?'두 번째 양중의 대답':'다음 위험의 윤곽';
 return <main className="ep02-cinema" data-episode02-stage={p.scene} data-orientation-ready="true">
  <div className="ep02-cinema-world" aria-hidden="true">
   <img src={p.scene===0?'/assets/episode01/cg/ramp-entry-cinema.webp':'/assets/episode01/cg/work-yard-cinema.webp'} alt="" />
  </div>
  <header className="ep02-cinema-header">
    <span>PSI : ZERO DAY <b>EPISODE 02 · OPENING</b></span>
    <button type="button" onClick={onExit}>현장 허브로</button>
  </header>
  <div className="ep02-cinema-chapter">
    <small>{p.scene===0?'DAY 02 · 06:52 — 07:06':p.scene===1?'DAY 02 · 07:18':'DAY 02 · NEXT SIGNAL'}</small>
    <h1>{sceneTitle}</h1>
    <p>{dayOneEcho(carryover)}</p>
  </div>
  <div className="ep02-cinema-reader" aria-live="polite">
    {complete?<><p className="ep02-cinema-voice">DAY 02 — 장면 2 종료</p>
      <p className="ep02-cinema-text">계획서와 현장 경험 사이의 답은 한 사람이 갖고 있지 않았다. 오늘 남긴 기준이 다음 변화 속에서도 작동할지는 아직 모른다.</p>
      <p className="ep02-cinema-status">오프닝 플레이 구간 완료 · 에피소드 2 본편 추가 제작 예정</p>
      <button type="button" onClick={onExit}>현장 허브로 돌아가기</button>
      <button type="button" onClick={()=>setP(start())}>오프닝 다시 보기</button>
    </>:<>
      <p className="ep02-cinema-voice">{speaker(node?.speaker_role_id)}</p>
      <p className="ep02-cinema-text">{content[node?.text_id||'']||''}</p>
      {node?.type==='CHOICE'?
       <div className="ep02-cinema-choices" aria-label="현장 판단">
        {options.map((choice,i)=><button type="button" key={choice.choice_id} onClick={()=>choose(choice)}>
         <span>{String(i+1).padStart(2,'0')}</span>{content[choice.text_id]||choice.choice_id}
        </button>)}
       </div>:
       <button className="ep02-cinema-next" type="button" onClick={advance}>{node?.type==='END'?'다음 장면':'계속 보기'} <span aria-hidden="true">→</span></button>}
    </>}
  </div>
  <p className="ep02-cinema-safety">현장 양중 안전기준: 인양물 하부 출입 통제 · 전담 신호수 · 사각지점 확인은 모든 선택에서 필수</p>
 </main>;
}
