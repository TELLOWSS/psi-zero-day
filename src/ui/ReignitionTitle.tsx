import {useState,type ReactNode} from 'react';
import {useDialogFocus} from './useDialogFocus';
import type {EndgameHomeStatus} from '../app/endgame-home';
import {DEFENSE_PREMIUM_HERO} from '../app/defense-premium-art';
import {SIGNAL_WATCH_KEY_ART} from './signal-watch-art';
import {SurvivorsGraphicsSettings} from './SurvivorsGraphicsSettings';
import './reignition-title.css';
import './reignition-premium.css';
import './psi-experience-ui.css';

export const HOME_THEMES=[
 {id:'cinematic',label:'A · 시네마틱',subtitle:'리바이벌'},
 {id:'operations',label:'B · 작전 허브',subtitle:'상황실'},
 {id:'terminal',label:'C · 터미널',subtitle:'컨트롤'},
 {id:'elite',label:'D · 미니멀',subtitle:'엘리트'},
] as const;
export type HomeTheme=typeof HOME_THEMES[number]['id'];
// Fresh production default; prior preview experiments must not override the approved theme.
const HOME_THEME_STORAGE_KEY='psi.zero-day.home.reignition.design.v3';
export function resolveHomeTheme(query:string,stored:string|null):HomeTheme{
  const requested=new URLSearchParams(query).get('home');
  const value=requested??stored;
  return HOME_THEMES.find(theme=>theme.id===value)?.id??'cinematic';
}

export interface ReignitionTitleProps {
 readonly status:EndgameHomeStatus;
 readonly brand:string;
 readonly emblem:string;
 readonly heroWide:string;
 readonly heroPortrait:string;
 readonly crew?:readonly {id:string;uri?:string;name:string;role:string}[];
 readonly onMap?:()=>void;
 readonly onGuard?:()=>void;
 readonly onWatch?:()=>void;
 readonly onStory:()=>void;
 readonly onGuide:()=>void;
 readonly onPeople:()=>void;
 readonly onJournal:()=>void;
 readonly onManual:()=>void;
 readonly onSong:()=>void;
 readonly restartVisible?:boolean;
 readonly onRestart?:()=>void;
 readonly restartLabel?:string;
 readonly saveWarning?:string;
 readonly audioMuted:boolean;
 readonly onToggleAudio:()=>void;
 readonly motionEnabled:boolean;
 readonly onToggleMotion:()=>void;
 readonly children?:ReactNode;
}

const descriptions:Record<HomeTheme,{eyebrow:string,title:string,lead:string,primary:string}>={
 cinematic:{eyebrow:'THE NEXT SHIFT / A NEW STANDARD',title:'완료한 전선 너머, 더 어려운 선택.',lead:'승리의 기록은 그대로. 이제 더 날카로운 판단과 끝까지 흔들리지 않는 대응으로 다음 현장을 지켜내세요.',primary:'마스터 작전 개시'},
 operations:{eyebrow:'OPERATION CONTROL / VETERAN HQ',title:'다음 현장을 지휘할 시간.',lead:'시그널 가드와 워치의 달성도, 위험 작전, 새로운 도전을 한눈에 확인하세요.',primary:'작전 현황 보기'},
 terminal:{eyebrow:'SYSTEM READY / RISK CONTAINMENT',title:'위험 신호를 분석하라.',lead:'여섯 번의 방어, 쉰 번의 순찰 다음에도 끝나지 않는 현장 판단.',primary:'작전 신호 연결'},
 elite:{eyebrow:'RE:IGNITION / THE VETERAN ERA',title:'다시, 현장으로.',lead:'전과 다른 압박. 같은 판단력. 오늘의 무사귀환을 완성하세요.',primary:'도전 시작'},
};

