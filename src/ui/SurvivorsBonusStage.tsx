import {useEffect,useRef,useState} from 'react';
import {SurvivorsPinballEngine,type PinballMode} from '../engine/survivors-pinball-engine';
import {type PinballTableId} from '../domain/survivors-pinball-tables';
import {drawPinball} from './survivors-pinball-renderer';
import {getGraphicsMode,GRAPHICS_PROFILES} from './survivors-graphics-settings';
import {PATROL_STAGE_IDS,type PatrolStageId,type CharacterId} from '../domain/patrol-survivors';
import {CHARACTER_PROFILES} from '../engine/patrol-survivors-engine';
import {readPinballBest,savePinballBest} from '../app/survivors-pinball-record';
import {PinballAudio,type PinballMusic} from './survivors-pinball-audio';
import {availablePinballChoice,PINBALL_THEMES,type PinballTheme,type PinballRule} from '../domain/survivors-recreation';
import {readPinballChoice,savePinballChoice} from '../app/survivors-recreation';
import {SurvivorsPinballCustomization} from './SurvivorsPinballCustomization';
import recreationText from '../../content/localization/survivors-recreation-ko.json';
import copy from '../../content/localization/survivors-bonus-ko.json';
import './survivors-bonus-stage.css';

export function SurvivorsBonusStage({onReward,onClose,audioMuted=false,characterId='player',completedStages=[]}:{onReward:(earned:number)=>boolean;onClose:()=>void;audioMuted?:boolean;characterId?:CharacterId;completedStages?:readonly PatrolStageId[]}) {
 const clears=PATROL_STAGE_IDS.filter(id=>completedStages.includes(id)).length;
 const [choice,setChoice]=useState(()=>readPinballChoice(clears,completedStages)),[choiceFailed,setChoiceFailed]=useState(false),[settingsTab,setSettingsTab]=useState<'sound'|'table'>('sound');
 const engine=useRef(new SurvivorsPinballEngine('bonus',{rule:choice.rule,clears,table:choice.theme as PinballTableId,completedStages})),canvas=useRef<HTMLCanvasElement>(null),dialog=useRef<HTMLDivElement>(null),boardArea=useRef<HTMLDivElement>(null);
 const keys=useRef(new Set<string>()),touches=useRef({left:new Set<number>(),right:new Set<number>()});
 const art=useRef<{table:HTMLImageElement;paddle:HTMLImageElement;cargo:HTMLImageElement;atlas:HTMLImageElement;environment:HTMLImageElement}|null>(null),paid=useRef(false),reward=useRef(onReward);reward.current=onReward;
 const [loaded,setLoaded]=useState(false),[assetError,setAssetError]=useState(false),[paused,setPaused]=useState(false),[assist,setAssist]=useState(false),[saved,setSaved]=useState<boolean|null>(null),[,refresh]=useState(0);
 const [mode,setMode]=useState<PinballMode>('bonus'),[nativeFullscreen,setNativeFullscreen]=useState(false),[fullscreenFailed,setFullscreenFailed]=useState(false);
 const [launchPower,setLaunchPower]=useState(.65);
 const [best,setBest]=useState(()=>readPinballBest('bonus',choice.rule,choice.theme));
 const [settingsOpen,setSettingsOpen]=useState(false);
 const settingsWasOpen=useRef(false);
 useEffect(()=>{
  if(settingsOpen)dialog.current?.querySelector<HTMLElement>(settingsTab==='table'?'.pinball-theme-card:not(:disabled)':'.pinball-settings-panel select')?.focus({preventScroll:true});
  else if(settingsWasOpen.current)dialog.current?.querySelector<HTMLButtonElement>('.pinball-settings-toggle')?.focus({preventScroll:true});
  settingsWasOpen.current=settingsOpen;
 },[settingsOpen,settingsTab]);
 const pausedRef=useRef(false),assistRef=useRef(false),muted=useRef(audioMuted);muted.current=audioMuted;
 const audio=useRef<PinballAudio|null>(null);
 const [soundOff,setSoundOff]=useState(false),[audioReady,setAudioReady]=useState(false),[audioError,setAudioError]=useState(false),[music,setMusic]=useState<PinballMusic>('shift');
 const soundOffRef=useRef(false);soundOffRef.current=soundOff;
 useEffect(()=>{let disposed=false;const player=new PinballAudio();audio.current=player;void player.load().then(()=>{if(!disposed)setAudioReady(true);}).catch(()=>{if(!disposed)setAudioError(true);});return()=>{disposed=true;player.dispose();audio.current=null;};},[]);
 useEffect(()=>{if(audioMuted||soundOff)audio.current?.setActive(false);},[audioMuted,soundOff]);
 const release=()=>{keys.current.clear();touches.current.left.clear();touches.current.right.clear();};
 const pause=(value:boolean)=>{pausedRef.current=value;setPaused(value);if(value)audio.current?.setActive(false);else void audio.current?.unlock();release();};
 const toggleSettings=()=>{if(!settingsOpen&&engine.current.state.phase==='playing')pause(true);setSettingsTab('sound');setSettingsOpen(!settingsOpen);};
 const complete=()=>{if(paid.current)return;const e=engine.current,earned=e.finish();const ok=e.mode==='practice'||reward.current(earned);paid.current=ok;if(ok)setBest(savePinballBest({score:e.state.score,combo:e.state.bestCombo},e.mode,e.rule,e.site.id));setSaved(ok);};
 const settle=()=>{pause(false);complete();refresh(v=>v+1);};
 const reset=(next:PinballMode)=>{audio.current?.setActive(false);release();pausedRef.current=false;setPaused(false);setSettingsOpen(false);paid.current=false;setSaved(null);engine.current=new SurvivorsPinballEngine(next,{rule:choice.rule,clears,table:choice.theme as PinballTableId,completedStages});setMode(next);setBest(readPinballBest(next,choice.rule,choice.theme));refresh(v=>v+1);};
 const customize=()=>{if(engine.current.state.phase==='playing')pause(true);setSettingsTab('table');setSettingsOpen(true);};
 const changeChoice=(value:{theme:PinballTheme;rule:PinballRule})=>{if(engine.current.state.phase!=='ready')return;const next=availablePinballChoice(value,clears,completedStages);setChoice(next);setChoiceFailed(!savePinballChoice(next,clears,completedStages));engine.current=new SurvivorsPinballEngine(mode,{rule:next.rule,clears,table:next.theme as PinballTableId,completedStages});setBest(readPinballBest(mode,next.rule,next.theme));if(next.theme!==choice.theme){setLoaded(false);setAssetError(false);}};
 const enterFullscreen=async()=>{if(document.fullscreenElement===dialog.current)return;try{if(!dialog.current?.requestFullscreen)throw Error('unsupported');await dialog.current.requestFullscreen();setFullscreenFailed(false);}catch{setFullscreenFailed(true);}};
 const toggleFullscreen=()=>{if(document.fullscreenElement===dialog.current){if(engine.current.state.phase==='playing')pause(true);void document.exitFullscreen().catch(()=>{});}else void enterFullscreen();};
 const launch=()=>{if(!loaded||pausedRef.current)return;void audio.current?.unlock();if(engine.current.state.ball===0&&!fullscreenFailed)void enterFullscreen();if(engine.current.launch(launchPower)){dialog.current?.focus({preventScroll:true});refresh(v=>v+1);}};
 const nudge=()=>{if(!pausedRef.current&&engine.current.nudge())refresh(v=>v+1);};
 const actions=useRef({pause,settingsOpen,nudge});actions.current={pause,settingsOpen,nudge};
 useEffect(()=>{const node=dialog.current;const changed=()=>{const active=document.fullscreenElement===node;setNativeFullscreen(active);if(!active&&engine.current.state.phase==='playing')actions.current.pause(true);};document.addEventListener('fullscreenchange',changed);return()=>{document.removeEventListener('fullscreenchange',changed);if(document.fullscreenElement===node)void document.exitFullscreen().catch(()=>{});};},[]);
 useEffect(()=>{const area=boardArea.current;if(!area)return;const resize=()=>{const table=area.querySelector<HTMLElement>('.pinball-table');if(table)table.style.width=Math.max(0,Math.min(area.clientWidth,area.clientHeight*2/3))+'px';};const observer=new ResizeObserver(resize);observer.observe(area);resize();return()=>observer.disconnect();},[]);
 useEffect(()=>{dialog.current?.focus({preventScroll:true});const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{document.body.style.overflow=previousOverflow;};
 },[]);
 useEffect(()=>{let disposed=false;setLoaded(false);setAssetError(false);
  const load=(src:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
  void Promise.all([load(PINBALL_THEMES[choice.theme].asset),load('/assets/survivors/pinball/flipper-v1.png'),load('/assets/survivors/pinball/crane-cargo-v1.png'),load('/assets/survivors/pinball/site-atlas-v1.png'),load('/assets/survivors/pinball/environment-atlas-v1.png')]).then(([table,paddle,cargo,atlas,environment])=>{if(!disposed){art.current={table,paddle,cargo,atlas,environment};setLoaded(true);}}).catch(()=>{if(!disposed)setAssetError(true);});
  return()=>{disposed=true;};
 },[choice.theme]);
 useEffect(()=>{
  const down=(e:KeyboardEvent)=>{if(e.repeat)return;
   if(actions.current.settingsOpen)return;
   if(e.target instanceof HTMLElement&&e.target.closest('select,textarea,input:not([type="checkbox"])'))return;
   if(['KeyA','KeyD','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.current.add(e.code);}
   if(e.code==='KeyP'){e.preventDefault();actions.current.pause(!pausedRef.current);}
   if(e.code==='Space'&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();actions.current.nudge();}
  };
  const up=(e:KeyboardEvent)=>{keys.current.delete(e.code);};
  const blur=()=>{release();if(engine.current.state.phase==='playing')actions.current.pause(true);};
  const hidden=()=>{if(document.hidden)blur();};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',hidden);
  return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',hidden);};
 },[]);
 useEffect(()=>{if(!loaded)return;let frame=0,last=performance.now(),uiTime=0,lastDraw='';
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick=(now:number)=>{const dt=Math.min(.05,(now-last)/1000);last=now;
   if(!document.hidden&&!pausedRef.current){const k=keys.current,t=touches.current;engine.current.update(dt,{left:k.has('KeyA')||k.has('ArrowLeft')||t.left.size>0,right:k.has('KeyD')||k.has('ArrowRight')||t.right.size>0,assist:assistRef.current});}
   const s=engine.current.state;
   audio.current?.setActive(audioReady&&!muted.current&&!soundOffRef.current&&!pausedRef.current&&!document.hidden&&(s.phase==='playing'||s.phase==='between'));
   for(const event of engine.current.drainSounds())audio.current?.play(event.kind,event.x);
   if(s.phase!=='playing')release();
   const element=canvas.current,assets=art.current;
   if(element&&assets){const mode=getGraphicsMode(),rect=element.getBoundingClientRect(),dpr=Math.min(GRAPHICS_PROFILES[mode].pixelRatio,window.devicePixelRatio||1),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
    if(element.width!==w||element.height!==h){element.width=w;element.height=h;}
    const drawKey=`${s.elapsed}:${s.phase}:${w}:${h}:${mode}`;
    const ctx=element.getContext('2d');if(ctx&&w&&h&&drawKey!==lastDraw){ctx.setTransform(w/600,0,0,h/900,0,0);drawPinball(ctx,s,assets.table,assets.paddle,assets.cargo,reduced||mode==='smooth',assets.atlas,assets.environment);lastDraw=drawKey;}}
   uiTime+=dt;if(uiTime>.1){refresh(v=>v+1);uiTime=0;}
   if(s.phase==='finished'&&!paid.current&&saved===null)complete();
   frame=requestAnimationFrame(tick);
  };frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[loaded,saved,audioReady]);
 const s=engine.current.state;
 const role=characterId==='park'?'kang_taesik':characterId==='jung'||characterId==='yoon'?'player':characterId;
 const paddle=(side:'left'|'right')=><button type="button" className={`pinball-paddle-button ${side}`} aria-label={copy[side]} disabled={!loaded||s.phase!=='playing'||paused}
  onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);touches.current[side].add(e.pointerId);}}
  onPointerUp={e=>touches.current[side].delete(e.pointerId)} onPointerCancel={e=>touches.current[side].delete(e.pointerId)} onLostPointerCapture={e=>touches.current[side].delete(e.pointerId)}
  onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();keys.current.add(side==='left'?'KeyA':'KeyD');}}}
  onKeyUp={e=>{if(e.key===' '||e.key==='Enter')keys.current.delete(side==='left'?'KeyA':'KeyD');}} onBlur={()=>keys.current.delete(side==='left'?'KeyA':'KeyD')}>
   <span aria-hidden="true">{side==='left'?'↖':'↗'}</span><span>{copy[side]}<small>{side==='left'?'A / ←':'D / →'}</small></span>
 </button>;
 return <div className="survivors-modal-backdrop survivors-bonus-backdrop"><div ref={dialog} tabIndex={-1} className="survivors-modal-content survivors-bonus-stage" style={{backgroundImage:`linear-gradient(120deg,#071510ed,#10271fee),url("${PINBALL_THEMES[choice.theme].asset}")`}} role="dialog" aria-modal="true" aria-labelledby="bonus-title"
  onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(settingsOpen)setSettingsOpen(false);else if(s.phase==='ready'||saved)onClose();else if(s.phase!=='finished')pause(!pausedRef.current);}
   if(e.key==='Tab'){const controls=[...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),summary')].filter(el=>el.getClientRects().length>0),first=controls[0],last=controls.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===e.currentTarget)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===e.currentTarget)){e.preventDefault();first?.focus();}}}}>
  <header><div><span className="pinball-kicker">{recreationText.themes[choice.theme].name} · {mode==='practice'?copy.practiceBadge:copy.kicker}</span><h2 id="bonus-title">{copy.title}</h2><small className="pinball-mini-status">{s.ball}/3 {copy.ballShort} · {Math.ceil(s.remaining)}s · ×{s.combo} · {mode==='practice'?copy.noReward:`+${s.earned} PSI`}</small></div><div className="pinball-score"><small>{copy.score}</small><strong>{s.score.toLocaleString()}</strong><small>{copy.personalBest} {best.score.toLocaleString()}</small></div><button type="button" className="pinball-fullscreen-button" onClick={toggleFullscreen}>{nativeFullscreen?copy.exitFullscreen:copy.fullscreen}</button></header>
  <div className="pinball-layout"><section className="pinball-table-section">
   <div className={`pinball-live-strip ${s.rushTime>0?'rush':''}`}><span>{s.site&&s.site.id!=='factory'?(s.site.active>0?recreationText.themes[choice.theme].action+' '+Math.ceil(s.site.active)+'s':recreationText.siteGoal+' '+s.site.charge+'/'+s.site.layout.charge):s.callout?copy.callouts[s.callout]+(s.calloutPoints?' +'+s.calloutPoints.toLocaleString():''):s.rushTime>0?copy.rush:copy.skillshotTargets[s.skillTarget]}</span><small>{s.site&&s.site.id!=='factory'?((s.site.id==='zeroday'?recreationText.corePhases[s.site.phase]+' · ':'')+(s.site.reloadTime>0?recreationText.siteReload+' '+s.site.reloadTime.toFixed(1)+'s':recreationText.siteTarget+' '+s.site.hp.filter(hp=>hp>0).length)):s.rushTime>0?`${Math.ceil(s.rushTime)}s · ×2 · ${1+s.extraBalls.length} ${copy.balls}`:s.lit.map(v=>v?'●':'○').join(' ')}</small></div><div ref={boardArea} className="pinball-board-area"><div className="pinball-table"><canvas ref={canvas} aria-label={copy.table}
    onPointerDown={e=>{if(pausedRef.current||s.phase!=='playing')return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);const rect=e.currentTarget.getBoundingClientRect();touches.current[e.clientX<rect.x+rect.width/2?'left':'right'].add(e.pointerId);}}
    onPointerUp={e=>{touches.current.left.delete(e.pointerId);touches.current.right.delete(e.pointerId);}} onPointerCancel={release} onLostPointerCapture={e=>{touches.current.left.delete(e.pointerId);touches.current.right.delete(e.pointerId);}}/>{!loaded&&<p className="pinball-table-message" role={assetError?'alert':'status'}>{assetError?copy.assetError:copy.loading}</p>}
    {loaded&&(paused||s.phase==='between'||s.phase==='finished')&&<div className="pinball-state-strip" role="status"><strong>{paused?copy.paused:s.phase==='between'?copy.nextBall:copy.result}</strong><small>{s.phase==='between'?copy.keep:copy.tableRest}</small></div>}

   </div></div><div className="pinball-paddles">{paddle('left')}<button type="button" className="pinball-nudge" disabled={paused||s.phase!=='playing'||s.nudgesLeft===0||s.tiltTime>0} onClick={nudge}>{copy.nudge}<small>{s.nudgesLeft} / Space</small></button>{paddle('right')}</div>
  </section><aside className="pinball-console"><div className="pinball-console-main" hidden={settingsOpen}><div className="pinball-ball-counter"><span>{copy.chances}</span><strong>{s.ball}/3</strong><div aria-label={`${3-s.ball} ${copy.remaining}`} >{[1,2,3].map(n=><i key={n} className={n>s.ball?'available':n===s.ball&&s.phase==='playing'?'active':''}/>)}</div></div>
   <dl className="pinball-stats"><div><dt>{copy.time}</dt><dd>{Math.ceil(s.remaining)}s</dd></div><div><dt>{copy.combo}</dt><dd>×{s.combo}</dd></div><div><dt>{copy.reward}</dt><dd>{mode==='practice'?copy.noReward:`+${s.earned} PSI`}</dd></div><div><dt>{copy.best}</dt><dd>×{s.bestCombo}</dd></div></dl>
   {s.phase==='ready'&&<div className="pinball-mode-chooser"><button type="button" aria-pressed={mode==='bonus'} onClick={()=>reset('bonus')}>{copy.bonusMode}</button><button type="button" aria-pressed={mode==='practice'} onClick={()=>reset('practice')}>{copy.practiceMode}</button></div>}
   {(s.phase==='ready'||s.phase==='between')&&<label className="pinball-launch-power">{copy.launchPower} · {Math.round(launchPower*100)}%<input type="range" min="15" max="100" value={Math.round(launchPower*100)} onChange={e=>setLaunchPower(Number(e.target.value)/100)}/></label>}
   <p className="pinball-hint">{recreationText.themes[choice.theme].detail}<br/>{recreationText.manualShot}<br/>{recreationText.rules[choice.rule].detail}<br/>{mode==='practice'?copy.noReward:recreationText.bonusBudget.replace('{base}',String(engine.current.budget.base)).replace('{cap}',String(engine.current.budget.cap))}</p><details className="pinball-guide" onToggle={e=>{if(e.currentTarget.open&&engine.current.state.phase==='playing')pause(true);}}><summary>{copy.guide}</summary>{s.phase==='ready'&&<p className="pinball-brief"><strong>{CHARACTER_PROFILES[characterId].name}</strong> · {copy.roles[role]}<br/>{copy.brief}</p>}<p>{copy.controls}</p><p>{copy.protection}</p><p>{copy.rewardRule}</p></details>
   <div className="pinball-console-tools"><button type="button" className="pinball-settings-toggle pinball-customize-toggle" onClick={customize}>{recreationText.choose}</button>
   <button type="button" className="pinball-settings-toggle" aria-expanded={settingsOpen} onClick={toggleSettings}>{copy.audioSettings}</button></div>{audioError&&<p role="status">{copy.audioError}</p>}
   <div className="pinball-actions">
    {(s.phase==='ready'||s.phase==='between')&&<button type="button" disabled={!loaded||paused} className="survivors-btn-primary" onClick={launch}>{s.phase==='ready'?copy.start:copy.launchNext}</button>}
    {(s.phase==='playing'||paused)&&s.phase!=='finished'&&<button type="button" className="survivors-btn-secondary" onClick={()=>pause(!paused)}>{paused?copy.resume:copy.pause}</button>}
    {s.phase==='ready'?<button type="button" className="survivors-btn-secondary" onClick={onClose}>{copy.close}</button>:s.phase!=='finished'?<button type="button" className="survivors-btn-secondary" onClick={settle}>{mode==='practice'?copy.endPractice:copy.finish}</button>:<>
     <p role={saved?'status':'alert'}>{saved?(mode==='practice'?copy.practiceSaved:copy.saved):saved===false?copy.failed:copy.saving}</p>{!saved&&<button type="button" className="survivors-btn-primary" onClick={settle}>{copy.retry}</button>}{saved&&<><button type="button" className="survivors-btn-primary" onClick={()=>reset('practice')}>{copy.practiceAgain}</button><button type="button" className="survivors-btn-secondary" onClick={onClose}>{copy.close}</button></>}
    </>}
   </div></div>
   {settingsOpen&&<section className={`pinball-settings-panel ${settingsTab==='table'?'pinball-customization-panel':''}`} aria-label={copy.audioSettings}><strong>{settingsTab==='table'?recreationText.settings:copy.audioSettings}</strong><p>{copy.settingsPause}</p>{settingsTab==='table'?<><SurvivorsPinballCustomization choice={choice} clears={clears} completedStages={completedStages} disabled={s.phase!=='ready'} onChange={changeChoice}/>{choiceFailed&&<p role="alert">{recreationText.choiceFailed}</p>}</>:<><label className="pinball-assist"><input type="checkbox" checked={soundOff} onChange={e=>{void audio.current?.unlock();setSoundOff(e.target.checked);}}/>{copy.soundOff}</label>
    <label className="pinball-assist"><input type="checkbox" checked={assist} onChange={e=>{setAssist(e.target.checked);assistRef.current=e.target.checked;}}/>{copy.assist}</label>
    <p>{copy.manualHint}</p>{fullscreenFailed&&<p>{copy.fullscreenFallback}</p>}
    <details className="pinball-settings-guide"><summary>{copy.guide}</summary><p>{copy.controls}</p><p>{recreationText.rules[choice.rule].detail}</p><p>{copy.rewardRule}</p></details>
    <label className="pinball-music">{copy.music}<select value={music} onChange={e=>{const value=e.target.value as PinballMusic;setMusic(value);void audio.current?.unlock();audio.current?.setMusic(value);}}><option value="shift">{copy.musicShift}</option><option value="theme">{copy.musicTheme}</option></select></label>
    </>}<button type="button" className="survivors-btn-secondary" onClick={()=>setSettingsOpen(false)}>{copy.closeSettings}</button></section>}
  </aside></div>
 </div></div>;
}
