import {useEffect,useState} from 'react';
import type {CharacterId} from '../domain/patrol-survivors';
import {CHARACTER_MAP_ART} from './survivors-character-art';
import {loadDirectionalActor} from './survivors-directional-art';
import {loadAuthoredCommand} from './survivors-authored-command';
import {registerSpriteBounds} from './survivors-sprite-motion';

/** Prepare only the selected actor, and ignore a selection replaced while loading. */
export function usePreparedSurvivorsActor(selected:CharacterId,maps:Partial<Record<CharacterId,HTMLImageElement>>):CharacterId|null {
 const [prepared,setPrepared]=useState<CharacterId|null>(null);
 useEffect(()=>{
  if(maps[selected]){setPrepared(selected);return;}
  setPrepared(null);let cancelled=false;const actor=new Image();
  actor.onload=()=>{void (async()=>{
   if(cancelled)return;
   const directional=await loadDirectionalActor(actor);
   if(cancelled)return;
   if(!directional){registerSpriteBounds(actor);await loadAuthoredCommand(actor);}
   if(!cancelled){maps[selected]=actor;setPrepared(selected);}
  })();};
  actor.src=CHARACTER_MAP_ART[selected];
  return ()=>{cancelled=true;};
 },[selected,maps]);
 return prepared;
}