/** The leading action must never advertise locked mastery to a first-time player. */
export function resolveHomePrimaryMission(status:EndgameHomeStatus,guardAvailable:boolean,watchAvailable:boolean):{mode:'guard'|'watch'|'none';label:string} {
  let mode:'guard'|'watch'|'none'='none';
  if(guardAvailable&&watchAvailable&&status.guardUnlocked&&status.watchUnlocked){
    const guardRemaining=Math.max(0,6-status.guardMastered);
    const watchRemaining=Math.max(0,50-status.watchMastered);
    // A completed mastery board must never take priority over unfinished work.
    // When both remain, focus the mode with the lower three-star completion rate.
    mode=guardRemaining===0&&watchRemaining>0?'watch':
      watchRemaining===0&&guardRemaining>0?'guard':
      status.watchMastered/50<status.guardMastered/6?'watch':'guard';
  }else if(status.guardUnlocked&&guardAvailable)mode='guard';
  else if(status.watchUnlocked&&watchAvailable)mode='watch';
  else if(guardAvailable&&watchAvailable)mode=status.watchClears/50>status.guardClears/6?'watch':'guard';
  else if(guardAvailable)mode='guard';
  else if(watchAvailable)mode='watch';
  const unlocked=mode==='guard'?status.guardUnlocked:mode==='watch'?status.watchUnlocked:false;
  const mastered=mode==='guard'?status.guardMastered>=6:mode==='watch'?status.watchMastered>=50:false;
  const progress=mode==='guard'?status.guardClears:mode==='watch'?status.watchClears:0;
  return {mode,label:unlocked?(mastered?'마스터 재도전':'마스터 작전 개시'):progress>0?'작전 이어하기':'첫 작전 시작'};
}

/** Uses only verified save totals; never invents a next-stage unlock or reward. */
export function resolveHomeNextChallenge(status:EndgameHomeStatus,guardAvailable:boolean,watchAvailable:boolean){
  const {mode}=resolveHomePrimaryMission(status,guardAvailable,watchAvailable);
  if(mode==='none')return {mode,title:'실행 가능한 작전이 없습니다',detail:'게임 진입 상태를 확인해 주세요.'};
  const guard=mode==='guard';
  const name=guard?'시그널 가드':'시그널 워치';
  const total=guard?6:50;
  const clears=Math.min(total,Math.max(0,guard?status.guardClears:status.watchClears));
  const unlocked=guard?status.guardUnlocked:status.watchUnlocked;
  const mastered=Math.min(total,Math.max(0,guard?status.guardMastered:status.watchMastered));
  if(!unlocked)return {mode,title:`${name} · 일반 작전 ${total-clears}개 남음`,detail:'현재 클리어 기록 기준 · 완료 시 마스터 난이도 해금'};
  if(mastered<total)return {mode,title:`${name} · 마스터 3성 ${total-mastered}개 남음`,detail:`검증된 마스터 3성 기록 ${mastered}/${total} · 기존 데이터 유지`};
  return {mode,title:`${name} · 마스터 전 구간 달성`,detail:'기존 기록을 유지하며 최고 성과에 다시 도전할 수 있습니다.'};
}

