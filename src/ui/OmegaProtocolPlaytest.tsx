import {useCallback,useEffect,useRef,useState} from 'react';
import {OmegaProtocolCombatSession,type OmegaCombatSnapshot} from '../engine/omega-protocol-combat';
import {OMEGA_UPGRADES,OMEGA_PROTOCOL_TOTAL_WAVES,type OmegaUpgradeId} from '../domain/omega-protocol-run';
import {WORLD_WIDTH,WORLD_HEIGHT} from '../engine/patrol-survivors-engine';
import {drawOmegaFieldGround,drawOmegaFieldMission,drawOmegaFieldOcclusion} from './omega-protocol-field-render';
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
 ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
 ctx.fillStyle='#070e19';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
 ctx.save();
 // Keep every sprite circular and never stretch on portrait or landscape.
 // Camera follows the player; the run's collision/world bounds remain intact.
 const zoom=Math.max(ctx.canvas.width/WORLD_WIDTH,ctx.canvas.height/WORLD_HEIGHT);
 const cameraX=Math.max(ctx.canvas.width/zoom-WORLD_WIDTH,Math.min(0,ctx.canvas.width/(2*zoom)-state.player.x));
 const cameraY=Math.max(ctx.canvas.height/zoom-WORLD_HEIGHT,Math.min(0,ctx.canvas.height/(2*zoom)-state.player.y));
 ctx.scale(zoom,zoom);ctx.translate(cameraX,cameraY);
 const field=session.field;
 if(field)drawOmegaFieldGround(ctx,field.plan);
 else{
  ctx.fillStyle='#111a2b';ctx.fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
  ctx.strokeStyle='#243548';ctx.lineWidth=1;
  for(let x=0;x<=WORLD_WIDTH;x+=70){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,WORLD_HEIGHT);ctx.stroke();}
  for(let y=0;y<=WORLD_HEIGHT;y+=70){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WORLD_WIDTH,y);ctx.stroke();}
 }
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
 // Unapproved procedural humanoid (not the final 160-frame AIRA animation).
 ctx.save();ctx.translate(p.x,p.y);
 ctx.fillStyle='#030c179c';ctx.beginPath();ctx.ellipse(0,20,20,8,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#151e36';ctx.fillRect(-10,7,8,16);ctx.fillRect(2,7,8,16);
 ctx.fillStyle=p.isDashing?'#f4afe3':'#d9e6f5';
 ctx.beginPath();ctx.moveTo(-14,-16);ctx.lineTo(13,-16);ctx.lineTo(10,10);ctx.lineTo(-10,10);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#eb8ebf';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-13,-8);ctx.lineTo(-19,5);ctx.moveTo(13,-8);ctx.lineTo(21,4);ctx.stroke();
 ctx.fillStyle='#c4d5e8';ctx.beginPath();ctx.arc(0,-24,12,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#ffa7d5';ctx.fillRect(-10,-27,20,5);
 ctx.strokeStyle='#dd96d8';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(6,-32);ctx.lineTo(16,-41);ctx.stroke();
 ctx.strokeStyle='#0c2033';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(17,-2);ctx.lineTo(32,-8);ctx.stroke();
 ctx.fillStyle='#86f2ee';ctx.fillRect(28,-11,9,4);
 ctx.restore();
 if(field){
  drawOmegaFieldOcclusion(ctx,field.plan,p);
  drawOmegaFieldMission(ctx,field.plan,field.progress,p,state.gameTime);
 }
 // Modifier fog is presentation-only; crosswind and unstable ground also
 // affect the actual enemy motion or movement input in the run-scoped engine.
 if(session.plan.modifier==='low_visibility'){
  const radial=ctx.createRadialGradient(p.x,p.y,95,p.x,p.y,380);
  radial.addColorStop(0,'#070b1600');
  radial.addColorStop(.6,'#070b1666');
  radial.addColorStop(1,'#070b16e8');
  ctx.fillStyle=radial;ctx.fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
 }
 ctx.restore();
 // Portrait camera follows the player: preserve off-screen enemy awareness
 // with a cheap, always-visible whole-arena radar in screen coordinates.
 const mw=Math.max(70,Math.min(118,ctx.canvas.width*.155));
 const mh=mw*WORLD_HEIGHT/WORLD_WIDTH;
 const pad=ctx.canvas.width<600?10:16;
 const mx=ctx.canvas.width-mw-pad;
 const my=ctx.canvas.height<400?58:90;
 ctx.save();
 ctx.fillStyle='rgba(10,20,35,.83)';
 ctx.fillRect(mx-5,my-20,mw+10,mh+25);
 ctx.strokeStyle='rgba(126,205,227,.6)';
 ctx.lineWidth=1;ctx.strokeRect(mx,my,mw,mh);
 ctx.font='bold 10px system-ui,sans-serif';
 ctx.fillStyle='#92dbe8';ctx.fillText('RADAR',mx,my-7);
 if(field){
  for(const [loc,shade] of [
   [field.plan.event.target,'#87edff'],
   [field.plan.exit,field.progress.exitUnlocked?'#90ffd4':'#ffb779'],
  ] as const){
   ctx.fillStyle=shade;ctx.fillRect(mx+loc.x/WORLD_WIDTH*mw-2,my+loc.y/WORLD_HEIGHT*mh-2,5,5);
  }
 }
 for(const h of state.hazards.slice(0,32)){
  if(h.hp<=0)continue;
  const dotX=mx+Math.max(0,Math.min(1,h.x/WORLD_WIDTH))*mw;
  const dotY=my+Math.max(0,Math.min(1,h.y/WORLD_HEIGHT))*mh;
  ctx.beginPath();ctx.arc(dotX,dotY,h.isStageBoss?4:2.2,0,Math.PI*2);
  ctx.fillStyle=h.isStageBoss?'#ffe18e':'#fb94c6';ctx.fill();
 }
 ctx.beginPath();
 ctx.arc(mx+Math.max(0,Math.min(1,p.x/WORLD_WIDTH))*mw,
         my+Math.max(0,Math.min(1,p.y/WORLD_HEIGHT))*mh,3.2,0,Math.PI*2);
 ctx.fillStyle='#91fff0';ctx.fill();
 ctx.restore();
}
export function OmegaProtocolPlaytest({onExit}:{onExit:()=>void}){
 const [seedValue,setSeedValue]=useState('20261108');
 const [session,setSession]=useState(()=>new OmegaProtocolCombatSession(20261108,10,false));
 const [snapshot,setSnapshot]=useState<OmegaCombatSnapshot>(()=>session.snapshot);
 const [paused,setPaused]=useState(false);
 const [fps,setFps]=useState(0);
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const keysRef=useRef(new Set<string>());
 const mobileDir=useRef({x:0,y:0});
 // Multiple finger presses keep their own direction until released.
 const pointerMoves=useRef(new Map<number,{x:number;y:number}>());
 const lastHudAt=useRef(0);
 const restart=useCallback(()=>{
  const n=Number(seedValue);
  const newSession=new OmegaProtocolCombatSession(Number.isFinite(n)?Math.trunc(n):0,10,false);
  setSession(newSession);setSnapshot(newSession.snapshot);setPaused(false);
  keysRef.current.clear();pointerMoves.current.clear();mobileDir.current={x:0,y:0};
 },[seedValue]);
 useEffect(()=>{
  const onKeyDown=(e:KeyboardEvent)=>{
   if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
   if(validKeys.has(e.key)){keysRef.current.add(e.key);e.preventDefault();}
   if((e.code==='Space'||e.key==='Shift')&&!e.repeat){e.preventDefault();session.dash();}
   if(e.key.toLowerCase()==='q'&&!e.repeat){e.preventDefault();session.ultimate();}
  };
  const onKeyUp=(e:KeyboardEvent)=>{
   if(validKeys.has(e.key)){keysRef.current.delete(e.key);e.preventDefault();}
  };
  const pauseOnBackground=()=>{
   keysRef.current.clear();pointerMoves.current.clear();mobileDir.current={x:0,y:0};
   if(session.run.phase==='battle'&&session.engine.state.phase==='playing'){
    session.pause();setPaused(true);setSnapshot(session.snapshot);
   }
  };
  const onVisibility=()=>{if(document.hidden)pauseOnBackground();};
  const scaleCanvas=()=>{
   const canvas=canvasRef.current,container=canvas?.parentElement;
   if(!canvas||!container)return;
   const cssWidth=container.clientWidth||1120;
   // Keep mobile drawing workload proportional to on-screen size.
   const pixelWidth=Math.max(320,Math.min(1120,Math.round(cssWidth*Math.min(1.25,window.devicePixelRatio||1))));
   const pixelHeight=Math.max(160,Math.min(1200,Math.round((container.clientHeight||720)*Math.min(1.25,window.devicePixelRatio||1))));
   if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){
    canvas.width=pixelWidth;canvas.height=pixelHeight;
   }
  };
  scaleCanvas();
  window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);
  window.addEventListener('blur',pauseOnBackground);
  window.addEventListener('resize',scaleCanvas);
  document.addEventListener('visibilitychange',onVisibility);
  let request=0,last=0,alive=true,fpsTotal=0,fpsCount=0,fpsAt=0;
  const frame=(now:number)=>{
   if(!alive)return;
   const dt=last?Math.min(.05,Math.max(0,(now-last)/1000)):0;last=now;
   const k=keysRef.current;
   const mx=(Number(k.has('d')||k.has('D')||k.has('ArrowRight'))-Number(k.has('a')||k.has('A')||k.has('ArrowLeft')))+mobileDir.current.x;
   const my=(Number(k.has('s')||k.has('S')||k.has('ArrowDown'))-Number(k.has('w')||k.has('W')||k.has('ArrowUp')))+mobileDir.current.y;
   const length=Math.hypot(mx,my)||1;
   if(dt>0)session.update(dt,{moveX:mx/length,moveY:my/length,triggerAction:true});
   const ctx=canvasRef.current?.getContext('2d');if(ctx)drawLab(ctx,session);
   if(dt>0){fpsTotal+=dt;fpsCount++;}
   if(now-fpsAt>800&&fpsTotal>0){
    setFps(Math.round(fpsCount/fpsTotal));fpsTotal=0;fpsCount=0;fpsAt=now;
   }
   if(now-lastHudAt.current>130){lastHudAt.current=now;setSnapshot(session.snapshot);}
   request=requestAnimationFrame(frame);
  };
  request=requestAnimationFrame(frame);
  return ()=>{
   alive=false;cancelAnimationFrame(request);
   window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);
   window.removeEventListener('blur',pauseOnBackground);
   window.removeEventListener('resize',scaleCanvas);
   document.removeEventListener('visibilitychange',onVisibility);
  };
 },[session]);
 // Development-only browser screenshot fixture: advances real Watch-engine
 // waves (no fake DOM, no rewards saved). It is never enabled in production.
 useEffect(()=>{
  if(!import.meta.env.DEV)return;
  const mode=new URLSearchParams(window.location.search).get('omegaQaState');
  if(mode!=='reward'&&mode!=='boss')return;
  const ending=mode==='reward'?2:8;
  for(let i=0;i<ending&&session.run.phase!=='victory';i++){
   session.engine.state.hazards=[];
   session.update(1/60,{moveX:0,moveY:0,triggerAction:false});
   if(session.run.phase==='reward'&&i!==ending-1){
    session.selectUpgrade(session.run.offers[0]!);
   }
  }
  // Boss frame must enter wave 9; wave 8 has a mandatory card intermission.
  if(mode==='boss'&&session.run.phase==='reward'){
   session.selectUpgrade(session.run.offers[0]!);
  }
  setSnapshot(session.snapshot);
 },[session]);
 const setDirection=(pointerId:number,x:number,y:number)=>{
  pointerMoves.current.set(pointerId,{x,y});
  const all=[...pointerMoves.current.values()];
  mobileDir.current={x:all.reduce((sum,p)=>sum+p.x,0),y:all.reduce((sum,p)=>sum+p.y,0)};
 };
 const releaseDirection=(pointerId:number)=>{
  pointerMoves.current.delete(pointerId);
  const all=[...pointerMoves.current.values()];
  mobileDir.current={x:all.reduce((sum,p)=>sum+p.x,0),y:all.reduce((sum,p)=>sum+p.y,0)};
 };
 const choose=(id:OmegaUpgradeId)=>{
  try{setSnapshot(session.selectUpgrade(id));setPaused(false);}
  catch(error){console.error('OMEGA internal reward choice rejected',error);}
 };
 const togglePause=()=>{
  if(session.run.phase!=='battle')return;
  if(paused)session.resume();else session.pause();
  setPaused(!paused);setSnapshot(session.snapshot);
 };
 return <main className="omega-protocol-lab omega-protocol-v2" data-omega-protocol-internal="true">
  <header className="omega-protocol-topbar">
   <div className="omega-protocol-heading">
    <span className="omega-protocol-tag">INTERNAL QA · SPECIAL EDITION</span>
    <h1>OMEGA <em>PROTOCOL</em></h1>
    <p>실제 SIGNAL WATCH 전투 엔진 · 승인 전 임시 그래픽</p>
   </div>
   <button type="button" className="omega-protocol-exit" onClick={onExit} aria-label="내부 시험 종료">나가기 <span aria-hidden="true">×</span></button>
  </header>
  <section className="omega-protocol-stage" aria-label="OMEGA PROTOCOL 내부 전투 시험">
   <div className="omega-protocol-arena" data-omega-phase={snapshot.run.phase}>
    <canvas ref={canvasRef} width={1120} height={720} aria-label="실제 시그널 워치 전투 엔진을 사용하는 OMEGA PROTOCOL 내부 전장" />
    <div className="omega-protocol-stage-shade" aria-hidden="true"/>
    <div className="omega-protocol-stats" aria-label="전투 상태">
     <div className="omega-protocol-wave">
      <small>SECTOR {snapshot.plan.sector.toString().padStart(2,'0')} / 05</small>
      <strong>WAVE {Math.min(OMEGA_PROTOCOL_TOTAL_WAVES,snapshot.run.wave).toString().padStart(2,'0')} <span>/ 15</span></strong>
     </div>
     <div className="omega-protocol-hp">
      <span><b>HP</b> {Math.ceil(snapshot.playerHp)} / {snapshot.run.maxHp}</span>
      <div role="meter" aria-label="남은 체력" aria-valuemin={0} aria-valuemax={snapshot.run.maxHp} aria-valuenow={Math.max(0,Math.ceil(snapshot.playerHp))}>
       <i style={{width:(Math.max(0,Math.min(1,snapshot.playerHp/Math.max(1,snapshot.run.maxHp)))*100)+'%'}} />
      </div>
     </div>
     <div className="omega-protocol-threat"><small>THREATS</small><strong>{snapshot.enemiesAlive.toString().padStart(2,'0')}</strong></div>
     <div className="omega-protocol-modifier"><small>ENVIRONMENT</small><strong>{({standard:'표준',crosswind:'횡풍',low_visibility:'시야 제한',unstable_ground:'불안정 지반'} as const)[snapshot.plan.modifier]}</strong></div>
    </div>
    {snapshot.plan.isBoss&&snapshot.run.phase==='battle'&&<div className="omega-protocol-boss-alert">BOSS ENCOUNTER · 특수 위협 격리</div>}
    <div className="omega-protocol-controls">
     <div className="omega-protocol-pad" aria-label="모바일 이동 방향">
      {buttonDirections.map(d=><button type="button" key={d.label} disabled={snapshot.run.phase!=='battle'||paused}
       onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);setDirection(e.pointerId,d.x,d.y);}}
       onPointerUp={e=>releaseDirection(e.pointerId)}
       onPointerCancel={e=>releaseDirection(e.pointerId)}
       onLostPointerCapture={e=>releaseDirection(e.pointerId)}
       aria-label={({ '↑':'위로 이동','←':'왼쪽 이동','↓':'아래로 이동','→':'오른쪽 이동'} as Record<string,string>)[d.label]}>{d.label}</button>)}
      <div className="omega-protocol-pad-center" aria-hidden="true">◇</div>
     </div>
     <div className="omega-protocol-action-pad">
      <button type="button" className="omega-protocol-action omega-protocol-dash" onClick={()=>{session.dash();setSnapshot(session.snapshot);}}
       disabled={snapshot.run.phase!=='battle'||snapshot.enginePhase!=='playing'||(session.engine.state.player.dashCooldown??0)>0}
       aria-label="회피 · 스페이스 또는 시프트">
       <span className="omega-protocol-action-glyph" aria-hidden="true">↗</span><span>회피</span>
      </button>
      <button type="button" className="omega-protocol-action omega-protocol-ultimate" onClick={()=>{session.ultimate();setSnapshot(session.snapshot);}}
       disabled={snapshot.run.phase!=='battle'||snapshot.enginePhase!=='playing'||session.engine.state.ultimateCharge<session.engine.state.maxUltimateCharge}
       aria-label={'궁극기 · 충전 '+Math.floor(100*session.engine.state.ultimateCharge/Math.max(1,session.engine.state.maxUltimateCharge))+'퍼센트'}>
       <span className="omega-protocol-action-glyph" aria-hidden="true">✦</span><span>궁극기</span>
       <small>{Math.floor(100*session.engine.state.ultimateCharge/Math.max(1,session.engine.state.maxUltimateCharge))}%</small>
      </button>
     </div>
    </div>
    <div className="omega-protocol-stage-meta" aria-hidden="true"><span>WASD · 이동</span><span>SPACE · 회피</span><span>Q · 궁극기</span><span>CPU QA · {fps||'—'} FPS</span></div>
    {paused&&snapshot.run.phase==='battle'&&<div className="omega-protocol-paused" role="status"><strong>작전 일시정지</strong><span>아래 계속하기를 눌러 진행하세요.</span></div>}
    {snapshot.run.phase==='reward'&&<div className="omega-protocol-overlay omega-protocol-reward-overlay" role="presentation">
      <section className="omega-protocol-rewards" role="dialog" aria-modal="true" aria-label="전술 강화 선택">
       <span className="omega-protocol-modal-kicker">TACTICAL EVOLUTION</span>
       <h2>전술 강화 선택</h2>
       <p>세 가지 중 하나를 선택하세요. 강화 효과는 이번 도전에만 유지됩니다.</p>
       <div className="omega-protocol-reward-cards">{snapshot.run.offers.map((id,i)=>{const u=OMEGA_UPGRADES.find(e=>e.id===id)!;return <button key={id} type="button" onClick={()=>choose(id)}>
         <small className="omega-protocol-card-index">0{i+1} · {u.role.toUpperCase()}</small>
         <strong>{u.label}</strong><span>{u.description}</span>
         <small className="omega-protocol-card-rank">LV {(snapshot.run.owned[id]??0)+1} / {u.maxStacks}</small>
       </button>;})}</div>
      </section>
    </div>}
    {(snapshot.run.phase==='defeat'||snapshot.run.phase==='victory')&&<div className="omega-protocol-overlay">
      <section className="omega-protocol-end" role="status">
       <span className="omega-protocol-modal-kicker">{snapshot.run.phase==='victory'?'MISSION COMPLETED':'OPERATION TERMINATED'}</span>
       <h2>{snapshot.run.phase==='victory'?'작전 완료':'작전 실패'}</h2>
       <p>성공한 웨이브 {snapshot.run.victories}/15 · 임시 강화는 재도전 시 초기화됩니다.</p>
       <button type="button" onClick={restart}>다시 출격</button>
      </section>
    </div>}
   </div>
  </section>
  <footer className="omega-protocol-bottom-toolbar">
   <div className="omega-protocol-run-tools">
    <label>SEED <input inputMode="numeric" aria-label="재현용 시드" value={seedValue} onChange={e=>setSeedValue(e.target.value)} /></label>
    <button type="button" onClick={togglePause} disabled={snapshot.run.phase!=='battle'}>{paused?'계속하기':'일시정지'}</button>
    <button type="button" onClick={restart}>새 도전</button>
    <button type="button" onClick={()=>{session.abandon();setSnapshot(session.snapshot);}} disabled={snapshot.run.phase==='defeat'||snapshot.run.phase==='victory'}>도전 포기</button>
   </div>
   <p className="omega-protocol-warning">미출시 내부 시험 · 원화·장비 마스크 미승인 · 기존 저장기록과 분리</p>
  </footer>
 </main>;
}
