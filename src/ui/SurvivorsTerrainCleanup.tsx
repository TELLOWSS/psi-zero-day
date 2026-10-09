import {useRef} from 'react';
import copy from '../../content/localization/survivors-terrain-ko.json';
import './survivors-terrain-cleanup.css';
type CleanupStatus={remaining:number;cooldown:number;ready:boolean};
export function SurvivorsTerrainCleanup({status,onClear}:{status:CleanupStatus|null;onClear:()=>void}) {
 const lastTouch=useRef(0);
 if(!status)return null;
 return <button type="button" className="survivors-terrain-cleanup" aria-label={`${copy.cleanup} · ${status.remaining}${copy.cleanupRemaining}`} disabled={!status.ready} onPointerDown={event=>{if(event.pointerType==='touch'){event.preventDefault();event.stopPropagation();lastTouch.current=Date.now();onClear();}}} onClick={()=>{if(Date.now()-lastTouch.current>500)onClear();}}>
  <strong>{copy.cleanupButton}</strong><span>{status.remaining}{copy.cleanupRemaining}</span>
  <small>{status.cooldown>0?copy.cleanupWait:copy.cleanupReady}</small>
  <progress aria-label={copy.cleanupWait} max={.6} value={Math.max(0,.6-status.cooldown)}/>
 </button>;
}