export function ReignitionTitle(props:ReignitionTitleProps){
 const [theme,setTheme]=useState<HomeTheme>(()=>{
  try{return resolveHomeTheme(typeof window==='undefined'?'':window.location.search,typeof window==='undefined'?null:window.localStorage.getItem(HOME_THEME_STORAGE_KEY));}
  catch{return 'cinematic';}
 });
 const [settings,setSettings]=useState(false);
 const [releaseOpen,setReleaseOpen]=useState(false);
 const settingsDialog=useDialogFocus(settings,()=>setSettings(false));
 const {status}=props;
 const active=descriptions[theme];
 const guardUnlocked=status.guardUnlocked;
 const watchUnlocked=status.watchUnlocked;
 const guardPercent=Math.max(0,Math.min(100,status.guardClears/6*100));
 const watchPercent=Math.max(0,Math.min(100,status.watchClears/50*100));
 const guardMasterPercent=Math.round(Math.max(0,Math.min(100,status.guardMastered/6*100)));
 const watchMasterPercent=Math.round(Math.max(0,Math.min(100,status.watchMastered/50*100)));
 const mission=resolveHomePrimaryMission(status,Boolean(props.onGuard),Boolean(props.onWatch));
 const nextChallenge=resolveHomeNextChallenge(status,Boolean(props.onGuard),Boolean(props.onWatch));
 const heroGo=mission.mode==='guard'?props.onGuard:mission.mode==='watch'?props.onWatch:undefined;
 const selectTheme=(next:HomeTheme)=>{
  setTheme(next);
  try{window.localStorage.setItem(HOME_THEME_STORAGE_KEY,next);
    const url=new URL(window.location.href);url.searchParams.set('home',next);window.history.replaceState(null,'',url.toString());
  }catch{/* browser preferences are optional; selection still works */}
 };
 const scrollToMissions=()=>document.getElementById('reignition-missions')?.scrollIntoView({behavior:props.motionEnabled?'smooth':'auto',block:'start'});
 return <main className="rg-home" data-title-layout="REIGNITION_V1" data-reignition-concept={theme}>
  <a className="rg-skip-missions" href="#reignition-missions">게임 선택 바로가기</a>
  <header className="rg-header">
   <div className="rg-brand"><img src={props.emblem} alt="" width={50} height={56}/><div><strong>PSI : ZERO DAY</strong><small>{props.brand} / RE:IGNITION</small></div></div>
   <details className="rg-appearance" aria-label="화면 디자인 선택">
    <summary>화면 스타일 <span aria-hidden="true">⌄</span></summary>
    <div className="rg-theme-picker" role="group" aria-label="메인 화면 시안 선택">
     {HOME_THEMES.map(option=><button key={option.id} type="button" aria-pressed={theme===option.id} onClick={()=>selectTheme(option.id)} title={option.subtitle}>{option.label}</button>)}
    </div>
   </details>
   <div className="rg-header-tools">
    <button type="button" className="rg-header-missions" onClick={scrollToMissions}>게임 선택</button>
    <button type="button" onClick={props.onManual}>도움말</button>
    <button type="button" onClick={()=>setSettings(true)} aria-label="게임 설정 열기">설정 <span aria-hidden="true">⚙</span></button>
   </div>
  </header>
  <div className="rg-workspace">
   <nav className="rg-sidebar" aria-label="메인 메뉴">
    <span className="rg-rail-code">PSI / COMMAND</span>
    <button type="button" className="rg-rail-primary" onClick={heroGo} disabled={!heroGo}><span aria-hidden="true">◈</span> 작전 개시</button>
    <button type="button" onClick={scrollToMissions}><span aria-hidden="true">◫</span> 작전 선택</button>
    <button type="button" onClick={props.onJournal}><span aria-hidden="true">▥</span> 작전 기록</button>
    <button type="button" onClick={props.onMap}><span aria-hidden="true">◉</span> 스토리 진행 경로</button>
    <button type="button" onClick={props.onPeople}><span aria-hidden="true">♧</span> 대원 정보</button>
    <button type="button" onClick={props.onGuide}><span aria-hidden="true">◇</span> 현장 안내</button>
    <button type="button" onClick={props.onSong}><span aria-hidden="true">♫</span> OST</button>
    <small>RE:IGNITION / 2026.11</small>
   </nav>
   <div className="rg-main">
    <section className="rg-hero" aria-label="PSI 제로데이 엔드게임 메인">
     <picture className="rg-hero-picture">
      {theme!=='cinematic'&&<source media="(max-width:670px) and (orientation:portrait)" srcSet={props.heroPortrait}/>}
      <img src={theme==='cinematic'?'/assets/reignition/veteran-return.webp':theme==='operations'?'/'+DEFENSE_PREMIUM_HERO:theme==='terminal'?SIGNAL_WATCH_KEY_ART:props.heroWide} className="rg-hero-art" alt="" fetchPriority="high" decoding="async"/>
     </picture>
     {theme==='cinematic'&&<img className="rg-veteran-character" src="/assets/reignition/veteran-return.webp" alt="" loading="eager" decoding="async"/>}
     <div className="rg-terminal-grid" aria-hidden="true"><span/><span/><span/><span/></div>
     <div className="rg-hero-shade" aria-hidden="true"/>
     <div className="rg-cinematic-rings" aria-hidden="true"><span/><span/></div>
     <div className="rg-hero-micro" aria-hidden="true"><span>PSI / OPERATIONS</span><span>SEASON 01 — RE:IGNITION</span></div>
     <div className="rg-hero-content">
      <span className="rg-hero-eyebrow">{active.eyebrow}</span>
      <div className="rg-hero-update"><span aria-hidden="true" className="rg-led"/> MAJOR UPDATE · NOVEMBER 2026</div>
      <p className="rg-hero-name">RE:IGNITION</p>
      <h1>{status.veteran?active.title:'위험을 읽고, 오늘을 지켜라.'}</h1>
      <p className="rg-hero-lead">{active.lead}</p>
      <div className="rg-hero-brief" aria-label="현재 저장된 작전 진행도">
       <span><small>GUARD</small><strong>{status.guardClears}<em>/ 06</em></strong></span>
       <i aria-hidden="true"/>
       <span><small>WATCH</small><strong>{status.watchClears}<em>/ 50</em></strong></span>
       <span className="rg-hero-record-label">{status.veteran?'VETERAN RECORD SYNCED':'NEW OPERATOR'}</span>
      </div>
      <div className="rg-hero-buttons">
       <button type="button" className="rg-hero-action" onClick={theme==='operations'?scrollToMissions:heroGo} disabled={theme!=='operations'&&!heroGo}><span aria-hidden="true">▷</span> {theme==='cinematic'?mission.label:active.primary}</button>
       <button type="button" className="rg-hero-alt" onClick={scrollToMissions}>두 게임 보기 <span aria-hidden="true">↓</span></button>
      </div>
      <div className="rg-hero-caption"><span aria-hidden="true">✦</span><span>WATCH THE SIGNAL. MAKE THE CALL.</span></div>
     </div>
     <div className="rg-hero-index" aria-hidden="true"><span>001 / VETERAN OPERATIONS</span><b>ZERO DAY</b><span>SURVIVE · SECURE · RETURN</span></div>
    </section>

    <section className="rg-missions" id="reignition-missions" aria-labelledby="rg-missions-title">
     <div className="rg-missions-heading"><div><small>LIVE MISSIONS / RE:IGNITION</small><h2 id="rg-missions-title">새로운 전선, 두 개의 선택.</h2></div><span>ENDGAME · 2026.11</span></div>
     <div className="rg-mission-grid" data-compact-entry="full-card">
      <button type="button" className="rg-card is-guard" onClick={props.onGuard} disabled={!props.onGuard} aria-label={`시그널 가드 · 6개 중 ${status.guardClears}개 완료 · ${guardUnlocked?"마스터 작전":"일반 작전"} 진입`}>
       <img src={'/'+DEFENSE_PREMIUM_HERO} alt="" loading="eager" decoding="async"/>
       <span className="rg-card-screen"/><span className="rg-card-serial" aria-hidden="true">01</span>
       <span className="rg-card-info"><small>01 / TACTICAL DEFENSE</small><strong>시그널 가드</strong><em>SIGNAL GUARD</em>
        <span>6개 현장 완료 후, 더욱 날카로운 마스터 전술전</span>
        <span className="rg-card-progress" role="progressbar" aria-label="가드 완료 작전" aria-valuemin={0} aria-valuemax={6} aria-valuenow={status.guardClears}><i style={{width:guardPercent+"%"}}/></span>
        <span className="rg-card-count">CLEAR {status.guardClears} / 06 <em>{guardUnlocked?'MASTER CHALLENGE':'CAMPAIGN'}</em></span>
        {guardUnlocked?<span className="rg-card-mastery" aria-label={`가드 마스터 3성 ${status.guardMastered}개 / 6개`}><span className="rg-card-mastery-label">MASTER 3★ <strong>{status.guardMastered} / 06</strong></span><span className="rg-card-mastery-track" aria-hidden="true"><i style={{width:guardMasterPercent+'%'}}/></span></span>:null}
        <b>{guardUnlocked?'마스터 작전 선택':'작전 시작'} <span aria-hidden="true">↗</span></b></span>
      </button>
      <button type="button" className="rg-card is-watch" onClick={props.onWatch} disabled={!props.onWatch} aria-label={`시그널 워치 · 50개 중 ${status.watchClears}개 완료 · ${watchUnlocked?"마스터 작전":"일반 작전"} 진입`}>
       <img src={SIGNAL_WATCH_KEY_ART} alt="" loading="eager" decoding="async"/>
       <span className="rg-card-screen"/><span className="rg-card-serial" aria-hidden="true">02</span>
       <span className="rg-card-info"><small>02 / SURVIVAL ACTION</small><strong>시그널 워치</strong><em>SIGNAL WATCH</em>
        <span>50개 스테이지 이후, 변칙 위험과 패턴 대응 보스</span>
        <span className="rg-card-progress" role="progressbar" aria-label="워치 완료 스테이지" aria-valuemin={0} aria-valuemax={50} aria-valuenow={status.watchClears}><i style={{width:watchPercent+"%"}}/></span>
        <span className="rg-card-count">CLEAR {status.watchClears} / 50 <em>{watchUnlocked?'MASTER CHALLENGE':'CAMPAIGN'}</em></span>
        {watchUnlocked?<span className="rg-card-mastery" aria-label={`워치 마스터 3성 ${status.watchMastered}개 / 50개`}><span className="rg-card-mastery-label">MASTER 3★ <strong>{status.watchMastered} / 50</strong></span><span className="rg-card-mastery-track" aria-hidden="true"><i style={{width:watchMasterPercent+'%'}}/></span></span>:null}
        <b>{watchUnlocked?'마스터 작전 선택':'스테이지 선택'} <span aria-hidden="true">↗</span></b></span>
      </button>
     </div>
     <aside className="rg-command-status" aria-label="실제 클리어 기록 기반 도전 현황">
      <div className="rg-command-heading"><span className="rg-led" aria-hidden="true"/><strong>VETERAN RECORD</strong><small>저장기록 연동</small></div>
      <div className="rg-stats">
       <div><span>GUARD CLEAR</span><strong>{status.guardClears}<small>/6</small></strong><progress max={6} value={status.guardClears} aria-label="가드 작전 클리어 수"/><small>{guardUnlocked?'마스터 ★★★ '+status.guardMastered+'/6':'6개 작전 완료 시 마스터 해금'}</small></div>
       <div><span>WATCH CLEAR</span><strong>{status.watchClears}<small>/50</small></strong><progress max={50} value={status.watchClears} aria-label="워치 스테이지 클리어 수"/><small>{watchUnlocked?'마스터 ★★★ '+status.watchMastered+'/50':'50개 스테이지 완료 시 마스터 해금'}</small></div>
      </div>
      <div className="rg-next-challenge" data-next-mode={nextChallenge.mode} aria-label="실제 기록 기반 다음 도전">
       <span className="rg-next-kicker">NEXT CHALLENGE <small>VERIFIED SAVE</small></span>
       <strong>{nextChallenge.title}</strong>
       <span className="rg-next-description">{nextChallenge.detail}</span>
      </div>
      <p>{status.veteran?'기존 완료 기록은 유지됩니다. 마스터 기록과 새로운 도전 현황은 저장 데이터에 따라 표시됩니다.':'기존 작전을 완료하면 각 모드의 마스터 난이도가 열립니다.'}</p>
     </aside>
    </section>
    <section className="rg-shortcuts" aria-label="다른 게임과 기록">
     <button type="button" className="rg-story-button" onClick={props.onStory}><span>◉</span><strong>스토리 모드</strong><small>EPISODE / STORY</small></button>
     <a href="/signal-breaker-dev/index.html?entry=play" className="rg-breaker-link"><span>◇</span><strong>시그널 브레이커</strong><small>ARCADE / BREAKER</small></a>
     <button type="button" onClick={props.onJournal}><span>▤</span><strong>기록·성취</strong><small>PROGRESS / ARCHIVE</small></button>
     <button type="button" onClick={props.onGuide}><span>▧</span><strong>현장 안내</strong><small>GUIDE / FIELD</small></button>
    </section>
    {props.crew?.length?<details className="rg-crew-reveal">
      <summary>함께한 현장 동료 <span>CREW ARCHIVE / {props.crew.length} MEMBERS</span></summary>
      <div className="rg-crew-grid">{props.crew.map(member=><figure key={member.id} data-character={member.id} data-art-surface="main">
        <img src={member.uri} alt="" loading="lazy" decoding="async"/><figcaption><strong>{member.name}</strong><small>{member.role}</small></figcaption>
      </figure>)}</div>
     </details>:null}
   </div>
  </div>
  {props.restartVisible&&props.onRestart?<div className="rg-story-resume"><button type="button" className="story-restart-entry" onClick={props.onRestart}>{props.restartLabel??'스토리 기록 관리'}</button>{props.saveWarning?<p role="status" className="story-save-warning">{props.saveWarning}</p>:null}</div>:props.saveWarning?<p role="status" className="rg-save-warning story-save-warning">{props.saveWarning}</p>:null}
  <section className="rg-release">
   <button type="button" className="rg-release-toggle" aria-expanded={releaseOpen} aria-controls="rg-release-detail" onClick={()=>setReleaseOpen(v=>!v)}>
    <span>2026.11 업데이트 · 무엇이 달라졌나요?</span><span aria-hidden="true">{releaseOpen?'−':'+'}</span>
   </button>
   {releaseOpen?<div id="rg-release-detail" className="rg-release-items"><p><strong>시그널 가드</strong> 6개 작전 완료 이후 더 강한 적 특성과 새로운 대응 과제. 마스터 별도 기록.</p><p><strong>시그널 워치</strong> 50스테이지 완주 이후 마스터 난이도. 보스 경고·회피·약점 파악이 중요합니다.</p><p><strong>복귀 유저</strong> 기존 저장기록 유지, 완료 수치 표시, 다음 마스터 목표 자동 안내.</p></div>:<div id="rg-release-detail" hidden/>}
  </section>
  <footer className="rg-footer"><span>PSI : ZERO DAY</span><span>RE:IGNITION · BUILD PEOPLE A SAFER TOMORROW</span><span>VETERAN EDITION · 2026.11</span></footer>
  <nav className="rg-mobile-dock" aria-label="게임 빠른 실행">
   <button type="button" onClick={props.onGuard} disabled={!props.onGuard} aria-label="시그널 가드 바로 실행"><small>01 / DEFENSE</small><strong>시그널 가드</strong><span aria-hidden="true">↗</span></button>
   <button type="button" onClick={props.onWatch} disabled={!props.onWatch} aria-label="시그널 워치 바로 실행"><small>02 / ACTION</small><strong>시그널 워치</strong><span aria-hidden="true">↗</span></button>
  </nav>
  {settings?<div ref={settingsDialog.dialogRef} onKeyDown={settingsDialog.onKeyDown} className="rg-settings-backdrop" role="presentation" onClick={()=>setSettings(false)}>
   <section role="dialog" aria-modal="true" aria-labelledby="rg-settings-title" className="rg-settings-panel" onClick={e=>e.stopPropagation()}>
    <header><h2 id="rg-settings-title">게임·화면 설정</h2><button ref={settingsDialog.closeRef} type="button" onClick={()=>setSettings(false)}>닫기 ×</button></header>
    <SurvivorsGraphicsSettings/>
    <button type="button" className="rg-help-from-settings" onClick={()=>{setSettings(false);props.onManual();}}>게임 도움말 열기</button>
    <label>화면 애니메이션 <input type="checkbox" checked={props.motionEnabled} onChange={props.onToggleMotion}/></label>
    <label>배경음·효과음 <input type="checkbox" checked={!props.audioMuted} onChange={props.onToggleAudio}/></label>
    <p>화면 스타일은 이 브라우저에 저장되며, 기존 게임 기록에는 영향을 주지 않습니다. <kbd>ESC</kbd>로 닫을 수 있습니다.</p>
   </section>
  </div>:null}
  {props.children}
 </main>;
}
