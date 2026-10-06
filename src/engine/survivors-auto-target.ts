import type {Hazard} from '../domain/patrol-survivors';
import {gangformTarget} from './survivors-boss-gangform';

/** An exposed boss opportunity outranks distance, but never extends weapon range. */
export function selectSurvivorsAutoTarget(hazards:readonly Hazard[],x:number,y:number,range:number):Hazard|null {
 let nearest:Hazard|null=null,bestDistance=range*range,bestPriority=-1;
 for(const h of hazards){
  if(h.hp<=0||h.motion?.phase==='spent'&&!h.isStageBoss)continue;
  const phase=h.bossGameplay?.combatPhase;
  if(h.isStageBoss&&phase&&phase!=='weak_point'&&phase!=='burst')continue;
  const target=gangformTarget(h,x,y),distance=(target.x-x)**2+(target.y-y)**2;
  if(distance>=range*range)continue;
  const priority=h.isStageBoss&&phase==='weak_point'?2:h.isStageBoss&&phase==='burst'?1:0;
  if(priority>bestPriority||priority===bestPriority&&distance<bestDistance){nearest=target;bestDistance=distance;bestPriority=priority;}
 }
 return nearest;
}
