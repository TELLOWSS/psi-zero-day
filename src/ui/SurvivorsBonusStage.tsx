import {useEffect,useRef,useState} from 'react';
import {SurvivorsPinballEngine} from '../engine/survivors-pinball-engine';
import {drawPinball} from './survivors-pinball-renderer';
import {getGraphicsMode,GRAPHICS_PROFILES} from './survivors-graphics-settings';
import type {CharacterId} from '../domain/patrol-survivors';
import {CHARACTER_PROFILES} from '../engine/patrol-survivors-engine';
import {readPinballBest,savePinballBest} from '../app/survivors-pinball-record';
import {PinballAudio,type PinballMusic} from './survivors-pinball-audio';
import copy from '../../content/localization/survivors-bonus-ko.json';
import './survivors-bonus-stage.css';

export function SurvivorsBonusStage({onReward,onClose,audioMuted=false,characterId='player'}:{onReward:(earned:number)=>boolean;onClose:()=>void;audioMuted?:boolean;characterId?:CharacterId}) {
 const engine=useRef(new SurvivorsPinballEngine()),canvas=useRef<HTMLCanvasElement>(null),dialog=useRef<HTMLDivElement>(null);
 const keys=useRef(new Set<string>()),touches=useRef({left:new Set<number>(),right:new Set<number>()});
 const art=useRef<{table:HTMLImageElement;paddle:HTMLImageElement;cargo:HTMLImageElement}|null>(null),paid=useRef(false),reward=useRef(onReward);reward.current=onReward;
 const [loaded,setLoaded]=useState(false),[assetError,setAssetError]=useState(false),[paused,setPaused]=useState(false),[assist,setAssist]=useState(true),[saved,setSaved]=useState<boolean|null>(null),[,refresh]=useState(0);
 const [best,setBest]=useState(readPinballBest);
 const pausedRef=useRef(false),assistRef=useRef(true),muted=useRef(audioMuted);muted.current=audioMuted;
 const audio=useRef<PinballAudio|null>(null);
 const [soundOff,setSoundOff]=useState(false),[audioReady,setAudioReady]=useState(false),[audioError,setAudioError]=useState(false),[music,setMusic]=useState<PinballMusic>('shift');
 const soundOffRef=useRef(false);soundOffRef.current=soundOff;
 useEffect(()=>{let disposed=false;const player=new PinballAudio();audio.current=player;void player.load().then(()=>{if(!disposed)setAudioReady(true);}).catch(()=>{if(!disposed)setAudioError(true);});return()=>{disposed=true;player.dispose();audio.current=null;};},[]);
 useEffect(()=>{if(audioMuted||soundOff)audio.current?.setActive(false);},[audioMuted,soundOff]);
 const release=()=>{keys.current.clear();touches.current.left.clear();touches.current.right.clear();};
 const pause=(value:boolean)=>{pausedRef.current=value;setPaused(value);if(value)audio.current?.setActive(false);else void audio.current?.unlock();release();};
 const settle=()=>{if(paid.current)return;pause(false);const earned=engine.current.finish();const ok=reward.current(earned);paid.current=ok;if(ok)setBest(savePinballBest({score:engine.current.state.score,combo:engine.current.state.bestCombo}));setSaved(ok);refresh(v=>v+1);};
 const launch=()=>{if(!loaded||pausedRef.current)return;void audio.current?.unlock();if(engine.current.launch()){refresh(v=>v+1);}};
 const actions=useRef({pause});actions.current={pause};
 useEffect(()=>{dialog.current?.focus();let disposed=false;
  const load=(src:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
  void Promise.all([load('/assets/survivors/pinball/factory-playfield-v2.png'),load('/assets/survivors/pinball/flipper-v1.png'),load('/assets/survivors/pinball/crane-cargo-v1.png')]).then(([table,paddle,cargo])=>{if(!disposed){art.current={table,paddle,cargo};setLoaded(true);}}).catch(()=>{if(!disposed)setAssetError(true);});
  return()=>{disposed=true;};
 },[]);
 useEffect(()=>{
  const down=(e:KeyboardEvent)=>{if(e.repeat)return;
   if(['KeyA','KeyD','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.current.add(e.code);}
   if(e.code==='KeyP'){e.preventDefault();actions.current.pause(!pausedRef.current);}
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
    const ctx=element.getContext('2d');if(ctx&&w&&h&&drawKey!==lastDraw){ctx.setTransform(w/600,0,0,h/900,0,0);drawPinball(ctx,s,assets.table,assets.paddle,assets.cargo,reduced||mode==='smooth');lastDraw=drawKey;}}
   uiTime+=dt;if(uiTime>.1){refresh(v=>v+1);uiTime=0;}
   if(s.phase==='finished'&&!paid.current&&saved===null){const ok=reward.current(s.earned);paid.current=ok;if(ok)setBest(savePinballBest({score:s.score,combo:s.bestCombo}));setSaved(ok);}
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
 return <div className="survivors-modal-backdrop survivors-bonus-backdrop"><div ref={dialog} tabIndex={-1} className="survivors-modal-content survivors-bonus-stage" role="dialog" aria-modal="true" aria-labelledby="bonus-title"
  onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(s.phase==='ready'||saved)onClose();else if(s.phase!=='finished')pause(!pausedRef.current);}
   if(e.key==='Tab'){const controls=[...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)')],first=controls[0],last=controls.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===e.currentTarget)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===e.currentTarget)){e.preventDefault();first?.focus();}}}}>
  <header><div><span className="pinball-kicker">{copy.kicker}</span><h2 id="bonus-title">{copy.title}</h2><small className="pinball-mini-status">{s.ball}/3 {copy.ballShort} · {Math.ceil(s.remaining)}s</small></div><div className="pinball-score"><small>{copy.score}</small><strong>{s.score.toLocaleString()}</strong><small>{copy.personalBest} {best.score.toLocaleString()}</small></div></header>
  <div className="pinball-layout"><section className="pinball-table-section">
   <div className="pinball-table"><canvas ref={canvas} aria-label={copy.table}/>{!loaded&&<p className="pinball-table-message" role={assetError?'alert':'status'}>{assetError?copy.assetError:copy.loading}</p>}
    {loaded&&(paused||s.phase==='between'||s.phase==='finished')&&<div className="pinball-table-message"><strong>{paused?copy.paused:s.phase==='between'?copy.nextBall:copy.result}</strong><small>{s.phase==='between'?copy.keep:copy.tableRest}</small></div>}
   </div><div className="pinball-paddles">{paddle('left')}{paddle('right')}</div>
  </section><aside className="pinball-console"><div className="pinball-ball-counter"><span>{copy.chances}</span><strong>{s.ball}/3</strong><div aria-label={`${3-s.ball} ${copy.remaining}`} >{[1,2,3].map(n=><i key={n} className={n>s.ball?'available':n===s.ball&&s.phase==='playing'?'active':''}/>)}</div></div>
   <dl className="pinball-stats"><div><dt>{copy.time}</dt><dd>{Math.ceil(s.remaining)}s</dd></div><div><dt>{copy.combo}</dt><dd>×{s.combo}</dd></div><div><dt>{copy.reward}</dt><dd>+{s.earned} PSI</dd></div><div><dt>{copy.best}</dt><dd>×{s.bestCombo}</dd></div></dl>
   {s.phase==='ready'&&<p className="pinball-brief"><strong>{CHARACTER_PROFILES[characterId].name}</strong> · {copy.roles[role]}<br/>{copy.brief}</p>}
   <p className="pinball-hint">{copy.goal}</p><details className="pinball-guide"><summary>{copy.guide}</summary><p>{copy.controls}</p><p>{copy.protection}</p><p>{copy.rewardRule}</p></details>
   <label className="pinball-assist"><input type="checkbox" checked={assist} onChange={e=>{setAssist(e.target.checked);assistRef.current=e.target.checked;}}/>{copy.assist}</label>
   <details className="pinball-audio-settings"><summary>{copy.audioSettings}</summary><label className="pinball-assist"><input type="checkbox" checked={soundOff} onChange={e=>{void audio.current?.unlock();setSoundOff(e.target.checked);}}/>{copy.soundOff}</label>
   <label className="pinball-music">{copy.music}<select value={music} onChange={e=>{const value=e.target.value as PinballMusic;setMusic(value);void audio.current?.unlock();audio.current?.setMusic(value);}}><option value="shift">{copy.musicShift}</option><option value="theme">{copy.musicTheme}</option></select></label>
   </details>{audioError&&<p role="status">{copy.audioError}</p>}
   <div className="pinball-actions">
    {(s.phase==='ready'||s.phase==='between')&&<button type="button" disabled={!loaded||paused} className="survivors-btn-primary" onClick={launch}>{s.phase==='ready'?copy.start:copy.launchNext}</button>}
    {(s.phase==='playing'||paused)&&s.phase!=='finished'&&<button type="button" className="survivors-btn-secondary" onClick={()=>pause(!paused)}>{paused?copy.resume:copy.pause}</button>}
    {s.phase==='ready'?<button type="button" className="survivors-btn-secondary" onClick={onClose}>{copy.close}</button>:s.phase!=='finished'?<button type="button" className="survivors-btn-secondary" onClick={settle}>{copy.finish}</button>:<>
     <p role={saved?'status':'alert'}>{saved?copy.saved:saved===false?copy.failed:copy.saving}</p>{!saved&&<button type="button" className="survivors-btn-primary" onClick={settle}>{copy.retry}</button>}{saved&&<button type="button" className="survivors-btn-primary" onClick={onClose}>{copy.close}</button>}
    </>}
   </div>
  </aside></div>
 </div></div>;
}
