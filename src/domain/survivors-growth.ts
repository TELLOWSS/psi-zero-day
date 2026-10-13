import {PATROL_STAGE_IDS,type CharacterId,type PatrolStageId,type SurvivorsGameState} from './patrol-survivors';
export interface PatrolClearRecord {characterId:CharacterId;stageId:PatrolStageId;stars:[boolean,boolean,boolean]}
const characters:readonly CharacterId[]=['player','kang_taesik','yoon_sungho','lee_jaehoon','lim_junho','safety_monitor','yoon','park','jung'];

export function validGrowthRecords(value:unknown):PatrolClearRecord[] {
  if(!Array.isArray(value))return [];
  const result:PatrolClearRecord[]=[];
  for(const row of value.slice(0,1000)){
    if(!row||typeof row!=='object'||!characters.includes(row.characterId)||!PATROL_STAGE_IDS.includes(row.stageId)||!Array.isArray(row.stars)||row.stars[0]!==true)continue;
    const index=result.findIndex(r=>r.characterId===row.characterId&&r.stageId===row.stageId);
    const stars:[boolean,boolean,boolean]=[true,row.stars[1]===true,row.stars[2]===true];
    if(index<0)result.push({characterId:row.characterId,stageId:row.stageId,stars});
    else result[index]={...result[index]!,stars:stars.map((s,i)=>s||result[index]!.stars[i]) as [boolean,boolean,boolean]};
  }
  return result;
}

/** Only actual victories are attributed; legacy global saves cannot identify the actor. */
export function recordPatrolClear(records:readonly PatrolClearRecord[],state:Pick<SurvivorsGameState,'phase'|'characterId'|'stageId'|'starsEarned'>):PatrolClearRecord[] {
  if(state.phase!=='victory')return [...records];
  return validGrowthRecords([...records,{characterId:state.characterId,stageId:state.stageId,stars:[true,...state.starsEarned.slice(1,3)]}]);
}

export function characterGrowth(records:readonly PatrolClearRecord[],id:CharacterId) {
  const own=validGrowthRecords(records).filter(row=>row.characterId===id);
  const chapters=Array.from({length:5},(_,chapter)=>own.filter(r=>Math.floor(PATROL_STAGE_IDS.indexOf(r.stageId)/10)===chapter).length);
  const highest=own.reduce((n,r)=>Math.max(n,PATROL_STAGE_IDS.indexOf(r.stageId)+1),0);
  return {clears:own.length,controls:own.filter(r=>r.stars[1]).length,highest,chapters,
    storyTier:Math.min(4,Math.floor(own.length/10)),next:own.length>=50?0:10-own.length%10};
}
