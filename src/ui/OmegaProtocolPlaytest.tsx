import {useCallback,useEffect,useRef,useState} from 'react';
import {OmegaProtocolCombatSession,type OmegaCombatSnapshot} from '../engine/omega-protocol-combat';
import {OMEGA_UPGRADES,OMEGA_PROTOCOL_TOTAL_WAVES,type OmegaUpgradeId} from '../domain/omega-protocol-run';
import {WORLD_WIDTH,WORLD_HEIGHT} from '../engine/patrol-survivors-engine';
import './omega-protocol-playtest.css';

const keys=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'] as const;
const validKeys=new Set<string>(keys);
const buttonDirections=[{label:'↑',x:0,y:-1},{label:'←',x:-1,y:0},{label:'↓',x:0,y:1},{label:'→',x:1,y:0}];
const threatColors:Record<string,string>={
 UNHELMETED:'#f5b96d',RUNAWAY_CART:'#d887ff',GAS_LEAK:'#6cdbc2',
 FALLING_DEBRIS:'#ff9b9b',CRANE_BOSS:'#ffdf72'
};
function drawLab(ctx:CanvasRenderingContext2D,session:OmegaProtocolCombatSession){
 const state=session.engine.state;
 ctx.clearRect(0,0,1120,720);
 ctx.save();
 ctx.scale(1120/WORLD_WIDTH,720/WORLD_HEIGHT);
 ctx.fillStyle='#111a2b';ctx.fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
 ctx.strokeStyle='#243548';ctx.lineWidth=1;
 for(let x=0;x<=WORLD_WIDTH;x+=70){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,WORLD_HEIGHT);ctx.stroke();}
 for(let y=0;y<=WORLD_HEIGHT;y+=70){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WORLD_WIDTH,y);ctx.stroke();}
 ctx.strokeStyle='#446377';ctx.lineWidth=14;ctx.strokeRect(14,14,WORLD_WIDTH-28,WORLD_HEIGHT-28);
 for(const h of state.hazards){
  if(h.hp<=0)continue;
  const tint=threatColors[h.type]??'#ddd';
  ctx.beginPath();ctx.arc(h.x,h.y,h.radius,0,Math.PI*2);
  ctx.fillStyle=tint;ctx.globalAlpha=.8;ctx.fill();ctx.globalAlpha=1;
  ctx.strokeStyle=h.isStageBoss?'#fff3c3':'#233547';ctx.lineWidth=h.isStageBoss?6:2;ctx.stroke();
  ctx.fillStyle='#161e2f';ctx.fillRect(h.x-h.radius,h.y-h.radius-16,h.radius*2,5);
  ctx.fillStyle='#7bffd6';ctx.fillRect(h.x-h.radius,h.y-h.radius-16,h.radius*2*Math.max(0,h.hp/h.maxHp),5);
  if(h.isStageBoss){ctx.fillStyle='#fff5bd';ctx.font='bold 18px sans-serif';ctx.fillText('BOSS',h.x-25,h.y-h.radius-28);}
 }
 for(const projectile of state.projectiles){
  ctx.fillStyle='#7df3fa';ctx.beginPath();ctx.arc(projectile.x,projectile.y,Math.max(2,Math.min(9,projectile.radius)),0,Math.PI*2);ctx.fill();
 }
 const p=state.player;
 ctx.fillStyle='#071c28';ctx.beginPath();ctx.ellipse(p.x,p.y+22,22,9,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=p.isDashing?'#ffb3e7':'#e9f9fc';ctx.beginPath();ctx.arc(p.x,p.y,19,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#e78cd7';ctx.lineWidth=4;ctx.stroke();
 ctx.fillStyle='#0d2335';ctx.beginPath();ctx.arc(p.x+7,p.y-4,5,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
export function OmegaProtocolPlaytest({onExit}:{onExit:()=>void}){
 const [seedValue,setSeedValue]=useState('20261108');
 const [session,setSession]=useState(()=>new OmegaProtocolCombatSession(20261108,10,false));
 const [snapshot,setSnapshot]=useState<OmegaCombatSnapshot>(()=>session.snapshot);
 const [paused,setPaused]=useState(false);
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const keysRef=useRef(new Set<string>());
 const mobileDir=useRef({x:0,y:0});
 const lastHudAt=useRef(0);
 const restart=useCallback(()=>{
  const n=Number(seedValue);
  const newSession=new OmegaProtocolCombatSession(Number.isFinite(n)?Math.trunc(n):0,10,false);
  setSession(newSession);setSnapshot(newSession.snapshot);setPaused(false);
  keysRef.current.clear();mobileDir.current={x:0,y:0};
 },[seedValue]);
 useEffect(()=>{
  const onKeyDown=(e:KeyboardEvent)=>{
   if(validKeys.has(e.key)){keysRef.current.add(e.key);e.preventDefault();}
  };
  const onKeyUp=(e:KeyboardEvent)=>{
   if(validKeys.has(e.key)){keysRef.current.delete(e.key);e.preventDefault();}
  };
  const onBlur=()=>{keysRef.current.clear();mobileDir.current={x:0,y:0};};
  window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);
  window.addEventListener('blur',onBlur);
  let request=0,last=0,alive=true;
  const frame=(now:number)=>{
   if(!alive)return;
   const dt=last?Math.min(.05,Math.max(0,(now-last)/1000)):0;last=now;
   const k=keysRef.current;
   const mx=(Number(k.has('d')||k.has('D')||k.has('ArrowRight'))-Number(k.has('a')||k.has('A')||k.has('ArrowLeft')))+mobileDir.current.x;
   const my=(Number(k.has('s')||k.has('S')||k.has('ArrowDown'))-Number(k.has('w')||k.has('W')||k.has('ArrowUp')))+mobileDir.current.y;
   const length=Math.hypot(mx,my)||1;
   if(dt>0)session.update(dt,{moveX:mx/length,moveY:my/length,triggerAction:true});
   const ctx=canvasRef.current?.getContext('2d');if(ctx)drawLab(ctx,session);
   if(now-lastHudAt.current>130){lastHudAt.current=now;setSnapshot(session.snapshot);}
   request=requestAnimationFrame(frame);
  };
  request=requestAnimationFrame(frame);
  return ()=>{
   alive=false;cancelAnimationFrame(request);
   window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);
   window.removeEventListener('blur',onBlur);
  };
 },[session]);
 const choose=(id:OmegaUpgradeId)=>{
  try{setSnapshot(session.selectUpgrade(id));setPaused(false);}
  catch(error){console.error('OMEGA internal reward choice rejected',error);}
 };
 const togglePause=()=>{
  if(session.run.phase!=='battle')return;
  if(paused)session.resume();else session.pause();
  setPaused(!paused);setSnapshot(session.snapshot);
 };
 return <main className="omega-protocol-lab" data-omega-protocol-internal="true">
  <header>
   <div><span className="omega-protocol-tag">INTERNAL QA · NOT RELEASED</span>
    <h1>OMEGA PROTOCOL</h1>
    <p>시그널 워치 엔진 실전 연결 시험 · 미승인 캐릭터 대신 임시 도형 표시</p>
   </div>
   <button type="button" onClick={onExit}>게임 허브로 돌아가기</button>
  </header>
  <section className="omega-protocol-stats" aria-label="특별판 전투 상황">
   <div>전투 구역 <strong>{snapshot.plan.sector}/5</strong></div>
   <div>웨이브 <strong>{Math.min(OMEGA_PROTOCOL_TOTAL_WAVES,snapshot.run.wave)}/15</strong></div>
   <div>체력 <strong>{Math.ceil(snapshot.playerHp)}/{snapshot.run.maxHp}</strong></div>
   <div>남은 위협 <strong>{snapshot.enemiesAlive}</strong></div>
   <div>전투 상태 <strong>{snapshot.run.phase==='battle'?(snapshot.plan.isBoss?'BOSS':'교전 중'):snapshot.run.phase}</strong></div>
  </section>
  <div className="omega-protocol-arena"><canvas ref={canvasRef} width={1120} height={720} aria-label="시그널 워치 물리 엔진으로 움직이는 특별판 내부 시험 전장" /></div>
  {snapshot.run.phase==='reward'&&<section className="omega-protocol-rewards" aria-label="로그라이트 임시 강화 3가지 중 선택">
   <h2>전술 강화 선택</h2><p>선택한 효과는 이번 도전에만 적용됩니다.</p>
   <div>{snapshot.run.offers.map(id=>{const u=OMEGA_UPGRADES.find(e=>e.id===id)!;return <button key={id} type="button" onClick={()=>choose(id)}>
    <strong>{u.label}</strong><span>{u.description}</span><small>{u.role} · {snapshot.run.owned[id]??0}/{u.maxStacks}</small>
   </button>;})}</div>
  </section>}
  {(snapshot.run.phase==='defeat'||snapshot.run.phase==='victory')&&<section className="omega-protocol-end" role="status">
   <h2>{snapshot.run.phase==='victory'?'작전 완료':'작전 실패'}</h2>
   <p>성공한 웨이브 {snapshot.run.victories}/15 · 임시 강화는 재도전 시 초기화됩니다.</p>
  </section>}
  <footer>
   <div className="omega-protocol-pad" aria-label="모바일 이동 방향">
    {buttonDirections.map(d=><button type="button" key={d.label}
     onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);mobileDir.current={x:d.x,y:d.y};}}
     onPointerUp={()=>{mobileDir.current={x:0,y:0};}}
     onPointerCancel={()=>{mobileDir.current={x:0,y:0};}}>{d.label}</button>)}
   </div>
   <div className="omega-protocol-tools">
    <label>재현용 시드 <input inputMode="numeric" value={seedValue} onChange={e=>setSeedValue(e.target.value)} /></label>
    <button type="button" onClick={togglePause} disabled={snapshot.run.phase!=='battle'}>{paused?'계속하기':'일시정지'}</button>
    <button type="button" onClick={restart}>새 도전</button>
    <button type="button" onClick={()=>{session.abandon();setSnapshot(session.snapshot);}} disabled={snapshot.run.phase==='defeat'||snapshot.run.phase==='victory'}>도전 포기</button>
   </div>
  </footer>
  <p className="omega-protocol-warning">개발용 전투 시험입니다. 기존 보상·저장기록과 연결되지 않으며, 적 및 캐릭터 원화·장비 마스크·모바일 실기기 성능은 최종 승인 전입니다.</p>
 </main>;
}
