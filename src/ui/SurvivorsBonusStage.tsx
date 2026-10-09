import {useEffect,useRef,useState} from 'react';
import {SurvivorsBonusEngine} from '../engine/survivors-bonus-engine';
import copy from '../../content/localization/survivors-bonus-ko.json';
import './survivors-bonus-stage.css';
export function SurvivorsBonusStage({onReward,onClose}:{onReward:(earned:number)=>boolean;onClose:()=>void}) {
 const engine=useRef(new SurvivorsBonusEngine());const input=useRef({x:0,y:0});const keys=useRef(new Set<string>());const pointer=useRef<{id:number;x:number;y:number}|null>(null);
 const [started,setStarted]=useState(false),[,refresh]=useState(0),[saved,setSaved]=useState<boolean|null>(null);const reward=useRef(onReward);reward.current=onReward;
 const paid=useRef(false);const dialog=useRef<HTMLDivElement>(null);
 const settle=()=>{if(paid.current)return;const ok=reward.current(engine.current.finish());paid.current=ok;setSaved(ok);refresh(v=>v+1);};
 useEffect(()=>{dialog.current?.focus();},[]);
 useEffect(()=>{
  const down=(e:KeyboardEvent)=>{if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.current.add(e.code);}};
  const up=(e:KeyboardEvent)=>keys.current.delete(e.code);const reset=()=>{keys.current.clear();input.current={x:0,y:0};pointer.current=null;};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',reset);
  return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',reset);};
 },[]);
 useEffect(()=>{
  if(!started)return;let frame=0,last=performance.now(),uiTime=0;
  const tick=(now:number)=>{const dt=Math.min(.05,(now-last)/1000);last=now;
   // Hidden tabs pause the bonus clock, so returning never loses unobserved time.
   if(!document.hidden){const k=keys.current;engine.current.update(dt,{x:input.current.x+(k.has('KeyD')||k.has('ArrowRight')?1:0)-(k.has('KeyA')||k.has('ArrowLeft')?1:0),y:input.current.y+(k.has('KeyS')||k.has('ArrowDown')?1:0)-(k.has('KeyW')||k.has('ArrowUp')?1:0)});}
   uiTime+=dt;if(uiTime>.03||engine.current.state.finished){refresh(v=>v+1);uiTime=0;}
   if(engine.current.state.finished){if(!paid.current){const ok=reward.current(engine.current.state.earned);paid.current=ok;setSaved(ok);}return;}frame=requestAnimationFrame(tick);
  };frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[started]);
 const s=engine.current.state;const resetPointer=()=>{input.current={x:0,y:0};pointer.current=null;};
 return <div className="survivors-modal-backdrop survivors-bonus-backdrop"><div ref={dialog} tabIndex={-1} className="survivors-modal-content survivors-bonus-stage" role="dialog" aria-modal="true" aria-labelledby="bonus-title" onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(!started||saved)onClose();else if(!s.finished)settle();}if(event.key==='Tab'){const buttons=[...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];const first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&(document.activeElement===first||document.activeElement===event.currentTarget)){event.preventDefault();last?.focus();}else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===event.currentTarget)){event.preventDefault();first?.focus();}}}}>
  <header><h2 id="bonus-title">{s.finished?copy.result:copy.title}</h2><strong>+{s.earned} PSI</strong></header>
  {!started&&<><p>{copy.brief}</p><p>{copy.controls}</p><button type="button" className="survivors-btn-primary" onClick={()=>setStarted(true)}>{copy.start}</button><button type="button" className="survivors-btn-secondary" onClick={onClose}>{copy.close}</button></>}
  {started&&!s.finished&&<><div className="survivors-bonus-hud"><span>{Math.ceil(s.remaining)} {copy.seconds}</span><span>{copy.collected} {s.pickups.filter(p=>p.collected).length}/6</span></div>
   <div className="survivors-bonus-field" aria-label={copy.controls} onPointerDown={e=>{if(pointer.current)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);pointer.current={id:e.pointerId,x:e.clientX,y:e.clientY};}} onPointerMove={e=>{const p=pointer.current;if(!p||p.id!==e.pointerId)return;const x=(e.clientX-p.x)/35,y=(e.clientY-p.y)/35,len=Math.max(1,Math.hypot(x,y));input.current={x:x/len,y:y/len};}} onPointerUp={e=>{if(e.pointerId===pointer.current?.id)resetPointer();}} onPointerCancel={e=>{if(e.pointerId===pointer.current?.id)resetPointer();}} onLostPointerCapture={e=>{if(e.pointerId===pointer.current?.id)resetPointer();}}>
    {s.pickups.filter(p=>!p.collected).map(p=><div key={p.id} className="survivors-bonus-box" style={{left:`${p.x*100}%`,top:`${p.y*100}%`}} role="img" aria-label={copy.box}/>)}
    <img className="survivors-bonus-player" src="/assets/episode01/characters/player-portrait.webp" alt={copy.player} draggable={false} style={{left:`${s.x*100}%`,top:`${s.y*100}%`}}/>
   </div><small>{copy.controls}</small><button type="button" className="survivors-btn-secondary" onClick={settle}>{copy.finish}</button></>}
  {s.finished&&<><p role={saved?'status':'alert'}>{saved?copy.saved:copy.failed}</p>{!saved&&<button type="button" className="survivors-btn-primary" onClick={settle}>{copy.retry}</button>}{saved&&<><button type="button" className="survivors-btn-primary" onClick={()=>{engine.current=new SurvivorsBonusEngine();paid.current=false;setSaved(null);setStarted(false);keys.current.clear();resetPointer();}}>{copy.again}</button><button type="button" className="survivors-btn-secondary" onClick={onClose}>{copy.close}</button></>}</>}
 </div></div>;
}
