import {PATROL_STAGE_IDS,type PatrolStageId} from './patrol-survivors';
import {sanitizeDifficultyClearRecords} from './survivors-difficulty-records';

/** Verified in-browser records, never independently secure against client save modification. */
export interface OmegaOperatorEligibility {
 readonly earned:boolean;
 readonly clears:number;
 readonly mastered:number;
 readonly total:number;
 readonly remainingClears:number;
 readonly remainingMastered:number;
}

/**
 * A premium character cannot be claimed by merely clearing Stage 50 once
 * or entering Master mode. All 50 stages must have a normal clear record
 * AND a separately earned three-star Master difficulty result.
 * No writes, wallet grants, or unlock shortcuts occur in this projection.
 */
export function omegaOperatorEligibility(
 completedStages:readonly PatrolStageId[],
 difficultyClearRecords:unknown,
):OmegaOperatorEligibility {
 const completed=new Set(completedStages);
 const records=sanitizeDifficultyClearRecords(difficultyClearRecords);
 const total=PATROL_STAGE_IDS.length;
 const clears=PATROL_STAGE_IDS.filter(id=>completed.has(id)).length;
 const mastered=PATROL_STAGE_IDS.filter(id=>records[id]?.mastery===3).length;
 return Object.freeze({
  earned:clears===total&&mastered===total,
  clears,mastered,total,
  remainingClears:total-clears,
  remainingMastered:total-mastered,
 });
}
