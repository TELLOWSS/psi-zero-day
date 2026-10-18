import {PATROL_STAGE_IDS,type PatrolStageId} from './patrol-survivors';
import {PATROL_DIFFICULTIES,type PatrolDifficulty} from './survivors-challenge';

/** Best earned stars for each stage/selected difficulty. This never unlocks
 * gameplay, changes power, or reissues a first-clear wallet bonus. */
export type DifficultyClearRecords = Partial<Record<PatrolStageId,Partial<Record<PatrolDifficulty,number>>>>;
const DIFFICULTIES=Object.keys(PATROL_DIFFICULTIES) as PatrolDifficulty[];

export function sanitizeDifficultyClearRecords(value:unknown):DifficultyClearRecords {
  if(!value || typeof value!=='object' || Array.isArray(value))return {};
  const raw=value as Record<string,unknown>,records:DifficultyClearRecords={};
  for(const stageId of PATROL_STAGE_IDS){
    const stage=raw[stageId];
    if(!stage || typeof stage!=='object' || Array.isArray(stage))continue;
    const medals:Partial<Record<PatrolDifficulty,number>>={};
    for(const difficulty of DIFFICULTIES){
      const stars=(stage as Record<string,unknown>)[difficulty];
      if(typeof stars==='number'&&Number.isInteger(stars)&&stars>=1&&stars<=3)medals[difficulty]=stars;
    }
    if(Object.keys(medals).length)records[stageId]=medals;
  }
  return records;
}

export function awardDifficultyClear(
  records:DifficultyClearRecords,
  stageId:PatrolStageId,
  difficulty:PatrolDifficulty,
  stars:number,
):DifficultyClearRecords {
  const valid=sanitizeDifficultyClearRecords(records);
  if(!PATROL_STAGE_IDS.includes(stageId)||!DIFFICULTIES.includes(difficulty))return valid;
  const nextStars=Math.min(3,Math.max(0,Number.isFinite(stars)?Math.floor(stars):0));
  if(nextStars===0)return valid;
  const stage={...(valid[stageId]??{})};
  stage[difficulty]=Math.max(stage[difficulty]??0,nextStars);
  return {...valid,[stageId]:stage};
}

export function mergeDifficultyClearRecords(a:unknown,b:unknown):DifficultyClearRecords {
  let result=sanitizeDifficultyClearRecords(a);
  for(const [stage,data] of Object.entries(sanitizeDifficultyClearRecords(b))){
    for(const [difficulty,stars] of Object.entries(data??{})){
      result=awardDifficultyClear(result,stage as PatrolStageId,difficulty as PatrolDifficulty,stars);
    }
  }
  return result;
}
